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

//#region ZmvBaseLibrary
class ZmvBaseLibrary isclass ZmvInterface
{    
	//#region State =========================================================================+=============
	define float KPH_TO_MPS = 0.278;
	define int MAX_FREE_BLOCKS = 10;

	ZmvSignalInterface m_signal, m_prevSignal;
//    ZmvSignalInterface m_prevSignal; //, m_prevSignalALS;
    Asset m_asset;

    ZmvLensesData   m_allLenses;
    ZmvLensesData[] m_lenseTypes;
    
    bool m_bDebug;
    bool m_bContainsRoutePointer; //has Route pointer device
    bool m_bAutoblockProp, 		//Autoblock mode
		 m_bAutoblockCurrent; 	//Autoblock mode currently (may be changed by command)

    bool m_bSemiAutomatType;    //semiautomat Signal type
    bool m_bSemiAutoProp,	//semiautomat mode from properties
		 m_bSemiAutoCurrent; //semiautomat mode currently (may be changed by command)

	bool m_bRepeater; 			//repeats next signal state
		
	bool m_bOpenedProperties = false;
	bool m_bCancel = false; 
	bool m_bSuveyor;			//if opened in Editor
	
    Train m_nextTrainForAutoblock;

	//int   m_DistanceToVehicle;
	bool  m_bEmptyNextObject,  	//next object is not Signal, ZmvSignal or Vehicle
		  m_bNextVehicle,		//next object is Vehicle
		  m_bTrainEntered,		//Train entered to current Signal scope
		  m_bJunctionToward;	//current block contains Junction Switch		  

	Train m_blockedByTrain; 	//blocked by train corresponded path
	
    int   m_nLensesState = -1; //lenses state
    int   m_nFreeBlocks;	   //free blocks toward
    int   m_nAlsCode = -1;     //current ALS Code
	//, m_aslTrainDistance, m_nextSpeedLimitForALS = -1;
	//Train m_TrainForALS; //-----------------------

	bool m_bPS = false; //turned on PS
	
    //int[] m_speedLimits; //!!!!!!!!!!!!!!!!!!!!
	int   m_nFr0, m_nFr40, m_nFr60, m_nFr70, m_nFr80; 			     //free blocks for ALS frequencies from Settings
	int   m_nCurFr0, m_nCurFr40, m_nCurFr60, m_nCurFr70, m_nCurFr80; //free blocks for ALS frequencies current values 
	int   m_nMaxFreeBlocks = MAX_FREE_BLOCKS;						 //max free blocks according to ALS frequencies

    ZmvMarker m_nextMarker;
    
	object m_nextObject;
	ZmvProperties m_savedProperties;
	
	string[] m_ForAllData = new string[0];
	bool m_BlockQueueBusy = false;	
	Train[] m_blockQueue = new Train[0];

    int  getSignalState();
	void getAlsProperties(Soup db);
	void setAlsProperties(Soup db);
	void updateSignalStateInt(bool force);
	void updateVisualState(bool force);

	int  CalcFreeBlocks();
	int  GetNewLensesStateByFreeBlocks();
	bool UseAlsFrequencies();
	
	void setSemiAutoMode(bool semiauto);

    public int  GetLensesState();
    public void ResetSignal();
	public void UpdateSignalState();

	//#endregion
    //#region Debug =======================================================================================    	
	bool IsDebug()
	{
		//string name = m_signal.GetName();
		//return name[0] == "t";//"test";// or name == "2";
		return false;
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
    void SetPropertiesInt(Soup db);

    // void GetAlsTrainValues()
	// {        
	// 	GSTrackSearch thesearch = m_signal.BeginTrackSearch(false);
	// 	object nextObject = thesearch.SearchNext();
	// 	while (nextObject)
	// 	{
	// 		if (nextObject.isclass(Vehicle))
	// 		{                
	// 			m_TrainForALS = (cast<Vehicle>(nextObject)).GetMyTrain();
	// 			m_aslTrainDistance = thesearch.GetDistance();
	// 			break;
	// 		}
    //         nextObject = thesearch.SearchNext();
	// 	}		
	// }
	
	ZmvSignalInterface SearchNearestZmvSignal(bool backDir)
    {
        GSTrackSearch thesearch = m_signal.BeginTrackSearch(!backDir);
		object nextObject = thesearch.SearchNext();
		while(nextObject)
		{
			if (nextObject.isclass(ZmvSignalInterface))
			{                
                if (m_bDebug) Print("SearchNearestZmvSignal", "nextSignal="+ (cast<Signal>(nextObject)).GetName());
                if (thesearch.GetFacingRelativeToSearchDirection() != backDir)
                {
                    if (m_bDebug) Print("SearchNearestZmvSignal", "OK nextSignal="+ (cast<Signal>(nextObject)).GetName());
                    break;
                }
			}
            nextObject = thesearch.SearchNext();
		}

        if (nextObject == me)
            nextObject = null;

        return cast<ZmvSignalInterface>(nextObject);                
    }
	
	// ZmvSignalInterface GetPreviousSignalForALS()
	// {
	// 	if (!m_prevSignalALS) 
	// 	{
	// 		if (m_signal.IsProhodnoy() and m_prevSignal) m_prevSignalALS = m_prevSignal;
	// 		else m_prevSignalALS = SearchNearestZmvSignal(true);
	// 	}
		
	// 	return m_prevSignalALS;
	// }	
	
    void setTableNumberinEditor(Soup db, bool prev)
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
        if (m_bDebug) Print("setTableNumberinEditor", "n="+n);
        m_signal.SetTableString((string)n);
    }
	
	public Soup GetNeighborProperties()
	{
        if (m_bDebug) Print("GetNeighborProperties", "");
    
        Soup db;
        ZmvSignalInterface nextSignal;
        
        nextSignal = SearchNearestZmvSignal(true); //previous
        if (nextSignal == null)
        {
            nextSignal = SearchNearestZmvSignal(false); //next
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
    
        Soup db;
        ZmvSignalInterface nextSignal = SearchNearestZmvSignal(true); //previous
        if (nextSignal == null)
        {
            nextSignal = SearchNearestZmvSignal(false); //next
            if (nextSignal != null)
            {
                if (m_bDebug) Print("setProprtiesFromNeighbor", "name="+ nextSignal.GetName());            
                db = nextSignal.GetProperties();
                setTableNumberinEditor(db, false);
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
            setTableNumberinEditor(db, true);
        }        

        SetPropertiesInt(db);
    }

    void propagatePropertiesInEditor(string id)
    {
        if (m_bDebug) Print("propagatePropertiesInEditor","id="+id);
		m_signal.PostMessage(null, "SetPropagatedProperties", id, 0);
    }
	
    void GetPropertiesInt(Soup db)
    {
        if (m_bDebug) Print("GetPropertiesInt","");
        
        db.SetNamedTag("autoblock", m_bAutoblockProp); 
        db.SetNamedTag("repeater", m_bRepeater); 
        //db.SetNamedTag("speed-PS", m_speedLimits[ZmvSignalTypes.PS]); 
        if (m_bSemiAutomatType)
            db.SetNamedTag("semiautomat", m_bSemiAutoProp);
		if (UseAlsFrequencies()) getAlsProperties(db);
    }

    void SetPropertiesInt(Soup db)
    {
        if (m_bDebug) Print("SetPropertiesInt","m_bOpenedProperties="+m_bOpenedProperties+",m_bCancel="+m_bCancel);
        		
        bool bAutoblock = db.GetNamedTagAsBool("autoblock", true);
		//int  speedPS = db.GetNamedTagAsInt("speed-PS", m_speedLimits[ZmvSignalTypes.PS]);
				
		if (m_bOpenedProperties and !m_bCancel)
			m_bCancel = bAutoblock != m_bAutoblockProp; // or speedPS != m_speedLimits[ZmvSignalTypes.PS]);
		
		if (m_bDebug) Print("SetPropertiesInt","bAutoblock="+bAutoblock+",m_bAutoblockProp="+m_bAutoblockProp+",m_bCancel="+m_bCancel);

		m_bRepeater = db.GetNamedTagAsBool("repeater", false);
		m_bAutoblockProp = m_bAutoblockCurrent = bAutoblock;
        //m_speedLimits[ZmvSignalTypes.PS] = speedPS;

        if (m_bSemiAutomatType)
        {
            bool bSemiAutomat = db.GetNamedTagAsBool("semiautomat", false);
			if (m_bOpenedProperties and !m_bCancel)
				m_bCancel = (m_bSemiAutoProp != bSemiAutomat);			
			m_bSemiAutoProp = bSemiAutomat;
            setSemiAutoMode(m_bSemiAutoProp);
        }
		
		if (UseAlsFrequencies()) setAlsProperties(db);

		if (m_bOpenedProperties)
		{
			if (m_bDebug) Print("SetPropertiesInt","Cancel="+m_bCancel);
			if (m_bCancel)
				propagatePropertiesInEditor("Cancel");
			else
				propagatePropertiesInEditor("Ok");
				
			m_bCancel = m_bOpenedProperties = false;
		}
        ResetSignal();
    }

    void RestorePropertiesInEditor()
	{
        if (m_bDebug) Print("RestorePropertiesInEditor","");

		if (m_savedProperties.HasNamedTag("autoblock"))
			m_bAutoblockProp = m_bAutoblockCurrent = m_savedProperties.GetNamedTagAsBool("autoblock");
		//if (m_savedProperties.HasNamedTag("speed-PS"))
		//	m_speedLimits[ZmvSignalTypes.PS] = m_savedProperties.GetNamedTagAsInt("speed-PS");
	}

    public void SetPropagatedPropertiesInEditor(Soup soup, string par, bool all) 
    {
        if (m_bDebug) Print("SetPropagatedPropertiesInEditor","par="+par);
		
		if (all or par == "mode")
		{
			m_savedProperties.SetNamedTag("autoblock", m_bAutoblockProp); 
			m_bAutoblockProp = m_bAutoblockCurrent = soup.GetNamedTagAsBool("autoblock");
		}
		// if (all or par == "speedLimitPS") 
		// {
		// 	m_savedProperties.SetNamedTag("speed-PS", m_speedLimits[ZmvSignalTypes.PS]); 
		// 	m_speedLimits[ZmvSignalTypes.PS] = soup.GetNamedTagAsInt("speed-PS");
		// }
    }
	
    string getModeString(StringTable ST, bool value)
    {
       if (value)
            return ST.GetString("signal-mode-on");
       return ST.GetString("signal-mode-off");        
    }

    string GetModeContentForEditor(StringTable ST)
    {
        string mode         = getModeString(ST, m_bAutoblockProp), 
               repeater     = getModeString(ST, m_bRepeater),
			   modeSemiauto = getModeString(ST, m_bSemiAutoProp),
               title = ST.GetString("signal-modes-title"),
			   res = GetPropertyTitleHTML(title);
                
        if (m_bSemiAutomatType)
            res = res + GetPropertyHTML(ST.GetString("signal-semiautomath"), modeSemiauto, "semiautomat", "");
		res = res + GetPropertyHTML(ST.GetString("signal-repeater"), repeater, "repeater", "");
		res = res + GetPropertyHTML(ST.GetString("signal-mode"), mode, "mode", title);
        return res;
    }

    string getOptionalContentForEditor(StringTable ST)
    {
        string title = ST.GetString("signal-optional-title");
		
		return  GetPropertyTitleHTML(title) + 
                GetPropertyHTML(ST.GetString("signal-all"), ST.GetString("signal-for-all"), "forAll", title);
    }

    string GetUseSignalsContentForEditor(StringTable ST) {return "";}

    string getUseSignalsContentBaseForEditor(StringTable ST) 
    {
        string content = GetUseSignalsContentForEditor(ST);

        if (content != "")
        {
            return GetPropertyTitleHTML(ST.GetString("signal-use-title")) + content;
        }        
        
        return "";
    }
    
    string getSpeedLimitsContentPS(StringTable ST) 
    {
		return ""; //!!!!!! GetPropertyHTML(ST.GetString("signal-speed-limit-wf"), (string)m_speedLimits[ZmvSignalTypes.PS], "speedLimitPS", ST.GetString("signal-speed-limit"));
    }

    string getSpeedLimitsContent(StringTable ST) 
    {
        return "";
    }

    string getSpeedLimitsContentBase(StringTable ST) 
    {
        return  GetPropertyTitleHTML(ST.GetString("signal-speed-limit")) + getSpeedLimitsContent(ST) + getSpeedLimitsContentPS(ST);
    }
	//#endregion
	//#region Editor Property API
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

        if (id == "mode") m_bAutoblockProp = m_bAutoblockCurrent = !m_bAutoblockProp;
        else if (id == "semiautomat")
        {
            m_bSemiAutoProp = !m_bSemiAutoProp;
            setSemiAutoMode(m_bSemiAutoProp);
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
            propagatePropertiesInEditor(par);
        }
		*/
        else inherited(id);
 	}

	public void SetPropertyValue(string id, int val)
	{
        if (m_bDebug) Print("SetPropertyValue(int)","id="+id+", val="+val);

        //if (id == "speedLimitPS") m_speedLimits[ZmvSignalTypes.PS] = Str.ToInt(val);
        //else inherited(id,val);
		inherited(id,val);
 	}

	public void SetPropertyValue(string id, string val)
	{
        if (m_bDebug) Print("SetPropertyValue(string)","id="+id+", val="+val);
 	}
	
	public void SetPropertyValue(string id, string val, int index)
	{
		if (m_bDebug) Print("SetPropertyValue(string)","id="+id+", val="+val+",index="+index);
		string[] temp = Str.Tokens(m_ForAllData[index], "#");
		propagatePropertiesInEditor(temp[0]);		
	}
	//#endregion
    //#region Lenses operations ===========================================================================
    // void showAllLenses()
    // {
    //     if (m_bDebug) Print("showAllLenses", "");
    //     m_signal.ShowAllLenses();
    // }

    void hideAllLenses()
    {
        if (m_bDebug) Print("hideAllLenses", "");
        m_signal.HideAllLenses();
    }
	
	bool ShouldShowAutoblockLenses()
	{
//		if (m_bDebug) Print("ShouldShowAutoblockLenses", "m_bAutoblockCurrent=" + m_bAutoblockCurrent);
		return m_bAutoblockCurrent;
	}
	
	string[] getLenses() 
	{
		//if (m_bDebug or IsDebug()) Print("getLenses", "m_nLensesState=" + m_nLensesState);
		ZmvLensesData lensesData = m_lenseTypes[m_nLensesState];
		string[] lenses;
		if (lensesData) {
			lenses = lensesData.getLenses();
			if (m_bPS) {
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
		if (m_bPS) lenses[1] = ZmvLenseTypes.scWf;
		return lenses;
	}

	int  getSpeedLimit()
	{
		return 0;//!!!!!!!!!!!!!!!!!!!!
	}

    void ShowLenses()
    {
        if (m_bDebug or IsDebug()) Print("showLenses", "m_nLensesState=" + m_nLensesState);		
		//if (m_bDebug or IsDebug()) Print("showLenses1", "nLensesState=" + nLensesState);
		string[] lenses = getLenses();			
		//if (m_bDebug or IsDebug()) 
		//	if (lenses)
		//		PrintArray("showLenses2", lenses);
		//	else
		//		Print("showLenses2", "----");
		//if (m_bDebug or IsDebug()) Print("showLenses3", "getSignalState=" + getSignalState());
		m_signal.SetLensesState(lenses, getSignalState(), getSpeedLimit());
    }

    void clrRouteNumber()
    {
        if (m_bDebug) Print("clrRouteNumber", "");
        m_signal.ClrRouteNumber();
    }

    void setRouteNumber()
    {
         //if (m_bDebug) Print("setRouteNumber", "");
         m_signal.SetRouteNumber(m_nextMarker);
    }
	//#endregion
    //#region Main Process ================================================================================
	bool UseMarker()
	{
		return m_bSemiAutoProp;
	}

	bool UseChecker()
	{
		if (m_bDebug /*or IsDebug()*/) Print("UseChecker", "m_bSemiAutoCurrent="+m_bSemiAutoCurrent+",m_bJunctionToward="+m_bJunctionToward+",m_bTrainEntered="+m_bTrainEntered);
		return !m_bSemiAutoCurrent and m_bJunctionToward or m_bTrainEntered;
	}

	bool UseTrainHandlers()
	{
		return true;
	}
	
	bool UseAlsFrequencies()
	{
		return true;
	}
	// ZmvMarker getNextMarker(object nextObject)
    // {
	// 	ZmvMarker res = null;
		
	// 	Trackside obj = cast<Signal>(nextObject);
	// 	if (!obj) return null;
	// 	GSTrackSearch thesearch = obj.BeginTrackSearch(true);
	// 	object nextObj = thesearch.SearchNext();
	// 	while (nextObj != null)
	// 	{
	
	// //Print("getNextMarker",(cast<GameObject>(nextObj)).GetName());
	
	// 		if (nextObj.isclass(ZmvMarker) and thesearch.GetFacingRelativeToSearchDirection())
	// 		{
	// 			res = cast<ZmvMarker>(nextObj);
	// 			break;
	// 		}
	// 		if (thesearch.GetDistance() >= 500)
	// 			break;

	// 		nextObj = thesearch.SearchNext();
	// 	}
		
    //     if (m_bDebug)
	// 	{
	// 		if (res) Print("getNextMarker", "found:"+res.GetName());        
	// 		else	 Print("getNextMarker","Marker not found");        			
	// 	}
    //     return res;            
    // }

    // void setRouteNumber(object nextObject, int nNewLensesState, bool force)
    // {        
    //     if (m_bDebug or IsDebug()) 
    //     {
    //         Print("setRouteNumber", "nNewLensesState="+nNewLensesState+",nextObject != m_nextObject:"+(string)(nextObject != m_nextObject));
    //         if (nextObject) 
    //         {
    //             if (nextObject.isclass(Signal))   
    //                 Print("setRouteNumber", "nextObject="+(cast<Signal>(nextObject)).GetName());
    //             else if (nextObject.isclass(Vehicle))   
    //                 Print("setRouteNumber","nextObject="+(cast<Vehicle>(nextObject)).GetName());
    //         }
    //     }
		
	// 	bool r_or_ry = (nNewLensesState == ZmvSignalTypes.R or nNewLensesState == ZmvSignalTypes.RY);
    //     if (nextObject == null or (r_or_ry and !m_bPS))
    //     {
	// 		if (m_bDebug or IsDebug()) 
	// 			Print("setRouteNumber1","clrRouteNumber");
    //         clrRouteNumber();
    //     }
    //     else if (force or nextObject != m_nextObject or m_nLensesState != nNewLensesState)
    //     {
	// 		if (m_bDebug or IsDebug()) 
	// 			Print("setRouteNumber2","m_nextMarker="+!!m_nextMarker);
    //         // if (m_nextMarker == null)               
    //         //     m_nextMarker = getNextMarker(nextObject);
	// 		if (m_bDebug or IsDebug()) 
	// 			Print("setRouteNumber3","m_nextMarker="+!!m_nextMarker);
	// 		if (m_nextMarker == null)
    //             clrRouteNumber();
    //         else
	// 			setRouteNumber(m_nextMarker);
    //     }
    // }

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

	void setCurrentAlsFreeBlocks()
	{
		if (m_nextMarker == null)
		{
			m_nCurFr0  = m_nFr0;
			m_nCurFr40 = m_nFr40;
			m_nCurFr60 = m_nFr60;
			m_nCurFr70 = m_nFr70;
			m_nCurFr80 = m_nFr80;
		}
		else
		{
			m_nCurFr0  = m_nextMarker.GetAlsFreeBlocks(0);
			m_nCurFr40 = m_nextMarker.GetAlsFreeBlocks(40);
			m_nCurFr60 = m_nextMarker.GetAlsFreeBlocks(60);
			m_nCurFr70 = m_nextMarker.GetAlsFreeBlocks(70);
			m_nCurFr80 = m_nextMarker.GetAlsFreeBlocks(80);
		}

		int max = m_nCurFr80;
		if (max < m_nCurFr70) max = m_nCurFr70;
		if (max < m_nCurFr60) max = m_nCurFr60;
		if (max < m_nCurFr40) max = m_nCurFr40;
		m_nMaxFreeBlocks = max;
	}

	void processNextMarker(ZmvMarker marker) 
	{
		if (marker == m_nextMarker) return;
		m_nextMarker = marker;
		setCurrentAlsFreeBlocks();
	}

    void processSearchNextObject()
    {
        bool bVehicle = false,
			 bSignal = false,
			 bMarker = false;

		m_nextMarker = null;

        if (m_bDebug) Print("processSearchNextObject", "");

        GSTrackSearch thesearch = m_signal.BeginTrackSearch(true);
		object nextObject = thesearch.SearchNext();
		while (nextObject != null)
		{
			if (nextObject.isclass(JunctionBase))
			{
    //if (m_bDebug or IsDebug()) Print("processSearchNextObject", "JunctionBase found");
				m_bJunctionToward = true;
			}
			else if (nextObject.isclass(ZmvMarker))
			{
				if (UseMarker() and thesearch.GetFacingRelativeToSearchDirection())
				{
					bMarker = true;
					processNextMarker(cast<ZmvMarker>(nextObject));
    //if (m_bDebug or IsDebug()) Print("processSearchNextObject", "nextMarker="+ marker.GetName();
				}
            }
			else if (nextObject.isclass(Signal))
			{
                if (thesearch.GetFacingRelativeToSearchDirection())
                {
    //if (m_bDebug or IsDebug()) Print("processSearchNextObject", "nextSignal="+ (cast<Signal>(nextObject)).GetName());
                    bSignal = true;
					break;
                }
			}
			else if (nextObject.isclass(Vehicle))
            {
    //if (m_bDebug or IsDebug()) Print("processSearchNextObject", "nextVehicle="+ (cast<Vehicle>(nextObject)).GetName());
                bVehicle = true;
//				m_DistanceToVehicle = (int)thesearch.GetDistance();
				break;
            }
			else
			{
    //if (m_bDebug or IsDebug()) Print(" ", "processSearchNextObject="+ (cast<GameObject>(nextObject)).GetName());
			}
			nextObject = thesearch.SearchNext();
		}

		if (UseMarker() and !bMarker) processNextMarker(null);

		m_bNextVehicle = bVehicle;
		m_bEmptyNextObject = !bVehicle and !bSignal;
		m_nextObject = nextObject; 
    }

	void updateSignalStateInt(bool force)
	{
		processSearchNextObject();
		updateVisualState(force);
		m_signal.SetCheckerWorkMode(UseChecker());
	}

	//#endregion
    //#region Lenses State operations =====================================================================    	
	bool updateFreeBlocksCount()
	{
		int freeBlocks = CalcFreeBlocks();
		if (m_nFreeBlocks == freeBlocks) return false;
		m_nFreeBlocks = freeBlocks;
		if (m_prevSignal)
			m_signal.PostMessage(m_prevSignal, "FreeBlocksChanged", (string)freeBlocks, 0);
		m_signal.UpdateBrowser();
		return freeBlocks < m_nMaxFreeBlocks;
	}

	int GetNewRepeaterLensesState(int nPrevLensesState)
	{
        if (m_bDebug) Print("GetNewRepeaterLensesState", "nPrevLensesState =" + nPrevLensesState);
        return ZmvSignalTypes.R;	
	}
	
    int GetNewLensesStateByFreeBlocks()
    {
        if (m_bDebug) Print("GetNewLensesStateByFreeBlocks", "Base");
        return ZmvSignalTypes.R;
    }

	void processNextVehicle()
	{
		Vehicle vehicle = cast<Vehicle>(m_nextObject);
		Train train = vehicle.GetMyTrain();
		Vehicle front = train.GetFrontmostLocomotive();
		//Print("processNextVehicle", m_nextTrainForAutoblock, ","+front.GetName());
		if (train == m_nextTrainForAutoblock) return;		
		if (train.GetVehicles().size() == 1 or vehicle != front)
		{
			if (m_bSemiAutoProp and !m_bSemiAutoCurrent) setSemiAutoMode(true);
			if (!m_bAutoblockProp and m_bAutoblockCurrent) 
			{
				m_bAutoblockCurrent = m_bAutoblockProp;
				ZmvSignalInterface nextSignal = SearchNearestZmvSignal(false);
				if (nextSignal) front.PostMessage(nextSignal, "SetAutoblock", "", 0);
			}
			m_nextTrainForAutoblock = train;
		}
	}

	int GetSemiAutoLensesState() 
	{
		return ZmvSignalTypes.R;
	}

    int getRepeaterLensesState()
	{
		ZmvSignalInterface signal = cast<ZmvSignalInterface>(m_nextObject);
		int nNewLensesState = ZmvSignalTypes.R;
		if (signal.IsAutomated())
		{
			int state = signal.GetLensesState();
			if (state >= 0 and state != ZmvSignalTypes.R) 
				nNewLensesState = GetNewRepeaterLensesState(state);
		}
		return nNewLensesState;
	}	

    int processNewLensesState()
    {
		//if (IsDebug()) Print("processNewLensesState(object nextObject)","");
		if (m_bEmptyNextObject) return ZmvSignalTypes.R;
		if (m_bSemiAutoCurrent) return GetSemiAutoLensesState();
		if (UseMarker() and m_nextMarker != null and m_nextMarker.IsClosed()) return ZmvSignalTypes.R;
		int nNewLensesState = ZmvSignalTypes.R;
		if (m_bNextVehicle) //next object is Vehicle
		{
			if (m_bDebug /*or IsDebug()*/) Print("$$processNewLensesState$$","NextObject-Vehicle");
			if (m_bPS) 
			{
				m_bPS = false;
				ShowLenses();
			}
			if ((m_bSemiAutoProp and !m_bSemiAutoCurrent) or (!m_bAutoblockProp and m_bAutoblockCurrent))
			{
				processNextVehicle();
			}
		}
		else //next object is Signal
		{
			if (m_bRepeater)
			{
				nNewLensesState = getRepeaterLensesState();
			}
			else 
			{
				nNewLensesState = GetNewLensesStateByFreeBlocks();				
			}
			if (nNewLensesState != ZmvSignalTypes.R and !ShouldShowAutoblockLenses())
				nNewLensesState = ZmvSignalTypes.B;
		}
		
		//m_signal.UpdateBrowser();
		
        //if (m_bDebug /*or IsDebug()*/) Print("processNewLensesState","NewLensesState="+(string)nNewLensesState);

        return nNewLensesState;
    }
	
	void updateLensesState(bool force) 
	{
		int newState = processNewLensesState();
		if (!force and m_nLensesState == newState) return;
		ShowLenses();
	}

	void updateAlsCode()
	{
		m_nAlsCode = ZmvAls.ALS_OC; //!!!!!!!!!!!!!!!!!
	}

	void setAlsProperties(Soup db)
	{
		m_nFr0  = db.GetNamedTagAsInt("fr0",  1);
		m_nFr40 = db.GetNamedTagAsInt("fr40", 2);
		m_nFr60 = db.GetNamedTagAsInt("fr60", 3);
		m_nFr70 = db.GetNamedTagAsInt("fr70", 4);
		m_nFr80 = db.GetNamedTagAsInt("fr80", 5);
	}

	void getAlsProperties(Soup db)
	{
		db.SetNamedTag("fr0",  m_nFr0);
		db.SetNamedTag("fr40", m_nFr40);
		db.SetNamedTag("fr60", m_nFr60);
		db.SetNamedTag("fr70", m_nFr70);
		db.SetNamedTag("fr80", m_nFr80);
	}

	void updateRoutePointerState() 
	{
		bool clear = m_nextMarker == null or 
					 m_nextMarker.IsClosed() or
					 m_nLensesState == ZmvSignalTypes.R or
					 (m_nLensesState == ZmvSignalTypes.R and !m_bPS);
		if (clear)
			clrRouteNumber();
		else
			setRouteNumber();
	}

	void updateVisualState(bool force)
	{
		if (!updateFreeBlocksCount()) return;
		updateLensesState(force);
		updateAlsCode();
		if (m_bContainsRoutePointer) updateRoutePointerState();
		m_signal.UpdateBrowser();
	}	

	// int getNextSpeedLimitForALS()
	// {
	// 	return m_nextSpeedLimitForALS;
	// }
	
    // int getNewFinalLensesState()
    // {
    //     int nNewLensesState;
    //     //processSearchNextObject();
		
	// //!!!!!!!!!!!!!! if (IsDebug()) Print("getNewFinalLensesState","m_nLensesState="+m_nLensesState);
    //     if (m_nextMarker != null and m_nextMarker.IsClosed())
    //     {
    //         if (m_bDebug /*or IsDebug()*/) Print("getNewFinalLensesState","NextMarkerClosed");
	// 		nNewLensesState = ZmvSignalTypes.R;
    //     }
    //     else
    //     {
    //         nNewLensesState = processNewLensesState(nextObject);        
    //     }
    
	// 	if (m_bContainsRoutePointer)
    //         setRouteNumber(m_nextObject, nNewLensesState, false);
    //     //m_nextObject = nextObject;

	// 	if (m_bDebug /*or IsDebug()*/) Print("getNewFinalLensesState","NewLensesState="+(string)nNewLensesState+",trainAfterSignal="+(nextObject != null and nextObject.isclass(Vehicle)));
        
    //     return nNewLensesState;
    // }
    
    int getSignalStateByLensesState()
    {
        if (m_bDebug) Print("getSignalStateByLensesState","RED");
        return m_signal.RED;   
    }

    int getSignalState()
    {
        int nSignalState;

        if (m_nLensesState < 0 or m_nLensesState == ZmvSignalTypes.R) //!!!!! or  !m_speedLimits[m_nLensesState])
            nSignalState = m_signal.RED;
        else
            nSignalState = getSignalStateByLensesState();
        
        if (m_bDebug) Print("getSignalState", "nSignalState="+ nSignalState);

        //SetSignalState(nSignalState,"");      
        return nSignalState;
    }

    // void setCurrentState()
    // {
    //     if (m_bDebug or IsDebug()) Print("setCurrentState", "m_nLensesState=" + m_nLensesState);
	// 	if (m_nLensesState < 0) {
	// 	 	m_nLensesState = ZmvSignalTypes.R;
    //         if (m_bContainsRoutePointer)
	// 			clrRouteNumber();
	// 	}
    //     ShowLenses();
    // }

	// void CheckNextSignalAndUpdateState()
    // {
    //     if (!UseChecker()) return;
	// 	//int newFreeBlocks = CalcFreeBlocks(m_nextObject);
	// 	//bool freeBlocksChanged = updateFreeBlocksCount(newFreeBlocks);
    //     int nNewLensesState = getNewFinalLensesState();

	// 	if (m_bDebug or IsDebug()) Print("CheckNextSignalAndUpdateState","old="+m_nLensesState+"+ new="+ nNewLensesState+", freeBlocks="+m_nFreeBlocks);

	// 	if (nNewLensesState != m_nLensesState)
    //     {
    //         m_nPrevLensesState = m_nLensesState;
	// 		m_nLensesState = nNewLensesState;
    //         setCurrentState();
    //     }
	// 	else if (m_nPrevLensesState != m_nLensesState)
	// 	{
	// 		m_nPrevLensesState = m_nLensesState;
	// 		setCurrentState();
	// 	}
	// 	// Notify previous signal when free blocks count changes
	// 	//if (freeBlocksChanged)
	// 	//	m_signal.UpdateBrowser();
    // }
	//#endregion	
	//#region AutoMode ====================================================================================
    void setSemiAutoMode(bool semiauto)
    {
        if (m_bDebug /*or IsDebug()*/) Print("setSemiAutoMode","semiauto="+semiauto);
        m_bSemiAutoCurrent = semiauto;
		if (m_bSemiAutoCurrent)
        {
            m_nextObject = null;
			m_nLensesState = ZmvSignalTypes.R;
            ShowLenses();
			if (m_bContainsRoutePointer) clrRouteNumber();
        }
        else
        {
            UpdateSignalState();
        }
		m_signal.SetCheckerWorkMode(UseChecker());
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
	
	string GetCurrentStateDisplayValue(StringTable ST)
	{
		return ST.GetString("signal-state-r");
	}
	
	string GetAutomatLink(StringTable ST)
	{
		if (m_bSemiAutoCurrent)
			return GetDetailsLink("automat_on",  ST.GetString("par_automat_on"));
		return GetDetailsLink("automat_off",  ST.GetString("par_automat_off"));	
	}
	
	string GetInvitationLink(StringTable ST)
	{
		if (!m_bPS)
			return GetDetailsLink("invitation_on",  ST.GetString("par_invitation_on"));
		return GetDetailsLink("invitation_off",  ST.GetString("par_invitation_off"));
	}
	
	string getFreeBlocksValue() 
	{
		if (m_nFreeBlocks > MAX_FREE_BLOCKS)
			return MAX_FREE_BLOCKS + "+";
		return (string)m_nFreeBlocks;
	}

	string GetViewDetailsInt(StringTable ST)
	{
		string s = GetDetailsRow(ST.GetString("par_name"), m_signal.GetName());
		s = s + GetDetailsRow(ST.GetString("current-state"), GetCurrentStateDisplayValue(ST));
		s = s + GetDetailsRow(ST.GetString("signal-als-code"), m_nAlsCode);
		s = s + GetDetailsRow(ST.GetString("signal-free-blocks"), getFreeBlocksValue());
		if (m_prevSignal)	s = s + GetDetailsRow(ST.GetString("par_prev_signal"), m_prevSignal.GetName());
		else				s = s + GetDetailsRow(ST.GetString("par_prev_signal"), "---");
		//SemiAutomatProp
		if (m_bSemiAutomatType)
		{			
			s = s + GetDetailsRow(ST.GetString("signal-semiautomath"), getModeString(ST, m_bSemiAutoCurrent));
			s = s + GetDetailsRow(ST.GetString("par_blocked"), GetBlockedTrainDisplayName());
			s = s + GetBlockedTrainsRows(ST);
			if (!m_blockedByTrain and m_bSemiAutomatType) s = s + GetAutomatLink(ST);
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
	public void OnChangeFreeBlocksCount() 
	{		
		updateVisualState(false);
		m_signal.SetCheckerWorkMode(UseChecker());
	}

	public void UpdateSignalState()
	{
		updateSignalStateInt(false);
	}

    public string GetPropertiesContent(StringTable ST) 
    {
        if (m_bDebug) Print("GetPropertiesContent","");
        
		m_bOpenedProperties = true;
		m_savedProperties.Clear();
		m_ForAllData = new string[0];				
		
        StringTable mST = m_asset.GetStringTable();
        return  GetModeContentForEditor(mST)+
				getUseSignalsContentBaseForEditor(mST)+
                getSpeedLimitsContentBase(mST)+
                getOptionalContentForEditor(mST);
    }

    public int GetLensesState()
    {
        if (m_nLensesState < 0) return ZmvSignalTypes.R;
		return m_nLensesState;
    }

    public int GetFreeBlocksCount()
    {
        return m_nFreeBlocks;
    }

	int getFreeBlocksBySignalState()
	{
		Signal signal = cast<Signal>(m_nextObject);
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

    int CalcFreeBlocks() //mute
    {
        if (m_bSemiAutoCurrent or m_bEmptyNextObject or m_bNextVehicle)
            return 0;

        int freeBlocks = 0;
		if (m_nextObject.isclass(ZmvSignalInterface))
        {
            ZmvSignalInterface signal = cast<ZmvSignalInterface>(m_nextObject);
			int n = signal.GetFreeBlocksCount();
			if (n > MAX_FREE_BLOCKS) freeBlocks = MAX_FREE_BLOCKS + 1;
			else freeBlocks = n + 1;
        }
		else if (m_nextObject.isclass(Signal))
		{
            freeBlocks = getFreeBlocksBySignalState() + 1;
		}
        return freeBlocks;
    }

    public string[] GetAllLenses() 
    { 
        if (m_bDebug) Print("GetAllLenses","m_allLenses.getLenses()="+m_allLenses.getLenses().size());
        return m_allLenses.getLenses();
    }

	public void SetAutomatManually(bool autoMode)
	{
		if (m_bSemiAutoCurrent != autoMode) return;
		m_nextTrainForAutoblock = getNextTrain();
	//Print("SetAutomatManually", m_nextTrainForAutoblock, "");
		setSemiAutoMode(!autoMode);
	}

    public void SetAutoblock(Message msg)
    {
        if (m_bDebug) Print("SetAutoblock", "");
//!!!!!!!!!!!!!!!!!!!!
// 		Vehicle v = cast<Vehicle>(msg.src);		
//         if (m_bAutoblockProp)
// 		{
// 			if (msg.minor != "auto")
// 			{
// 				ZmvSignalInterface nextSignal = SearchNearestZmvSignal(false);
// //Print("SetAutoblock:sendToNext", ""+(nextSignal!=null));				
// 				if (nextSignal) v.PostMessage(nextSignal, "SetAutoblock", "auto", 0);
// 			}
// 		}
// 		else
// 		{
// //Print("SetAutoblock:m_bAutoblockCurrent","true");				
// 			m_nextTrainForAutoblock = getNextTrain();
// 	//Print("SetAutoblock", m_nextTrainForAutoblock, "");
// 			m_bAutoblockCurrent = true;
// 			ShowLenses();
// 		}		
    }
	
	void SetInvitationManually(bool set)
	{
		if (IsDebug()) Print("SetInvitationManually","set="+set);
		m_bPS = set;
		if (set) updateSignalStateInt(true);
		else	 updateVisualState(true);
	}

	public void ObjectEnter(Message msg) 
	{		
		//if (IsDebug()) Print("ObjectEnter", "name="+(cast<GameObject>(msg.src)).GetName());
		if (!msg.src.isclass(Train)) return;
		m_bTrainEntered = true;
		m_signal.SetCheckerWorkMode(true);
	}
	
	public void ObjectLeave(Message msg) 
	{
		//if (IsDebug()) Print("ObjectLeave", "name="+(cast<GameObject>(msg.src)).GetName());
		if (!msg.src.isclass(Train)) return;
		m_bTrainEntered = false;
	}
	
    public void TurnOnInvitationSignal(Message msg)
    {
        if (m_bDebug) Print("TurnOnInvitationSignal", "");
		SetInvitationManually(true);
    }
	
	public bool hasPermission(Train train)
	{
        if (m_bDebug) Print("hasPermission", "m_blockedByTrain="+m_blockedByTrain.GetTrainDisplayName()+",name="+train.GetTrainDisplayName());			
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
        if (hasPermission(train))
        {
            setSemiAutoMode(true);
            if (m_bDebug /*or IsDebug()*/) Print("SetSemiautoMode", "call");
        }
    }

    public void SetAutoMode(Message msg) 
    {
        if (m_bDebug /*or IsDebug()*/) Print("SetAutoMode", "");
		Train train = (cast<Vehicle>(msg.src)).GetMyTrain();
		if (hasPermission(train))
        {
			m_nextTrainForAutoblock = getNextTrain();

	//Print("SetAutoMode", m_nextTrainForAutoblock, "");
			
            if (m_bDebug /*or IsDebug()*/) Print("SetAutoMode", "call");
            if (m_bSemiAutoCurrent) setSemiAutoMode(false);
        }
    }

	public bool IsBlocked(Train train) 
    {
        if (m_bDebug)
		{
			if (m_blockedByTrain) Print("IsBlocked", "m_blockedByTrain="+m_blockedByTrain.GetTrainDisplayName()+",name="+train.GetTrainDisplayName() + ",perm="+hasPermission(train));		
			else Print("IsBlocked", "name="+train.GetTrainDisplayName() + ",perm="+hasPermission(train));
		}
		
		return !hasPermission(train);
    }
	
	public bool IsAutomated()
	{
		return !m_bSemiAutoCurrent;
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
		if (m_bDebug) Print("OnCTRL", msg.minor);
		string cmd = msg.minor;
		if (cmd == "UpdateState")
		{
			UpdateSignalState();
			return;
		}
		string mode = Str.Tokens(cmd, "^")[1];
		Str.ToLower(mode);
		if (TrainUtil.HasPrefix(cmd, "MayOpen"))	SetAutomatManually(mode == "true");				
		else if (TrainUtil.HasPrefix(cmd, "SetPS")) SetInvitationManually(mode == "true");				
	}

    public void ResetSignal() 
    {
        if (m_bDebug) Print("ResetSignal", "");		
        m_nLensesState = -1;
        m_prevSignal = SearchNearestZmvSignal(true);
		m_signal.SetCheckerWorkMode(true);
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
			RestorePropertiesInEditor();
			ResetSignal();
			m_savedProperties.Clear();
		}
		else
		{		
			SetPropagatedPropertiesInEditor(src.GetProperties(), par, (par == "forAll")); 
			ResetSignal();
		}
    }
    		
	void SetAlsData(Soup db)
	{
		bool rs = false;
		int als = 0;
		int limit = 0;

		db.SetNamedTag("MSig-als-rs", rs);
		db.SetNamedTag("MSig-als-fq", als);
		db.SetNamedTag("MSig-als-limit", limit);
	}

	void AddAlsProperties(Soup db)
	{		
		db.SetNamedTag("MSigSignal", 1); 
		db.SetNamedTag("MSig-type", "RC"); 
		SetAlsData(db);
	}

    public void GetProperties(Soup db)
    {
        if (m_bDebug) Print("GetProperties","");        
        GetPropertiesInt(db);
		if (!m_bSuveyor)
		{
			int privateStateEx = ZmvSignalExTypes.GetSignalEx(m_nLensesState, m_bPS);
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
            SetPropertiesInt(db);
    }
	//#endregion
    //#region Initialization ==============================================================================
//     void initSpeedLimits()
//     {
//         if (m_bDebug) Print("initSpeedLimits","");

//         Soup db = m_signal.GetAsset().GetConfigSoup().GetNamedSoup("extensions");
// 		bool depo = db.GetNamedTagAsBool("depo", false);
		
//         m_speedLimits = new int[10];

//         m_speedLimits[ZmvSignalTypes.R]   = 0;
//         m_speedLimits[ZmvSignalTypes.RY]  = db.GetNamedTagAsInt("speed-limit-ry", 0);
//         m_speedLimits[ZmvSignalTypes.Y]   = db.GetNamedTagAsInt("speed-limit-y",  40);
//         m_speedLimits[ZmvSignalTypes.YG]  = db.GetNamedTagAsInt("speed-limit-yg", 60);
//         m_speedLimits[ZmvSignalTypes.G]   = db.GetNamedTagAsInt("speed-limit-g",  80);
//         m_speedLimits[ZmvSignalTypes.PS] = db.GetNamedTagAsInt("speed-limit-wf",  20);
//         m_speedLimits[ZmvSignalTypes.WW]  = 20;
// 		if (depo)  	m_speedLimits[ZmvSignalTypes.W] = db.GetNamedTagAsInt("speed-limit-w", 20);
// 		else		m_speedLimits[ZmvSignalTypes.W] = db.GetNamedTagAsInt("speed-limit-w", 40);
//         m_speedLimits[ZmvSignalTypes.YY]  = db.GetNamedTagAsInt("speed-limit-tt",  40);
//         m_speedLimits[ZmvSignalTypes.YfY] = db.GetNamedTagAsInt("speed-limit-ttf", 40);
		
// //Interface.Print("depo="+depo+",m_speedLimits[ZmvSignalTypes.W]="+m_speedLimits[ZmvSignalTypes.W]);
//     }
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
        m_bContainsRoutePointer = (config.GetNamedSoup("mesh-table").GetNamedSoup("default").GetNamedSoup("effects").GetNamedSoup("m11").CountTags() != 0);
        m_bSemiAutomatType = options.GetNamedTagAsBool("semiautomat", false);        
        InitLenseTypes(config);
//        initSpeedLimits();
		m_prevSignal = SearchNearestZmvSignal(true);
		//updateNextSignal();
		if (m_bSuveyor)
		{
			m_savedProperties = new ZmvProperties();
			m_savedProperties.Clear();
		}
		if (UseTrainHandlers())
			m_signal.AddObjectEnterOrLeaveHandler();
		setCurrentAlsFreeBlocks();
	}
	//#endregion
};

