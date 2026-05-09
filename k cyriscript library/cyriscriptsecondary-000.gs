include "Locomotive.gs"

class CyriScriptSecondary isclass Locomotive 
{
	Library A;
	GSObject[] Objects;
	string[] Strings;
	Soup SSSoup;
	Asset	k_reds01;
	Asset	k_orange01;
	Asset k_hlight01;
	Asset k_hlight02;
	bool DeRailed;
	bool derailed = false;
	string destination = "";
	string tablo_dest;
	string number = "";
	Browser ViewDetailsBrowser;
	int  vdb_left = 100;
	int  vdb_right = 340;
	int  vdb_top = 100;
	int  vdb_bottom = 345;
	float m_maxDeclination = 0;
	float m_curDeclination = 0;
	float m_deltaDeclination = 0;
	bool  m_hasDriver; 
	bool  m_showDriver; 
	bool  m_driverShowed; 
	bool  m_showInCab1, m_showInCab2;
	int   m_CabsMy;
	int   m_CabsFirst;
	int   m_CabsLast;
	float sway01 = 0;
	float sway02 = 0;
	float sway03 = 0;
	float sway04 = 0;
	float sway05 = 0;
	int   m_fansState;
	bool  m_hasFans, m_hasLine, m_hasTablo;
	bool  m_hasHdlight, m_hasBelight;
	bool  m_electro = true;	
	
	thread void K_loop(void);
	thread void K_loop1(void);
	thread void IntLight(void);
	thread void DiscMonitor(void);	
	void SetDisc(void);
	
	public bool IsDriverShowed()
	{
		return m_driverShowed;
	}
	
	void ChangeDestinationSign(Message msg) 
	{
		Vehicle[] vehicles = me.GetMyTrain().GetVehicles();
		bool set = (me == vehicles[0] or me == vehicles[vehicles.size()-1]);
		int maxlen = 50;		
		string new_destination;

		if (msg)	new_destination = msg.minor;
		else		new_destination = destination;

		if (new_destination == "") { new_destination = "CyriTRAINZ"; }
		if (new_destination.size() > maxlen) { new_destination = new_destination[,(maxlen - 1)] + "."; }

		if (!m_electro or !set) SetFXNameText("dest-0", " ");
		else					SetFXNameText("dest-0", new_destination);

		destination = tablo_dest = new_destination;
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
	//Interface.Print("SetElectroSupply:"+val);
		m_electro = val;
		//ChangeNumberSign(null);
		//ChangeDestinationSign(null);
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
			K_loop();
			K_loop1();
			IntLight();
			DiscMonitor();
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
		if (msg.minor == "electro")			SetElectroSupply(SSSoup.GetNamedTagAsBool("electromanager"));
		else if (msg.minor == "electro,0")	SetElectroSupply(false);
		else if (msg.minor == "electro,1")	SetElectroSupply(true);
	}
	
	void OnShowDriver(Message msg)
	{		
		m_showDriver = (msg.minor == "ShowDriver");
		if (!m_electro)
			SetDisc();
	}
	
	void OnChangeDriver(Message msg)
	{
		InitHasDriver();
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
		SSSoup.SetNamedTag("exbodymanager",soup.GetNamedTagAsInt("exbodymanager",0));
		SSSoup.SetNamedTag("cleaned",soup.GetNamedTagAsBool("cleaned",false));
		SSSoup.SetNamedTag("interiormanager",soup.GetNamedTagAsInt("interiormanager",0));
		SSSoup.SetNamedTag("advertmanager",soup.GetNamedTagAsInt("advertmanager",0));
		SSSoup.SetNamedTag("drivermanager",soup.GetNamedTagAsInt("drivermanager",0));
		SSSoup.SetNamedTag("registration",soup.GetNamedTagAsInt("registration",0));
		SSSoup.SetNamedTag("registrationg",soup.GetNamedTagAsInt("registrationg",0));
		SSSoup.SetNamedTag("vehicleNumber",soup.GetNamedTag("vehicleNumber"));
		SSSoup.SetNamedTag("vehicleNumberAuto",soup.GetNamedTagAsBool("vehicleNumberAuto"));
		
//Interface.Print("SetProperties:vehicleNumber="+soup.GetNamedTag("vehicleNumber")+",vehicleNumberAuto="+soup.GetNamedTagAsBool("vehicleNumberAuto", true));		

		m_electro = soup.GetNamedTagAsBool("electromanager",true);
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
		soup.SetNamedTag("exbodymanager",SSSoup.GetNamedTagAsInt("exbodymanager"));
		soup.SetNamedTag("cleaned",SSSoup.GetNamedTagAsBool("cleaned"));
		soup.SetNamedTag("interiormanager",SSSoup.GetNamedTagAsInt("interiormanager"));
		soup.SetNamedTag("advertmanager",SSSoup.GetNamedTagAsInt("advertmanager"));
		soup.SetNamedTag("drivermanager",SSSoup.GetNamedTagAsInt("drivermanager"));
		soup.SetNamedTag("registration",SSSoup.GetNamedTagAsInt("registration"));
		soup.SetNamedTag("registrationg",SSSoup.GetNamedTagAsInt("registrationg"));
		soup.SetNamedTag("electromanager",SSSoup.GetNamedTagAsInt("electromanager"));
		soup.SetNamedTag("position",SSSoup.GetNamedTagAsInt("position"));
		soup.SetNamedTag("vehicleNumber",SSSoup.GetNamedTag("vehicleNumber"));
		soup.SetNamedTag("vehicleNumberAuto",SSSoup.GetNamedTagAsBool("vehicleNumberAuto", true));
		
//Interface.Print("GetProperties:vehicleNumber="+SSSoup.GetNamedTag("vehicleNumber")+",vehicleNumberAuto="+SSSoup.GetNamedTagAsBool("vehicleNumberAuto", true));		

		soup.SetNamedTag("destination", destination);
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
	
	int GetMyPosition(Train MyTrain) 
	{
		Vehicle[]	TrainVehiclesArray = MyTrain.GetVehicles();
		int			ArraySize = TrainVehiclesArray.size();
		int		result;
		Vehicle first = TrainVehiclesArray[0];
		Vehicle last  = TrainVehiclesArray[ArraySize-1];

		if (ArraySize == 1)
		{
			result = 0;
		}
		else if (me == first)
		{
			result = 1;
			if (m_CabsMy) m_CabsLast = GetNumCabs(last);		
		}
		else if (me == last)	
		{
			result = 3;
			if (m_CabsMy) m_CabsFirst = GetNumCabs(first);
		}
		else
		{
			result = 2;
			if (m_CabsMy)
			{
				m_CabsLast = GetNumCabs(last);
				m_CabsFirst = GetNumCabs(first);
			}
		}	
		return result;
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
	
	void SetDisc(int pos, bool direction) 
	{		
		SetFXCoronaTexture ("fwhdlight-0",null);
		SetFXCoronaTexture ("fwhdlight-1",null);
		SetFXCoronaTexture ("fwhdlight-2",null);
		SetFXCoronaTexture ("fwhdlight-3",null);
		SetFXCoronaTexture ("fwhdlight-4",null);
		SetFXCoronaTexture ("fwhdlight-5",null);
		SetFXCoronaTexture ("fwhdlight-6",null);
		SetFXCoronaTexture ("fwhdlight-7",null);
		SetFXCoronaTexture ("bwhdlight-0",null);
		SetFXCoronaTexture ("bwhdlight-1",null);
		SetFXCoronaTexture ("bwhdlight-2",null);
		SetFXCoronaTexture ("bwhdlight-3",null);
		SetFXCoronaTexture ("bwhdlight-4",null);
		SetFXCoronaTexture ("bwhdlight-5",null);
		SetFXCoronaTexture ("bwhdlight-6",null);
		SetFXCoronaTexture ("bwhdlight-7",null);
		SetFXCoronaTexture ("fbhdlight-0",null);
		SetFXCoronaTexture ("fbhdlight-1",null);
		SetFXCoronaTexture ("fbhdlight-2",null);
		SetFXCoronaTexture ("fbhdlight-3",null);
		SetFXCoronaTexture ("fbhdlight-4",null);
		SetFXCoronaTexture ("fbhdlight-5",null);
		SetFXCoronaTexture ("fbhdlight-6",null);
		SetFXCoronaTexture ("fbhdlight-7",null);
		SetFXCoronaTexture ("bbhdlight-0",null);
		SetFXCoronaTexture ("bbhdlight-1",null);
		SetFXCoronaTexture ("bbhdlight-2",null);
		SetFXCoronaTexture ("bbhdlight-3",null);
		SetFXCoronaTexture ("bbhdlight-4",null);
		SetFXCoronaTexture ("bbhdlight-5",null);
		SetFXCoronaTexture ("bbhdlight-6",null);
		SetFXCoronaTexture ("bbhdlight-7",null);
		SetFXCoronaTexture ("frontlight-0",null);
		SetFXCoronaTexture ("frontlight-1",null);
		SetFXCoronaTexture ("frontlight-2",null);
		SetFXCoronaTexture ("frontlight-3",null);
		SetFXCoronaTexture ("frontlight-4",null);
		SetFXCoronaTexture ("frontlight-5",null);
		SetFXCoronaTexture ("frontlight-6",null);
		SetFXCoronaTexture ("frontlight-7",null);
		if (m_CabsMy == 2)
		{		
			SetFXCoronaTexture ("backlight-0",null);
			SetFXCoronaTexture ("backlight-1",null);
			SetFXCoronaTexture ("backlight-2",null);
			SetFXCoronaTexture ("backlight-3",null);
			SetFXCoronaTexture ("backlight-4",null);
			SetFXCoronaTexture ("backlight-5",null);
			SetFXCoronaTexture ("backlight-6",null);
			SetFXCoronaTexture ("backlight-7",null);
		}
		if (!m_electro) 
		{
			SetMeshVisible("display-0-off", true, 0.0);
			SetMeshVisible("display-0-on", false, 0.0);
			SetMeshVisible("conductor-0", false, 0.0);
			SetMeshVisible("conductor-1", false, 0.0);			
			SetMeshVisible("conductor-2", false, 0.0);
			SetMeshVisible("conductor-3", false, 0.0);
			return;
		}
		
		bool showDriver = (m_showDriver and m_hasDriver and m_CabsMy != 0);
		bool newDriverShowed = m_driverShowed,
			 newShowInCab1 = m_showInCab1,
			 newShowInCab2 = m_showInCab2,
			 changedShow = false;
			 
		bool headlight = GetMyTrain().GetHeadlightState();
		
		if (!showDriver and m_CabsMy != 0)
		{
			newShowInCab1 = newShowInCab2 = newDriverShowed = false;
			SetMeshVisible("display-0-off", true, 0.0);
			SetMeshVisible("display-0-on", false, 0.0);
			SetMeshVisible("conductor-0", false, 0.0);
			SetMeshVisible("conductor-1", false, 0.0);			
			SetMeshVisible("conductor-2", false, 0.0);
			SetMeshVisible("conductor-3", false, 0.0);	
//Print(pos, direction, 1);	
		}
		
		if (pos == 0)
		{
			if (showDriver and m_CabsMy == 1)
			{
				newDriverShowed = true;
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
				SetMeshVisible("conductor-0", true, 0.0);
				SetMeshVisible("conductor-2", true, 0.0);
//Print(pos, direction, 2);	
			}

			if (direction)
			{
				SetFXCoronaTexture ("frontlight-0",null);
				SetFXCoronaTexture ("frontlight-1",null);
				SetFXCoronaTexture ("frontlight-2",null);
				SetFXCoronaTexture ("frontlight-3",null);
				SetFXCoronaTexture ("frontlight-4",null);
				SetFXCoronaTexture ("frontlight-5",null);
				SetFXCoronaTexture ("frontlight-6",null);
				SetFXCoronaTexture ("frontlight-7",null);
				if (m_CabsMy == 2)
				{				
					SetFXCoronaTexture ("backlight-0",k_reds01);
					SetFXCoronaTexture ("backlight-1",k_reds01);
					SetFXCoronaTexture ("backlight-2",k_reds01);
					SetFXCoronaTexture ("backlight-3",k_reds01);
					SetFXCoronaTexture ("backlight-4",k_reds01);
					SetFXCoronaTexture ("backlight-5",k_reds01);
					SetFXCoronaTexture ("backlight-6",k_reds01);
					SetFXCoronaTexture ("backlight-7",k_reds01);
				}
				
				if (m_hasHdlight)
				{
					if(headlight)
					{
						if(!GetMyTrain().GetHighBeams())
						{
							SetFXCoronaTexture ("fwhdlight-4",null);
							SetFXCoronaTexture ("fwhdlight-5",null);
							SetFXCoronaTexture ("fwhdlight-6",null);
							SetFXCoronaTexture ("fwhdlight-7",null);
							SetFXCoronaTexture ("fbhdlight-4",null);
							SetFXCoronaTexture ("fbhdlight-5",null);
							SetFXCoronaTexture ("fbhdlight-6",null);
							SetFXCoronaTexture ("fbhdlight-7",null);
						}
						else
						{			
							SetFXCoronaTexture ("fwhdlight-4",k_hlight01);
							SetFXCoronaTexture ("fwhdlight-5",k_hlight01);
							SetFXCoronaTexture ("fwhdlight-6",k_hlight01);
							SetFXCoronaTexture ("fwhdlight-7",k_hlight01);
							SetFXCoronaTexture ("fbhdlight-4",k_hlight02);
							SetFXCoronaTexture ("fbhdlight-5",k_hlight02);
							SetFXCoronaTexture ("fbhdlight-6",k_hlight02);
							SetFXCoronaTexture ("fbhdlight-7",k_hlight02);				
						}
						SetFXCoronaTexture ("fwhdlight-0",k_hlight01);
						SetFXCoronaTexture ("fwhdlight-1",k_hlight01);
						SetFXCoronaTexture ("fwhdlight-2",k_hlight01);
						SetFXCoronaTexture ("fwhdlight-3",k_hlight01);
						SetFXCoronaTexture ("fbhdlight-0",k_hlight02);
						SetFXCoronaTexture ("fbhdlight-1",k_hlight02);
						SetFXCoronaTexture ("fbhdlight-2",k_hlight02);
						SetFXCoronaTexture ("fbhdlight-3",k_hlight02);

					}
					else
					{
						SetFXCoronaTexture ("fwhdlight-0",null);
						SetFXCoronaTexture ("fwhdlight-1",null);
						SetFXCoronaTexture ("fwhdlight-2",null);
						SetFXCoronaTexture ("fwhdlight-3",null);
						SetFXCoronaTexture ("fwhdlight-4",null);
						SetFXCoronaTexture ("fwhdlight-5",null);
						SetFXCoronaTexture ("fwhdlight-6",null);
						SetFXCoronaTexture ("fwhdlight-7",null);
						SetFXCoronaTexture ("fbhdlight-0",null);
						SetFXCoronaTexture ("fbhdlight-1",null);
						SetFXCoronaTexture ("fbhdlight-2",null);
						SetFXCoronaTexture ("fbhdlight-3",null);
						SetFXCoronaTexture ("fbhdlight-4",null);
						SetFXCoronaTexture ("fbhdlight-5",null);
						SetFXCoronaTexture ("fbhdlight-6",null);
						SetFXCoronaTexture ("fbhdlight-7",null);
					}
				}
				
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
				SetFXCoronaTexture ("frontlight-0",k_reds01);
				SetFXCoronaTexture ("frontlight-1",k_reds01);
				SetFXCoronaTexture ("frontlight-2",k_reds01);
				SetFXCoronaTexture ("frontlight-3",k_reds01);
				SetFXCoronaTexture ("frontlight-4",k_reds01);
				SetFXCoronaTexture ("frontlight-5",k_reds01);
				SetFXCoronaTexture ("frontlight-6",k_reds01);
				SetFXCoronaTexture ("frontlight-7",k_reds01);
				if (m_CabsMy == 2)
				{
					SetFXCoronaTexture ("backlight-0",null);
					SetFXCoronaTexture ("backlight-1",null);
					SetFXCoronaTexture ("backlight-2",null);
					SetFXCoronaTexture ("backlight-3",null);
					SetFXCoronaTexture ("backlight-4",null);
					SetFXCoronaTexture ("backlight-5",null);
					SetFXCoronaTexture ("backlight-6",null);
					SetFXCoronaTexture ("backlight-7",null);
				}
				
				if (m_hasHdlight)
				{
					if(headlight)
					{
						if(!GetMyTrain().GetHighBeams())
						{
							SetFXCoronaTexture ("bwhdlight-4",null);
							SetFXCoronaTexture ("bwhdlight-5",null);
							SetFXCoronaTexture ("bwhdlight-6",null);
							SetFXCoronaTexture ("bwhdlight-7",null);
							SetFXCoronaTexture ("bbhdlight-4",null);
							SetFXCoronaTexture ("bbhdlight-5",null);
							SetFXCoronaTexture ("bbhdlight-6",null);
							SetFXCoronaTexture ("bbhdlight-7",null);
						}
						else
						{			
							SetFXCoronaTexture ("bwhdlight-4",k_hlight01);
							SetFXCoronaTexture ("bwhdlight-5",k_hlight01);
							SetFXCoronaTexture ("bwhdlight-6",k_hlight01);
							SetFXCoronaTexture ("bwhdlight-7",k_hlight01);
							SetFXCoronaTexture ("bbhdlight-4",k_hlight02);
							SetFXCoronaTexture ("bbhdlight-5",k_hlight02);
							SetFXCoronaTexture ("bbhdlight-6",k_hlight02);
							SetFXCoronaTexture ("bbhdlight-7",k_hlight02);				
						}
						SetFXCoronaTexture ("bwhdlight-0",k_hlight01);
						SetFXCoronaTexture ("bwhdlight-1",k_hlight01);
						SetFXCoronaTexture ("bwhdlight-2",k_hlight01);
						SetFXCoronaTexture ("bwhdlight-3",k_hlight01);
						SetFXCoronaTexture ("bbhdlight-0",k_hlight02);
						SetFXCoronaTexture ("bbhdlight-1",k_hlight02);
						SetFXCoronaTexture ("bbhdlight-2",k_hlight02);
						SetFXCoronaTexture ("bbhdlight-3",k_hlight02);

					}
					else
					{
						SetFXCoronaTexture ("bwhdlight-0",null);
						SetFXCoronaTexture ("bwhdlight-1",null);
						SetFXCoronaTexture ("bwhdlight-2",null);
						SetFXCoronaTexture ("bwhdlight-3",null);
						SetFXCoronaTexture ("bwhdlight-4",null);
						SetFXCoronaTexture ("bwhdlight-5",null);
						SetFXCoronaTexture ("bwhdlight-6",null);
						SetFXCoronaTexture ("bwhdlight-7",null);
						SetFXCoronaTexture ("bbhdlight-0",null);
						SetFXCoronaTexture ("bbhdlight-1",null);
						SetFXCoronaTexture ("bbhdlight-2",null);
						SetFXCoronaTexture ("bbhdlight-3",null);
						SetFXCoronaTexture ("bbhdlight-4",null);
						SetFXCoronaTexture ("bbhdlight-5",null);
						SetFXCoronaTexture ("bbhdlight-6",null);
						SetFXCoronaTexture ("bbhdlight-7",null);
					}
				}
				
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
			SetDiscAttach(0,false);
			SetDiscAttach(1,false);
		}
		else if (pos == 1)
		{
			if (direction)
			{
				if (m_hasHdlight)
				{
					if(headlight)
					{
						if(!GetMyTrain().GetHighBeams())
						{
							SetFXCoronaTexture ("fwhdlight-4",null);
							SetFXCoronaTexture ("fwhdlight-5",null);
							SetFXCoronaTexture ("fwhdlight-6",null);
							SetFXCoronaTexture ("fwhdlight-7",null);
							SetFXCoronaTexture ("fbhdlight-4",null);
							SetFXCoronaTexture ("fbhdlight-5",null);
							SetFXCoronaTexture ("fbhdlight-6",null);
							SetFXCoronaTexture ("fbhdlight-7",null);
						}
						else
						{			
							SetFXCoronaTexture ("fwhdlight-4",k_hlight01);
							SetFXCoronaTexture ("fwhdlight-5",k_hlight01);
							SetFXCoronaTexture ("fwhdlight-6",k_hlight01);
							SetFXCoronaTexture ("fwhdlight-7",k_hlight01);
							SetFXCoronaTexture ("fbhdlight-4",k_hlight02);
							SetFXCoronaTexture ("fbhdlight-5",k_hlight02);
							SetFXCoronaTexture ("fbhdlight-6",k_hlight02);
							SetFXCoronaTexture ("fbhdlight-7",k_hlight02);				
						}
						SetFXCoronaTexture ("fwhdlight-0",k_hlight01);
						SetFXCoronaTexture ("fwhdlight-1",k_hlight01);
						SetFXCoronaTexture ("fwhdlight-2",k_hlight01);
						SetFXCoronaTexture ("fwhdlight-3",k_hlight01);
						SetFXCoronaTexture ("fbhdlight-0",k_hlight02);
						SetFXCoronaTexture ("fbhdlight-1",k_hlight02);
						SetFXCoronaTexture ("fbhdlight-2",k_hlight02);
						SetFXCoronaTexture ("fbhdlight-3",k_hlight02);

					}
					else
					{
						SetFXCoronaTexture ("fwhdlight-0",null);
						SetFXCoronaTexture ("fwhdlight-1",null);
						SetFXCoronaTexture ("fwhdlight-2",null);
						SetFXCoronaTexture ("fwhdlight-3",null);
						SetFXCoronaTexture ("fwhdlight-4",null);
						SetFXCoronaTexture ("fwhdlight-5",null);
						SetFXCoronaTexture ("fwhdlight-6",null);
						SetFXCoronaTexture ("fwhdlight-7",null);
						SetFXCoronaTexture ("fbhdlight-0",null);
						SetFXCoronaTexture ("fbhdlight-1",null);
						SetFXCoronaTexture ("fbhdlight-2",null);
						SetFXCoronaTexture ("fbhdlight-3",null);
						SetFXCoronaTexture ("fbhdlight-4",null);
						SetFXCoronaTexture ("fbhdlight-5",null);
						SetFXCoronaTexture ("fbhdlight-6",null);
						SetFXCoronaTexture ("fbhdlight-7",null);
					}
				}
				
				SetFXCoronaTexture ("frontlight-0",null);
				SetFXCoronaTexture ("frontlight-1",null);
				SetFXCoronaTexture ("frontlight-2",null);
				SetFXCoronaTexture ("frontlight-3",null);
				SetFXCoronaTexture ("frontlight-4",null);
				SetFXCoronaTexture ("frontlight-5",null);
				SetFXCoronaTexture ("frontlight-6",null);
				SetFXCoronaTexture ("frontlight-7",null);
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
							SetMeshVisible("conductor-0", true, 0.0);
							SetMeshVisible("conductor-2", true, 0.0);														
//Print(pos, direction, 7);	
						}
					}
				}
				SetDiscAttach(0,false);
				SetDiscAttach(1,true);
			}
			else
			{
				if (m_hasHdlight)
				{
					if(headlight)
					{
						if(!GetMyTrain().GetHighBeams())
						{
							SetFXCoronaTexture ("bwhdlight-4",null);
							SetFXCoronaTexture ("bwhdlight-5",null);
							SetFXCoronaTexture ("bwhdlight-6",null);
							SetFXCoronaTexture ("bwhdlight-7",null);
							SetFXCoronaTexture ("bbhdlight-4",null);
							SetFXCoronaTexture ("bbhdlight-5",null);
							SetFXCoronaTexture ("bbhdlight-6",null);
							SetFXCoronaTexture ("bbhdlight-7",null);
						}
						else
						{			
							SetFXCoronaTexture ("bwhdlight-4",k_hlight01);
							SetFXCoronaTexture ("bwhdlight-5",k_hlight01);
							SetFXCoronaTexture ("bwhdlight-6",k_hlight01);
							SetFXCoronaTexture ("bwhdlight-7",k_hlight01);
							SetFXCoronaTexture ("bbhdlight-4",k_hlight02);
							SetFXCoronaTexture ("bbhdlight-5",k_hlight02);
							SetFXCoronaTexture ("bbhdlight-6",k_hlight02);
							SetFXCoronaTexture ("bbhdlight-7",k_hlight02);				
						}
						SetFXCoronaTexture ("bwhdlight-0",k_hlight01);
						SetFXCoronaTexture ("bwhdlight-1",k_hlight01);
						SetFXCoronaTexture ("bwhdlight-2",k_hlight01);
						SetFXCoronaTexture ("bwhdlight-3",k_hlight01);
						SetFXCoronaTexture ("bbhdlight-0",k_hlight02);
						SetFXCoronaTexture ("bbhdlight-1",k_hlight02);
						SetFXCoronaTexture ("bbhdlight-2",k_hlight02);
						SetFXCoronaTexture ("bbhdlight-3",k_hlight02);

					}
					else
					{
						SetFXCoronaTexture ("bwhdlight-0",null);
						SetFXCoronaTexture ("bwhdlight-1",null);
						SetFXCoronaTexture ("bwhdlight-2",null);
						SetFXCoronaTexture ("bwhdlight-3",null);
						SetFXCoronaTexture ("bwhdlight-4",null);
						SetFXCoronaTexture ("bwhdlight-5",null);
						SetFXCoronaTexture ("bwhdlight-6",null);
						SetFXCoronaTexture ("bwhdlight-7",null);
						SetFXCoronaTexture ("bbhdlight-0",null);
						SetFXCoronaTexture ("bbhdlight-1",null);
						SetFXCoronaTexture ("bbhdlight-2",null);
						SetFXCoronaTexture ("bbhdlight-3",null);
						SetFXCoronaTexture ("bbhdlight-4",null);
						SetFXCoronaTexture ("bbhdlight-5",null);
						SetFXCoronaTexture ("bbhdlight-6",null);
						SetFXCoronaTexture ("bbhdlight-7",null);
					}	
				}
				if (m_CabsMy == 2)
				{
					SetFXCoronaTexture ("backlight-0",null);
					SetFXCoronaTexture ("backlight-1",null);
					SetFXCoronaTexture ("backlight-2",null);
					SetFXCoronaTexture ("backlight-3",null);
					SetFXCoronaTexture ("backlight-4",null);
					SetFXCoronaTexture ("backlight-5",null);
					SetFXCoronaTexture ("backlight-6",null);
					SetFXCoronaTexture ("backlight-7",null);
				}
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
							SetMeshVisible("display-0-off", true, 0.0);
							SetMeshVisible("display-0-on", false, 0.0);
							SetMeshVisible("conductor-0", false, 0.0);
							SetMeshVisible("conductor-2", false, 0.0);							
//Print(pos, direction, 9);	
						}
						else
						{
							newDriverShowed = true;
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
							SetMeshVisible("conductor-0", true, 0.0);
							SetMeshVisible("conductor-2", true, 0.0);														
//Print(pos, direction, 10);	
						}						
					}
				}
				SetDiscAttach(0,true);
				SetDiscAttach(1,false);
			}
		}
		else if (pos == 2)
		{
			SetFXCoronaTexture ("frontlight-0",null);
			SetFXCoronaTexture ("frontlight-1",null);
			SetFXCoronaTexture ("frontlight-2",null);
			SetFXCoronaTexture ("frontlight-3",null);
			SetFXCoronaTexture ("frontlight-4",null);
			SetFXCoronaTexture ("frontlight-5",null);
			SetFXCoronaTexture ("frontlight-6",null);
			SetFXCoronaTexture ("frontlight-7",null);
			
			if (m_CabsMy == 2)
			{
				SetFXCoronaTexture ("backlight-0",null);
				SetFXCoronaTexture ("backlight-1",null);
				SetFXCoronaTexture ("backlight-2",null);
				SetFXCoronaTexture ("backlight-3",null);
				SetFXCoronaTexture ("backlight-4",null);
				SetFXCoronaTexture ("backlight-5",null);
				SetFXCoronaTexture ("backlight-6",null);
				SetFXCoronaTexture ("backlight-7",null);
			}
			SetFXCoronaTexture ("fwhdlight-0",null);
			SetFXCoronaTexture ("fwhdlight-1",null);
			SetFXCoronaTexture ("fwhdlight-2",null);
			SetFXCoronaTexture ("fwhdlight-3",null);
			SetFXCoronaTexture ("fwhdlight-4",null);
			SetFXCoronaTexture ("fwhdlight-5",null);
			SetFXCoronaTexture ("fwhdlight-6",null);
			SetFXCoronaTexture ("fwhdlight-7",null);
			SetFXCoronaTexture ("bwhdlight-0",null);
			SetFXCoronaTexture ("bwhdlight-1",null);
			SetFXCoronaTexture ("bwhdlight-2",null);
			SetFXCoronaTexture ("bwhdlight-3",null);
			SetFXCoronaTexture ("bwhdlight-4",null);
			SetFXCoronaTexture ("bwhdlight-5",null);
			SetFXCoronaTexture ("bwhdlight-6",null);
			SetFXCoronaTexture ("bwhdlight-7",null);
			SetFXCoronaTexture ("fbhdlight-0",null);
			SetFXCoronaTexture ("fbhdlight-1",null);
			SetFXCoronaTexture ("fbhdlight-2",null);
			SetFXCoronaTexture ("fbhdlight-3",null);
			SetFXCoronaTexture ("fbhdlight-4",null);
			SetFXCoronaTexture ("fbhdlight-5",null);
			SetFXCoronaTexture ("fbhdlight-6",null);
			SetFXCoronaTexture ("fbhdlight-7",null);
			SetFXCoronaTexture ("bbhdlight-0",null);
			SetFXCoronaTexture ("bbhdlight-1",null);
			SetFXCoronaTexture ("bbhdlight-2",null);
			SetFXCoronaTexture ("bbhdlight-3",null);
			SetFXCoronaTexture ("bbhdlight-4",null);
			SetFXCoronaTexture ("bbhdlight-5",null);
			SetFXCoronaTexture ("bbhdlight-6",null);
			SetFXCoronaTexture ("bbhdlight-7",null);
			
			if (showDriver)
			{
				if (m_CabsFirst or m_CabsLast)
				{				
					newDriverShowed = newShowInCab2 = newShowInCab1 = false;
					SetMeshVisible("display-0-off", true, 0.0);
					SetMeshVisible("display-0-on", false, 0.0);
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
			SetDiscAttach(0,true);
			SetDiscAttach(1,true);
		}
		else if (pos == 3)
		{
			if (showDriver and m_CabsMy == 1)
			{
				if (m_CabsFirst == 0)
				{
					newDriverShowed = true;
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
					SetMeshVisible("conductor-0", true, 0.0);
					SetMeshVisible("conductor-2", true, 0.0);
//Print(pos, direction, 12);	
				}
				else
				{
					newDriverShowed = false;
					SetMeshVisible("display-0-off", true, 0.0);
					SetMeshVisible("display-0-on", false, 0.0);
					SetMeshVisible("conductor-0", false, 0.0);
					SetMeshVisible("conductor-2", false, 0.0);
//Print(pos, direction, 13);	
				}
			}
			if (direction)
			{
				if (m_hasHdlight)
				{
					if(headlight)
					{
						if(!GetMyTrain().GetHighBeams())
						{
							SetFXCoronaTexture ("fwhdlight-4",null);
							SetFXCoronaTexture ("fwhdlight-5",null);
							SetFXCoronaTexture ("fwhdlight-6",null);
							SetFXCoronaTexture ("fwhdlight-7",null);
							SetFXCoronaTexture ("fbhdlight-4",null);
							SetFXCoronaTexture ("fbhdlight-5",null);
							SetFXCoronaTexture ("fbhdlight-6",null);
							SetFXCoronaTexture ("fbhdlight-7",null);
						}
						else
						{			
							SetFXCoronaTexture ("fwhdlight-4",k_hlight01);
							SetFXCoronaTexture ("fwhdlight-5",k_hlight01);
							SetFXCoronaTexture ("fwhdlight-6",k_hlight01);
							SetFXCoronaTexture ("fwhdlight-7",k_hlight01);
							SetFXCoronaTexture ("fbhdlight-4",k_hlight02);
							SetFXCoronaTexture ("fbhdlight-5",k_hlight02);
							SetFXCoronaTexture ("fbhdlight-6",k_hlight02);
							SetFXCoronaTexture ("fbhdlight-7",k_hlight02);				
						}
						SetFXCoronaTexture ("fwhdlight-0",k_hlight01);
						SetFXCoronaTexture ("fwhdlight-1",k_hlight01);
						SetFXCoronaTexture ("fwhdlight-2",k_hlight01);
						SetFXCoronaTexture ("fwhdlight-3",k_hlight01);
						SetFXCoronaTexture ("fbhdlight-0",k_hlight02);
						SetFXCoronaTexture ("fbhdlight-1",k_hlight02);
						SetFXCoronaTexture ("fbhdlight-2",k_hlight02);
						SetFXCoronaTexture ("fbhdlight-3",k_hlight02);

					}
					else
					{
						SetFXCoronaTexture ("fwhdlight-0",null);
						SetFXCoronaTexture ("fwhdlight-1",null);
						SetFXCoronaTexture ("fwhdlight-2",null);
						SetFXCoronaTexture ("fwhdlight-3",null);
						SetFXCoronaTexture ("fwhdlight-4",null);
						SetFXCoronaTexture ("fwhdlight-5",null);
						SetFXCoronaTexture ("fwhdlight-6",null);
						SetFXCoronaTexture ("fwhdlight-7",null);
						SetFXCoronaTexture ("fbhdlight-0",null);
						SetFXCoronaTexture ("fbhdlight-1",null);
						SetFXCoronaTexture ("fbhdlight-2",null);
						SetFXCoronaTexture ("fbhdlight-3",null);
						SetFXCoronaTexture ("fbhdlight-4",null);
						SetFXCoronaTexture ("fbhdlight-5",null);
						SetFXCoronaTexture ("fbhdlight-6",null);
						SetFXCoronaTexture ("fbhdlight-7",null);
					}
				}
				if (m_CabsMy == 2)
				{				
					SetFXCoronaTexture ("backlight-0",k_reds01);
					SetFXCoronaTexture ("backlight-1",k_reds01);
					SetFXCoronaTexture ("backlight-2",k_reds01);
					SetFXCoronaTexture ("backlight-3",k_reds01);
					SetFXCoronaTexture ("backlight-4",k_reds01);
					SetFXCoronaTexture ("backlight-5",k_reds01);
					SetFXCoronaTexture ("backlight-6",k_reds01);
					SetFXCoronaTexture ("backlight-7",k_reds01);
				}
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
				SetDiscAttach(0,true);
				SetDiscAttach(1,false);
			}
			else
			{
				if (m_hasHdlight)
				{
					if(headlight)
					{
						if(!GetMyTrain().GetHighBeams())
						{
							SetFXCoronaTexture ("bwhdlight-4",null);
							SetFXCoronaTexture ("bwhdlight-5",null);
							SetFXCoronaTexture ("bwhdlight-6",null);
							SetFXCoronaTexture ("bwhdlight-7",null);
							SetFXCoronaTexture ("bbhdlight-4",null);
							SetFXCoronaTexture ("bbhdlight-5",null);
							SetFXCoronaTexture ("bbhdlight-6",null);
							SetFXCoronaTexture ("bbhdlight-7",null);
						}
						else
						{			
							SetFXCoronaTexture ("bwhdlight-4",k_hlight01);
							SetFXCoronaTexture ("bwhdlight-5",k_hlight01);
							SetFXCoronaTexture ("bwhdlight-6",k_hlight01);
							SetFXCoronaTexture ("bwhdlight-7",k_hlight01);
							SetFXCoronaTexture ("bbhdlight-4",k_hlight02);
							SetFXCoronaTexture ("bbhdlight-5",k_hlight02);
							SetFXCoronaTexture ("bbhdlight-6",k_hlight02);
							SetFXCoronaTexture ("bbhdlight-7",k_hlight02);				
						}
						SetFXCoronaTexture ("bwhdlight-0",k_hlight01);
						SetFXCoronaTexture ("bwhdlight-1",k_hlight01);
						SetFXCoronaTexture ("bwhdlight-2",k_hlight01);
						SetFXCoronaTexture ("bwhdlight-3",k_hlight01);
						SetFXCoronaTexture ("bbhdlight-0",k_hlight02);
						SetFXCoronaTexture ("bbhdlight-1",k_hlight02);
						SetFXCoronaTexture ("bbhdlight-2",k_hlight02);
						SetFXCoronaTexture ("bbhdlight-3",k_hlight02);

					}
					else
					{
						SetFXCoronaTexture ("bwhdlight-0",null);
						SetFXCoronaTexture ("bwhdlight-1",null);
						SetFXCoronaTexture ("bwhdlight-2",null);
						SetFXCoronaTexture ("bwhdlight-3",null);
						SetFXCoronaTexture ("bwhdlight-4",null);
						SetFXCoronaTexture ("bwhdlight-5",null);
						SetFXCoronaTexture ("bwhdlight-6",null);
						SetFXCoronaTexture ("bwhdlight-7",null);
						SetFXCoronaTexture ("bbhdlight-0",null);
						SetFXCoronaTexture ("bbhdlight-1",null);
						SetFXCoronaTexture ("bbhdlight-2",null);
						SetFXCoronaTexture ("bbhdlight-3",null);
						SetFXCoronaTexture ("bbhdlight-4",null);
						SetFXCoronaTexture ("bbhdlight-5",null);
						SetFXCoronaTexture ("bbhdlight-6",null);
						SetFXCoronaTexture ("bbhdlight-7",null);
					}
				}
				SetFXCoronaTexture ("frontlight-0",k_reds01);
				SetFXCoronaTexture ("frontlight-1",k_reds01);
				SetFXCoronaTexture ("frontlight-2",k_reds01);
				SetFXCoronaTexture ("frontlight-3",k_reds01);
				SetFXCoronaTexture ("frontlight-4",k_reds01);
				SetFXCoronaTexture ("frontlight-5",k_reds01);
				SetFXCoronaTexture ("frontlight-6",k_reds01);
				SetFXCoronaTexture ("frontlight-7",k_reds01);
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
				SetDiscAttach(0,false);
				SetDiscAttach(1,true);
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
	
	void SetDisc(void)
	{
		Train train = me.GetMyTrain();
		if (train != null)
		{
			int direction = me.GetDirectionRelativeToTrain();
			int pos = GetMyPosition(train);
			SetDisc(pos, direction);	
		}
	}
	
	thread void DiscMonitor(void) 
	{
	
		while (m_electro and !DeRailed)
		{
			SetDisc();	
			Sleep(0.5);
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
		bool headlight;	
		float speed;
		while (m_electro and (m_hasFans or m_hasBelight or m_hasLine))
		{
			speed=Math.Fabs(GetVelocity())*3.6;				
			headlight = GetMyTrain().GetHeadlightState();
			if (headlight)
			{
				if (m_hasFans and m_fansState == -1) StartFans();
				if (m_hasLine) StartMeshAnimationLoop("line");
				if (m_hasBelight)
				{
					if (speed > 3) 
					{
						Sleep( Math.Rand(0.0, 0.5) );
						SetFXCoronaTexture("leftstop-0", null );
						SetFXCoronaTexture("rightstop-0", null );
					}
					else if (speed < 3)
					{
						Sleep( Math.Rand(0.0, 0.5) );
						SetFXCoronaTexture("leftstop-0", k_orange01 );
						SetFXCoronaTexture("rightstop-0", k_orange01 );
					}
				}
			}
			else 
			{
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
			Sleep(2);
		}		
		if (m_fansState == 1) StopFans();
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
	
	thread void K_loop()
	{
		Bogey[] bog_l=  GetBogeyList();

		float R_level=0;
		float J_level=0;

		bool IsNight=false;
		float speed;

		Bogey[] bog=GetBogeyList();

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
				bool headlight = GetMyTrain().GetHeadlightState();	
				float time = World.GetGameTime();				
			
				if (headlight and m_electro)
				{
					SetMeshVisible("display-1-off", false, 0.0);
					SetMeshVisible("display-1-on", true, 0.0);
					if (time>0.75 or time<0.26)
					{
						Sleep(1);
						Sleep( Math.Rand(0.0, 0.5) );	
						SetTextureSelfIllumination("int01",0.05,0.05,0.05);
						SetTextureSelfIllumination("int02",0.05,0.05,0.05);
						SetTextureSelfIllumination("int03",0.05,0.05,0.05);
						SetTextureSelfIllumination("int04",0.05,0.05,0.05);
						SetTextureSelfIllumination("int05",0.05,0.05,0.05);
					}
					else 
					{	
						Sleep(1);
						Sleep( Math.Rand(0.0, 0.5) );						
						SetTextureSelfIllumination("int01",0.25,0.25,0.25);
						SetTextureSelfIllumination("int02",0.25,0.25,0.2);
						SetTextureSelfIllumination("int03",0.30,0.30,0.2);
						SetTextureSelfIllumination("int04",0.25,0.25,0.15);
						SetTextureSelfIllumination("int05",0.2,0.2,0.2);				
					}
				}
				else
				{
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

			Sleep(0.1);
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
	//======= TABLO ==========================================================================================
	bool 	m_showLastStation,
			m_timer = false,
			m_title;
	string 	m_nextStation,
			m_lastStation,
			m_station;

	/*
	bool HasTablo()
	{
		Soup 	soup = GetAsset().GetConfigSoup().GetNamedSoup("mesh-table").GetNamedSoup("default").GetNamedSoup("effects");
		int 	i, len = soup.CountTags();
		bool 	res = false;
	
		for (i = 0; !res and i < len; i++)
		{
			res = (soup.GetNamedSoup(soup.GetIndexedTagName(i)).GetNamedTag("name") == "tablo");						
		}
		
		return res;			
	}
	*/
	
	void ShowLastStation(Message msg)
	{
		m_showLastStation = (bool)Str.ToInt(msg.minor);
	}
	
	void TimerTablo(Message msg)
	{
		if (m_station != "")
		{
			bool next = (msg.minor == "next");
			
			if (m_title)	
			{
				if (next) 	SetFXNameText("tablo", m_nextStation);
				else		SetFXNameText("tablo", m_lastStation);				
			}
			else			
			{
				if (next) 	SetFXNameText("tablo", m_station);
				else		SetFXNameText("tablo", tablo_dest);
			}

			m_title = !m_title;
			if (m_showLastStation and m_title)
			{
				if (next or m_station == " ")	
				{
					PostMessage(me, "TimerTablo", "dest", 2);
				}
				else							
				{
					PostMessage(me, "TimerTablo", "next", 2);
				}
			}
			else
			{
				PostMessage(me, "TimerTablo", msg.minor, 2);
			}
		}
	}
	
	void SetTablo(Message msg)
	{
		string 	value = msg.minor,
				pref = value[0,5];
		bool   	timer = (pref == "next_"),
				till = (pref == "till_");
	
		if (timer)
		{
			m_station = value[5, value.size()];
			m_title = true;
		}
		else
		{
			if (till)
			{
				tablo_dest = value[5, value.size()];
			}
			else
			{
				m_station = "";
				SetFXNameText("tablo", value);
			}
		}
		
		if (!till and timer != m_timer)
		{
			m_timer = timer;
			if (timer)	
			{
				if (m_station != " ")	PostMessage(me, "TimerTablo", "next", 0);
				else					PostMessage(me, "TimerTablo", "dest", 0);
			}	
		}				
	}

	void InitTablo()
	{
		AddHandler(me, "TimerTablo", null, "TimerTablo");
		AddHandler(me, "ShowLastStation", null, "ShowLastStation");
		AddHandler(me, "SetTablo", null, "SetTablo");
		SetFXNameText("tablo", " ");
		StringTable ST = A.GetAsset().GetStringTable();
		m_nextStation = ST.GetString("next_station");
		m_lastStation = ST.GetString("last_station");		
	}	
	//========================================================================================================
	public void Init(void) 
	{
		inherited();
		A = World.GetLibrary(me.GetAsset().LookupKUIDTable("cyriscript"));
		if (!A) {Exception("Unable to load Code Library <kuid:486576:111>\n\n\n\n\n\n\n\n\n");}
		InitDriver();
		SSSoup = Constructors.NewSoup();
		Objects = new GSObject[3];
		Objects[0] = me;
		Objects[1] = SSSoup;
		Strings = new string[4];
		Soup extensions = GetAsset().GetConfigSoup().GetNamedSoup("extensions");
		m_maxDeclination = Math.Fabs(extensions.GetNamedTagAsFloat("declination"));
		sway01 = Math.Fabs(extensions.GetNamedTagAsFloat("sway01",0.045)); //0.045
		sway02 = Math.Fabs(extensions.GetNamedTagAsFloat("sway02",0.015)); //0.015
		sway03 = Math.Fabs(extensions.GetNamedTagAsFloat("sway03",0.06));  //0.02
		sway04 = Math.Fabs(extensions.GetNamedTagAsFloat("sway04",0.06));  //0.01
		sway05 = Math.Fabs(extensions.GetNamedTagAsFloat("sway05",0.1));   //0.1
		m_deltaDeclination = m_maxDeclination/20.;
		m_CabsMy = GetNumCabs(cast<Vehicle>(me));
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
		
		if (m_hasTablo) InitTablo();
				
		//SetRollBasedOnTrack(declination);
		K_loop();
		K_loop1();
		IntLight();
		k_reds01 = GetAsset().FindAsset("reds");
		
		m_hasBelight = extensions.GetNamedTagAsBool("brakelight");
		if (m_hasBelight)
		{
			k_orange01 = GetAsset().FindAsset("orange");
		}
		
		m_hasHdlight = extensions.GetNamedTagAsBool("headlight");
		if (m_hasHdlight)
		{
			k_hlight01 = GetAsset().FindAsset("hlight-0");
			k_hlight02 = GetAsset().FindAsset("hlight-1");
		}
		
		SetFXCoronaTexture ("fwhdlight-0",null);
		SetFXCoronaTexture ("fwhdlight-1",null);
		SetFXCoronaTexture ("fwhdlight-2",null);
		SetFXCoronaTexture ("fwhdlight-3",null);
		SetFXCoronaTexture ("fwhdlight-4",null);
		SetFXCoronaTexture ("fwhdlight-5",null);
		SetFXCoronaTexture ("fwhdlight-6",null);
		SetFXCoronaTexture ("fwhdlight-7",null);
		SetFXCoronaTexture ("bwhdlight-0",null);
		SetFXCoronaTexture ("bwhdlight-1",null);
		SetFXCoronaTexture ("bwhdlight-2",null);
		SetFXCoronaTexture ("bwhdlight-3",null);
		SetFXCoronaTexture ("bwhdlight-4",null);
		SetFXCoronaTexture ("bwhdlight-5",null);
		SetFXCoronaTexture ("bwhdlight-6",null);
		SetFXCoronaTexture ("bwhdlight-7",null);
		SetFXCoronaTexture ("fbhdlight-0",null);
		SetFXCoronaTexture ("fbhdlight-1",null);
		SetFXCoronaTexture ("fbhdlight-2",null);
		SetFXCoronaTexture ("fbhdlight-3",null);
		SetFXCoronaTexture ("fbhdlight-4",null);
		SetFXCoronaTexture ("fbhdlight-5",null);
		SetFXCoronaTexture ("fbhdlight-6",null);
		SetFXCoronaTexture ("fbhdlight-7",null);
		SetFXCoronaTexture ("bbhdlight-0",null);
		SetFXCoronaTexture ("bbhdlight-1",null);
		SetFXCoronaTexture ("bbhdlight-2",null);
		SetFXCoronaTexture ("bbhdlight-3",null);
		SetFXCoronaTexture ("bbhdlight-4",null);
		SetFXCoronaTexture ("bbhdlight-5",null);
		SetFXCoronaTexture ("bbhdlight-6",null);
		SetFXCoronaTexture ("bbhdlight-7",null);
		SetFXCoronaTexture ("frontlight-0",null);
		SetFXCoronaTexture ("frontlight-1",null);
		SetFXCoronaTexture ("frontlight-2",null);
		SetFXCoronaTexture ("frontlight-3",null);
		SetFXCoronaTexture ("frontlight-4",null);
		SetFXCoronaTexture ("frontlight-5",null);
		SetFXCoronaTexture ("frontlight-6",null);
		SetFXCoronaTexture ("frontlight-7",null);
		if (m_CabsMy == 2)
		{
			SetFXCoronaTexture ("backlight-0",null);
			SetFXCoronaTexture ("backlight-1",null);
			SetFXCoronaTexture ("backlight-2",null);
			SetFXCoronaTexture ("backlight-3",null);
			SetFXCoronaTexture ("backlight-4",null);
			SetFXCoronaTexture ("backlight-5",null);
			SetFXCoronaTexture ("backlight-6",null);
			SetFXCoronaTexture ("backlight-7",null);
		}
		SetDiscAttach(0,false);
		SetDiscAttach(1,false);
		MonStart();
		DiscMonitor();
		SetCabinData(null);
		AddHandler(me, "World", "ModuleInit", "ModuleInitHandler");
		A.LibraryCall("AddHandlers",Strings,Objects);
		PostMessage(me,"SS","Setup",0.0);
		AddHandler(me,"ChangeDestinationSign", "", "ChangeDestinationSign");
		AddHandler(me,"ChangeNumberSign", "", "ChangeNumberSign");
		AddHandler(me,"DriverCharacter","LeftTrain","OnChangeDriver");
		AddHandler(me,"DriverCharacter","BoardedTrain","OnChangeDriver");
//		AddHandler(me,"World", "ModuleInit", "ModuleInitHandler");
		AddHandler(me,"Locomotive","ShowDriver","OnShowDriver");
		AddHandler(me,"Locomotive","HideDriver","OnShowDriver");
		AddHandler(me,"SetProperty", "", "SetProperty");
	}	
};