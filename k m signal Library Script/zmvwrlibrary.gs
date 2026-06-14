include "zmvcommonlibrary.gs"

//#region ZmvBaseWRLibrary ==========================================================================
class ZmvBaseWRLibrary isclass ZmvBaseLibrary
{
	//#region State =============================================================================
    bool m_bDepo;
	//#endregion
	//#region  Debug ============================================================================
    public void Print(string method, string s)
    {
        Interface.Print("ZmvBaseWRLibrary::"+method+":"+m_signal.GetName()+":"+s);
    }    
	//#endregion
	//#region  Properties =======================================================================
    void RestorePropertiesInEditor()
	{
		inherited();
        m_bAutoblockProp = m_bAutoblockCurrent = true;
	}

    public void SetPropagatedPropertiesInEditor(Soup soup, string par, bool all) 
    {
        if (m_bDebug) Print("SetPropagatedPropertiesInEditor","par="+par);
        inherited(soup, par, all);
		if (all or par == "mode")
		{
			m_bAutoblockProp = m_bAutoblockCurrent = true;
		}
		if (all or par == "useCodes")
		{
			m_bUseAlsCodes = m_bUseAlsCodes and !m_bDepo;
		}
		if (m_bUseAlsCodes)
		{
			if (all or par == "fr0")
			{
                m_nFr0 = 0;
				m_savedProperties.SetNamedTag("Fr0", m_nFr0);
			}
			if (all or par == "fr40")
			{
				m_savedProperties.SetNamedTag("Fr40", m_nFr40); 
				m_nFr40 = soup.GetNamedTagAsInt("Fr40");
			}
			if (all or par == "fr60")
			{
				m_nFr60 = 0;
				m_savedProperties.SetNamedTag("Fr60", m_nFr60); 
			}
			if (all or par == "fr70")
			{
				m_nFr70 = 0;
				m_savedProperties.SetNamedTag("Fr70", m_nFr70); 
			}
			if (all or par == "fr80")
			{
				m_nFr80 = 0;
				m_savedProperties.SetNamedTag("Fr80", m_nFr80);
			}
		}
    }

    void SetPropertiesInt(Soup db)
    {
        inherited(db);
		m_bAutoblockProp = m_bAutoblockCurrent = true;
		m_bUseAlsCodes = m_bUseAlsCodes and !m_bDepo;
        m_nFr0 = m_nFr60 = m_nFr70 = m_nFr80 = 0;
        if (m_bDebug) Print("SetPropertiesInt", "m_bAutoblockProp="+m_bAutoblockProp+",m_bUseAlsCodes="+m_bUseAlsCodes);
    }

	//#endregion
	//#region Editor HTML =======================================================================
    string GetAlsCodesContentInt(StringTable ST)
    {
		return GetPropertyHTML("40", (string)m_nFr40, "Fr40", "fr40");				  
    }

    string GetAlsCodesContent(StringTable ST) 
	{
        m_bAutoblockProp = m_bAutoblockCurrent = true;
        if (m_bDebug) Print("GetAlsCodesContent", "m_bDepo="+m_bDepo);
		if (m_bDepo) return "";
        return inherited(ST);
	}
    
	string GetModeContentForEditor(StringTable ST)
    {
        string repeater = getModeString(ST, m_bRepeater),
               title = ST.GetString("signal-modes-title"),
               res = GetPropertyTitleHTML(title) +
                     GetPropertyHTML(ST.GetString("signal-repeater"), repeater, "repeater", "title");

        if (!m_bRepeater)
        {
            string modeSemiauto = getModeString(ST, m_bSemiAutoProp);
            res = res + GetPropertyHTML(ST.GetString("signal-semiautomath"), modeSemiauto, "semiautomat", "");    
        }

        return res;
    }

    public string GetPropertyName(string id)
    {
        if (m_bDebug) Print("GetPropertyName","id="+id);
		if (id[0,3] == "use")
			return m_asset.GetStringTable().GetString2("param-fr", 0, MAX_FREE_BLOCKS);
		return inherited(id);
	}
	//#endregion
    //#region Main process ======================================================================
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
	
	bool ShouldShowAutoblockLenses(int nLensesState)
	{
		return true;
	}

    int  GetSignalStateByLensesState()
    {
        if (m_nLensesState != ZmvSignalTypes.R)
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
        if (m_bDebug) Print("Init::ZmvBaseWRLibrary", "m_bCanUseSemiRY="+m_bCanUseSemiRY);
		Soup options = config.GetNamedSoup("extensions");
		m_bDepo = options.GetNamedTagAsBool("depo", false);
   		m_bUseAlsCodes = !m_bDepo;
        if (m_bDebug) Print("Init", "depo="+m_bDepo+",m_bUseAlsCodes="+m_bUseAlsCodes);
        m_nFr0 = m_nCurFr60 = m_nCurFr70 = m_nCurFr80 = 0;
        m_nFr40 = 1;
    } 
	//#endregion
};
//#endregion
//#region ZmvWRLibrary ==========================================================================
class ZmvWRLibrary isclass ZmvBaseWRLibrary
{
	//#region State =============================================================================
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
    }
	//#endregion
	//#region Editor HTML =======================================================================    
    string GetCurrentStateDisplayValue(StringTable ST)
	{
		if (m_nLensesState == ZmvSignalTypes.W) return ST.GetString("signal-state-w");
		return inherited(ST);
	}	

    string GetUseSignalsContentForEditor(StringTable ST, string allPref)
    {
        return  getUseSemiRYContentForEditor(ST, allPref) +
                inherited(ST, allPref) +
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
    int  CalcFreeBlocks() //mute
    {
        int freeBlocks = 0;
        if (m_bSemiAutoCurrent and m_bUseSemiRY) 
        {
            if (!m_bNextVehicle and !m_bEnteredTrainStopped) freeBlocks = 1;
        }
        else 
        {
            freeBlocks = inherited();
        }
		if (m_bDebug) Print("CalcFreeBlocks", "m_bNextVehicle="+m_bNextVehicle+"m_bEnteredTrainStopped="+m_bEnteredTrainStopped+",m_bSemiAutoCurrent="+m_bSemiAutoCurrent+",m_bUseSemiRY="+m_bUseSemiRY+",freeBlocks="+freeBlocks);

        return freeBlocks;
    }
	
    int  FixMaxFreeBlocks(int max)
	{
        int res = inherited(max);
        if (res < m_nUseW) res = m_nUseW;
        return res;
	}
	//#endregion
	//#region Lenses state ======================================================================	
    int  GetNewLensesStateByFreeBlocks()
    {
        if (m_nUseW > 0 and m_nFreeBlocks >= m_nUseW) return ZmvSignalTypes.W;
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
        bool bY = IsLenseInConfig(effects, ZmvLenseTypes.scY);
        if (bY)
        {        
            lenseCur = new ZmvLensesData();
            lenseCur.addLense(ZmvLenseTypes.scR);
            lenseCur.addLense(ZmvLenseTypes.scY);
            m_lenseTypes[ZmvSignalTypes.RY] = lenseCur;
            m_allLenses.addLense(ZmvLenseTypes.scY);
            if (m_bDebug) Print("InitLenseTypes","ZmvSignalTypes.RY, m_allLenses.getLenses().size()="+m_allLenses.getLenses().size());
        }
    }

	public void Init(ZmvSignalInterface signal, Soup config)
    {
        inherited(signal, config);
        if (m_bDebug) Print("Init::ZmvWRLibrary", "m_bCanUseSemiRY="+m_bCanUseSemiRY);
        m_nUseW = 1;
//Interface.Print("Init:depo="+m_bDepo);
    } 
	//#endregion
};
//#endregion
//#region ZmvYRLibrary ==========================================================================
class ZmvYRLibrary isclass ZmvBaseWRLibrary
{
    int  m_nUseYf = 1;
	//#region Debug ==============================================================================
    public void Print(string method, string s)
    {
        Interface.Print("ZmvSignalLibraryYR::"+method+":"+m_signal.GetName()+":"+s);
    }    
	//#endregion
    //#region Main process =============================================================
	int  FixMaxFreeBlocks(int max)
	{
        int res = inherited(max);
        if (res < m_nUseYf) res = m_nUseYf;
        return res;
	}
	//#endregion
	//#region  Properties =======================================================================
    void RestorePropertiesInEditor()
	{
		if (m_savedProperties.HasNamedTag("n-use-yf"))
			m_nUseYf = m_savedProperties.GetNamedTagAsInt("n-use-yf");
		inherited();
	}

    public void SetPropagatedPropertiesInEditor(Soup soup, string par, bool all)
    {
        if (m_bDebug) Print("SetPropagatedPropertiesInEditor","par="+par);
        if (all or par == "useYf")
		{
            m_savedProperties.SetNamedTag("n-use-yf", m_nUseYf);
            m_nUseYf = soup.GetNamedTagAsInt("n-use-yf");
		}
        inherited(soup, par, all);
    }    
	//#endregion
	//#region Editor HTML =======================================================================
    string GetUseSignalsContentForEditor(StringTable ST, string allPref)
    {
        return  inherited(ST, allPref) +
				GetPropertyHTML(ST.GetString("signal-use-yf"), m_nUseYf, "useYf", allPref);
    }

    public string GetPropertyType(string id)
    {
        if (id == "useYf") return "int";
        return inherited(id);
    }

    public string GetPropertyValue(string id)
    {
        if (m_bDebug) Print("GetPropertyValue", "id="+id);
        if (id == "useYf")    return (string)m_nUseYf;
        return inherited(id);
    }

    public void SetPropertyValue(string id, int val)
    {
        if (m_bDebug) Print("SetPropertyValue", "id="+id+",val="+val);
        else if (id == "useYf")  m_nUseYf = val;
        else                     inherited(id, val);
    }
	//#endregion
	//#region Lenses state========================================================================    
	string GetCurrentStateDisplayValue(StringTable ST)
	{
		if (m_nLensesState == ZmvSignalTypes.Yf)
		{
			return ST.GetString("signal-state-y") + ST.GetString("signal-state-blink");
		}				
		return inherited(ST);
	}	
	
    int  GetSignalStateByLensesState()
    {
        if (m_nLensesState ==  ZmvSignalTypes.Yf) return m_signal.YELLOW;        
        return inherited();
    }
	
    int  GetNewLensesStateByFreeBlocks()
    {
        if (m_nUseYf > 0 and m_nFreeBlocks >= m_nUseYf) return ZmvSignalTypes.Yf;
        return inherited();
    }
	//#endregion
	//#region Init ==============================================================================
    void InitLenseTypes(Soup config)
    {        
        inherited(config);
		if (m_bDebug) Print("InitLenseTypes","");

        Soup[] effects = getEffectsConfigs(config);        
        ZmvLensesData lenseCur;
        bool bYf = IsLenseInConfig(effects, ZmvLenseTypes.scYf);
        if (bYf)
        {        
            lenseCur = new ZmvLensesData();
            lenseCur.addLense(ZmvLenseTypes.scYf);
            m_lenseTypes[ZmvSignalTypes.Yf] = lenseCur;
            m_allLenses.addLense(ZmvLenseTypes.scYf);
            if (m_bDebug) Print("InitLenseTypes","ZmvSignalTypes.Yf, m_allLenses.getLenses().size()="+m_allLenses.getLenses().size());
        }
    }

	public void Init(ZmvSignalInterface signal, Soup config)
    {
        inherited(signal, config);
        m_nUseYf = 1;
//Interface.Print("Init:depo="+m_bDepo);
    } 
	//#endregion
};
//#endregion
//#region ZmvWRWLibrary =========================================================================
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
//#endregion
