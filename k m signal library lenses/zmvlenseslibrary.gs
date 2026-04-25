include "ZmvLensesLibraryInterface.gs"
include "zmvconsts.gs"

class LensesSet
{
    public Asset m_red = null;
    public Asset m_yellow = null;
    public Asset m_green = null;
    public Asset m_white = null;
    public Asset m_blue = null;
};

static class ZmvLensesRepository
{
	bool m_bInit = false;
	LensesSet[] m_LensesSet;
    Asset[] m_rp;
		
	int GetLenseTypesMax(Asset asset)
	{
		Soup soup = asset.GetConfigSoup().GetNamedSoup("extensions");
		return soup.GetNamedTagAsInt("type-max");
	}
	
	void InitLensesSet(Asset asset)
	{
		int i, len = GetLenseTypesMax(asset);
		m_LensesSet = new LensesSet[len];
		LensesSet lensesSet;
		string suf;
		for (i = 0; i < len; i++)
		{
			lensesSet = m_LensesSet[i] = new LensesSet();
			suf = "-" + i;
			lensesSet.m_red = asset.FindAsset(ZmvLenseTypes.skR+suf);
			lensesSet.m_yellow = asset.FindAsset(ZmvLenseTypes.skY+suf);
			lensesSet.m_green = asset.FindAsset(ZmvLenseTypes.skG+suf);
			lensesSet.m_white = asset.FindAsset(ZmvLenseTypes.skW+suf);
			lensesSet.m_blue = asset.FindAsset(ZmvLenseTypes.skB+suf);			
		}
	}
	
	void InitRoutePointers(Asset asset)
	{
		m_rp = new Asset[ZmvRoutePointerColor.Max];
		m_rp[ZmvRoutePointerColor.White] = asset.FindAsset(ZmvLenseTypes.skWrp);
		m_rp[ZmvRoutePointerColor.Orange] = asset.FindAsset(ZmvLenseTypes.skOrp);
		m_rp[ZmvRoutePointerColor.Green] = asset.FindAsset(ZmvLenseTypes.skGrp);
	}

	//initialization
    public void Init(Asset asset)
    {
		if (!m_bInit)
		{
			m_bInit = true;
			InitLensesSet(asset);
			InitRoutePointers(asset);						
		}
    }
		
    public Asset GetAssetRP(int rp_color)
    { 
		return m_rp[rp_color];
    }

    public Asset[] GetAssets(int type, string[] lenses)
    {
        LensesSet lensesSet = m_LensesSet[type];
		int i, len = lenses.size();
        string lense;
        Asset[] assets = new Asset[len];

        for (i = 0; i < len; i++)
        {
            lense = lenses[i];
    //Interface.Print("ZmvLensesAsset::ShowLenses "+lense);
            if (lense == ZmvLenseTypes.scR)         assets[i] = lensesSet.m_red;
            else if (lense == ZmvLenseTypes.scB)    assets[i] = lensesSet.m_blue;
            else if (lense == ZmvLenseTypes.scY)    assets[i] = lensesSet.m_yellow;
            else if (lense == ZmvLenseTypes.scYd)   assets[i] = lensesSet.m_yellow;
            else if (lense == ZmvLenseTypes.scG)    assets[i] = lensesSet.m_green;
            else if (lense == ZmvLenseTypes.scYt)   assets[i] = lensesSet.m_yellow;
            else if (lense == ZmvLenseTypes.scYf)   assets[i] = lensesSet.m_yellow;
            else                                    assets[i] = lensesSet.m_white;
        }        
        return assets;
    }
};

class ZmvLensesPlus isclass ZmvLensesInterface
{
    string[] m_lenseTypes = new string[0];
	string[] m_routePointerColors = new string[0];

    bool m_bDebug;
    Asset m_asset;
	int  m_nType, m_nRoutePointerColor, m_nRoutePointer2Color;
    bool m_bInvisible;
	bool m_bRoutePointer, m_bRoutePointer2;
    
    void Print(string method, string s)
    {
        Interface.Print("ZmvLensesLibrary::"+method+":"+s);
    }

    void Print(string method, string[] s)
    {
        int i, len = s.size();
        for (i = 0; i < len; i++)
        {
            Print(method, s[i]);
        }
    }

    public void Init(Asset asset) 
    {
		m_asset = asset;
		ZmvLensesRepository.Init(asset);		
    }

    public void Init(Soup config) 
    {
        Soup options = config.GetNamedSoup("extensions");
		m_bInvisible = config.GetNamedTagAsBool("surveyor-only", false);
		m_bDebug = options.GetNamedTagAsBool("debug-lenses", false);
		Soup mesh = config.GetNamedSoup("mesh-table").GetNamedSoup("default").GetNamedSoup("effects");

		m_bRoutePointer = (mesh.GetNamedSoup("m11").CountTags() != 0);
		m_bRoutePointer2 = (mesh.GetNamedSoup("m2-11").CountTags() != 0);
        if (m_bDebug) Print("Init","m_nType="+m_nType);
    }

    public Asset GetAssetRP()
    { 
        if (m_bDebug) Print("GetAssetRP","m_nType="+m_nType+",m_nRoutePointerColor="+m_nRoutePointerColor);
        return ZmvLensesRepository.GetAssetRP(m_nRoutePointerColor);
    }

    public Asset GetAssetRP2()
    { 
        if (m_bDebug) Print("GetAssetRP2","m_nType="+m_nType+",m_nRoutePointer2Color="+m_nRoutePointer2Color);
        return ZmvLensesRepository.GetAssetRP(m_nRoutePointer2Color);
    }

    public Asset[] GetAssets(string[] lenses) 
    {
        if (m_bDebug) 
		{
			Print("GetAssets","m_nType="+m_nType);
			Print("GetAssets", lenses);
		}
        return ZmvLensesRepository.GetAssets(m_nType, lenses);
    }
    //Properties
    string[] getLenseTypes(StringTable ST)
    {        
        string type;
        string[] res = new string[0];
        int i = 0;

        while (true)
        {
            type = ST.GetString("type-"+i);
            if (type == "") break;
            res[res.size()] = type;
            i++;
        }
        return res;
    }
	
	string[] getRoutePointerColors(StringTable ST)
	{
		string[] res = new string[ZmvRoutePointerColor.Max];		
		res[ZmvRoutePointerColor.White] = ST.GetString("pointer-color-w");
		res[ZmvRoutePointerColor.Orange] = ST.GetString("pointer-color-o");
		res[ZmvRoutePointerColor.Green] = ST.GetString("pointer-color-g");
		return res;
	}
	
    public void GetProperties(Soup db) 
    {
        db.SetNamedTag("lenses-type", m_nType);
		if (m_bRoutePointer)
			db.SetNamedTag("route-pointer-color", m_nRoutePointerColor);
		if (m_bRoutePointer2)
			db.SetNamedTag("route-pointer2-color", m_nRoutePointer2Color);
        if (m_bDebug) Print("GetProperties","m_nType="+m_nType+",m_nRoutePointerColor="+m_nRoutePointerColor+",m_nRoutePointer2Color="+m_nRoutePointer2Color);
    }

    public void SetProperties(Soup db, Soup neighborDb) 
    {
        bool bNewAsset = (db.GetIndexForNamedTag("lenses-type") < 0 and neighborDb.GetIndexForNamedTag("lenses-type") >= 0);
		
		if (bNewAsset)	
		{
			m_nType = neighborDb.GetNamedTagAsInt("lenses-type");
			if (m_bRoutePointer)
				m_nRoutePointerColor = neighborDb.GetNamedTagAsInt("route-pointer-color", ZmvRoutePointerColor.White);
			else
				m_nRoutePointerColor = -1;
			
			if (m_bRoutePointer2)
				m_nRoutePointer2Color = neighborDb.GetNamedTagAsInt("route-pointer2-color", ZmvRoutePointerColor.White);
			else
				m_nRoutePointer2Color = -1;
		}
		else
		{
			m_nType = db.GetNamedTagAsInt("lenses-type", m_nType);
			if (m_bRoutePointer)
				m_nRoutePointerColor = db.GetNamedTagAsInt("route-pointer-color", ZmvRoutePointerColor.White);
			else
				m_nRoutePointerColor = -1;
				
			if (m_bRoutePointer2)
				m_nRoutePointer2Color = db.GetNamedTagAsInt("route-pointer2-color", ZmvRoutePointerColor.White);
			else
				m_nRoutePointer2Color = -1;
		}
        
        if (m_bDebug) Print("SetProperties","m_nType="+m_nType+",m_nRoutePointerColor="+m_nRoutePointerColor+",m_nRoutePointer2Color="+m_nRoutePointer2Color);
    }

    public string GetPropertyTitleHTML(string title)
    {
        return HTMLWindow.MakeRow(HTMLWindow.MakeCell("<i><b><font color=#e3f708>  " + title + "</font></b></i>","bgcolor=#555555"));
    }

    public string GetPropertyHTML(string name, string value, string valueId)
    {
        string link = "live://property/" + valueId;
        string content = HTMLWindow.MakeCell(HTMLWindow.MakeLink(link, "<font color=#cede20>"+name+"</font>"),"bgcolor=#555555")+
    			         HTMLWindow.MakeCell(HTMLWindow.MakeLink(link, "<font color=#cede20>"+value+"</font>"),"bgcolor=#777777");
        return HTMLWindow.MakeRow(content);
    }

    public string GetPropertiesContent() 
    {
        if (m_bInvisible)
			return "";
		string s = "";
		StringTable mST = m_asset.GetStringTable();
        if (m_lenseTypes.size() == 0)
            m_lenseTypes = getLenseTypes(mST);
        if (m_lenseTypes.size() != 0)		
			s = GetPropertyTitleHTML(mST.GetString("types")) + GetPropertyHTML(mST.GetString("type"), m_lenseTypes[m_nType], "lenses");
		
		if (m_bRoutePointer)
		{
			if (m_routePointerColors.size() == 0)
			{
				m_routePointerColors = getRoutePointerColors(mST);
			}
			s = s + GetPropertyTitleHTML(mST.GetString("pointer-colors")) + GetPropertyHTML(mST.GetString("color"), m_routePointerColors[m_nRoutePointerColor], "rpc");
			if (m_bRoutePointer2)
			{
				s = s + GetPropertyTitleHTML(mST.GetString("pointer2-colors")) + GetPropertyHTML(mST.GetString("color"), m_routePointerColors[m_nRoutePointer2Color], "rpc2");
			}
		}		
		return s;
    }
    
    public bool HasProperty(string id) 
	{
		return (id == "lenses" or id == "rpc" or id == "rpc2");
	}
	
    public string[] GetPropertyElementList(string id) 
    {
        if (m_bDebug) Print("GetPropertyElementList","id="+id);
        if (id == "lenses") return m_lenseTypes;
		if (id == "rpc" or id == "rpc2") return m_routePointerColors;
        return new string[0];
    }

    public void SetPropertyValue(string id, string val, int index) 
    {
        if (m_bDebug) Print("SetPropertyValue","id="+id+",val="+val+",index=="+index);
        if (id == "lenses") 	m_nType = index;
		else if (id == "rpc")	m_nRoutePointerColor = index;
		else if (id == "rpc2")	m_nRoutePointer2Color = index;
    }

    public string GetPropertyValue(string id) 
    {
        if (m_bDebug) Print("GetPropertyValue","id="+id);
        if (id == "lenses") return (string)m_nType;
		if (id == "rpc")	return (string)m_nRoutePointerColor;
		/*if (id == "rpc2")*/	return (string)m_nRoutePointer2Color;
    }

 	public string GetPropertyType(string id) 
    {
		string res = "";
        if (id == "lenses" or id == "rpc" or id == "rpc2") res = "list";
        if (m_bDebug) Print("GetPropertyType","id="+id+",res="+res);
        
		return res; 
    }

 	public string GetPropertyName(string id) 
    {
        if (m_bDebug) Print("GetPropertyName","id="+id);
		if (id == "lenses") return m_asset.GetStringTable().GetString("param-lenses");
		if (id == "rpc" or id == "rpc2") return m_asset.GetStringTable().GetString("param-pointer");
        return ""; 
	}
};

class ZmvLensesLibrary isclass ZmvLensesLibraryInterface
{
    public ZmvLensesInterface GetInstance() 
    {
        ZmvLensesPlus lenses = new ZmvLensesPlus();
        lenses.Init(GetAsset());        
        return cast<ZmvLensesInterface>(lenses);
    }
};
