include "zmvgrlibrary.gs"

class ZmvYGRLibrary isclass ZmvGRLibrary
{
    int  m_nUseRY, m_nUseY, m_nUseYG;
    bool isUseG;
    
    //#region Print ==========================================================================
    public void Print(string method, string s)
    {
        Interface.Print("ZmvSignalLibraryYGR::"+method+":"+m_signal.GetName()+":"+s);
    }
    //#endregion
    //#region Properties ===================================================================
	void GetPropertiesInt(Soup db)
	{
 		inherited(db);

		db.SetNamedTag("n-use-ry", m_nUseRY);
		db.SetNamedTag("n-use-y",  m_nUseY);
		db.SetNamedTag("n-use-yg", m_nUseYG);
	}

	void SetPropertiesInt(Soup db)
	{
		int useRY = db.GetNamedTagAsInt("n-use-ry", m_nUseRY);
		int useY  = db.GetNamedTagAsInt("n-use-y",  m_nUseY);
		int useYG = db.GetNamedTagAsInt("n-use-yg", m_nUseYG);

		if (m_bOpenedProperties and !m_bCancel)
			m_bCancel = useRY != m_nUseRY or useY != m_nUseY or useYG != m_nUseYG; // or m_speedLimits[ZmvSignalTypes.RY] != limRY or m_speedLimits[ZmvSignalTypes.YG] != limYG);

        m_nUseRY = useRY;
        m_nUseY = useY;
        m_nUseYG = useYG;

        if (m_bDebug) Print("SetProperties", "m_nUseRY="+m_nUseRY+",m_nUseYG="+m_nUseYG);
 		inherited(db);
 	}

    void RestorePropertiesInEditor()
	{
        if (m_bDebug) Print("RestorePropertiesInEditor","");
		if (m_savedProperties.HasNamedTag("n-use-ry"))
			m_nUseRY = m_savedProperties.GetNamedTagAsInt("n-use-ry");
		if (m_savedProperties.HasNamedTag("n-use-y"))
			m_nUseY = m_savedProperties.GetNamedTagAsInt("n-use-y");
		if (m_savedProperties.HasNamedTag("n-use-yg"))
			m_nUseYG = m_savedProperties.GetNamedTagAsInt("n-use-yg");

		inherited();
	}

    public void SetPropagatedPropertiesInEditor(Soup soup, string par, bool all) 
    {
        if (m_bDebug) Print("SetPropagatedPropertiesInEditor","par="+par);

        if (all or par == "useRY")
		{
            m_savedProperties.SetNamedTag("n-use-ry", m_nUseRY);
            m_nUseRY = soup.GetNamedTagAsInt("n-use-ry");
		}
        if (all or par == "useYG")
		{
            m_savedProperties.SetNamedTag("n-use-yg", m_nUseYG);
            m_nUseYG = soup.GetNamedTagAsInt("n-use-yg");
		}
        if (all or par == "useY")
		{
            m_savedProperties.SetNamedTag("n-use-y", m_nUseY);
            m_nUseY = soup.GetNamedTagAsInt("n-use-y");
		}
        inherited(soup, par, all);
    }

	string GetCurrentStateDisplayValue(StringTable ST)
	{								
		if (m_nLensesState == ZmvSignalTypes.Y)
		{
			return ST.GetString("signal-state-y");
		}
								
		if (m_nLensesState == ZmvSignalTypes.RY)
		{
			return ST.GetString("signal-state-r") + " + " + ST.GetString("signal-state-y");
		}
				
		if (m_nLensesState == ZmvSignalTypes.YG)
		{
			return ST.GetString("signal-state-y") + " + " + ST.GetString("signal-state-g");
		}
				
		return inherited(ST);
	}	
    string GetUseSignalsContentForEditor(StringTable ST, string allPref)
    {
        string res = GetPropertyHTML(ST.GetString("signal-use-ry"), m_nUseRY, "useRY", allPref) +
					 GetPropertyHTML(ST.GetString("signal-use-y"),  m_nUseY,  "useY",  allPref);
        if (isUseG)
            res = res +
                    GetPropertyHTML(ST.GetString("signal-use-yg"), m_nUseYG, "useYG", allPref) +
                    inherited(ST, allPref);
        return res;
    }

 	public void LinkPropertyValue(string id)
	{
        inherited(id);
 	}

    public void SetPropertyValue(string id, int val)
    {
        if (m_bDebug) Print("SetPropertyValue", "id="+id+", val="+val);

        if (id == "useRY")         m_nUseRY = val;
        else if (id == "useY")     m_nUseY  = val;
        else if (id == "useYG")    m_nUseYG = val;
        else                       inherited(id, val);
    }
    //#endregion
    //#region Main process =================================================================
	int  FixMaxFreeBlocks(int max)
	{
        int res = inherited(max);
        if (res < m_nUseYG) res = m_nUseYG;
        if (res < m_nUseY)  res = m_nUseY;
        if (res < m_nUseRY) res = m_nUseRY;
        return res;
	}
    //#endregion    
    //#region Lenses State =================================================================	
  	int GetNewRepeaterLensesState(int nPrevLensesState)
	{
		int res = ZmvSignalTypes.R;        
        switch (nPrevLensesState)
        {
            case ZmvSignalTypes.RY:
                if (m_nUseRY > 0)	res = ZmvSignalTypes.RY;
				break;

			case ZmvSignalTypes.W:
            case ZmvSignalTypes.WW:
            case ZmvSignalTypes.YY:
            case ZmvSignalTypes.YfY:
            case ZmvSignalTypes.Y:
                if (m_nUseY > 0)	res = ZmvSignalTypes.Y;
				break;

            case ZmvSignalTypes.YG:
				if (m_nUseYG > 0)	res = ZmvSignalTypes.YG;
				break;

            case ZmvSignalTypes.G:
                if (isUseG and m_nUseGG > 0)	res = ZmvSignalTypes.G;
                break;

            default: break;
        }   
        
if (m_bDebug) Print("GetNewRepeaterLensesState","nPrevLensesState="+nPrevLensesState+",res="+res);

        return res;
	}
	
    int  GetNewLensesStateByFreeBlocks()
    { 
if (m_bDebug) Print("GetNewLensesStateByFreeBlocks","m_nFreeBlocks="+m_nFreeBlocks+",m_nUseGG="+m_nUseGG+",m_nUseYG="+m_nUseYG+",m_nUseY="+m_nUseY+",m_nUseRY="+m_nUseRY);
        if (m_nUseGG > 0 and m_nFreeBlocks >= m_nUseGG) return ZmvSignalTypes.G;
        if (m_nUseYG > 0 and m_nFreeBlocks >= m_nUseYG) return ZmvSignalTypes.YG;
        if (m_nUseY  > 0 and m_nFreeBlocks >= m_nUseY)  return ZmvSignalTypes.Y;
        if (m_nUseRY > 0 and m_nFreeBlocks >= m_nUseRY) return ZmvSignalTypes.RY;
        return ZmvSignalTypes.R;
    }
    
    int  GetSignalStateByLensesState()
    {
        int state;
        switch (m_nLensesState)
        {
            case ZmvSignalTypes.RY: 
            case ZmvSignalTypes.Y:              
                state = m_signal.YELLOW;
                break;
            case ZmvSignalTypes.YG: 
                state = m_signal.GREEN;
                break;
            default: 
                state = inherited();
                break;
        }
        if (m_bDebug) Print("GetSignalStateByLensesState_YGR", "m_nLensesState="+m_nLensesState+",state="+state);
        return state;
    }
    //#region Main process =====================================================================
	public bool IsShuntMode() 
	{ 
		return false;
	}

	int  GetCheckerInterval()
	{
		int interval = inherited();
        if (interval > 0 and !m_bTrainEntered and !m_bAutoblockCurrent and m_nAlsCode == ZmvAls.ALS_0)
        {
            interval = m_nWaitSecRedProp;
        }
if (m_bDebug) Print("GetCheckerInterval", "interval="+interval);
		return interval;
	}
    //#endregion
    //#region Init =============================================================================
    void InitLenseTypes(Soup config)
    {        
        inherited(config);
		if (m_bDebug) Print("InitLenseTypes","");

        Soup[] effects = getEffectsConfigs(config);
		Soup options = config.GetNamedSoup("extensions");
        
        ZmvLensesData lenseCur;
        bool bR  = IsLenseInConfig(effects, ZmvLenseTypes.scR), 
             bY  = IsLenseInConfig(effects, ZmvLenseTypes.scY), 
             bYd = IsLenseInConfig(effects, ZmvLenseTypes.scYd), 
             bG  = IsLenseInConfig(effects, ZmvLenseTypes.scG),
             bYt = IsLenseInConfig(effects, ZmvLenseTypes.scYt), 
             bYf = IsLenseInConfig(effects, ZmvLenseTypes.scYf), 
			 ryt = options.GetNamedTagAsBool("ryt", false),
			 ygt = options.GetNamedTagAsBool("ygt", false),
			 ryd = options.GetNamedTagAsBool("ryd", false),
			 ygd = options.GetNamedTagAsBool("ygd", false);

        if (bYt)	m_allLenses.addLense(ZmvLenseTypes.scYt);
        if (bYf)	m_allLenses.addLense(ZmvLenseTypes.scYf);
        if (bYd)	m_allLenses.addLense(ZmvLenseTypes.scYd);
		
		if (bR and bY)
        {        
            lenseCur = new ZmvLensesData();
            lenseCur.addLense(ZmvLenseTypes.scR);
            if (ryd and bYd)	  lenseCur.addLense(ZmvLenseTypes.scYd); 
			else if (ryt and bYt) lenseCur.addLense(ZmvLenseTypes.scYt);
			else 			 	  lenseCur.addLense(ZmvLenseTypes.scY);
            m_lenseTypes[ZmvSignalTypes.RY] = lenseCur;
            if (m_bDebug) Print("InitLenseTypes","ZmvSignalTypes.RY, m_allLenses.getLenses().size()="+m_allLenses.getLenses().size());
        }

        if (bY)
        {        
            lenseCur = new ZmvLensesData();
			lenseCur.addLense(ZmvLenseTypes.scY);
            m_lenseTypes[ZmvSignalTypes.Y] = lenseCur;            
            m_allLenses.addLense(ZmvLenseTypes.scY);
            if (m_bDebug) Print("InitLenseTypes","ZmvSignalTypes.Y, m_allLenses.getLenses().size()="+m_allLenses.getLenses().size());
        }

        if (bG and bY)
        {        
            lenseCur = new ZmvLensesData();            
            if (ygd and bYd) 	  lenseCur.addLense(ZmvLenseTypes.scYd);
            else if (ygt and bYt) lenseCur.addLense(ZmvLenseTypes.scYt);
			else 			 	  lenseCur.addLense(ZmvLenseTypes.scY);
			lenseCur.addLense(ZmvLenseTypes.scG);
            m_lenseTypes[ZmvSignalTypes.YG] = lenseCur;
            if (m_bDebug) Print("InitLenseTypes","ZmvSignalTypes.YG, m_allLenses.getLenses().size()="+m_allLenses.getLenses().size());
        }		
    }
	
    void Init(Asset asset)
    {
        inherited(asset);
        isUseG = true;
        m_nUseRY = 1;
        m_nUseY  = 2;
        m_nUseYG = 3;
    }
    //#endregion
};
