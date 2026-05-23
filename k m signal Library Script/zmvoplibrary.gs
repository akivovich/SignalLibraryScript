include "zmvcommonlibrary.gs"

//ZmvOPLibrary ==============================================================================================================
class ZmvOPLibrary isclass ZmvBaseLibrary
{
	public string GetPropertyTitleHTML(string title)
	{
		return inherited(title);
	}
    
    string GetModeContentForEditor(StringTable ST)
    {
        return "";
    }

    string GetAlsCodesContent(StringTable ST) 
	{
		return "";
	}

    public void SetPropagatedPropertiesInEditor(Soup soup, string par, bool all) 
    {
		inherited(soup, par, all);
		if (all or par == "mode")
		{
			m_bAutoblockProp = m_bAutoblockCurrent = true;
		}
		if (all or par == "useCodes")
		{
			m_bUseAlsCodes = false;
		}
    }

	string GetAutoModeContent(StringTable ST)
	{
		return "";
	}
    //=====================================================================================================================
	int  GetCheckerInterval()
	{
		return 0;
	}
    
	int  GetSignalStateByLensesState()
    {
		return m_signal.RED;
	}

	void UpdateLensesState(bool force)
	{
		m_nLensesState = ZmvSignalTypes.R;
		if (force) ShowLenses();
	}

	int  GetCurrentSpeedLimit()
	{
		return 0;
	}

    public bool IsProhodnoy()
    {
        return false;
    }
	
	void GetAlsData(Soup db)
	{
		db.SetNamedTag("MSig-als-fq", ZmvAls.ALS_OC);
	}
		
    int CalcFreeBlocks()
    {
        return 0;
    }

	bool UpdateAlsCode()
	{
		m_nAlsCode = ZmvAls.ALS_OC;
		return false;
	}
};

//ZmvRWLibrary ==============================================================================================================
class ZmvRWLibrary isclass ZmvOPLibrary
{
	int  GetCurrentSpeedLimit()
	{
		if (m_bPS) return 20;
		return 0;
	}
};

//ZmvDOPLibrary ==============================================================================================================
class ZmvDOPLibrary isclass ZmvOPLibrary
{
	int  GetCheckerInterval()
	{
		if (m_bDebug) Print("GetCheckerInterval", "m_enteredTrain="+!!m_enteredTrain);
		if (m_enteredTrain) return 2;
		return 0;
	}

	void UpdateLensesState(bool force)
	{
		int cur = m_nLensesState;
		if (!m_enteredTrain) m_nLensesState = ZmvSignalTypes.Off;
		else 
		{
			if (m_bNextVehicle or !m_nextObject) m_nLensesState = ZmvSignalTypes.R;
			else								 m_nLensesState = ZmvSignalTypes.Off;
		}
		if (m_bDebug) Print("UpdateLensesState", "force="+force+",cur="+cur+",m_nLensesState="+m_nLensesState+",m_bNextVehicle="+m_bNextVehicle+",m_nextObject="+!!m_nextObject);
		if (force or cur != m_nLensesState) ShowLenses();
	}

	void UpdateVisualState(bool force)
	{
		UpdateLensesState(force);
	}

	int  GetCurrentSpeedLimit()
	{
		if (m_nLensesState == ZmvSignalTypes.Off) return 20;
		return 0;
	}

	int  GetSignalStateByLensesState()
    {
		if (m_nLensesState == ZmvSignalTypes.Off) return m_signal.YELLOW;
		return m_signal.RED;
	}

	public void ObjectEnter(Message msg) 
	{
        inherited(msg);		
		if (!m_enteredTrain) return;
        updateSignalStateInt(true);
	}
	
	// public void ObjectLeave(Message msg) 
	// {
    //     inherited(msg);
        
	// }
};
