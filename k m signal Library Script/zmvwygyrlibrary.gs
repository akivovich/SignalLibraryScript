include "zmvygrlibrary.gs"

class ZmvWYGYRLibrary isclass ZmvYGRLibrary
{
    int nUseYfY, nUseYY, nUseW;
	bool useSemiRY;
	Train m_enteredTrain;
    
    //Debug =================================================================================================================
    public void Print(string method, string s)
    {
        Interface.Print("ZmvSignalLibraryWYGYR::"+method+":"+m_signal.GetName()+":"+s);
    }    
    //Properties ==========================================================================================================
	public void getProperties(Soup db)
	{
 		inherited(db);

		db.SetNamedTag("n-use-yfy", nUseYfY);
		db.SetNamedTag("n-use-yy", nUseYY);
		db.SetNamedTag("n-use-w", nUseW);
		db.SetNamedTag("use-semi-ry", useSemiRY); 

        db.SetNamedTag("speed-w", m_speedLimits[ZmvSignalTypes.W]); 
		db.SetNamedTag("speed-yy", m_speedLimits[ZmvSignalTypes.YY]); 
		db.SetNamedTag("speed-yfy", m_speedLimits[ZmvSignalTypes.YfY]); 
	}

	public void setProperties(Soup db)
	{		
		useSemiRY = db.GetNamedTagAsBool("use-semi-ry", false);
		
		int useYfY = db.GetNamedTagAsInt("n-use-yfy", nUseYfY);
		int useYY  = db.GetNamedTagAsInt("n-use-yy",  nUseYY);
		int useW   = db.GetNamedTagAsInt("n-use-w",   nUseW);
		int limYY = db.GetNamedTagAsFloat("speed-yy", m_speedLimits[ZmvSignalTypes.YY]),
			limYfY = db.GetNamedTagAsFloat("speed-yfy", m_speedLimits[ZmvSignalTypes.YfY]),
			limW = db.GetNamedTagAsFloat("speed-w", m_speedLimits[ZmvSignalTypes.W]);

		if (m_bOpenedProperties and !m_bCancel)
			m_bCancel = (nUseYfY != useYfY or nUseYY != useYY or nUseW != useW or m_speedLimits[ZmvSignalTypes.YY] != limYY or m_speedLimits[ZmvSignalTypes.YfY] != limYfY or m_speedLimits[ZmvSignalTypes.W] != limW);

		nUseYfY = useYfY;
		nUseYY  = useYY;
		nUseW   = useW;
        m_speedLimits[ZmvSignalTypes.YY] = limYY;
        m_speedLimits[ZmvSignalTypes.YfY] = limYfY;
        m_speedLimits[ZmvSignalTypes.W] = limW;
		
		if (useSemiRY) m_signal.AddObjectEnterOrLeaveHandler();
		
 		inherited(db);
 	}

    void restoreProperties()
	{
        if (m_bDebug) Print("restoreProperties","");
		if (m_savedProperties.HasNamedTag("speed-yy"))
			m_speedLimits[ZmvSignalTypes.YY] = m_savedProperties.GetNamedTagAsInt("speed-yy");
		if (m_savedProperties.HasNamedTag("speed-yfy"))
			m_speedLimits[ZmvSignalTypes.YfY] = m_savedProperties.GetNamedTagAsInt("speed-yfy");
		if (m_savedProperties.HasNamedTag("speed-w"))
			m_speedLimits[ZmvSignalTypes.W] = m_savedProperties.GetNamedTagAsInt("speed-w");
		if (m_savedProperties.HasNamedTag("n-use-yfy"))
			nUseYfY = m_savedProperties.GetNamedTagAsInt("n-use-yfy");
		if (m_savedProperties.HasNamedTag("n-use-yy"))
			nUseYY = m_savedProperties.GetNamedTagAsInt("n-use-yy");
		if (m_savedProperties.HasNamedTag("n-use-w"))
			nUseW = m_savedProperties.GetNamedTagAsInt("n-use-w");
		
		inherited();
	}
    public void setPropagatedProperties(Soup soup, string par, bool all) 
    {
        if (m_bDebug) Print("setPropagatedProperties","par="+par);

        if (all or par == "speedLimitYY")
		{
            m_savedProperties.SetNamedTag("speed-yy", m_speedLimits[ZmvSignalTypes.YY]);
			m_speedLimits[ZmvSignalTypes.YY] = soup.GetNamedTagAsInt("speed-yy"); 
		}
        if (all or par == "speedLimitYfY")  
		{
            m_savedProperties.SetNamedTag("speed-yfy", m_speedLimits[ZmvSignalTypes.YfY]);
            m_speedLimits[ZmvSignalTypes.YfY] = soup.GetNamedTagAsInt("speed-yfy"); 
		}
        if (all or par == "speedLimitW")  
		{
            m_savedProperties.SetNamedTag("speed-w", m_speedLimits[ZmvSignalTypes.W]);
            m_speedLimits[ZmvSignalTypes.W] = soup.GetNamedTagAsInt("speed-w"); 
		}
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
	public void ObjectEnter(Message msg) 
	{		
		if (msg.src.isclass(Train)) 
		{
			m_enteredTrain = cast<Train>(msg.src);
			m_trainStopped = false;
			m_trainEntered = true;
			m_signal.SetCheckerWorkMode(true);
		}
	
if (IsDebug()) Print("ObjectEnter", "name="+(cast<GameObject>(msg.src)).GetName()+",m_enteredTrain="+(m_enteredTrain!=null));
	}
	
	public void ObjectLeave(Message msg) 
	{
if (IsDebug()) Print("ObjectLeave", "");		
		if (msg.src.isclass(Train))
		{
			m_enteredTrain = null;
			m_trainStopped = m_trainEntered = false;
			m_signal.SetCheckerWorkMode(ShouldUseChecker());
		}
	}
	
	//=====================================================================================================================
	public bool IsShuntMode() 
	{ 
		return (!m_nextMarker or m_nextMarker.IsManeuver());
	}
	
	string GetCurrentState(StringTable ST)
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
        string 	title = ST.GetString("signal-speed-limit"),
				res = inherited(ST);

		if (nUseYY > 0)
            res = res +
                  getPropertyHTML(ST.GetString("signal-speed-limit-yy"), m_speedLimits[ZmvSignalTypes.YY], "speedLimitYY", title)+
                  getPropertyHTML(ST.GetString("signal-speed-limit-yfy"), m_speedLimits[ZmvSignalTypes.YfY], "speedLimitYfY", title);
        if (nUseW > 0)
            res = res + getPropertyHTML(ST.GetString("signal-speed-limit-w"), m_speedLimits[ZmvSignalTypes.W], "speedLimitW", title);
        
        return res;
    }

    string GetUseSignalsContent(StringTable ST)
    {
        string title = ST.GetString("signal-use");
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

        if (id == "speedLimitYY")       m_speedLimits[ZmvSignalTypes.YY]  = Str.ToInt(val);
        else if (id == "speedLimitYfY") m_speedLimits[ZmvSignalTypes.YfY] = Str.ToInt(val);
        else if (id == "speedLimitW")   m_speedLimits[ZmvSignalTypes.W]   = Str.ToInt(val);
        else if (id == "useYfY")        nUseYfY = Str.ToInt(val);
        else if (id == "useYY")         nUseYY  = Str.ToInt(val);
        else if (id == "useW")          nUseW   = Str.ToInt(val);
        else                            inherited(id, val);
    }

    //=====================================================================================================================	
	bool ShouldUseChecker()
	{
		bool res = inherited() or m_trainEntered or (useSemiRY and (m_trainEntered or m_nLensesState <= ZmvSignalTypes.R));
	//if (IsDebug()) Print("ShouldUseChecker","m_trainEntered="+m_trainEntered+",m_nLensesState="+m_nLensesState+",useSemiRY="+useSemiRY+",res="+res);
		return res;
	}	
	
	bool ShouldUseChecker(int state)
	{
		return ShouldUseChecker();
	}	
	
	bool ShowAutoblocLenses()
	{
		return m_bAutoblockCurrent or (m_bSemiAutomatCurrent and useSemiRY);
	}	
    //=====================================================================================================================	
    int getNewLensesStateTurn(int nPrevLensesState)
    {
        int res;
        
		if (nPrevLensesState >= 0)
        {     
            switch (nPrevLensesState)
            {
                case ZmvSignalTypes.R: 
					if (nUseRY > 0) res = ZmvSignalTypes.RY;
					else 		 res = ZmvSignalTypes.YY;
					break;
                case ZmvSignalTypes.RY: 
                    res = ZmvSignalTypes.YY;
                    break;
                default:
                    if ((nUseYfY > 0))
                        res = ZmvSignalTypes.YfY;
                    else
                        res = ZmvSignalTypes.YY;
                    break;
            }
        }
        else
        {
            res = ZmvSignalTypes.R;
        }
        
        if (m_bDebug) Print("getNewLensesState","nPrevLensesState="+nPrevLensesState+",res="+res);

        return res;    
    }

    int getNewLensesStateBySignalTurn(int nPrevSignalState)
    {
        int res = ZmvSignalTypes.R;

        switch (nPrevSignalState)
        {
            case m_signal.RED:    
                res = ZmvSignalTypes.YY;
                break;
            case m_signal.YELLOW: 
            case m_signal.GREEN:  
                if ((nUseYfY > 0))
                    res = ZmvSignalTypes.YfY;
                else
                    res = ZmvSignalTypes.YY;
                break;
            default: break;
        }
        
        if (m_bDebug) Print("getNewLensesStateBySignalTurn", "nPrevSignalState="+nPrevSignalState+", res="+res);

        return res;
    }

    int getNewLensesStateTurn(object nextObject)
    {
    	int nNewLensesState = ZmvSignalTypes.R;
    
        if (nextObject.isclass(ZmvSignalInterface))
        {
            ZmvSignalInterface signal = cast<ZmvSignalInterface>(nextObject);
			nNewLensesState = getNewLensesStateTurn(signal.GetLensesState());
			m_nextSpeedLimitForALS = signal.GetSpeedLimit()/KPH_TO_MPS;
        }
        else if (nextObject.isclass(Signal))
        {
            Signal signal = cast<Signal>(nextObject);
            nNewLensesState = getNewLensesStateBySignalTurn(signal.GetSignalState());
			m_nextSpeedLimitForALS = signal.GetSpeedLimit()/KPH_TO_MPS;
        }            
        return nNewLensesState;
    }

    int getNewLensesStateManeuver(int nPrevLensesState)
    {
        int res;
        
        if (nPrevLensesState >= 0)
		{
			res = ZmvSignalTypes.W;
		}
        else
            res = ZmvSignalTypes.R;

        
        if (m_bDebug) Print("getNewLensesState","nPrevLensesState="+nPrevLensesState+",res="+res);

        return res;        
    }

    int getNewLensesStateBySignalManeuver(int nPrevSignalState)
    {
        return ZmvSignalTypes.W;        
    }

    int getNewLensesStateManeuver(object nextObject)
    {
    	int nNewLensesState = ZmvSignalTypes.R;

        if (nextObject.isclass(ZmvSignalInterface))
        {
            ZmvSignalInterface signal = cast<ZmvSignalInterface>(nextObject);
			nNewLensesState = getNewLensesStateManeuver(signal.GetLensesState());
			m_nextSpeedLimitForALS = signal.GetSpeedLimit()/KPH_TO_MPS;
        }
        else if (nextObject.isclass(Signal))
        {
            Signal signal = cast<Signal>(nextObject);
            nNewLensesState = getNewLensesStateBySignalManeuver(signal.GetSignalState());
			m_nextSpeedLimitForALS = signal.GetSpeedLimit()/KPH_TO_MPS;
        }
        return nNewLensesState;
    }

    int getNextN(object nextObject)
    {
        if (nextObject == null) return 0;
        if (nextObject.isclass(ZmvSignalInterface))
        {
            ZmvSignalInterface signal = cast<ZmvSignalInterface>(nextObject);
            return signal.GetFreeBlocksCount() + 1;
        }
        if (nextObject.isclass(Signal))
            return 1;
        return 0;
    }

    int getNewLensesStateByNTurn(int n)
    {
        if (n <= 0) return ZmvSignalTypes.R;
        if (nUseYfY > 0 and n >= nUseYfY) return ZmvSignalTypes.YfY;
        if (nUseYY > 0 and n >= nUseYY) return ZmvSignalTypes.YY;
        if (nUseRY > 0 and n >= nUseRY) return ZmvSignalTypes.RY;
        return ZmvSignalTypes.R;
    }

    int getNewLensesStateByNManeuver(int n)
    {
        if (nUseW > 0 and n >= nUseW) return ZmvSignalTypes.W;
        return ZmvSignalTypes.R;
    }

	void CheckTrainStopped()
	{
		if (m_enteredTrain and m_enteredTrain.IsStopped()) m_trainStopped = true;
	}
	
	int getNewLensesStateSemiRY()
	{
		//if (!m_prevSignal) m_prevSignal = getNextSignal(true);
		//if (!m_prevSignal or m_prevSignal.GetLensesState() == ZmvSignalTypes.R) return ZmvSignalTypes.R;
//if (m_enteredTrain) Print("getNewLensesStateSemiRY", m_trainEntered);
		m_nextSpeedLimitForALS = 0;
		if (!m_trainStopped) CheckTrainStopped();
//if (IsDebug()) Print("getNewLensesStateSemiRY","m_enteredTrain="+!!m_enteredTrain+",m_trainStopped="+m_trainStopped);
		if (m_trainStopped) return ZmvSignalTypes.R;
		return ZmvSignalTypes.RY;
	}
  	
	int getNewRepeaterLensesState(int nPrevLensesState)
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
        
        if (m_bDebug /*or IsDebug()*/) Print("getNewRepeaterLensesState","nPrevLensesState="+nPrevLensesState+",res="+res);

        return res;
	}
	
    int getNewLensesState(object nextObject)
    {
	//if (IsDebug()) Print("getNewLensesState","m_bSemiAutomatCurrent="+m_bSemiAutomatCurrent+",useSemiRY="+useSemiRY);
	
		if (m_bSemiAutomatCurrent and useSemiRY)
		{
			return getNewLensesStateSemiRY();
		}
		else if (nextObject != null and !nextObject.isclass(Vehicle))                
		{            
			m_bNextIsVehicle = false;
			if (m_bDebug /*or IsDebug()*/) Print("$$getNewLensesState$$","nextObject.isclass(ZmvSignalInterface)="+(string)nextObject.isclass(ZmvSignalInterface));
			if (m_bRepeater and !m_bSemiAutomatCurrent and nextObject.isclass(ZmvSignalInterface))
			{
				ZmvSignalInterface signal = cast<ZmvSignalInterface>(nextObject);
				if (!signal.GetSpeedLimit())
					return ZmvSignalTypes.R;
				if (signal.IsSemiautomat())
					return getNewRepeaterLensesState(signal.GetLensesState());
			}
            if (m_nextMarker == null)               
                m_nextMarker = getNextMarker(nextObject);
            if (m_nextMarker != null and !m_nextMarker.IsMain())
            {
				if ((nUseW > 0)and m_nextMarker.IsManeuver())
                    return getNewLensesStateByNManeuver(getNextN(nextObject));
                if (!isUseG or ((nUseYY > 0)and (m_nextMarker.IsTurn() or m_nextMarker.IsSpeedTurn())))
                    return getNewLensesStateByNTurn(getNextN(nextObject));
            }
        }

        return inherited(nextObject);            
    }
    
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
