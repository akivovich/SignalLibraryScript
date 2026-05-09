include "ScenarioBehavior.gs"
include "World.gs"
//include "World1.gs"
include "Browser.gs"
//include "common.gs"
include "ZmvSignalInterface.gs"
include "ZmvConsts.gs"

class SignalInfo
{
	public string img="";
	public string name="";
	public Signal signal=null;
	public float distance=-1.0;
	public int state=0;
	public int stateEx=0;
	public bool kmz=false;
	public bool shunt = false;
	public float speed = -1.0;
	public float distanceToVeh = -1.0;

	public void Reset()
	{
		img = "";
		name = "";
		distance = -1;
		stateEx = -1;
		state = -1;
		kmz = false;
		speed = -1.0;
		signal = null;
		distanceToVeh = -1.0;
   	}
};


class AlsHud isclass ScenarioBehavior
{		
	bool m_flashImg = false; 
	bool m_mo = true;
	bool m_threadRunning  = false; // hide/show state of m_Browser
	bool m_bHidden = true;
	Browser     m_Browser;
	Train       m_CurrentTrain;
	Trackside   m_CurrentSpeedSign;
	Trackside   m_NextSpeedSign;
	SignalInfo  m_signalInfo=new SignalInfo();
	bool m_IsHudView = false; // 1-repeater, 2- alsn
	//======================================================================================================================================== 
	string GetImg()
	{
		m_flashImg= !m_flashImg;
		string s = "";
  		if(m_signalInfo.kmz)
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
		else
		{
  			switch (m_signalInfo.state)
			{
				case 0:	 s = "k_icon_alsn_hud_r"; break;
				case 1:  s = "k_icon_alsn_hud_y"; break;
				case 2:  s = "k_icon_alsn_hud_g"; break;
				default: s = "k_icon_alsn_hud_black";
  			}
  		}
		return s;
	}
	
	string GetALSN()
	{
		string s="";
  		
		if (m_signalInfo.signal)
		{
			if (m_signalInfo.kmz)
			{
				switch (m_signalInfo.stateEx)
				{
					case ZmvSignalExTypes.R:
					case ZmvSignalExTypes.RY:		
					case ZmvSignalExTypes.RWf:		s = "k_icon_alsn_alsn_yr"; break;
					
					case ZmvSignalExTypes.YY:
					case ZmvSignalExTypes.YYgl:
					case ZmvSignalExTypes.Y:
					case ZmvSignalExTypes.YfY:
					case ZmvSignalExTypes.YfYgl:
					case ZmvSignalExTypes.GfYgl:
					case ZmvSignalExTypes.YYY:
					case ZmvSignalExTypes.YW:
					case ZmvSignalExTypes.YfW:		s = "k_icon_alsn_alsn_y"; break;

					case ZmvSignalExTypes.YG:
					case ZmvSignalExTypes.G:
					case ZmvSignalExTypes.Gf:
					case ZmvSignalExTypes.Yf:
					case ZmvSignalExTypes.GG:		s = "k_icon_alsn_alsn_g"; break;
					
					case ZmvSignalExTypes.B:
					case ZmvSignalExTypes.W:
					case ZmvSignalExTypes.WW:		s = "k_icon_alsn_alsn_w"; break;
					
					default:						s = "k_icon_alsn_alsn_r";
				}
			}
			else
			{
				switch (m_signalInfo.state)
				{	
					case Signal.RED:	s = "k_icon_alsn_alsn_yr"; break;
					case Signal.YELLOW:	s = "k_icon_alsn_alsn_y";  break;
					case Signal.GREEN:	s = "k_icon_alsn_alsn_g";  break;
					default:			s = "k_icon_alsn_alsn_w"; 
				}
			}
		}
		else
		{
			if (m_signalInfo.shunt)	s = "k_icon_alsn_alsn_w";
			else					s = "k_icon_alsn_alsn_r";
		}
 
		return s;
	}
	
	void GetNextSignal()
	{
		m_signalInfo.Reset();
		if (!m_CurrentTrain) return ;
		
		Vehicle fromVehicle = m_CurrentTrain.GetFrontmostLocomotive();
		
		bool searchDirection = (fromVehicle.GetVelocity()>=0 and fromVehicle.GetDirectionRelativeToTrain());
		int midLength=fromVehicle.GetLength()/2;
		GSTrackSearch trackSearch = fromVehicle.BeginTrackSearch(searchDirection);
		MapObject nextItem = null;
		m_CurrentSpeedSign = null;
		m_NextSpeedSign    = null;
		int distance=-1;
		nextItem = trackSearch.SearchNext();
		while (nextItem)
		{
			if (nextItem.isclass(Signal) and trackSearch.GetFacingRelativeToSearchDirection())
			{
				Signal signal = cast<Signal>(nextItem);
				bool isShunt;
				int  privateStateEx = -1;
				Soup props = nextItem.GetProperties();
				if (nextItem.isclass(ZmvSignalInterface))
				{
					isShunt = (cast<ZmvSignalInterface>(nextItem)).IsShuntMode();
					privateStateEx = props.GetNamedTagAsInt("privateStateEx",-1);
				}
				else
				{
					isShunt = (m_CurrentTrain.GetTrainPriorityNumber() == 3);
					if (props.GetNamedTagAsInt("privateStateEx",-1)!= -1)
						privateStateEx = props.GetNamedTagAsInt("privateStateEx",-1);
				}				
				if (!isShunt and (privateStateEx==ZmvSignalExTypes.B or privateStateEx==ZmvSignalExTypes.W or privateStateEx==ZmvSignalExTypes.WW))
				{
					nextItem = trackSearch.SearchNext();
					continue;
				}
				m_signalInfo.signal = signal;
				m_signalInfo.shunt = isShunt;
				m_signalInfo.distance = trackSearch.GetDistance()-midLength;
				m_signalInfo.speed = signal.GetSpeedLimit();
				m_signalInfo.state = signal.GetSignalState();
				m_signalInfo.kmz = (privateStateEx >= 0);
				string signalName;
				if (m_signalInfo.kmz)
				{
					m_signalInfo.stateEx = privateStateEx;
					signalName = props.GetNamedTag("privateName");
				}
				else
				{
					signalName =  signal.GetName();
					m_signalInfo.state = signal.GetSignalState();
					m_signalInfo.stateEx = signal.GetSignalStateEx();
				}
				
				if (signalName != "")
					m_signalInfo.name = signalName;
				else
					m_signalInfo.name = "Noname";
				
				break;
			}
			else if (nextItem.isclass(Vehicle))
			{
				Vehicle v = cast<Vehicle>(nextItem);
				m_signalInfo.distanceToVeh = trackSearch.GetDistance()-midLength-v.GetLength()/2;
				m_signalInfo.kmz = true;
				m_signalInfo.state = 0;
				if (m_IsHudView)
				{
					if (m_signalInfo.shunt)
						m_signalInfo.stateEx = ZmvSignalExTypes.BLACK;
					else
						m_signalInfo.stateEx = ZmvSignalExTypes.R;
				}
				else
				{
					if (m_signalInfo.shunt)
						m_signalInfo.stateEx = ZmvSignalExTypes.W;
					else
						m_signalInfo.stateEx = ZmvSignalExTypes.R;
				}
				break;
			}
			nextItem = trackSearch.SearchNext();
		}
    
		if (m_IsHudView)	m_signalInfo.img = GetImg();
		else				m_signalInfo.img = GetALSN();
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
		int speed = si.speed;
		if (speed >= 0)
		  return GetSpeedUnits(speed, "kph", "mph");
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

		GetNextSignal();       		
		string img="<img width=48 height=96 src='"+m_signalInfo.img+".tga'></img>";
		m_Browser.SetParam(1, img);
		if (m_signalInfo.signal)
			m_Browser.SetParam(2,"<font color=#eb6e41><b><a href='live://signal_go^"+m_signalInfo.signal.GetId()+"'>"+m_signalInfo.name+"</a></b> </font><font color=#b4461e><b> = <trainz-text id='distance' text='--'></trainz-text></b></font>");
		else
			m_Browser.SetParam(2,"");
		if (m_signalInfo.distanceToVeh >= 0)
			m_Browser.SetParam(3, "<b><font color=#ccd0d3>Состав </font></b><font color=#b4461e><b><trainz-text id='dist_next_train' text='--'></trainz-text></b></font>");
		else
			m_Browser.SetParam(3, "<b><font color=#ccd0d3>След.скор. </font></b><font color=#b4461e><b><trainz-text id='next_speed' text='--'></trainz-text></b></font>");
			
		m_Browser.LoadHTMLFile(GetAsset(), "ScriptHUD.html");
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
	// Speed monitoring thread
	thread void ThreadMain(void)
	{
		Message msg;
		m_CurrentSpeedSign = null;
		m_NextSpeedSign    = null;
		PostMessage(me, "Timer", "Tick", 0.0);
		wait()
		{
			on "Camera", "Target-Changed", msg:
			{
				Vehicle focusedVehicle = cast<Vehicle> msg.src;
				if (focusedVehicle)	m_CurrentTrain   = focusedVehicle.GetMyTrain();
				else				m_CurrentTrain   = null;
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
			m_Browser.SetWindowRect(width - 183,100,width,432); //  327 height			
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
		AddHandler(m_Browser, "Browser-URL", "", "ChangeText");
	}
			
	public void ChangeText(Message msg)
	{
		if(msg.src!=m_Browser)
			return;
			
		if (msg.minor=="live://hud")		{ m_IsHudView = !m_IsHudView; }
		else if(msg.minor=="live://dcc")	
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
			if (m_IsHudView)
				text = text + "<br><br><img width=40 height=70 src='k_icon_alsn_hud_g.tga'></img>" + GetLinkRow(ST.GetString("html_mode_hud"), "hud", "#F8D8B8", 1);
			else
				text = text + "<br><br><img width=40 height=70 src='k_icon_alsn_alsn_g.tga'></img>" + GetLinkRow(ST.GetString("html_mode_asl"), "asl", "#F8D8B8", 1);
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
		else 						m_IsHudView = !m_IsHudView;
    }            
	//========================================================================================================================================	
    public void SetProperties(Soup soup)
    {
		inherited(soup);

		m_bHidden = soup.GetNamedTagAsBool("hidden", false);
		m_IsHudView = soup.GetNamedTagAsBool("hud", true);		
		if (!m_bHidden and World.GetCurrentModule() == World.DRIVER_MODULE)
			ConstructBrowser();
    }

    public Soup GetProperties()
    {
		Soup soup = inherited();
		
		soup.SetNamedTag("hidden", m_bHidden);
		soup.SetNamedTag("hud", m_IsHudView);
		
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
