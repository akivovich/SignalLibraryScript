include "Locomotive.gs"
include "Tablo.gs"

//extensions параметры для табло:
//tablo_max_len - максимальное количество символов табло внутри вагонов состава. (По умолчанию - 18);
//static_tablo - 1 - табло внутри вагонов состава показывают статическую информацию, 0 - бегущая строка
//main-tablo-electro - 1 - электронное внешнее табло (может меняться название), 0 - обычное внешнее табло (отображается только одно название)

class CyriScriptSecondary isclass Locomotive 
{
	define int REVERSER_FORWARD = 2;
	
	Library A;
	GSObject[] Objects;
	string[] Strings;
	Soup SSSoup;
	Asset	k_reds01, k_orange01, k_hlight01, k_hlight02;
	bool DeRailed;
	bool derailed = false;
	string number = "";
	Browser ViewDetailsBrowser;
	int  vdb_left = 100;
	int  vdb_right = 340;
	int  vdb_top = 100;
	int  vdb_bottom = 345;
	float m_maxDeclination = 0;
	float m_curDeclination = 0;
	float m_deltaDeclination = 0;
	bool  m_hasDriver, m_showDriver, m_driverShowed; 
	bool  m_showInCab1, m_showInCab2;
	int   m_CabsMy, m_CabsFirst, m_CabsLast;
	float sway01 = 0, sway02 = 0, sway03 = 0, sway04 = 0, sway05 = 0;
	int   m_fansState;
	bool  m_hasFans, m_hasLine, m_hasHdlight, m_hasBelight;
	bool  m_electro = false;	
	bool  m_main; //один из вагонов (любой), который управляет табло во всём составе
	bool  m_simpleMode = true, m_fary, m_salon;	
	bool  m_hasTablo;
	int   m_tabloMaxLen, m_mainTabloMonitor = 0;
	bool  m_staticTablo;
	bool  m_tabloSet, m_tabloCommand;
	int   m_Pos;
	bool  m_mainTabloElectro, m_showLastStation;
	string	m_curStation, m_nextStation, m_lastStation, m_advertString;
	
	thread void DeclinationLoopThread(void);
	thread void K_loop1(void);
	thread void IntLight(void);
	thread void DiscMonitorThread(void);	
	thread void TabloMonitor(void);	
	thread void MainTabloMonitor(int n, string destination);

	void SetMainTablo(Vehicle v, string value);
	void SetDisc();	
	void SetDiscAttach();
	void SetDiscAttachCoupled();
	void ShowDriver();
	int GetMyPosition(Train train);
	
	void Print(string message)
	{
		Interface.Print(GetName() + "::" + message);
	}

	/*
	void Print(string info)
	{
		if (GetName()=="ff")
			Interface.Print(info);
	}
	
	void Print(int pos, bool direction, int num)
	{
		if (GetName()=="ff")
			Interface.Print(GetName()+",pos="+pos+",dir="+direction+",Cabs="+m_CabsMy+",num="+num);
	}
	*/
	
	public bool IsMain()
	{
		return m_main;
	}
	
	public bool IsSimpleMode()
	{
		return m_simpleMode;
	}
		
	public bool IsElectroOn()
	{
		return m_electro; 
	}
	
	CyriScriptSecondary GetMainVehicle()
	{
		CyriScriptSecondary v;
		Vehicle[] vehicles = GetMyTrain().GetVehicles();
		int i;
		for (i = vehicles.size()-1; i >= 0; i--)
		{
			v = cast<CyriScriptSecondary>(vehicles[i]);
			if (v and v != me and v.IsMain()) break;
		}		
		if (i >= 0) return v;
		return null;
	}
	
	public bool IsDriverShowed()
	{
		return m_driverShowed;
	}
	
	void ChangeDestinationSign(Message msg) 
	{
		Vehicle[] vehicles = me.GetMyTrain().GetVehicles();
		if (me != vehicles[0] and me != vehicles[vehicles.size()-1])
		{
			SetMainTablo(me, " ");
			return;
		}
		
		int maxlen = 50;		
		string new_destination = msg.minor;

		if (new_destination == "") new_destination = "CyriTRAINZ"; 
		if (new_destination.size() > maxlen) new_destination = new_destination[,(maxlen - 1)] + ".";
		
		m_lastStation = new_destination;
		m_tabloCommand = true;
		MainTabloMonitor(++m_mainTabloMonitor, new_destination);
	}
	
	void ChangeNumberSign(Message msg) 
	{	
		Vehicle[] vehicles = me.GetMyTrain().GetVehicles();
		bool set = (me == vehicles[0] or me == vehicles[vehicles.size()-1]);
		string new_number;

		if (msg)	new_number = msg.minor;
		else		new_number = number;
 
		if (new_number == "") { new_number = "  "; }

		if (!m_electro or !set) SetFXNameText("number-0", " ");
		else					SetFXNameText("number-0", new_number);

		number = new_number;
	}

	public void SetElectroSupply(bool val)
	{
//Print("SetElectroSupply:"+val);
		m_electro = val;
		SSSoup.SetNamedTag("electromanager", val);
		if (!val)
		{
			me.GetMyTrain().SetHeadlightState(false);
			if (m_hasBelight)
			{
				SetFXCoronaTexture("leftstop-0", null );
				SetFXCoronaTexture("rightstop-0", null );
			}
			if (!m_electro)
				SetDisc();
		}
		else
		{
			DeclinationLoopThread();
			K_loop1();
			IntLight();
			DiscMonitorThread();
			TabloMonitor();
		}
		
		PostMessage(me,"SS","Wipers",0.5);
	}
	
	public int GetMyCabs()
	{
		return m_CabsMy;
	}
	
	public bool CanBeCleaned()
	{
		return true;
	}
	
	public void SetCleaned(bool cleaned)
	{
		if (CanBeCleaned())
		{
			SSSoup.SetNamedTag("cleaned", cleaned);
			A.LibraryCall("Refresh",null,Objects);
		}
	}
	
	void InitHasDriver()
	{
		Train train = me.GetMyTrain();
		m_hasDriver = (train != null and train.GetActiveDriver() != null);
	}
	
	void SetProperty(Message msg)
	{
		string cmd = msg.minor;		
		if (cmd == "electro")			SetElectroSupply(SSSoup.GetNamedTagAsBool("electromanager"));
		else if (cmd == "electro,0")	SetElectroSupply(false);
		else if (cmd == "electro,1")	SetElectroSupply(true);		
	}
	
	void ShowDriver(bool show)
	{
		m_showDriver = show;
		ShowDriver();
	}
	
	void OnShowDriver(Message msg)
	{		
		ShowDriver(msg.minor == "ShowDriver");
	}
	
	void OnChangeDriver(Message msg)
	{
		InitHasDriver();
		ShowDriver();
	}
	
	void OnDiscAttach(Message msg)
	{
		SetDiscAttach();
	}
	
	void OnCoupled(Message msg)
	{
		if (me == msg.src) SetDiscAttach();
	}
	
	void OnDriverModule(Message msg)
	{
		m_simpleMode = true;
	}
	
	void MessageHandler(Message msg) {
		Objects[2] = msg.src;
		Strings[0] = msg.major;
		Strings[1] = msg.minor;
		A.LibraryCall("Message",Strings,Objects);
		derailed = (msg.major == "Vehicle" and msg.minor == "Derailed" and msg.src == me);
	}

	void BrowserCloseHandler(Message msg) {
		if (msg.src == ViewDetailsBrowser) {ViewDetailsBrowser = null;}
	}

	void BrowserUrlHandler(Message msg) {
		if (msg.src == ViewDetailsBrowser) {
			Objects[2] = msg.src;
			Strings[0] = msg.major;
			Strings[1] = msg.minor;
			A.LibraryCall("Message",Strings,Objects);
			ViewDetails(msg);
		}
	}

	public void ViewDetails(Message msg) {
		if (ViewDetailsBrowser) {
			vdb_left   = ViewDetailsBrowser.GetWindowLeft();
			vdb_top    = ViewDetailsBrowser.GetWindowTop();
			vdb_right  = ViewDetailsBrowser.GetWindowRight();
			vdb_bottom = ViewDetailsBrowser.GetWindowBottom();
		} else {
			ViewDetailsBrowser = Constructors.NewBrowser();
		}
		ViewDetailsBrowser.SetWindowRect(vdb_left, vdb_top, vdb_right, vdb_bottom);
		Objects[2] = strTable;
		ViewDetailsBrowser.LoadHTMLString(A.LibraryCall("ViewDetails",Strings,Objects));
	}

	public void SetProperties(Soup soup) {
		inherited(soup);
		SSSoup.SetNamedTag("onemesh",soup.GetNamedTagAsInt("onemesh",-2));
		SSSoup.SetNamedTag("twomesh",soup.GetNamedTagAsInt("twomesh",-2));
		SSSoup.SetNamedTag("threemesh",soup.GetNamedTagAsInt("threemesh",-2));
		SSSoup.SetNamedTag("fourmesh",soup.GetNamedTagAsInt("fourmesh",-2));
		SSSoup.SetNamedTag("fivemesh",soup.GetNamedTagAsInt("fivemesh",-2));
		SSSoup.SetNamedTag("sixmesh",soup.GetNamedTagAsInt("sixmesh",-2));
		SSSoup.SetNamedTag("exbodymanager",soup.GetNamedTagAsInt("exbodymanager",0));
		SSSoup.SetNamedTag("cleaned",soup.GetNamedTagAsBool("cleaned",false));
		SSSoup.SetNamedTag("interiormanager",soup.GetNamedTagAsInt("interiormanager",0));
		SSSoup.SetNamedTag("schememanager",soup.GetNamedTagAsInt("schememanager",0));
		SSSoup.SetNamedTag("advertmanager",soup.GetNamedTagAsInt("advertmanager",0));
		SSSoup.SetNamedTag("drivermanager",soup.GetNamedTagAsInt("drivermanager",0));
		SSSoup.SetNamedTag("registration",soup.GetNamedTagAsInt("registration",0));
		SSSoup.SetNamedTag("registrationg",soup.GetNamedTagAsInt("registrationg",0));
		SSSoup.SetNamedTag("vehicleNumber",soup.GetNamedTag("vehicleNumber"));
		SSSoup.SetNamedTag("tchNumber",soup.GetNamedTag("tchNumber"));
		SSSoup.SetNamedTag("vehicleNumberAuto",soup.GetNamedTagAsBool("vehicleNumberAuto"));
		
//Interface.Print("SetProperties:vehicleNumber="+soup.GetNamedTag("vehicleNumber")+",vehicleNumberAuto="+soup.GetNamedTagAsBool("vehicleNumberAuto", true));		

		m_electro = soup.GetNamedTagAsBool("electromanager",false);
		SSSoup.SetNamedTag("electromanager",m_electro);
		SSSoup.SetNamedTag("position",soup.GetNamedTagAsInt("position",-1));
		SSSoup.SetNamedTag("speed",0.0);
		SSSoup.SetNamedTag("indicating",false);
		string new_destination = soup.GetNamedTag("destination");
		string new_number = soup.GetNamedTag("number");
		PostMessage(me, "ChangeDestinationSign", new_destination, 0);
		PostMessage(me, "ChangeNumberSign", new_number, 0); 
		A.LibraryCall("Refresh",null,Objects);
	}

	public Soup GetProperties(void) {
		Soup soup = inherited();
		soup.SetNamedTag("onemesh",SSSoup.GetNamedTagAsInt("onemesh"));
		soup.SetNamedTag("twomesh",SSSoup.GetNamedTagAsInt("twomesh"));
		soup.SetNamedTag("threemesh",SSSoup.GetNamedTagAsInt("threemesh"));
		soup.SetNamedTag("fourmesh",SSSoup.GetNamedTagAsInt("fourmesh"));
		soup.SetNamedTag("fivemesh",SSSoup.GetNamedTagAsInt("fivemesh"));
		soup.SetNamedTag("sixmesh",SSSoup.GetNamedTagAsInt("sixmesh"));
		soup.SetNamedTag("exbodymanager",SSSoup.GetNamedTagAsInt("exbodymanager"));
		soup.SetNamedTag("cleaned",SSSoup.GetNamedTagAsBool("cleaned"));
		soup.SetNamedTag("interiormanager",SSSoup.GetNamedTagAsInt("interiormanager"));
		soup.SetNamedTag("schememanager",SSSoup.GetNamedTagAsInt("schememanager"));
		soup.SetNamedTag("advertmanager",SSSoup.GetNamedTagAsInt("advertmanager"));
		soup.SetNamedTag("drivermanager",SSSoup.GetNamedTagAsInt("drivermanager"));
		soup.SetNamedTag("registration",SSSoup.GetNamedTagAsInt("registration"));
		soup.SetNamedTag("registrationg",SSSoup.GetNamedTagAsInt("registrationg"));
		soup.SetNamedTag("electromanager",SSSoup.GetNamedTagAsInt("electromanager"));
		soup.SetNamedTag("position",SSSoup.GetNamedTagAsInt("position"));
		soup.SetNamedTag("vehicleNumber",SSSoup.GetNamedTag("vehicleNumber"));
		soup.SetNamedTag("tchNumber",SSSoup.GetNamedTag("tchNumber"));
		soup.SetNamedTag("vehicleNumberAuto",SSSoup.GetNamedTagAsBool("vehicleNumberAuto", true));
		soup.SetNamedTag("destination", m_lastStation);
		soup.SetNamedTag("number", number);
		return soup;
	}

	public string GetDescriptionHTML(void) {
		Strings[0] = inherited();
		return A.LibraryCall("GetDescriptionHTML",Strings,Objects);
	}
	
	public string GetPropertyName(string pID) {
		Strings[0] = inherited(pID);
		Strings[1] = pID;
		return A.LibraryCall("GetPropertyName",Strings,Objects);
	}

	string GetPropertyType(string pID) {
		Strings[0] = inherited(pID);
		Strings[1] = pID;
		return A.LibraryCall("GetPropertyType",Strings,Objects);
	}

	void LinkPropertyValue(string pID) {
		Strings[0] = pID;
		if (A.LibraryCall("LinkPropertyValue",Strings,Objects) == "0") {
			inherited(pID);
		}
	}
	
	public void SetPropertyValue(string pID, string value) {
		Strings[0] = pID;
		Strings[1] = value;
		if (A.LibraryCall("SetPropertyValue",Strings,Objects) == "0") {
			inherited(pID,value);
		}
	}

	public void SetPropertyValue(string pID, string value, int index) {
		Strings[0] = pID;
		Strings[1] = value;
		Strings[2] = index;
		if (A.LibraryCall("SetPropertyValue",Strings,Objects) == "0") {
			inherited(pID,value,index);
		}
	}

	string[] GetPropertyElementList(string pID) 
	{
		Strings[0] = pID;
		if (A.LibraryCall("GetPropertyElementList",Strings,Objects) == "0") 
		{
			return inherited(pID);
		}
		return Strings;
	}
	
	void SetDiscAttach(int pos, bool type)
	{
		if (pos == 0)
		{
			if (type == true)
			{
				SetMeshAnimationState("coupler-0",true);
				SetMeshAnimationState("kranf",true);
				SetMeshVisible("disc-0", false, 0.0);
			}
			else
			{
				SetMeshAnimationState("coupler-0",false);
				SetMeshAnimationState("kranf",false);
				SetMeshVisible("disc-0", true, 0.0);
			}
		}
		else	
		{
			if (type == true)
			{
				SetMeshAnimationState("coupler-1",true);
				SetMeshAnimationState("kranb",true);
				SetMeshVisible("disc-1", false, 0.0);
			}
			else
			{
				SetMeshAnimationState("coupler-1",false);
				SetMeshAnimationState("kranb",false);
				SetMeshVisible("disc-1", true, 0.0);
			}
		}
	}
	
	void SetDiscAttach()
	{
		int pos = GetMyPosition(GetMyTrain());		
		if (pos == 0) //один
		{
			SetDiscAttach(0, false);
			SetDiscAttach(1, false);		
		}
		else if (pos == 1) //первый
		{		
			bool direction = GetDirectionRelativeToTrain();
			SetDiscAttach(0,!direction);
			SetDiscAttach(1, direction);
		}
		else if (pos == 2) //промежуточный
		{
			SetDiscAttach(0, true);
			SetDiscAttach(1, true);		
		}
		else //if (pos == 3) //последний
		{
			bool direction = GetDirectionRelativeToTrain();
			SetDiscAttach(0, direction);
			SetDiscAttach(1,!direction);
		}
	}
	
	void SetDiscAttachCoupled()
	{
		SetDiscAttach();
		Vehicle[] vehicles = GetMyTrain().GetVehicles();
		int len = vehicles.size();
		if (len > 1)
		{
			int i;
			for (i = 0; i < len and me != vehicles[i]; i++);
			if (i == 0) 			PostMessage(vehicles[i+1], "Vehicle", "DiscAttach", 0);
			else if (i == len-1) 	PostMessage(vehicles[i-1], "Vehicle", "DiscAttach", 0);
			else
			{
				PostMessage(vehicles[i+1], "Vehicle", "DiscAttach", 0);
				PostMessage(vehicles[i-1], "Vehicle", "DiscAttach", 0);
			}
		}
	}
	
	int GetNumCabs(Vehicle v)
	{
		Soup soup = v.GetAsset().GetConfigSoup().GetNamedSoup("mesh-table");
		if (soup.GetIndexForNamedTag("conductor-1") != -1) return 2;
		if (soup.GetIndexForNamedTag("conductor-0") != -1) return 1;		
		return 0;
	}
	
	bool HasEffect(Soup soup, string name)
	{
		int 	i, len = soup.CountTags();
		bool 	res = false;
	
		for (i = 0; !res and i < len; i++)
		{
			res = (soup.GetNamedSoup(soup.GetIndexedTagName(i)).GetNamedTag("name") == name);
		}
		
		return res;			
	}
	
	void SetMeshData()
	{
		Soup soup = GetAsset().GetConfigSoup().GetNamedSoup("mesh-table");
		m_hasFans = (soup.GetIndexForNamedTag("fans") != -1);
		m_hasLine = (soup.GetIndexForNamedTag("line") != -1);
		Soup effects = soup.GetNamedSoup("default").GetNamedSoup("effects");
		m_hasTablo = HasEffect(effects, "tablo");
	}
	
	int GetMyPosition(Train train) 
	{
		Vehicle[]	TrainVehiclesArray = train.GetVehicles();
		int			ArraySize = TrainVehiclesArray.size();
		int		result;
		Vehicle first = TrainVehiclesArray[0];
		Vehicle last  = TrainVehiclesArray[ArraySize-1];

		if (ArraySize == 1)
		{
			result = 0; //один вагон
		}
		else if (me == first)
		{
			result = 1; //первый вагон
			if (m_CabsMy) m_CabsLast = GetNumCabs(last);		
		}
		else if (me == last)	
		{
			result = 3; //последний вагон
			if (m_CabsMy) m_CabsFirst = GetNumCabs(first);
		}
		else
		{
			result = 2; //промежуточный вагон
			if (m_CabsMy)
			{
				m_CabsLast = GetNumCabs(last);
				m_CabsFirst = GetNumCabs(first);
			}
		}	
		return result;
	}
	
	bool ShowDriverIfNeed(bool direction)
	{
		Vehicle[] vehicles = GetMyTrain().GetVehicles();
		Vehicle v;
		CyriScriptSecondary s;
		bool newDriverShowed = m_driverShowed,
			 newShowInCab1 = m_showInCab1,
			 newShowInCab2 = m_showInCab2;
		int cabs;
		int i, len = vehicles.size();
		for (i = 0; i < len; i++)
		{
			v = vehicles[i];
//Print("i="+i+",v="+v.GetName()+",v == me:"+(v == me));
			if (v == me)
			{
				newDriverShowed = true;
				if (m_CabsMy == 2)
				{
					if (direction)
					{
						newShowInCab1 = true;
						SetMeshVisible("conductor-0", true, 0.0);
						SetMeshVisible("conductor-1", false, 0.0);
						SetMeshVisible("conductor-2", true, 0.0);
						SetMeshVisible("conductor-3", false, 0.0);
//Print(2, direction, 20);	
					}
					else
					{
						newShowInCab2 = true;
						SetMeshVisible("conductor-0", false, 0.0);
						SetMeshVisible("conductor-1", true, 0.0);
						SetMeshVisible("conductor-2", false, 0.0);
						SetMeshVisible("conductor-3", true, 0.0);
//Print(2, direction, 21);	
					}
				}
				else
				{
					SetMeshVisible("display-0-off", false, 0.0);
					SetMeshVisible("display-0-on", true, 0.0);
					SetMeshVisible("conductor-0", true, 0.0);
					SetMeshVisible("conductor-2", true, 0.0);
//Print(2, direction, 22);	
				}
				break;
			}
			else if (v.isclass(CyriScriptSecondary))
			{
				s = cast<CyriScriptSecondary>(v);
				cabs = s.GetMyCabs();
				if (cabs != 0) 
				{
////Print("!!!!!:"+v.GetName()+",my:"+GetName()+"f="+vehicles[0].GetName());
					newShowInCab1 = newShowInCab2 = newDriverShowed = false;
					SetMeshVisible("display-0-off", true, 0.0);
					SetMeshVisible("display-0-on", false, 0.0);
					
					SetMeshVisible("conductor-0", false, 0.0);
					SetMeshVisible("conductor-1", false, 0.0);			
					SetMeshVisible("conductor-2", false, 0.0);
					SetMeshVisible("conductor-3", false, 0.0);	
////Print(2, direction, 23);	
					break;					
				}
			}
		}

		bool res = (newDriverShowed != m_driverShowed or newShowInCab1 != m_showInCab1 or newShowInCab2 != m_showInCab2);
		if (res)
		{
			m_driverShowed = newDriverShowed;
			m_showInCab1 = newShowInCab1;
			m_showInCab2 = newShowInCab2;
		}
		return res;
	}
	
	void SetFrontlights(bool light)
	{
//Print("SetFrontlights:"+light);
		Asset texture;
		if (light)  texture = k_reds01;
		else		texture = null;
		SetFXCoronaTexture ("frontlight-0",texture);
		SetFXCoronaTexture ("frontlight-1",texture);
		SetFXCoronaTexture ("frontlight-2",texture);
		SetFXCoronaTexture ("frontlight-3",texture);
		SetFXCoronaTexture ("frontlight-4",texture);
		SetFXCoronaTexture ("frontlight-5",texture);
		SetFXCoronaTexture ("frontlight-6",texture);
		SetFXCoronaTexture ("frontlight-7",texture);
	}
	
	void SetBacklights(bool light)
	{
		Asset texture;
		if (light)  texture = k_reds01;
		else		texture = null;
		SetFXCoronaTexture ("backlight-0",texture);
		SetFXCoronaTexture ("backlight-1",texture);
		SetFXCoronaTexture ("backlight-2",texture);
		SetFXCoronaTexture ("backlight-3",texture);
		SetFXCoronaTexture ("backlight-4",texture);
		SetFXCoronaTexture ("backlight-5",texture);
		SetFXCoronaTexture ("backlight-6",texture);
		SetFXCoronaTexture ("backlight-7",texture);
	}
	
	void SetFHDlight(bool light)
	{
//Print("SetFHDlight:"+light+",reverser="+GetEngineSetting("reverser")+",Beams="+GetMyTrain().GetHighBeams());
		bool light1 = false;
		if (light)
		{
			if (!m_simpleMode and GetEngineSetting("reverser") != REVERSER_FORWARD) light = false;
			else if (GetMyTrain().GetHighBeams()) 				  light1 = light;
		}
		Asset texture, texture1;
		if (k_hlight01)
		{
			if (light)  texture = k_hlight01;
			else		texture = null;
			if (light1) texture1 = k_hlight01;
			else		texture1 = null;
			SetFXCoronaTexture ("fwhdlight-0",texture);
			SetFXCoronaTexture ("fwhdlight-1",texture);
			SetFXCoronaTexture ("fwhdlight-2",texture);
			SetFXCoronaTexture ("fwhdlight-3",texture);
			SetFXCoronaTexture ("fwhdlight-4",texture1);
			SetFXCoronaTexture ("fwhdlight-5",texture1);
			SetFXCoronaTexture ("fwhdlight-6",texture1);
			SetFXCoronaTexture ("fwhdlight-7",texture1);
		}
		if (k_hlight02)
		{
			if (light)  texture = k_hlight02;
			else		texture = null;
			if (light1) texture1 = k_hlight02;
			else		texture1 = null;
			SetFXCoronaTexture ("fbhdlight-0",texture);
			SetFXCoronaTexture ("fbhdlight-1",texture);
			SetFXCoronaTexture ("fbhdlight-2",texture);
			SetFXCoronaTexture ("fbhdlight-3",texture);
			SetFXCoronaTexture ("fbhdlight-4",texture1);
			SetFXCoronaTexture ("fbhdlight-5",texture1);
			SetFXCoronaTexture ("fbhdlight-6",texture1);
			SetFXCoronaTexture ("fbhdlight-7",texture1);
		}
	}
	
	void SetBHDlight(bool light)
	{
		bool light1 = false;
		if (light)
		{
			if (GetEngineSetting("reverser") != REVERSER_FORWARD) light = false;
			else if (GetMyTrain().GetHighBeams()) 				  light1 = light;
		}
		Asset texture, texture1;
		if (k_hlight01)
		{
			if (light)  texture = k_hlight01;
			else		texture = null;
			if (light1) texture1 = k_hlight01;
			else		texture1 = null;
			SetFXCoronaTexture ("bwhdlight-0",texture);
			SetFXCoronaTexture ("bwhdlight-1",texture);
			SetFXCoronaTexture ("bwhdlight-2",texture);
			SetFXCoronaTexture ("bwhdlight-3",texture);
			SetFXCoronaTexture ("bwhdlight-4",texture1);
			SetFXCoronaTexture ("bwhdlight-5",texture1);
			SetFXCoronaTexture ("bwhdlight-6",texture1);
			SetFXCoronaTexture ("bwhdlight-7",texture1);
		}
		if (k_hlight02)
		{
			if (light)  texture = k_hlight02;
			else		texture = null;
			if (light1) texture1 = k_hlight02;
			else		texture1 = null;
			SetFXCoronaTexture ("bbhdlight-0",texture);
			SetFXCoronaTexture ("bbhdlight-1",texture);
			SetFXCoronaTexture ("bbhdlight-2",texture);
			SetFXCoronaTexture ("bbhdlight-3",texture);
			SetFXCoronaTexture ("bbhdlight-4",texture1);
			SetFXCoronaTexture ("bbhdlight-5",texture1);
			SetFXCoronaTexture ("bbhdlight-6",texture1);
			SetFXCoronaTexture ("bbhdlight-7",texture1);
		}
	}
	
	void PerformDisc() 
	{		
		int pos = m_Pos;
		bool direction = GetDirectionRelativeToTrain();
		Train train = GetMyTrain();
		bool headlight = train.GetHeadlightState(),
			 beams = train.GetHighBeams();
		bool revForward;
		
		if (!m_simpleMode) 
		{			
			revForward = GetEngineSetting("reverser") == REVERSER_FORWARD;
			if (me == train.GetFrontmostLocomotive())
			{
				if (headlight)
				{
					if (!(m_electro and m_fary))
					{
						headlight = false;
						train.SetHeadlightState(false);
					}
				}
				else if (m_fary and m_electro)
				{
					headlight = true;
					train.SetHeadlightState(revForward);
				}
			}
		}
		
		SetFHDlight(false);
		SetBHDlight(false);
		SetFrontlights(false);
		if (m_CabsMy == 2) SetBacklights(false);
		
		if (!m_electro) 
		{
			SetMeshVisible("display-0-off", true, 0.0);
			SetMeshVisible("display-0-on", false, 0.0);
			return;
		}
			 		
		if (m_CabsMy != 0)
		{
			SetMeshVisible("display-0-off", true, 0.0);
			SetMeshVisible("display-0-on", false, 0.0);
		}
		
		if (pos == 0) //один вагон
		{
			if(headlight)
			{
				SetMeshVisible("display-0-off", false, 0.0);
				SetMeshVisible("display-0-on",  true,  0.0);
			}
			else
			{
				SetMeshVisible("display-0-off", true,  0.0);
				SetMeshVisible("display-0-on",  false, 0.0);
			}
			if (direction)
			{
				if (m_CabsMy == 2) SetBacklights(headlight);
				SetFrontlights((m_simpleMode and m_electro and !headlight) or (!m_simpleMode and !revForward and headlight));
				if (m_hasHdlight)  SetFHDlight(headlight);
			}
			else
			{
				SetFrontlights(headlight);
				if (m_CabsMy == 2)	SetBacklights((m_simpleMode and m_electro and !headlight) or (!m_simpleMode and !revForward and headlight));
				if (m_hasHdlight)	SetBHDlight(headlight);
			}
			//SetDiscAttach(0,false);
			//SetDiscAttach(1,false);
		}
		else if (pos == 1) //первый вагон
		{
			if (direction)
			{
				if (m_hasHdlight) SetFHDlight(headlight);
				SetFrontlights((m_simpleMode and m_electro and !headlight) or (!m_simpleMode and !revForward and headlight));
				if (m_CabsMy == 1)
				{
					if (m_CabsLast == 2)
					{
						SetMeshVisible("display-0-off", true, 0.0);
						SetMeshVisible("display-0-on", false, 0.0);
//Print(pos, direction, 6);	
					}
					else
					{
						if (headlight)
						{
							SetMeshVisible("display-0-off", false, 0.0);
							SetMeshVisible("display-0-on", true, 0.0);
						}
						else
						{
							SetMeshVisible("display-0-off", true, 0.0);
							SetMeshVisible("display-0-on", false, 0.0);
						}
//Print(pos, direction, 7);	
					}
				}
				//SetDiscAttach(0,false);
				//SetDiscAttach(1,true);
			}
			else
			{
				SetBHDlight(headlight);
				if (m_CabsMy == 2) SetBacklights(!revForward and headlight);
				if (m_CabsMy == 1)
				{					
					if (m_CabsLast == 2)
					{
						SetMeshVisible("display-0-off", true, 0.0);
						SetMeshVisible("display-0-on", false, 0.0);
					}
					else
					{
						if (headlight)
						{
							SetMeshVisible("display-0-off", false, 0.0);
							SetMeshVisible("display-0-on", true, 0.0);
						}
						else
						{
							SetMeshVisible("display-0-off", true, 0.0);
							SetMeshVisible("display-0-on", false, 0.0);
						}
					}
				}
				//SetDiscAttach(0,true);
				//SetDiscAttach(1,false);
			}
		}
		else if (pos == 2) //промежуточный вагон
		{
			SetFrontlights(false);
			if (m_CabsMy == 2) SetBacklights(false);
			SetFHDlight(false);
			SetBHDlight(false);
			if (m_CabsFirst or m_CabsLast)
			{				
				SetMeshVisible("display-0-off", true, 0.0);
				SetMeshVisible("display-0-on", false, 0.0);
			}
			//SetDiscAttach(0,true);
			//SetDiscAttach(1,true);
		}
		else if (pos == 3) //последний вагон
		{
			if (m_CabsFirst == 0)
			{
				if(headlight)
				{
					SetMeshVisible("display-0-off", false, 0.0);
					SetMeshVisible("display-0-on", true, 0.0);
				}
				else
				{
					SetMeshVisible("display-0-off", true, 0.0);
					SetMeshVisible("display-0-on", false, 0.0);
				}
			}
			else
			{
				SetMeshVisible("display-0-off", true, 0.0);
				SetMeshVisible("display-0-on", false, 0.0);
			}
//			Print("PerformDisc:direction="+direction+",headlight="+headlight+",m_simpleMode="+m_simpleMode+",m_fary="+m_fary);	
			if (direction)
			{
				if (m_hasHdlight) SetFHDlight(headlight);
				if (m_CabsMy == 2) SetBacklights(m_electro and (m_simpleMode or m_fary));
				//SetDiscAttach(0,true);
				//SetDiscAttach(1,false);
			}
			else
			{
				if (m_hasHdlight) SetBHDlight(headlight);
				SetFrontlights(m_electro and (m_simpleMode or m_fary));
				//SetDiscAttach(0,false);
				//SetDiscAttach(1,true);
			}
		}
	}
	
	void ShowDriver()
	{
		int pos = m_Pos;
		bool direction = GetDirectionRelativeToTrain();
		Train train = GetMyTrain();
		bool showDriver = (m_showDriver and m_hasDriver and m_CabsMy != 0);
		bool newDriverShowed = m_driverShowed,
			 newShowInCab1 = m_showInCab1,
			 newShowInCab2 = m_showInCab2,
			 changedShow = false;
			 		
		if (!showDriver and m_CabsMy != 0)
		{
			newShowInCab1 = newShowInCab2 = newDriverShowed = false;
			SetMeshVisible("conductor-0", false, 0.0);
			SetMeshVisible("conductor-1", false, 0.0);			
			SetMeshVisible("conductor-2", false, 0.0);
			SetMeshVisible("conductor-3", false, 0.0);	
		}		
		if (pos == 0) //один вагон
		{
			if (showDriver and m_CabsMy == 1)
			{
				newDriverShowed = true;
				SetMeshVisible("conductor-0", true, 0.0);
				SetMeshVisible("conductor-2", true, 0.0);
//Print(pos, direction, 2);	
			}
			if (direction)
			{
				if (showDriver and m_CabsMy == 2)
				{
					newDriverShowed = newShowInCab1 = true;
					SetMeshVisible("conductor-0", true, 0.0);
					SetMeshVisible("conductor-1", false, 0.0);
					SetMeshVisible("conductor-2", true, 0.0);
					SetMeshVisible("conductor-3", false, 0.0);
//Print(pos, direction, 3);	
				}
			}
			else
			{
				if (showDriver and m_CabsMy == 2)
				{
					newDriverShowed = newShowInCab2 = true;
					SetMeshVisible("conductor-0", false, 0.0);
					SetMeshVisible("conductor-1", true, 0.0);
					SetMeshVisible("conductor-2", false, 0.0);
					SetMeshVisible("conductor-3", true, 0.0);
//Print(pos, direction, 4);	
				}
			}
		}
		else if (pos == 1) //первый вагон
		{
			if (direction)
			{
				if (showDriver)
				{										
					if (m_CabsMy == 2)
					{
						newDriverShowed = newShowInCab1 = true;
						SetMeshVisible("conductor-0", true, 0.0);
						SetMeshVisible("conductor-1", false, 0.0);
						SetMeshVisible("conductor-2", true, 0.0);
						SetMeshVisible("conductor-3", false, 0.0);
//Print(pos, direction, 5);	
					}
					else if (m_CabsMy == 1)
					{
						if (m_CabsLast == 2)
						{
							newDriverShowed = false;
							SetMeshVisible("display-0-off", true, 0.0);
							SetMeshVisible("display-0-on", false, 0.0);
							SetMeshVisible("conductor-0", false, 0.0);
							SetMeshVisible("conductor-2", false, 0.0);							
//Print(pos, direction, 6);	
						}
						else
						{
							newDriverShowed = true;
							SetMeshVisible("conductor-0", true, 0.0);
							SetMeshVisible("conductor-2", true, 0.0);														
//Print(pos, direction, 7);	
						}
					}
				}
			}
			else
			{
				if (showDriver)
				{
					if (m_CabsMy == 2)
					{				
						newDriverShowed = newShowInCab2 = true;
						SetMeshVisible("conductor-0", false, 0.0);
						SetMeshVisible("conductor-1", true, 0.0);
						SetMeshVisible("conductor-2", false, 0.0);
						SetMeshVisible("conductor-3", true, 0.0);
//Print(pos, direction, 8);	
					}
					else if (m_CabsMy == 1)
					{					
						if (m_CabsLast == 2)
						{
							newDriverShowed = false;
							SetMeshVisible("conductor-0", false, 0.0);
							SetMeshVisible("conductor-2", false, 0.0);							
//Print(pos, direction, 9);	
						}
						else
						{
							newDriverShowed = true;
							SetMeshVisible("conductor-0", true, 0.0);
							SetMeshVisible("conductor-2", true, 0.0);														
//Print(pos, direction, 10);	
						}						
					}
				}
			}
		}
		else if (pos == 2) //промежуточный вагон
		{
			if (showDriver)
			{
				if (m_CabsFirst or m_CabsLast)
				{				
					newDriverShowed = newShowInCab2 = newShowInCab1 = false;
					SetMeshVisible("conductor-0", false, 0.0);
					SetMeshVisible("conductor-1", false, 0.0);
					SetMeshVisible("conductor-2", false, 0.0);
					SetMeshVisible("conductor-3", false, 0.0);
//Print(pos, direction, 11);	
				}
				else 
				{
					changedShow = ShowDriverIfNeed(direction);
				}				
			}
		}
		else if (pos == 3) //последний вагон
		{
			if (showDriver and m_CabsMy == 1)
			{
				if (m_CabsFirst == 0)
				{
					newDriverShowed = true;
					SetMeshVisible("conductor-0", true, 0.0);
					SetMeshVisible("conductor-2", true, 0.0);
//Print(pos, direction, 12);	
				}
				else
				{
					newDriverShowed = false;
					SetMeshVisible("conductor-0", false, 0.0);
					SetMeshVisible("conductor-2", false, 0.0);
//Print(pos, direction, 13);	
				}
			}
			if (direction)
			{
				if (showDriver)
				{
					if (m_CabsMy == 2)
					{
						if (m_CabsFirst == 2)
						{
							newDriverShowed = newShowInCab1 = newShowInCab2 = false;
							SetMeshVisible("conductor-0", false, 0.0);
							SetMeshVisible("conductor-1", false, 0.0);
							SetMeshVisible("conductor-2", false, 0.0);
							SetMeshVisible("conductor-3", false, 0.0);
//Print(pos, direction, 14);	
						}
						else
						{
							newDriverShowed = newShowInCab1 = true;
							SetMeshVisible("conductor-0", true, 0.0);
							SetMeshVisible("conductor-1", false, 0.0);
							SetMeshVisible("conductor-2", true, 0.0);
							SetMeshVisible("conductor-3", false, 0.0);
//Print(pos, direction, 15);	
						}
					}
				}
			}
			else
			{
				if (showDriver)
				{
					if (m_CabsMy == 2)
					{
						if (m_CabsFirst == 2)
						{
							newDriverShowed = newShowInCab1 = newShowInCab2 = false;
							SetMeshVisible("conductor-0", false, 0.0);
							SetMeshVisible("conductor-1", false, 0.0);
							SetMeshVisible("conductor-2", false, 0.0);
							SetMeshVisible("conductor-3", false, 0.0);
//Print(pos, direction, 16);	
						}
						else
						{
							newDriverShowed = newShowInCab2 = true;
							SetMeshVisible("conductor-0", false, 0.0);
							SetMeshVisible("conductor-1", true, 0.0);
							SetMeshVisible("conductor-2", false, 0.0);
							SetMeshVisible("conductor-3", true, 0.0);
//Print(pos, direction, 17);	
						}
					}
				}
			}
		}		
		if (changedShow or newDriverShowed != m_driverShowed or newShowInCab1 != m_showInCab1 or newShowInCab2 != m_showInCab2)
		{
			m_driverShowed = newDriverShowed;
			m_showInCab1 = newShowInCab1;
			m_showInCab2 = newShowInCab2;
			PostMessage(me,"SS","Wipers",0.5);		
		}		
	}
	
	void SetDisc()
	{
		Train train = me.GetMyTrain();
		if (train != null)
		{
			int pos = GetMyPosition(train);
			if (pos != m_Pos)
			{
				m_Pos = pos;
				ShowDriver();
			}
			PerformDisc();
		}
	}
	
	thread void DiscMonitorThread() 
	{	
//Print("DiscMonitorThread:"+m_electro);
		int n = 0;
		while (m_electro and !DeRailed)
		{
			SetDisc();	
			Sleep(0.5);
			if (m_main and ++n >= 240)
			{
				n = 0;
				m_main = !GetMainVehicle();
			}
		}
	}
		
	thread void MonStart(void) 
	{
		Message	msg;
		DeRailed = false;
	
		while (!DeRailed)		
		{
			wait()
			{
				on "Vehicle", "Derailed", msg:
				{
					if (msg.src == me)
					{
						DeRailed = true;
					}
				}
			}
		}
	}
		
	float sin(float x)
	{
		int a= (int)(x/(2*Math.PI));
		x=x-2*a*Math.PI;
		a=1;
		if(Math.PI<x and x<=2*Math.PI)
		{
			x=x-Math.PI;
			a=-a;
		}
		if(Math.PI/2<x and x<=Math.PI)
		{
			x=Math.PI-x;
		}
		return a*(x-x*x*x/6+x*x*x*x*x/120-x*x*x*x*x*x*x/5040+x*x*x*x*x*x*x*x*x/362880);
	}	
		
	thread void StartFans()
	{
		m_fansState = 0;
		
		int i;
		float speed = 0.2;

		StartMeshAnimationLoop("fans");
		
		for (i = 0; i < 10; i++)
		{
			SetMeshAnimationSpeed("fans", speed);
			Sleep(0.2);			
			speed = speed + 0.2;
		}		
		
		SetMeshAnimationSpeed("fans", 2.0);		
		m_fansState = 1;
	}

	thread void StopFans()
	{		
		m_fansState = 0;
		
		int i;
		float speed = 2.0;
				
		for (i = 0; i < 10; i++)
		{
			SetMeshAnimationSpeed("fans", speed);
			Sleep(0.4);			
			speed = speed - 0.2;
		}		
		
		StopMeshAnimation("fans");		
		m_fansState = -1;
	}	
	
	thread void K_loop1()
	{
		if (m_electro and (m_hasFans or m_hasBelight or m_hasLine))
		{
			bool headlight;	
			float speed;
			while (m_electro)
			{
				speed = Math.Fabs(GetVelocity())*3.6;				
				if (m_hasFans and m_fansState == -1) StartFans();
				if (m_hasLine) StartMeshAnimationLoop("line");
				if (m_hasBelight)
				{
					Sleep( Math.Rand(0.0, 0.5) );
					if (speed > 3) 
					{
						SetFXCoronaTexture("leftstop-0", null);
						SetFXCoronaTexture("rightstop-0", null);
					}
					else 
					{
						SetFXCoronaTexture("leftstop-0", k_orange01 );
						SetFXCoronaTexture("rightstop-0", k_orange01 );
					}
				}
				Sleep(2);
			}		
			if (m_hasFans and m_fansState == 1) StopFans();
			if (m_hasLine) 
			{
				StopMeshAnimation("line");
				SetMeshAnimationFrame("line",1.0);
			}
			if (m_hasBelight)
			{
				SetFXCoronaTexture("leftstop-0", null );
				SetFXCoronaTexture("rightstop-0", null );
			}
		}
		if (m_hasBelight)
		{
			SetFXCoronaTexture("leftstop-0", null );
			SetFXCoronaTexture("rightstop-0", null );
		}
	}
	
	thread void DeclinationLoopThread()
	{
		float R_level=0;
		float J_level=0;
		float speed;
		Bogey[] bog_l=  GetBogeyList();

		while (m_electro)
		{
			speed = Math.Fabs(GetVelocity())*3.6;				
			if (speed > 30)
			{
				if (m_curDeclination != m_maxDeclination)
				{
					m_curDeclination = m_curDeclination + m_deltaDeclination;
					if (m_curDeclination > m_maxDeclination) m_curDeclination = m_maxDeclination;
					SetRollBasedOnTrack(-m_curDeclination);
				}
			}
			else if (speed < 25)
			{
				if (m_curDeclination != 0)
				{
					m_curDeclination = m_curDeclination - m_deltaDeclination;
					if (m_curDeclination < 0) m_curDeclination = 0;
					SetRollBasedOnTrack(-m_curDeclination);
				}					
			}
										
			if (World.GetCurrentTrain() == GetMyTrain())
			{						
				if (speed > 20)
				{
					float maxAmpl=0.7*Math.Fmin(0.00020*(speed-20),sway01);
					R_level=R_level+Math.PI*Math.Rand(sway02,sway03);
					int a= (int)(R_level/(2*Math.PI));
					R_level=R_level-2*a*Math.PI;

					float value1=maxAmpl* sin(R_level);

					SetMeshOrientation("default",0,value1,0);
					bog_l[0].SetMeshOrientation("default",0,-value1,0);
					bog_l[1].SetMeshOrientation("default",0,-value1,0);
						
					J_level=J_level+Math.PI*Math.Rand(sway04,sway05);
					a= (int)(J_level/(2*Math.PI));
					J_level=J_level-2*a*Math.PI;

					maxAmpl=maxAmpl*1.2;

					value1=maxAmpl*sin(J_level);
					SetMeshTranslation("default",0,0,value1);
					bog_l[0].SetMeshTranslation("default",0,0,-value1);
					bog_l[1].SetMeshTranslation("default",0,0,-value1);
				}
			}

			Sleep(0.05);
		}		
	}
	
	thread void IntLight()
	{
		while (m_electro)
		{
			if (World)
			{				
				bool headlight;
				float time = World.GetGameTime();				
				
				if (m_simpleMode) headlight = GetMyTrain().GetHeadlightState();
				else 			  headlight = m_salon;				
				
				if (headlight and m_electro)
				{
					SetMeshVisible("display-1-off", false, 0.0);
					SetMeshVisible("display-1-on", true, 0.0);
					Sleep(1.0 + Math.Rand(0.0, 0.5));	
					if (time>0.75 or time<0.26)
					{
						SetTextureSelfIllumination("int01",0.05,0.05,0.05);
						SetTextureSelfIllumination("int02",0.05,0.05,0.05);
						SetTextureSelfIllumination("int03",0.05,0.05,0.05);
						SetTextureSelfIllumination("int04",0.05,0.05,0.05);
						SetTextureSelfIllumination("int05",0.05,0.05,0.05);
					}
					else 
					{	
						SetTextureSelfIllumination("int01",0.25,0.25,0.25);
						SetTextureSelfIllumination("int02",0.25,0.25,0.2);
						SetTextureSelfIllumination("int03",0.30,0.30,0.2);
						SetTextureSelfIllumination("int04",0.25,0.25,0.15);
						SetTextureSelfIllumination("int05",0.2,0.2,0.2);				
					}
				}
				else
				{
					Sleep(1);
					SetMeshVisible("display-1-off", true, 0.0);
					SetMeshVisible("display-1-on", false, 0.0);
					SetTextureSelfIllumination("int01",-0.1,-0.1,-0.1);
					SetTextureSelfIllumination("int02",-0.1,-0.1,-0.1);
					SetTextureSelfIllumination("int03",-0.1,-0.1,-0.1);
					SetTextureSelfIllumination("int04",-0.1,-0.1,-0.1);
					SetTextureSelfIllumination("int05",-0.1,-0.1,-0.1);
				}
			}
			else
			{
				Sleep(5);
			}
		}
		
		SetMeshVisible("display-1-off", true, 0.0);
		SetMeshVisible("display-1-on", false, 0.0);
		SetTextureSelfIllumination("int01",-0.1,-0.1,-0.1);
		SetTextureSelfIllumination("int02",-0.1,-0.1,-0.1);
		SetTextureSelfIllumination("int03",-0.1,-0.1,-0.1);
		SetTextureSelfIllumination("int04",-0.1,-0.1,-0.1);
		SetTextureSelfIllumination("int05",-0.1,-0.1,-0.1);		
	}
	
	void InitDriver()
	{
		m_showDriver = true;
		if (World.GetCurrentModule() == World.SURVEYOR_MODULE) m_hasDriver = true;
		else	InitHasDriver();
	}
	
	void ModuleInitHandler(Message msg) 
	{
		InitDriver();
	}
	//======= Cabin Commands =================================================================================
	void OnCabinCommand(GameObject src, string cmd)
	{
		Print("OnCabinCommand:"+cmd);

		if (cmd == "Open_left" or cmd == "Open_right" or (cmd != "Close_right" and TrainUtil.HasPrefix(cmd, "Close"))) //Проверка на "Close" - для совместимости
		{
		Print("OnCabinCommand::SetDoors");
			Strings[0] = "SetDoors";
			Strings[1] = cmd;
			A.LibraryCall("Message",Strings,Objects);
		}
		else if (cmd == "simple_on")  m_simpleMode = true;
		else if (cmd == "simple_off") m_simpleMode = false;
		else if (cmd == "electro_on")	SetElectroSupply(true);
		else if (cmd == "electro_off")	SetElectroSupply(false);
		else if (cmd == "fary_on")	  m_fary = true;
		else if (cmd == "fary_off")   m_fary = false;
		else if (cmd == "salon_on")	  m_salon = true;
		else if (cmd == "salon_off")  m_salon = false;
		else if (cmd == "driver_on")  ShowDriver(true);
		else if (cmd == "driver_off") ShowDriver(false);
	}

	void OnCabinCommand(Message msg)
	{		
		/*
		string[] commands = Str.Tokens(msg.minor, "^");
		int i, len = commands.size();
		for (i = 0; i < len; i++)
			OnCabinCommand(commands[i]);
		*/

Interface.Print("OnCabinCommand:msg.minor="+msg.minor);

		OnCabinCommand(msg.src, msg.minor);
	}
	//======= TABLO ==========================================================================================
	void ShowLastStation(Message msg)
	{
		m_showLastStation = (bool)Str.ToInt(msg.minor);
	}

	void SetTablo(Message msg)
	{
		if (!m_main)
		{
			CyriScriptSecondary v = GetMainVehicle();
			if (v) 
			{
				v.SetTablo(msg);
				return;
			}
			m_main = true;
			TabloMonitor();
		}
		
		if (!m_electro) return;
		
		m_tabloSet = true;
		string 	value = msg.minor,
				pref = value[0,5];
		bool   	next = (pref == "next_"),
				till = !next and (pref == "till_"),
				advt = !next and !till and (pref == "advt_");

//Interface.Print("SetTablo:value="+value+",next="+next+",till="+till+",pref == 'till_':"+(pref == "till_"));				
		if (advt)
		{
			m_advertString = value[5, value.size()];
		}
		else if (next)
		{
			m_nextStation = value[5, value.size()];						
			m_curStation = null;
		}
		else
		{
			if (till)
			{
				m_lastStation = value[5, value.size()];
				MainTabloMonitor(++m_mainTabloMonitor, m_lastStation);
			}
			else
			{
				m_nextStation = null;
				m_curStation = value;
			}
		}
		m_tabloSet = false;
		m_tabloCommand = true;
	}	
	
	string CreateTabloValue(string value, bool staticMode, StringTable st, string ruKey, string enKey)
	{
		string res;
		if (value[0] < 0) 	
		{
			if (staticMode) res = st.GetString(ruKey) + "^" + value;
			else 			res = st.GetString(ruKey) + value;
		}
		else
		{
			
			if (staticMode) res = st.GetString(enKey) + "^" + value;
			else 			res = st.GetString(enKey) + value;
		}
		return res;
	}
	
	int InitTabloCalculator(StringTable st, TabloCalculator tablo)
	{
		int state;

		if (m_curStation)
		{
			tablo.Init(m_curStation, true);
			state = TabloState.Permanent;
		}
		else if (m_nextStation)
		{				
			if (m_staticTablo)	state = TabloState.Static;
			else				state = TabloState.Dynamic;
			string[] values = Str.Tokens(m_nextStation, "^");
			string value = CreateTabloValue(values[0], state == TabloState.Static, st, "next_station", "next_station_en");
			if (values.size() > 1)
				value = value + "^" + CreateTabloValue(values[1], state == TabloState.Static, st, "next_station", "next_station_en");
			if (m_showLastStation)
			{
				if (m_lastStation)
				{
					values = Str.Tokens(m_lastStation, "^");
					value = value + "^" + CreateTabloValue(values[0], state == TabloState.Static, st, "last_station", "last_station_en");
					if (values.size() > 1)
						value = value + "^" + CreateTabloValue(values[1], state == TabloState.Static, st, "last_station", "last_station_en");
				}
			}			
			string advertisment = m_advertString;
			if (advertisment != "")
				value = value + "^" + advertisment;
			
			tablo.Init(value, m_staticTablo);
		}
		else if (m_advertString and m_advertString != "")
		{
			if (m_staticTablo)	state = TabloState.Static;
			else				state = TabloState.Dynamic;
			tablo.Init(m_advertString, m_staticTablo);
		}
		else
		{
			state = TabloState.Time;
		}
		
		m_tabloCommand = false;
		
//Interface.Print("InitTabloCalculator: cur="+cur+",next="+next+",last="+last+",state="+state);

		return state;
	}
	
	void SetMainTablo(Vehicle v, string value)
	{
		v.SetFXNameText("dest-0", value);
	}
	
	thread void MainTabloMonitor(int n, string destination)
	{
		if (!destination) destination = " ";
		Vehicle[] vehicles = me.GetMyTrain().GetVehicles();
		Vehicle v1 = vehicles[0], v2 = vehicles[vehicles.size()-1];
		vehicles = null;
		string[] values = Str.Tokens(destination, "^");
		string value;
		int index = 0, len = values.size();
		if (len == 0) return;
		if (!m_mainTabloElectro or !m_electro or len == 1)
		{
			SetMainTablo(v1, values[0]);
			SetMainTablo(v2, values[0]);
			return;
		}		
		while (m_electro and m_mainTabloMonitor == n)
		{
			value = values[index++];
			SetMainTablo(v1, value);
			SetMainTablo(v2, value);
			if (index == len) index = 0;
			Sleep(5);
		}
	}
	
	thread void TabloMonitor()
	{
		if (!m_main) return;
		m_tabloCommand = true;
		float timer;
		int baseState = TabloState.None;
		int state = TabloState.None;
		StringTable st = A.GetAsset().GetStringTable();
		TabloCalculator tablo = new TabloCalculator();
		tablo.SetMaxLen(m_tabloMaxLen);
		while (m_electro and m_main)
		{
//	Print("TabloMonitor:state="+state+",m_tabloCommand="+m_tabloCommand);
			if (m_tabloCommand and !tablo.IsFinished())	tablo.ForceFinish();			
			
			switch (state)
			{
				case TabloState.Time:
					if (m_tabloCommand)	
					{
						state = TabloState.None;
						continue;						
					}
//	Print("TabloMonitor:showDate");
					TabloHelper.SetTablo(GetMyTrain(), TabloHelper.GetDateTimeString());
					timer = 10;					
					if (state != baseState)
					{
						state = baseState;
						tablo.Continue();
					}
					break;
				case TabloState.Dynamic:
//	string ds = tablo.GetValue();
//	Print("TabloMonitor:show Dynamic:"+ds);
					TabloHelper.SetTablo(GetMyTrain(), tablo.GetValue());
					if (tablo.IsFinished()) 
					{
						timer = 2;
						if (m_tabloCommand)	state = TabloState.None;
						else				state = TabloState.Time;
					}
					else
					{
						timer = 0.1;
					}
					break;
				case TabloState.Static:
//	string ss = tablo.GetValue();
//	Print("TabloMonitor:show Static:"+ss);
					TabloHelper.SetTablo(GetMyTrain(), tablo.GetValue());
					timer = 2;
					if (tablo.IsFinished())
					{
						if (m_tabloCommand)	state = TabloState.None;
						else				state = TabloState.Time;
					}
					break;
				case TabloState.Permanent:
					TabloHelper.SetTablo(GetMyTrain(), tablo.GetValue());
					timer = 2;
					if (tablo.IsFinished())
					{
						if (m_tabloCommand)	state = TabloState.None;
						else				tablo.Continue();
					}
					break;
				default:
					if (m_tabloCommand)
					{
						while (m_tabloSet) Sleep(1);
//	Print("TabloMonitor:InitTabloCalculator");
						baseState = state = InitTabloCalculator(st, tablo);
						continue;
					}
					timer = 5;
					break;
			}
			Sleep(timer);
		}
		
		if (!m_electro)
			TabloHelper.SetTablo(GetMyTrain(), " ");		
	}
	
/*	
	thread void Test()
	{
		string s;
		TabloCalculator tablo = new TabloCalculator();
		tablo.Init("*** Руководство израильского метрополитена имени Ленина поздравляет c новым 2018 годом ***", false, true);
		int i = 0;
		while(true)
		{
			s = tablo.GetValue();
//Interface.Print(s);
			VehicleTabloHelper.SetTablo(GetMyTrain(), s);
			Sleep(0.15);
			if (++i == 2)
			{
				tablo.SetLoop(false);
			}	
		}
	}
*/	
	void InitTablo(Soup extensions)
	{
		AddHandler(me, "ShowLastStation", null, "ShowLastStation");
		AddHandler(me, "SetTablo", null, "SetTablo");
		SetFXNameText("tablo", " ");
		m_tabloMaxLen = extensions.GetNamedTagAsInt("tablo_max_len", 18);
		m_staticTablo = extensions.GetNamedTagAsBool("static_tablo", false);
		TabloMonitor();
	}	
	//========================================================================================================
	public void Init(void) 
	{
		inherited();
		Asset asset = GetAsset();
		A = World.GetLibrary(me.GetAsset().LookupKUIDTable("cyriscript"));
		if (!A) {Exception("Unable to load Code Library <kuid:486576:111>\n\n\n\n\n\n\n\n\n");}
		Train train = GetMyTrain();
		m_main = (me == train.GetFrontmostLocomotive());		
		InitDriver();
		SSSoup = Constructors.NewSoup();
		Objects = new GSObject[3];
		Objects[0] = me;
		Objects[1] = SSSoup;
		Strings = new string[4];
		Soup config = asset.GetConfigSoup();
		Soup extensions = config.GetNamedSoup("extensions");
		m_maxDeclination = Math.Fabs(extensions.GetNamedTagAsFloat("declination"));
		sway01 = Math.Fabs(extensions.GetNamedTagAsFloat("sway01",0.045)); //0.045
		sway02 = Math.Fabs(extensions.GetNamedTagAsFloat("sway02",0.015)); //0.015
		sway03 = Math.Fabs(extensions.GetNamedTagAsFloat("sway03",0.06));  //0.02
		sway04 = Math.Fabs(extensions.GetNamedTagAsFloat("sway04",0.06));  //0.01
		sway05 = Math.Fabs(extensions.GetNamedTagAsFloat("sway05",0.1));   //0.1
		m_deltaDeclination = m_maxDeclination/20.;
		m_CabsMy = GetNumCabs(cast<Vehicle>(me));
		m_Pos = GetMyPosition(train);
		//m_hasFans = HasFans();
		SetMeshData();
		if (m_hasFans)  
		{
			m_fansState = -1;
			StopMeshAnimation("fans");
		}
		else 			
		{
			m_fansState = 0;			
		}		
		if (m_hasTablo) InitTablo(extensions);
		m_mainTabloElectro = extensions.GetNamedTagAsBool("main-tablo-electro", false);		
		//SetRollBasedOnTrack(declination);
		DeclinationLoopThread();
		K_loop1();
		IntLight();
		k_reds01 = asset.FindAsset("reds");		
		m_hasBelight = extensions.GetNamedTagAsBool("brakelight");
		if (m_hasBelight)
		{
			k_orange01 = asset.FindAsset("orange");
		}		
		m_hasHdlight = extensions.GetNamedTagAsBool("headlight");
		if (m_hasHdlight)
		{
			Soup kuids = config.GetNamedSoup("kuid-table");
			if (kuids.GetIndexForNamedTag("hlight-0") >= 0)
				k_hlight01 = asset.FindAsset("hlight-0");
			if (kuids.GetIndexForNamedTag("hlight-1") >= 0)
				k_hlight02 = asset.FindAsset("hlight-1");
		}		
		SetFHDlight(false);
		SetBHDlight(false);
		SetFrontlights(false);
		if (m_CabsMy == 2) SetBacklights(false);		
		//SetDiscAttach(0,false);
		//SetDiscAttach(1,false);
		SetDiscAttachCoupled();
		MonStart();
		DiscMonitorThread();
		SetCabinData(null);
		AddHandler(me, "World", "ModuleInit", "ModuleInitHandler");
		A.LibraryCall("AddHandlers",Strings,Objects);
		PostMessage(me,"SS","Setup",0.0);
		AddHandler(me,"ChangeDestinationSign", null, "ChangeDestinationSign");
		AddHandler(me,"ChangeNumberSign", null, "ChangeNumberSign");
		AddHandler(me,"DriverCharacter","LeftTrain","OnChangeDriver");
		AddHandler(me,"DriverCharacter","BoardedTrain","OnChangeDriver");
		AddHandler(me,"Locomotive","ShowDriver","OnShowDriver");
		AddHandler(me,"Locomotive","HideDriver","OnShowDriver");
		AddHandler(me,"SetProperty", null, "SetProperty");
		AddHandler(me, "DriverModule", "DCC-Panel-Created", "OnDriverModule");
		AddHandler(me, "Vehicle", "Coupled", "OnCoupled");
		AddHandler(me, "Vehicle", "Decoupled", "OnDiscAttach");
		AddHandler(me, "Vehicle", "DiscAttach", "OnDiscAttach");
	Interface.Print("Cyriscript::Init");
		AddHandler(me, "FromCab", null, "OnCabinCommand");
	}	
};