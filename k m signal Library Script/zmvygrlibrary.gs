include "zmvgrlibrary.gs"

class ZmvYGRLibrary isclass ZmvGRLibrary
{
    int  nUseRY, nUseY, nUseYG;
    bool isUseG;
    
    //Debug =================================================================================================================
    public void Print(string method, string s)
    {
        Interface.Print("ZmvSignalLibraryYGR::"+method+":"+m_signal.GetName()+":"+s);
    }    
    //Properties ==========================================================================================================
	void GetPropertiesInt(Soup db)
	{
 		inherited(db);

		db.SetNamedTag("n-use-ry", nUseRY);
		db.SetNamedTag("n-use-y",  nUseY);
		db.SetNamedTag("n-use-yg", nUseYG);
		// db.SetNamedTag("speed-ry", m_speedLimits[ZmvSignalTypes.RY]);
		// db.SetNamedTag("speed-yg", m_speedLimits[ZmvSignalTypes.YG]);
	}

	void SetPropertiesInt(Soup db)
	{
		int useRY = db.GetNamedTagAsInt("n-use-ry", nUseRY);
		int useY  = db.GetNamedTagAsInt("n-use-y",  nUseY);
		int useYG = db.GetNamedTagAsInt("n-use-yg", nUseYG);
		// int limRY = db.GetNamedTagAsFloat("speed-ry", m_speedLimits[ZmvSignalTypes.RY]);
		// int limYG = db.GetNamedTagAsFloat("speed-yg", m_speedLimits[ZmvSignalTypes.YG]);

		if (m_bOpenedProperties and !m_bCancel)
			m_bCancel = useRY != nUseRY or useY != nUseY or useYG != nUseYG; // or m_speedLimits[ZmvSignalTypes.RY] != limRY or m_speedLimits[ZmvSignalTypes.YG] != limYG);

        nUseRY = useRY;
        nUseY = useY;
        nUseYG = useYG;

        // m_speedLimits[ZmvSignalTypes.RY] = limRY;
        // m_speedLimits[ZmvSignalTypes.YG] = limYG;

        if (m_bDebug) Print("SetProperties", "nUseRY="+nUseRY+",nUseYG="+nUseYG+",nUseGG="+nUseGG);
 		inherited(db);
 	}

    void RestorePropertiesInEditor()
	{
        if (m_bDebug) Print("RestorePropertiesInEditor","");
		// if (m_savedProperties.HasNamedTag("speed-ry"))
		// 	m_speedLimits[ZmvSignalTypes.RY] = m_savedProperties.GetNamedTagAsInt("speed-ry");
		// if (m_savedProperties.HasNamedTag("speed-yg"))
		// 	m_speedLimits[ZmvSignalTypes.YG] = m_savedProperties.GetNamedTagAsInt("speed-yg");
		if (m_savedProperties.HasNamedTag("n-use-ry"))
			nUseRY = m_savedProperties.GetNamedTagAsInt("n-use-ry");
		if (m_savedProperties.HasNamedTag("n-use-y"))
			nUseY = m_savedProperties.GetNamedTagAsInt("n-use-y");
		if (m_savedProperties.HasNamedTag("n-use-yg"))
			nUseYG = m_savedProperties.GetNamedTagAsInt("n-use-yg");
		if (m_savedProperties.HasNamedTag("n-use-gg"))
			nUseGG = m_savedProperties.GetNamedTagAsInt("n-use-gg");

		inherited();
	}

	bool UseChecker(int state)
	{
		bool res = m_bTrainEntered;
		if (!res)
		{
			if (isUseG)	 	     res = inherited(state);
			else if (nUseYG > 0) res = (state != ZmvSignalTypes.YG);
			else if (nUseY > 0)  res = (state != ZmvSignalTypes.Y);
		}
	//if (IsDebug()) Print("UseChecker(int state)", "state="+state+",res="+res);
		return res;
	}		
	
    public void SetPropagatedPropertiesInEditor(Soup soup, string par, bool all) 
    {
        if (m_bDebug) Print("SetPropagatedPropertiesInEditor","par="+par);

        // if (all or par == "speedLimitRY") 
		// {
        //     m_savedProperties.SetNamedTag("speed-ry", m_speedLimits[ZmvSignalTypes.RY]);
        //     m_speedLimits[ZmvSignalTypes.RY] = soup.GetNamedTagAsInt("speed-ry"); 
		// }
        // if (all or par == "speedLimitYG")  
		// {
        //     m_savedProperties.SetNamedTag("speed-yg", m_speedLimits[ZmvSignalTypes.YG]);
        //     m_speedLimits[ZmvSignalTypes.YG] = soup.GetNamedTagAsInt("speed-yg"); 
		// }
        if (all or par == "useRY")
		{
            m_savedProperties.SetNamedTag("n-use-ry", nUseRY);
            nUseRY = soup.GetNamedTagAsInt("n-use-ry");
		}
        if (all or par == "useYG")
		{
            m_savedProperties.SetNamedTag("n-use-yg", nUseYG);
            nUseYG = soup.GetNamedTagAsInt("n-use-yg");
		}
        if (all or par == "useY")
		{
            m_savedProperties.SetNamedTag("n-use-y", nUseY);
            nUseY = soup.GetNamedTagAsInt("n-use-y");
		}
        if (all or par == "useGG")
		{
            m_savedProperties.SetNamedTag("n-use-gg", nUseGG);
            nUseGG = soup.GetNamedTagAsInt("n-use-gg");
		}
        inherited(soup, par, all);
    }
	//=====================================================================================================================
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
    //=====================================================================================================================
    string GetUseSignalsContentForEditor(StringTable ST)
    {
		string title = ST.GetString("signal-use-title");

        string res = GetPropertyHTML(ST.GetString("signal-use-ry"), nUseRY, "useRY", title) +
					 GetPropertyHTML(ST.GetString("signal-use-y"),  nUseY,  "useY",  title);
        if (isUseG)
            res = res +
                    GetPropertyHTML(ST.GetString("signal-use-yg"), nUseYG, "useYG", title) +
                    GetPropertyHTML(ST.GetString("signal-use-gg"), nUseGG, "useGG", title);
        return res;
    }

    public string GetPropertyType(string id)
    {
        if (id == "speedLimitRY" or id == "speedLimitY" or id == "speedLimitYG")
            return "int";
        if (id == "useRY" or id == "useY" or id == "useYG" or id == "useGG")
            return "int";

        return inherited(id);
    }

 	public void LinkPropertyValue(string id)
	{
        inherited(id);
 	}

    public void SetPropertyValue(string id, int val)
    {
        if (m_bDebug) Print("SetPropertyValue", "id="+id+", val="+val);

        // if (id == "speedLimitRY")       m_speedLimits[ZmvSignalTypes.RY] = Str.ToInt(val);
        // else if (id == "speedLimitY")   m_speedLimits[ZmvSignalTypes.Y]  = Str.ToInt(val);
        // else if (id == "speedLimitYG")  m_speedLimits[ZmvSignalTypes.YG] = Str.ToInt(val);
        if (id == "useRY")         nUseRY = Str.ToInt(val);
        else if (id == "useY")     nUseY  = Str.ToInt(val);
        else if (id == "useYG")    nUseYG = Str.ToInt(val);
        else if (id == "useGG")    nUseGG = Str.ToInt(val);
        else                       inherited(id, val);
    }

    //=====================================================================================================================
	public bool IsShuntMode() 
	{ 
		return false;
	}
	
  	int GetNewRepeaterLensesState(int nPrevLensesState)
	{
		int res = ZmvSignalTypes.R;        
        switch (nPrevLensesState)
        {
            case ZmvSignalTypes.RY:
                if (nUseRY > 0)	res = ZmvSignalTypes.RY;
				break;

			case ZmvSignalTypes.W:
            case ZmvSignalTypes.WW:
            case ZmvSignalTypes.YY:
            case ZmvSignalTypes.YfY:
            case ZmvSignalTypes.Y:
                if (nUseY > 0)	res = ZmvSignalTypes.Y;
				break;

            case ZmvSignalTypes.YG:
				if (nUseYG > 0)	res = ZmvSignalTypes.YG;
				break;

            case ZmvSignalTypes.G:
                if (isUseG and nUseGG > 0)	res = ZmvSignalTypes.G;
                break;

            default: break;
        }   
        
        if (m_bDebug /*or IsDebug()*/) Print("GetNewRepeaterLensesState","nPrevLensesState="+nPrevLensesState+",res="+res);

        return res;
	}
	
    int GetNewLensesStateByFreeBlocks()
    {
        if (nUseGG > 0 and m_nFreeBlocks >= nUseGG) return ZmvSignalTypes.G;
        if (nUseYG > 0 and m_nFreeBlocks >= nUseYG) return ZmvSignalTypes.YG;
        if (nUseY > 0  and m_nFreeBlocks >= nUseY)  return ZmvSignalTypes.Y;
        if (nUseRY > 0 and m_nFreeBlocks >= nUseRY) return ZmvSignalTypes.RY;
        return ZmvSignalTypes.R;
    }
    
    int GetSignalStateByLensesState()
    {
        switch (m_nLensesState)
        {
            case ZmvSignalTypes.RY: 
            case ZmvSignalTypes.Y:              
                return m_signal.YELLOW;
            case ZmvSignalTypes.YG: 
                return m_signal.GREEN;
            default: break;
        }
        
        return inherited();
    }

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
        nUseRY = 1;
        nUseY  = 2;
        nUseYG = 3;
    }
};
