include "zmvRoutePointer.gs"
include "KM_SignalTables.gs"
include "ZmvMarker.gs"

class KM_SignalRoutePointer isclass KM_SignalTables
{
	ZmvRoutePointer m_RoutePointer;
    //Print =================================================================================================================
    void Print(string method, string s)
    {
        print("ZmvSignalRoutePointer::" + method, s);
    }     
    //=====================================================================================================================
	public void SetProperties(Soup db)
	{
		inherited(db);
		m_RoutePointer.Init(m_lensesLibrary.GetAssetRP(), "m");
	}
	
    public void ClrRouteNumber() 
    {
        if (m_bDebug) Print("ClrRouteNumber", "");
        m_RoutePointer.ClearLenses(me);
    }

    public void SetRouteNumber(ZmvMarker marker) 
    {
        string value = marker.GetRouteNumber();
		if (m_bDebug) Print("SetRouteNumber", "val="+value);
        m_RoutePointer.SetLenses(me, value);
    }    
	
    public void Init()
    {
		inherited();
		m_RoutePointer = new ZmvRoutePointer();
	}
};

class KM_SignalRoutePointer2 isclass KM_SignalRoutePointer
{
	ZmvRoutePointer m_RoutePointer2;
    //Print =================================================================================================================
    void Print(string method, string s)
    {
        print("ZmvSignalRoutePointer2::" + method, s);
    }     
    //=====================================================================================================================
	public void SetProperties(Soup db)
	{
		inherited(db);
		m_RoutePointer2.Init(m_lensesLibrary.GetAssetRP2(), "m2-");
	}
	
    public void ClrRouteNumber() 
    {
        inherited();
		if (m_bDebug) Print("ClrRouteNumber", "");
        m_RoutePointer2.ClearLenses(me);
    }

    public void SetRouteNumber(ZmvMarker marker) 
    {
        inherited(marker);
		
		string value = marker.GetRouteNumber2();
		if (m_bDebug) Print("SetRouteNumber", "val="+value);
        m_RoutePointer2.SetLenses(me, value);
    }    
	
    public void Init()
    {
		inherited();
		m_RoutePointer2 = new ZmvRoutePointer();
	}	
};
