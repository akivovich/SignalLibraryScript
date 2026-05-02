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
	define int MAX_FREE_BLOCKS = 10;

	ZmvSignalInterface m_signal, m_prevSignal;
    Asset m_asset;

    ZmvLensesData   m_allLenses;
    ZmvLensesData[] m_lenseTypes;
    
    bool m_bDebug;
    bool m_bContainsRoutePointer; //has Route pointer device
    bool m_bAutoblockProp, 		  //Autoblock mode
		 m_bAutoblockCurrent; 	  //Autoblock mode currently (may be changed by command)

    bool m_bSemiAutomatType,      //semiautomat Signal type
    	 m_bSemiAutoProp,	      //semiautomat mode from properties
		 m_bSemiAutoCurrent;      //semiautomat mode currently (may be changed by command)

    bool m_nWaitSecProp = 2,		  //Checker sleeping interval (sec) from properties
         m_nWaitSecRedProp = 4;	  //Checker sleeping interval (sec) on Red state from properties

	bool m_bRepeater; 			  //repeats next signal state
		
	bool m_bOpenedProperties = false;
	bool m_bCancel = false; 
	bool m_bSuveyor;			  //if opened in Editor
	
    Train m_TrainForAutoblock;

	bool  m_bEmptyNextObject,  	//next object is not Signal, ZmvSignal or Vehicle
		  m_bNextVehicle,		//next object is Vehicle
		  m_bTrainEntered;		//Train entered to current Signal scope
	
	int	m_nJunctionToward = -1; //current block contains Junction Switch: -1:not checked, 0:not found, 1:found 

	Train m_blockedByTrain; 	//blocked by train corresponded path
	
    int   m_nLensesState = -1;  //lenses state
    int   m_nFreeBlocks;	    //free blocks toward
    bool  m_bUseAlsCodes; 		//use ALS codes
	int   m_nAlsCode = -1;      //current ALS Code

	bool m_bPS = false; //turned on PS
	
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
	void getAlsPropertiesInt(Soup db);
	void setAlsPropertiesInt(Soup db);
	void setAlsPropertiesInt(ZmvProperties props);
	void updateSignalStateInt(bool force);
	void updateVisualState(bool force);

	int  CalcFreeBlocks();
	int  GetNewLensesStateByFreeBlocks();
	
	void setSemiAutoMode(bool semiauto);

    public int  GetLensesState();
    public void ResetSignal();
	public void UpdateSignalState();

	//#endregion
    //#region Debug =======================================================================================    	
	bool IsDebug()
	{
		string name = m_signal.GetName();
		return name[0,2] == "t_";//"test";// or name == "2";
		//return false;
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
	void Print(string method, string s)
    {
        Interface.Print("ZmvSignalLibrary::"+method+":"+m_signal.GetName()+":"+s);
    }    

    void PrintArray(string method, string[] s)
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
    public string GetPropertyHTML(string name, string value, string valueId, string allPref)
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

    public string GetDescriptionHTML(StringTable ST, string content)
	{
 		string str = "<html><body><font color=#ccee00 size=13><p>" + ST.GetString("object-name") + "</p></font><br>" +
                     HTMLWindow.MakeTable(content, "width=100% border=1 cellspacing=1")+
                     "<br><font face=Century Gothic color=#B8B8B8 size=1><b>  © CyriTRAINZ and Akivovich 2026</b></body></html>";		        
       	return str;
	}
	//#endregion
    //#region Edit ========================================================================================
    void SetPropertiesInt(Soup db);

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
        
        db.SetNamedTag("autoblock", m_bAutoblockCurrent);
        db.SetNamedTag("repeater", m_bRepeater); 
        db.SetNamedTag("ps", m_bPS);
		db.SetNamedTag("useAlsCodes", m_bUseAlsCodes);
        if (m_bSemiAutomatType)
            db.SetNamedTag("semiautomat", m_bSemiAutoProp);
		if (m_bUseAlsCodes) getAlsPropertiesInt(db);
    }

    void SetPropertiesInt(Soup db)
    {
        if (m_bDebug) Print("SetPropertiesInt","m_bOpenedProperties="+m_bOpenedProperties+",m_bCancel="+m_bCancel);
        		
        bool bAutoblock = db.GetNamedTagAsBool("autoblock", true);
				
		if (m_bOpenedProperties and !m_bCancel)
			m_bCancel = bAutoblock != m_bAutoblockProp;
		
		if (m_bDebug) Print("SetPropertiesInt","bAutoblock="+bAutoblock+",m_bAutoblockProp="+m_bAutoblockProp+",m_bCancel="+m_bCancel);

		m_bRepeater = db.GetNamedTagAsBool("repeater", false);
		m_bAutoblockProp = m_bAutoblockCurrent = bAutoblock;

        if (m_bSemiAutomatType)
        {
            bool bSemiAutomat = db.GetNamedTagAsBool("semiautomat", false);
			if (m_bOpenedProperties and !m_bCancel)
				m_bCancel = (m_bSemiAutoProp != bSemiAutomat);			
			m_bSemiAutoProp = bSemiAutomat;
            setSemiAutoMode(m_bSemiAutoProp);
        }
		
		m_bUseAlsCodes = db.GetNamedTagAsBool("useAlsCodes", m_bUseAlsCodes) or !m_bAutoblockProp;
		if (m_bUseAlsCodes) setAlsPropertiesInt(db);

		if (m_bOpenedProperties)
		{
			if (m_bDebug) Print("SetPropertiesInt","Cancel="+m_bCancel);
			if (m_bCancel)
				propagatePropertiesInEditor("Cancel");
			else
				propagatePropertiesInEditor("Ok");
				
			m_bCancel = m_bOpenedProperties = false;
		}
    }

    void RestorePropertiesInEditor()
	{
        if (m_bDebug) Print("RestorePropertiesInEditor","");

		if (m_savedProperties.HasNamedTag("autoblock"))
			m_bAutoblockProp = m_bAutoblockCurrent = m_savedProperties.GetNamedTagAsBool("autoblock");
		if (m_bUseAlsCodes)
			setAlsPropertiesInt(m_savedProperties);
	}

    public void SetPropagatedPropertiesInEditor(Soup soup, string par, bool all) 
    {
        if (m_bDebug) Print("SetPropagatedPropertiesInEditor","par="+par);
		
		if (all or par == "mode")
		{
			m_savedProperties.SetNamedTag("autoblock", m_bAutoblockProp); 
			m_bAutoblockProp = m_bAutoblockCurrent = soup.GetNamedTagAsBool("autoblock");
		}
		if (all or par == "useCodes")
		{
			m_bUseAlsCodes = soup.GetNamedTagAsBool("UseCodes") or !m_bAutoblockCurrent;
		}
		if (m_bUseAlsCodes)
		{
			if (all or par == "fr0")
			{
				m_savedProperties.SetNamedTag("Fr0", m_nFr0); 
				m_nFr0 = soup.GetNamedTagAsInt("Fr0");
			}
			if (all or par == "fr40")
			{
				m_savedProperties.SetNamedTag("Fr40", m_nFr40); 
				m_nFr40 = soup.GetNamedTagAsInt("Fr40");
			}
			if (all or par == "fr60")
			{
				m_savedProperties.SetNamedTag("Fr60", m_nFr60); 
				m_nFr60 = soup.GetNamedTagAsInt("Fr60");
			}
			if (all or par == "fr70")
			{
				m_savedProperties.SetNamedTag("Fr70", m_nFr70); 
				m_nFr70 = soup.GetNamedTagAsInt("Fr70");
			}
			if (all or par == "fr80")
			{
				m_savedProperties.SetNamedTag("Fr80", m_nFr80);
				m_nFr80 = soup.GetNamedTagAsInt("Fr80");
			}
		}
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
		return GetPropertyTitleHTML(title) + 
               GetPropertyHTML(ST.GetString("signal-all"), ST.GetString("signal-for-all"), "forAll", title);
    }

    string GetUseSignalsContentForEditor(StringTable ST, string allPref) {return "";}

    string getUseSignalsContentBaseForEditor(StringTable ST) 
    {
		string title = ST.GetString("signal-use-title");
        string content = GetUseSignalsContentForEditor(ST, title);
        if (content != "")
        {
            return GetPropertyTitleHTML(title) + content;
        }                
        return "";
    }
    
    string GetAlsCodesContent(StringTable ST) 
    {
if (m_bDebug) Print("GetAlsCodesContent", "m_bAutoblockProp="+m_bAutoblockProp+",m_bUseAlsCodes"+m_bUseAlsCodes);
        string useCodes;
		if (m_bUseAlsCodes) useCodes = ST.GetString("signal-mode-on");
        else                useCodes = ST.GetString("signal-mode-off");

		string res = GetPropertyTitleHTML(ST.GetString("als-fr-title"));
		if (m_bAutoblockProp)
		{
			res = res + GetPropertyHTML(ST.GetString("als-fr-use"), useCodes, "UseCodes", "useCodes");
		}
					 
		if (m_bUseAlsCodes)
		{
			res = res + 
				  GetPropertyHTML("0",  (string)m_nFr0,  "Fr0",  "fr0") +
				  GetPropertyHTML("40", (string)m_nFr40, "Fr40", "fr40") +
				  GetPropertyHTML("60", (string)m_nFr60, "Fr60", "fr60") +
				  GetPropertyHTML("70", (string)m_nFr70, "Fr70", "fr70") +
				  GetPropertyHTML("80", (string)m_nFr80, "Fr80", "fr80");				  
		}
        return res;
    }
	//#endregion
	//#region Editor Property API =========================================================================
    public string GetPropertyType(string id)
    {
        if (m_bDebug) Print("GetPropertyType","id="+id);        
        if (id[0,2] == "Fr") return "int";
		else if (id == "forAll") return "list";
		
        return "link";
    }
		
    public string GetPropertyName(string id)
    {
        if (m_bDebug) Print("GetPropertyName","id="+id);
		if (id == "forAll") return m_asset.GetStringTable().GetString("signal-list-title");
		if (id[0,2] == "Fr")
			return m_asset.GetStringTable().GetString2("param-fr", 0, MAX_FREE_BLOCKS);
		return "";		
	}
	
	public string GetPropertyValue(string id)
	{
		if (id == "Fr0")  return (string)m_nFr0;
		if (id == "Fr40") return (string)m_nFr40;
		if (id == "Fr60") return (string)m_nFr60;
		if (id == "Fr70") return (string)m_nFr70;
		if (id == "Fr80") return (string)m_nFr80;
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

        if (id == "mode") 
		{
			m_bAutoblockProp = m_bAutoblockCurrent = !m_bAutoblockProp;
			if (!m_bAutoblockProp)
				m_bUseAlsCodes = true;
		}
        else if (id == "semiautomat")
        {
            m_bSemiAutoProp = !m_bSemiAutoProp;
            setSemiAutoMode(m_bSemiAutoProp);
        }
		else if (id == "repeater")
		{
			m_bRepeater = !m_bRepeater;
		}
		else if (id == "UseCodes") 
		{
			m_bUseAlsCodes = !m_bUseAlsCodes;
			if (!m_bUseAlsCodes)
				m_bAutoblockProp = m_bAutoblockCurrent = true;
		}
        /*
		else if (TrainUtil.HasPrefix(id, "propagate-"))
        {
            string par = Str.Tokens(id, "-")[1];
            if (m_bDebug) Print("LinkPropertyValue","par="+par);            
            propagatePropertiesInEditor(par);
        }
		*/
 	}

	public void SetPropertyValue(string id, int val)
	{
        if (m_bDebug) Print("SetPropertyValue(int)","id="+id+", val="+val);

		if (id == "Fr0")  		m_nFr0  = val;
		else if (id == "Fr40")  m_nFr40 = val;
		else if (id == "Fr60")  m_nFr60 = val;
		else if (id == "Fr70")  m_nFr70 = val;
		else if (id == "Fr80")  m_nFr80 = val;
		else inherited(id, val);

		if (id[0,2] == "Fr") 
		{
			if (m_nFr0  > 0 and m_nFr40 > 0 and m_nFr0  >= m_nFr40) m_nFr40 = m_nFr0  + 1;
			if (m_nFr40 > 0 and m_nFr60 > 0 and m_nFr40 >= m_nFr60) m_nFr60 = m_nFr40 + 1;
			if (m_nFr60 > 0 and m_nFr70 > 0 and m_nFr60 >= m_nFr70) m_nFr70 = m_nFr60 + 1;
			if (m_nFr70 > 0 and m_nFr80 > 0 and m_nFr70 >= m_nFr80) m_nFr80 = m_nFr70 + 1;			
		}
 	}

	// public void SetPropertyValue(string id, string val)
	// {
    //     if (m_bDebug) Print("SetPropertyValue(string)","id="+id+", val="+val);
 	// }
	
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
if (m_bDebug) Print("getLenses", "m_nLensesState=" + m_nLensesState);
		if (m_nLensesState == ZmvSignalTypes.Off) return new string[0];
		ZmvLensesData lensesData = m_lenseTypes[m_nLensesState];
		string[] lenses;
		if (lensesData) 
		{
			lenses = lensesData.getLenses();
			if (m_bPS) {
				int i, len = lenses.size();
				string[] newLenses = new string[len + 1];
				for (i = 0; i < len; i++) {
					newLenses[i] = lenses[i];
				}
				newLenses[i] = ZmvLenseTypes.scWf;
if (m_bDebug) PrintArray("getLenses::newLenses=", newLenses);
				return newLenses;
			}
			return lenses;
		}
		lenses = new string[0];
		lenses[0] = ZmvLenseTypes.scR;
		if (m_bPS) lenses[1] = ZmvLenseTypes.scWf;
if (m_bDebug) PrintArray("getLenses::lenses=", lenses);
		return lenses;
	}

	int  getAlsCodeByFreeBlocks()
	{
		if (m_nCurFr80 > 0 and m_nFreeBlocks >= m_nCurFr80) return ZmvAls.ALS_80;
		if (m_nCurFr70 > 0 and m_nFreeBlocks >= m_nCurFr70) return ZmvAls.ALS_70;
		if (m_nCurFr60 > 0 and m_nFreeBlocks >= m_nCurFr60) return ZmvAls.ALS_60;
		if (m_nCurFr40 > 0 and m_nFreeBlocks >= m_nCurFr40) return ZmvAls.ALS_40;
		return ZmvAls.ALS_0;
	}

	int  GetCurrentSpeedLimitByLensesState()
	{
		return 0; //ZmvSignalTypes.R;
	}

	int  GetCurrentSpeedLimit()
	{
		if (m_bPS) return 20;
		if (!m_bUseAlsCodes) return GetCurrentSpeedLimitByLensesState();
		switch (m_nAlsCode) 
		{
			case ZmvAls.ALS_80: return 80;
			case ZmvAls.ALS_70: return 70;
			case ZmvAls.ALS_60: return 60;
			case ZmvAls.ALS_40: return 40;
			case ZmvAls.ALS_0:  return 0;
			default: break;
		}
		return 20;
	}

    void ShowLenses()
    {
		string[] lenses = getLenses();
		int limit = GetCurrentSpeedLimit();
		int state;
		if (limit > 0) state = getSignalState();
		else		   state = m_signal.RED;
if (m_bDebug) Print("ShowLenses", "m_nLensesState="+m_nLensesState+",state="+state+",limit="+limit);
		m_signal.SetLensesState(lenses, state, limit);
    }

    void clrRouteNumber()
    {
if (m_bDebug) Print("clrRouteNumber", "");
        m_signal.ClrRouteNumber();
    }

    void setRouteNumber()
    {
if (m_bDebug) Print("setRouteNumber", "m_nextMarker="+!!m_nextMarker);
        m_signal.SetRouteNumber(m_nextMarker);
    }
	//#endregion
    //#region Main Process ================================================================================
	bool UseRouteMarker()
	{
if (m_bDebug) Print("UseRouteMarker", "m_bSemiAutoProp="+m_bSemiAutoProp);
		return m_bSemiAutoProp;
	}

	int  GetCheckerInterval()
	{
		int interval = 0;
		if (!m_bSemiAutoCurrent and (m_nJunctionToward > 0 or m_bTrainEntered or m_nFreeBlocks < m_nMaxFreeBlocks))
		{
			if (m_bTrainEntered and m_nFreeBlocks > 0)   interval = 1;
			else if (m_nLensesState == ZmvSignalTypes.R) interval = m_nWaitSecRedProp;
			else interval = m_nWaitSecProp;
		}
if (m_bDebug) Print("GetCheckerInterval", "m_bSemiAutoCurrent="+m_bSemiAutoCurrent+",m_nJunctionToward="+m_nJunctionToward+",m_bTrainEntered="+m_bTrainEntered+",m_nFreeBlocks="+m_nFreeBlocks+",m_nMaxFreeBlocks="+m_nMaxFreeBlocks+",interval="+interval);
		return interval;
	}

	bool UseTrainHandlers()
	{
		return true;
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

	int  FixMaxFreeBlocks(int max)
	{
		return max;
	}

	void setCurrentAlsFreeBlocks()
	{
		int max = 0;
		if (m_bUseAlsCodes)
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
				m_nCurFr0  = m_nextMarker.GetAlsFreeBlocks(m_nFr0);
				m_nCurFr40 = m_nextMarker.GetAlsFreeBlocks(m_nFr40);
				m_nCurFr60 = m_nextMarker.GetAlsFreeBlocks(m_nFr60);
				m_nCurFr70 = m_nextMarker.GetAlsFreeBlocks(m_nFr70);
				m_nCurFr80 = m_nextMarker.GetAlsFreeBlocks(m_nFr80);
			}
			int max = m_nCurFr80;
			if (max < m_nCurFr70) max = m_nCurFr70;
			if (max < m_nCurFr60) max = m_nCurFr60;
			if (max < m_nCurFr40) max = m_nCurFr40;
		}
		m_nMaxFreeBlocks = FixMaxFreeBlocks(max) + 1;
if (m_bDebug) Print("setCurrentAlsFreeBlocks", "m_nMaxFreeBlocks="+m_nMaxFreeBlocks);
	}

	void processNextMarker(ZmvMarker marker) 
	{
if (m_bDebug) Print("processNextMarker", "marker="+!!marker);
		if (marker == m_nextMarker) return;
		m_nextMarker = marker;
		setCurrentAlsFreeBlocks();
	}

    void processSearchNextObject()
    {
        bool bVehicle = false,
			 bSignal = false,
			 bMarker = false;

if (m_bDebug ) Print("processSearchNextObject", "");

        GSTrackSearch thesearch = m_signal.BeginTrackSearch(true);
		object nextObject = thesearch.SearchNext();
		while (nextObject != null)
		{
			if (m_nJunctionToward < 0 and nextObject.isclass(JunctionBase))
			{
if (m_bDebug) Print("processSearchNextObject", "JunctionBase found");
				m_nJunctionToward = 1;
			}
			else if (m_nJunctionToward < 0 and nextObject.isclass(SceneryWithTrack) and (cast<SceneryWithTrack>(nextObject)).GetAttachedJunctions().size() > 0)
			{
if (m_bDebug) Print("processSearchNextObject", "SceneryWithTrack with junctions found");
				m_nJunctionToward = 1;
			}
			else if (nextObject.isclass(ZmvMarker))
			{
				if (UseRouteMarker() and thesearch.GetFacingRelativeToSearchDirection())
				{
					bMarker = true;
					processNextMarker(cast<ZmvMarker>(nextObject));
				}
            }
			else if (nextObject.isclass(Signal))
			{
                if (thesearch.GetFacingRelativeToSearchDirection())
                {
if (m_bDebug) Print("processSearchNextObject", "nextSignal="+ (cast<Signal>(nextObject)).GetName());
                    bSignal = true;
					break;
                }
			}
			else if (nextObject.isclass(Vehicle))
            {
if (m_bDebug) Print("processSearchNextObject", "nextVehicle="+ (cast<Vehicle>(nextObject)).GetName());
                bVehicle = true;
				break;
            }
			nextObject = thesearch.SearchNext();
		}

		if (UseRouteMarker() and !bMarker) processNextMarker(null);
		if (m_nJunctionToward < 0) m_nJunctionToward = 0;
		m_bNextVehicle = bVehicle;
		m_bEmptyNextObject = !bVehicle and !bSignal;
		m_nextObject = nextObject; 
if (m_bDebug ) Print("processSearchNextObject1", "m_bNextVehicle="+m_bNextVehicle+",m_bEmptyNextObject="+m_bEmptyNextObject+",m_nJunctionToward="+m_nJunctionToward);
    }

	void updateSignalStateInt(bool force)
	{
		processSearchNextObject();
		updateVisualState(force);
		if (m_bDebug) Print("updateSignalStateInt", "force="+force+",checker="+GetCheckerInterval());
		m_signal.SetCheckerWorkMode(GetCheckerInterval());
	}

	//#endregion
    //#region Lenses State operations =====================================================================    	
	bool updateFreeBlocksCount()
	{
		int freeBlocks = CalcFreeBlocks();
if (m_bDebug) Print("updateFreeBlocksCount","m_nFreeBlocks="+m_nFreeBlocks+",freeBlocks="+freeBlocks+",m_prevSignal="+!!m_prevSignal);
		if (m_nFreeBlocks == freeBlocks) return false;
		int freeBlocksPrev = m_nFreeBlocks;
		m_nFreeBlocks = freeBlocks;
		if (m_prevSignal)
			m_signal.PostMessage(m_prevSignal, "FreeBlocksChanged", (string)freeBlocks, 0);
		m_signal.UpdateBrowser();

if (m_bDebug) Print("updateFreeBlocksCount1","m_nFreeBlocks="+m_nFreeBlocks+",res="+(freeBlocksPrev <= m_nMaxFreeBlocks or freeBlocks <= m_nMaxFreeBlocks));

		return freeBlocksPrev <= m_nMaxFreeBlocks or freeBlocks <= m_nMaxFreeBlocks;
	}

	int  GetNewRepeaterLensesState(int nPrevLensesState)
	{
        if (m_bDebug) Print("GetNewRepeaterLensesState", "nPrevLensesState =" + nPrevLensesState);
        return ZmvSignalTypes.R;	
	}
	
    int  GetNewLensesStateByFreeBlocks()
    {
        if (m_bDebug) Print("GetNewLensesStateByFreeBlocks", "Base");
        return ZmvSignalTypes.R;
    }

	void processNextVehicle()
	{
		Vehicle vehicle = cast<Vehicle>(m_nextObject);
		Train train = vehicle.GetMyTrain();
		Vehicle front = train.GetFrontmostLocomotive();
		//Print("processNextVehicle", m_TrainForAutoblock, ","+front.GetName());
		if (train == m_TrainForAutoblock) return;		
		if (train.GetVehicles().size() == 1 or vehicle != front)
		{
			if (m_bSemiAutoProp and !m_bSemiAutoCurrent) setSemiAutoMode(true);
			if (!m_bAutoblockProp and m_bAutoblockCurrent) 
			{
				m_bAutoblockCurrent = m_bAutoblockProp;
				ZmvSignalInterface nextSignal = SearchNearestZmvSignal(false);
				if (nextSignal) front.PostMessage(nextSignal, "SetAutoblock", "", 0);
			}
			m_TrainForAutoblock = train;
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

    int  processNewLensesState()
    {
if (m_bDebug) Print("processNewLensesState","m_bPS="+m_bPS+",m_bEmptyNextObject="+m_bEmptyNextObject+",m_bSemiAutoCurrent="+m_bSemiAutoCurrent+",m_bNextVehicle="+m_bNextVehicle+",m_bRepeater="+m_bRepeater);
		if (m_bEmptyNextObject) return ZmvSignalTypes.R;
		if (m_bSemiAutoCurrent) return GetSemiAutoLensesState();
		if (!m_bSemiAutomatType and !ShouldShowAutoblockLenses()) return ZmvSignalTypes.Off;
		if (UseRouteMarker() and m_nextMarker != null and m_nextMarker.IsClosed()) return ZmvSignalTypes.R;
		int nNewLensesState = ZmvSignalTypes.R;
		if (m_bNextVehicle) //next object is Vehicle
		{
			if (m_bDebug) Print("$$processNewLensesState$$","NextObject-Vehicle");
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
		else  //next object is Signal
		{
			if (m_bRepeater)
			{
				nNewLensesState = getRepeaterLensesState();
			}
			else 
			{
				nNewLensesState = GetNewLensesStateByFreeBlocks();				
			}
		}
		if (!ShouldShowAutoblockLenses() and nNewLensesState != ZmvSignalTypes.R)
			nNewLensesState = ZmvSignalTypes.B;

if (m_bDebug) Print("processNewLensesState","nNewLensesState="+nNewLensesState);

        return nNewLensesState;
    }
	
	void updateLensesState(bool force) 
	{
if (m_bDebug) Print("updateLensesState","force="+force+",m_nFreeBlocks="+m_nFreeBlocks);
		int newState = processNewLensesState();
		if (!force and m_nLensesState == newState) return;
		m_nLensesState = newState;
		ShowLenses();
	}

	void updateAlsCode()
	{
		if (m_bPS) 				  m_nAlsCode = ZmvAls.ALS_AO;
		else if (!m_bUseAlsCodes) m_nAlsCode = ZmvAls.ALS_OC;
		else					  m_nAlsCode = getAlsCodeByFreeBlocks();
if (m_bDebug) Print("updateAlsCode","m_nAlsCode="+m_nAlsCode);
	}

 	void setAlsPropertiesInt(ZmvProperties props)
	{
		if (m_savedProperties.HasNamedTag("fr0"))
		 	m_nFr0 = m_savedProperties.GetNamedTagAsInt("fr0");
		if (m_savedProperties.HasNamedTag("fr40"))
		 	m_nFr40 = m_savedProperties.GetNamedTagAsInt("fr40");
		if (m_savedProperties.HasNamedTag("fr60"))
		 	m_nFr60 = m_savedProperties.GetNamedTagAsInt("fr60");
		if (m_savedProperties.HasNamedTag("fr70"))
		 	m_nFr70 = m_savedProperties.GetNamedTagAsInt("fr70");
		if (m_savedProperties.HasNamedTag("fr80"))
		 	m_nFr80 = m_savedProperties.GetNamedTagAsInt("fr80");
	}

	void setAlsPropertiesInt(Soup db)
	{
		m_nFr0  = db.GetNamedTagAsInt("fr0",  1);
		m_nFr40 = db.GetNamedTagAsInt("fr40", 2);
		m_nFr60 = db.GetNamedTagAsInt("fr60", 3);
		m_nFr70 = db.GetNamedTagAsInt("fr70", 4);
		m_nFr80 = db.GetNamedTagAsInt("fr80", 5);
	}

	void getAlsPropertiesInt(Soup db)
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
if (m_bDebug) Print("updateVisualState","force="+force);		
		if (!updateFreeBlocksCount() and !force) return;
if (m_bDebug) Print("updateVisualState1","m_nFreeBlocks="+m_nFreeBlocks+",m_nAlsCode="+m_nAlsCode);
		updateAlsCode();
		updateLensesState(force);
		if (m_bContainsRoutePointer) updateRoutePointerState();
		m_signal.UpdateBrowser();
	}	
    
    int GetSignalStateByLensesState()
    {
        if (m_bDebug) Print("GetSignalStateByLensesState","RED");
        return m_signal.RED;   
    }

    int getSignalState()
    {
        int nSignalState;

        if (m_nLensesState < 0 or m_nLensesState == ZmvSignalTypes.R)
            nSignalState = m_signal.RED;
        else
            nSignalState = GetSignalStateByLensesState();
        
        if (m_bDebug) Print("getSignalState", "nSignalState="+ nSignalState);

        return nSignalState;
    }

	//#endregion	
	//#region AutoMode ====================================================================================
    void setSemiAutoMode(bool semiauto)
    {
        if (m_bDebug) Print("setSemiAutoMode","semiauto="+semiauto);
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
		m_signal.SetCheckerWorkMode(GetCheckerInterval());
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
	
	string getDebugLink()
	{
		if (!m_bDebug)
			return GetDetailsLink("debug_on",  "Debug ON");
		return GetDetailsLink("debug_off",  "Debug OFF");
	}
	
	string getAutomatLink(StringTable ST)
	{
		if (m_bSemiAutoCurrent)
			return GetDetailsLink("automat_on",  ST.GetString("par_automat_on"));
		return GetDetailsLink("automat_off",  ST.GetString("par_automat_off"));	
	}
	
	string getInvitationLink(StringTable ST)
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
		s = s + GetDetailsRow(ST.GetString("signal-als-code"), ZmvAls.GetDisplayValue(m_nAlsCode));
		s = s + GetDetailsRow(ST.GetString("signal-free-blocks"), getFreeBlocksValue());
		if (m_prevSignal)	s = s + GetDetailsRow(ST.GetString("par_prev_signal"), m_prevSignal.GetName());
		else				s = s + GetDetailsRow(ST.GetString("par_prev_signal"), "---");		
		//SemiAutomatProp
		if (m_bSemiAutomatType)
		{			
			s = s + GetDetailsRow(ST.GetString("signal-semiautomath"), getModeString(ST, m_bSemiAutoCurrent));
			s = s + GetDetailsRow(ST.GetString("par_blocked"), GetBlockedTrainDisplayName());
			s = s + GetBlockedTrainsRows(ST);
			if (!m_blockedByTrain and m_bSemiAutomatType) s = s + getAutomatLink(ST);
			s = s + getInvitationLink(ST);
		}
		s = s + getDebugLink();

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
if (m_bDebug) Print("OnChangeFreeBlocksCount", ""); //!
		updateVisualState(false);
		int interval = GetCheckerInterval();
		if (interval > 0) m_signal.SetCheckerWorkMode(interval);
	}

	public void UpdateSignalState()
	{
if (m_bDebug) Print("UpdateSignalState", ""); //!
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
                GetAlsCodesContent(mST)+
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
		m_TrainForAutoblock = getNextTrain();
	//Print("SetAutomatManually", m_TrainForAutoblock, "");
		setSemiAutoMode(!autoMode);
	}

    public void SetAutoblock(Message msg)
    {
        if (m_bDebug) Print("SetAutoblock", "");
 		Vehicle v = cast<Vehicle>(msg.src);		
        if (m_bAutoblockProp)
 		{
 			if (msg.minor != "auto")
 			{
 				ZmvSignalInterface nextSignal = SearchNearestZmvSignal(false);
//Print("SetAutoblock:sendToNext", ""+(nextSignal!=null));				
 				if (nextSignal) v.PostMessage(nextSignal, "SetAutoblock", "auto", 0);
 			}
 		}
 		else
 		{
//Print("SetAutoblock:m_bAutoblockCurrent","true");				
 			m_TrainForAutoblock = getNextTrain();
//Print("SetAutoblock", m_TrainForAutoblock, "");
 			m_bAutoblockCurrent = true;
 			ShowLenses();
 		}		
    }
	
	void SetInvitationManually(bool set)
	{
		if (m_bDebug) Print("SetInvitationManually","set="+set);
		m_bPS = set;
		if (set) updateSignalStateInt(true);
		else	 updateVisualState(true);
	}

	public void ObjectEnter(Message msg) 
	{		
		if (!msg.src.isclass(Train)) return;
if (m_bDebug) Print("ObjectEnter", "");
		m_bTrainEntered = true;
		m_signal.SetCheckerWorkMode(1);
	}
	
	public void ObjectLeave(Message msg) 
	{
if (m_bDebug) Print("ObjectLeave", "name="+(cast<GameObject>(msg.src)).GetName()+",m_bTrainEntered="+m_bTrainEntered);
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
		if (msg.minor == "live://automat_on")
			SetAutomatManually(true);
		else if (msg.minor == "live://automat_off")
			SetAutomatManually(false);
		else if (msg.minor == "live://invitation_on")
			SetInvitationManually(true);
		else if (msg.minor == "live://invitation_off")
			SetInvitationManually(false);
		else if (msg.minor == "live://debug_on")
			m_bDebug = true;
		else //if (msg.minor == "live://debug_off")
			m_bDebug = false;
	}
	
    public void SetSemiautoMode(Message msg) 
    {
        if (m_bDebug) Print("SetSemiautoMode", "");
		Train train = (cast<Vehicle>(msg.src)).GetMyTrain();
        if (hasPermission(train))
        {
            setSemiAutoMode(true);
            if (m_bDebug) Print("SetSemiautoMode", "call");
        }
    }

    public void SetAutoMode(Message msg) 
    {
        if (m_bDebug) Print("SetAutoMode", "");
		Train train = (cast<Vehicle>(msg.src)).GetMyTrain();
		if (hasPermission(train))
        {
			m_TrainForAutoblock = getNextTrain();

	//Print("SetAutoMode", m_TrainForAutoblock, "");
			
            if (m_bDebug) Print("SetAutoMode", "call");
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
        m_nFreeBlocks = 0;
		m_nLensesState = -1;
		m_nJunctionToward = -1;
		setCurrentAlsFreeBlocks();
		m_bEmptyNextObject = true;
		updateLensesState(true);
        m_prevSignal = SearchNearestZmvSignal(true);
		m_signal.SetCheckerWorkMode(1);
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
    		
	void GetAlsData(Soup db)
	{
		db.SetNamedTag("MSig-als-fq", m_nAlsCode);
	}

	void getAlsProperties(Soup db)
	{		
		db.SetNamedTag("MSigSignal", 1); 
		db.SetNamedTag("MSig-type", "RC"); 
		GetAlsData(db);
	}

    public void GetProperties(Soup db)
    {
        if (m_bDebug) Print("GetProperties","");        
        GetPropertiesInt(db);
		if (!m_bSuveyor)
		{
			int privateStateEx = ZmvSignalExTypes.GetSignalEx(m_nLensesState, m_bPS);
			db.SetNamedTag("privateStateEx", privateStateEx);			
			getAlsProperties(db);
		}
    }
	
    public void SetProperties(Soup db)
    {
        if (m_bSuveyor)
		{
			bool bNewAsset = (db.GetIndexForNamedTag("autoblock") < 0);        
if (m_bDebug) Print("SetProperties","bNewAsset=" + bNewAsset);
			if (bNewAsset)
				setProprtiesFromNeighbor();
			else
				SetPropertiesInt(db);
		}
		else
		{
if (m_bDebug) Print("SetProperties","");
			SetPropertiesInt(db);			
		}
		// setCurrentAlsFreeBlocks();
		// m_bEmptyNextObject = true;
		// updateLensesState(true);
		// m_signal.SetCheckerWorkMode(m_nWaitSecProp);
        ResetSignal();
    }

    public bool IsSemiautomat() 
    {
		return m_bSemiAutomatType;
    }

	//#endregion
    //#region Init ========================================================================================
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
if (m_bDebug) Print("Init", "");
		m_bSuveyor = (World.GetCurrentModule() == World.SURVEYOR_MODULE);
        m_blockedByTrain = null;
		Soup options = config.GetNamedSoup("extensions");
        m_bDebug = options.GetNamedTagAsBool("debug-library", false);
        m_nWaitSecProp = options.GetNamedTagAsInt("sec_wait", m_nWaitSecProp);
        m_nWaitSecRedProp = options.GetNamedTagAsInt("sec_wait_red", m_nWaitSecRedProp);

        if (m_bDebug) Print("Init", "");

        m_bContainsRoutePointer = (config.GetNamedSoup("mesh-table").GetNamedSoup("default").GetNamedSoup("effects").GetNamedSoup("m11").CountTags() != 0);
        m_bSemiAutomatType = options.GetNamedTagAsBool("semiautomat", false);
        InitLenseTypes(config);
		m_prevSignal = SearchNearestZmvSignal(true);
		if (m_bSuveyor)
		{
			m_bDebug = m_bDebug or IsDebug();
			m_signal.SetDebugMode(m_bDebug);
			m_savedProperties = new ZmvProperties();
			m_savedProperties.Clear();
		}
		if (UseTrainHandlers())
			m_signal.AddObjectEnterOrLeaveHandler();
		m_bUseAlsCodes = true;
	}
	//#endregion
};

