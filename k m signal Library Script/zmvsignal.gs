include "zmvLenses.gs"
include "zmvsignallibraryinterface.gs"
include "zmvsignalinterface.gs"
include "zmvinterface.gs"
include "ZmvLensesLibraryInterface.gs"

class ZmvSignal isclass ZmvSignalInterface
{    
    ZmvInterface m_signalLibrary;
    ZmvLensesInterface m_lensesLibrary;

    public define float KPH_TO_MPS = 0.278;
    
    string[] m_allLenses;
    
    int    m_secWait, m_secWaitRed;
    int    m_nWaitSeconds;
    bool   m_bInvitationLense;
    bool   m_bOP;
    bool   m_bSemiautomat;
    bool   m_bCheck;
    bool   m_bFirst = true;

    bool   m_bOtherSignalStateChangedHandler;
	bool   m_bApplyState;
    bool   m_bApplyStateSoup;
    bool   m_bDebug;
	Train  m_derailedTrain;	
	int    m_speedLimit;
	
	Browser m_Browser;
	
    //Print =================================================================================================================
    void print(string method, string s)
    {
        Interface.Print(GetName()+":"+method +":"+ s);
    }
    
    void Print(string method, string s)
    {
        print("ZmvSignal::" + method, s);
    }    
 
    void Print(string method, string[] s)
    {
        int i, len = s.size();
        string str;
        for (i = 0; i < len; i++)
        {
            str = str + s[i] + ",";
        }
        Print(method, str);
    }    

    //Checker ===============================================================================================================
    void ApplyUpdatedState();

    thread void Check()
	{
    	Sleep(Math.Rand(1.5, 3.0));		
            
        while (m_bCheck)
		{
            if (!m_bApplyState)
                ApplyUpdatedState();
			Sleep(m_nWaitSeconds);
        }
        if (m_bDebug) Print("Check", "Exit");
    }

    public bool IsSemiautomat() 
    {
        return m_bSemiautomat;
    }
		
    public bool IsAutomated() 
	{
		return m_signalLibrary.IsAutomated();
	}

	public bool IsBlocked(Train train)
	{
        if (m_bDebug) Print("IsBlocked", "name="+train.GetTrainDisplayName());
		return m_signalLibrary.IsBlocked(train);
	}
	
	public bool IsProhodnoy() 
	{ 
		return !IsSemiautomat();
	}
    //SpeedLimits ============================================================================================================
    void setSpeedLimit(int speedLimit)
    {
        if (m_bDebug) Print("setSpeedLimit", "speedLimit="+speedLimit);
        if (speedLimit != 0)
			SetSpeedLimit(speedLimit*KPH_TO_MPS);
    }
		
    //ApplyUpdatedState ==============================================================================================
    void ApplyUpdatedState()
    {            
        m_bApplyState = true;
        if (m_bDebug) Print("ApplyUpdatedState", "");
        m_signalLibrary.ApplyUpdatedState();
        m_bApplyState = false;
    }
/*
    void ApplyUpdatedState(Soup sigSoup)
    {
        m_bApplyStateSoup = true;

        if (m_bDebug) Print("ApplyUpdatedState", "sigSoup");

        inherited(sigSoup);
        ApplyUpdatedState();
        m_bApplyStateSoup = false;
    }
*/	
    //SetCheckerWorkMode ==============================================================================================
    public void SetCheckerWorkMode(bool turnOn) 
    {
        if (turnOn)
        {
            if (m_bDebug) Print("SetCheckerWorkMode", "On");
            if (!m_bCheck)
            {
                m_bCheck = true;
                Check();
            }
        }
        else
        {
            if (m_bDebug) Print("SetCheckerWorkMode", "Off");
            m_bCheck = false;
        }
    }
	
	public void AddObjectEnterOrLeaveHandler()
	{
		AddHandler(me, "Object", "Enter", "");
		AddHandler(me, "Object", "Leave", "");		
		AddHandler(me, "Object", "Enter", "OnObjectEnter");
		AddHandler(me, "Object", "Leave", "OnObjectLeave");		
	}
	
    //Lenses operations ==============================================================================================
    void showAllLenses()
    {
        if (m_bDebug) Print("showAllLenses", "");
        Asset[] assets = m_lensesLibrary.GetAssets(m_allLenses);
        ZmvLenses.ShowLenses(me, m_allLenses, assets);
    }

    void hideAllLenses()
    {
        if (m_bDebug) Print("hideAllLenses", "");
        ZmvLenses.HideLenses(me, m_allLenses);    
    }

    void showLenses(string[] lenses)
    {
        hideAllLenses();        
        
        if (m_bDebug) Print("showLenses:", lenses);
        Asset[] assets = m_lensesLibrary.GetAssets(lenses);
        ZmvLenses.ShowLenses(me, lenses, assets);
    }

    void setSignalState(int state)
    {
        if (m_bDebug) Print("setSignalState:", "state="+state);

        if (m_bFirst or state != GetSignalState())
		{	
			m_bFirst = false;
			SetSignalState(state,"");      
		}
    }
	
    void setLensesState(string[] lenses, int signalState, int speedLimit)
    {
        if (m_bDebug) Print("SetLensesState", "signalState="+signalState+",speedLimit="+speedLimit);
        if (lenses)	showLenses(lenses);
        setSpeedLimit(speedLimit);
        setSignalState(signalState);    

        if (speedLimit == 0)
            m_nWaitSeconds = m_secWaitRed;
        else
            m_nWaitSeconds = m_secWait;
    }

    //Initializators ==================================================================================================
    void startChecker()
    {
        if (m_bDebug) Print("startChecker", "");
        Check();
    }
    //Properties ==========================================================================================================
    void updateTables()
    {
    }

    void Update()
    {
        if (m_bDebug) Print("Update", "");        
        
        updateTables();
        m_signalLibrary.Update();
    }

	public Soup GetProperties()
	{
        if (m_bDebug) Print("GetProperties", "");        
 		Soup db=inherited();

        if (m_signalLibrary != null)
            m_signalLibrary.GetProperties(db);
 		if (m_lensesLibrary != null)
            m_lensesLibrary.GetProperties(db);

		db.SetNamedTag("privateName", db.GetNamedTag("name"));

        if (m_bDebug) Print("GetProperties", "wf="+db.GetNamedTag("speed-PS"));

        return db;
	}

	public void SetProperties(Soup db)
	{
        if (!m_bApplyStateSoup)
        {
            if (m_bDebug) Print("SetProperties", "");        
			
            m_signalLibrary.SetProperties(db);
            m_lensesLibrary.SetProperties(db, m_signalLibrary.GetNeighborProperties());

            Update();
        }
 	}

 	public string GetPropertyType(string id)
	{
        if (m_bDebug) Print("GetPropertyType","id="+id);
        
        if (id == "speedLimitPS")
            return "int";
		
		if (m_lensesLibrary.HasProperty(id))
			return m_lensesLibrary.GetPropertyType(id);
		
        return m_signalLibrary.GetPropertyType(id);
	}

 	public string GetPropertyName(string id)
	{
        if (m_bDebug) Print("GetPropertyName","id="+id);
   		if (m_lensesLibrary.HasProperty(id))
			return m_lensesLibrary.GetPropertyName(id);
        return m_signalLibrary.GetPropertyName(id);
	}
	
    public void SetPropertyValue(string id, int val)
	{
        if (m_bDebug) Print("SetPropertyValue(int)","id="+id+", val="+val);

        m_signalLibrary.SetPropertyValue(id, val);
        inherited(id,val);
 	}

	public void SetPropertyValue(string id, string val)
	{
        if (m_bDebug) Print("SetPropertyValue(string)","id="+id+", val="+val);

        inherited(id, val);
        m_signalLibrary.SetPropertyValue(id, val);
 	}
    
    public void LinkPropertyValue(string id)
    {
        if (m_bDebug) Print("LinkPropertyValue(string)","id="+id);
        m_signalLibrary.LinkPropertyValue(id);
    }

    public string[] GetPropertyElementList(string id)
    {
        if (m_bDebug) Print("GetPropertyElementList(string)","id="+id);
        
   		if (m_lensesLibrary.HasProperty(id))
			return m_lensesLibrary.GetPropertyElementList(id);		
		return m_signalLibrary.GetPropertyElementList(id);
    }

    void SetPropertyValue(string id, string val, int index)
    {
        if (m_bDebug) Print("SetPropertyValue(string)","id="+id+", val="+val+", index="+index);
  		if (m_lensesLibrary.HasProperty(id))
			m_lensesLibrary.SetPropertyValue(id, val, index);
		else				
			m_signalLibrary.SetPropertyValue(id, val, index);
    }

    string getNamesContentBase(StringTable ST)
    {
        return "";
    }

    string getContent(StringTable ST)
	{
		return getNamesContentBase(ST) + m_lensesLibrary.GetPropertiesContent() + m_signalLibrary.GetPropertiesContent(ST);
	}

    public string GetDescriptionHTML()
	{
		StringTable ST = GetAsset().GetStringTable();
        Update();
       	return m_signalLibrary.GetDescriptionHTML(ST, getContent(ST));
	}
    //Message handlers ================================================================================================
    public bool SetBlock(Train train, bool addToQueueIfBusy) 
    {
        if (m_bDebug) Print("SetBlock, name=", train.GetTrainDisplayName()+",addToQueueIfBusy="+addToQueueIfBusy);
        if (m_signalLibrary != null)  return m_signalLibrary.SetBlock(train, addToQueueIfBusy);
		return false;
    }
    
	public void OnObjectEnter(Message msg)
	{
        if (m_signalLibrary != null)
            m_signalLibrary.ObjectEnter(msg);
	}
	
	public void OnObjectLeave(Message msg)
	{
        if (m_signalLibrary != null)
            m_signalLibrary.ObjectLeave(msg);
	}
	
    public void SetBlock(Message msg) 
    {
        if (m_bDebug) Print("SetBlock", msg.minor);
        if (m_signalLibrary != null)
            m_signalLibrary.SetBlock(msg);
    }
    
    public void SetUnblock(Message msg) 
    {
        if (m_bDebug) Print("SetUnblock", "");
        if (m_signalLibrary != null)
            m_signalLibrary.SetUnblock(msg);
    }
    
    public void SetUnblock(Train train) 
    {
        if (m_bDebug) Print("SetUnblock", "");
        if (m_signalLibrary != null)
            m_signalLibrary.SetUnblock(train);
    }
    
	public void OnCTRL(Message msg) 
	{
        if (m_bDebug) Print("OnCTRL", msg.minor);
        if (m_signalLibrary != null)
            m_signalLibrary.OnCTRL(msg);
	}
	
    public void SetPropagatedProperties(Message msg)
    {
        if (m_bDebug) Print("SetPropagatedProperties", "msg.minor="+msg.minor);
        ZmvSignalInterface src = cast<ZmvSignalInterface>(msg.src);
		if (m_signalLibrary != null and src != me)
            m_signalLibrary.SetPropagatedProperties(src, msg.minor);
    }

    public void TurnOnInvitationSignal(Message msg)
    {
        if (m_bDebug) Print("TurnOnInvitationSignal", "");
        
        m_signalLibrary.TurnOnInvitationSignal(msg);     
    }
	
	public void OtherSignalStateChanged(Message msg)
	{
		m_signalLibrary.OtherSignalStateChanged(msg);
	}
	
    public void SetAutoblock(Message msg)
    {
        if (m_bDebug) Print("SetAutoblock", "");        
        m_signalLibrary.SetAutoblock(msg);     
    }

    public void SetSemiautomatMode(Message msg)
    {
        if (m_bDebug) Print("SetSemiautomatMode", "");        
        m_signalLibrary.SetSemiautoMode(msg);     
    }

    public void SetAutomatMode(Message msg)
    {
        if (m_bDebug) Print("SetAutomatMode", "");        
        m_signalLibrary.SetAutoMode(msg);     
    }
	
	public bool IsShuntMode()
	{
		return m_signalLibrary.IsShuntMode(); 
	}
	
	public int GetLastAlsValue() 
	{
		if (m_signalLibrary) return m_signalLibrary.GetLastAlsValue();
		return ZmvAls.ALS_OC; 
	}
	
	public int GetLastNextAlsValue()
	{
		if (m_signalLibrary) return m_signalLibrary.GetLastNextAlsValue();
		return -1; 
	}
/*    
    public void ZmvPreviousSignalChanged(Message msg)
    {
        if (m_bDebug) Print("ZmvPreviousSignalChanged", "");
        if (!m_bApplyState)
            ApplyUpdatedState();
    }
*/
	public void BrowserCloseHandler(Message msg) 
	{
		if (msg.src == m_Browser) 
			m_Browser = null;
	}
	
	public void UpdateBrowser()
	{
		if (m_Browser)
			m_Browser.LoadHTMLString(m_signalLibrary.GetViewDetails());
	}
	
	public void BrowserUrlHandler(Message msg)
	{
		if (msg.src == m_Browser and msg.major == "Browser-URL")
		{
			m_signalLibrary.BrowserUrlHandler(msg);
			UpdateBrowser();
		}
	}
	
	public void OnVehicleDerailed(Message msg) 
	{
		Vehicle v = cast<Vehicle>(msg.src);
		Train train = v.GetMyTrain();
		if (train != m_derailedTrain)
		{
			m_derailedTrain = train;
			SetUnblock(train);
		}
	}
	
	void ViewDetails() 
	{
		int top, left, right, bottom;
		
		if (m_Browser) 
		{
			left   = m_Browser.GetWindowLeft();
			top    = m_Browser.GetWindowTop();
			right  = m_Browser.GetWindowRight();
			bottom = m_Browser.GetWindowBottom();
		} 
		else 
		{
			m_Browser = Constructors.NewBrowser();
			left = 100;
			top  = 100;
			right = 380;
			bottom = 330;
		}
		m_Browser.SetWindowRect(left, top, right, bottom);
		m_Browser.LoadHTMLString(m_signalLibrary.GetViewDetails());
	}

	public void ViewDetailsHandler(Message msg) 
	{
		ViewDetails();
	}

    /*
	public void ZmvInit(Message msg)
    {
        if (m_signalLibrary)
            m_signalLibrary.Update();
    }
	*/
	
    //Initialization ==================================================================================================
    void initTables(Soup config)
    {
    }

    void initWaitTime(Soup config)
    {
        Soup options = config.GetNamedSoup("extensions");
        m_secWait = options.GetNamedTagAsBool("sec_wait", 4);
        m_secWaitRed = options.GetNamedTagAsBool("sec_wait_red", 8);
        m_nWaitSeconds = m_secWaitRed;
    }

    bool initSignalLibrary(Soup config)
    {
		Soup options = config.GetNamedSoup("extensions");
        if (m_bDebug) Print("initSignalLibrary","");
        Library lib = World.GetLibrary(GetAsset().LookupKUIDTable("zmv-signal-library"));
        if (lib == null)
        {
            Exception("initSignalLibrary:ERROR !!! lib == null");
            return false;        
        }
        
        ZmvSignalLibraryInterface signalLibraryInterface = cast<ZmvSignalLibraryInterface>(lib);
        if (signalLibraryInterface == null)
        {
            Exception("initSignalLibrary:ERROR !!! signalLibraryInterface == null");
            return false;        
        }        

        m_signalLibrary = cast<ZmvInterface>(signalLibraryInterface.GetSignalLibraryObject(options.GetNamedTag("signal_type")));
        
        if (m_signalLibrary == null)
        {
            Exception("initSignalLibrary:ERROR !!! m_signalLibrary == null");
            return false;        
        }

        m_signalLibrary.Init(me, config);
        m_allLenses = m_signalLibrary.GetAllLenses();        

        return true;
    }

    bool initLensesLibrary(Soup config)
    {
        if (m_bDebug) Print("initLensesLibrary","");
        Library lib = World.GetLibrary(GetAsset().LookupKUIDTable("zmv-lenses-library"));
        if (lib == null)
        {
            Exception("initLensesLibrary:ERROR !!! lib == null");
            return false;        
        }
        
        ZmvLensesLibraryInterface lensesFactory = cast<ZmvLensesLibraryInterface>(lib);
        if (lensesFactory == null)
        {
            Exception("initLensesLibrary:ERROR !!! lensesFactory == null");
            return false;        
        }

        m_lensesLibrary = cast<ZmvLensesInterface>(lensesFactory.GetInstance());
        if (m_lensesLibrary == null)
        {
            Exception("initLensesLibrary:ERROR !!! lensesLibraryInterface == null");
            return false;        
        }        

        m_lensesLibrary.Init(config);

        return true;
    }

    bool initConfigOptions()
    {
        Soup config = GetAsset().GetConfigSoup();
        Soup options = config.GetNamedSoup("extensions");
        m_bDebug = options.GetNamedTagAsBool("debug-signal", false);
        if (m_bDebug) Print("initConfigOptions","");
        m_bSemiautomat = options.GetNamedTagAsBool("semiautomat", false);
        if (!initSignalLibrary(config) or !initLensesLibrary(config))
            return false;
        m_bInvitationLense = (config.GetNamedSoup("mesh-table").GetNamedSoup("default").GetNamedSoup("effects").GetNamedSoup("c_white_invitation").CountTags() != 0);
        m_bOP = options.GetNamedTagAsBool("signal-op", false);

        initTables(config);
        initWaitTime(config);
        return true;
    }

    //User interface ====================================================================================================
    public int GetLensesState()
    {
		if (m_bDebug) Print("GetLensesState", "");
        return m_signalLibrary.GetLensesState();
    }

    public void ShowAllLenses() 
    {
        if (m_bDebug) Print("ShowAllLenses", "");
        showAllLenses();
    }    

    public void HideAllLenses() 
    {
        if (m_bDebug) Print("HideAllLenses", "");
        hideAllLenses();
    }
    
    public void SetLensesState(string[] lenses, int signalState, int speedLimit) 
    {
        if (m_bDebug) Print("SetLensesState", lenses);
        if (m_bDebug) Print("SetLensesState", "signalState="+signalState+",speedLimit="+speedLimit);
        setLensesState(lenses, signalState, speedLimit);
        if (m_bOP)
        {
            if (speedLimit)
            {
                if (m_bDebug) Print("SetLensesState", "CheckOn");
                m_bCheck = true;
                Check();
            }
            else
            {
                if (m_bDebug) Print("SetLensesState", "CheckOff");
                m_bCheck = false;
            }
        }
    }
	
	public void AddOtherSignalStateChangedHandler()
	{
		if (!m_bOtherSignalStateChangedHandler)
		{
			m_bOtherSignalStateChangedHandler = true;
			AddHandler(me, "Signal", "StateChanged", "OtherSignalStateChanged");
		}
	}
	
    public string GetTableString() 
    { 
        return ""; 
    }

    public void SetTableString(string name) 
    {
    }

    public void Init()
    {
        bool bSuveyor = (World.GetCurrentModule() == World.SURVEYOR_MODULE);
		inherited();
        
        //Print("Init", "");
        if (!initConfigOptions())
            return;
        //showAllLenses();

		m_bCheck = true;
		startChecker();
		
        AddHandler(me, "SetAutoblock", "", "SetAutoblock"); 
        AddHandler(me, "TurnOnInvitationSignal", "", "TurnOnInvitationSignal"); 
		
		if (m_bSemiautomat)
		{
			AddHandler(me, "CTRL", "", "OnCTRL");
			AddHandler(me, "SetAutomatMode", "", "SetAutomatMode");
			AddHandler(me, "SetSemiautomatMode", "", "SetSemiautomatMode");
			AddHandler(me, "SetBlock", "", "SetBlock");
			AddHandler(me, "SetUnblock", "", "SetUnblock");
		}
        if (bSuveyor)	
		{
			AddHandler(me, "SetPropagatedProperties", "", "SetPropagatedProperties");
		}
		else
		{
			AddHandler(me, "MapObject","View-Details","ViewDetailsHandler");
			AddHandler(me, "Browser-Closed","","BrowserCloseHandler");
			AddHandler(me, "Browser-URL","","BrowserUrlHandler");
			AddHandler(me, "Vehicle","Derailed","OnVehicleDerailed");
		}
    }
};
