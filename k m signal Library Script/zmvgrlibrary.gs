include "zmvcommonlibrary.gs"

class ZmvGRLibrary isclass ZmvBaseLibrary
{
	//ZmvSignalInterface m_nextSignal = null;
	//bool m_bTrainEntered, m_bTrainStopped;
	int  m_nUseGG = 4;
	
	//Debug =================================================================================================================
    public void Print(string method, string s)
    {
        Interface.Print("ZmvSignalLibraryGR::"+method+":"+m_signal.GetName()+":"+s);
    }    
    //=====================================================================================================================
	// ZmvSignalInterface SearchNearestZmvSignal()
    // {
    //     GSTrackSearch thesearch = m_signal.BeginTrackSearch(true);
	// 	object nextObject = thesearch.SearchNext();
	// 	while (nextObject)
	// 	{
	// 		if (nextObject.isclass(JunctionBase))
	// 		{
	// 			nextObject = null;
	// 			break;
	// 		}
	// 		if (nextObject.isclass(ZmvSignalInterface))
	// 		{                
    //             if (m_bDebug) Print("SearchNearestZmvSignal", "nextSignal="+ (cast<Signal>(nextObject)).GetName());
    //             if (thesearch.GetFacingRelativeToSearchDirection())
    //             {
    //                 if (m_bDebug) Print("SearchNearestZmvSignal", "OK nextSignal="+ (cast<Signal>(nextObject)).GetName());
    //                 break;
    //             }
	// 		}
    //         nextObject = thesearch.SearchNext();
	// 	}

    //     if (nextObject == me)
    //         nextObject = null;

    //     return cast<ZmvSignalInterface>(nextObject);                
    // }
	
	// void getNextProhodnoySignal()
	// {
	// 	m_nextSignal = SearchNearestZmvSignal();
	// 	if (m_nextSignal and !m_nextSignal.IsProhodnoy())
	// 		m_nextSignal = null;	
	// }
	
	// int getNextSpeedLimitForALS()
	// {
	// 	if (m_nextSignal) m_nextSpeedLimitForALS = m_nextSignal.GetSpeedLimit()/KPH_TO_MPS;
	// 	return inherited();
	// }
	
    //Properties ==========================================================================================================
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
	
    //=====================================================================================================================
    string GetUseSignalsContentForEditor(StringTable ST, string allPref)
    {
		return GetPropertyHTML(ST.GetString("signal-use-gg"), m_nUseGG, "useGG", allPref);
    }

    public string GetPropertyType(string id)
    {
        if (id == "useGG") return "int";
        return inherited(id);
    }

    public void SetPropertyValue(string id, int val)
    {
if (m_bDebug) Print("SetPropertyValue", "id="+id+", val="+val);
        if (id == "useGG")    m_nUseGG = Str.ToInt(val);
        else                  inherited(id, val);
    }
    //=====================================================================================================================
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

  	int GetNewRepeaterLensesState(int nPrevLensesState)
	{
        if (nPrevLensesState == ZmvSignalTypes.G) return ZmvSignalTypes.G;
		return ZmvSignalTypes.R;	
	}
	
    int GetNewLensesStateByFreeBlocks()
    {
        if (m_nUseGG > 0 and m_nFreeBlocks >= m_nUseGG) return ZmvSignalTypes.G;
        return ZmvSignalTypes.R;
    }

    void InitLenseTypes(Soup config)
    {        
        inherited(config);		
//if (m_bDebug or IsDebug()) Print("InitLenseTypes","");
        Soup[] effects = getEffectsConfigs(config);        
        ZmvLensesData lenseCur;
        bool bG  = IsLenseInConfig(effects, ZmvLenseTypes.scG);
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
};
