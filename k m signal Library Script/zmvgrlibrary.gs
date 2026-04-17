include "zmvcommonlibrary.gs"

class ZmvGRLibrary isclass ZmvBaseLibrary
{
	//ZmvSignalInterface m_nextSignal = null;
	//bool m_bTrainEntered, m_bTrainStopped;
	int  nUseGG = 4;
	
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

   		db.SetNamedTag("n-use-gg", nUseGG);
		// db.SetNamedTag("speed-y", m_speedLimits[ZmvSignalTypes.Y]); 
		// db.SetNamedTag("speed-g", m_speedLimits[ZmvSignalTypes.G]); 
	}

	void SetPropertiesInt(Soup db)
	{        
		// int limY = db.GetNamedTagAsInt("speed-y", m_speedLimits[ZmvSignalTypes.Y]);
		// int limG = db.GetNamedTagAsInt("speed-g", m_speedLimits[ZmvSignalTypes.G]);
		int useGG = db.GetNamedTagAsInt("n-use-gg", nUseGG);
		if (m_bOpenedProperties and !m_bCancel)
//			m_bCancel = (useGG != nUseGG or m_speedLimits[ZmvSignalTypes.Y] != limY or m_speedLimits[ZmvSignalTypes.G] != limG);
			m_bCancel = useGG != nUseGG;
		
		nUseGG = useGG;
		// m_speedLimits[ZmvSignalTypes.Y] = limY;
		// m_speedLimits[ZmvSignalTypes.G] = limG;

 		inherited(db);
		
		// if (m_signal.IsProhodnoy() and !m_bSuveyor) 
		// {
		// 	getNextProhodnoySignal();
		// 	if (m_nextSignal) m_signal.AddObjectEnterOrLeaveHandler();
		// } 
 	}

    void RestorePropertiesInEditor()
	{
        // if (m_bDebug) Print("RestorePropertiesInEditor","");
		// if (m_savedProperties.HasNamedTag("speed-y"))
		// 	m_speedLimits[ZmvSignalTypes.Y] = m_savedProperties.GetNamedTagAsInt("speed-y");
		// if (m_savedProperties.HasNamedTag("speed-g"))
		// 	m_speedLimits[ZmvSignalTypes.G] = m_savedProperties.GetNamedTagAsInt("speed-g");
		
		inherited();
	}

    public void SetPropagatedPropertiesInEditor(Soup soup, string par, bool all) 
    {
        if (m_bDebug) Print("SetPropagatedPropertiesInEditor","par="+par);

        // if (all or par == "speedLimitY")       
		// {
        //     m_savedProperties.SetNamedTag("speed-y", m_speedLimits[ZmvSignalTypes.Y]);
		// 	m_speedLimits[ZmvSignalTypes.Y] = soup.GetNamedTagAsInt("speed-y"); 
		// }
        // if (all or par == "speedLimitG")  
		// {
        //     m_savedProperties.SetNamedTag("speed-g", m_speedLimits[ZmvSignalTypes.G]);
        //     m_speedLimits[ZmvSignalTypes.G] = soup.GetNamedTagAsInt("speed-g"); 
		// }
        inherited(soup, par, all);
    }
	
    //=====================================================================================================================
    string getSpeedLimitsContent(StringTable ST) 
    {
        // string title = ST.GetString("signal-speed-limit");
		// return GetPropertyHTML(ST.GetString("signal-speed-limit-g"), m_speedLimits[ZmvSignalTypes.G], "speedLimitG", title);
		return "";
    }
    public string GetPropertyType(string id)
    {
        if (id == "speedLimitG")
            return "int";

        return inherited(id);
    }
	
    public void SetPropertyValue(string id, int val)
    {        
        // if (id == "speedLimitG")   m_speedLimits[ZmvSignalTypes.G] = Str.ToInt(val);
        // else inherited(id, val);
		inherited(id, val);
    }
    //=====================================================================================================================	
  	int GetNewRepeaterLensesState(int nPrevLensesState)
	{
        if (nPrevLensesState == ZmvSignalTypes.G) return ZmvSignalTypes.G;
		return ZmvSignalTypes.R;	
	}
	
    int GetNewLensesStateByFreeBlocks()
    {
        if (nUseGG > 0 and m_nFreeBlocks >= nUseGG) return ZmvSignalTypes.G;
        return ZmvSignalTypes.R;
    }

    void InitLenseTypes(Soup config)
    {        
        inherited(config);
		
		if (m_bDebug) Print("InitLenseTypes","");

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
	
	bool UseChecker()
	{
		return inherited() or 
			   (m_signal.IsProhodnoy() and m_nFreeBlocks < m_nMaxFreeBlocks); //!!!!!!!!!!!!!!
	}
	
	// int processNewLensesState(object nextObject)
	// {
	// 	int state = inherited(nextObject);
		
	// 	if (m_bTrainEntered or (m_signal.IsProhodnoy() and m_nextSignal and m_signal.GetSignalState() and m_nextSignal.GetSignalState()))
	// 	{
	// 		bool useChecker = UseChecker(state);
	// 		//Print("UseChecker",useChecker);
	// 		if (!useChecker)
	// 		{
	// 			m_signal.SetCheckerWorkMode(false);
	// 			//Print("SetCheckerWorkMode","false");
	// 		}
	// 	}
	// 	return state;
	// }
	
    void Init()
    {
        inherited();
    }
};
