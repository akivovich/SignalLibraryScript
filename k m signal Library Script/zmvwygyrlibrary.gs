include "zmvygrlibrary.gs"

class ZmvWYGYRLibrary isclass ZmvYGRLibrary
{
    int   nUseYfY, nUseYY, nUseW;
	bool  useSemiRY;
	bool  m_bTrainStopped;
	Train m_enteredTrain;
    
    //Debug =================================================================================================================
    public void Print(string method, string s)
    {
        Interface.Print("ZmvSignalLibraryWYGYR::"+method+":"+m_signal.GetName()+":"+s);
    }    
    //Properties ==========================================================================================================
	void GetPropertiesInt(Soup db)
	{
 		inherited(db);

		db.SetNamedTag("n-use-yfy", nUseYfY);
		db.SetNamedTag("n-use-yy", nUseYY);
		db.SetNamedTag("n-use-w", nUseW);
		db.SetNamedTag("use-semi-ry", useSemiRY); 

        // db.SetNamedTag("speed-w", m_speedLimits[ZmvSignalTypes.W]); 
		// db.SetNamedTag("speed-yy", m_speedLimits[ZmvSignalTypes.YY]); 
		// db.SetNamedTag("speed-yfy", m_speedLimits[ZmvSignalTypes.YfY]); 
	}

	void SetPropertiesInt(Soup db)
	{		
		useSemiRY = db.GetNamedTagAsBool("use-semi-ry", false);
		
		int useYfY = db.GetNamedTagAsInt("n-use-yfy", nUseYfY);
		int useYY  = db.GetNamedTagAsInt("n-use-yy",  nUseYY);
		int useW   = db.GetNamedTagAsInt("n-use-w",   nUseW);
		// int limYY = db.GetNamedTagAsFloat("speed-yy", m_speedLimits[ZmvSignalTypes.YY]),
		// 	limYfY = db.GetNamedTagAsFloat("speed-yfy", m_speedLimits[ZmvSignalTypes.YfY]),
		// 	limW = db.GetNamedTagAsFloat("speed-w", m_speedLimits[ZmvSignalTypes.W]);

		if (m_bOpenedProperties and !m_bCancel)
			m_bCancel = nUseYfY != useYfY or nUseYY != useYY or nUseW != useW; // or m_speedLimits[ZmvSignalTypes.YY] != limYY or m_speedLimits[ZmvSignalTypes.YfY] != limYfY or m_speedLimits[ZmvSignalTypes.W] != limW);

		nUseYfY = useYfY;
		nUseYY  = useYY;
		nUseW   = useW;
        // m_speedLimits[ZmvSignalTypes.YY] = limYY;
        // m_speedLimits[ZmvSignalTypes.YfY] = limYfY;
        // m_speedLimits[ZmvSignalTypes.W] = limW;
		
		//if (useSemiRY) m_signal.AddObjectEnterOrLeaveHandler();
		
 		inherited(db);
 	}

    void RestorePropertiesInEditor()
	{
        if (m_bDebug) Print("RestorePropertiesInEditor","");
		// if (m_savedProperties.HasNamedTag("speed-yy"))
		// 	m_speedLimits[ZmvSignalTypes.YY] = m_savedProperties.GetNamedTagAsInt("speed-yy");
		// if (m_savedProperties.HasNamedTag("speed-yfy"))
		// 	m_speedLimits[ZmvSignalTypes.YfY] = m_savedProperties.GetNamedTagAsInt("speed-yfy");
		// if (m_savedProperties.HasNamedTag("speed-w"))
		// 	m_speedLimits[ZmvSignalTypes.W] = m_savedProperties.GetNamedTagAsInt("speed-w");
		if (m_savedProperties.HasNamedTag("n-use-yfy"))
			nUseYfY = m_savedProperties.GetNamedTagAsInt("n-use-yfy");
		if (m_savedProperties.HasNamedTag("n-use-yy"))
			nUseYY = m_savedProperties.GetNamedTagAsInt("n-use-yy");
		if (m_savedProperties.HasNamedTag("n-use-w"))
			nUseW = m_savedProperties.GetNamedTagAsInt("n-use-w");
		
		inherited();
	}
    public void SetPropagatedPropertiesInEditor(Soup soup, string par, bool all) 
    {
        if (m_bDebug) Print("SetPropagatedPropertiesInEditor","par="+par);

        // if (all or par == "speedLimitYY")
		// {
        //     m_savedProperties.SetNamedTag("speed-yy", m_speedLimits[ZmvSignalTypes.YY]);
		// 	m_speedLimits[ZmvSignalTypes.YY] = soup.GetNamedTagAsInt("speed-yy"); 
		// }
        // if (all or par == "speedLimitYfY")  
		// {
        //     m_savedProperties.SetNamedTag("speed-yfy", m_speedLimits[ZmvSignalTypes.YfY]);
        //     m_speedLimits[ZmvSignalTypes.YfY] = soup.GetNamedTagAsInt("speed-yfy"); 
		// }
        // if (all or par == "speedLimitW")  
		// {
        //     m_savedProperties.SetNamedTag("speed-w", m_speedLimits[ZmvSignalTypes.W]);
        //     m_speedLimits[ZmvSignalTypes.W] = soup.GetNamedTagAsInt("speed-w"); 
		// }
        if (all or par == "useYfY")
		{
            m_savedProperties.SetNamedTag("n-use-yfy", nUseYfY);
			nUseYfY = soup.GetNamedTagAsInt("n-use-yfy");
		}
        if (all or par == "useYY")
		{
            m_savedProperties.SetNamedTag("n-use-yy", nUseYY);
			nUseYY = soup.GetNamedTagAsInt("n-use-yy");
		}
        if (all or par == "useW")
		{
            m_savedProperties.SetNamedTag("n-use-w", nUseW);
			nUseW = soup.GetNamedTagAsInt("n-use-w");
		}
        inherited(soup, par, all);
    }
		
	//=====================================================================================================================
	public bool IsShuntMode() 
	{ 
		return (!m_nextMarker or m_nextMarker.IsManeuver());
	}
	
	string GetCurrentStateDisplayValue(StringTable ST)
	{
		if (m_nLensesState == ZmvSignalTypes.W)
		{
			return ST.GetString("signal-state-w");
		}
				
		if (m_nLensesState == ZmvSignalTypes.YY)
		{
			return ST.GetString("signal-state-yy");
		}
				
		if (m_nLensesState == ZmvSignalTypes.YfY)
		{
			return ST.GetString("signal-state-y") + ST.GetString("signal-state-blink") + " + " + ST.GetString("signal-state-y");
		}
				
		return inherited(ST);
	}	
	
    public int GetLensesState()
    {
        if (useSemiRY and m_nLensesState >= ZmvSignalTypes.R) return m_nLensesState;
		return inherited();
    }	
	
    //=====================================================================================================================
    string getSpeedLimitsContent(StringTable ST) 
    {
        // string 	title = ST.GetString("signal-speed-limit"),
		// 		res = inherited(ST);

		// if (nUseYY > 0)
        //     res = res +
        //           getPropertyHTML(ST.GetString("signal-speed-limit-yy"), m_speedLimits[ZmvSignalTypes.YY], "speedLimitYY", title)+
        //           getPropertyHTML(ST.GetString("signal-speed-limit-yfy"), m_speedLimits[ZmvSignalTypes.YfY], "speedLimitYfY", title);
        // if (nUseW > 0)
        //     res = res + getPropertyHTML(ST.GetString("signal-speed-limit-w"), m_speedLimits[ZmvSignalTypes.W], "speedLimitW", title);
        
        // return res;
        return "";
    }

    string GetUseSignalsContentForEditor(StringTable ST)
    {
        string title = ST.GetString("signal-use-title");
        string semiRY;

		if (useSemiRY) semiRY = ST.GetString("signal-mode-on");
        else           semiRY = ST.GetString("signal-mode-off");
        return  getPropertyHTML(ST.GetString("signal-use-semi-ry"), semiRY, "semiRY", title) +
				inherited(ST) +
                getPropertyHTML(ST.GetString("signal-use-yfy"), nUseYfY, "useYfY", title) +
                getPropertyHTML(ST.GetString("signal-speed-limit-yy"), nUseYY, "useYY", title) +
                getPropertyHTML(ST.GetString("signal-speed-limit-w"), nUseW, "useW", title);
    }

    public string GetPropertyType(string id)
    {
        if (id == "speedLimitYY" or id == "speedLimitYfY" or id == "speedLimitW")
            return "int";
        if (id == "useYfY" or id == "useYY" or id == "useW")
            return "int";
        if (id == "semiRY")
            return "link";

        return inherited(id);
    }

 	public void LinkPropertyValue(string id)
	{
		if (id == "semiRY") useSemiRY = !useSemiRY;
        else inherited(id);
 	}

    public void SetPropertyValue(string id, int val)
    {
        if (m_bDebug) Print("SetPropertyValue", "id="+id+",val="+val);

        // if (id == "speedLimitYY")       m_speedLimits[ZmvSignalTypes.YY]  = Str.ToInt(val);
        // else if (id == "speedLimitYfY") m_speedLimits[ZmvSignalTypes.YfY] = Str.ToInt(val);
        // else if (id == "speedLimitW")   m_speedLimits[ZmvSignalTypes.W]   = Str.ToInt(val);
        if (id == "useYfY")        nUseYfY = Str.ToInt(val);
        else if (id == "useYY")    nUseYY  = Str.ToInt(val);
        else if (id == "useW")     nUseW   = Str.ToInt(val);
        else                       inherited(id, val);
    }

    //=====================================================================================================================	
	bool UseChecker()
	{
		bool res = inherited() or m_bTrainEntered or (useSemiRY and (m_bTrainEntered or m_nLensesState <= ZmvSignalTypes.R));
	//if (IsDebug()) Print("UseChecker","m_bTrainEntered="+m_bTrainEntered+",m_nLensesState="+m_nLensesState+",useSemiRY="+useSemiRY+",res="+res);
		return res;
	}	
	
	bool UseChecker(int state)
	{
		return UseChecker();
	}	
	
	bool ShouldShowAutoblockLenses()
	{
		return inherited() or (m_bSemiAutoCurrent and useSemiRY);
	}	
    //=====================================================================================================================	
    int GetNewLensesStateByFreeBlocksTurn()
    {
        if (nUseYfY > 0 and m_nFreeBlocks >= nUseYfY) return ZmvSignalTypes.YfY;
        if (nUseYY > 0 and m_nFreeBlocks >= nUseYY) return ZmvSignalTypes.YY;
        if (nUseRY > 0 and m_nFreeBlocks >= nUseRY) return ZmvSignalTypes.RY;
        return ZmvSignalTypes.R;
    }

    int GetNewLensesStateByFreeBlocksShunt()
    {
        if (nUseW > 0 and m_nFreeBlocks >= nUseW) return ZmvSignalTypes.W;
        return ZmvSignalTypes.R;
    }

	void checkTrainStopped()
	{
		m_bTrainStopped = m_enteredTrain and m_enteredTrain.IsStopped();
	}
	
	public void ObjectEnter(Message msg) 
	{		
		//if (IsDebug()) Print("ObjectEnter", "name="+(cast<GameObject>(msg.src)).GetName());
		if (!msg.src.isclass(Train)) return;
		m_bTrainEntered = true;
        m_enteredTrain = cast<Train>(msg.src);
		m_signal.SetCheckerWorkMode(true);
	}
	
	public void ObjectLeave(Message msg) 
	{
		//if (IsDebug()) Print("ObjectLeave", "name="+(cast<GameObject>(msg.src)).GetName());
		if (!msg.src.isclass(Train)) return;
        m_enteredTrain = null;
		m_bTrainEntered = false;
	}

	int getNewLensesStateSemiRY()
	{
		//if (!m_prevSignal) m_prevSignal = SearchNearestZmvSignal(true);
		//if (!m_prevSignal or m_prevSignal.GetLensesState() == ZmvSignalTypes.R) return ZmvSignalTypes.R;
//if (m_enteredTrain) Print("getNewLensesStateSemiRY", m_bTrainEntered);
//		m_nextSpeedLimitForALS = 0;
		if (!m_bTrainStopped) checkTrainStopped();
//if (IsDebug()) Print("getNewLensesStateSemiRY","m_enteredTrain="+!!m_enteredTrain+",m_bTrainStopped="+m_bTrainStopped);
		if (m_bTrainStopped) return ZmvSignalTypes.R;
		return ZmvSignalTypes.RY;
	}
  	
	int GetNewRepeaterLensesState(int nPrevLensesState)
	{
		int res;        
        switch (nPrevLensesState)
        {
			case ZmvSignalTypes.W:
            case ZmvSignalTypes.WW:
				if (nUseW > 0) res = ZmvSignalTypes.W;
				break;				
			
            case ZmvSignalTypes.YY:
            case ZmvSignalTypes.YfY:
                if (nUseYY > 0) res = nPrevLensesState;
				break;
				            
            default: 
				res = inherited(nPrevLensesState);
				break;
        }   
        
        if (m_bDebug /*or IsDebug()*/) Print("GetNewRepeaterLensesState","nPrevLensesState="+nPrevLensesState+",res="+res);

        return res;
	}
	
    // int processNewLensesState(object nextObject)
    // {
	// //if (IsDebug()) Print("processNewLensesState","m_bSemiAutoCurrent="+m_bSemiAutoCurrent+",useSemiRY="+useSemiRY);
	
	// 	if (m_bSemiAutoCurrent and useSemiRY)
	// 	{
	// 		return getNewLensesStateSemiRY();
	// 	}
	// 	else if (nextObject != null and !nextObject.isclass(Vehicle))                
	// 	{            
	// 		m_bNextVehicle = false;
	// 		if (m_bDebug /*or IsDebug()*/) Print("$$processNewLensesState$$","nextObject.isclass(ZmvSignalInterface)="+(string)nextObject.isclass(ZmvSignalInterface));
	// 		if (m_bRepeater and !m_bSemiAutoCurrent and nextObject.isclass(ZmvSignalInterface))
	// 		{
	// 			ZmvSignalInterface signal = cast<ZmvSignalInterface>(nextObject);
	// 			if (!signal.GetSpeedLimit())
	// 				return ZmvSignalTypes.R;
	// 			if (signal.IsSemiautomat())
	// 				return GetNewRepeaterLensesState(signal.GetLensesState());
	// 		}
    //         // if (m_nextMarker == null)               
    //         //     m_nextMarker = getNextMarker(nextObject);
    //         if (m_nextMarker != null and !m_nextMarker.IsMain())
    //         {
	// 			if ((nUseW > 0)and m_nextMarker.IsManeuver())
    //                 return GetNewLensesStateByFreeBlocksShunt();
    //             if (!isUseG or (nUseYY > 0 and m_nextMarker.IsTurn()))
    //                 return GetNewLensesStateByFreeBlocksTurn();
    //         }
    //     }

    //     return inherited(nextObject);            
    // }
    
    int getSignalStateByLensesState()
    {
        switch (m_nLensesState)
        {
            case ZmvSignalTypes.W: 
            case ZmvSignalTypes.YY:              
                return m_signal.YELLOW;
            case ZmvSignalTypes.YfY: 
                return m_signal.GREEN;
            default: break;
        }
        
        return inherited();
    }
    //=====================================================================================================================
    void InitLenseTypes(Soup config)
    {        
        inherited(config);
		
		if (m_bDebug) Print("InitLenseTypes","");

        Soup[] effects = getEffectsConfigs(config);
		Soup options = config.GetNamedSoup("extensions");
        
        ZmvLensesData lenseCur;
        bool bY  = IsLenseInConfig(effects, ZmvLenseTypes.scY), 
             bYt = IsLenseInConfig(effects, ZmvLenseTypes.scYt), 
             bYf = IsLenseInConfig(effects, ZmvLenseTypes.scYf);

        if (bY and bYt)
        {        
            lenseCur = new ZmvLensesData();
            lenseCur.addLense(ZmvLenseTypes.scY);
            lenseCur.addLense(ZmvLenseTypes.scYt);
            m_lenseTypes[ZmvSignalTypes.YY] = lenseCur;
            if (m_bDebug) Print("InitLenseTypes","ZmvSignalTypes.YY, m_allLenses.getLenses().size()="+m_allLenses.getLenses().size());
        }

        if (bY and bYf)
        {        
            lenseCur = new ZmvLensesData();
            lenseCur.addLense(ZmvLenseTypes.scYt);
            lenseCur.addLense(ZmvLenseTypes.scYf);
            m_lenseTypes[ZmvSignalTypes.YfY] = lenseCur;
            if (m_bDebug) Print("InitLenseTypes","ZmvSignalTypes.YfY, m_allLenses.getLenses().size()="+m_allLenses.getLenses().size());
        }
    }
    	
	public void Init(Asset asset)
    {
        inherited(asset);
        nUseW   = 1;
        nUseYY  = 2;
        nUseYfY = 3;
    }
};
//
class ZmvYWYRLibrary isclass ZmvWYGYRLibrary
{
    //Debug =================================================================================================================
    public void Print(string method, string s)
    {
        Interface.Print("ZmvSignalLibraryYWYR::"+method+":"+m_signal.GetName()+":"+s);
    }    
    //=====================================================================================================================
    public void Init(Asset asset)
    {
        inherited(asset);
        isUseG = false;
    }
};

class ZmvYGYRLibrary isclass ZmvWYGYRLibrary
{
    //Debug =================================================================================================================
    public void Print(string method, string s)
    {
        Interface.Print("ZmvSignalLibraryYGYR::"+method+":"+m_signal.GetName()+":"+s);
    }    
    //=====================================================================================================================
    public void Init(Asset asset)
    {
        inherited(asset);
        nUseW = 0;
    }
};

class ZmvWYGRLibrary isclass ZmvWYGYRLibrary
{
    //Debug =================================================================================================================
    public void Print(string method, string s)
    {
        Interface.Print("ZmvSignalLibraryWYGR::"+method+":"+m_signal.GetName()+":"+s);
    }
    //=====================================================================================================================
    public void Init(Asset asset)
    {
        inherited(asset);
        nUseYY = 0;
    }
};
