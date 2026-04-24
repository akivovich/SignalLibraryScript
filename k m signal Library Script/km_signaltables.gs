include "zmvsignal.gs"
include "km_tables.gs"

class KM_SignalTables isclass ZmvSignal
{
    string m_name;

	public Soup GetProperties()
	{
        if (m_bDebug) Print("GetProperties", "");        
 		Soup db=inherited();

		db.SetNamedTag("name", m_name); 
 		db.SetNamedTag("privateName", m_name);

        return db;
	}

	public void SetProperties(Soup db)
	{
        if (m_bDebug) Print("SetProperties", "");        
		m_name = db.GetNamedTag("name");
        inherited(db);
 	}

    string getNamesContent(StringTable ST)
	{
        return  m_signalLibrary.GetPropertyHTML(ST.GetString("signal-name"), m_name, "name", false);
    }
    
    string GetNamesContentBase(StringTable ST)
    {
        return m_signalLibrary.GetPropertyTitleHTML(ST.GetString("signal-names")) + getNamesContent(ST);
    }

    public void SetPropertyValue(string id, string val)
	{
        if (m_bDebug) Print("SetPropertyValue(string)","id="+id+", val="+val);

        if (id == "name")           m_name = val;
        else inherited(id, val);
 	}

 	public string GetPropertyType(string id)
	{
        if (m_bDebug) Print("GetPropertyType","id="+id);
        if (id == "name") return "string";
        return inherited(id);
	}

 	public string GetPropertyValue(string id)
	{
        if (m_bDebug) Print("GetPropertyType","id="+id);        
        if (id == "name")  return m_name;
        return inherited(id);
	}    

 	public string GetPropertyName(string id)
	{
        if (m_bDebug) Print("GetPropertyName","id="+id);
        
        if (id == "name")
            return GetAsset().GetStringTable().GetString("signal-name");

        return inherited(id);
	}

    void UpdateTables()
    {
        KM_Tables.SetName(me, m_name);
    }

    void InitTables(Soup config)
    {
        if (m_bDebug) Print("InitTables", "");

        Soup effects = config.GetNamedSoup("extensions");
        int  nTables = effects.GetNamedTagAsInt("tables_num", 0);

        KM_Tables.Init(me, nTables);
    }
    
    public string GetTableString() 
    { 
        return m_name; 
    }

    public void SetTableString(string name) 
    {
        m_name = name;
        KM_Tables.SetName(me, m_name);
    }
};