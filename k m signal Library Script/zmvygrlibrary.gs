include "zmvgrlibrary.gs"

class ZmvYGRLibrary isclass ZmvGRLibrary
{
    bool isUseRY,
         isUseYG,
         isUseGG,
         isUseG,
		 isUseY;
    
    //Debug =================================================================================================================
    public void Print(string method, string s)
    {
        Interface.Print("ZmvSignalLibraryYGR::"+method+":"+m_signal.GetName()+":"+s);
    }    
    //Properties ==========================================================================================================
	public void getProperties(Soup db)
	{
 		inherited(db);

		db.SetNamedTag("use-ry", isUseRY); 
		db.SetNamedTag("use-y",  isUseY); 
		db.SetNamedTag("use-yg", isUseYG); 
		db.SetNamedTag("use-gg", isUseGG); 
		db.SetNamedTag("speed-ry", m_speedLimits[ZmvSignalTypes.RY]); 
		db.SetNamedTag("speed-yg", m_speedLimits[ZmvSignalTypes.YG]); 
	}

	public void setProperties(Soup db)
	{		
		bool useRY = db.GetNamedTagAsBool("use-ry", true);
		bool useY  = db.GetNamedTagAsBool("use-y",  true);
		bool useYG = db.GetNamedTagAsBool("use-yg", true);
		bool useGG = db.GetNamedTagAsBool("use-gg", true);
		int  limRY = db.GetNamedTagAsFloat("speed-ry", m_speedLimits[ZmvSignalTypes.RY]);
		int  limYG = db.GetNamedTagAsFloat("speed-yg", m_speedLimits[ZmvSignalTypes.YG]);
		
		if (m_bOpenedProperties and !m_bCancel)
			m_bCancel = (useGG != isUseGG or useRY != isUseRY or useY != isUseY or useYG != isUseYG or m_speedLimits[ZmvSignalTypes.RY] != limRY or m_speedLimits[ZmvSignalTypes.YG] != limYG);
				
		isUseRY = useRY;
		isUseY  = useY;
		isUseYG = useYG;
		isUseGG = useGG;
        m_speedLimits[ZmvSignalTypes.RY] = limRY;
        m_speedLimits[ZmvSignalTypes.YG] = limYG;

        if (m_bDebug) Print("SetProperties", "isUseRY="+isUseRY+",isUseYG"+isUseYG+",isUseGG"+isUseGG);
 		inherited(db);
 	}

    void restoreProperties()
	{
        /*if (m_bDebug)*/ Print("restoreProperties","");
		if (m_savedProperties.HasNamedTag("speed-ry"))
			m_speedLimits[ZmvSignalTypes.RY] = m_savedProperties.GetNamedTagAsInt("speed-ry");
		if (m_savedProperties.HasNamedTag("speed-yg"))
			m_speedLimits[ZmvSignalTypes.YG] = m_savedProperties.GetNamedTagAsInt("speed-yg");
		if (m_savedProperties.HasNamedTag("use-ry"))
			isUseRY = m_savedProperties.GetNamedTagAsBool("use-ry");
		if (m_savedProperties.HasNamedTag("use-y"))
			isUseY = m_savedProperties.GetNamedTagAsBool("use-y");
		if (m_savedProperties.HasNamedTag("use-yg"))
			isUseYG = m_savedProperties.GetNamedTagAsBool("use-yg");
		if (m_savedProperties.HasNamedTag("use-gg"))
			isUseGG = m_savedProperties.GetNamedTagAsBool("use-gg");
		
		inherited();
	}

	bool ShouldUseChecker(int state)
	{
		bool res = m_trainEntered;
		if (!res)
		{
			if (isUseG)	 	  res = inherited(state);
			else if (isUseYG) res = (state != ZmvSignalTypes.YG);		
			else if (isUseY)  res = (state != ZmvSignalTypes.Y);
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
            m_savedProperties.SetNamedTag("use-ry", isUseRY);
            isUseRY = soup.GetNamedTagAsBool("use-ry");
		}
        if (all or par == "useYG")         
		{
            m_savedProperties.SetNamedTag("use-yg", isUseYG);
            isUseYG = soup.GetNamedTagAsBool("use-yg");
		}
        if (all or par == "useY")
		{
            m_savedProperties.SetNamedTag("use-y", isUseY);
            isUseY = soup.GetNamedTagAsBool("use-y");
		}
        if (all or par == "useGG")         
		{
            m_savedProperties.SetNamedTag("use-gg", isUseGG);
            isUseGG = soup.GetNamedTagAsBool("use-gg");
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
        string  modeOn  = ST.GetString("signal-mode-on");
        string  modeOff = ST.GetString("signal-mode-off");
        string  useRY, useY, useYG, useGG;
		string  title = ST.GetString("signal-use");

        if (isUseRY) useRY = modeOn;
        else         useRY = modeOff;
        if (isUseYG) useYG = modeOn;
        else         useYG = modeOff;
        if (isUseY)  useY  = modeOn;
        else         useY  = modeOff;
        if (isUseGG) useGG = modeOn;
        else         useGG = modeOff;

        string  res = getPropertyHTML(ST.GetString("signal-use-ry"), useRY, "useRY", title) + 
					  getPropertyHTML(ST.GetString("signal-use-y"),  useY,  "useY",  title);
        if (isUseG)
            res =   res + 
                    getPropertyHTML(ST.GetString("signal-use-yg"), useYG, "useYG", title)+ 
                    getPropertyHTML(ST.GetString("signal-use-gg"), useGG, "useGG", title);
        return res;
    }

    public string GetPropertyType(string id)
    {
        if (id == "speedLimitRY" or id == "speedLimitY" or id == "speedLimitYG")
            return "int";
        if (id == "useRY" or id == "useYG" or id == "useY" or id == "useGG")
            return "link";

        return inherited(id);
    }

 	public void LinkPropertyValue(string id)
	{		
 		if (id == "useRY")      isUseRY = !isUseRY;
 		else if (id == "useY")  isUseY  = !isUseY;
 		else if (id == "useYG") isUseYG = !isUseYG;
 		else if (id == "useGG") isUseGG = !isUseGG;
        else inherited(id);
 	}

    public void SetPropertyValue(string id, int val)
    {        
        if (m_bDebug) Print("SetPropertyValue", "id="+id+", val="+val);

        if (id == "speedLimitRY")       m_speedLimits[ZmvSignalTypes.RY] = Str.ToInt(val);
        else if (id == "speedLimitY")   m_speedLimits[ZmvSignalTypes.Y]  = Str.ToInt(val);
        else if (id == "speedLimitYG")  m_speedLimits[ZmvSignalTypes.YG] = Str.ToInt(val);
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
                if (isUseRY)	res = ZmvSignalTypes.RY;
				break;			
			
			case ZmvSignalTypes.W:
            case ZmvSignalTypes.WW:
            case ZmvSignalTypes.YY:
            case ZmvSignalTypes.YfY:
            case ZmvSignalTypes.Y:
                if (isUseY)	res = ZmvSignalTypes.Y;
				break;
				            
            case ZmvSignalTypes.YG: 
				if (isUseYG)	res = ZmvSignalTypes.YG;
				break;
				
            case ZmvSignalTypes.G:   
                if (isUseG and isUseGG)	res = ZmvSignalTypes.G;
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
                if (m_bDebug /*or IsDebug()*/) Print("!!getNewLensesState!!","nPrevLensesState="+nPrevLensesState+"isUseRY="+isUseRY);
                if (isUseRY)            res = ZmvSignalTypes.RY;
                else if (isUseY)       	res = ZmvSignalTypes.Y;
                else if (isUseYG)		res = ZmvSignalTypes.YG;
                else if (isUseGG)		res = ZmvSignalTypes.G;
				else 					res = ZmvSignalTypes.R;
                
				if (m_bDebug /*or IsDebug()*/) Print("!!getNewLensesState!!","res="+res+"isUseRY="+isUseRY);
                break;
            
            case ZmvSignalTypes.YY:
            case ZmvSignalTypes.YfY:
            case ZmvSignalTypes.Y:
                if (isUseG)
                {
                    if (isUseYG)   		res = ZmvSignalTypes.YG;
                    else if (isUseGG)   res = ZmvSignalTypes.G;
					else if (isUseY)	res = ZmvSignalTypes.Y;
					else 				res = ZmvSignalTypes.R;
                }
                else
                {
                    if (isUseY)			res = ZmvSignalTypes.Y;
					else 				res = ZmvSignalTypes.R;
                }
                break;
            
            case ZmvSignalTypes.YG: 
            case ZmvSignalTypes.G:   
                if (isUseG)
				{
                    if (isUseGG)		res = ZmvSignalTypes.G;
                    else if (isUseYG)	res = ZmvSignalTypes.YG;
					else if (isUseY)	res = ZmvSignalTypes.Y;
					else 				res = ZmvSignalTypes.R;
				}
                else  
				{
					if (isUseY)	        res = ZmvSignalTypes.Y;
					else 				res = ZmvSignalTypes.R;
				}
                break;
            
            case ZmvSignalTypes.W:
            case ZmvSignalTypes.WW:
            case ZmvSignalTypes.RY: 
                if (isUseY)				res = ZmvSignalTypes.Y;
				else if (isUseYG)		res = ZmvSignalTypes.YG;
                else if (isUseGG)  		res = ZmvSignalTypes.G;
				else 					res = ZmvSignalTypes.R;
                break;

            default: break;
        }   
        
        if (m_bDebug /*or IsDebug()*/) Print("getNewLensesState","nPrevLensesState="+nPrevLensesState+",res="+res);

        return res;
    }

    int getNewLensesStateBySignal(int nPrevSignalState)
    {
        switch (nPrevSignalState)
        {
            case m_signal.RED:    
                if (isUseY)			return ZmvSignalTypes.Y;
                if (isUseYG)   		return ZmvSignalTypes.YG;
				if (isUseGG)		return ZmvSignalTypes.G;
				return ZmvSignalTypes.R;
				
            case m_signal.YELLOW: 
                if (isUseG)
                {
                    if (isUseGG)   	return ZmvSignalTypes.G;
                    if (isUseYG)   	return ZmvSignalTypes.YG;
					if (isUseY)		return ZmvSignalTypes.Y;
					return ZmvSignalTypes.R;
                }
                else
                {
                    if (isUseYG)   	return ZmvSignalTypes.YG;
                    if (isUseY)		return ZmvSignalTypes.Y;
					return ZmvSignalTypes.R;
                }
			
            case m_signal.GREEN:  
                if (isUseG)
				{
                    if (isUseGG)	return ZmvSignalTypes.G;
                    if (isUseYG)	return ZmvSignalTypes.YG;
					if (isUseY)		return ZmvSignalTypes.Y;
					return ZmvSignalTypes.R;
				}
                else
				{
                    if (isUseYG)	return ZmvSignalTypes.YG;
                    if (isUseY)		return ZmvSignalTypes.Y;					
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
    }
};
