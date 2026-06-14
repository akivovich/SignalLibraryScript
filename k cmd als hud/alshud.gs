/*
	<a href="live://hud" tooltip="ALS/Repetiter"><img src="k_y2-dnc.tga" mouseover="k_y-dnc.tga" width=18 height=18></a>
*/
include "ScenarioBehavior.gs"
include "World.gs"
//include "World1.gs"
include "Browser.gs"
//include "common.gs"
include "ZmvSignalInterface.gs"
include "ZmvConsts.gs"

class SignalInfo
{
	public Signal signal = null;
	public string name="";
	public string img="";
	public float  distance=-1.0;
	public int    stateEx=0;
	public float  distanceToVeh = -1.0;
	public bool   autoBlock = true;
	public int    alsCode = -1,
				  alsCodeNext = -1;
	public bool   invisible = false;

	public void Clear()
	{
		signal = null;
		name = "";
		img = "";
		distance = -1;
		stateEx = -1;
		distanceToVeh = -1.0;
		autoBlock = true;
		alsCode = alsCodeNext = -1;
		invisible = false;
   	}
};


class AlsHud isclass ScenarioBehavior
{		
	define int ALS_0  = 0;
	define int ALS_OC = 1;
	define int ALS_AO = 2;
	define int ALS_40 = 4;
	define int ALS_60 = 6;
	define int ALS_70 = 7;
	define int ALS_80 = 8;

	bool m_flashImg = false;
	bool m_mo = true;
	bool m_threadRunning  = false; // hide/show state of m_Browser
	bool m_bHidden = true;
	Browser     m_Browser;
	Train       m_CurrentTrain;
	SignalInfo  m_signalInfo = new SignalInfo();
	
	bool m_LeftDoorsOpened = false,
		 m_RightDoorsOpened = false;

	void Print(string s) 
	{
		Interface.Print("HUD:"+s);
	}
	//========================================================================================================================================
	// Doors
	//========================================================================================================================================
	void InitDoorsState()
	{
		if (!m_CurrentTrain) return;

		Vehicle loco = m_CurrentTrain.GetFrontmostLocomotive();
		string leftDoorsMeshName, rightDoorsMeshName;
		if (loco.HasMesh("left-door"))
		{
			leftDoorsMeshName = "left-door";
			rightDoorsMeshName = "right-door";
		}
		else
		{
			leftDoorsMeshName = "left-passenger-door";
			rightDoorsMeshName = "right-passenger-door";
		}

		m_LeftDoorsOpened  = (loco.GetMeshAnimationFrame(leftDoorsMeshName) > 10);
		m_RightDoorsOpened = (loco.GetMeshAnimationFrame(rightDoorsMeshName) > 10);
	}

	string GetDoorContent(bool right)
	{
		string href, tooltip, src, over;
		if (right and !m_RightDoorsOpened)
		{
			href = "live://doors-right";
			tooltip = "Двери справа открыть";
			src = "k_y2-dnc.tga";
			over = "k_y-dnc.tga";
		}
		else if (!right and !m_LeftDoorsOpened)
		{
			href = "live://doors-left";
			tooltip = "Двери слева открыть";
			src = "k_y2-dnc.tga";
			over = "k_y-dnc.tga";
		}
		else 
		{
			href = "live://doors-close";
			tooltip = "Двери закрыть";
			src = "k_y-dnc.tga";
			over = "k_y2-dnc.tga";
		}
		return "<td><a href='" + href + "'tooltip='" + tooltip + "'><img src='" + src + "' mouseover='"+ over +"' width=18 height=18></a></td>";
	}

	string GetDoorsContent()
	{
		if (!m_CurrentTrain) return "<td></td><td></td>";
		return GetDoorContent(false) + GetDoorContent(true);
	}

	//========================================================================================================================================
	// ARS-ALS panel
	//========================================================================================================================================
	void VehicleDoorsOperate(Vehicle v, bool open, bool right)
	{
		bool hasDoorsTech = v.HasMesh("left-door");
		if (!open)
		{
			if (hasDoorsTech)
			{
				v.SetDoorAnimationState("left-door",false);
				v.SetDoorAnimationState("right-door",false);
			}
			else
			{
				v.SetDoorAnimationState("left-passenger-door", false);
				v.SetDoorAnimationState("right-passenger-door", false);
			}
		}
		else
		{
			bool facing = v.GetDirectionRelativeToTrain();
			if (!right)
			{
				if (hasDoorsTech)
				{
					if (facing) 
						v.SetDoorAnimationState("left-door",true);
					else 
						v.SetDoorAnimationState("right-door",true);
				}			
				else
				{
					if (facing) 
						v.SetDoorAnimationState("left-passenger-door",true);
					else 
						v.SetDoorAnimationState("right-passenger-door",true);
				}
			}
			else
			{
				if (hasDoorsTech)
				{
					if (facing) 
						v.SetDoorAnimationState("right-door",true);
					else
						v.SetDoorAnimationState("left-door",true);
				}			
				else
				{
					if (facing) 
						v.SetDoorAnimationState("right-passenger-door",true);
					else
						v.SetDoorAnimationState("left-passenger-door",true);
				}
			}
		}
	}
		
	//For Scenarios
	void PostBroarcastTrainMessage(string minor) 
	{
		m_CurrentTrain.PostMessage(null, "Cab", minor, 0.3);
	}

	void TrainDoorsOperate(bool open, bool right)
	{
		if (!m_CurrentTrain) return;
		Vehicle[] vehicles = m_CurrentTrain.GetVehicles();
		int i, len = vehicles.size();
		for (i = 0; i < len; i++) 
		{
			VehicleDoorsOperate(vehicles[i], open, right);
		}
		if (open) 
		{
			if (right) PostBroarcastTrainMessage("OpenDoorsRight");
			else	   PostBroarcastTrainMessage("OpenDoorsLeft");
		}
		else
		{
			PostBroarcastTrainMessage("CloseDoors");
		}
	}

	string ArsCodeCell(string label, bool active, int width, string activeBg, string inactiveBg)
	{
		string bg, fc;
		if (active) { bg = activeBg;   fc = "#000000"; }
		else        { bg = inactiveBg; fc = "#444444"; }
		return "<td width="+ width +" bgcolor='" + bg + "' align=center><font color='" + fc + "'><b>" + label + "</b></font></td>";
	}

	void SetArsPanelValues()
	{		
		int alsCode = m_signalInfo.alsCode,
			alsCodeNext = m_signalInfo.alsCodeNext;
		if (alsCode < 0) alsCode = alsCodeNext;
		if (alsCode < 0) alsCode = ALS_OC;
		bool als_0 = alsCode == ALS_0 or alsCode == ALS_AO,
			 alsNext_0 = alsCodeNext == ALS_0 or alsCodeNext == ALS_AO,
			 useDop = !m_signalInfo.autoBlock and alsCode != ALS_OC and alsCodeNext != ALS_OC and alsCodeNext < alsCode,
			 arsOCH = alsCode == ALS_OC,
			 ars0   = als_0 or (useDop and alsNext_0),
			 ars40  = alsCode == ALS_40 or (useDop and alsCodeNext == ALS_40),
			 ars60  = alsCode == ALS_60 or (useDop and alsCodeNext == ALS_60),
			 ars70  = alsCode == ALS_70 or (useDop and alsCodeNext == ALS_70),
			 ars80  = alsCode == ALS_80;

//Print("SetArsPanelValues:alsCode="+alsCode+",alsCodeNext="+alsCodeNext+",alsNull="+alsNull+",alsNextNull="+alsNextNull+",m_signalInfo.autoBlock="+m_signalInfo.autoBlock);

		m_Browser.SetParam(4, ArsCodeCell("ОЧ",  arsOCH, 16, "#ff8800", "#331100"));
		m_Browser.SetParam(5, ArsCodeCell("  0", ars0,   18, "#cc0000", "#330000"));
		m_Browser.SetParam(6, ArsCodeCell(" 40", ars40,  18, "#cccc00", "#333300"));
		m_Browser.SetParam(7, ArsCodeCell(" 60", ars60,  18, "#00cc00", "#003300"));
		m_Browser.SetParam(8, ArsCodeCell(" 70", ars70,  18, "#00cc00", "#003300"));
		m_Browser.SetParam(9, ArsCodeCell(" 80", ars80,  18, "#00cc00", "#003300"));
	}

	//======================================================================================================================================== 
	string GetImg()
	{
		m_flashImg= !m_flashImg;
		string s = "";
  		if (m_signalInfo.stateEx >= 0)
		{
  			switch (m_signalInfo.stateEx)
			{
				case ZmvSignalExTypes.R: 
					s = "k_icon_alsn_hud_r"; 
					break;
				case ZmvSignalExTypes.RY: 
					s = "k_icon_alsn_hud_yr"; 
					break;
				case ZmvSignalExTypes.RWf:
  					if(m_flashImg)	s = "k_icon_alsn_hud_rw1";
					else			s = "k_icon_alsn_hud_rw2";
					break;
				case ZmvSignalExTypes.YY:
					s = "k_icon_alsn_hud_yy";
					break;
				case ZmvSignalExTypes.YYgl:
					s = "k_icon_alsn_hud_yy_gl";
					break;
				case ZmvSignalExTypes.Y:
					s = "k_icon_alsn_hud_y";
					break;
				case ZmvSignalExTypes.YfY:
  					if(m_flashImg)	s = "k_icon_alsn_hud_yy";
					else			s = "k_icon_alsn_hud_yy2";
					break;
				case ZmvSignalExTypes.YfYgl:
  					if(m_flashImg)	s = "k_icon_alsn_hud_yy_gl";
					else			s = "k_icon_alsn_hud_yy2_gl";
					break;
				case ZmvSignalExTypes.YG:
					s = "k_icon_alsn_hud_gy";
					break;
				case ZmvSignalExTypes.G:
					s = "k_icon_alsn_hud_g";
					break;
				case ZmvSignalExTypes.Gf:
  					if(m_flashImg)	s = "k_icon_alsn_hud_g";
					else			s = "k_icon_alsn_hud_black";
					break;
				case ZmvSignalExTypes.Yf:
  					if(m_flashImg)	s = "k_icon_alsn_hud_y";
					else			s = "k_icon_alsn_hud_black";
					break;
				case ZmvSignalExTypes.GfYgl:
  					if(m_flashImg)	s = "k_icon_alsn_hud_gy_gl";
					else			s = "k_icon_alsn_hud_yy2_gl";
					break;
				case ZmvSignalExTypes.YYY:
					s = "k_icon_alsn_hud_yyy";
					break;
				case ZmvSignalExTypes.B:
					s = "k_icon_alsn_hud_b";
					break;
				case ZmvSignalExTypes.W:
					s = "k_icon_alsn_hud_w";
					break;
				case ZmvSignalExTypes.WW:
					s = "k_icon_alsn_hud_ww";
					break;
				case ZmvSignalExTypes.GG:
					s = "k_icon_alsn_hud_gg";
					break;
				case ZmvSignalExTypes.YW:
					s = "k_icon_alsn_hud_yw";
					break;
				case ZmvSignalExTypes.YfW:
  					if(m_flashImg)	s = "k_icon_alsn_hud_yw";
					else			s = "k_icon_alsn_hud_yw2";
					break;
				default:
					s = "k_icon_alsn_hud_black";
			}
		}
		else if (m_signalInfo.signal)
		{
  			switch (m_signalInfo.signal.GetSignalState())
			{
				case 0:	 s = "k_icon_alsn_hud_r"; break;
				case 1:  s = "k_icon_alsn_hud_y"; break;
				case 2:  s = "k_icon_alsn_hud_g"; break;
				default: s = "k_icon_alsn_hud_black";
  			}
  		}
		else 
		{
			s = "k_icon_alsn_hud_black";
		}
		return s;
	}
	
	void ProcessNextSignal(Signal signal)
	{
		Soup props = signal.GetProperties();
		if (props.GetNamedTagAsBool("repeater", false)) return;
		if (signal != m_signalInfo.signal)
		{
			//Print("ProcessNextSignal:Signal changed");
			m_signalInfo.signal = signal;
			m_signalInfo.alsCode = m_signalInfo.alsCodeNext;
		}

		bool invisible = props.GetNamedTagAsBool("invisible", false);
		m_signalInfo.signal = signal;
		m_signalInfo.stateEx = props.GetNamedTagAsInt("privateStateEx",-1);
		m_signalInfo.autoBlock = props.GetNamedTagAsBool("autoblock", true);
		m_signalInfo.invisible = invisible;
		m_signalInfo.alsCodeNext = props.GetNamedTagAsInt("MSig-als-fq", ALS_OC);
		if (m_signalInfo.distanceToVeh < 0 and m_signalInfo.distance < 1)
		{
			m_signalInfo.alsCode = m_signalInfo.alsCodeNext;
		}
		if (invisible) m_signalInfo.name = "РЦ-"+signal.GetName();
		else		   m_signalInfo.name = signal.GetName();

		//Print("ProcessNextSignal:name+"+m_signalInfo.name+",alsCodeNext="+m_signalInfo.alsCodeNext);
	}

	void ProcessNextObject()
	{
		if (!m_CurrentTrain) return ;
		
		Vehicle loco = m_CurrentTrain.GetFrontmostLocomotive();		
		bool searchDirection = (loco.GetVelocity() >= 0 and loco.GetDirectionRelativeToTrain());
		int midLength = loco.GetLength() / 2;
		GSTrackSearch trackSearch = loco.BeginTrackSearch(searchDirection);
		MapObject nextItem = null;
		nextItem = trackSearch.SearchNext();
		while (nextItem)
		{
			if (nextItem.isclass(Signal) and trackSearch.GetFacingRelativeToSearchDirection())
			{
				//Print("ProcessNextObject:Signal");
				m_signalInfo.distance = trackSearch.GetDistance()-midLength;
				m_signalInfo.distanceToVeh = -1;
				ProcessNextSignal(cast<Signal>(nextItem));
				break;
			}
			else if (nextItem.isclass(Vehicle))
			{
				//Print("ProcessNextObject:Vehicle");
				Vehicle v = cast<Vehicle>(nextItem);
				m_signalInfo.Clear();
				m_signalInfo.distanceToVeh = trackSearch.GetDistance()-midLength-v.GetLength()/2;
				m_signalInfo.distance = -1;
				break;
			}
			nextItem = trackSearch.SearchNext();
		}
    
		m_signalInfo.img = GetImg();
	}
	
	string GetDistanceTo(float dist)
	{
		if (dist == -1) return "---";
					
		float distance;
		string val;
		string measure;
		string endBit;
		
		if (!Interface.GetMetricMode())
		{
			distance = dist/1000/Train.MPH_TO_KPH;
			measure="mi";
			string[] tokens = Str.Tokens((string)distance, ".");
			endBit = tokens[1];
			endBit = endBit[0,2];
			val = tokens[0];
		}
		else if (dist >= 1000)
		{
			distance = dist/1000;
			measure = "km";
			string[] tokens = Str.Tokens((string)distance, ".");
			endBit = tokens[1];
			endBit = endBit[0,3];
			val = tokens[0];
		}
		else
		{
			distance = dist;
			measure = "m";			
			string[] tokens = Str.Tokens((string)distance, ".");
			endBit = tokens[1];
			endBit = endBit[0,1];
			val = tokens[0];
		}

		return val + "." + endBit + measure;
	}
	
	string GetDistanceToNextSign(SignalInfo si)
	{
		return GetDistanceTo(si.distance);
	}
	// Provides a string version with mph/kph suffix of the given speed
	// (which is specifed in metres per second)
	string GetSpeedUnits(float speed, string metric, string imperial)
	{
		float speedMultiplier = Train.KPH_TO_MPS;
		string speedMeasure = metric;

		if (!Interface.GetMetricMode())
		{
		  speedMultiplier = Train.MPH_TO_MPS;
		  speedMeasure = imperial;
		}

		int iSpeed = ((speed/speedMultiplier) + 0.5);
		return iSpeed + speedMeasure;
	}
	// Gets the speed limit of the bext speed sign if possible as a string with metric/imperial
	// suffix, a blank "--" string otherwise.
	string GetNextSpeedLimit(SignalInfo si)
	{
		if (si.signal)
		{
			int speed = si.signal.GetSpeedLimit();
			if (speed >= 0)
				return GetSpeedUnits(speed, "kph", "mph");
		}
		return "---";
	}
	// Gets given value as percentage string to 2 decimal places and % sign!
	string ToPercentString(float percent)
	{
		string[] tokens = Str.Tokens((string)percent, ".");
		string endBit = tokens[1];
		endBit = endBit[0,2];
		return tokens[0] + "." + endBit + "%";
	}
	// Generate HTML code and load the m_Browser with it
	void UpdateHTML(void)
	{
		if (!m_Browser or m_bHidden)
			return;

		m_Browser.SetParam(0, GetDoorsContent());
		ProcessNextObject();
		Signal signal = m_signalInfo.signal;
		string img="<img width=48 height=96 src='"+m_signalInfo.img+".tga'></img>";
		m_Browser.SetParam(1, img);
		if (signal)
			m_Browser.SetParam(2,"<font color=#eb6e41><b><a href='live://signal_go^"+signal.GetId()+"'>"+m_signalInfo.name+"</a></b> </font><font color=#b4461e><b> = <trainz-text id='distance' text='--'></trainz-text></b></font>");
		else
			m_Browser.SetParam(2,"");
		if (m_signalInfo.distanceToVeh >= 0)
			m_Browser.SetParam(3, "<b><font color=#ccd0d3>Состав </font></b><font color=#b4461e><b><trainz-text id='dist_next_train' text='--'></trainz-text></b></font>");
		else
			m_Browser.SetParam(3, "<b><font color=#ccd0d3>След.скор. </font></b><font color=#b4461e><b><trainz-text id='next_speed' text='--'></trainz-text></b></font>");
			
		m_Browser.LoadHTMLFile(GetAsset(), "ScriptHUD.html");
		SetArsPanelValues();
	}
	// Update variables in the m_Browser
	void UpdateContent()
	{
		if (!m_Browser)  return;

		Locomotive loco;
		if (m_CurrentTrain)
			loco = m_CurrentTrain.GetFrontmostLocomotive();
		if (loco)
		{
			UpdateHTML();
			m_Browser.SetTrainzText("distance", GetDistanceToNextSign(m_signalInfo));			
			m_Browser.SetTrainzText("gradient", ToPercentString(loco.GetTrackGradient()));			
			if (m_signalInfo.distanceToVeh >= 0)
				m_Browser.SetTrainzText("dist_next_train", GetDistanceTo(m_signalInfo.distanceToVeh));
			else
				m_Browser.SetTrainzText("next_speed", GetNextSpeedLimit(m_signalInfo));
		}
		else // these blank states are used if no loco is currently in camera focus
		{			
			m_Browser.SetTrainzText("distance",  "--");
			m_Browser.SetTrainzText("next_speed", "--");
			m_Browser.SetTrainzText("dist_next_train", "--");
			m_Browser.SetTrainzText("gradient", "--");
		}
	}
	
	void CloseBrowser(void)
	{
		if (!m_Browser)
			return;
		// Remove this m_Browser from the DriverModule's custom HUD list
		Library driverModule = World.GetLibrary( GetAsset().LookupKUIDTable("driver-module") );
		GameObject[] objectParam = new GameObject[1];
		objectParam[0] = m_Browser;
		driverModule.LibraryCall("remove-hud", null, objectParam);
		m_Browser = null;
	}

	void OnTargetChanged(Vehicle focusedVehicle)
	{
		//Print("OnTargetChanged");
		if (focusedVehicle)	m_CurrentTrain = focusedVehicle.GetMyTrain();
		else				m_CurrentTrain = null;
		m_signalInfo.Clear();
		InitDoorsState();
		UpdateContent();
	}

	// Speed monitoring thread
	thread void ThreadMain(void)
	{
		Message msg;
		PostMessage(me, "Timer", "Tick", 0.0);
		wait()
		{
			on "Camera", "Target-Changed", msg:
			{
				Vehicle focusedVehicle = cast<Vehicle> msg.src;
				OnTargetChanged(focusedVehicle);
				continue;
			}
			on "Timer", "Tick":
			{
				if (!m_Browser)
					break;
				UpdateContent();
				PostMessage(me, "Timer", "Tick", 1.0);
				continue;
			  }
			on "Browser-Closed", "", msg:
			{
				if (msg.src == m_Browser or !m_Browser)	break;
				msg.src = null;
				continue;
			}
		}
		CloseBrowser();
		m_threadRunning = false;
	}
	
	void ConstructBrowser(void)
	{
		if (!m_Browser)
		{
			int width = Interface.GetDisplayWidth();
			m_Browser = Constructors.NewBrowser();
			m_Browser.SetCloseEnabled(false);
			m_Browser.SetWindowStyle(Browser.STYLE_NO_FRAME);
			m_Browser.SetWindowRect(width - 183, 100, width, 532);
		}

		if (!m_threadRunning)
		{
			m_threadRunning = true;
			ThreadMain();
		}
		// Add this m_Browser to the DriverModule's custom HUD list
		Library driverModule = World.GetLibrary( GetAsset().LookupKUIDTable("driver-module") );
		GameObject[] objectParam = new GameObject[1];
		objectParam[0] = m_Browser;
		driverModule.LibraryCall("add-hud", null, objectParam);
		AddHandler(m_Browser, "Browser-URL", "", "OnBrowserURL");
	}

	public void OnCabCommand(Message msg)
	{
		Print("OnCabCommand:"+msg.minor);
		if (msg.src != m_CurrentTrain) return;
		if (msg.minor == "OpenDoorsLeft")
			m_LeftDoorsOpened = true;
		else if (msg.minor == "OpenDoorsRight")
			m_RightDoorsOpened = true;
		else if (msg.minor == "CloseDoors")
			m_LeftDoorsOpened = m_RightDoorsOpened = false;
		
		UpdateContent();
	}

	public void OnBrowserURL(Message msg)
	{
		if (msg.src != m_Browser)
			return;
		
		Print("OnBrowserURL:"+msg.minor);
		if (msg.minor == "live://doors-right")
		{
			TrainDoorsOperate(/*open=*/true, /*right=*/true);
		}
		else if (msg.minor == "live://doors-left")
		{
			TrainDoorsOperate(/*open=*/true, /*right=*/false);
		}
		else if (msg.minor == "live://doors-close")
		{
			TrainDoorsOperate(/*open=*/false, /*right=*/true);
		}
		else if (msg.minor == "live://informator")
		{
			PostBroarcastTrainMessage("Informator");
		}
		else if (msg.minor == "live://dcc")	
		{ 
			m_mo = !m_mo; 
			World1.SetDCCMode(m_mo);
			if (m_mo) 	PostMessage(null, "DriveMode", "DCC", 0);
			else		PostMessage(null, "DriveMode", "Cabin", 0);
		}
		else
		{
			string[] tok=Str.Tokens(msg.minor,"/");
			string[] tok1=Str.Tokens(tok[1],"^");
			if(tok1.size() > 0)
			{
				if(tok1[0]=="signal_go")
				{
					Signal s=cast<Signal>(Router.GetGameObject(Str.ToInt(tok1[1])));
					if(s)	PostMessage(s,"MapObject","View-Details",0.01);
 				}
			}
		}
		UpdateHTML();
	}	
	//========================================================================================================================================
	string GetCheckBoxCell(bool value, string link)
	{
		return HTMLWindow.CheckBox("live://property/"+link, value);
	}
	
	string GetLinkCell(string displayValue, string link, string color, int height)
	{
		return "&nbsp;<font face=Century Gothic color="+color+" size="+height+"><a href=live://property/"+link+">"+displayValue+"</a></font>&nbsp;";
	}

	string GetLinkRow(string displayValue, string link, string color, int height)
	{
		return GetLinkCell(displayValue, link, color, height);
	}
	
	string GetCheckBoxRow(string displayValue, bool value, string link)
	{
		return	GetCheckBoxCell(value, link)+GetLinkCell(displayValue, link, "#D8D8B8", 2);
	}
		
    public string GetDescriptionHTML(void)
    {
		StringTable ST = GetAsset().GetStringTable();		
		string text = "<br>" + GetCheckBoxRow(ST.GetString("html_show"), !m_bHidden, "show");
		if (!m_bHidden)
		{
			text = text + "<br><br><img width=40 height=70 src='k_icon_alsn_hud_g.tga'></img>" + GetLinkRow(ST.GetString("html_mode_hud"), "hud", "#F8D8B8", 1);
		}
					
		return  "<html><body><font face=Century Gothic color=#E8E8E8 size=3><br><b>&nbsp;&nbsp;" + ST.GetString("description") + "<br>" + text + "</b></font><br><br><font face=Century Gothic color=#E8E8E8 size=1><b>  © CyriTRAINZ 2017</b></font></body></html>";
    }
	//========================================================================================================================================		
	string GetPropertyType(string propertyID)
    {
		return "link";
    }
	
    void LinkPropertyValue(string propertyID)
    {
		if (propertyID == "show")	m_bHidden = !m_bHidden;
    }            
	//========================================================================================================================================	
    public void SetProperties(Soup soup)
    {
		inherited(soup);

		m_bHidden = soup.GetNamedTagAsBool("hidden", false);
		if (!m_bHidden and World.GetCurrentModule() == World.DRIVER_MODULE)
		{
			ConstructBrowser();
			AddHandler(me, "Cab", "", "OnCabCommand");
		}
    }

    public Soup GetProperties()
    {
		Soup soup = inherited();		
		soup.SetNamedTag("hidden", m_bHidden);
		return soup;
    }
	//========================================================================================================================================	
    public void Init(Asset p_self)
    {
		inherited(p_self);
    }	
	//========================================================================================================================================		
	public void Pause(bool paused)
    {
		if (paused == IsPaused())	return;

		SetStateFlags(PAUSED, paused);
		
		if (paused)	
			CloseBrowser();
		else if (!m_bHidden)
			ConstructBrowser();
    }
	//========================================================================================================================================	
};
