include "library.gs"
include "signal.gs"
include "train.gs"
include "trackside.gs"
include "GSTrackSearch.gs"
include "trackmark.gs"
include "zmvsignallibraryinterface.gs"
include "zmvsignalinterface.gs"
include "zmvinterface.gs"
include "ZmvMarker.gs"

class ZmvProperties
{
    Soup db;
    public void Clear() 	{ db = Constructors.NewSoup(); }
	public bool HasNamedTag(string name)
	{ 
		return (db.GetIndexForNamedTag(name) >= 0); 
	}
    public void SetNamedTag(string name, string value)  
	{ 
		if (!HasNamedTag(name))
			db.SetNamedTag(name, value); 
	}
    public void SetNamedTag(string name, int value)     
	{ 
		if (!HasNamedTag(name))
			db.SetNamedTag(name, value); 
	}
    public void SetNamedTag(string name, bool value)    
	{ 
		if (!HasNamedTag(name))
			db.SetNamedTag(name, value); 
	}
	
	public string GetNamedTag(string name) { return db.GetNamedTag(name); }
	public bool   GetNamedTagAsBool(string name)  { return db.GetNamedTagAsBool(name); }
	public int    GetNamedTagAsInt(string name)   { return db.GetNamedTagAsInt(name); }
	public float  GetNamedTagAsFloat(string name) { return db.GetNamedTagAsFloat(name); }	
};


class ZmvLensesData
{
    string[] lenses = new string[0];

    public void addLense(string str) { lenses[lenses.size()] = str; }
    public string[] getLenses() { return lenses; }
    public bool lenseExists(string lense)
    {
        int i, len = lenses.size();
        for (i = 0; i < len; i++)
        {
            if (lenses[i] == lense)
                return true;
        }
        return false;
    }
};

//#region ZmvBase
class ZmvBase isclass ZmvInterface
{    
	public define float KPH_TO_MPS = 0.278;
	public define int MAX_FREE_BLOCKS = 10;
    
	ZmvSignalInterface m_signal;
    ZmvSignalInterface m_prevSignal, m_prevSignalALS;
    Asset m_asset;

    ZmvLensesData   m_allLenses;
    ZmvLensesData[] m_lenseTypes;
    
    bool m_bDebug;
    bool m_bRoutePointer;		//has Route pointer device
    bool m_bAutoblock, 			//Autoblock by propery (default)
		 m_bAutoblockCurrent; 	//Autoblock currently (may be changed by command)
    bool m_bSemiAutomat;		//Semiautomat mode from properties
    bool m_bSemiAutomatProp;    //is Signal semiautomat
	bool m_bSemiAutomatCurrent; //is currently Signal in semiautomat (may be changed by command) 
	bool m_bRepeater; 			//repeats next signal state
	
	int  m_DistanceToVehicle;
	bool m_bOpenedProperties = false;
	bool m_bCancel = false; 
	bool m_bSuveyor;			//if opened in Editor
	
    Train m_nextTrain;
	bool  m_bEmptyNextObject, 
		  m_bNextVehicle;
	Train m_blockedByTrain; 	//Blocked by train corresponded path
	
    int   m_nLensesState = -1, m_nPrevLensesState = -1;
    int   m_freeBlocks = MAX_FREE_BLOCKS + 1;
    int   m_alsValue = -1, m_aslTrainDistance, m_nextSpeedLimitForALS = -1;
	bool  m_prevRS;
	Train m_TrainForALS; //-----------------------

	bool m_PS = false; //turned on PS
	
    int[] m_speedLimits;

    ZmvMarker m_nextMarker;
    object m_nextObject;
	ZmvProperties m_savedProperties;
	
	string[] m_ForAllData = new string[0];
	bool m_BlockQueueBusy = false;	
	Train[] m_blockQueue = new Train[0];

	void setSemiAutoMode(bool semiauto);
	int CalcFreeBlocks(object nextObject);
	int GetNewLensesStateByFreeBlocks();

    //#region Debug =======================================================================================    	
	bool IsDebug()
	{
		string name = m_signal.GetName();
		return name == "0";//"test";// or name == "2";
	}
	/*
	public void Print(string method, Train train, string info)
	{
		if (train)
			Interface.Print(method+"::Train=" + train.GetFrontmostLocomotive().GetName()+","+info);
		else
			Interface.Print(method+"::Train=null,"+info);
	}
	*/
	public void Print(string method, string s)
    {
        Interface.Print("ZmvSignalLibrary::"+method+":"+m_signal.GetName()+":"+s);
    }    

    public void PrintArray(string method, string[] s)
    {
        string str = "" + s.size() + ":";
        int i, len = s.size();
        for (i = 0; i < len; i++)
        {
            str = str + s[i] + ",";
        }
        Print(method, str); 
    }    
	//#endregion
	//#region HTML ========================================================================================
    public string getPropertyHTML(string name, string value, string valueId, string allPref)
    {
        string link = "live://property/" + valueId;
        string content = HTMLWindow.MakeCell(HTMLWindow.MakeLink(link, "<font color=#cede20>"+name+"</font>"),"bgcolor=#555555")+
    			         HTMLWindow.MakeCell(HTMLWindow.MakeLink(link, "<font color=#cede20>"+value+"</font>"),"bgcolor=#777777");
        if (allPref != "")
        {			
			m_ForAllData[m_ForAllData.size()] =  valueId + "#" + allPref + ":" + name;
        }
        return HTMLWindow.MakeRow(content);
    }

    public string GetPropertyTitleHTML(string title)
    {
        return HTMLWindow.MakeRow(HTMLWindow.MakeCell("<i><b><font color=#e3f708>  " + title + "</font></b></i>","bgcolor=#555555"));
    }

    public string GetPropertyHTML(string name, string value, string valueId, string allPref)
    {
        return getPropertyHTML(name, value, valueId, allPref);
    }

    public string GetDescriptionHTML(StringTable ST, string content)
	{
 		string str = "<html><body><font color=#ccee00 size=13><p>" + ST.GetString("object-name") + "</p></font><br>" +
                     HTMLWindow.MakeTable(content, "width=100% border=1 cellspacing=1")+
                     "<br><font face=Century Gothic color=#B8B8B8 size=1><b>  � CyriTRAINZ and Akivovich 2012</b></body></html>";		        
       	return str;
	}
	//#endregion
    //#region Edit ========================================================================================
    void GetAlsTrainValues()
	{        
		GSTrackSearch thesearch = m_signal.BeginTrackSearch(false);
		object nextObject = thesearch.SearchNext();
		while (nextObject)
		{
			if (nextObject.isclass(Vehicle))
			{                
				m_TrainForALS = (cast<Vehicle>(nextObject)).GetMyTrain();
				m_aslTrainDistance = thesearch.GetDistance();
				break;
			}
            nextObject = thesearch.SearchNext();
		}		
	}
	
	ZmvSignalInterface GetNextSignal(bool back)
    {
        GSTrackSearch thesearch = m_signal.BeginTrackSearch(!back);
		object nextObject = thesearch.SearchNext();
		while(nextObject)
		{
			if (nextObject.isclass(ZmvSignalInterface))
			{                
                if (m_bDebug) Print("getNextObject", "nextSignal="+ (cast<Signal>(nextObject)).GetName());
                if (thesearch.GetFacingRelativeToSearchDirection() != back)
                {
                    if (m_bDebug) Print("getNextObject", "OK nextSignal="+ (cast<Signal>(nextObject)).GetName());
                    break;
                }
			}
            nextObject = thesearch.SearchNext();
		}

        if (nextObject == me)
            nextObject = null;

        return cast<ZmvSignalInterface>(nextObject);                
    }
	
	ZmvSignalInterface GetPreviousSignalForALS()
	{
		if (!m_prevSignalALS) 
		{
			if (m_signal.IsProhodnoy() and m_prevSignal) m_prevSignalALS = m_prevSignal;
			else m_prevSignalALS = GetNextSignal(true);
		}
		
		return m_prevSignalALS;
	}	
	
    void setTableNumber(Soup db, bool prev)
    {
        string name = db.GetNamedTag("name");
        int n = Str.ToInt(name);
        if (prev)
        {
            n = n + 2;
        }
        else
        {
            if (n >= 2)
                n = n - 2;
        }
        if (m_bDebug) Print("setTableNumber", "n="+n);
        m_signal.SetTableString((string)n);
    }

    public void setProperties(Soup db);
	
	public Soup GetNeighborProperties()
	{
        if (m_bDebug) Print("GetNeighborProperties", "");
    
        Soup db;
        ZmvSignalInterface nextSignal;
        
        nextSignal = GetNextSignal(true); //previous
        if (nextSignal == null)
        {
            nextSignal = GetNextSignal(false); //next
            if (nextSignal != null)
            {
                if (m_bDebug) Print("GetNeighborProperties", "name="+ nextSignal.GetName());            
                db = nextSignal.GetProperties();
            }
            else
            {
                if (m_bDebug) Print("GetNeighborProperties", "");            
                db = Constructors.NewSoup();
            }
        }
        else
        {
            if (m_bDebug) Print("GetNeighborProperties", "name="+ nextSignal.GetName());            
            db = nextSignal.GetProperties();
        }        
		
		return db;
	}
	
    void setProprtiesFromNeighbor()
    {
        if (m_bDebug) Print("setProprtiesFromNeighbor", "");
    
        Soup db ;
        ZmvSignalInterface nextSignal;
        
        nextSignal = GetNextSignal(true); //previous
        if (nextSignal == null)
        {
            nextSignal = GetNextSignal(false); //next
            if (nextSignal != null)
            {
                if (m_bDebug) Print("setProprtiesFromNeighbor", "name="+ nextSignal.GetName());            
                db = nextSignal.GetProperties();
                setTableNumber(db, false);
            }
            else
            {
                if (m_bDebug) Print("setProprtiesFromNeighbor", "");            
                db = Constructors.NewSoup();
            }
        }
        else
        {
            if (m_bDebug) Print("setProprtiesFromNeighbor", "name="+ nextSignal.GetName());            
            db = nextSignal.GetProperties();
            setTableNumber(db, true);
        }        

        setProperties(db);
    }
	//#endregion
    //#region Lenses operations ===========================================================================
    int getSignalState();

    void showAllLenses()
    {
        if (m_bDebug) Print("showAllLenses", "");
        m_signal.ShowAllLenses();
    }

    void hideAllLenses()
    {
        if (m_bDebug) Print("hideAllLenses", "");
        m_signal.HideAllLenses();
    }
	
	bool ShowAutoblocLenses()
	{
//		if (m_bDebug) Print("ShowAutoblocLenses", "m_bAutoblockCurrent=" + m_bAutoblockCurrent);
		return m_bAutoblockCurrent;
	}
	
	string[] getLenses() 
	{
		//if (m_bDebug or IsDebug()) Print("getLenses", "m_nLensesState=" + m_nLensesState);
		ZmvLensesData lensesData = m_lenseTypes[m_nLensesState];
		string[] lenses;
		if (lensesData) {
			lenses = lensesData.getLenses();
			if (m_PS) {
				int i, len = lenses.size();
				string[] newLenses = new string[len + 1];
				for (i = 0; i < len; i++) {
					newLenses[i] = lenses[i];
				}
				newLenses[i] = ZmvLenseTypes.scWf;
				return newLenses;
			}
			return lenses;
		}
		lenses = new string[0];
		lenses[0] = ZmvLenseTypes.scR;
		if (m_PS) lenses[1] = ZmvLenseTypes.scWf;
		return lenses;
	}

    void showLenses()
    {
        if (m_bDebug or IsDebug()) Print("showLenses", "m_nLensesState=" + m_nLensesState);
    
		int nLensesState = m_nLensesState;
		if (m_lenseTypes[nLensesState] or m_PS)
        {
            int nSpeedLimit;
			if (m_PS) 	nSpeedLimit = m_speedLimits[ZmvSignalTypes.PS];
			else		nSpeedLimit = m_speedLimits[nLensesState];

            switch (nLensesState)
			{
				case ZmvSignalTypes.W: //!!!!!!!!!!!
					break;
				default:
					//if (m_bDebug or IsDebug()) Print("showLenses","lenseExists="+(string)m_allLenses.lenseExists(ZmvLenseTypes.scB));
					if (!ShowAutoblocLenses())
					{
						if (nSpeedLimit or !m_allLenses.lenseExists(ZmvLenseTypes.scB))
							nLensesState = ZmvSignalTypes.B; //turn off all lenses
						else
							nLensesState = ZmvSignalTypes.R;
					}
					break;
            }
			
			//if (m_bDebug or IsDebug()) Print("showLenses1", "nLensesState=" + nLensesState);
			string[] lenses = getLenses();			
            //if (m_bDebug or IsDebug()) 
			//	if (lenses)
			//		PrintArray("showLenses2", lenses);
			//	else
			//		Print("showLenses2", "----");
			//if (m_bDebug or IsDebug()) Print("showLenses3", "getSignalState=" + getSignalState());
            m_signal.SetLensesState(lenses, getSignalState(), nSpeedLimit);
        }
    }

    void clrRouteNumber()
    {
        if (m_bDebug) Print("clrRouteNumber", "");
        m_signal.ClrRouteNumber();
    }

    void setRouteNumber(ZmvMarker marker)
    {
        //if (m_bDebug) Print("setRouteNumber", "val="+val);
        m_signal.SetRouteNumber(marker);
    }
	//#endregion
    //#region Checker =====================================================================================
    ZmvMarker getNextMarker(object nextObject)
    {
		ZmvMarker res = null;
		
		Trackside obj = cast<Signal>(nextObject);
		if (!obj) return null;
		GSTrackSearch thesearch = obj.BeginTrackSearch(true);
		object nextObj = thesearch.SearchNext();
		while (nextObj != null)
		{
	
	//Print("getNextMarker",(cast<GameObject>(nextObj)).GetName());
	
			if (nextObj.isclass(ZmvMarker) and thesearch.GetFacingRelativeToSearchDirection())
			{
				res = cast<ZmvMarker>(nextObj);
				break;
			}
			if (thesearch.GetDistance() >= 500)
				break;

			nextObj = thesearch.SearchNext();
		}
		
        if (m_bDebug) 
		{
			if (res) Print("getNextMarker", "found:"+res.GetName());        
			else	 Print("getNextMarker","Marker not found");        			
		}
        return res;            
    }

    void setRouteNumber(object nextObject, int nNewLensesState, bool force)
    {        
        if (m_bDebug or IsDebug()) 
        {
            Print("setRouteNumber", "nNewLensesState="+nNewLensesState+",nextObject != m_nextObject:"+(string)(nextObject != m_nextObject));
            if (nextObject) 
            {
                if (nextObject.isclass(Signal))   
                    Print("setRouteNumber", "nextObject="+(cast<Signal>(nextObject)).GetName());
                else if (nextObject.isclass(Vehicle))   
                    Print("setRouteNumber","nextObject="+(cast<Vehicle>(nextObject)).GetName());
            }
        }
		
		bool r_or_ry = (nNewLensesState == ZmvSignalTypes.R or nNewLensesState == ZmvSignalTypes.RY);
        if (nextObject == null or (r_or_ry and !m_PS))
        {
			if (m_bDebug or IsDebug()) 
				Print("setRouteNumber1","clrRouteNumber");
            clrRouteNumber();
        }
        else if (force or nextObject != m_nextObject or m_nLensesState != nNewLensesState)
        {
			if (m_bDebug or IsDebug()) 
				Print("setRouteNumber2","m_nextMarker="+!!m_nextMarker);
            if (m_nextMarker == null)               
                m_nextMarker = getNextMarker(nextObject);
			if (m_bDebug or IsDebug()) 
				Print("setRouteNumber3","m_nextMarker="+!!m_nextMarker);
			if (m_nextMarker == null)
                clrRouteNumber();
            else
				setRouteNumber(m_nextMarker);
        }
    }

    Train getNextTrain()
    {
        if (m_bDebug) Print("getNextTrain", "");

        Train nextTrain = null;
		GSTrackSearch thesearch = m_signal.BeginTrackSearch(true);
		object nextObject = thesearch.SearchNext();
		while (nextObject != null)
		{
			if (nextObject.isclass(Signal))
			{
                if (thesearch.GetFacingRelativeToSearchDirection())
                {
                    if (m_bDebug) Print("getNextTrain", "nextSignal="+ (cast<Signal>(nextObject)).GetName());
                    break;
                }
			}
			else if (nextObject.isclass(Vehicle))
            {
                if (m_bDebug) Print("getNextTrain", "nextVehicle="+ (cast<Vehicle>(nextObject)).GetName());
				nextTrain = (cast<Vehicle>(nextObject)).GetMyTrain();
				break;
            }
			nextObject = thesearch.SearchNext();
		}

        return nextTrain;            
    }

    object ProcessSearchNextObject()
    {
        m_nextMarker = null;

        if (m_bDebug) Print("ProcessSearchNextObject", "");

        GSTrackSearch thesearch = m_signal.BeginTrackSearch(true);
		object nextObject = thesearch.SearchNext();
		while (nextObject != null)
		{
			if (nextObject.isclass(ZmvMarker))
			{                
                if (!m_nextMarker and thesearch.GetFacingRelativeToSearchDirection())
                {
                    m_nextMarker = cast<ZmvMarker>(nextObject);
    //if (m_bDebug or IsDebug()) Print("ProcessSearchNextObject", "nextMarker="+ m_nextMarker.GetName());
                }
            }
			else if (nextObject.isclass(Signal))
			{
                if (thesearch.GetFacingRelativeToSearchDirection())
                {
    //if (m_bDebug or IsDebug()) Print("ProcessSearchNextObject", "nextSignal="+ (cast<Signal>(nextObject)).GetName());
                    break;
                }
			}
			else if (nextObject.isclass(Vehicle))
            {
    //if (m_bDebug or IsDebug()) Print("ProcessSearchNextObject", "nextVehicle="+ (cast<Vehicle>(nextObject)).GetName());
                m_DistanceToVehicle = (int)thesearch.GetDistance();
				break;
            }
			else
			{
    //if (m_bDebug or IsDebug()) Print(" ", "ProcessSearchNextObject="+ (cast<GameObject>(nextObject)).GetName());
			}
			nextObject = thesearch.SearchNext();
		}

        return nextObject;            
    }
	//#endregion
    //#region Lenses State operations =====================================================================    	
	int getNewRepeaterLensesState(int nPrevLensesState)
	{
        if (m_bDebug) Print("getNewRepeaterLensesState", "nPrevLensesState =" + nPrevLensesState);
        return ZmvSignalTypes.R;	
	}
	
    int GetNewLensesStateByFreeBlocks()
    {
        if (m_bDebug) Print("GetNewLensesStateByFreeBlocks", "Base");
        return ZmvSignalTypes.R;
    }

    public int GetLensesState();

	void processNextVehicle(Vehicle vehicle)
	{
		Train train = vehicle.GetMyTrain();
		Vehicle front = train.GetFrontmostLocomotive();

		//Print("processNextVehicle", m_nextTrain, ","+front.GetName());

		if (train != m_nextTrain)
		{
			if (train.GetVehicles().size() == 1 or vehicle != front)
			{
				//Print("$$processNextVehicle$$","m_bAutoblock="+m_bAutoblock+",m_bAutoblockCurrent="+m_bAutoblockCurrent);
				if (!m_bEmptyNextObject)
				{
					if (m_bSemiAutomat and !m_bSemiAutomatCurrent) setSemiAutoMode(true);
					if (!m_bAutoblock and m_bAutoblockCurrent) 
					{
						m_bAutoblockCurrent = m_bAutoblock;
						ZmvSignalInterface nextSignal = GetNextSignal(false);
						if (nextSignal) front.PostMessage(nextSignal, "SetAutoblock", "", 0);
					}
				}
				m_nextTrain = train;
			}
		}
	}

    int processNextZmvSignalForLensesState(ZmvSignalInterface signal)
	{
		int nNewLensesState;
		if (m_bRepeater and signal.IsAutomated())
		{
			int state = signal.GetLensesState();
			if (state < 0 or state == ZmvSignalTypes.R)  nNewLensesState = ZmvSignalTypes.R;
			else										 nNewLensesState = getNewRepeaterLensesState(state);
		}
		else
		{
			nNewLensesState = GetNewLensesStateByFreeBlocks();
		}
		if (m_bDebug /*or IsDebug()*/) Print("$$processNextObjectForLensesState$$","name="+signal.GetName()+",state="+signal.GetLensesState()+",N="+signal.GetFreeBlocksCount());
		m_nextTrain = null;
		m_nextSpeedLimitForALS = signal.GetSpeedLimit()/KPH_TO_MPS;
		return nNewLensesState;
	}

    int processNextObjectForLensesState(object nextObject)
    {
		int nNewLensesState = ZmvSignalTypes.R;		
		//if (IsDebug()) Print("processNextObjectForLensesState(object nextObject)","");
		if (nextObject != null)
		{
			m_bNextVehicle = nextObject.isclass(Vehicle);
			if (!m_bNextVehicle)                
			{
				//if (m_bDebug or IsDebug()) Print("$$processNextObjectForLensesState$$","nextObject.isclass(ZmvSignalInterface)="+(string)nextObject.isclass(ZmvSignalInterface)+",name="+(cast<GameObject>(nextObject)).GetName());				
				if (nextObject.isclass(ZmvSignalInterface))
				{
					nNewLensesState = processNextZmvSignalForLensesState(cast<ZmvSignalInterface>(nextObject));
				}
				else if (nextObject.isclass(Signal))
				{
					nNewLensesState = GetNewLensesStateByFreeBlocks();
					Signal signal = cast<Signal>(nextObject);
					m_nextTrain = null;
					m_nextSpeedLimitForALS = signal.GetSpeedLimit()/KPH_TO_MPS;
				}				
			}
			else 
			{
				if (m_bDebug /*or IsDebug()*/) Print("$$processNextObjectForLensesState$$","NextObject-Vehicle");
				if ((m_bSemiAutomat and !m_bSemiAutomatCurrent) or (!m_bAutoblock and m_bAutoblockCurrent))
				{
					processNextVehicle(cast<Vehicle>(nextObject));
				}
			}
			m_bEmptyNextObject = false;
		}
		else
		{
			m_bNextVehicle = false;
			m_bEmptyNextObject = true;
		}
		
		m_signal.UpdateBrowser();
		
        if (m_bDebug /*or IsDebug()*/) Print("processNextObjectForLensesState","NewLensesState="+(string)nNewLensesState);

        return nNewLensesState;
    }
	
	int getNextSpeedLimitForALS()
	{
		return m_nextSpeedLimitForALS;
	}
	
    int getNewFinalLensesState()
    {
        int nNewLensesState;
        object nextObject = ProcessSearchNextObject();
		
	//!!!!!!!!!!!!!! if (IsDebug()) Print("getNewFinalLensesState","m_nLensesState="+m_nLensesState);
        if (m_nextMarker != null and m_nextMarker.IsClosed())
        {
            if (m_bDebug /*or IsDebug()*/) Print("getNewFinalLensesState","NextMarkerClosed");
			nNewLensesState = ZmvSignalTypes.R;
        }
        else
        {
            nNewLensesState = processNextObjectForLensesState(nextObject);        
        }
    
		if (m_bRoutePointer)
            setRouteNumber(nextObject, nNewLensesState, false);
        m_nextObject = nextObject;

		if (m_bDebug /*or IsDebug()*/) Print("getNewFinalLensesState","NewLensesState="+(string)nNewLensesState+",trainAfterSignal="+(nextObject != null and nextObject.isclass(Vehicle)));
        
        return nNewLensesState;
    }
    
    int getSignalStateByLensesState()
    {
        if (m_bDebug) Print("getSignalStateByLensesState","m_nLensesState="+ m_nLensesState);
        if (m_bDebug) Print("getSignalStateByLensesState","RED");
        return m_signal.RED;   
    }

    int getSignalState()
    {
        int nSignalState;

        if (!m_speedLimits[m_nLensesState] or m_nPrevLensesState < 0)// or !m_speedLimits[m_nPrevLensesState])
            nSignalState = m_signal.RED;
        else
            nSignalState = getSignalStateByLensesState();
        
        if (m_bDebug) Print("getSignalState", "nSignalState="+ nSignalState);

        //SetSignalState(nSignalState,"");      
        return nSignalState;
    }

    void setCurrentState()
    {
        if (m_bDebug or IsDebug()) Print("setCurrentState", "m_nLensesState=" + m_nLensesState);
		if (m_nLensesState < 0) {
		 	m_nLensesState = ZmvSignalTypes.R;
            if (m_bRoutePointer)
				clrRouteNumber();
		}
        showLenses();
    }

	bool ShouldUseChecker()
	{
		if (m_bDebug /*or IsDebug()*/) Print("ShouldUseChecker", !m_bSemiAutomatCurrent);
		return !m_bSemiAutomatCurrent;
	}
	
    void CheckNextSignalAndUpdateState()
    {
        if (!ShouldUseChecker()) return;
		//int newFreeBlocks = CalcFreeBlocks(m_nextObject);
		//bool freeBlocksChanged = UpdateFreeBlocksCount(newFreeBlocks);
        int nNewLensesState = getNewFinalLensesState();

		if (m_bDebug or IsDebug()) Print("CheckNextSignalAndUpdateState","old="+m_nLensesState+"+ new="+ nNewLensesState+", freeBlocks="+m_freeBlocks);

		if (nNewLensesState != m_nLensesState)
        {
            m_nPrevLensesState = m_nLensesState;
			m_nLensesState = nNewLensesState;
            setCurrentState();
        }
		else if (m_nPrevLensesState != m_nLensesState)
		{
			m_nPrevLensesState = m_nLensesState;
			setCurrentState();
		}
		// Notify previous signal when free blocks count changes
		//if (freeBlocksChanged)
		//	m_signal.UpdateBrowser();
    }
	//#endregion	
    //#region Properties ==================================================================================
    void propagateProperties(string id)
    {
        if (m_bDebug) Print("propagateProperties","id="+id);
		m_signal.PostMessage(null, "SetPropagatedProperties", id, 0);
    }
	
    public void setProperties(Soup db)
    {
        if (m_bDebug) Print("setProperties","m_bOpenedProperties="+m_bOpenedProperties+",m_bCancel="+m_bCancel);
        		
        bool bAutoblock = db.GetNamedTagAsBool("autoblock", true);
		int  speedPS = db.GetNamedTagAsInt("speed-PS", m_speedLimits[ZmvSignalTypes.PS]);
				
		if (m_bOpenedProperties and !m_bCancel)
			m_bCancel = (bAutoblock != m_bAutoblock or speedPS != m_speedLimits[ZmvSignalTypes.PS]);
		
		if (m_bDebug) Print("setProperties","bAutoblock="+bAutoblock+",m_bAutoblock="+m_bAutoblock+",m_bCancel="+m_bCancel);

		m_bRepeater = db.GetNamedTagAsBool("repeater", false);
		m_bAutoblock = m_bAutoblockCurrent = bAutoblock;
        m_speedLimits[ZmvSignalTypes.PS] = speedPS;

        if (m_bSemiAutomatProp)
        {
            bool bSemiAutomat = db.GetNamedTagAsBool("semiautomat", false);
			if (m_bOpenedProperties and !m_bCancel)
				m_bCancel = (m_bSemiAutomat != bSemiAutomat);			
			m_bSemiAutomat = bSemiAutomat;
            setSemiAutoMode(m_bSemiAutomat);
        }
		
		if (m_bOpenedProperties)
		{
			if (m_bDebug) Print("setProperties","Cancel="+m_bCancel);
			if (m_bCancel)
				propagateProperties("Cancel");
			else
				propagateProperties("Ok");
				
			m_bCancel = m_bOpenedProperties = false;
		}		
        Update();
    }

    public void Update();

    public void getProperties(Soup db)
    {
        if (m_bDebug) Print("getProperties","");
        
        db.SetNamedTag("autoblock", m_bAutoblock); 
        db.SetNamedTag("repeater", m_bRepeater); 
        db.SetNamedTag("speed-PS", m_speedLimits[ZmvSignalTypes.PS]); 
        if (m_bSemiAutomatProp)
            db.SetNamedTag("semiautomat", m_bSemiAutomat);
    }

    void restoreProperties()
	{
        if (m_bDebug) Print("restoreProperties","");

		if (m_savedProperties.HasNamedTag("autoblock"))
			m_bAutoblock = m_bAutoblockCurrent = m_savedProperties.GetNamedTagAsBool("autoblock");
		if (m_savedProperties.HasNamedTag("speed-PS"))
			m_speedLimits[ZmvSignalTypes.PS] = m_savedProperties.GetNamedTagAsInt("speed-PS");
	}

    public void setPropagatedProperties(Soup soup, string par, bool all) 
    {
        if (m_bDebug) Print("setPropagatedProperties","par="+par);
		
		if (all or par == "mode")
		{
			m_savedProperties.SetNamedTag("autoblock", m_bAutoblock); 
			m_bAutoblock = m_bAutoblockCurrent = soup.GetNamedTagAsBool("autoblock");
		}
		if (all or par == "speedLimitPS") 
		{
			m_savedProperties.SetNamedTag("speed-PS", m_speedLimits[ZmvSignalTypes.PS]); 
			m_speedLimits[ZmvSignalTypes.PS] = soup.GetNamedTagAsInt("speed-PS");
		}
    }
	
    string getBoolPropertiesStr(StringTable ST, bool value)
    {
       if (value)
            return ST.GetString("signal-mode-on");
       return ST.GetString("signal-mode-off");        
    }

    string getModeContent(StringTable ST)
    {
        string mode         = getBoolPropertiesStr(ST, m_bAutoblock), 
               repeater     = getBoolPropertiesStr(ST, m_bRepeater),
			   modeSemiauto = getBoolPropertiesStr(ST, m_bSemiAutomat),
               title = ST.GetString("signal-modes"),
			   res = GetPropertyTitleHTML(title);
                
        if (m_bSemiAutomatProp)
            res = res + GetPropertyHTML(ST.GetString("signal-semiautomath"), modeSemiauto, "semiautomat", "");
		res = res + GetPropertyHTML(ST.GetString("signal-repeater"), repeater, "repeater", "");
		res = res + GetPropertyHTML(ST.GetString("signal-mode"), mode, "mode", title);
        return res;
    }

    string getOptionalContent(StringTable ST)
    {
        string title = ST.GetString("signal-optional");
		
		return  GetPropertyTitleHTML(title) + 
                GetPropertyHTML(ST.GetString("signal-alls"), ST.GetString("signal-for-all"), "forAll", title);
    }

    string GetUseSignalsContent(StringTable ST) {return "";}

    string getUseSignalsContentBase(StringTable ST) 
    {
        string content = GetUseSignalsContent(ST);

        if (content != "")
        {
            return GetPropertyTitleHTML(ST.GetString("signal-use")) + content;
        }        
        
        return "";
    }
    
    string getSpeedLimitsContentPS(StringTable ST) 
    {
		return  GetPropertyHTML(ST.GetString("signal-speed-limit-wf"), (string)m_speedLimits[ZmvSignalTypes.PS], "speedLimitPS", ST.GetString("signal-speed-limit"));
    }

    string getSpeedLimitsContent(StringTable ST) 
    {
        return "";
    }

    string getSpeedLimitsContentBase(StringTable ST) 
    {
        return  GetPropertyTitleHTML(ST.GetString("signal-speed-limit")) + getSpeedLimitsContent(ST) + getSpeedLimitsContentPS(ST);
    }

    public string GetPropertyType(string id)
    {
        if (m_bDebug) Print("GetPropertyType","id="+id);        
        if (id == "speedLimitPS") return "int";
		else if (id == "forAll") return "list";
		
        return "link";
    }
		
    public string GetPropertyName(string id)
    {
        if (m_bDebug) Print("GetPropertyName","id="+id);
/*
		string 	par1 = "speedLimit",
				par2 = Str.CloneString(id); 
		Str.Left(par2, par1.size());		
		if (par1 == par2)		
*/		
		if (id == "forAll") return m_asset.GetStringTable().GetString("signal-list-title");

		string par = "speedLimit";
		if (id[0, par.size()] == par)		
			return m_asset.GetStringTable().GetString("signal-speed-param");

			return "";		
	}
	
    public string[] GetPropertyElementList(string id) 
    {
        if (m_bDebug) Print("GetPropertyElementList","id="+id);
        int i, len = m_ForAllData.size();
		string[] temp;
		string[] res = new string[len];
		
		for (i = 0; i < len; i++)
		{
			temp = Str.Tokens(m_ForAllData[i], "#");
			res[i] = temp[1];
		}
		
		return res;
    }

 	public void LinkPropertyValue(string id)
	{		
        if (m_bDebug) Print("LinkPropertyValue","id="+id);        

        if (id == "mode") m_bAutoblock = m_bAutoblockCurrent = !m_bAutoblock;
        else if (id == "semiautomat")
        {
            m_bSemiAutomat = !m_bSemiAutomat;
            setSemiAutoMode(m_bSemiAutomat);
        }
		else if (id == "repeater")
		{
			m_bRepeater = !m_bRepeater;
		}
        /*
		else if (TrainUtil.HasPrefix(id, "propagate-"))
        {
            string par = Str.Tokens(id, "-")[1];
            if (m_bDebug) Print("LinkPropertyValue","par="+par);            
            propagateProperties(par);
        }
		*/
        else inherited(id);
 	}

	public void SetPropertyValue(string id, int val)
	{
        if (m_bDebug) Print("SetPropertyValue(int)","id="+id+", val="+val);

        if (id == "speedLimitPS") m_speedLimits[ZmvSignalTypes.PS] = Str.ToInt(val);
        else inherited(id,val);
 	}

	public void SetPropertyValue(string id, string val)
	{
        if (m_bDebug) Print("SetPropertyValue(string)","id="+id+", val="+val);
 	}
	
	public void SetPropertyValue(string id, string val, int index)
	{
		if (m_bDebug) Print("SetPropertyValue(string)","id="+id+", val="+val+",index="+index);
		string[] temp = Str.Tokens(m_ForAllData[index], "#");
		propagateProperties(temp[0]);		
	}
	//#endregion
	//#region AutoMode ====================================================================================
	void UpdateAfterChangeAutoMode()
	{
	//if (IsDebug()) Print("UpdateAfterChangeAutoMode", "ShouldUseChecker()="+ShouldUseChecker());
        if (m_bSemiAutomatCurrent)
        {
            m_nextObject = null;
			m_nLensesState = m_nPrevLensesState = ZmvSignalTypes.R;
            showLenses();
            if (m_bRoutePointer)
                clrRouteNumber();
			UpdateFreeBlocksCount(0);
        }
        else
        {
            if (m_bRoutePointer)
                clrRouteNumber();
            m_nextObject = ProcessSearchNextObject();
            int newFreeBlocks = CalcFreeBlocks(m_nextObject);
			UpdateFreeBlocksCount(newFreeBlocks);
        }

		m_signal.SetCheckerWorkMode(ShouldUseChecker());
	}
	
    void setSemiAutoMode(bool semiauto)
    {
        if (m_bDebug /*or IsDebug()*/) Print("setSemiAutoMode","semiauto="+semiauto);

        m_bSemiAutomatCurrent = semiauto;
		if (semiauto) {
			m_nextSpeedLimitForALS = -1;
			m_nextMarker = null;
		}
        UpdateAfterChangeAutoMode();
    }	
	//#endregion	
	//#region Browser =====================================================================================
	string GetDetailsRow(string key, string val)
	{
		return "<tr><td><font color=#cede20><b>"+key+"</b></font></td><td><font color=#cede20><b><i>"+val+"</i></b></font></td></tr>";
	}
	
	string GetDetailsLink(string id, string str)
	{
		return  "<tr><td><font color=#ce9e20><b><a href='live://"+id+"'>" + str + "</a></b></font></td><td></td></tr>";
	}
	
	string GetTrainDisplayName(Train train)
	{
		return train.GetFrontmostLocomotive().GetName() + "(" +  train.GetTrainDisplayName() + ")";
	}
	
	string GetBlockedTrainDisplayName()
	{
		if (m_blockedByTrain)
		{
			return GetTrainDisplayName(m_blockedByTrain);
		}
		
		return "---";
	}
	
	string GetBlockedTrainsRows(StringTable ST)
	{
		string s = "";
		m_BlockQueueBusy = true;
		int i, len = m_blockQueue.size();
		
		for (i = 0; i < len; i++)
		{
			s = s + GetDetailsRow(ST.GetString("par_blocked-queue"), GetTrainDisplayName(m_blockQueue[i]));
		}
		m_BlockQueueBusy = false;		
		
		return s;
	}
	
	string GetCurrentState(StringTable ST)
	{
		return ST.GetString("signal-state-r");
	}
	
	string GetAutomatLink(StringTable ST)
	{
		if (m_bSemiAutomatCurrent)
			return GetDetailsLink("automat_on",  ST.GetString("par_automat_on"));
		return GetDetailsLink("automat_off",  ST.GetString("par_automat_off"));	
	}
	
	string GetInvitationLink(StringTable ST)
	{
		if (!m_PS)
			return GetDetailsLink("invitation_on",  ST.GetString("par_invitation_on"));
		return GetDetailsLink("invitation_off",  ST.GetString("par_invitation_off"));
	}
	
	string getFreeBlocksValue() 
	{
		if (m_freeBlocks > MAX_FREE_BLOCKS)
			return MAX_FREE_BLOCKS + "+";
		return (string)m_freeBlocks;
	}

	string GetViewDetailsInt(StringTable ST)
	{
		string s = GetDetailsRow(ST.GetString("par_name"), m_signal.GetName());
		s = s + GetDetailsRow(ST.GetString("current-state"), GetCurrentState(ST));
		s = s + GetDetailsRow(ST.GetString("signal-als-code"), m_alsValue);
		s = s + GetDetailsRow(ST.GetString("signal-free-blocks"), getFreeBlocksValue());
		if (m_prevSignal)	s = s + GetDetailsRow(ST.GetString("par_prev_signal"), m_prevSignal.GetName());
		else				s = s + GetDetailsRow(ST.GetString("par_prev_signal"), "---");
		//SemiAutomatProp
		if (m_bSemiAutomatProp)
		{			
			s = s + GetDetailsRow(ST.GetString("signal-semiautomath"), getBoolPropertiesStr(ST, m_bSemiAutomatCurrent));
			s = s + GetDetailsRow(ST.GetString("par_blocked"), GetBlockedTrainDisplayName());
			s = s + GetBlockedTrainsRows(ST);
			if (!m_blockedByTrain and m_bSemiAutomatProp) s = s + GetAutomatLink(ST);
			s = s + GetInvitationLink(ST);
		}					
		return s;
	}
	
	public string GetViewDetails()
	{
		return "<html><body><table>"+GetViewDetailsInt(m_asset.GetStringTable())+"<table></body></html>";
	}
	//#endregion
    //#region API =========================================================================================
	public bool UpdateFreeBlocksCount(int freeBlocks) 
	{
		if (m_freeBlocks == freeBlocks) return false;
		m_freeBlocks = freeBlocks;
		if (m_prevSignal)
			m_signal.PostMessage(m_prevSignal, "FreeBlocksChanged", (string)freeBlocks, 0);
		m_signal.UpdateBrowser();
		CheckNextSignalAndUpdateState();
		return true;
	}

    public string GetPropertiesContent(StringTable ST) 
    {
        if (m_bDebug) Print("GetPropertiesContent","");
        
		m_bOpenedProperties = true;
		m_savedProperties.Clear();
		m_ForAllData = new string[0];				
		
        StringTable mST = m_asset.GetStringTable();
        return  getModeContent(mST)+
				getUseSignalsContentBase(mST)+
                getSpeedLimitsContentBase(mST)+
                getOptionalContent(mST);
    }

    public int GetLensesState()
    {
        int nLensesState = m_nLensesState;
		if (!ShouldUseChecker())
			nLensesState = ZmvSignalTypes.R;
		else
			nLensesState = m_nLensesState;

		if (m_bDebug /*or IsDebug()*/) Print("GetLensesState","m_nLensesState="+m_nLensesState+",res="+nLensesState);
        return nLensesState;
    }

    public int GetFreeBlocksCount()
    {
        return m_freeBlocks;
    }

	int getFreeBlocks(Signal signal)
	{
		int state = signal.GetSignalState();
		switch (state)
		{
			case m_signal.GREEN:
				return 2;
			case m_signal.YELLOW:
				return 1;
			default:
				break;
		}
		return 0;
	}

    int CalcFreeBlocks(object nextObject)
    {
        if (nextObject == null or nextObject.isclass(Vehicle))
            return 0;

        if (nextObject.isclass(ZmvSignalInterface))
        {
            ZmvSignalInterface signal = cast<ZmvSignalInterface>(nextObject);
			int n = signal.GetFreeBlocksCount();
			if (n > MAX_FREE_BLOCKS) return MAX_FREE_BLOCKS + 1;
			return n + 1;
        }

        if (nextObject.isclass(Signal))
            return getFreeBlocks(cast<Signal>(nextObject)) + 1;

        return 0;
    }

    public string[] GetAllLenses() 
    { 
        if (m_bDebug) Print("GetAllLenses","m_allLenses.getLenses()="+m_allLenses.getLenses().size());
        return m_allLenses.getLenses();
    }

	public void SetAutomatManually(bool auto)
	{
		if (m_bSemiAutomatCurrent != auto) return;
		m_nextTrain = getNextTrain();
	//Print("SetAutomatManually", m_nextTrain, "");
		setSemiAutoMode(!auto);
	}

    public void SetAutoblock(Message msg)
    {
        if (m_bDebug) Print("SetAutoblock", "");
		Vehicle v = cast<Vehicle>(msg.src);		
        if (m_bAutoblock)
		{
			if (msg.minor != "auto")
			{
				ZmvSignalInterface nextSignal = GetNextSignal(false);
//Print("SetAutoblock:sendToNext", ""+(nextSignal!=null));				
				if (nextSignal) v.PostMessage(nextSignal, "SetAutoblock", "auto", 0);
			}
		}
		else
		{
//Print("SetAutoblock:m_bAutoblockCurrent","true");				
			m_nextTrain = getNextTrain();
	//Print("SetAutoblock", m_nextTrain, "");
			m_bAutoblockCurrent = true;
			showLenses();
		}		
    }
	
	void SetInvitationManually(bool set)
	{
		if (IsDebug()) Print("SetInvitationManually","set="+set);
		m_PS = set;
        if (m_bRoutePointer)
            setRouteNumber(cast<object>(m_signal), m_nLensesState, true);
        setCurrentState();
	}
	
    public void TurnOnInvitationSignal(Message msg)
    {
        if (m_bDebug) Print("TurnOnInvitationSignal", "");
		SetInvitationManually(true);
    }
	
	public bool HasPermission(Train train)
	{
        if (m_bDebug) Print("HasPermission", "m_blockedByTrain="+m_blockedByTrain.GetTrainDisplayName()+",name="+train.GetTrainDisplayName());			
		return (!m_blockedByTrain or train == m_blockedByTrain);		 
	}
	
	public void BrowserUrlHandler(Message msg)
	{
		if (msg.minor == "live://automat_on" or msg.minor == "live://automat_off")
			SetAutomatManually(msg.minor == "live://automat_on");
		else 
			SetInvitationManually(msg.minor == "live://invitation_on");
	}
	
    public void SetSemiautoMode(Message msg) 
    {
        if (m_bDebug /*or IsDebug()*/) Print("SetSemiautoMode", "");
		Train train = (cast<Vehicle>(msg.src)).GetMyTrain();
        if (HasPermission(train))
        {
            setSemiAutoMode(true);
            if (m_bDebug /*or IsDebug()*/) Print("SetSemiautoMode", "call");
        }
    }

    public void SetAutoMode(Message msg) 
    {
        if (m_bDebug /*or IsDebug()*/) Print("SetAutoMode", "");
		Train train = (cast<Vehicle>(msg.src)).GetMyTrain();
		if (HasPermission(train))
        {
			m_nextTrain = getNextTrain();

	//Print("SetAutoMode", m_nextTrain, "");
			
            if (m_bDebug /*or IsDebug()*/) Print("SetAutoMode", "call");
            if (m_bSemiAutomatCurrent) setSemiAutoMode(false);
        }
    }

	public bool IsBlocked(Train train) 
    {
        if (m_bDebug)
		{
			if (m_blockedByTrain) Print("IsBlocked", "m_blockedByTrain="+m_blockedByTrain.GetTrainDisplayName()+",name="+train.GetTrainDisplayName() + ",perm="+HasPermission(train));		
			else Print("IsBlocked", "name="+train.GetTrainDisplayName() + ",perm="+HasPermission(train));
		}
		
		return !HasPermission(train);
    }
	
	public bool IsAutomated()
	{
		return !m_bSemiAutomatCurrent;
	}
	
	void AddToBlockQueue(Train train)
	{
        while (m_BlockQueueBusy);
		m_BlockQueueBusy = true;
		int i, len = m_blockQueue.size();
		
		for (i = 0; i < len; i++)
		{
			if (m_blockQueue[i] == train)
				break;
		}
		if (i == len)
			m_blockQueue[len] = train;
		m_BlockQueueBusy = false;
	}
	
    public bool SetBlock(Train train, bool addToQueueIfBusy) 
    {
        if (m_bDebug) Print("SetBlock", "name="+train.GetTrainDisplayName()+",addToQueueIfBusy="+addToQueueIfBusy);
		
		if (IsBlocked(train)) 
		{
			if (m_bDebug) Print("SetBlock:Blocked", "addToQueueIfBusy="+addToQueueIfBusy);
			if (addToQueueIfBusy) AddToBlockQueue(train);
			return false;
		}
        m_blockedByTrain = train;
        if (m_bDebug) Print("SetBlock", "name="+train.GetTrainDisplayName());
		return true;
    }

    public void SetBlock(Message msg) 
    {
        Train train = (cast<Vehicle>(msg.src)).GetMyTrain();
		bool  addToQueueIfBusy = (msg.minor == "q");
		SetBlock(train, addToQueueIfBusy);
    }

    public void SetUnblock(Train train) 
    {
        if (m_bDebug) Print("SetUnblock", "m_blockedByTrain="+m_blockedByTrain.GetTrainDisplayName()+",name="+train.GetTrainDisplayName());
		if (m_blockedByTrain == train)
		{
            while (m_BlockQueueBusy);
			m_BlockQueueBusy = true;			
			if (m_blockQueue.size())
			{
				m_blockedByTrain = m_blockQueue[0];
				m_blockQueue[0,1] = null;
			}
			else
			{
				m_blockedByTrain = null;
			}
			m_BlockQueueBusy = false;			
		}
		else
		{
			while (m_BlockQueueBusy); 
			m_BlockQueueBusy = true;
			int i, len = m_blockQueue.size();
			
			for (i = 0; i < len; i++)
			{
				if (m_blockQueue[i] == train)
				{
					m_blockQueue[i,i+1] = null;
					break;				
				}
			}
			m_BlockQueueBusy = false;
		}
    }
	
    public void SetUnblock(Message msg) 
    {
        Train train = (cast<Vehicle>(msg.src)).GetMyTrain();
		if (msg.minor == "A")
			SetAutoMode(msg);
		SetUnblock(train);
    }

	public void OnCTRL(Message msg) 
	{
	Print("OnCTRL", msg.minor);
		string cmd = msg.minor;
		string mode = Str.Tokens(cmd, "^")[1];
		Str.ToLower(mode);
		if (TrainUtil.HasPrefix(cmd, "MayOpen"))	SetAutomatManually(mode == "true");				
		else if (TrainUtil.HasPrefix(cmd, "SetPS")) SetInvitationManually(mode == "true");				
	}

    public void Update() 
    {
        if (m_bDebug) Print("Update", "");
		m_nextObject = null;
        m_nLensesState = m_nPrevLensesState = -1;
        m_prevSignal = GetNextSignal(true);
    }

    public void SetPropagatedProperties(ZmvSignalInterface src, string par) 
    {
        if (m_bDebug) Print("SetPropagatedProperties", "par="+par);
        
		if (par == "Ok")
		{
			m_savedProperties.Clear();
		}	
		else if (par == "Cancel")
		{
			restoreProperties();
			Update();
			m_savedProperties.Clear();
		}
		else
		{		
			setPropagatedProperties(src.GetProperties(), par, (par == "forAll")); 
			Update();
		}
    }
    
	int  GetAlsValueBySpeedLimit(int speedLimit)
	{
		if (speedLimit >= 80)  return ZmvAls.ALS_80;
		if (speedLimit >  60)  return ZmvAls.ALS_70;
		if (speedLimit >  40)  return ZmvAls.ALS_60;
		if (speedLimit >  20)  return ZmvAls.ALS_40;
		return ZmvAls.ALS_OC;
	}
	
	int GetCurrentSpeedLimit()
	{
		int nLensesState = m_nLensesState,
			len = m_speedLimits.size();
			
		if (nLensesState < 0 or nLensesState > len-1) return 0;
		return m_speedLimits[nLensesState];
	}
	
	public int GetLastAlsValue()
	{
//if (IsDebug()) Print("GetLastAlsValue=",m_alsValue);
		m_prevSignalALS = null;
		return m_alsValue;
	}
		
	void SetAlsData(Soup db, int prevAlsValue)
	{
		int als, als_next = -1;
		int nLensesState = m_nLensesState;
		
		if (m_bNextVehicle and !m_bSemiAutomatCurrent and nLensesState != ZmvSignalTypes.W)
		{
			als = ZmvAls.ALS_0;
	//if (IsDebug()) Print("ALS_0","m_bNextVehicle="+m_bNextVehicle+",m_bSemiAutomatCurrent="+m_bSemiAutomatCurrent);		
		}
		else
		{
			GetAlsTrainValues();
			int trainSpeedLimit = 0;//, nextSpeedLimitForALS = getNextSpeedLimitForALS();
			if (m_TrainForALS) 
			{
				trainSpeedLimit = m_TrainForALS.GetSpeedLimit() / KPH_TO_MPS;
				if (trainSpeedLimit > 80) trainSpeedLimit = 80;
			}
			
	//if (IsDebug()) Print("SetNextAlsValue:", "trainSpeedLimit="+trainSpeedLimit+",distance="+m_aslTrainDistance+",prevAlsValue="+prevAlsValue/*+",nextSpeedLimitForALS="+nextSpeedLimitForALS*/);
			if (m_PS or trainSpeedLimit <= 20)
			{
				als = ZmvAls.ALS_OC;
			}
			else
			{			
				int speedLimit = 0;
				if (nLensesState > 0) 
				{
					speedLimit = m_speedLimits[nLensesState];
					if (speedLimit > 80) speedLimit = 80;
				}
	//if (IsDebug()) Print("SetNextAlsValue-0:", "speedLimit="+speedLimit);	
				if (speedLimit == 0)
				{
					if (nLensesState == ZmvSignalTypes.R)
					{
						als = ZmvAls.ALS_0;
					}
					else if (prevAlsValue <= 0 and nLensesState != ZmvSignalTypes.RY)
					{
						als = ZmvAls.ALS_0;
					}
					else 
					{
						als = ZmvAls.ALS_40;
						als_next = ZmvAls.ALS_0;
					}
	//if (IsDebug()) Print("speedLimit == 0", "als="+als+",als_next="+als_next);					
				}
				else
				{					
					if (trainSpeedLimit == speedLimit)
					{
						als = GetAlsValueBySpeedLimit(trainSpeedLimit);
						if (als == ZmvAls.ALS_80)
						{
							if (prevAlsValue < ZmvAls.ALS_70) 
							{
								als = als_next = ZmvAls.ALS_70;
	//if (IsDebug()) Print("trainSpeedLimit == speedLimit,als == ZmvAls.ALS_80,prevAlsValue < ZmvAls.ALS_70", "speedLimit="+speedLimit+",als="+als+",als_next="+als_next);
							}
							else
							{
								int nextSpeedLimitForALS = getNextSpeedLimitForALS();
								if (nextSpeedLimitForALS >= 0) 
								{
									int nextALS = GetAlsValueBySpeedLimit(nextSpeedLimitForALS);
									if (nextALS >= 0 and nextALS != ZmvAls.ALS_80)	als_next = ZmvAls.ALS_70;
									else 											als_next = als;
								}
	//if (IsDebug()) Print("trainSpeedLimit == speedLimit,als == ZmvAls.ALS_80,prevAlsValue >= ZmvAls.ALS_70", "speedLimit="+speedLimit+",nextSpeedLimitForALS="+nextSpeedLimitForALS+",als="+als+",als_next="+als_next);
							}
						}
						else
						{						
							als_next = als;
	//if (IsDebug()) Print("trainSpeedLimit == speedLimit,als != ZmvAls.ALS_80", "speedLimit="+speedLimit+",als="+als+",als_next="+als_next);
						}						
					}
					else if (trainSpeedLimit < speedLimit)
					{
						als = GetAlsValueBySpeedLimit(trainSpeedLimit);
						als_next = GetAlsValueBySpeedLimit(speedLimit);
						if (als_next == ZmvAls.ALS_80 and als != ZmvAls.ALS_70) als_next = ZmvAls.ALS_70;
	//if (IsDebug()) Print("trainSpeedLimit < speedLimit", "trainSpeedLimit="+trainSpeedLimit+",speedLimit="+speedLimit+",als="+als+",als_next="+als_next);
					}
					else //if (trainSpeedLimit > speedLimit)
					{
						if (prevAlsValue < 0 or (nLensesState == ZmvSignalTypes.W and m_aslTrainDistance <= 30)) 
						{
							int nextSpeedLimitForALS = getNextSpeedLimitForALS();
							als = GetAlsValueBySpeedLimit(speedLimit);
							if (nextSpeedLimitForALS >= 0) 
							{
								als_next = GetAlsValueBySpeedLimit(nextSpeedLimitForALS);
								if (als_next == ZmvAls.ALS_80) als_next = ZmvAls.ALS_70;
							}
	//if (IsDebug()) Print("trainSpeedLimit > speedLimit, prevAlsValue < 0", "trainSpeedLimit="+trainSpeedLimit+",speedLimit="+speedLimit+",nextSpeedLimitForALS="+nextSpeedLimitForALS+",als="+als+",als_next="+als_next);
						}
						else
						{							
							als = GetAlsValueBySpeedLimit(trainSpeedLimit);
							if (als == ZmvAls.ALS_80) als = ZmvAls.ALS_70;
							als_next = GetAlsValueBySpeedLimit(speedLimit);
	//if (IsDebug()) Print("trainSpeedLimit > speedLimit, prevAlsValue >= 0", "trainSpeedLimit="+trainSpeedLimit+",speedLimit="+speedLimit+",als="+als+",als_next="+als_next);
						}						
					}										
				}
			}			
		}				
		if (als_next != ZmvAls.ALS_0 and als_next < ZmvAls.ALS_40) als_next = -1;
		
		bool rs = (als >= ZmvAls.ALS_40 and (als <= als_next or als_next < 0));		
		if (rs and nLensesState == ZmvSignalTypes.W)
			rs = GetAlsValueBySpeedLimit(getNextSpeedLimitForALS()) >= als;
	//if (IsDebug()) Print("3", "als="+als+",als_next="+als_next+",rs="+rs);
		
		if (m_aslTrainDistance >= 10) m_prevRS = rs;
		else if (m_prevSignalALS)	  rs = m_prevRS;
		
		db.SetNamedTag("MSig-als-rs", rs);
		db.SetNamedTag("MSig-als-fq", als);
		db.SetNamedTag("MSig-als-limit", GetCurrentSpeedLimit());
		if (!(m_bAutoblock or m_bAutoblockCurrent))	db.SetNamedTag("MSig-als-fq-next", als_next);
		else										db.SetNamedTag("MSig-als-fq-next", -1);
		m_alsValue = als;
	//if (IsDebug()) Print("SetNextAlsValue1:", "als="+als+",als_next="+als_next+",rs="+rs);
	}
	
	void AddAlsProperties(Soup db)
	{		
		m_aslTrainDistance = -1;
		int prevAlsValue = -1, prevNextAlsValue = -1;
		ZmvSignalInterface prevSignal = GetPreviousSignalForALS();
		if (prevSignal) 
		{
			prevAlsValue = prevSignal.GetLastAlsValue();
//if (IsDebug()) Print("prevAlsValue=",prevAlsValue+",prevSignal="+prevSignal.GetName());
		}		
		db.SetNamedTag("MSigSignal", 1); 
		db.SetNamedTag("MSig-type", "RC"); 
		SetAlsData(db, prevAlsValue);
	}
	
    public void GetProperties(Soup db)
    {
        if (m_bDebug) Print("GetProperties","");        
        getProperties(db);
		if (!m_bSuveyor)
		{
			int privateStateEx = ZmvSignalExTypes.GetSignalEx(m_nLensesState, m_PS);
			db.SetNamedTag("privateStateEx", privateStateEx);
			AddAlsProperties(db);
		}
    }
	
    public void SetProperties(Soup db)
    {
        bool bNewAsset = (db.GetIndexForNamedTag("autoblock") < 0);
        
        if (m_bDebug) Print("SetProperties","bNewAsset=" + bNewAsset);

        if (bNewAsset)
            setProprtiesFromNeighbor();
        else
            setProperties(db);                
    }
	//#endregion
    //#region Initialization ==============================================================================
    void initSpeedLimits()
    {
        if (m_bDebug) Print("initSpeedLimits","");

        Soup db = m_signal.GetAsset().GetConfigSoup().GetNamedSoup("extensions");
		bool depo = db.GetNamedTagAsBool("depo", false);
		
        m_speedLimits = new int[10];

        m_speedLimits[ZmvSignalTypes.R]   = 0;
        m_speedLimits[ZmvSignalTypes.RY]  = db.GetNamedTagAsInt("speed-limit-ry",  0);
        m_speedLimits[ZmvSignalTypes.Y]   = db.GetNamedTagAsInt("speed-limit-y",   40);
        m_speedLimits[ZmvSignalTypes.YG]  = db.GetNamedTagAsInt("speed-limit-yg",  60);
        m_speedLimits[ZmvSignalTypes.G]   = db.GetNamedTagAsInt("speed-limit-g",   80);
        m_speedLimits[ZmvSignalTypes.PS] = db.GetNamedTagAsInt("speed-limit-wf",  20);
        m_speedLimits[ZmvSignalTypes.WW]  = 20;
		if (depo)  	m_speedLimits[ZmvSignalTypes.W] = db.GetNamedTagAsInt("speed-limit-w", 20);
		else		m_speedLimits[ZmvSignalTypes.W] = db.GetNamedTagAsInt("speed-limit-w", 40);
        m_speedLimits[ZmvSignalTypes.YY]  = db.GetNamedTagAsInt("speed-limit-tt",  40);
        m_speedLimits[ZmvSignalTypes.YfY] = db.GetNamedTagAsInt("speed-limit-ttf", 40);
		
//Interface.Print("depo="+depo+",m_speedLimits[ZmvSignalTypes.W]="+m_speedLimits[ZmvSignalTypes.W]);
    }
	Soup[] getEffectsConfigs(Soup config)
	{
		Soup[] res = new Soup[0];
		Soup meshContainer = config.GetNamedSoup("mesh-table");
		Soup cur;
		int i, len = meshContainer.CountTags();

		for (i = 0; i < len; i++)
		{
			cur = meshContainer.GetNamedSoup(meshContainer.GetIndexedTagName(i));
			if (cur.GetIndexForNamedTag("effects") >= 0)
				res[res.size()] = cur.GetNamedSoup("effects");
		}

		return res;
	}

	bool IsLenseInConfig(Soup[] effects, string lense)
	{
		int i, len = effects.size();

		for (i = 0; i < len; i++)
		{
			if (effects[i].GetIndexForNamedTag(lense) >= 0)
				return true;
		}
		return false;
	}

    void InitLenseTypes(Soup config)
    {        
        if (m_bDebug) Print("InitLenseTypes","");

        Soup[] effects = getEffectsConfigs(config);
		Soup options = config.GetNamedSoup("extensions");
        
        m_allLenses = new ZmvLensesData();
        ZmvLensesData lenseCur;
        m_lenseTypes = new ZmvLensesData[0];
        bool bR  = IsLenseInConfig(effects, ZmvLenseTypes.scR), 
             bW  = IsLenseInConfig(effects, ZmvLenseTypes.scW), 
             bWf = IsLenseInConfig(effects, ZmvLenseTypes.scWf),
             bB  = IsLenseInConfig(effects, ZmvLenseTypes.scB);

        lenseCur = new ZmvLensesData();
        m_lenseTypes[ZmvSignalTypes.B] = lenseCur;
        if (bB)
        {                    
            lenseCur.addLense(ZmvLenseTypes.scB);
            m_allLenses.addLense(ZmvLenseTypes.scB);
            if (m_bDebug) Print("InitLenseTypes","ZmvSignalTypes.B, m_allLenses.getLenses().size()="+m_allLenses.getLenses().size());
        }

        if (bR)
        {        
            lenseCur = new ZmvLensesData();
            lenseCur.addLense(ZmvLenseTypes.scR);
            m_lenseTypes[ZmvSignalTypes.R] = lenseCur;
            m_allLenses.addLense(ZmvLenseTypes.scR);
            if (m_bDebug) Print("InitLenseTypes","ZmvSignalTypes.R, m_allLenses.getLenses().size()="+m_allLenses.getLenses().size());
        }

        if (bW)
        {        
            lenseCur = new ZmvLensesData();
            lenseCur.addLense(ZmvLenseTypes.scW);
            m_lenseTypes[ZmvSignalTypes.W] = lenseCur;
            m_allLenses.addLense(ZmvLenseTypes.scW);
            if (m_bDebug) Print("InitLenseTypes","ZmvSignalTypes.W, m_allLenses.getLenses().size()="+m_allLenses.getLenses().size());
        }

        if (bWf)
        {        
            m_allLenses.addLense(ZmvLenseTypes.scWf);
        }
    }

    public void Init(Asset asset)
    {
        m_asset = asset;
    }

    public void Init(ZmvSignalInterface signal, Soup config)
    {
        m_signal = signal;
		m_bSuveyor = (World.GetCurrentModule() == World.SURVEYOR_MODULE);
        m_blockedByTrain = null;
		Soup options = config.GetNamedSoup("extensions");
        m_bDebug = options.GetNamedTagAsBool("debug-library", false);		
        if (m_bDebug) Print("Init", "");       
        m_bRoutePointer = (config.GetNamedSoup("mesh-table").GetNamedSoup("default").GetNamedSoup("effects").GetNamedSoup("m11").CountTags() != 0);
        m_bSemiAutomatProp = options.GetNamedTagAsBool("semiautomat", false);        
        InitLenseTypes(config);
        initSpeedLimits();
		m_prevSignal = GetNextSignal(true);
		//updateNextSignal();
		if (m_bSuveyor)
		{
			m_savedProperties = new ZmvProperties();
			m_savedProperties.Clear();
		}
	}
	//#endregion
};

