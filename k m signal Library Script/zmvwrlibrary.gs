include "zmvcommonlibrary.gs"

class ZmvWRLibrary isclass ZmvBaseLibrary
{
	//#region State =============================================================================
    bool m_bDepo;
    int  m_nUseW = 1;
	//#endregion
	//#region  Debug ============================================================================
    public void Print(string method, string s)
    {
        Interface.Print("ZmvSignalLibraryWR::"+method+":"+m_signal.GetName()+":"+s);
    }    
	//#endregion
	//#region  Properties =======================================================================
    public void SetPropagatedPropertiesInEditor(Soup soup, string par, bool all) 
    {
        if (m_bDebug) Print("SetPropagatedPropertiesInEditor","par="+par);
        inherited(soup, par, all);
    }    
	//#endregion
	//#region ALS  ==============================================================================
	bool UseAlsFrequencies()
	{
		return !m_bDepo;
	}

	void GetAlsData(Soup db)
	{
//Print("GetAlsData", "m_bDepo="+m_bDepo+",m_speedLimits[ZmvSignalTypes.W]="+m_speedLimits[ZmvSignalTypes.W]);
		if (m_bDepo)
		{
			db.SetNamedTag("MSig-als-fq", ZmvAls.ALS_OC);
//Print("GetAlsData1:", db.GetNamedTagAsInt("MSig-als-fq")+","+db.GetNamedTagAsInt("MSig-als-fq-next")+","+db.GetNamedTagAsBool("MSig-als-fq-rs"));
		}
		else
		{
			inherited(db);
		}
	}	
	//#endregion
	//#region Editor HTML =======================================================================
	string GetCurrentStateDisplayValue(StringTable ST)
	{
		if (m_nLensesState == ZmvSignalTypes.W) return ST.GetString("signal-state-w");
		return inherited(ST);
	}	

	public string GetPropertyTitleHTML(string title)
	{
		return inherited(title);
	}
	
	string GetModeContentForEditor(StringTable ST)
    {
        string repeater     = getModeString(ST, m_bRepeater),
			   modeSemiauto = getModeString(ST, m_bSemiAutoProp),
               title = ST.GetString("signal-modes-title"),
			   res = GetPropertyTitleHTML(title);
                
        res = res + GetPropertyHTML(ST.GetString("signal-semiautomath"), modeSemiauto, "semiautomat", "");
		res = res + GetPropertyHTML(ST.GetString("signal-repeater"), repeater, "repeater", "title");
        return res;
    }

    string GetUseSignalsContentForEditor(StringTable ST, string allPref)
    {
        return  inherited(ST, allPref) +
				GetPropertyHTML(ST.GetString("signal-use-w"), m_nUseW, "useW", allPref);
    }

    public string GetPropertyType(string id)
    {
        if (id == "useW") return "int";
        return inherited(id);
    }

    public string GetPropertyValue(string id)
    {
        if (m_bDebug) Print("GetPropertyValue", "id="+id);
        if (id == "useW")    return (string)m_nUseW;
        return inherited(id);
    }

    public void SetPropertyValue(string id, int val)
    {
        if (m_bDebug) Print("SetPropertyValue", "id="+id+",val="+val);
        else if (id == "useW")  m_nUseW = val;
        else                    inherited(id, val);
    }
	//#endregion
    //#region Main process =============================================================
	int  FixMaxFreeBlocks(int max)
	{
        int res = inherited(max);
        if (res < m_nUseW) res = m_nUseW;
        return res;
	}

	public bool IsShuntMode() 
	{ 
		return true;
	}
	//#endregion
	//#region Lenses state ======================================================================	
	int  GetCurrentSpeedLimit()
	{
		if (m_bPS) return 20;
		if (UseAlsFrequencies()) return inherited();
		if (m_nLensesState != ZmvSignalTypes.R) return 20;
		return 0;
	}

	int  GetNewRepeaterLensesState(int nPrevLensesState)
	{
		if (nPrevLensesState < 0 or nPrevLensesState == ZmvSignalTypes.R or nPrevLensesState == ZmvSignalTypes.RY) return ZmvSignalTypes.R;
		return ZmvSignalTypes.W;
	}
	
    int  GetNewLensesStateByFreeBlocks()
    {
        if (m_nUseW > 0 and m_nFreeBlocks >= m_nUseW) return ZmvSignalTypes.W;
        return ZmvSignalTypes.R;
    }

    int  GetSignalStateByLensesState()
    {
        if (m_nLensesState ==  ZmvSignalTypes.W) 
		{
            if (m_bDebug) Print("GetSignalStateByLensesState","YELLOW");		
			return m_signal.YELLOW;
		}
        
        return inherited();
    }
	//#endregion
	//#region Init ==============================================================================
	public void Init(ZmvSignalInterface signal, Soup config)
    {
        inherited(signal, config);
		Soup options = config.GetNamedSoup("extensions");
		m_bDepo = options.GetNamedTagAsBool("depo", false);
//Interface.Print("Init:depo="+m_bDepo);
    } 
	//#endregion
};
//================================================================================================
class ZmvWRWLibrary isclass ZmvWRLibrary
{
	//#region State ==============================================================================
    bool m_bMain; //is Main Path type
    int  m_nUseWW = 1;
	//#endregion
	//#region Debug ==============================================================================
    public void Print(string method, string s)
    {
        Interface.Print("ZmvSignalLibraryWRW::"+method+":"+m_signal.GetName()+":"+s);
    }    
	//#endregion
    //#region Main process =============================================================
	int  FixMaxFreeBlocks(int max)
	{
        int res = inherited(max);
        if (res < m_nUseWW) res = m_nUseWW;
        return res;
	}
	//#endregion
	//#region Editor HTML =======================================================================
    string GetUseSignalsContentForEditor(StringTable ST, string allPref)
    {
        return  inherited(ST, allPref) +
				GetPropertyHTML(ST.GetString("signal-use-ww"), m_nUseWW, "useWw", allPref);
    }

    public string GetPropertyType(string id)
    {
        if (id == "useWw") return "int";
        return inherited(id);
    }

    public string GetPropertyValue(string id)
    {
        if (m_bDebug) Print("GetPropertyValue", "id="+id);
        if (id == "useWw")    return (string)m_nUseWW;
        return inherited(id);
    }

    public void SetPropertyValue(string id, int val)
    {
        if (m_bDebug) Print("SetPropertyValue", "id="+id+",val="+val);
        else if (id == "useWw")  m_nUseWW = val;
        else                     inherited(id, val);
    }
	//#endregion
	//#region Lenses state========================================================================    
	string GetCurrentStateDisplayValue(StringTable ST)
	{
		if (m_nLensesState == ZmvSignalTypes.WW)
		{
			return ST.GetString("signal-state-ww");
		}				
		return inherited(ST);
	}	
	
    int  GetSignalStateByLensesState()
    {
        if (m_nLensesState ==  ZmvSignalTypes.WW) return m_signal.YELLOW;        
        return inherited();
    }
	
	int  GetNewRepeaterLensesState(int nPrevLensesState)
	{
		if (nPrevLensesState == ZmvSignalTypes.WW) return ZmvSignalTypes.WW;
		return inherited(nPrevLensesState);
	}
	
    int  GetNewLensesStateByFreeBlocks()
    {
        if (m_bMain and m_nUseWW > 0 and m_nFreeBlocks >= m_nUseWW) return ZmvSignalTypes.WW;
        if (m_nUseW and m_nFreeBlocks >= m_nUseW) return ZmvSignalTypes.W;
        return ZmvSignalTypes.R;
    }
	//#endregion
	//#region Init ==============================================================================    	
    void InitLenseTypes(Soup config)
    {        
        inherited(config);
		if (m_bDebug) Print("InitLenseTypes","");

        Soup[] effects = getEffectsConfigs(config);
        
        ZmvLensesData lenseCur;
        bool bW  = IsLenseInConfig(effects, ZmvLenseTypes.scW), 
             bWW = IsLenseInConfig(effects, ZmvLenseTypes.scWW);

        if (bW and bWW)
        {        
            lenseCur = new ZmvLensesData();
            lenseCur.addLense(ZmvLenseTypes.scW);
            lenseCur.addLense(ZmvLenseTypes.scWW);
            m_lenseTypes[ZmvSignalTypes.WW] = lenseCur;
            m_allLenses.addLense(ZmvLenseTypes.scWW);
            if (m_bDebug) Print("InitLenseTypes","ZmvSignalTypes.WW, m_allLenses.getLenses().size()="+m_allLenses.getLenses().size());
        }
    }
	//#endregion
};