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
    void RestorePropertiesInEditor()
	{
		if (m_savedProperties.HasNamedTag("n-use-w"))
			m_nUseW = m_savedProperties.GetNamedTagAsInt("n-use-w");
		inherited();
        m_bAutoblockProp = m_bAutoblockCurrent = true;
	}

    public void SetPropagatedPropertiesInEditor(Soup soup, string par, bool all) 
    {
        if (m_bDebug) Print("SetPropagatedPropertiesInEditor","par="+par);
        if (all or par == "useW")
		{
            m_savedProperties.SetNamedTag("n-use-w", m_nUseW);
            m_nUseW = soup.GetNamedTagAsInt("n-use-w");
		}
        inherited(soup, par, all);
		if (all or par == "mode")
		{
			m_bAutoblockProp = m_bAutoblockCurrent = true;
		}
		if (all or par == "useCodes")
		{
			m_bUseAlsCodes = m_bUseAlsCodes and !m_bDepo;
		}        
    }
	//#endregion
	//#region ALS  ==============================================================================
// 	void GetAlsData(Soup db)
// 	{
// if (m_bDebug) Print("GetAlsData", "m_bDepo="+m_bDepo);
// 		if (m_bDepo)
// 		{
// 			db.SetNamedTag("MSig-als-fq", ZmvAls.ALS_OC);
// 		}
// 		else
// 		{
// 			inherited(db);
// 		}
// 	}	
	//#endregion
	//#region Editor HTML =======================================================================
    string GetAlsCodesContent(StringTable ST) 
	{
        m_bAutoblockProp = m_bAutoblockCurrent = true;
if (m_bDebug) Print("GetAlsCodesContent", "m_bDepo="+m_bDepo);
		if (m_bDepo) return "";
        return inherited(ST);
	}
    
    string GetCurrentStateDisplayValue(StringTable ST)
	{
		if (m_nLensesState == ZmvSignalTypes.W) return ST.GetString("signal-state-w");
		return inherited(ST);
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
    //#region Main process ======================================================================
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
	int  GetCurrentSpeedLimitByLensesState()
	{
		if (m_nLensesState != ZmvSignalTypes.R) return 20;		
        return inherited();
	}

	int  GetNewRepeaterLensesState(int nPrevLensesState)
	{
		if (nPrevLensesState < 0 or nPrevLensesState == ZmvSignalTypes.R or 
            nPrevLensesState == ZmvSignalTypes.RY) return ZmvSignalTypes.R;
		return ZmvSignalTypes.W;
	}
	
	bool ShouldShowAutoblockLenses()
	{
		return true;
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
   		m_bUseAlsCodes = !m_bDepo;

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
	//#region  Properties =======================================================================
    void RestorePropertiesInEditor()
	{
		if (m_savedProperties.HasNamedTag("n-use-ww"))
			m_nUseWW = m_savedProperties.GetNamedTagAsInt("n-use-ww");
		inherited();
	}

    public void SetPropagatedPropertiesInEditor(Soup soup, string par, bool all) 
    {
        if (m_bDebug) Print("SetPropagatedPropertiesInEditor","par="+par);
        if (all or par == "useWW")
		{
            m_savedProperties.SetNamedTag("n-use-ww", m_nUseWW);
            m_nUseWW = soup.GetNamedTagAsInt("n-use-ww");
		}
        inherited(soup, par, all);
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