include "zmvcommonlibrary.gs"

class ZmvGRLibrary isclass ZmvBaseLibrary
{
	int  m_nUseGG = 4;
	
	//#region Debug ===================================================================
    public void Print(string method, string s)
    {
        Interface.Print("ZmvSignalLibraryGR::"+method+":"+m_signal.GetName()+":"+s);
    }
    //#endregion 
    //#region Properties ==============================================================
	void GetPropertiesInt(Soup db)
	{
 		inherited(db);

   		db.SetNamedTag("n-use-gg", m_nUseGG);
	}

	void SetPropertiesInt(Soup db)
	{        
		int useGG = db.GetNamedTagAsInt("n-use-gg", m_nUseGG);
		if (m_bOpenedProperties and !m_bCancel)
			m_bCancel = useGG != m_nUseGG;		
		m_nUseGG = useGG;
 		inherited(db);
 	}

    void RestorePropertiesInEditor()
	{
		if (m_savedProperties.HasNamedTag("n-use-gg"))
			m_nUseGG = m_savedProperties.GetNamedTagAsInt("n-use-gg");
		inherited();
	}

    public void SetPropagatedPropertiesInEditor(Soup soup, string par, bool all) 
    {
        if (all or par == "useGG")
		{
            m_savedProperties.SetNamedTag("n-use-gg", m_nUseGG);
            m_nUseGG = soup.GetNamedTagAsInt("n-use-gg");
		}
        inherited(soup, par, all);
    }
	
    string GetUseSignalsContentForEditor(StringTable ST, string allPref)
    {
		return GetPropertyHTML(ST.GetString("signal-use-gg"), m_nUseGG, "useGG", allPref);
    }

    public string GetPropertyType(string id)
    {
        if (id[0,3] == "use") return "int";
        return inherited(id);
    }

    public string GetPropertyName(string id)
    {
        if (m_bDebug) Print("GetPropertyName","id="+id);
		if (id[0,3] == "use")
			return m_asset.GetStringTable().GetString2("param-fr", 0, MAX_FREE_BLOCKS);
		return inherited(id);
	}

	public string GetPropertyValue(string id)
	{
        if (id == "useGG") return (string)m_nUseGG;
        return inherited(id);
	}

    public void SetPropertyValue(string id, int val)
    {
if (m_bDebug) Print("SetPropertyValue", "id="+id+", val="+val);
        if (id == "useGG")  m_nUseGG = val;
        else                inherited(id, val);
    }

	string GetCurrentStateDisplayValue(StringTable ST)
	{								
		if (m_nLensesState == ZmvSignalTypes.Off)
		{
			return ST.GetString("signal-state-off");
		}
								
		if (m_nLensesState == ZmvSignalTypes.G)
		{
			return ST.GetString("signal-state-g");
		}
				
		return inherited(ST);
	}	
    //#endregion 
    //#region Main process ============================================================
	int  FixMaxFreeBlocks(int max)
	{
		if (max < m_nUseGG) return m_nUseGG;
        return max;
	}
    //#endregion    
    //#region Lenses State ============================================================
  	int  GetNewRepeaterLensesState(int nPrevLensesState)
	{
        if (nPrevLensesState == ZmvSignalTypes.G) return ZmvSignalTypes.G;
		return ZmvSignalTypes.R;
	}
	
    int  GetNewLensesStateByFreeBlocks()
    {
        if (m_nUseGG > 0 and m_nFreeBlocks >= m_nUseGG) return ZmvSignalTypes.G;
        return ZmvSignalTypes.R;
    }

    int  GetSignalStateByLensesState()
    {
        if (m_nLensesState == ZmvSignalTypes.G) return m_signal.GREEN;
        return inherited();
    }
    //#endregion
    //#region Init ====================================================================
    void InitLenseTypes(Soup config)
    {
        inherited(config);
//if (m_bDebug) Print("InitLenseTypes","");
        Soup[] effects = getEffectsConfigs(config);
        ZmvLensesData lenseCur;
        bool bG = IsLenseInConfig(effects, ZmvLenseTypes.scG);
        if (bG)
        {        
            lenseCur = new ZmvLensesData();
            lenseCur.addLense(ZmvLenseTypes.scG);
            m_lenseTypes[ZmvSignalTypes.G] = lenseCur;
            m_allLenses.addLense(ZmvLenseTypes.scG);
            if (m_bDebug) Print("InitLenseTypes","ZmvSignalTypes.G, m_allLenses.getLenses().size()="+m_allLenses.getLenses().size());
        }
    }
	
    void Init()
    {
        inherited();
    }
    //#endregion 
};
