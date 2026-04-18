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
    
    string GetModeContentForEditor(StringTable ST)
    {
        string modeSemiauto = getModeString(ST, m_bSemiAutoProp),
			   title = ST.GetString("signal-modes-title");
        return GetPropertyTitleHTML(title) + GetPropertyHTML(ST.GetString("signal-semiautomath"), modeSemiauto, "semiautomat", title);
    }
    //=====================================================================================================================
	bool UseAlsFrequencies()
	{
		return false;
	}
    //=====================================================================================================================
	int  GetCurrentSpeedLimit()
	{
		if (m_bPS) return 20;
		return 0;
	}

	void ShowLenses()
    {
        if (m_bDebug) Print("showLenses", "m_nLensesState=" + m_nLensesState);
			
        int nLensesState = m_nLensesState,
            nSpeedLimit = 0;                            
        				
		if (nLensesState < 0) nLensesState = 0;
		
		if (m_lenseTypes[nLensesState])
		{
            m_signal.SetLensesState(m_lenseTypes[nLensesState].getLenses(), m_signal.AUTOMATIC, nSpeedLimit);
		}
        else
        {
            m_signal.SetLensesState(new string[0], m_signal.AUTOMATIC, nSpeedLimit);
        }
    }
	
	public bool IsShuntMode() 
	{ 
		return true;
	}
	
	void GetAlsData(Soup db)
	{
		db.SetNamedTag("MSig-als-fq", ZmvAls.ALS_OC);
	}
		
    int CalcFreeBlocks()
    {
        return 0;
    }
};
