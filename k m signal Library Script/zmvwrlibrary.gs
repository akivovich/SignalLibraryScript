include "zmvcommonlibrary.gs"

class ZmvWRLibrary isclass ZmvBaseLibrary
{
    bool m_bDepo;
    int  m_nUseW = 1;
	
	//Debug =================================================================================================================
    public void Print(string method, string s)
    {
        Interface.Print("ZmvSignalLibraryWR::"+method+":"+m_signal.GetName()+":"+s);
    }    

    public void SetPropagatedPropertiesInEditor(Soup soup, string par, bool all) 
    {
        if (m_bDebug) Print("SetPropagatedPropertiesInEditor","par="+par);

//         if (all or par == "speedLimitW")  
// 		{
//             m_savedProperties.SetNamedTag("speed-w", m_speedLimits[ZmvSignalTypes.W]);
//             m_speedLimits[ZmvSignalTypes.W] = m_speedLimits[ZmvSignalTypes.WW] = soup.GetNamedTagAsInt("speed-w", m_speedLimits[ZmvSignalTypes.W]); 
// //Interface.Print("SetPropagatedPropertiesInEditor:m_speedLimits[ZmvSignalTypes.W]="+m_speedLimits[ZmvSignalTypes.W]);
			
// 		}
        inherited(soup, par, all);
    }    
	//=====================================================================================================================
	bool UseAlsFrequencies()
	{
		return !m_bDepo;
	}
    //=====================================================================================================================	
	string GetCurrentStateDisplayValue(StringTable ST)
	{
		if (m_nLensesState == ZmvSignalTypes.W)
		{
			return ST.GetString("signal-state-w");
		}
				
		return inherited(ST);
	}	
	//=====================================================================================================================
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
	//=====================================================================================================================    
	public bool IsShuntMode() 
	{ 
		return true;
	}
	
	int  GetCurrentSpeedLimit()
	{
		if (m_bPS) return 20;
		if (UseAlsFrequencies()) return inherited();
		if (m_nLensesState != ZmvSignalTypes.R) return 20;
		return 0;
	}

	int GetNewRepeaterLensesState(int nPrevLensesState)
	{
		if (nPrevLensesState < 0 or nPrevLensesState == ZmvSignalTypes.R or nPrevLensesState == ZmvSignalTypes.RY) return ZmvSignalTypes.R;
		return ZmvSignalTypes.W;
	}
	
    int GetNewLensesStateByFreeBlocks()
    {
        if (m_nUseW > 0 and m_nFreeBlocks >= m_nUseW) return ZmvSignalTypes.W;
        return ZmvSignalTypes.R;
    }

    // int processNewLensesState(object nextObject)
    // {
    //     int newState = inherited(nextObject);
	// 	//if (m_bDepo)	m_nextSpeedLimitForALS = 20;
	// 	return newState;
    // }
    
    int GetSignalStateByLensesState()
    {
        if (m_nLensesState ==  ZmvSignalTypes.W) 
		{
            if (m_bDebug) Print("GetSignalStateByLensesState","YELLOW");		
			return m_signal.YELLOW;
		}
        
        return inherited();
    }
    //=====================================================================================================================
	public void Init(ZmvSignalInterface signal, Soup config)
    {
        inherited(signal, config);
		Soup options = config.GetNamedSoup("extensions");
		m_bDepo = options.GetNamedTagAsBool("depo", false);
//Interface.Print("Init:depo="+m_bDepo);
    } 
};
//=====================================================================================================================
class ZmvWRWLibrary isclass ZmvWRLibrary
{
    bool m_bMain; //is Main Path type
    int  m_nUseWW = 1;
	
	//Debug =================================================================================================================
    public void Print(string method, string s)
    {
        Interface.Print("ZmvSignalLibraryWRW::"+method+":"+m_signal.GetName()+":"+s);
    }    
    
	string GetCurrentStateDisplayValue(StringTable ST)
	{
		if (m_nLensesState == ZmvSignalTypes.WW)
		{
			return ST.GetString("signal-state-ww");
		}				
		return inherited(ST);
	}	
	
    int GetSignalStateByLensesState()
    {
        if (m_nLensesState ==  ZmvSignalTypes.WW) return m_signal.YELLOW;        
        return inherited();
    }
	
	int GetNewRepeaterLensesState(int nPrevLensesState)
	{
		if (nPrevLensesState == ZmvSignalTypes.WW) return ZmvSignalTypes.WW;
		return inherited(nPrevLensesState);
	}
	
    int GetNewLensesStateByFreeBlocks()
    {
        if (m_bMain and m_nUseWW > 0 and m_nFreeBlocks >= m_nUseWW) return ZmvSignalTypes.WW;
        if (m_nUseW and m_nFreeBlocks >= m_nUseW) return ZmvSignalTypes.W;
        return ZmvSignalTypes.R;
    }

    // int processNewLensesState(object nextObject)
    // {
	// 	m_bMain = false;
	// 	if (nextObject != null and !nextObject.isclass(Vehicle))
	// 	{
	// 		m_bNextVehicle = false;
	// 		if (m_bDebug) Print("$$processNewLensesState$$","nextObject.isclass(ZmvSignalInterface)="+(string)nextObject.isclass(ZmvSignalInterface));

	// 		if (m_bRepeater and !m_bSemiAutoCurrent and nextObject.isclass(ZmvSignalInterface))
	// 		{
	// 			ZmvSignalInterface signal = cast<ZmvSignalInterface>(nextObject);
	// 			return GetNewRepeaterLensesState(signal.GetSignalState());
	// 		}

    //         // if (m_nextMarker == null)
    //         //     m_nextMarker = getNextMarker(nextObject);
    //         if (m_nextMarker != null)
	// 		{
    //             m_bMain = m_nextMarker.IsMain();
	// 			if (m_bDebug) Print("processNewLensesState","m_bMain="+m_bMain);
	// 		}
    //     }

    //     return inherited(nextObject);
    // }
	
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
};