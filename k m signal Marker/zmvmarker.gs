include "trackmark.gs"

class ZmvMarker isclass TrackMark
{
	define int ALS_0  = 0;
	define int ALS_OC = 1;
	define int ALS_AO = 2;
	define int ALS_40 = 4;
	define int ALS_60 = 6;
	define int ALS_70 = 7;
	define int ALS_80 = 8;
	define int MIN_FREE_BLOCKS = 0;
	define int MAX_FREE_BLOCKS = 10;

    bool m_bIsMRM, m_bIsMRC, m_bIsMRT, m_bIsMRS;
	int m_nFr0, m_nFr40, m_nFr60, m_nFr70, m_nFr80;
	Soup m_soup = null;
	bool m_handler = false;
	int  m_nRouteIndex, m_nRouteIndex2;
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
		
//Interface.Print("ZmvMarker::toRouteIndex: val="+val+",res="+res);

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
		
//Interface.Print("ZmvMarker::ToMRNRoute: val="+val+",res="+res);
		return res;
	}
		
	void Update()
	{
		string s = "";
		bool hasRoute = (m_sMRNRoute != ""),
			 hasRoute2 = (m_sMRNRoute2 != "");
		
        if (m_bIsMRM)          s = "M";
        else if (m_bIsMRC)     s = "C";
        else if (m_bIsMRT)     s = "T";
		else if (m_bIsMRS)     s = "S";
		
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

    void normalizeProperties(bool alsoCodes)
    {
        if (!m_bIsMRS and !m_bIsMRT and !m_bIsMRM and !m_bIsMRC)
            m_bIsMRM = true;
		if (!alsoCodes) return;
		if (m_bIsMRS or m_bIsMRT)
		{
			m_nFr0 = 1;
			m_nFr40 = 2;
			m_nFr60 = m_nFr70 = m_nFr80 = 0;
		}
		else if (m_bIsMRC)
		{
			m_nFr0 = m_nFr40 = m_nFr60 = m_nFr70 = m_nFr80 = 0;
		}
		else //if (m_bIsMRM)
		{
			m_nFr0  = 1;
			m_nFr40 = 2;
			m_nFr60 = 3;
			m_nFr70 = 4;
			m_nFr80 = 5;
		}
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

		sp.SetNamedTag("mrm", m_bIsMRM); 
		sp.SetNamedTag("mrc", m_bIsMRC); 
		sp.SetNamedTag("mrt", m_bIsMRT); 
		sp.SetNamedTag("mrs", m_bIsMRS); 
		sp.SetNamedTag("rIndex", m_nRouteIndex); 
		sp.SetNamedTag("rIndex2", m_nRouteIndex2); 
		sp.SetNamedTag("fr0",  m_nFr0);
		sp.SetNamedTag("fr40", m_nFr40);
		sp.SetNamedTag("fr60", m_nFr60);
		sp.SetNamedTag("fr70", m_nFr70);
		sp.SetNamedTag("fr80", m_nFr80);
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
			m_bIsMRM = db.GetNamedTagAsBool("mrm", false);
			m_bIsMRC = db.GetNamedTagAsBool("mrc", false);
			m_bIsMRT = db.GetNamedTagAsBool("mrt", false);
			m_bIsMRS = db.GetNamedTagAsBool("mrs", false);
			m_nRouteIndex = db.GetNamedTagAsInt("rIndex", -1);
			if (m_nRouteIndex < 0)
			{
				m_sMRNRoute = db.GetNamedTag("route");
				m_nRouteIndex = toRouteIndex(m_sMRNRoute);
			}
			else
			{
				m_sMRNRoute = ToMRNRoute(m_nRouteIndex);
			}
			m_nRouteIndex2 = db.GetNamedTagAsInt("rIndex2", -1);
			if (m_nRouteIndex2 >= 0)
				m_sMRNRoute2 = ToMRNRoute(m_nRouteIndex2);
			else
				m_sMRNRoute2 = "";
			
			m_nFr0  = db.GetNamedTagAsInt("fr0",  1);
			m_nFr40 = db.GetNamedTagAsInt("fr40", 2);
			m_nFr60 = db.GetNamedTagAsInt("fr60", 3);
			m_nFr70 = db.GetNamedTagAsInt("fr70", 4);
			m_nFr80 = db.GetNamedTagAsInt("fr80", 5);

			if (m_bIsMRM)      m_bIsMRT = m_bIsMRS = m_bIsMRC = false;
			else if (m_bIsMRC) m_bIsMRM = m_bIsMRS = m_bIsMRT = false;
			else if (m_bIsMRT) m_bIsMRM = m_bIsMRS = m_bIsMRC = false;
			else if (m_bIsMRS) m_bIsMRT = m_bIsMRM = m_bIsMRC = false;

			normalizeProperties(false);        
		}
		else
		{
			m_sMRNRoute2 = db.GetNamedTag("route2");
			m_nRouteIndex2 = toRouteIndex(m_sMRNRoute2);
		}

		Update();
 	}

    string getPropertyTitleHTML(string title);
    string getPropertyHTML(string name, string value, string valueId);

    string getContent(StringTable ST)
	{
        return  getPropertyTitleHTML(ST.GetString("marker-type-desc")) +
                getPropertyHTML(ST.GetString("marker-type-mrm"), m_bIsMRM, "m_bIsMRM") +
                getPropertyHTML(ST.GetString("marker-type-mrc"), m_bIsMRC, "m_bIsMRC") +
                getPropertyHTML(ST.GetString("marker-type-mrt"), m_bIsMRT, "m_bIsMRT") +
                getPropertyHTML(ST.GetString("marker-type-mrs"), m_bIsMRS, "m_bIsMRS") +
				getPropertyTitleHTML(ST.GetString("numtrack-desc")) +
                getPropertyHTML(ST.GetString("numtrack-value"),  m_sMRNRoute, "r") +
                getPropertyHTML(ST.GetString("numtrack2-value"), m_sMRNRoute2, "r2") +
				getPropertyTitleHTML(ST.GetString("als-fr-desc")) +
                getPropertyHTML("0",  m_nFr0,  "m_nFr0") +
                getPropertyHTML("40", m_nFr40, "m_nFr40") +
                getPropertyHTML("60", m_nFr60, "m_nFr60") +
                getPropertyHTML("70", m_nFr70, "m_nFr70") +
                getPropertyHTML("80", m_nFr80, "m_nFr80");
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
		if (id == "m_nFr0" or id == "m_nFr40" or id == "m_nFr60" or id == "m_nFr70" or id == "m_nFr80") return "int";		
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
		if (id == "m_nFr0")  return (string)m_nFr0;
		if (id == "m_nFr40") return (string)m_nFr40;
		if (id == "m_nFr60") return (string)m_nFr60;
		if (id == "m_nFr70") return (string)m_nFr70; 
		if (id == "m_nFr80") return (string)m_nFr80;
		if (id == "r")	  	 return m_sMRNRoute;
		if (id == "r2")	  	 return m_sMRNRoute2;
		return "";
	}

 	public void LinkPropertyValue(string id)
	{
		inherited(id);

 		if (id == "m_bIsMRM")
        {
            m_bIsMRM = !m_bIsMRM;
            if (m_bIsMRM) m_bIsMRT = m_bIsMRS = m_bIsMRC = false;
        }
        else if (id == "m_bIsMRC") 
        {
            m_bIsMRC = !m_bIsMRC;
            if (m_bIsMRC) m_bIsMRM = m_bIsMRS = m_bIsMRT = false;
        }
 		else if (id == "m_bIsMRT") 
        {
            m_bIsMRT = !m_bIsMRT;
            if (m_bIsMRT) m_bIsMRM = m_bIsMRS = m_bIsMRC = false;
        }
 		else if (id == "m_bIsMRS")
        {
            m_bIsMRS = !m_bIsMRS;
            if (m_bIsMRS) m_bIsMRT = m_bIsMRM = m_bIsMRC = false;
        }

        normalizeProperties(true);
 	}

	public void SetPropertyValue(string id, string val)
	{
		inherited(id,val);
		
		if (id == "r")
		{
			m_nRouteIndex = toRouteIndex(val);
			m_sMRNRoute = ToMRNRoute(m_nRouteIndex);
		}
		else
		{
			m_nRouteIndex2 = toRouteIndex(val);
			m_sMRNRoute2 = ToMRNRoute(m_nRouteIndex2);
		}
		
		//Interface.Print("SetPropertyValue:id="+id+",m_nRouteIndex="+m_nRouteIndex+",m_sMRNRoute="+m_sMRNRoute);		
 	}

	public void SetPropertyValue(string id, int val)
	{
		int frValue = toFrValue(val);
		if (id == "m_nFr0") m_nFr0 = frValue;
		else if (id == "m_nFr40") m_nFr40 = frValue; 
		else if (id == "m_nFr60") m_nFr60 = frValue;
		else if (id == "m_nFr70") m_nFr70 = frValue; 
		else m_nFr80 = frValue;
 	}

	//============ API ===============================
    public bool IsMain() {return m_bIsMRM;}
    public bool IsClosed() {return m_bIsMRC;}
    public bool IsTurn() {return m_bIsMRT;}
    public bool IsManeuver() {return m_bIsMRS;}
    public string GetRouteNumber()
	{
		//Interface.Print("ZmvMarker::GetRouteNumber: m_nRouteIndex="+m_nRouteIndex);
		return (string)m_nRouteIndex;
	}
    public string GetRouteNumber2() 
	{
		//Interface.Print("ZmvMarker::GetRouteNumber2: m_nRouteIndex2="+m_nRouteIndex2);
		return (string)m_nRouteIndex2;
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