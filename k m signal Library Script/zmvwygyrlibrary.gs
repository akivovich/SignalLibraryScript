include "zmvygrlibrary.gs"

//#region ZmvWYGYRLibrary ==============================================================	    
class ZmvWYGYRLibrary isclass ZmvYGRLibrary
{
    //#region State ====================================================================	    
    int   m_nUseYfY, m_nUseYY, m_nUseW;
	bool  m_bUseSemiRY, m_bUseArsW;
	bool  m_bEnteredTrainStopped;
    //#endregion 
    //#region Debug ====================================================================
    public void Print(string method, string s)
    {
        Interface.Print("ZmvSignalLibraryWYGYR::"+method+":"+m_signal.GetName()+":"+s);
    }    
    //#endregion
    //#region Properties ===============================================================
	void GetPropertiesInt(Soup db)
	{
 		inherited(db);

		db.SetNamedTag("n-use-yfy", m_nUseYfY);
		db.SetNamedTag("n-use-yy", m_nUseYY);
		db.SetNamedTag("n-use-w", m_nUseW);
		db.SetNamedTag("use-semi-ry", m_bUseSemiRY);
   		db.SetNamedTag("use-ars-w", m_bUseArsW);
	}

	void SetPropertiesInt(Soup db)
	{		
		m_bUseArsW  = db.GetNamedTagAsBool("use-ars-w", false);
		m_bUseSemiRY = db.GetNamedTagAsBool("use-semi-ry", false);
		
		int useYfY = db.GetNamedTagAsInt("n-use-yfy", m_nUseYfY);
		int useYY  = db.GetNamedTagAsInt("n-use-yy",  m_nUseYY);
		int useW   = db.GetNamedTagAsInt("n-use-w",   m_nUseW);
		if (m_bOpenedProperties and !m_bCancel)
			m_bCancel = m_nUseYfY != useYfY or m_nUseYY != useYY or m_nUseW != useW; 

		m_nUseYfY = useYfY;
		m_nUseYY  = useYY;
		m_nUseW   = useW;
		
 		inherited(db);
 	}

    void RestorePropertiesInEditor()
	{
        if (m_bDebug) Print("RestorePropertiesInEditor","");
		if (m_savedProperties.HasNamedTag("n-use-yfy"))
			m_nUseYfY = m_savedProperties.GetNamedTagAsInt("n-use-yfy");
		if (m_savedProperties.HasNamedTag("n-use-yy"))
			m_nUseYY = m_savedProperties.GetNamedTagAsInt("n-use-yy");
		if (m_savedProperties.HasNamedTag("n-use-w"))
			m_nUseW = m_savedProperties.GetNamedTagAsInt("n-use-w");
		
		inherited();
	}

    public void SetPropagatedPropertiesInEditor(Soup soup, string par, bool all) 
    {
        if (m_bDebug) Print("SetPropagatedPropertiesInEditor","par="+par);

        if (all or par == "useYfY")
		{
            m_savedProperties.SetNamedTag("n-use-yfy", m_nUseYfY);
			m_nUseYfY = soup.GetNamedTagAsInt("n-use-yfy");
		}
        if (all or par == "useYY")
		{
            m_savedProperties.SetNamedTag("n-use-yy", m_nUseYY);
			m_nUseYY = soup.GetNamedTagAsInt("n-use-yy");
		}
        if (all or par == "useW")
		{
            m_savedProperties.SetNamedTag("n-use-w", m_nUseW);
			m_nUseW = soup.GetNamedTagAsInt("n-use-w");
		}
        inherited(soup, par, all);
    }
    //#endregion 		
    //#region Main process =============================================================
    int CalcFreeBlocks() //mute
    {
        int freeBlocks = 0;
        if (m_bSemiAutoCurrent and m_bUseSemiRY) 
        {
            if (!m_bNextVehicle and !m_bEnteredTrainStopped)  freeBlocks = m_nUseRY;
        }
        else 
        {
            freeBlocks = inherited();
        }
		if (m_bDebug) Print("CalcFreeBlocks", "m_bSemiAutoCurrent="+m_bSemiAutoCurrent+",m_bUseSemiRY="+m_bUseSemiRY+",freeBlocks="+freeBlocks);

        return freeBlocks;
    }

	int  FixMaxFreeBlocks(int max)
	{
        int res = inherited(max);
        if (res < m_nUseYfY) res = m_nUseYfY;
        if (res < m_nUseYY)  res = m_nUseYY;
        if (res < m_nUseW)   res = m_nUseW;
        return res;
	}

	int  GetCheckerInterval()
	{
		int interval = inherited();
        if (interval <= 0 and m_bUseSemiRY) interval = m_nWaitSecRedProp;
    	if (m_bDebug) Print("GetCheckerInterval","m_enteredTrain="+!!m_enteredTrain+",m_nLensesState="+m_nLensesState+",m_bUseSemiRY="+m_bUseSemiRY+",interval="+interval);
		return interval;
	}	

	public bool IsShuntMode() 
	{ 
		return m_nextMarker and m_nextMarker.IsManeuver();
	}

	void checkTrainStopped()
	{
		m_bEnteredTrainStopped = m_enteredTrain and m_enteredTrain.IsStopped();
        if (m_bDebug) Print("checkTrainStopped", "m_bEnteredTrainStopped="+m_bEnteredTrainStopped);
	}
	
	public void ObjectEnter(Message msg) 
	{
        inherited(msg);		
		if (!m_enteredTrain) return;
        checkTrainStopped();
	}
	
	public void ObjectLeave(Message msg) 
	{
        inherited(msg);
        if (!m_enteredTrain) m_bEnteredTrainStopped = false;
	}
    //#endregion
    //#region Editor HTML ==============================================================
    string GetUseSignalsContentForEditor(StringTable ST, string allPref)
    {
        string res, 
               semiRY;
		if (m_bUseSemiRY) semiRY = ST.GetString("signal-mode-on");
        else              semiRY = ST.GetString("signal-mode-off");
        
        if (!m_bAutoblockCurrent) 
        {
            string autoW;
            if (m_bUseArsW) autoW = ST.GetString("signal-mode-on");
            else            autoW = ST.GetString("signal-mode-off");
            res = GetPropertyHTML(ST.GetString("use-auto-w"), autoW, "autoW", allPref);
        }        
        else  
        {
            res = "";
        }

        return  res +
                GetPropertyHTML(ST.GetString("signal-use-semi-ry"), semiRY, "semiRY", allPref) +
				inherited(ST, allPref) +
                GetPropertyHTML(ST.GetString("signal-use-yfy"), m_nUseYfY, "useYfY", allPref) +
                GetPropertyHTML(ST.GetString("signal-use-yy"), m_nUseYY, "useYY", allPref) +
                GetPropertyHTML(ST.GetString("signal-use-w"), m_nUseW, "useW", allPref);
    }

    public string GetPropertyType(string id)
    {
        if (id == "useYfY" or id == "useYY" or id == "useW")
            return "int";
        if (id == "semiRY" or id == "autoW")
            return "link";

        return inherited(id);
    }

 	public void LinkPropertyValue(string id)
	{
		if (id == "semiRY") m_bUseSemiRY = !m_bUseSemiRY;
        else if (id == "autoW") m_bUseArsW = !m_bUseArsW;
        else inherited(id);
 	}

    public string GetPropertyValue(string id)
    {
        if (m_bDebug) Print("GetPropertyValue", "id="+id);

        if (id == "useYfY")  return (string)m_nUseYfY;
        if (id == "useYY")   return (string)m_nUseYY;
        if (id == "useW")    return (string)m_nUseW;
        return inherited(id);
    }

    public void SetPropertyValue(string id, int val)
    {
        if (m_bDebug) Print("SetPropertyValue", "id="+id+",val="+val);

        if (id == "useYfY")        m_nUseYfY = val;
        else if (id == "useYY")    m_nUseYY  = val;
        else if (id == "useW")     m_nUseW   = val;
        else                       inherited(id, val);
    }
    //#endregion
    //#region Lenses state =============================================================	
	string GetCurrentStateDisplayValue(StringTable ST)
	{	
        switch (m_nLensesState)
        {
            case ZmvSignalTypes.B:   return ST.GetString("signal-state-b");
            case ZmvSignalTypes.W:   return ST.GetString("signal-state-w");
            case ZmvSignalTypes.YY:  return ST.GetString("signal-state-yy");
            case ZmvSignalTypes.YfY: return ST.GetString("signal-state-y") + ST.GetString("signal-state-blink") + " + " + ST.GetString("signal-state-y");
            default: break;
        }				
		return inherited(ST);
	}	
	
    int  ProcessNewLensesState()
    {
        if (m_bDebug) Print("ProcessNewLensesState","m_bSemiAutoCurrent="+m_bSemiAutoCurrent+",m_bUseSemiRY="+m_bUseSemiRY+",m_bEnteredTrainStopped="+m_bEnteredTrainStopped+",m_bNextVehicle="+m_bNextVehicle);
        if (!m_bSemiAutoCurrent or !m_bUseSemiRY) return inherited();
	 	if (!m_bEnteredTrainStopped and !m_bNextVehicle) return ZmvSignalTypes.RY;
	 	return ZmvSignalTypes.R;
    }

 	void UpdateVisualState(bool force)
 	{
        if (m_bDebug) Print("UpdateVisualState2","m_bSemiAutoCurrent="+m_bSemiAutoCurrent+",m_bUseSemiRY="+m_bUseSemiRY);
        if (m_bSemiAutoCurrent and m_bUseSemiRY and m_enteredTrain and !m_bEnteredTrainStopped) checkTrainStopped();
        inherited(force);
 	}	

    int  GetCurrentSpeedLimitByLensesState()
	{
        switch (m_nLensesState)
        {
            case ZmvSignalTypes.W:
            case ZmvSignalTypes.YY:
            case ZmvSignalTypes.YfY: return 40;
            default: break;
        }
        return inherited();
	}

	bool ShouldShowAutoblockLenses(int nLensesState)
	{
		return inherited(nLensesState) or (m_bUseArsW and nLensesState == ZmvSignalTypes.W);
	}	

    int  GetNewLensesStateByFreeBlocksTurn()
    {
        if (m_nUseYfY > 0 and m_nFreeBlocks >= m_nUseYfY) return ZmvSignalTypes.YfY;
        if (m_nUseYY > 0 and m_nFreeBlocks >= m_nUseYY) return ZmvSignalTypes.YY;
        if (m_nUseRY > 0 and m_nFreeBlocks >= m_nUseRY) return ZmvSignalTypes.RY;
        return ZmvSignalTypes.R;
    }

    int  GetNewLensesStateByFreeBlocksShunt()
    {
        if (m_nUseW > 0 and m_nFreeBlocks >= m_nUseW) return ZmvSignalTypes.W;
        return ZmvSignalTypes.R;
    }

    int  GetNewLensesStateByFreeBlocks()
    { 
        if (m_bDebug) Print("GetNewLensesStateByFreeBlocks2","m_nextMarker="+!!m_nextMarker);
        if (!m_nextMarker or m_nextMarker.IsMain()) return inherited();
        if (m_nextMarker.IsTurn())     return GetNewLensesStateByFreeBlocksTurn();
        if (m_nextMarker.IsManeuver()) return GetNewLensesStateByFreeBlocksShunt();
        return ZmvSignalTypes.R;
    }

	int  GetNewRepeaterLensesState(int nPrevLensesState)
	{
		int res = inherited(nPrevLensesState);     
        switch (nPrevLensesState)
        {
			case ZmvSignalTypes.W:
            case ZmvSignalTypes.WW:
				if (m_nUseW > 0) res = ZmvSignalTypes.W;
				break;				
			
            case ZmvSignalTypes.YY:
            case ZmvSignalTypes.YfY:
                if (m_nUseYY > 0) res = nPrevLensesState;
				break;
				            
            default: 
				res = inherited(nPrevLensesState);
				break;
        }   
        
        if (m_bDebug) Print("GetNewRepeaterLensesState","nPrevLensesState="+nPrevLensesState+",res="+res);

        return res;
	}
	
    int GetSignalStateByLensesState()
    {
        switch (m_nLensesState)
        {
            case ZmvSignalTypes.W: 
            case ZmvSignalTypes.YY:              
            case ZmvSignalTypes.YfY: 
                return m_signal.YELLOW;
            default: break;
        }
        
        return inherited();
    }
    //#endregion
    //#region Init =====================================================================
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
        m_nUseW   = 1;
        m_nUseYY  = 2;
        m_nUseYfY = 3;
    }
    //#endregion
};
//#endregion 
//#region ZmvYWYRLibrary ===============================================================
class ZmvYWYRLibrary isclass ZmvWYGYRLibrary
{
    //Debug ============================================================================
    public void Print(string method, string s)
    {
        Interface.Print("ZmvSignalLibraryYWYR::"+method+":"+m_signal.GetName()+":"+s);
    }    
    //==================================================================================
    public void Init(Asset asset)
    {
        inherited(asset);
        isUseG = false;
    }
};
//#endregion 
//#region ZmvYGYRLibrary ===============================================================
class ZmvYGYRLibrary isclass ZmvWYGYRLibrary
{
    //Debug ============================================================================
    public void Print(string method, string s)
    {
        Interface.Print("ZmvSignalLibraryYGYR::"+method+":"+m_signal.GetName()+":"+s);
    }    
    //==================================================================================
    public void Init(Asset asset)
    {
        inherited(asset);
        m_nUseW = 0;
    }
};
//#endregion 
//#region ZmvWYGRLibrary ===============================================================
class ZmvWYGRLibrary isclass ZmvWYGYRLibrary
{
    //Debug ============================================================================
    public void Print(string method, string s)
    {
        Interface.Print("ZmvSignalLibraryWYGR::"+method+":"+m_signal.GetName()+":"+s);
    }
    //==================================================================================
    public void Init(Asset asset)
    {
        inherited(asset);
        m_nUseYY = 0;
    }
};
//#endregion 