include "trackmark.gs"

class ZmvMarker isclass TrackMark
{
	define int MIN_FREE_BLOCKS = 0;
	define int MAX_FREE_BLOCKS = 10;

    bool IsMRM, IsMRC, IsMRT, IsMRS;
	int Fr0, Fr40, Fr60, Fr70, Fr80;
	Soup m_soup = null;
	bool m_handler = false;
	int  RouteIndex, RouteIndex2;
	string m_sMRNRoute, m_sMRNRoute2;
	
	int toFrValue(int fr) 
	{
		if (fr < MIN_FREE_BLOCKS) return MIN_FREE_BLOCKS;
		if (fr > MAX_FREE_BLOCKS) return MAX_FREE_BLOCKS;
		return fr;
	}

	int toRouteIndex(string val)
	{
		int res = Str.ToInt(val);
		
		//Interface.Print("toRouteIndex: val="+val);		
		
		if (res != 0) 
		{
			if (res >= 10) res = res + 10;
		}
		else if (val == "А") res = 10;
		else if (val == "Б") res = 11;
		else if (val == "В") res = 12;
		else if (val == "Г") res = 13;
		else if (val == "Д" or val == "d") res = 0;
		else if (val == "Е") res = 14;
		else if (val == "Ж") res = 15;
		else if (val == "З") res = 3;
		else if (val == "И") res = 16;
		else if (val == "К") res = 17;
		else if (val == "Л") res = 18;
		else if (val == "М") res = 19;
		else if (val == "Н") res = 30;
		else if (val == "О") res = 31;
		else if (val == "П") res = 32;
		else if (val == "Р") res = 33;
		else if (val == "С") res = 34;
		else if (val == "Т") res = 35;
		else if (val == "У") res = 36;
		else if (val == "Ф") res = 37;
		else if (val == "Х") res = 38;
		else if (val == "Ц") res = 39;
		else if (val == "Ч") res = 40;
		else if (val == "Ш") res = 41;
		else if (val == "Щ") res = 42;
		else if (val == "Э") res = 43;
		else if (val == "Ю") res = 44;
		else if (val == "Я") res = 45;
		else if (val == "|") res = 46;
		else if (val == "-") res = 47;
		else if (val == "/") res = 48;
		else if (val == "\\") res = 49;
		else res = -1;
		
		return res;
	}
	
	string ToMRNRoute(int val)
	{
		string res;
		
		if (val >= 1 and val <= 9) res = (string)val;
		else if (val >= 20 and val <= 29) res = (string)(val-10);
		else if (val == 10) res = "А";
		else if (val == 11) res = "Б";
		else if (val == 12) res = "В";
		else if (val == 13) res = "Г";
		else if (val == 0)  res = "Д";
		else if (val == 14) res = "Е";
		else if (val == 15) res = "Ж";
		else if (val == 16) res = "И";
		else if (val == 17) res = "К";
		else if (val == 18) res = "Л";
		else if (val == 19) res = "М";
		else if (val == 30) res = "Н";
		else if (val == 31) res = "О";
		else if (val == 32) res = "П";
		else if (val == 33) res = "Р";
		else if (val == 34) res = "С";
		else if (val == 35) res = "Т";
		else if (val == 36) res = "У";
		else if (val == 37) res = "Ф";
		else if (val == 38) res = "Х";
		else if (val == 39) res = "Ц";
		else if (val == 40) res = "Ч";
		else if (val == 41) res = "Ш";
		else if (val == 42) res = "Щ";
		else if (val == 43) res = "Э";
		else if (val == 44) res = "Ю";
		else if (val == 45) res = "Я";
		else if (val == 46) res = "|";
		else if (val == 47) res = "-";
		else if (val == 48) res = "/";
		else if (val == 49) res = "\\";
		else res = "";
		
		return res;
	}
		
	void Update()
	{
		string s = "";
		bool hasRoute = (m_sMRNRoute != ""),
			 hasRoute2 = (m_sMRNRoute2 != "");
		
        if (IsMRM)          s = "M";
        else if (IsMRC)     s = "C";
        else if (IsMRT)     s = "T";
		else if (IsMRS)     s = "S";
		
        if (hasRoute or hasRoute2)
		{
			s = s + ",N-";
			if (hasRoute)
			{
				s = s + m_sMRNRoute;
				if (hasRoute2)
					s = s + ",";
			}
			if (hasRoute2)
				s = s + m_sMRNRoute2;
		}

        SetFXNameText("name0",s);
	}

    void normalizeProperties()
    {
        if (!IsMRS and !IsMRT and !IsMRM and !IsMRC)
            IsMRM = true;    
    }
	
	public void TrainLeft(Message msg)
	{
		//Interface.Print("TrainLeft:m_soup="+(m_soup!=null));
		
		if (m_soup)
		{
			SetProperties(m_soup);
			m_soup = null;
		}
	}
	
	public Soup GetProperties()
	{
 		Soup sp=inherited();

		sp.SetNamedTag("mrm", IsMRM); 
		sp.SetNamedTag("mrc", IsMRC); 
		sp.SetNamedTag("mrt", IsMRT); 
		sp.SetNamedTag("mrs", IsMRS); 
		sp.SetNamedTag("rIndex", RouteIndex); 
		sp.SetNamedTag("rIndex2", RouteIndex2); 
		sp.SetNamedTag("fr0",  Fr0);
		sp.SetNamedTag("fr40", Fr40);
		sp.SetNamedTag("fr60", Fr60);
		sp.SetNamedTag("fr70", Fr70);
		sp.SetNamedTag("fr80", Fr80);
 		return sp;
	}

	public void SetProperties(Soup db)
	{
 		inherited(db);
		bool dop = (db.GetIndexForNamedTag("route2") >= 0);
		if (!dop and db.GetIndexForNamedTag("temp") >= 0)
		{
			m_soup = GetProperties();
			if (!m_handler)
			{
				AddHandler(me, "Object", "Leave", "TrainLeft");
				m_handler = true;
			}
		}
		
		if (!dop)
		{
			IsMRM = db.GetNamedTagAsBool("mrm", false);
			IsMRC = db.GetNamedTagAsBool("mrc", false);
			IsMRT = db.GetNamedTagAsBool("mrt", false);
			IsMRS = db.GetNamedTagAsBool("mrs", false);
			RouteIndex = db.GetNamedTagAsInt("rIndex", -1);
			if (RouteIndex < 0)
			{
				m_sMRNRoute = db.GetNamedTag("route");
				RouteIndex = toRouteIndex(m_sMRNRoute);
			}
			else
			{
				m_sMRNRoute = ToMRNRoute(RouteIndex);
			}
			RouteIndex2 = db.GetNamedTagAsInt("rIndex2", -1);
			if (RouteIndex2 >= 0)
				m_sMRNRoute2 = ToMRNRoute(RouteIndex2);
			else
				m_sMRNRoute2 = "";
			
			Fr0  = db.GetNamedTagAsInt("fr0",  1);
			Fr40 = db.GetNamedTagAsInt("fr40", 2);
			Fr60 = db.GetNamedTagAsInt("fr60", 3);
			Fr70 = db.GetNamedTagAsInt("fr70", 4);
			Fr80 = db.GetNamedTagAsInt("fr80", 5);

			if (IsMRM)      IsMRT = IsMRS = IsMRC = false;
			else if (IsMRC) IsMRM = IsMRS = IsMRT = false;
			else if (IsMRT) IsMRM = IsMRS = IsMRC = false;
			else if (IsMRS) IsMRT = IsMRM = IsMRC = false;

			normalizeProperties();        
		}
		else
		{
			m_sMRNRoute2 = db.GetNamedTag("route2");
			RouteIndex2 = toRouteIndex(m_sMRNRoute2);
		}

		Update();
 	}

    string getPropertyTitleHTML(string title);
    string getPropertyHTML(string name, string value, string valueId);

    string getContent(StringTable ST)
	{
        return  getPropertyTitleHTML(ST.GetString("marker-type-desc")) +
                getPropertyHTML(ST.GetString("marker-type-mrm"), IsMRM, "IsMRM") +
                getPropertyHTML(ST.GetString("marker-type-mrc"), IsMRC, "IsMRC") +
                getPropertyHTML(ST.GetString("marker-type-mrt"), IsMRT, "IsMRT") +
                getPropertyHTML(ST.GetString("marker-type-mrs"), IsMRS, "IsMRS") +
				getPropertyTitleHTML(ST.GetString("numtrack-desc")) +
                getPropertyHTML(ST.GetString("numtrack-value"),  m_sMRNRoute, "r") +
                getPropertyHTML(ST.GetString("numtrack2-value"), m_sMRNRoute2, "r2") +
				getPropertyTitleHTML(ST.GetString("als-fr-desc")) +
                getPropertyHTML("0",  Fr0,  "Fr0") +
                getPropertyHTML("40", Fr40, "Fr40") +
                getPropertyHTML("60", Fr60, "Fr60") +
                getPropertyHTML("70", Fr70, "Fr70") +
                getPropertyHTML("80", Fr80, "Fr80");
	}

    //HTML ================================================================================================================
    string getPropertyTitleHTML(string title)
    {
        return HTMLWindow.MakeRow(HTMLWindow.MakeCell("<i><b><font color=#e3f708>  " + title + "</font></b></i>","bgcolor=#555555"));
    }

    string getPropertyHTML(string name, string value, string valueId)
    {
        string link = "live://property/" + valueId;
        return HTMLWindow.MakeRow(HTMLWindow.MakeCell(HTMLWindow.MakeLink(link, "<font color=#cede20>"+name+"</font>"),"bgcolor=#555555")+
    			                  HTMLWindow.MakeCell(HTMLWindow.MakeLink(link, "<font color=#cede20>"+value+"</font>"),"bgcolor=#777777"));
    }

    public string GetDescriptionHTML()
	{
		StringTable ST = GetAsset().GetStringTable();

        string str = "<html><body><font color=#ccee00 size=13><p>" + ST.GetString("object-name") + "</p></font><br>" +
                     HTMLWindow.MakeTable(getContent(ST), "width=100% border=1 cellspacing=1") +
                     "</body></html>";		
        
        Update();
       	return str;
	}
    //=======================================================================================================================================    
 	public string GetPropertyType(string id)
	{
		if (id == "r" or id == "r2") return "string,0,2";
		if (id == "Fr0" or id == "Fr40" or id == "Fr60" or id == "Fr70" or id == "Fr80") return "int";		
 		return "link";
	}

 	public string GetPropertyName(string id)
	{
		if (id == "r" or id == "r2")
 			return GetAsset().GetStringTable().GetString("param-route");
		return GetAsset().GetStringTable().GetString2("param-fr", MIN_FREE_BLOCKS, MAX_FREE_BLOCKS);
	}

	public string GetPropertyValue(string id) 
	{
		if (id == "Fr0")  return (string)Fr0;
		if (id == "Fr40") return (string)Fr40;
		if (id == "Fr60") return (string)Fr60;
		if (id == "Fr70") return (string)Fr70; 
		if (id == "Fr80") return (string)Fr80;
		if (id == "r")	  return m_sMRNRoute;
		if (id == "r2")	  return m_sMRNRoute2;
		return "";
	}

 	public void LinkPropertyValue(string id)
	{
		inherited(id);

 		if (id == "IsMRM")
        {
            IsMRM = !IsMRM;
            if (IsMRM) IsMRT = IsMRS = IsMRC = false;
        }
        else if (id == "IsMRC") 
        {
            IsMRC = !IsMRC;
            if (IsMRC) IsMRM = IsMRS = IsMRT = false;
        }
 		else if (id == "IsMRT") 
        {
            IsMRT = !IsMRT;
            if (IsMRT) IsMRM = IsMRS = IsMRC = false;
        }
 		else if (id == "IsMRS")
        {
            IsMRS = !IsMRS;
            if (IsMRS) IsMRT = IsMRM = IsMRC = false;
        }

        normalizeProperties();        
 	}

	public void SetPropertyValue(string id, string val)
	{
		inherited(id,val);
		
		if (id == "r")
		{
			RouteIndex = toRouteIndex(val);
			m_sMRNRoute = ToMRNRoute(RouteIndex);
		}
		else
		{
			RouteIndex2 = toRouteIndex(val);
			m_sMRNRoute2 = ToMRNRoute(RouteIndex2);
		}
		
		//Interface.Print("SetPropertyValue:id="+id+",RouteIndex="+RouteIndex+",m_sMRNRoute="+m_sMRNRoute);		
 	}

	public void SetPropertyValue(string id, int val)
	{
		int frValue = toFrValue(val);
		if (id == "Fr0") Fr0 = frValue;
		else if (id == "Fr40") Fr40 = frValue; 
		else if (id == "Fr60") Fr60 = frValue;
		else if (id == "Fr70") Fr70 = frValue; 
		else Fr80 = frValue;
 	}

	//============ API ===============================
    public bool IsMain() {return IsMRM;}
    public bool IsClosed() {return IsMRC;}
    public bool IsTurn() {return IsMRT;}
    public bool IsManeuver() {return IsMRS;}
    public string GetRouteNumber()
	{
		return (string)RouteIndex;
	}
    public string GetRouteNumber2() 
	{
		return (string)RouteIndex2;
	}
	public int GetAlsFreeBlocks(int fr) 
	{
		switch (fr)
		{
			case 0:  return Fr0;
			case 40: return Fr40;
			case 60: return Fr60;
			case 70: return Fr70;
			case 80: return Fr80;
			default: break;
		}
		return -1;
	}
	void CommandException()
	{
		Interface.Exception("Path Command expected: 'SetPath^Main|Turn|Shunt|Closed[^n1[^n2]]' ");
	}	
	public void OnCommand(Message msg)
	{
	//Interface.Print("minor="+msg.minor);
		string[] tokens = Str.Tokens(msg.minor, "^");		
		string cmd = tokens[0];
		Str.ToUpper(cmd);		
		int len = tokens.size();
		if (len < 2 or len > 4 or cmd != "SETPATH")
		{
			CommandException();
			return;
		}
		Soup db = Constructors.NewSoup();
		cmd = tokens[1];
		Str.ToUpper(cmd);		
		db.SetNamedTag("temp", true);
		db.SetNamedTag("mrm", (cmd == "MAIN"));
		db.SetNamedTag("mrc", (cmd == "CLOSED"));
		db.SetNamedTag("mrt", (cmd == "TURN"));
		db.SetNamedTag("mrs", (cmd == "SHUNT"));
		db.SetNamedTag("mrd", false);
		db.SetNamedTag("mrn", false);
		if (len > 2)
			db.SetNamedTag("route", tokens[2]);
		SetProperties(db);
		if (len > 3)
		{
			Soup db = Constructors.NewSoup();
			db.SetNamedTag("temp", true);
			db.SetNamedTag("route2", tokens[3]);
			SetProperties(db);
		}		
	}	
	//================================================
	public void Init(Asset self)
	{
       inherited(self);
	   AddHandler(me, "CTRL", "", "OnCommand");
	}
};