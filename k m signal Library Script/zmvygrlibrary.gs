include "zmvgrlibrary.gs"

class ZmvYGRLibrary isclass ZmvGRLibrary
{
    int  nUseRY,
         nUseY,
         nUseYG,
         nUseGG;
    bool isUseG;
    
    //Debug =================================================================================================================
    public void Print(string method, string s)
    {
        Interface.Print("ZmvSignalLibraryYGR::"+method+":"+m_signal.GetName()+":"+s);
    }    
    //Properties ==========================================================================================================
	public void getProperties(Soup db)
	{
 		inherited(db);

		db.SetNamedTag("n-use-ry", nUseRY);
		db.SetNamedTag("n-use-y",  nUseY);
		db.SetNamedTag("n-use-yg", nUseYG);
		db.SetNamedTag("n-use-gg", nUseGG);
		db.SetNamedTag("speed-ry", m_speedLimits[ZmvSignalTypes.RY]);
		db.SetNamedTag("speed-yg", m_speedLimits[ZmvSignalTypes.YG]);
	}

	public void setProperties(Soup db)
	{
		int useRY = db.GetNamedTagAsInt("n-use-ry", nUseRY);
		int useY  = db.GetNamedTagAsInt("n-use-y",  nUseY);
		int useYG = db.GetNamedTagAsInt("n-use-yg", nUseYG);
		int useGG = db.GetNamedTagAsInt("n-use-gg", nUseGG);
		int limRY = db.GetNamedTagAsFloat("speed-ry", m_speedLimits[ZmvSignalTypes.RY]);
		int limYG = db.GetNamedTagAsFloat("speed-yg", m_speedLimits[ZmvSignalTypes.YG]);

		if (m_bOpenedProperties and !m_bCancel)
			m_bCancel = (useGG != nUseGG or useRY != nUseRY or useY != nUseY or useYG != nUseYG or m_speedLimits[ZmvSignalTypes.RY] != limRY or m_speedLimits[ZmvSignalTypes.YG] != limYG);

		nUseRY = useRY;
		nUseY  = useY;
		nUseYG = useYG;
		nUseGG = useGG;
        m_speedLimits[ZmvSignalTypes.RY] = limRY;
        m_speedLimits[ZmvSignalTypes.YG] = limYG;

        if (m_bDebug) Print("SetProperties", "nUseRY="+nUseRY+",nUseYG="+nUseYG+",nUseGG="+nUseGG);
 		inherited(db);
 	}

    void restoreProperties()
	{
        /*if (m_bDebug)*/ Print("restoreProperties","");
		if (m_savedProperties.HasNamedTag("speed-ry"))
			m_speedLimits[ZmvSignalTypes.RY] = m_savedProperties.GetNamedTagAsInt("speed-ry");
		if (m_savedProperties.HasNamedTag("speed-yg"))
			m_speedLimits[ZmvSignalTypes.YG] = m_savedProperties.GetNamedTagAsInt("speed-yg");
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

	bool ShouldUseChecker(int state)
	{
		bool res = m_trainEntered;
		if (!res)
		{
			if (isUseG)	 	     res = inherited(state);
			else if (nUseYG > 0) res = (state != ZmvSignalTypes.YG);
			else if (nUseY > 0)  res = (state != ZmvSignalTypes.Y);
		}
	//if (IsDebug()) Print("ShouldUseChecker(int state)", "state="+state+",res="+res);
		return res;
	}		
	
    public void setPropagatedProperties(Soup soup, string par, bool all) 
    {
        if (m_bDebug) Print("setPropagatedProperties","par="+par);

        if (all or par == "speedLimitRY") 
		{
            m_savedProperties.SetNamedTag("speed-ry", m_speedLimits[ZmvSignalTypes.RY]);
            m_speedLimits[ZmvSignalTypes.RY] = soup.GetNamedTagAsInt("speed-ry"); 
		}
        if (all or par == "speedLimitYG")  
		{
            m_savedProperties.SetNamedTag("speed-yg", m_speedLimits[ZmvSignalTypes.YG]);
            m_speedLimits[ZmvSignalTypes.YG] = soup.GetNamedTagAsInt("speed-yg"); 
		}
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
	string GetCurrentState(StringTable ST)
	{
		if (m_nLensesState == ZmvSignalTypes.Y)
		{
			return ST.GetString("signal-state-y");
		}
								
		if (m_nLensesState == ZmvSignalTypes.G)
		{
			return ST.GetString("signal-state-g");
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
    string getSpeedLimitsContent(StringTable ST) 
    {
        string  title = ST.GetString("signal-speed-limit"),
				res = getPropertyHTML(ST.GetString("signal-speed-limit-ry"), m_speedLimits[ZmvSignalTypes.RY], "speedLimitRY", title)+
                      getPropertyHTML(ST.GetString("signal-speed-limit-y"), m_speedLimits[ZmvSignalTypes.Y], "speedLimitY", title);
        if (isUseG)
            res =   res + 
                    getPropertyHTML(ST.GetString("signal-speed-limit-yg"), m_speedLimits[ZmvSignalTypes.YG], "speedLimitYG", title) +
                    getPropertyHTML(ST.GetString("signal-speed-limit-g"), m_speedLimits[ZmvSignalTypes.G], "speedLimitG", title);
        return res;
    }

    string GetUseSignalsContent(StringTable ST)
    {
		string title = ST.GetString("signal-use");

        string res = getPropertyHTML(ST.GetString("signal-use-ry"), nUseRY, "useRY", title) +
					 getPropertyHTML(ST.GetString("signal-use-y"),  nUseY,  "useY",  title);
        if (isUseG)
            res = res +
                    getPropertyHTML(ST.GetString("signal-use-yg"), nUseYG, "useYG", title) +
                    getPropertyHTML(ST.GetString("signal-use-gg"), nUseGG, "useGG", title);
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

        if (id == "speedLimitRY")       m_speedLimits[ZmvSignalTypes.RY] = Str.ToInt(val);
        else if (id == "speedLimitY")   m_speedLimits[ZmvSignalTypes.Y]  = Str.ToInt(val);
        else if (id == "speedLimitYG")  m_speedLimits[ZmvSignalTypes.YG] = Str.ToInt(val);
        else if (id == "useRY")         nUseRY = Str.ToInt(val);
        else if (id == "useY")          nUseY  = Str.ToInt(val);
        else if (id == "useYG")         nUseYG = Str.ToInt(val);
        else if (id == "useGG")         nUseGG = Str.ToInt(val);
        else                            inherited(id, val);
    }

    //=====================================================================================================================
	public bool IsShuntMode() 
	{ 
		return false;
	}
	
  	int getNewRepeaterLensesState(int nPrevLensesState)
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
        
        if (m_bDebug /*or IsDebug()*/) Print("getNewRepeaterLensesState","nPrevLensesState="+nPrevLensesState+",res="+res);

        return res;
	}
	
    int getNewLensesState(int nPrevLensesState)
    {
		int res = ZmvSignalTypes.R;
        
	//if (IsDebug()) Print("getNewLensesState(int nPrevLensesState)","nPrevLensesState="+nPrevLensesState);
		
        switch (nPrevLensesState)
        {
            case ZmvSignalTypes.R:  
                if (m_bDebug /*or IsDebug()*/) Print("!!getNewLensesState!!","nPrevLensesState="+nPrevLensesState+"(nUseRY > 0)="+(nUseRY > 0));
                if ((nUseRY > 0))            res = ZmvSignalTypes.RY;
                else if ((nUseY > 0))       	res = ZmvSignalTypes.Y;
                else if ((nUseYG > 0))		res = ZmvSignalTypes.YG;
                else if ((nUseGG > 0))		res = ZmvSignalTypes.G;
				else 					res = ZmvSignalTypes.R;
                
				if (m_bDebug /*or IsDebug()*/) Print("!!getNewLensesState!!","res="+res+"(nUseRY > 0)="+(nUseRY > 0));
                break;
            
            case ZmvSignalTypes.YY:
            case ZmvSignalTypes.YfY:
            case ZmvSignalTypes.Y:
                if (isUseG)
                {
                    if ((nUseYG > 0))   		res = ZmvSignalTypes.YG;
                    else if ((nUseGG > 0))   res = ZmvSignalTypes.G;
					else if ((nUseY > 0))	res = ZmvSignalTypes.Y;
					else 				res = ZmvSignalTypes.R;
                }
                else
                {
                    if ((nUseY > 0))			res = ZmvSignalTypes.Y;
					else 				res = ZmvSignalTypes.R;
                }
                break;
            
            case ZmvSignalTypes.YG: 
            case ZmvSignalTypes.G:   
                if (isUseG)
				{
                    if ((nUseGG > 0))		res = ZmvSignalTypes.G;
                    else if ((nUseYG > 0))	res = ZmvSignalTypes.YG;
					else if ((nUseY > 0))	res = ZmvSignalTypes.Y;
					else 				res = ZmvSignalTypes.R;
				}
                else  
				{
					if ((nUseY > 0))	        res = ZmvSignalTypes.Y;
					else 				res = ZmvSignalTypes.R;
				}
                break;
            
            case ZmvSignalTypes.W:
            case ZmvSignalTypes.WW:
            case ZmvSignalTypes.RY: 
                if ((nUseY > 0))				res = ZmvSignalTypes.Y;
				else if ((nUseYG > 0))		res = ZmvSignalTypes.YG;
                else if ((nUseGG > 0))  		res = ZmvSignalTypes.G;
				else 					res = ZmvSignalTypes.R;
                break;

            default: break;
        }   
        
        if (m_bDebug /*or IsDebug()*/) Print("getNewLensesState","nPrevLensesState="+nPrevLensesState+",res="+res);

        return res;
    }

    int getNewLensesStateByN(int n)
    {
        if (n <= 0) return ZmvSignalTypes.R;
        if (nUseGG > 0 and n >= nUseGG) return ZmvSignalTypes.G;
        if (nUseYG > 0 and n >= nUseYG) return ZmvSignalTypes.YG;
        if (nUseY > 0  and n >= nUseY)  return ZmvSignalTypes.Y;
        if (nUseRY > 0 and n >= nUseRY) return ZmvSignalTypes.RY;
        return ZmvSignalTypes.R;
    }

    int getNewLensesStateBySignal(int nPrevSignalState)
    {
        switch (nPrevSignalState)
        {
            case m_signal.RED:
                if ((nUseY > 0))			return ZmvSignalTypes.Y;
                if ((nUseYG > 0))   		return ZmvSignalTypes.YG;
				if ((nUseGG > 0))		return ZmvSignalTypes.G;
				return ZmvSignalTypes.R;
				
            case m_signal.YELLOW: 
                if (isUseG)
                {
                    if ((nUseGG > 0))   	return ZmvSignalTypes.G;
                    if ((nUseYG > 0))   	return ZmvSignalTypes.YG;
					if ((nUseY > 0))		return ZmvSignalTypes.Y;
					return ZmvSignalTypes.R;
                }
                else
                {
                    if ((nUseYG > 0))   	return ZmvSignalTypes.YG;
                    if ((nUseY > 0))		return ZmvSignalTypes.Y;
					return ZmvSignalTypes.R;
                }
			
            case m_signal.GREEN:  
                if (isUseG)
				{
                    if ((nUseGG > 0))	return ZmvSignalTypes.G;
                    if ((nUseYG > 0))	return ZmvSignalTypes.YG;
					if ((nUseY > 0))		return ZmvSignalTypes.Y;
					return ZmvSignalTypes.R;
				}
                else
				{
                    if ((nUseYG > 0))	return ZmvSignalTypes.YG;
                    if ((nUseY > 0))		return ZmvSignalTypes.Y;					
					return ZmvSignalTypes.R;
				}
				
            default: break;
        }
        return ZmvSignalTypes.R;
    }
    
    int getSignalStateByLensesState()
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
        nUseGG = 4;
    }
};
