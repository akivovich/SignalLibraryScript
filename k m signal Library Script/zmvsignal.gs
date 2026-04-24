include "zmvLenses.gs"
include "zmvsignallibraryinterface.gs"
include "zmvsignalinterface.gs"
include "zmvinterface.gs"
include "ZmvLensesLibraryInterface.gs"

class ZmvSignal isclass ZmvSignalInterface
{    
    //#region Definitions ============================================================
    ZmvInterface m_signalLibrary;
    ZmvLensesInterface m_lensesLibrary;

    public define float KPH_TO_MPS = 0.278;
    
    string[] m_allLenses;
    
    //from props
//    bool   m_bOP_Prop;          //OP type!!!!!!!!!!!!!!!!
    bool   m_bSemiProp;         //Semiauto 
    bool   m_bInvisible;
    //----------
    bool   m_bDebug;
    int    m_nCheckerInterval;  //sleep pause in CheckerProcess thread (sec)
    bool   m_bFirstTime = true; 

	Train  m_derailedTrain;	    //Last derailed train	
	
    Browser m_Browser;
	//#endregion
    //#region Print ================================================================
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
	//#endregion
    //#region Debug ================================================================
    public void SetDebugMode(bool tunOn) 
    {
        m_bDebug = tunOn;
    }
    //#region Checker process ======================================================    
    thread void checkerProcess(int interval)
	{
        if (m_nCheckerInterval) return;
        m_nCheckerInterval = interval;
    	if (interval > 2) Sleep(Math.Rand(0.5, 1.0));
        while (m_nCheckerInterval > 0)
		{
            m_signalLibrary.UpdateSignalState();
			Sleep(m_nCheckerInterval);
        }
        if (m_bDebug) Print("checkerProcess", "Exit");
    }
    //#endregion
    //#region Signal ==============================================================
    void setSpeedLimit(int speedLimit)
    {
        if (m_bDebug) Print("setSpeedLimit", "speedLimit="+speedLimit);
        if (speedLimit > 0) SetSpeedLimit(speedLimit*KPH_TO_MPS);
    }

    void setSignalState(int state)
    {
        if (m_bDebug) Print("setSignalState:", "state="+state);

        if (m_bFirstTime or state != GetSignalState())
		{	
			m_bFirstTime = false;
			SetSignalState(state,"");      
		}
    }
    //#endregion
    //#region Lenses operations ====================================================
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
    //#endregion
	
    void setLensesState(string[] lenses, int signalState, int speedLimit)
    {
        if (m_bDebug) Print("SetLensesState", "signalState="+signalState+",speedLimit="+speedLimit);
        if (lenses)	showLenses(lenses);
        setSpeedLimit(speedLimit);
        setSignalState(signalState);
    }

    //#region Properties ==========================================================================================================
    void UpdateTables()
    {
    }

    // void ResetSignal()
    // {
    //     if (m_bDebug) Print("ResetSignal", "");
        
    //     UpdateTables();
    //     m_signalLibrary.ResetSignal();
    // }

	public Soup GetProperties()
	{
        if (m_bDebug) Print("GetProperties", "");
 		Soup db = inherited();

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
        if (m_bDebug) Print("SetProperties", "");        
        
        m_signalLibrary.SetProperties(db);
        m_lensesLibrary.SetProperties(db, m_signalLibrary.GetNeighborProperties());
        UpdateTables();
        //ResetSignal();
 	}
    //#endregion
    //#region Editor
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
    
    public string GetPropertyValue(string id)
    {
if (m_bDebug) Print("GetPropertyName","id="+id);
   		if (m_lensesLibrary.HasProperty(id))
			return m_lensesLibrary.GetPropertyValue(id);
        return m_signalLibrary.GetPropertyValue(id);
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
    //#endregion
    //#region HTML content
    string GetNamesContentBase(StringTable ST)
    {
        return "";
    }

    string getContent(StringTable ST)
	{
		return GetNamesContentBase(ST) + m_lensesLibrary.GetPropertiesContent() + m_signalLibrary.GetPropertiesContent(ST);
	}

    public string GetDescriptionHTML()
	{
		StringTable ST = GetAsset().GetStringTable();
       	return m_signalLibrary.GetDescriptionHTML(ST, getContent(ST));
	}
    //#endregion
    //#region View Details ================================================================
	void viewDetails() 
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
    //#endregion
    //#region Message handlers ===========================================================
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
	
	public void OnFreeBlocksChanged(Message msg)
	{
		if (m_bDebug) Print("OnFreeBlocksChanged", msg.minor);
        m_signalLibrary.OnChangeFreeBlocksCount();
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

	public void ViewDetailsHandler(Message msg) 
	{
		viewDetails();
	}

   	public void BrowserUrlHandler(Message msg)
	{
		if (msg.src == m_Browser and msg.major == "Browser-URL")
		{
			m_signalLibrary.BrowserUrlHandler(msg);
			UpdateBrowser();
		}
	}

	public void BrowserCloseHandler(Message msg) 
	{
		if (msg.src == m_Browser) 
			m_Browser = null;
	}
	//#endregion
    //#region API ========================================================================
    public void UpdateSignalState() 
    {
        checkerProcess(1);
    }

    public void SetCheckerWorkMode(int interval)
    {
        if (m_bDebug) Print("SetCheckerWorkMode", "interval="+interval);
        checkerProcess(interval);
    }

    public bool IsSemiautomat() 
    {
        return m_bSemiProp;
    }

	public void AddObjectEnterOrLeaveHandler()
	{
		AddHandler(me, "Object", "Enter", "");
		AddHandler(me, "Object", "Leave", "");		
		AddHandler(me, "Object", "Enter", "OnObjectEnter");
		AddHandler(me, "Object", "Leave", "OnObjectLeave");		
	}

	public bool IsShuntMode()
	{
		return m_signalLibrary.IsShuntMode(); 
	}
	
	public void UpdateBrowser()
	{
		if (m_Browser)
			m_Browser.LoadHTMLString(m_signalLibrary.GetViewDetails());
	}

    public int GetLensesState()
    {
		if (m_bDebug) Print("GetLensesState", "");
        return m_signalLibrary.GetLensesState();
    }

    public int GetFreeBlocksCount()
    {
        if (m_signalLibrary) return m_signalLibrary.GetFreeBlocksCount();
        return 0;
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
    }

    public bool IsInvisible() 
    {
        return m_bInvisible;
    }

    public string GetTableString() 
    { 
        return ""; 
    }

    public void SetTableString(string name) 
    {
    }
	//#endregion
	
    //#region Initialization ==================================================================================================
    void InitTables(Soup config)
    {
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
        m_bSemiProp = options.GetNamedTagAsBool("semiautomat", false);
        m_bInvisible = config.GetNamedTagAsBool("surveyor-only", false);
        if (!initSignalLibrary(config) or !initLensesLibrary(config))
            return false;
//        m_bOP_Prop = options.GetNamedTagAsBool("signal-op", false); //!!!!!!!!!!!

        InitTables(config);
//        initWaitTime(config);
        return true;
    }

    public void Init()
    {
        bool bSuveyor = (World.GetCurrentModule() == World.SURVEYOR_MODULE);
		inherited();
        
        //Print("Init", "");
        if (!initConfigOptions())
            return;

        AddHandler(me, "SetAutoblock", "", "SetAutoblock");
        AddHandler(me, "TurnOnInvitationSignal", "", "TurnOnInvitationSignal");
        AddHandler(me, "FreeBlocksChanged", "", "OnFreeBlocksChanged");
		
		if (m_bSemiProp)
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
    //#endregion
};
