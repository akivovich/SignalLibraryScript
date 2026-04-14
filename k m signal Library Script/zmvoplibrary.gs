include "zmvcommonlibrary.gs"

class ZmvOPLibrary isclass ZmvBaseLibrary
{
	//Debug =================================================================================================================
    public void Print(string method, string s)
    {
        Interface.Print("ZmvLibraryOP::"+method+":"+m_signal.GetName()+":"+s);
    }    
    //=====================================================================================================================
	public string GetPropertyTitleHTML(string title)
	{
		return inherited(title);
	}
    
    string getModeContent(StringTable ST)
    {
        string modeSemiauto = getBoolPropertiesStr(ST, m_bSemiAutomatProp),
			   title = ST.GetString("signal-modes");
        return GetPropertyTitleHTML(title) + getPropertyHTML(ST.GetString("signal-semiautomath"), modeSemiauto, "semiautomat", title);
    }
    //=====================================================================================================================
	void showLenses()
    {
        if (m_bDebug) Print("showLenses", "m_nLensesState=" + m_nLensesState);
			
        int nLensesState = m_nLensesState,
            nSpeedLimit = 0;                            
        				
		if (nLensesState < 0) nLensesState = 0;
		
		if (m_speedLimits.size() > nLensesState)		
			nSpeedLimit = m_speedLimits[nLensesState];
		
		if (m_lenseTypes[nLensesState])
		{
            m_signal.SetLensesState(m_lenseTypes[nLensesState].getLenses(), getSignalState(), nSpeedLimit);
		}
        else
        {
            m_signal.SetLensesState(new string[0], getSignalState(), nSpeedLimit);
        }
    }
	
	public bool IsShuntMode() 
	{ 
		return true;
	}
	
	void SetAlsData(Soup db, int prevAlsValue/*, int prevNextAlsValue*/)
	{
		db.SetNamedTag("MSig-als-rs", false);
		db.SetNamedTag("MSig-als-fq", ZmvAls.ALS_OC);
		db.SetNamedTag("MSig-als-fq-next", -1);
	}

	int getSignalState()
	{
		return m_signal.AUTOMATIC;
	}
		
    object ProcessSearchNextObject()
    {
        m_nextMarker = null;
        if (m_bDebug) Print("ProcessSearchNextObject", "");
        return null;
    }

    int CalcFreeBlocks(object nextObject)
    {
        return 0;
    }
};
