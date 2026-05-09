include "library.gs"
include "CyriScriptSecondary.gs"

final class CyTUtility {

	public Asset				parent;
	public Soup 				iconSoup = Constructors.NewSoup();
//---------------------------------------------------------------------
	public string 			face = "Arial";
	public string				font0 = "<font face=" + face + " color=#B8B8B8 size=1><b>";// help text
	public string				font1 = "<font face=" + face + " color=#D8D8D8 size=3><b>";// cell text
	public string				font2 = "<font face=" + face + " color=#D8D8D8 size=3><b>";// sub header
	public string				font3 = "<font face=" + face + " color=#E8E8E8 size=3><b>";// header
	public string				endFont = "</b></font>";
	public string				field2 = "#666666";				// sub section background
	public string				field3 = "#4d4d4d";				// main section background
	public int					rowheight = 20;						// Table row height
	public int					iconsize = 20;						// Header icon size
	public int					buttonsize = 24;					// Button icon size		
	public int					W1 = 200;									// width of left hand cell
	public int					W2 = 300;									// width of right hand cell	
	public int					Section = 0;							// Object properties HTML section
	public int					SubSection = 0;						// Object properties HTML sub section
//---------------------------------------------------------------------
	public StringTable	stringtable;
	public StringTable	UserStrings;
	public string				copyrighttext;
//---------------------------------------------------------------------
	string							LogResult;
//---------------------------------------------------------------------
/*int									helpLeft = 25;						// help window left side
	int									helpTop = 50;							// help window top
	int									helpWidth = 300;					// help window width
	int									helpHeight = 700;					// help window height
	int									helpminwidth = 50;				// minimised help window width
	int									helpminheight = 30;				// minimised help window width	*/
	public Browser			ErrorBrowser;
	Browser 						Box;
//---------------------------------------------------------------------
	public void 				Add(string[] sArray, string s);
	public string				BoolString(bool query, string tstring, string fstring);
	void 								BrowserOpen(string Param1, string Param2, string Param3);
	public string 			Button(bool control, string property, string icon);
	public string 			Cell(int width, string data);
	public bool 				EffectPresent(MeshObject mo, string mesh, string effect);	
	public void 				Error(MapObject Caller, MapObject Target, string Caption, string Data);
	public void 				Error(MapObject Caller, string Caption, string Data);
	public void 				Error(string Caption, string Data);	
	public int 					GetCarPosition(Vehicle car, Vehicle[] vehicles);
	public Asset 				GetCorona(MeshObject mo, string mesh, string effect);
	public string				GetIcon(string icon);
	public string 			Header(bool control,int section, string content, string icon);
	public string 			Item(bool control, string content);
	public string				KUIDAsHTML(KUID kuid);
	public string 			KUIDString(Asset asset);
	public string 			LogSoup(Soup soup);
	public bool 				Member(string[] sArray, string s);
	public void 				Remove(string[] sArray, string s);
	public void					SetFXName(MeshObject Caller, string effect, string value);
	public string 			SubHeader(bool control,int subsection, string content, string icon);
	public string 			Table(bool control, string content);
	public string 			Token(int index, string s, string sep);
	public bool 				TrainHasDoorsVagFB(Train train, int side);
	public bool 				TrainPresent(Vehicle car);
	public string				userstring(string tag);
	public string 			UserString(string tag);
	public string				USERSTRING(string tag);
	public string 			UserString(string tag);
	
	public bool  TrainHasDoors(Train train, int side);
	public bool  TrainHasDoorsTech(Train train, int side);
	public bool  TrainHasDoorsCab(Train train, int side);
	public bool  TrainHasDoorsCabFB(Train train, int side);
//---------------------------------------------------------------------

	public void 		Add(string[] sArray, string s) {
// ADD adds s to sArray if not already there
		if (Member(sArray,s)) {return;}
		else {sArray[sArray.size()] = s;}
	}

	public string		BoolString(bool query, string tstring, string fstring) {
		string result = UserString(fstring);
		if (query) result = UserString(tstring);
		return result;
	}

	void 						BrowserOpen(string Param1, string Param2, string Param3) {
		if (!ErrorBrowser) ErrorBrowser = Constructors.NewBrowser();
		ErrorBrowser.SetWindowStyle(Browser.STYLE_DEFAULT);
		ErrorBrowser.SetCloseEnabled(true);
		ErrorBrowser.SetScrollEnabled(true);
		ErrorBrowser.SetWindowPosition(34,83);
		ErrorBrowser.SetWindowSize(350,550);
		ErrorBrowser.SetWindowGrow(350,550,1000,1000);
		ErrorBrowser.SetWindowTitle("CyriScript");
		ErrorBrowser.SetRememberPosition(parent,"CyriScript");
		ErrorBrowser.SetParam(1,Param1);
		ErrorBrowser.SetParam(2,Param2);
		ErrorBrowser.SetParam(3,Param3);
		ErrorBrowser.LoadHTMLFile(parent,"CyTLibrary.html");
	}

	public string 	Button(bool control, string property, string icon) {
//	BUTTON returns a button with a link
		if (!control) {return "";}
		return "<a href= live://property/" + property + " "
		+ "><img kuid=" + GetIcon(icon) + " width="
		+ iconsize + " height=" + iconsize + "></a>";
	}

	public string 	Cell(int width, string data) {
//	CELL returns a table data item
		string w = "";
		if (width == 0) {w = " width=100%";}
		else {w = " width=" + width;}
		return "<td" + w + ">" + font1 + data + endFont + "</td>";
	}

	public bool 		EffectPresent(MeshObject mo, string mesh, string effect) {
//	EFFECTPRESENT returns true if effect is in specified section of mesh-table
		Soup meshtable = mo.GetAsset().GetConfigSoup().GetNamedSoup("mesh-table");
		if (meshtable.CountTags() > 0) {
			Soup meshsoup = meshtable.GetNamedSoup(mesh);
			if (meshsoup.CountTags() > 0) {
				Soup effects = meshsoup.GetNamedSoup("effects");
				if (effects.CountTags() > 0) {
					return effects.GetNamedSoup(effect).CountTags() > 0;
				}// effects
			}// meshsoup
		}//meshtable
		return false;
	}

	public void 		Error(MapObject Caller, MapObject Target, string Caption, string Data) {
		string kuid = "";
		string aname = "";
		string iname = "";
		string info = "";
		if (Caller) {
			aname = Caller.GetAsset().GetLocalisedName();
			if (aname != "") aname = aname + "<br>";
			iname = Caller.GetName();
			if (iname != "") iname = iname + "<br>";
			kuid = KUIDString(Caller.GetAsset());
			if (kuid != "") kuid = "&lt;" + kuid + "&gt;<br>";
			info = aname + iname + kuid;
		}		
		if (Caption != "") Caption = font3 + Caption + endFont + "<br>";
		if (Data != "") Data = font0 + Data + endFont + "<br>";
		if (info != "") info = font0 + info + endFont;		
		BrowserOpen(Caption,info,Data);
		if (Target and World.GetCurrentModule() == World.DRIVER_MODULE and ErrorBrowser) {
			if (ErrorBrowser.GetWindowVisible()) World.SetCamera(Target);
		}
	}

	public void 		Error(MapObject Caller, string Caption, string Data) {
		Error(Caller,null,Caption,Data);
	}

	public void 		Error(string Caption, string Data) {
		Error(null,null,Caption,Data);
	}

	public int 			GetCarPosition(Vehicle car, Vehicle[] vehicles) {
//	GETCARPOSITION returns position of car in train relative to current heading
		int n;
		for (n = 0; n < vehicles.size(); n++) {
			if (car == vehicles[n]) {
				return n;
				break;
			}
		}
		return -1;
	}

	public Asset 		GetCorona(MeshObject mo, string mesh, string effect) {
		Soup meshtable = mo.GetAsset().GetConfigSoup().GetNamedSoup("mesh-table");
		Soup data = meshtable.GetNamedSoup(mesh).GetNamedSoup("effects").GetNamedSoup(effect);
		KUID kuid = data.GetNamedTagAsKUID("texture-kuid");
		return World.FindAsset(kuid);
	}

	public string		GetIcon(string icon) {
		return "\"" + iconSoup.GetNamedTagAsKUID(icon).GetHTMLString() + "\"";
	}

	public string 	Header(bool control,int section, string content, string icon) {
// HEADER returns a header band with icon
		if (!control) {return "";}
		if (Section == section) {icon = "imgrem";}
		string link = "";
		if (icon != "") {
			link = link + "<a href=live://property/section" + section + ">"
			+ "<img kuid=" + GetIcon(icon) + " width=" + buttonsize + " height=" + buttonsize + "></a>  ";
		} else {link = "";}
		return "<table width=100%><tr height=" + (Str.ToInt(rowheight) + 4) 
		+ "><td bgcolor=" + field3 + " width=100%>"
		+ font3 + link + content + "</td></tr></table>";
	}

	public string 	Item(bool control, string content) {
//	ITEM returns general text
		if (!control) {return "";}
		return content;
	}

	public string		KUIDAsHTML(KUID kuid) {
		string s = kuid.GetLogString();
		return "&lt;" + s[1,s.size()-1] + "&gt;";
	}

	public string 	KUIDString(Asset asset) {
// KUIDSTRING returns kuid with < and > removed for use as soup tag
		string s = asset.GetKUID().GetLogString();
		return s[1,s.size()-1];
	}

	void 						SoupContents(string indent,Soup soup) {
		int i;
		string str, data, msg;
		Soup subSoup;
		string space = "&nbsp;&nbsp;&nbsp;";
		int iNumTags = soup.CountTags();
		if (iNumTags == 0) {
			LogResult = LogResult + "{No Data Found}<br>";
			return;
		}
		for (i = 0; i < iNumTags; i++) {
			str = soup.GetIndexedTagName(i);
			msg = indent + str + " = ";
			data = soup.GetNamedTag(str);
			if (data.size() > 0) {
				msg = msg + data;
				LogResult = LogResult + msg + "<br>";
			} else {
				subSoup = soup.GetNamedSoup(str);
				if (subSoup.CountTags() > 0) {
					LogResult = LogResult + msg + "{<br>";
					indent = indent + space;
					SoupContents(indent,subSoup);
					indent = indent[, indent.size() - space.size()];
					LogResult = LogResult + indent + "}<br>";
				} else {
					msg = msg + "{No Data Found}";
					LogResult = LogResult + msg + "<br>";
				}	
			}
		}
	}

	public string 	LogSoup(Soup soup) {
		LogResult = "";
		SoupContents("",soup);
		return LogResult;
	}

	public bool 		Member(string[] sArray, string s) {
// MEMBER returns true if string s is in stringarray sArray
		int n;
		bool result = false;
		if (sArray.size() == 0) {return result;}
		for (n = 0; n < sArray.size(); n++) {
			if (s == sArray[n]) {
				result = true;
				break;
		}	}
		return result;
	}

	public void 		MessageBox(string message) {
		if (Box) Box = null;
		Box = Constructors.NewBrowser();
		Box.SetWindowStyle(Box.STYLE_DEFAULT);
		Box.SetCloseEnabled(true);
		Box.SetScrollEnabled(true);
		Box.SetWindowPosition(540,475);
		Box.SetWindowSize(400,65);
		Box.SetWindowGrow(400,65,400,250);
		Box.SetRememberPosition(parent,"Message Box");
		Box.SetParam(1,font0 + message + endFont);
		Box.LoadHTMLFile(parent,"CyTMessage.html");
	}

	public void 		Remove(string[] sArray, string s) {// removes string from array
// REMOVE removes s from sArray
		int n;
		if (sArray.size() == 0) {return;}
		for (n = 0; n < sArray.size(); n++) {
			if (s == sArray[n]) {sArray[n,n+1] = null;}
		}
	}

	public void			SetFXName(MeshObject Caller, string effect, string value) {
		if (value == "") value = " ";
		Caller.SetFXNameText(effect,value);
	}

	public string 	SubHeader(bool control,int subsection, string content, string icon) {
//	SUBHEADER returns a second level header
		if (!control) {return "";}
		if (SubSection == subsection) {icon = "imgrem";}
		string link = "";
		if (icon != "") {
			link = link + "<a href=live://property/subsection" + subsection + ">"
			+ "<img kuid=" + GetIcon(icon) + " width=" + buttonsize + " height=" + buttonsize + "></a>  ";
		} else {link = "";}
		return "<table width=100%><tr height=" + (Str.ToInt(rowheight) + 4) 
		+ "><td bgcolor=" + field2 + " width=100%>" + font2 + link + content + "</td></tr></table>";
	}

	public string 	Table(bool control, string content) {
//	TABLE returns a formatted table
		if (!control) {return "";}
		return "<table width=100%>" + content + "</table>";
	}

	public string 	Token(int index, string s, string sep) {
// TOKEN returns nth token from s using characters in sep as trim boundaries or null string
		string result;
		string[] strings = Str.Tokens(s,sep);
		if ((index <= strings.size()) and (index > 0)) {
			result = strings[index - 1];
		} else { result = ""; }
		return result;
	}

	public bool VehicleHasDoors(Vehicle v, int side) 
	{
	// check for the existence of animated door sets (0 = any side, 1 = left side, 2 = right side)
		bool res;
		bool left = v.HasMesh("left-passenger-door");
		bool right = v.HasMesh("right-passenger-door");
		if (side == 0)
			res = left or right;
		else 
		{
			bool facing = v.GetDirectionRelativeToTrain();
			if (side == 1)
				res = ((facing and left) or (!facing and right));
			else
				res = ((facing and right) or (!facing and left));
		}
		return res;
	}

	public bool TrainHasDoors(Train train, int side) 
	{
	// check for the existence of animated door sets (1 = left side, 2 = right side)
		Vehicle[] vehicles = train.GetVehicles();
		int n, len = vehicles.size();
		for (n = 0; n < len; n++) 
		{
			if (VehicleHasDoors(vehicles[n],side)) break;
		}
		return n < len;
	}
	
	public bool VehicleHasDoorsTech(Vehicle v, int side) 
	{
	// check for the existence of animated door sets (0 = any side, 1 = left side, 2 = right side)
		bool res;
		bool left = v.HasMesh("left-door");
		bool right = v.HasMesh("right-door");	
		if (side == 0)
			res = left or right;
		else 
		{
			bool facing = v.GetDirectionRelativeToTrain();
			if (side == 1)
				res = ((facing and left) or (!facing and right));
			else
				res = ((facing and right) or (!facing and left));
		}
		return res;
	}

	public bool TrainHasDoorsTech(Train train, int side) 
	{
	// check for the existence of animated door sets (1 = left side, 2 = right side)
		Vehicle[] vehicles = train.GetVehicles();
		int n, len = vehicles.size();
		for (n = 0; n < len; n++) 
		{
			if (VehicleHasDoorsTech(vehicles[n],side)) break;
		}
		return n < len;
	}
		
	public bool TrainHasDoorsCab(Train train, int side) {
	// check for the existence of animated door sets (0 = either side, 1 = left side, 2 = right side)
		bool hasLeft = false;
		bool hasRight = false;
		Vehicle[] vehicles = train.GetVehicles();
		int n;
		for (n = 0; n < vehicles.size(); n++) {
			bool facing = vehicles[n].GetDirectionRelativeToTrain();
			bool left = vehicles[n].HasMesh("cabl");
			bool right = vehicles[n].HasMesh("cabr");
			if ((facing and left) or (!facing and right)) hasLeft = true;
			if ((facing and right) or (!facing and left)) hasRight = true;
			switch (side) {
				case 0:		if (hasLeft and hasRight) return true;
									break;
				case 1:		if (hasLeft) return true;
									break;
				case 2:		if (hasRight) return true;
									break;
				default:	break;
			}
		}
		return false;
	}
	
	public bool  TrainHasDoorsCabFB(Train train, int side) {
	// check for the existence of animated door sets (0 = either side, 1 = left side, 2 = right side)
		bool hasLeft = false;
		bool hasRight = false;
		Vehicle[] vehicles = train.GetVehicles();
		int n;
		for (n = 0; n < vehicles.size(); n++) {
			bool facing = vehicles[n].GetDirectionRelativeToTrain();
			bool left = vehicles[n].HasMesh("cabf");
			bool right = vehicles[n].HasMesh("cabb");
			if ((facing and left) or (!facing and right)) hasLeft = true;
			if ((facing and right) or (!facing and left)) hasRight = true;
			switch (side) {
				case 0:		if (hasLeft and hasRight) return true;
									break;
				case 1:		if (hasLeft) return true;
									break;
				case 2:		if (hasRight) return true;
									break;
				default:	break;
			}
		}
		return false;
	}
	
	public bool 		TrainHasDoorsVagFB(Train train, int side) {
	// check for the existence of animated door sets (0 = either side, 1 = left side, 2 = right side)
		bool hasLeft = false;
		bool hasRight = false;
		Vehicle[] vehicles = train.GetVehicles();
		int n;
		for (n = 0; n < vehicles.size(); n++) {
			bool facing = vehicles[n].GetDirectionRelativeToTrain();
			bool left = vehicles[n].HasMesh("vagf");
			bool right = vehicles[n].HasMesh("vagb");
			if ((facing and left) or (!facing and right)) hasLeft = true;
			if ((facing and right) or (!facing and left)) hasRight = true;
			switch (side) {
				case 0:		if (hasLeft and hasRight) return true;
									break;
				case 1:		if (hasLeft) return true;
									break;
				case 2:		if (hasRight) return true;
									break;
				default:	break;
			}
		}
		return false;
	}

	public bool 		TrainPresent(Vehicle car) {
//	TRAINPRESENT returns false if asset is in Surveyor preview panel, true if placed on map
		bool result = false;
		Train train = car.GetMyTrain();
		if (train) {result = true;}
		return result;
	}

	public string		userstring(string tag) {
		string result = UserString(tag);
		Str.ToLower(result);
		return result;
	}

	public string 	UserString(string tag) {
// USERSTRING returns text from asset string-table if present, from library string table otherwise
		string result = UserStrings.GetString(tag);
		if (result == "") {result = stringtable.GetString(tag);}
		if (result == "") {result = "*" + tag;}
		return result;
	}
	
	public string		USERSTRING(string tag) {
		string result = UserString(tag);
		Str.ToUpper(result);
		return result;
	}

};


class CyriScriptPrimary isclass Library {
	string watch = "";
	define int			IndicatorDistance = 75;
	define float		BrakeDelta = -0.01;
	
	define string letters = "ABCDEFGHJKLMNPRSTUVWXY";
	define string numbers = "123456789";

	define float		eventDelay = 0.1;					// period in seconds to ignore duplicate animation events
	
	int[]						logList;									// list of bogie and traincar IDs

	Vehicle					Caller;
	MapObject				mapobject;

	Soup						SSSoup;
	Soup						extensions;
	Soup						registration;
	string						tch;
	Soup						registrationg;
	Soup						exbodyDefaults;
	Soup						interiorDefaults;
	Soup						schemeDefaults;
	Soup						advertDefaults;
	Soup						driverDefaults;
	Asset						exbodies;
	Asset						interiors;
	Asset						schemes;
	Asset						adverts;
	Asset						drivers;
	Asset 						regNumbers;
	Asset 						regTextNumbers;
	Soup						exbodymanagers;
	int							exbodymanager;
	Soup						interiormanagers;
	int							interiormanager;
	Soup						schememanagers;
	int							schememanager;
	Soup						advertmanagers;
	int							advertmanager;
	Soup						drivermanagers;
	int							drivermanager;
	bool						electromanager;
	Soup						onemeshes;
	int							onemesh;
	string					onemeshname;
	Soup						twomeshes;
	int							twomesh;
	string					twomeshname;
	Soup						threemeshes;
	int							threemesh;
	string					threemeshname;
	Soup						fourmeshes;
	int							fourmesh;
	string					fourmeshname;
	Soup						fivemeshes;
	int							fivemesh;
	string					fivemeshname;
	Soup						sixmeshes;
	int							sixmesh;
	string					sixmeshname;

	define int			CAR_DERAILED = -1;
	define int			CAR_CENTER = 0;
	define int			CAR_FRONT = 1;
	define int			CAR_BACK = 2;
	define int			CAR_SINGLE = 3;

	define int			MODE_RESET = -3;
	define int			MODE_UNSET = -2;
	define int			MODE_ABSENT = -1;
	define int			MODE_IGNORE = -1;
	define int			MODE_OFF = 0;
	define int			MODE_CLOSE = 0;
	define int			MODE_ON = 1;
	define int			MODE_OPEN = 1;
	define int			MODE_AUTO = 2;

	bool						raining = false;					// or snowing
	bool						cleaned;

	bool						LocoCoupled;
	int							position;
	bool						facing;
	int							trainsize;
	bool						textured;
	bool						textured2;
	bool						textured3;
	bool						textured4;
	bool						textured5;

	bool						attached;
	bool						attached2;
	bool						attached3;
	bool						attached4;
	bool						attached5;
	bool						attached6;
	string					heading;
	
	CyTUtility U = new CyTUtility();

// FORWARD METHOD DECLARATIONS ////////////////////////////////////////////////////////////////////////////////

	thread void 		WeatherMonitor();
	void						CheckDependencies(Asset asset, MapObject Target);
	
	// LIBRARY PROPERTY OBJECT ////////////////////////////////////////////////////////////////////////////////////
	
	bool IsAssetCorrect(Asset self)
	{
		string kuid = self.GetConfigSoup().GetNamedTag("kuid");
		string[] s = Str.Tokens(kuid,":");
		return (s[1] == "486576" and s[2] == "111");
	}
	
	public void Init(Asset self) {
		if (!IsAssetCorrect(self)) return;
		inherited(self);
	// html setup------------------------------------------------------
		U.iconSoup.SetNamedTag("imgadd","<KUID:486576:109>");
		U.iconSoup.SetNamedTag("imgrem","<KUID:486576:110>");		
		U.iconSoup.SetNamedTag("imgtrn","<KUID:486576:107>");	
		U.face = "Arial";
		U.font0 = "<font face=" + U.face + " color=#B8B8B8 size=1><b>";
		U.font1 = "<font face=" + U.face + " color=#D8D8D8 size=3><b>";
		U.font2 = "<font face=" + U.face + " color=#D8D8D8 size=3><b>";
		U.font3 = "<font face=" + U.face + " color=#E8E8E8 size=3><b>";
		U.endFont = "</b></font>";
		U.field2 = "#666666";
		U.field3 = "#4d4d4d";		
		U.rowheight = 20;
		U.iconsize = 20;
		U.buttonsize = 24;		
		U.W1 = 200;
		U.W2 = 300;
	// html setup------------------------------------------------------
		U.copyrighttext = "<br><font face=" + U.face + " color=#B8B8B8 size=1><b>  CyriTRAINZ 2012-17</b></font>";
		U.stringtable = GetAsset().GetStringTable();
		CheckDependencies(me.GetAsset(),null);
		WeatherMonitor();
		heading = U.stringtable.GetString("Normal");
		logList = new int[0];
		registration = Constructors.NewSoup();
		registrationg = Constructors.NewSoup();
		exbodyDefaults = Constructors.NewSoup();
		interiorDefaults = Constructors.NewSoup();
		schemeDefaults = Constructors.NewSoup();
		advertDefaults = Constructors.NewSoup();
		driverDefaults = Constructors.NewSoup();
		U.parent = me.GetAsset();
//	AddHandler(me,"Browser-Exit","","ErrorHandler");
//	AddHandler(me,"Browser-URL","","ErrorHandler");
		AddHandler(me,"Browser-Closed","","BrowserCloseHandler");

	}
	
	void BrowserCloseHandler(Message msg) {
		if (msg.src == U.ErrorBrowser) U.ErrorBrowser = null;
	}

	public Soup GetProperties(void) {
		Soup soup = inherited();
		soup.SetNamedSoup("exbodyDefaults",exbodyDefaults);
		soup.SetNamedSoup("interiorDefaults",interiorDefaults);
		soup.SetNamedSoup("schemeDefaults",schemeDefaults);
		soup.SetNamedSoup("advertDefaults",advertDefaults);
		soup.SetNamedSoup("driverDefaults",driverDefaults);
		soup.SetNamedSoup("registration",registration);
		soup.SetNamedTag("tch", tch);
		soup.SetNamedSoup("registrationg",registrationg);
//	LogSoupContents(soup,"Library Soup");
		return soup;
	}

	public void SetProperties(Soup soup) {
		inherited(soup);
		registration.Copy(soup.GetNamedSoup("registration"));
		registrationg.Copy(soup.GetNamedSoup("registrationg"));
		exbodyDefaults.Copy(soup.GetNamedSoup("exbodyDefaults"));
		interiorDefaults.Copy(soup.GetNamedSoup("interiorDefaults"));
		schemeDefaults.Copy(soup.GetNamedSoup("schemeDefaults"));
		advertDefaults.Copy(soup.GetNamedSoup("advertDefaults"));
		driverDefaults.Copy(soup.GetNamedSoup("driverDefaults"));
		tch = soup.GetNamedTag("tch");
	}

	int GetexbodyDefault(void) {
// GETexbodyDEFAULT returns default exbody index for current texture group
		if (!exbodies) {return 0;}
		return exbodyDefaults.GetNamedTagAsInt(U.KUIDString(exbodies));
	}

	void SetexbodyDefault(int index) {
// SETexbodyDEFAULT saves default exbody index for current texture group
		if (!exbodies) {return;}
		exbodyDefaults.SetNamedTag(U.KUIDString(exbodies),index);
	}
		
	int GetinteriorDefault(void) {
		if (!interiors) {return 0;}
		return interiorDefaults.GetNamedTagAsInt(U.KUIDString(interiors));
	}

	void SetinteriorDefault(int index) {
		if (!interiors) {return;}
		interiorDefaults.SetNamedTag(U.KUIDString(interiors),index);
	}
	
	int GetSchemeDefault(void) {
		if (!schemes) {return 0;}
		return schemeDefaults.GetNamedTagAsInt(U.KUIDString(schemes));
	}

	void SetSchemeDefault(int index) {
		if (!schemes) {return;}
		schemeDefaults.SetNamedTag(U.KUIDString(schemes),index);
	}

	int GetAdvertDefault(void) {
		if (!adverts) {return 0;}
		return advertDefaults.GetNamedTagAsInt(U.KUIDString(adverts));
	}

	void SetAdvertDefault(int index) {
		if (!adverts) {return;}
		advertDefaults.SetNamedTag(U.KUIDString(adverts),index);
	}
	
	int GetDriverDefault(void) {
		if (!drivers) {return 0;}
		return driverDefaults.GetNamedTagAsInt(U.KUIDString(drivers));
	}

	void SetDriverDefault(int index) {
		if (!drivers) {return;}
		driverDefaults.SetNamedTag(U.KUIDString(drivers),index);
	}
// HTML UTILITIES /////////////////////////////////////////////////////////////////////////////////////////////

	void CheckDependencies(Asset asset, MapObject Target) {
// CHECKDEPENDENCIES ensures that all assets listed in the library kuid-table are installed
		Soup kuidtable = asset.GetConfigSoup().GetNamedSoup("kuid-table");
		int n;
		for (n = 0; n < kuidtable.CountTags(); n++) {
			KUID kuid = kuidtable.GetNamedTagAsKUID(kuidtable.GetIndexedTagName(n));
			if (!World.FindAsset(kuid)) {
/*				U.Error(U.stringtable.GetString("Check_Dependencies"),Target,
					"<br><b>&lt;" + Str.Tokens(kuid.GetLogString(),"<>")[0] + "&gt;</b> " 
				+ U.stringtable.GetString("not_installed"),0);*/
			}
		}
	}

// GENERAL UTILITIES //////////////////////////////////////////////////////////////////////////////////////////

	string exbodyUserID(void) {
// USERID returns the originating user ID number from the texture-group asset, needed for p-dehnert support
		return Str.Tokens(exbodies.GetKUID().GetLogString(),":")[1];
	}
	
	string interiorUserID(void) {
		return Str.Tokens(interiors.GetKUID().GetLogString(),":")[1];
	}
	
	string SchemeUserID(void) {
		return Str.Tokens(schemes.GetKUID().GetLogString(),":")[1];
	}
	
	string AdvertUserID(void) {
		return Str.Tokens(adverts.GetKUID().GetLogString(),":")[1];
	}
	
	string DriverUserID(void) {
		return Str.Tokens(drivers.GetKUID().GetLogString(),":")[1];
	}

	thread void WeatherMonitor() {
// WEATHERMONITOR sends a message to rolling stock using the library whenever it starts or stops raining
		while (true)
		{			
			if ((raining and World.GetWeatherType() < 2) or (!raining and World.GetWeatherType() > 1)) // check for rain
				PostMessage(null,"SS","Wipers",0.5);
			raining = World.GetWeatherType() > 1;
			Sleep(3.0);
		}
	}

	void SetCoronas(string prefix, int start, bool mode) {
		int n = start;
		while (U.EffectPresent(Caller,"default",prefix + n)) {
			if (mode) {
				Caller.SetFXCoronaTexture(prefix + n,U.GetCorona(Caller,"default",prefix + n));
				if (Caller.HasMesh(prefix + n + "-body")) {
					Caller.SetMeshVisible(prefix + n + "-body",true,0.5);
				}
			} else {
				Caller.SetFXCoronaTexture(prefix + n,null);
				if (Caller.HasMesh(prefix + n + "-body")) {
					Caller.SetMeshVisible(prefix + n + "-body",false,0.5);
				}
			}
			n = n + 2;
		}
	}

// NUMBERING //////////////////////////////////////////////////////////////////////////////////////////////////

	string GetReg(string source, int count) {
		string s = "";
		int n, i;
		for(n = 1; n <= count; n++) {
			i = Math.Rand(0,source.size());
			s = s + source[i,i + 1];
		}
		return s;
	}
	
	void SetTexturedTch(string str)
	{
		if (extensions.GetNamedTagAsBool("numtext")) {
			regTextNumbers = Caller.GetAsset().FindAsset("textnumbers");
		}
		int n = Str.ToInt(str);
		if (n < 1 or n > 9) n = 1;
		Caller.SetFXTextureReplacement("rutchnum0-0", regTextNumbers, n);
		Caller.SetFXTextureReplacement("rutchnum1-0", regTextNumbers, n);
		Caller.SetFXTextureReplacement("rutchnum2-0", regTextNumbers, n);
		Caller.SetFXTextureReplacement("rutchnum3-0", regTextNumbers, n);
		Caller.SetFXTextureReplacement("rutchnum4-0", regTextNumbers, n);
		Caller.SetFXTextureReplacement("rutchnum5-0", regTextNumbers, n);
		Caller.SetFXTextureReplacement("rutchnum6-0", regTextNumbers, n);
		Caller.SetFXTextureReplacement("rutchnum7-0", regTextNumbers, n);
		Caller.SetFXTextureReplacement("rutchnum8-0", regTextNumbers, n);
		Caller.SetFXTextureReplacement("rutchnum9-0", regTextNumbers, n);
	}
	
	void SetTexturedRegistration(string str)
	{
		regNumbers = Caller.GetAsset().FindAsset("numbers");
		if (extensions.GetNamedTagAsBool("numtext")) {
			regTextNumbers = Caller.GetAsset().FindAsset("textnumbers");
		}
		int n, i, len = str.size();
		
		for (i = 0; i < len; i++)
		{
			n = Str.ToInt(str[i,i+1]);
			if (n == 0) n = 10;
			Caller.SetFXTextureReplacement("runum-"+i, regNumbers, n);
			Caller.SetFXTextureReplacement("rutnum0-"+i, regTextNumbers, n);
			Caller.SetFXTextureReplacement("rutnum1-"+i, regTextNumbers, n);
			Caller.SetFXTextureReplacement("rutnum2-"+i, regTextNumbers, n);
			Caller.SetFXTextureReplacement("rutnum3-"+i, regTextNumbers, n);
			Caller.SetFXTextureReplacement("rutnum4-"+i, regTextNumbers, n);
			Caller.SetFXTextureReplacement("rutnum5-"+i, regTextNumbers, n);
			Caller.SetFXTextureReplacement("rutnum6-"+i, regTextNumbers, n);
			Caller.SetFXTextureReplacement("rutnum7-"+i, regTextNumbers, n);
			Caller.SetFXTextureReplacement("rutnum8-"+i, regTextNumbers, n);
			Caller.SetFXTextureReplacement("rutnum9-"+i, regTextNumbers, n);
		}
		
		for (; i <= 4; i++)
		{
			Caller.SetFXTextureReplacement("runum-"+i, regNumbers, 0);
			Caller.SetFXTextureReplacement("rutnum0-"+i, regTextNumbers, 0);
			Caller.SetFXTextureReplacement("rutnum1-"+i, regTextNumbers, 0);
			Caller.SetFXTextureReplacement("rutnum2-"+i, regTextNumbers, 0);
			Caller.SetFXTextureReplacement("rutnum3-"+i, regTextNumbers, 0);
			Caller.SetFXTextureReplacement("rutnum4-"+i, regTextNumbers, 0);
			Caller.SetFXTextureReplacement("rutnum5-"+i, regTextNumbers, 0);
			Caller.SetFXTextureReplacement("rutnum6-"+i, regTextNumbers, 0);
			Caller.SetFXTextureReplacement("rutnum7-"+i, regTextNumbers, 0);
			Caller.SetFXTextureReplacement("rutnum8-"+i, regTextNumbers, 0);
			Caller.SetFXTextureReplacement("rutnum9-"+i, regTextNumbers, 0);
		}
	}
	
	void SetRegistration(void) 
	{
		string spec = exbodymanagers.GetNamedSoup(exbodymanager).GetNamedTag("registration");
		string reg = SSSoup.GetNamedTag("vehicleNumber");
		string tch = SSSoup.GetNamedTag("tchNumber");

//Interface.Print("SetRegistration:vehicleNumber="+reg+",vehicleNumberAuto="+SSSoup.GetNamedTagAsBool("vehicleNumberAuto"));		
				
		if (reg == "")
		{
			while (spec != "") 
			{
				if (spec[0,1] == "?") {reg = reg + GetReg(letters,1);}
				else if (spec[0,1] == "#") {reg = reg + GetReg(numbers,1);}
				else {reg = reg + spec[0,1];}
				spec = spec[1,];
			}
			SSSoup.SetNamedTag("vehicleNumber", reg);
			SSSoup.SetNamedTag("vehicleNumberAuto", true);
		}		
		
		bool hasTexturedNumbers = Caller.HasMesh("numbers");		
		//if (hasTexturedNumbers)
		//{
		//	SetTexturedRegistration(reg);
		//	int i, len = extensions.GetNamedSoup("registration").CountTags();		
		//	for (i = 0; i < len; i++) 
		//	{
		//		U.SetFXName(Caller,"reg-" + i, "");
		//	}
		//}
		//else
		//{
		
		if (hasTexturedNumbers)
		{
			SetTexturedRegistration(reg);
			SetTexturedTch(tch);
		}
		string a = U.Token(1,reg," ");
		string n = U.Token(2,reg," ");
		int i, len = extensions.GetNamedSoup("registration").CountTags();		
		for (i = 0; i < len; i++) 
		{
			spec = extensions.GetNamedSoup("registration").GetNamedTag(i);
			spec = spec[6,];
			if (spec == "a") 		U.SetFXName(Caller,"reg-" + i,a);
			else if (spec == "n") 	U.SetFXName(Caller,"reg-" + i,n);
			else if (spec == "an") 	U.SetFXName(Caller,"reg-" + i,a + " " + n);
			else if (spec == "na")  U.SetFXName(Caller,"reg-" + i,n + " " + a);
		}		
		//}
	}	
	
	void SetRegistrationg(void) 
	{
		string spec = exbodymanagers.GetNamedSoup(exbodymanager).GetNamedTag("registrationg");
		string reg = SSSoup.GetNamedTag("vehicleNumber");	
		string tch = SSSoup.GetNamedTag("tchNumber");
				
		if (reg == "")
		{
			while (spec != "") 
			{
				if (spec[0,1] == "?") {reg = reg + GetReg(letters,1);}
				else if (spec[0,1] == "#") {reg = reg + GetReg(numbers,1);}
				else {reg = reg + spec[0,1];}
				spec = spec[1,];
			}
			SSSoup.SetNamedTag("vehicleNumber", reg);
			SSSoup.SetNamedTag("vehicleNumberAuto", true);
		}		
		
		bool hasTexturedNumbers = Caller.HasMesh("numbers");		

		if (hasTexturedNumbers)
		{
			SetTexturedRegistration(reg);
			SetTexturedTch(tch);
		}
		string a = U.Token(1,reg," ");
		string n = U.Token(2,reg," ");
		int i, len = extensions.GetNamedSoup("registrationg").CountTags();		
		for (i = 0; i < len; i++) 
		{
			spec = extensions.GetNamedSoup("registrationg").GetNamedTag(i);
			spec = spec[6,];
			if (spec == "a") 		U.SetFXName(Caller,"reg-" + i,a);
			else if (spec == "n") 	U.SetFXName(Caller,"reg-" + i,n);
			else if (spec == "an") 	U.SetFXName(Caller,"reg-" + i,a + " " + n);
			else if (spec == "na")  U.SetFXName(Caller,"reg-" + i,n + " " + a);
		}		
	}	

// TEXTURE REPLACEMENT ////////////////////////////////////////////////////////////////////////////////////////

	void ReplaceTexture(string mesh, string effect, string index, string runningnumber) {
		if (U.EffectPresent(Caller, mesh, effect)) {
		// special case cleaned
			if (effect[0,6] == "exbody" and SSSoup.GetNamedTagAsBool("cleaned")) {
				Caller.SetFXTextureReplacement(effect, exbodies, exbodymanagers.GetNamedSoup(exbodymanager).GetNamedTagAsInt("cleaned"));
			}
		// normal case
			else {
				Caller.SetFXTextureReplacement(effect, exbodies, exbodymanagers.GetNamedSoup(exbodymanager).GetNamedTagAsInt(index));
			}
		}
		else U.Error("Configuration Error",U.UserString("Effect_not_found") + effect);
/*		else U.Error(U.UserString("Configuration_Error"),Caller,
			U.UserString("Effect_not_found") + "<b>" + effect + "</b>", 0);*/
	}

	void Setexbody(void) {
// SETexbody deals with texture replacement effects
// Registration Plates
		if (extensions.GetNamedSoup("registration").CountTags() > 0) SetRegistration();
		if (extensions.GetNamedSoup("registrationg").CountTags() > 0) SetRegistrationg();
// exbody		
		if (!textured or !U.TrainPresent(Caller)) {return;}
//	exbodymanager = SSSoup.GetNamedTagAsInt("exbodymanager");
		if (exbodymanager <= 0) {
			exbodymanager = GetexbodyDefault();
			if (exbodymanager == 0) {
				exbodymanager = Caller.GetAsset().GetConfigSoup().GetNamedSoup("extensions").GetNamedTagAsInt("default");
			}
			if (exbodymanager == 0) {
				exbodymanager = exbodies.GetConfigSoup().GetNamedSoup("extensions").GetNamedTagAsInt("default");
			}
			if (exbodymanager == 0) {exbodymanager = Math.Rand(1,exbodymanagers.CountTags());}
		}
		if (exbodymanager != SSSoup.GetNamedTagAsInt("exbodymanager")) {
			SSSoup.SetNamedTag("exbodymanager",exbodymanager);
		}
		int n, x;
// Traincar textures
		Soup texeffects = extensions.GetNamedSoup("exbody-textures");
		for (n = 0; n < texeffects.CountTags(); n++) {
			string prefix = texeffects.GetIndexedTagName(n);
			string meshnames = texeffects.GetNamedTag(prefix);
			string[] meshes = Str.Tokens(meshnames,",");
			for (x = 0; x < meshes.size(); x++) {
				ReplaceTexture(meshes[x], prefix + "-" + x, prefix, exbodymanager);
			}	
		}
	}
	
	void ReplaceTextureinterior(string mesh, string effect, string index, string runningnumber) {
		if (U.EffectPresent(Caller, mesh, effect)) {
			if (effect[0,6] == "interior") {
				Caller.SetFXTextureReplacement(effect, interiors, interiormanagers.GetNamedSoup(interiormanager).GetNamedTagAsInt(index));
			}
			else {
				Caller.SetFXTextureReplacement(effect, interiors, interiormanagers.GetNamedSoup(interiormanager).GetNamedTagAsInt(index));
			}
		}
		else U.Error("Configuration Error",U.UserString("Effect_not_found") + effect);
/*		else U.Error(U.UserString("Configuration_Error"),Caller,
			U.UserString("Effect_not_found") + "<b>" + effect + "</b>", 0);*/
	}

	void Setinterior(void) {
		if (!textured2 or !U.TrainPresent(Caller)) {return;}
//	interiormanager = SSSoup.GetNamedTagAsInt("interiormanager");
		if (interiormanager <= 0) {
			interiormanager = GetinteriorDefault();
			if (interiormanager == 0) {
				interiormanager = Caller.GetAsset().GetConfigSoup().GetNamedSoup("extensions").GetNamedTagAsInt("default");
			}
			if (interiormanager == 0) {
				interiormanager = interiors.GetConfigSoup().GetNamedSoup("extensions").GetNamedTagAsInt("default");
			}
			if (interiormanager == 0) {interiormanager = Math.Rand(1,interiormanagers.CountTags());}
		}
		if (interiormanager != SSSoup.GetNamedTagAsInt("interiormanager")) {
			SSSoup.SetNamedTag("interiormanager",interiormanager);
		}
		int n, x;
// Traincar textures
		Soup texeffects = extensions.GetNamedSoup("interior-textures");
		for (n = 0; n < texeffects.CountTags(); n++) {
			string prefix = texeffects.GetIndexedTagName(n);
			string meshnames = texeffects.GetNamedTag(prefix);
			string[] meshes = Str.Tokens(meshnames,",");
			for (x = 0; x < meshes.size(); x++) {
				ReplaceTextureinterior(meshes[x], prefix + "-" + x, prefix, interiormanager);
			}	
		}
	}
	
	void ReplaceTextureScheme(string mesh, string effect, string index, string runningnumber) {
		if (U.EffectPresent(Caller, mesh, effect)) {
			if (effect[0,6] == "scheme") {
				Caller.SetFXTextureReplacement(effect, schemes, schememanagers.GetNamedSoup(schememanager).GetNamedTagAsInt(index));
			}
			else {
				Caller.SetFXTextureReplacement(effect, schemes, schememanagers.GetNamedSoup(schememanager).GetNamedTagAsInt(index));
			}
		}
		else U.Error("Configuration Error",U.UserString("Effect_not_found") + effect);
/*		else U.Error(U.UserString("Configuration_Error"),Caller,
			U.UserString("Effect_not_found") + "<b>" + effect + "</b>", 0);*/
	}

	void SetScheme(void) {
		if (!textured5 or !U.TrainPresent(Caller)) {return;}
//	schememanager = SSSoup.GetNamedTagAsInt("schememanager");
		if (schememanager <= 0) {
			schememanager = GetSchemeDefault();
			if (schememanager == 0) {
				schememanager = Caller.GetAsset().GetConfigSoup().GetNamedSoup("extensions").GetNamedTagAsInt("default");
			}
			if (schememanager == 0) {
				schememanager = schemes.GetConfigSoup().GetNamedSoup("extensions").GetNamedTagAsInt("default");
			}
			if (schememanager == 0) {schememanager = Math.Rand(1,schememanagers.CountTags());}
		}
		if (schememanager != SSSoup.GetNamedTagAsInt("schememanager")) {
			SSSoup.SetNamedTag("schememanager",schememanager);
		}
		int n, x;
// Traincar textures
		Soup texeffects = extensions.GetNamedSoup("scheme-textures");
		for (n = 0; n < texeffects.CountTags(); n++) {
			string prefix = texeffects.GetIndexedTagName(n);
			string meshnames = texeffects.GetNamedTag(prefix);
			string[] meshes = Str.Tokens(meshnames,",");
			for (x = 0; x < meshes.size(); x++) {
				ReplaceTextureScheme(meshes[x], prefix + "-" + x, prefix, schememanager);
			}	
		}
	}
	
	void ReplaceTextureAdvert(string mesh, string effect, string index, string runningnumber) {
		if (U.EffectPresent(Caller, mesh, effect)) {
			if (effect[0,6] == "advert") {
				Caller.SetFXTextureReplacement(effect, adverts, advertmanagers.GetNamedSoup(advertmanager).GetNamedTagAsInt(index));
			}
			else {
				Caller.SetFXTextureReplacement(effect, adverts, advertmanagers.GetNamedSoup(advertmanager).GetNamedTagAsInt(index));
			}
		}
		else U.Error("Configuration Error",U.UserString("Effect_not_found") + effect);
/*		else U.Error(U.UserString("Configuration_Error"),Caller,
			U.UserString("Effect_not_found") + "<b>" + effect + "</b>", 0);*/
	}

	void SetAdvert(void) {
		if (!textured3 or !U.TrainPresent(Caller)) {return;}
//	advertmanager = SSSoup.GetNamedTagAsInt("advertmanager");
		if (advertmanager <= 0) {
			advertmanager = GetAdvertDefault();
			if (advertmanager == 0) {
				advertmanager = Caller.GetAsset().GetConfigSoup().GetNamedSoup("extensions").GetNamedTagAsInt("default");
			}
			if (advertmanager == 0) {
				advertmanager = adverts.GetConfigSoup().GetNamedSoup("extensions").GetNamedTagAsInt("default");
			}
			if (advertmanager == 0) {advertmanager = Math.Rand(1,advertmanagers.CountTags());}
		}
		if (advertmanager != SSSoup.GetNamedTagAsInt("advertmanager")) {
			SSSoup.SetNamedTag("advertmanager",advertmanager);
		}
		int n, x;
// Traincar textures
		Soup texeffects = extensions.GetNamedSoup("advert-textures");
		for (n = 0; n < texeffects.CountTags(); n++) {
			string prefix = texeffects.GetIndexedTagName(n);
			string meshnames = texeffects.GetNamedTag(prefix);
			string[] meshes = Str.Tokens(meshnames,",");
			for (x = 0; x < meshes.size(); x++) {
				ReplaceTextureAdvert(meshes[x], prefix + "-" + x, prefix, advertmanager);
			}	
		}
	}
	
	void ReplaceTextureDriver(string mesh, string effect, string index, string runningnumber) {
		if (U.EffectPresent(Caller, mesh, effect)) {
			if (effect[0,6] == "driver") {
				Caller.SetFXTextureReplacement(effect, drivers, drivermanagers.GetNamedSoup(drivermanager).GetNamedTagAsInt(index));
			}
			else {
				Caller.SetFXTextureReplacement(effect, drivers, drivermanagers.GetNamedSoup(drivermanager).GetNamedTagAsInt(index));
			}
		}
		else U.Error("Configuration Error",U.UserString("Effect_not_found") + effect);
/*		else U.Error(U.UserString("Configuration_Error"),Caller,
			U.UserString("Effect_not_found") + "<b>" + effect + "</b>", 0);*/
	}

	void SetDriver(void) {
		if (!textured4 or !U.TrainPresent(Caller)) {return;}
//	drivermanager = SSSoup.GetNamedTagAsInt("drivermanager");
		if (drivermanager <= 0) {
			drivermanager = GetDriverDefault();
			if (drivermanager == 0) {
				drivermanager = Caller.GetAsset().GetConfigSoup().GetNamedSoup("extensions").GetNamedTagAsInt("driverdefault");
			}
			if (drivermanager == 0) {
				drivermanager = drivers.GetConfigSoup().GetNamedSoup("extensions").GetNamedTagAsInt("driverdefault");
			}
			if (drivermanager == 0) {drivermanager = Math.Rand(1,drivermanagers.CountTags());}
		}
		if (drivermanager != SSSoup.GetNamedTagAsInt("drivermanager")) {
			SSSoup.SetNamedTag("drivermanager",drivermanager);
		}
		int n, x;
// Traincar textures
		Soup texeffects = extensions.GetNamedSoup("driver-textures");
		for (n = 0; n < texeffects.CountTags(); n++) {
			string prefix = texeffects.GetIndexedTagName(n);
			string meshnames = texeffects.GetNamedTag(prefix);
			string[] meshes = Str.Tokens(meshnames,",");
			for (x = 0; x < meshes.size(); x++) {
				ReplaceTextureDriver(meshes[x], prefix + "-" + x, prefix, drivermanager);
			}	
		}
	}

// onemesh REPLACEMENT ///////////////////////////////////////////////////////////////////////////////////////

	void Initonemesh(void) {
//	INITonemesh set initial state of onemeshes by looking for auto-create tags
//	the mesh for the first such tag found will be set active
// this routine just sets a variable, SETonemesh does the work
		int n;
		onemesh = 0;
		Soup meshtable = Caller.GetAsset().GetConfigSoup().GetNamedSoup("mesh-table");
		for (n = 1; n < onemeshes.CountTags(); n++) {
			string meshname = onemeshes.GetIndexedTagName(n);
			if (meshtable.GetNamedSoup(meshname).GetNamedTagAsBool("auto-create")) {
				onemesh = n;
				return;
			}
		}
	}

	void Setonemesh(void) {
// SETonemesh displays the selected onemesh and hides all others
		if (!attached) {return;}
		int n;
		string mesh;
	// That bug again
		if (!U.TrainPresent(Caller)) {return;}
	// complete reset to make sure
		for (n = 1; n < onemeshes.CountTags(); n++) {
			mesh = onemeshes.GetIndexedTagName(n);
			if (Caller.HasMesh(mesh)) {Caller.SetMeshVisible(mesh,false,0.0);}
		}
	// enable mesh
		mesh = onemeshes.GetIndexedTagName(onemesh);
		if (Caller.HasMesh(mesh)) {Caller.SetMeshVisible(mesh,true,0.0);}
	//	save to soup
		SSSoup.SetNamedTag("onemesh",onemesh);
	}
	
	void Inittwomesh(void) {
		int n;
		twomesh = 0;
		Soup meshtable = Caller.GetAsset().GetConfigSoup().GetNamedSoup("mesh-table");
		for (n = 1; n < twomeshes.CountTags(); n++) {
			string meshname = twomeshes.GetIndexedTagName(n);
			if (meshtable.GetNamedSoup(meshname).GetNamedTagAsBool("auto-create")) {
				twomesh = n;
				return;
			}
		}
	}

	void Settwomesh(void) {
		if (!attached2) {return;}
		int n;
		string mesh;
		if (!U.TrainPresent(Caller)) {return;}
		for (n = 1; n < twomeshes.CountTags(); n++) {
			mesh = twomeshes.GetIndexedTagName(n);
			if (Caller.HasMesh(mesh)) {Caller.SetMeshVisible(mesh,false,0.0);}
		}
		mesh = twomeshes.GetIndexedTagName(twomesh);
		if (Caller.HasMesh(mesh)) {Caller.SetMeshVisible(mesh,true,0.0);}
		SSSoup.SetNamedTag("twomesh",twomesh);
	}
	
	void Initthreemesh(void) {
		int n;
		threemesh = 0;
		Soup meshtable = Caller.GetAsset().GetConfigSoup().GetNamedSoup("mesh-table");
		for (n = 1; n < threemeshes.CountTags(); n++) {
			string meshname = threemeshes.GetIndexedTagName(n);
			if (meshtable.GetNamedSoup(meshname).GetNamedTagAsBool("auto-create")) {
				threemesh = n;
				return;
			}
		}
	}

	void Setthreemesh(void) {
		if (!attached3) {return;}
		int n;
		string mesh;
		if (!U.TrainPresent(Caller)) {return;}
		for (n = 1; n < threemeshes.CountTags(); n++) {
			mesh = threemeshes.GetIndexedTagName(n);
			if (Caller.HasMesh(mesh)) {Caller.SetMeshVisible(mesh,false,0.0);}
		}
		mesh = threemeshes.GetIndexedTagName(threemesh);
		if (Caller.HasMesh(mesh)) {Caller.SetMeshVisible(mesh,true,0.0);}
		SSSoup.SetNamedTag("threemesh",threemesh);
	}
	
	void Initfourmesh(void) {
		int n;
		fourmesh = 0;
		Soup meshtable = Caller.GetAsset().GetConfigSoup().GetNamedSoup("mesh-table");
		for (n = 1; n < fourmeshes.CountTags(); n++) {
			string meshname = fourmeshes.GetIndexedTagName(n);
			if (meshtable.GetNamedSoup(meshname).GetNamedTagAsBool("auto-create")) {
				fourmesh = n;
				return;
			}
		}
	}

	void Setfourmesh(void) {
		if (!attached4) {return;}
		int n;
		string mesh;
		if (!U.TrainPresent(Caller)) {return;}
		for (n = 1; n < fourmeshes.CountTags(); n++) {
			mesh = fourmeshes.GetIndexedTagName(n);
			if (Caller.HasMesh(mesh)) {Caller.SetMeshVisible(mesh,false,0.0);}
		}
		mesh = fourmeshes.GetIndexedTagName(fourmesh);
		if (Caller.HasMesh(mesh)) {Caller.SetMeshVisible(mesh,true,0.0);}
		SSSoup.SetNamedTag("fourmesh",fourmesh);
	}
	
	void Initfivemesh(void) {
		int n;
		fivemesh = 0;
		Soup meshtable = Caller.GetAsset().GetConfigSoup().GetNamedSoup("mesh-table");
		for (n = 1; n < fivemeshes.CountTags(); n++) {
			string meshname = fivemeshes.GetIndexedTagName(n);
			if (meshtable.GetNamedSoup(meshname).GetNamedTagAsBool("auto-create")) {
				fivemesh = n;
				return;
			}
		}
	}

	void Setfivemesh(void) {
		if (!attached5) {return;}
		int n;
		string mesh;
		if (!U.TrainPresent(Caller)) {return;}
		for (n = 1; n < fivemeshes.CountTags(); n++) {
			mesh = fivemeshes.GetIndexedTagName(n);
			if (Caller.HasMesh(mesh)) {Caller.SetMeshVisible(mesh,false,0.0);}
		}
		mesh = fivemeshes.GetIndexedTagName(fivemesh);
		if (Caller.HasMesh(mesh)) {Caller.SetMeshVisible(mesh,true,0.0);}
		SSSoup.SetNamedTag("fivemesh",fivemesh);
	}
	
	void Initsixmesh(void) {
		int n;
		sixmesh = 0;
		Soup meshtable = Caller.GetAsset().GetConfigSoup().GetNamedSoup("mesh-table");
		for (n = 1; n < sixmeshes.CountTags(); n++) {
			string meshname = sixmeshes.GetIndexedTagName(n);
			if (meshtable.GetNamedSoup(meshname).GetNamedTagAsBool("auto-create")) {
				sixmesh = n;
				return;
			}
		}
	}

	void Setsixmesh(void) {
		if (!attached6) {return;}
		int n;
		string mesh;
		if (!U.TrainPresent(Caller)) {return;}
		for (n = 1; n < sixmeshes.CountTags(); n++) {
			mesh = sixmeshes.GetIndexedTagName(n);
			if (Caller.HasMesh(mesh)) {Caller.SetMeshVisible(mesh,false,0.0);}
		}
		mesh = sixmeshes.GetIndexedTagName(sixmesh);
		if (Caller.HasMesh(mesh)) {Caller.SetMeshVisible(mesh,true,0.0);}
		SSSoup.SetNamedTag("sixmesh",sixmesh);
	}
		
// DOOR CONTROL /////////////////////////////////////////////////////////////////////////////////////////////
	void CloseVehiclePassengerDoors(Vehicle vehicle, string p_meshName) 
	{
		float pos = vehicle.GetMeshAnimationFrame(p_meshName);
		if (pos < 10) return; //already closed
		vehicle.SetMeshAnimationFrame(p_meshName, 60.0); //resolve delay 1 sec on back door animation
		vehicle.SetDoorAnimationState(p_meshName, false);
	}

	// modes: 0=close 1=open left 2=open right
	void SetDoors(Vehicle v, int mode)
	{
		bool hasDoors = U.VehicleHasDoors(v, mode),
			 hasDoorsTech = U.VehicleHasDoorsTech(v, mode);	
		if (mode == 0)
		{
			if (hasDoors)
			{
				CloseVehiclePassengerDoors(v, "left-passenger-door");
				CloseVehiclePassengerDoors(v, "right-passenger-door");
			}
			if (hasDoorsTech)
			{
				v.SetDoorAnimationState("left-door",false);
				v.SetDoorAnimationState("right-door",false);
			}
		}
		else
		{
			bool facing = v.GetDirectionRelativeToTrain();
			if (mode == 1)
			{
				if (hasDoors)
				{
					if (facing) 
						v.SetDoorAnimationState("left-passenger-door",true);
					else 
						v.SetDoorAnimationState("right-passenger-door",true);
				}
				if (hasDoorsTech)
				{
					if (facing) 
						v.SetDoorAnimationState("left-door",true);
					else 
						v.SetDoorAnimationState("right-door",true);
				}			
			}
			else
			{
				if (hasDoors)
				{
					if (facing) 
						v.SetDoorAnimationState("right-passenger-door",true);
					else
						v.SetDoorAnimationState("left-passenger-door",true);
				}
				if (hasDoorsTech)
				{
					if (facing) 
						v.SetDoorAnimationState("right-door",true);
					else
						v.SetDoorAnimationState("left-door",true);
				}			
			}
		}
	}
	
	void SetDoors(Train train, int mode) 
	{
	// modes: 0=close 1=open left 2=open right
		Vehicle[] vehicles = train.GetVehicles();
		int i, len = vehicles.size();
		switch (mode) 
		{
			case 0: //close both
				for (i = 0; i < len; i++) 
				{
					vehicles[i].SetDoorAnimationState("left-passenger-door",false);
					vehicles[i].SetDoorAnimationState("right-passenger-door",false);
				}
				break;
			case 1:	//open left	
				for (i = 0; i < len; i++) 
				{
					if (vehicles[i].GetDirectionRelativeToTrain()) 
						vehicles[i].SetDoorAnimationState("left-passenger-door",true);
					else 
						vehicles[i].SetDoorAnimationState("right-passenger-door",true);
				}
				break;
			case 2:		
				for (i = 0; i < len; i++) 
				{
					if (vehicles[i].GetDirectionRelativeToTrain()) 
						vehicles[i].SetDoorAnimationState("right-passenger-door",true);
					else
						vehicles[i].SetDoorAnimationState("left-passenger-door",true);
				}				
				break;
			default:	
				break;
		}		
	}
	
	void SetDoorsTech(Train train, int mode) 
	{
	// modes: 0=close 1=open left 2=open right
		Vehicle[] vehicles = train.GetVehicles();
		int i, len = vehicles.size();
		switch(mode) 
		{
			case 0: 	
				for(i = 0; i < len; i++) 
				{			
					vehicles[i].SetMeshAnimationState("left-door",false);
					vehicles[i].SetMeshAnimationState("right-door",false);
				}
				break;
			case 1:		
				for(i = 0; i < len; i++) 
				{			
					if (vehicles[i].GetDirectionRelativeToTrain()) 
						vehicles[i].SetMeshAnimationState("left-door",true);
					else
						vehicles[i].SetMeshAnimationState("right-door",true);
				}
				break;
			case 2:		
				for(i = 0; i < len; i++) 
				{			
					if (vehicles[i].GetDirectionRelativeToTrain()) 
						vehicles[i].SetMeshAnimationState("right-door",true);
					else 
						vehicles[i].SetMeshAnimationState("left-door",true);
				}
				break;
			default:	
				break;
		}	
	}
	
	void SetDoorsCab(Train train, int mode) {
	// modes: 0=close 1=open left 2=open right
		int n;
		Vehicle[] vehicles = train.GetVehicles();
		for(n = 0; n < vehicles.size(); n++) {
			switch(mode) {
				case 0: 	vehicles[n].SetMeshAnimationState("cabl",false);
									vehicles[n].SetMeshAnimationState("cabr",false);
									break;
				case 1:		if (vehicles[n].GetDirectionRelativeToTrain()) {
										vehicles[n].SetMeshAnimationState("cabl",true);
									} else {
										vehicles[n].SetMeshAnimationState("cabr",true);
									}
									break;
				case 2:		if (vehicles[n].GetDirectionRelativeToTrain()) {
										vehicles[n].SetMeshAnimationState("cabr",true);
									} else {
										vehicles[n].SetMeshAnimationState("cabl",true);
									}
									break;
				default:	break;
			}		
		}	
	}
	
	void SetDoorsCabFB(Train train, int mode) {
	// modes: 0=close 1=open left 2=open right
		int n;
		Vehicle[] vehicles = train.GetVehicles();
		for(n = 0; n < vehicles.size(); n++) {
			switch(mode) {
				case 0: 	vehicles[n].SetMeshAnimationState("cabf",false);
									vehicles[n].SetMeshAnimationState("cabb",false);
									break;
				case 1:		if (vehicles[n].GetDirectionRelativeToTrain()) {
										vehicles[n].SetMeshAnimationState("cabf",true);
									} else {
										vehicles[n].SetMeshAnimationState("cabb",true);
									}
									break;
				case 2:		if (vehicles[n].GetDirectionRelativeToTrain()) {
										vehicles[n].SetMeshAnimationState("cabb",true);
									} else {
										vehicles[n].SetMeshAnimationState("cabf",true);
									}
									break;
				default:	break;
			}		
		}	
	}
	
	void SetDoorsVagFB(Train train, int mode) {
	// modes: 0=close 1=open left 2=open right
		int n;
		Vehicle[] vehicles = train.GetVehicles();
		for(n = 0; n < vehicles.size(); n++) {
			switch(mode) {
				case 0: 	vehicles[n].SetMeshAnimationState("vagf",false);
									vehicles[n].SetMeshAnimationState("vagb",false);
									break;
				case 1:		if (vehicles[n].GetDirectionRelativeToTrain()) {
										vehicles[n].SetMeshAnimationState("vagf",true);
									} else {
										vehicles[n].SetMeshAnimationState("vagb",true);
									}
									break;
				case 2:		if (vehicles[n].GetDirectionRelativeToTrain()) {
										vehicles[n].SetMeshAnimationState("vagb",true);
									} else {
										vehicles[n].SetMeshAnimationState("vagf",true);
									}
									break;
				default:	break;
			}		
		}	
	}

// WIPERS ////////////////////////////////////////////////////////////////////////////////////////////////////

	void SetWiper(bool mode0, bool mode1) {
// SetMeshAnimation calls can be made on rightwiper meshes
		if (Caller.HasMesh("leftwiper-0") or Caller.HasMesh("rightwiper-0")) {
			if (raining and mode0) {
				Caller.StartMeshAnimationLoop("leftwiper-0");
				Caller.StartMeshAnimationLoop("rightwiper-0");
			} else {
				Caller.StopMeshAnimation("leftwiper-0");
				Caller.SetMeshAnimationFrame("leftwiper-0",1.0);
				Caller.StopMeshAnimation("rightwiper-0");
				Caller.SetMeshAnimationFrame("rightwiper-0",1.0);
			}
		}
		if (Caller.HasMesh("leftwiper-1") or Caller.HasMesh("rightwiper-1")) {
			if (raining and mode1) {
				Caller.StartMeshAnimationLoop("leftwiper-1");
				Caller.StartMeshAnimationLoop("rightwiper-1");
			} else {
				Caller.StopMeshAnimation("leftwiper-1");
				Caller.SetMeshAnimationFrame("leftwiper-1",1.0);
				Caller.StopMeshAnimation("rightwiper-1");
				Caller.SetMeshAnimationFrame("rightwiper-1",1.0);
			}
		}
	}
	
	void SetWipers() 
	{		
		bool run = (cast<CyriScriptSecondary>(Caller)).IsDriverShowed(),
			 electro = Caller.GetProperties().GetNamedTagAsBool("electromanager");
		
	//Interface.Print(Caller.GetName()+":SetWipers:run="+run);
		if (run and electro)
			SetWiper(facing,!facing);
		else
			SetWiper(false,false);
/*
		switch (position) 
		{
			case CAR_CENTER: SetWiper(false,false); break;
			case CAR_FRONT: SetWiper(facing,!facing); break;
			case CAR_BACK: SetWiper(false,false); break;
			case CAR_SINGLE: SetWiper(facing,!facing); break;
			default: SetWiper(false,false); break; // CAR_DERAILED
		}
*/		
	}

// BRAKELIGHTS & FLASHERS ////////////////////////////////////////////////////////////////////////////////////

	void BrakeLights(Vehicle Caller,Soup SSSoup) {
// brake lights operate on last vehicle in train only
		if (!U.EffectPresent(Caller,"default","brakelamp-0")) return;
		Vehicle[] vehicles = Caller.GetMyTrain().GetVehicles();
		if (Caller != vehicles[vehicles.size()-1]) return;
		Asset stoplamp = U.GetCorona(Caller,"default","brakelamp-0");
		float newspeed = Caller.GetVelocity();
		float speed = SSSoup.GetNamedTagAsFloat("speed");
		if (Math.Fabs(newspeed) == 0.0) {															// stopped
			int n = 0;
			while (U.EffectPresent(Caller,"default","brakelamp-" + n)) {
				Caller.SetFXCoronaTexture("brakelamp-" + n,null);
				n++;
			}
		} 
		else if (Math.Fabs(newspeed) - Math.Fabs(speed) < BrakeDelta) {				// slowing down
			int n = 0;
			while (U.EffectPresent(Caller,"default","brakelamp-" + n)) {
				Caller.SetFXCoronaTexture("brakelamp-" + n,stoplamp);
				n++;
			}
		} 
		else {																												// speeding up
			int n = 0;
			while (U.EffectPresent(Caller,"default","brakelamp-" + n)) {
				Caller.SetFXCoronaTexture("brakelamp-" + n,null);
				n++;
			}
		}
		SSSoup.SetNamedTag("speed",newspeed);
	}

	void Indicate(Vehicle Caller, int direction) {
		if (!U.EffectPresent(Caller,"default","flasher-0")) return;
		Asset flasher = null;
		if ((direction == 0) or (direction == 2)) flasher = U.GetCorona(Caller,"default","flasher-0");
	// swap sides if car is reversed
		if (!Caller.GetDirectionRelativeToTrain()) direction = 2 - direction;
	// swap sides if train is reversing		
		if (Caller.GetMyTrain().GetSmoothedVelocity() < 0.0) direction = 2 - direction;
		int n = 0;
		switch (direction) {
			case 0:		while (U.EffectPresent(Caller,"default","flasher-" + n)) {
									if (n % 2 == 0) { // left side flashers
										Caller.SetFXCoronaTexture("flasher-" + n, flasher);
									} else {
										Caller.SetFXCoronaTexture("flasher-" + n, null);
									}
									n++;
								}
								break;
			case 2:		while (U.EffectPresent(Caller,"default","flasher-" + n)) {
									if (n % 2 == 1) { // right side flashers
										Caller.SetFXCoronaTexture("flasher-" + n, flasher);
									} else {
										Caller.SetFXCoronaTexture("flasher-" + n, null);
									}
									n++;
								}
								break;
			default:	while (U.EffectPresent(Caller,"default","flasher-" + n)) {
									Caller.SetFXCoronaTexture("flasher-" + n, null);
									n++;
								}
								break;
		}
	}
	
	void Indicators(Vehicle Caller, Soup SSSoup) {
		int n, j;
		Train train = Caller.GetMyTrain();
		Vehicle[] vehicles = train.GetVehicles();
		if (Caller != vehicles[vehicles.size()-1]) return; // last car does the calculations
		bool indicating = SSSoup.GetNamedTagAsBool("indicating");
// stopped whilst indicating
		if (Caller.GetVelocity() == 0.0 and indicating) {
			SSSoup.SetNamedTag("indicating",false);
			for (j = 0; j < vehicles.size(); j++) Indicate(vehicles[j],-1);
			return;
		}
// direction is relative to train		
		MapObject[] targets = train.TrackSearch(train.GetSmoothedVelocity() > 0.0, IndicatorDistance);
//	MapObject[] targets = train.TrackSearch(true, IndicatorDistance);
		for (n = 0; n < targets.size(); n++) {
			Junction junction = cast<Junction>(targets[n]);
			if (junction) {
				SSSoup.SetNamedTag("indicating",true);
				int dir = junction.GetDirectionToTrain(train);
				if (dir == -1) {
					for (j = 0; j < vehicles.size(); j++) Indicate(vehicles[j],junction.GetDirection());
				} else {
					for (j = 0; j < vehicles.size(); j++) Indicate(vehicles[j],2 - dir);
				}
				return;
			} // if junction
		}
// no junction
		if (indicating) {
			SSSoup.SetNamedTag("indicating",false);
			for (j = 0; j < vehicles.size(); j++) Indicate(vehicles[j],-1);
		}
	}
	
// ENVIRONMENT ///////////////////////////////////////////////////////////////////////////////////////////////

	int GetPosition(void) {
//	GETPOSITION retrieve environment variables from shared soup
		LocoCoupled = false;
		int result = CAR_CENTER;
		Train train = Caller.GetMyTrain();
		if (train) {
			Vehicle[] vehicles = train.GetVehicles();
			trainsize = vehicles.size();
			if (Caller == vehicles[0]) {result = result + CAR_FRONT;}
			if (Caller == vehicles[vehicles.size() - 1]) {result = result + CAR_BACK;}
			if (train.GetFrontmostLocomotive()) {LocoCoupled = true;}
			facing = Caller.GetDirectionRelativeToTrain();
		}
		return result;
	}

	void SavePosition(void) {
// SAVEPOSITION write environment variables back to shared soup
		SSSoup.SetNamedTag("position",position);
		SSSoup.SetNamedTag("facing",facing);
		SSSoup.SetNamedTag("LocoCoupled",LocoCoupled);
		SSSoup.SetNamedTag("trainsize",trainsize);
	}

// LIBRARY CALLS /////////////////////////////////////////////////////////////////////////////////////////////

	public string LibraryCall(string function, string[] Strings, GSObject[] Objects) {
	
		string defaultexbodystring = "";
		string exbodymanagerstring = "";
		string defaultinteriorstring = "";
		string interiormanagerstring = "";
		string defaultschemestring = "";
		string schememanagerstring = "";
		string defaultadvertstring = "";
		string advertmanagerstring = "";
		string defaultdriverstring = "";
		string drivermanagerstring = "";
		Caller = cast<Vehicle>Objects[0];
		if (Caller) {
			SSSoup = cast<Soup>Objects[1];
			if (!SSSoup) U.Error("System Error",U.UserString("Cannot_cast_Soup"));
//	if (!SSSoup) {U.Error("",Caller,U.UserString("Cannot_cast_Soup"),0);}
		// copied for convenience
		// cuts speed of response on calls that don't need them
			extensions = Caller.GetAsset().GetConfigSoup().GetNamedSoup("extensions");
			textured = extensions.GetNamedSoup("exbody-textures").CountTags() > 0;
			textured2 = extensions.GetNamedSoup("interior-textures").CountTags() > 0;
			textured3 = extensions.GetNamedSoup("advert-textures").CountTags() > 0;
			textured4 = extensions.GetNamedSoup("driver-textures").CountTags() > 0;
			textured5 = extensions.GetNamedSoup("scheme-textures").CountTags() > 0;
			if (textured) {
				exbodies = Caller.GetAsset().FindAsset("exbodies");
				exbodymanagers = exbodies.GetConfigSoup().GetNamedSoup("extensions").GetNamedSoup("exbodymanagers");
				exbodymanager = SSSoup.GetNamedTagAsInt("exbodymanager");
				defaultexbodystring = exbodymanagers.GetNamedSoup(GetexbodyDefault()).GetNamedTag("exbodymanager");
				exbodymanagerstring = exbodymanagers.GetNamedSoup(exbodymanager).GetNamedTag("exbodymanager");
			}
			if (textured2) {
				interiors = Caller.GetAsset().FindAsset("interiors");
				interiormanagers = interiors.GetConfigSoup().GetNamedSoup("extensions").GetNamedSoup("interiormanagers");
				interiormanager = SSSoup.GetNamedTagAsInt("interiormanager");
				defaultinteriorstring = interiormanagers.GetNamedSoup(GetinteriorDefault()).GetNamedTag("interiormanager");
				interiormanagerstring = interiormanagers.GetNamedSoup(interiormanager).GetNamedTag("interiormanager");
			}
			if (textured3) {
				adverts = Caller.GetAsset().FindAsset("adverts");
				advertmanagers = adverts.GetConfigSoup().GetNamedSoup("extensions").GetNamedSoup("advertmanagers");
				advertmanager = SSSoup.GetNamedTagAsInt("advertmanager");
				defaultadvertstring = advertmanagers.GetNamedSoup(GetAdvertDefault()).GetNamedTag("advertmanager");
				advertmanagerstring = advertmanagers.GetNamedSoup(advertmanager).GetNamedTag("advertmanager");
			}
			if (textured4) {
				drivers = Caller.GetAsset().FindAsset("drivers");
				drivermanagers = drivers.GetConfigSoup().GetNamedSoup("extensions").GetNamedSoup("drivermanagers");
				drivermanager = SSSoup.GetNamedTagAsInt("drivermanager");
				defaultdriverstring = drivermanagers.GetNamedSoup(GetDriverDefault()).GetNamedTag("drivermanager");
				drivermanagerstring = drivermanagers.GetNamedSoup(drivermanager).GetNamedTag("drivermanager");
			}
			if (textured5) {
				schemes = Caller.GetAsset().FindAsset("schemes");
				schememanagers = schemes.GetConfigSoup().GetNamedSoup("extensions").GetNamedSoup("schememanagers");
				schememanager = SSSoup.GetNamedTagAsInt("schememanager");
				defaultschemestring = schememanagers.GetNamedSoup(GetSchemeDefault()).GetNamedTag("schememanager");
				schememanagerstring = schememanagers.GetNamedSoup(schememanager).GetNamedTag("schememanager");
			}
			attached = extensions.GetNamedSoup("onemeshes").CountTags() > 0;
			if (attached) {
				onemeshes = extensions.GetNamedSoup("onemeshes");
				onemesh = SSSoup.GetNamedTagAsInt("onemesh");
				if (onemesh == -2) {Initonemesh();}
				onemeshname = onemeshes.GetNamedTag(onemeshes.GetIndexedTagName(onemesh));
			}
			attached2 = extensions.GetNamedSoup("twomeshes").CountTags() > 0;
			if (attached2) {
				twomeshes = extensions.GetNamedSoup("twomeshes");
				twomesh = SSSoup.GetNamedTagAsInt("twomesh");
				if (twomesh < 0) {Inittwomesh();}
		
//			Interface.Print("twomesh="+twomesh+",CountTags="+twomeshes.CountTags());				
				if (twomeshes.CountTags() > twomesh)
					twomeshname = twomeshes.GetNamedTag(twomeshes.GetIndexedTagName(twomesh));
//			Interface.Print("twomeshname="+twomeshname);				
			}
			attached3 = extensions.GetNamedSoup("threemeshes").CountTags() > 0;
			if (attached3) {
				threemeshes = extensions.GetNamedSoup("threemeshes");
				threemesh = SSSoup.GetNamedTagAsInt("threemesh");
				if (threemesh == -2) {Initthreemesh();}
				threemeshname = threemeshes.GetNamedTag(threemeshes.GetIndexedTagName(threemesh));
			}
			attached4 = extensions.GetNamedSoup("fourmeshes").CountTags() > 0;
			if (attached4) {
				fourmeshes = extensions.GetNamedSoup("fourmeshes");
				fourmesh = SSSoup.GetNamedTagAsInt("fourmesh");
				if (fourmesh == -2) {Initfourmesh();}
				fourmeshname = fourmeshes.GetNamedTag(fourmeshes.GetIndexedTagName(fourmesh));
			}
			attached5 = extensions.GetNamedSoup("fivemeshes").CountTags() > 0;
			if (attached5) {
				fivemeshes = extensions.GetNamedSoup("fivemeshes");
				fivemesh = SSSoup.GetNamedTagAsInt("fivemesh");
				if (fivemesh == -2) {Initfivemesh();}
				fivemeshname = fivemeshes.GetNamedTag(fivemeshes.GetIndexedTagName(fivemesh));
			}
			attached6 = extensions.GetNamedSoup("sixmeshes").CountTags() > 0;
			if (attached6) {
				sixmeshes = extensions.GetNamedSoup("sixmeshes");
				sixmesh = SSSoup.GetNamedTagAsInt("sixmesh");
				if (sixmesh == -2) {Initsixmesh();}
				sixmeshname = sixmeshes.GetNamedTag(sixmeshes.GetIndexedTagName(sixmesh));
			}
			U.UserStrings = Caller.GetAsset().GetStringTable();
		}
		
		if (function == "ViewDetails") {
			StringTable strTable = cast<StringTable>Objects[2];
			Train train = Caller.GetMyTrain();
			string html = "<html><body>";
			DriverCharacter driver = train.GetActiveDriver();
		// Driver icon and Train name
			html = html + "<table><tr height=32>";
			if (driver) html = html + "<td><img kuid='" + driver.GetAsset().GetKUID().GetHTMLString() 
			+ "' width=32 height=32></td>";
			html = html + "<td>" + U.font3 + BrowserInterface.Quote(train.GetTrainDisplayName()) + U.endFont 
			+ "</td></tr></table>";
			Vehicle[] vehicles = train.GetVehicles();
			Locomotive loco = train.GetFrontmostLocomotive();
			int i;
		// Priority on track
			html = html + "<p>" + U.font0 + U.UserString("priority") 
			+ "<a href='live://property/priority-number'>" + (string)train.GetTrainPriorityNumber() 
			+ "</a>" + U.endFont + "</p><br>";
		// optional features - heading
			if (extensions.GetNamedTagAsBool("heading")) {
				html = html + "<p>" + U.font0
				+ U.UserString("Train_Heading")
				+ ": <a href='live://property/turnaround'>" + heading + "</a>" + U.endFont + "</p>";
			}
		// optional features - doors
			if (U.TrainHasDoors(Caller.GetMyTrain(),1)) {
				html = html + "<p>" + U.font0
				+ U.UserString("left_doors")
				+ "<a href='live://property/doors-left'>" + "<img kuid=<kuid:486576:109>" + "</a> "
				+ "<a href='live://property/doors-close'>" + "<img kuid=<kuid:486576:110>" + "</a>" + U.endFont + "</p>";
			}
			if (U.TrainHasDoors(Caller.GetMyTrain(),2)) {
				html = html + "<p>" + U.font0
				+ U.UserString("right_doors")
				+ "<a href='live://property/doors-right'>" + "<img kuid=<kuid:486576:109>" + "</a> "
				+ "<a href='live://property/doors-close'>" + "<img kuid=<kuid:486576:110>" + "</a>" + U.endFont + "</p>";
			}
			if (U.TrainHasDoorsTech(Caller.GetMyTrain(),1)) {
				html = html + "<p>" + U.font0
				+ U.UserString("left_doorsTech")
				+ "<a href='live://property/doorsTech-left'>" + "<img kuid=<kuid:486576:109>" + "</a> "
				+ "<a href='live://property/doorsTech-close'>" + "<img kuid=<kuid:486576:110>" + "</a>" + U.endFont + "</p>";
			}
			if (U.TrainHasDoorsTech(Caller.GetMyTrain(),2)) {
				html = html + "<p>" + U.font0
				+ U.UserString("right_doorsTech")
				+ "<a href='live://property/doorsTech-right'>" + "<img kuid=<kuid:486576:109>" + "</a> "
				+ "<a href='live://property/doorsTech-close'>" + "<img kuid=<kuid:486576:110>" + "</a>" + U.endFont + "</p>";
			}
			if (U.TrainHasDoorsCab(Caller.GetMyTrain(),1)) {
				html = html + "<p>" + U.font0
				+ U.UserString("left_doorsCab")
				+ "<a href='live://property/doorsCab-left'>" + "<img kuid=<kuid:486576:109>" + "</a> "
				+ "<a href='live://property/doorsCab-close'>" + "<img kuid=<kuid:486576:110>" + "</a>" + U.endFont + "</p>";
			}
			if (U.TrainHasDoorsCab(Caller.GetMyTrain(),2)) {
				html = html + "<p>" + U.font0
				+ U.UserString("right_doorsCab")
				+ "<a href='live://property/doorsCab-right'>" + "<img kuid=<kuid:486576:109>" + "</a> "
				+ "<a href='live://property/doorsCab-close'>" + "<img kuid=<kuid:486576:110>" + "</a>" + U.endFont + "</p>";
			}
			if (U.TrainHasDoorsCabFB(Caller.GetMyTrain(),1)) {
				html = html + "<p>" + U.font0
				+ U.UserString("left_doorsCabFB")
				+ "<a href='live://property/doorsCabFB-left'>" + "<img kuid=<kuid:486576:109>" + "</a> "
				+ "<a href='live://property/doorsCabFB-close'>" + "<img kuid=<kuid:486576:110>" + "</a>" + U.endFont + "</p>";
			}
			if (U.TrainHasDoorsCabFB(Caller.GetMyTrain(),2)) {
				html = html + "<p>" + U.font0
				+ U.UserString("right_doorsCabFB")
				+ "<a href='live://property/doorsCabFB-right'>" + "<img kuid=<kuid:486576:109>" + "</a> "
				+ "<a href='live://property/doorsCabFB-close'>" + "<img kuid=<kuid:486576:110>" + "</a>" + U.endFont + "</p>";
			}
			if (U.TrainHasDoorsVagFB(Caller.GetMyTrain(),1)) {
				html = html + "<p>" + U.font0
				+ U.UserString("left_doorsVagFB")
				+ "<a href='live://property/doorsVagFB-left'>" + "<img kuid=<kuid:486576:109>" + "</a> "
				+ "<a href='live://property/doorsVagFB-close'>" + "<img kuid=<kuid:486576:110>" + "</a>" + U.endFont + "</p>";
			}
			if (U.TrainHasDoorsVagFB(Caller.GetMyTrain(),2)) {
				html = html + "<p>" + U.font0
				+ U.UserString("right_doorsVagFB")
				+ "<a href='live://property/doorsVagFB-right'>" + "<img kuid=<kuid:486576:109>" + "</a> "
				+ "<a href='live://property/doorsVagFB-close'>" + "<img kuid=<kuid:486576:110>" + "</a>" + U.endFont + "</p>";
			}
			html = html + "<p>" + U.font0
			+ U.UserString("show_driver")
			+ "<a href='live://property/ShowDriver'>" + "<img kuid=<kuid:486576:109>" + "</a> "
			+ "<a href='live://property/HideDriver'>" + "<img kuid=<kuid:486576:110>" + "</a>" + U.endFont + "</p>";
			html = html + "<p>" + U.font0
			+ U.UserString("electro_on-off")
			+ "<a href='live://property/electro,0'>" + "<img kuid=<kuid:486576:109>" + "</a> "
			+ "<a href='live://property/electro,1'>" + "<img kuid=<kuid:486576:110>" + "</a>" + U.endFont + "</p>";
		// Train - Vehicle separator
			html = html + "<br><table bgcolor=#FFFFFFD0 cellpadding=0 cellspacing=0 border=0><tr height=1><td width=100%></td></tr></table><br>";
			string quotedName = BrowserInterface.Quote(Caller.GetLocalisedName());
		// Vehicle icon and name
			KUID kuid = Caller.GetAsset().GetKUID();
			html = html + "<table><tr>";
			html = html + "<td><img kuid='" + kuid.GetHTMLString() + "' width=64 height=32></td>";
			html = html + "<td>" + U.font3 + quotedName + U.endFont + "</td>";
			html = html + "</tr></table>";
			html = html + "<p>" + U.font0 + strTable.GetString("interface-train-view-details-locomotive") 
			+ U.endFont + "</p>";

			int state = train.GetScheduleState();
			if (state != train.SS_NONE) {
				string historyString = train.GetScheduleStateString();
				html = html + "<p>" + U.font0 + "<i>" + BrowserInterface.Quote(historyString) + "</i>" + U.endFont + "</p>";
			}
		// Product Queues
			html = html + "<table>";
			bool isEmpty = true;
			ProductQueue[] vehicleQueues = Caller.GetQueues();
			for (i = 0; i < vehicleQueues.size(); i++) {
				ProductQueue vehicleQueue = vehicleQueues[i];
				Asset[] products = vehicleQueue.GetProductList();
				int l;
				for (l = 0; l < products.size(); l++) {
					html = html + HTMLWindow.GetPercentHTMLCode(null, vehicleQueue, products[l]);
					isEmpty = false;
				}
			}
		// Only report an empty queue if all queues are empty.
			if (isEmpty  and  (vehicleQueues.size() > 0)) html = html + strTable.GetString1("vehicle_view_details2", quotedName);
			return html + "</table></body></html>";
		}

		if (function == "AddHandlers") {
			Caller.Sniff(Caller.GetMyTrain(),"TrackMark","",true);
			Caller.AddHandler(Caller,"Vehicle","","MessageHandler");
			Caller.AddHandler(Caller,"World","","MessageHandler");
			Caller.AddHandler(Caller,"Train","","MessageHandler");
			Caller.AddHandler(Caller,"SS","","MessageHandler");
			Caller.AddHandler(Caller,"MapObject","","MessageHandler");
			Caller.AddHandler(Caller,"TrackMark","","MessageHandler");
			Caller.AddHandler(Caller,"Animation-Event","","MessageHandler");
			Caller.AddHandler(Caller,"Browser-Closed","","BrowserCloseHandler");
			Caller.AddHandler(Caller,"Browser-URL","","BrowserUrlHandler");
			return "";
		}

		if (function == "Refresh") { // called when Object Properties is cancelled
			if (!Caller.GetMyTrain()) {return "";}
			position = GetPosition();
			Setexbody();
			Setinterior();
			SetScheme();
			SetAdvert();
			SetDriver();
			SetWipers();
			SavePosition();
			Setonemesh();
			Settwomesh();
			Setthreemesh();
			Setfourmesh();
			Setfivemesh();
			Setsixmesh();
			return "";
		}

		if (function == "Message") { // called by message handler intercepts
			int n;
			string major = Strings[0];
			string minor = Strings[1];

			if (major == "AEC") major = "SS";
			else if (major == "SetDoors") {
				if (minor == "Open_left") SetDoors(Caller, 1);
				else if (minor == "Open_right") SetDoors(Caller, 2);
				else if (TrainUtil.HasPrefix(minor, "Close")) SetDoors(Caller, 0); 
			}
			else if (major == "Browser-URL") {
				if (minor == "live://property/priority-number") {
					Train train = Caller.GetMyTrain();
					train.SetTrainPriorityNumber(train.GetTrainPriorityNumber() % 3 + 1);
				}
				else if (minor == "live://property/doors-left") {
					SetDoors(Caller.GetMyTrain(),1);
				}
				else if (minor == "live://property/doors-right") {
					SetDoors(Caller.GetMyTrain(),2);
				}
				else if (minor == "live://property/doors-close") {
					SetDoors(Caller.GetMyTrain(),0);
				}
				else if (minor == "live://property/doorsTech-left") {
					SetDoorsTech(Caller.GetMyTrain(),1);
				}
				else if (minor == "live://property/doorsTech-right") {
					SetDoorsTech(Caller.GetMyTrain(),2);
				}
				else if (minor == "live://property/doorsTech-close") {
					SetDoorsTech(Caller.GetMyTrain(),0);
				}
				else if (minor == "live://property/doorsCab-left") {
					SetDoorsCab(Caller.GetMyTrain(),1);
				}
				else if (minor == "live://property/doorsCab-right") {
					SetDoorsCab(Caller.GetMyTrain(),2);
				}
				else if (minor == "live://property/doorsCab-close") {
					SetDoorsCab(Caller.GetMyTrain(),0);
				}
				else if (minor == "live://property/doorsCabFB-left") {
					SetDoorsCabFB(Caller.GetMyTrain(),1);
				}
				else if (minor == "live://property/doorsCabFB-right") {
					SetDoorsCabFB(Caller.GetMyTrain(),2);
				}
				else if (minor == "live://property/doorsCabFB-close") {
					SetDoorsCabFB(Caller.GetMyTrain(),0);
				}
				else if (minor == "live://property/doorsVagFB-left") {
					SetDoorsVagFB(Caller.GetMyTrain(),1);
				}
				else if (minor == "live://property/doorsVagFB-right") {
					SetDoorsVagFB(Caller.GetMyTrain(),2);
				}
				else if (minor == "live://property/doorsVagFB-close") {
					SetDoorsVagFB(Caller.GetMyTrain(),0);
				}
				else if (minor == "live://property/turnaround") {
					Caller.GetMyTrain().Turnaround();
					if (heading == U.UserString("Normal")) {
						heading = U.UserString("Reversed");
					} else {
						heading = U.UserString("Normal");
					}
				}
				else if (minor == "live://property/ShowDriver" or minor == "live://property/HideDriver")
				{
					Vehicle[] vehicles = Caller.GetMyTrain().GetVehicles();
					string cmd = Str.Tokens(minor, "/")[2];
					int i, len = vehicles.size();
					for (i = 0; i < len; i++)
						vehicles[i].PostMessage(vehicles[i], "Locomotive", cmd, 0);
				}
				else if (minor[0,23] == "live://property/electro")
				{
					Vehicle[] vehicles = Caller.GetMyTrain().GetVehicles();
					string val = Str.Tokens(minor, "/")[2];
					int i, len = vehicles.size();
					for (i = 0; i < len; i++)
						vehicles[i].PostMessage(vehicles[i], "SetProperty", val, 0);
				}
			}
			else if (major == "Vehicle") {
				if (minor == "Derailed" and Objects[2] == Caller) {
					position = CAR_DERAILED;
					SetWiper(false,false);
					Indicate(Caller,-1);
				}
			}

			else if (major == "World") {
				if (minor == "ModuleInit" and World.GetCurrentModule() == World.DRIVER_MODULE) {
					if (Caller.GetAsset().GetConfigSoup().GetNamedSoup("extensions").GetNamedTagAsBool("maskcouplers")) {
						Caller.GetMyTrain().SetCouplingMask(0);
					}
				}
			}

			else if (major == "SS") {
				if (!Caller) {return "";}
				else if (minor == "Setup") {
					CheckDependencies(Caller.GetAsset(),Caller);
					position = GetPosition();
					SetWipers();
					Setonemesh();
					Settwomesh();
					Setthreemesh();
					Setfourmesh();
					Setfivemesh();
					Setsixmesh();
					SavePosition();
					Setexbody();
					Setinterior();
					SetScheme();
					SetAdvert();
					SetDriver();
					int n = 0;
					while (U.EffectPresent(Caller,"default","brakelamp-" + n)) {
						Caller.SetFXCoronaTexture("brakelamp-" + n,null);
						n++;
					}
					n = 0;
					while (U.EffectPresent(Caller,"default","flasher-" + n)) {
						Caller.SetFXCoronaTexture("flasher-" + n,null);
						n++;
					}
				}
				else if (minor[0,3] == "Tch") {
					string[] tokens = Str.Tokens(minor,",");
					if (tokens.size() > 1)	{
						tch = Str.Tokens(minor,",")[1];	
						SSSoup.SetNamedTag("tchNumber", tch);
						SetTexturedTch(tch);
					}
				}				
				else if (minor[0,7] == "onemesh") {
					if (attached) {
						string newmesh = Str.Tokens(minor,",")[1];
						if (Caller.HasMesh(newmesh)) {
							onemesh = onemeshes.GetIndexForNamedTag(newmesh);
							Setonemesh();
						}
					}
				}
				else if (minor[0,7] == "twomesh") {
					if (attached2) {
						string newmesh = Str.Tokens(minor,",")[1];
						if (Caller.HasMesh(newmesh)) {
							twomesh = twomeshes.GetIndexForNamedTag(newmesh);
							Settwomesh();
						}
					}
				}
				else if (minor[0,9] == "threemesh") {
					if (attached3) {
						string newmesh = Str.Tokens(minor,",")[1];
						if (Caller.HasMesh(newmesh)) {
							threemesh = threemeshes.GetIndexForNamedTag(newmesh);
							Setthreemesh();
						}
					}
				}
				else if (minor[0,8] == "fourmesh") {
					if (attached4) {
						string newmesh = Str.Tokens(minor,",")[1];
						if (Caller.HasMesh(newmesh)) {
							fourmesh = fourmeshes.GetIndexForNamedTag(newmesh);
							Setfourmesh();
						}
					}
				}
				else if (minor[0,8] == "fivemesh") {
					if (attached5) {
						string newmesh = Str.Tokens(minor,",")[1];
						if (Caller.HasMesh(newmesh)) {
							fivemesh = fivemeshes.GetIndexForNamedTag(newmesh);
							Setfivemesh();
						}
					}
				}
				else if (minor[0,7] == "sixmesh") {
					if (attached6) {
						string newmesh = Str.Tokens(minor,",")[1];
						if (Caller.HasMesh(newmesh)) {
							sixmesh = sixmeshes.GetIndexForNamedTag(newmesh);
							Setsixmesh();
						}
					}
				}
				else if (minor == "Wipers") {
					position = GetPosition();
					SetWipers();
					SavePosition();
				}
				else if (minor[0,6] == "exbody") {
					if (!textured) {return "";}
					string s = U.Token(2,minor,",");
					int n = 0;
					for (n = 1; n < exbodymanagers.CountTags(); n++) {
						if (s == exbodymanagers.GetNamedSoup(n).GetNamedTag("exbodymanager")) {
							exbodymanager = n;
							break;
						}
					}
					if (extensions.GetNamedTagAsBool("cleaned")) {
						SSSoup.SetNamedTag("cleaned",U.Token(3,minor,",") == "1");
					}
					Setexbody();
				}
				
				else if (minor[0,8] == "interior") {
					if (!textured2) {return "";}
					string s = U.Token(2,minor,",");
					int n = 0;
					for (n = 1; n < interiormanagers.CountTags(); n++) {
						if (s == interiormanagers.GetNamedSoup(n).GetNamedTag("interiormanager")) {
							interiormanager = n;
							break;
						}
					}
					Setinterior();
				}
				
				else if (minor[0,6] == "Advert") {
					if (!textured3) {return "";}
					string s = U.Token(2,minor,",");
					int n = 0;
					for (n = 1; n < advertmanagers.CountTags(); n++) {
						if (s == advertmanagers.GetNamedSoup(n).GetNamedTag("advertmanager")) {
							advertmanager = n;
							break;
						}
					}
					SetAdvert();
				}
				
				else if (minor[0,6] == "Driver") {
					if (!textured4) {return "";}
					string s = U.Token(2,minor,",");
					int n = 0;
					for (n = 1; n < drivermanagers.CountTags(); n++) {
						if (s == drivermanagers.GetNamedSoup(n).GetNamedTag("drivermanager")) {
							drivermanager = n;
							break;
						}
					}
					SetDriver();
				}
				
				else if (minor[0,6] == "Scheme") {
					if (!textured5) {return "";}
					string s = U.Token(2,minor,",");
					int n = 0;
					for (n = 1; n < schememanagers.CountTags(); n++) {
						if (s == schememanagers.GetNamedSoup(n).GetNamedTag("schememanager")) {
							schememanager = n;
							break;
						}
					}
					SetScheme();
				}
			}
			
			return "";
		}

// Object Property Interface Calls

		if (function == "GetPropertyName") {
			string result;
			string pID = Strings[1];
			if (pID == "exbodymanager") result = U.UserString("Select_exbody");
			else if (pID == "defaultexbody")	result = U.UserString("Select_exbody");
			else if (pID == "interiormanager")	result = U.UserString("Select_interior");
			else if (pID == "defaultinterior") 	result = U.UserString("Select_interior");
			else if (pID == "schememanager") 	result = U.UserString("Select_scheme");
			else if (pID == "defaultscheme") 	result = U.UserString("Select_scheme");
			else if (pID == "advertmanager") 	result = U.UserString("Select_advert");
			else if (pID == "defaultadvert") 	result = U.UserString("Select_advert");
			else if (pID == "drivermanager") 	result = U.UserString("Select_driver");
			else if (pID == "defaultdriver") 	result = U.UserString("Select_driver");
			else if (pID == "registration") 	result = U.UserString("Select_reg");
			else if (pID == "tch") 				result = U.UserString("Select_tch");
			else if (pID == "onemesh") 			result = U.UserString("Select_onattachments");
			else if (pID == "twomesh") 			result = U.UserString("Select_twattachments");
			else if (pID == "threemesh") 		result = U.UserString("Select_thattachments");
			else if (pID == "fourmesh") 		result = U.UserString("Select_foattachments");
			else if (pID == "fivemesh") 		result = U.UserString("Select_fiattachments");
			else if (pID == "sixmesh")  		result = U.UserString("Select_siattachments");
			else result = Strings[0];
			return result;
		}
		
		if (function == "GetPropertyValue") {
			string result;
			string pID = Strings[1];
			if (pID == "registration" or pID == "registrationg") result = SSSoup.GetNamedTag("vehicleNumber");
			else if (pID == "tch") result = SSSoup.GetNamedTag("tchNumber");
			else result = Strings[0];
			return result;
		}

		if (function == "GetPropertyType") {
			string result;
			string pID = Strings[1];
			if (			pID == "onemesh"
			or				pID == "twomesh"
			or				pID == "threemesh"
			or				pID == "fourmesh"
			or				pID == "fivemesh"
			or				pID == "sixmesh") result = "list,1";
			else if (	pID == "defaultexbody" 
			or 				pID == "exbodymanager" 
			or 				pID == "defaultinterior" 
			or 				pID == "interiormanager"
			or 				pID == "defaultscheme" 
			or 				pID == "schememanager"
			or 				pID == "defaultadvert" 
			or 				pID == "advertmanager"
			or 				pID == "defaultdriver" 
			or 				pID == "drivermanager") result = "list";
			else if (	pID== "registration" or pID== "registrationg" or pID == "tch") result = "string";
			else if (	pID[0,5] == "doors"
				or			pID[0,5] == "doorsTech"
				or			pID[0,5] == "doorsCab"
				or			pID[0,5] == "doorsCabFB"
				or			pID[0,5] == "doorsVagFB"
				or			pID[0,6] == "wipers"
				or			pID[0,6] == "number"
				or 			pID== "regAuto"
				or			pID == "cleaned"
				or			pID == "deldefault"
				or			pID == "deldefault2"
				or			pID == "deldefault3"
				or			pID == "deldefault4"
				or			pID == "delonemesh"
				or			pID == "deltwomesh"
				or			pID == "delthreemesh"
				or			pID == "delfourmesh"
				or			pID == "delfivemesh"
				or			pID == "delsixmesh"
				or			pID == "trainapply"
				or			pID == "trainapply2"
				or			pID == "trainapply3"
				or			pID == "trainapply4"
				or			pID == "trainapply5"
				or			pID == "traintch"
				or			pID == "onemeshtrain"
				or			pID == "twomeshtrain"
				or			pID == "threemeshtrain"
				or			pID == "fourmeshtrain"
				or			pID == "fivemeshtrain"
				or			pID == "sixmeshtrain"
				or 			pID == "electrotrain"
				or 			pID[0,7] == "electro"
				or			pID[0,7] == "section"
				or			pID[0,10] == "subsection"
				or			pID[0,3] == "del"
			) {result = "link";}
			else result = Strings[0];
			return result;
		}

		if (function == "LinkPropertyValue") {
			string pID = Strings[0];
			if (pID[0,7] == "section") {
				int CurrentSection = U.Section;
				Str.TrimLeft(pID,"section");
				if (Str.ToInt(pID) == CurrentSection) {U.Section = 0;} else {U.Section = Str.ToInt(pID);}
				return "";
			}
			else if (pID[0,10] == "subsection") {
				int CurrentSubSection = U.SubSection;
				Str.TrimLeft(pID,"subsection");
				if (Str.ToInt(pID) == CurrentSubSection) {U.SubSection = 0;} else {U.SubSection = Str.ToInt(pID);}
				return "";
			}
			else if (pID == "trainapply") {
				Vehicle[] vehicles = Caller.GetMyTrain().GetVehicles();
				int n;
				for (n = 0; n < vehicles.size(); n++) {
					if (vehicles[n].GetId() != Caller.GetId()) {
						PostMessage(vehicles[n],"SS","exbody,"
							+ exbodymanagers.GetNamedSoup(exbodymanager).GetNamedTag("exbodymanager") + ","
							+ SSSoup.GetNamedTagAsInt("cleaned"),0.0);
					}
				}
			}
			else if (pID == "cleaned") {
				SSSoup.SetNamedTag("cleaned",!SSSoup.GetNamedTagAsBool("cleaned"));
				Setexbody();
			}
			
			else if (pID == "trainapply2") {
				Vehicle[] vehicles = Caller.GetMyTrain().GetVehicles();
				int n;
				for (n = 0; n < vehicles.size(); n++) {
					if (vehicles[n].GetId() != Caller.GetId()) {
						PostMessage(vehicles[n],"SS","interior,"
							+ interiormanagers.GetNamedSoup(interiormanager).GetNamedTag("interiormanager"),0.0);
					}
				}
				Setinterior();
			}
			
			else if (pID == "trainapply3") {
				Vehicle[] vehicles = Caller.GetMyTrain().GetVehicles();
				int n;
				for (n = 0; n < vehicles.size(); n++) {
					if (vehicles[n].GetId() != Caller.GetId()) {
						PostMessage(vehicles[n],"SS","Advert,"
							+ advertmanagers.GetNamedSoup(advertmanager).GetNamedTag("advertmanager"),0.0);
					}
				}
				SetAdvert();
			}
			else if (pID == "trainapply4") {
				Vehicle[] vehicles = Caller.GetMyTrain().GetVehicles();
				int n;
				for (n = 0; n < vehicles.size(); n++) {
					if (vehicles[n].GetId() != Caller.GetId()) {
						PostMessage(vehicles[n],"SS","Driver,"
							+ drivermanagers.GetNamedSoup(drivermanager).GetNamedTag("drivermanager"),0.0);
					}
				}
				SetDriver();
			}
			else if (pID == "trainapply5") {
				Vehicle[] vehicles = Caller.GetMyTrain().GetVehicles();
				int n;
				for (n = 0; n < vehicles.size(); n++) {
					if (vehicles[n].GetId() != Caller.GetId()) {
						PostMessage(vehicles[n],"SS","Scheme,"
							+ schememanagers.GetNamedSoup(schememanager).GetNamedTag("schememanager"),0.0);
					}
				}
				SetScheme();
			}
			else if (pID == "traintch") {
				Vehicle[] vehicles = Caller.GetMyTrain().GetVehicles();
				string tch = SSSoup.GetNamedTag("tchNumber");
				int n;
				for (n = 0; n < vehicles.size(); n++) {
					if (vehicles[n].GetId() != Caller.GetId()) PostMessage(vehicles[n],"SS","Tch," + tch,0.0);					
				}
			}
			else if (pID == "deldefault5") SetSchemeDefault(0);
			else if (pID == "deldefault4") SetDriverDefault(0);
			else if (pID == "deldefault3") SetAdvertDefault(0);
			else if (pID == "deldefault2") SetinteriorDefault(0);
			else if (pID == "deldefault") SetexbodyDefault(0);
			else if (pID == "delonemesh") {
				onemesh = 0;
				Setonemesh();
			}
			else if (pID == "onemeshtrain") {
				Vehicle[] vehicles = Caller.GetMyTrain().GetVehicles();
				int n;
				for (n = 0; n < vehicles.size(); n++) {
					if (vehicles[n].GetId() != Caller.GetId()) {
						PostMessage(vehicles[n],"SS","onemesh,"
							+ onemeshes.GetIndexedTagName(SSSoup.GetNamedTagAsInt("onemesh")),0.0);
					}
				}
			}
			
			else if (pID == "deltwomesh") {
				twomesh = 0;
				Settwomesh();
			}
			else if (pID == "twomeshtrain") {
				Vehicle[] vehicles = Caller.GetMyTrain().GetVehicles();
				int n;
				for (n = 0; n < vehicles.size(); n++) {
					if (vehicles[n].GetId() != Caller.GetId()) {
						PostMessage(vehicles[n],"SS","twomesh,"
							+ twomeshes.GetIndexedTagName(SSSoup.GetNamedTagAsInt("twomesh")),0.0);
					}
				}
			}
			
			else if (pID == "delthreemesh") {
				threemesh = 0;
				Setthreemesh();
			}
			else if (pID == "threemeshtrain") {
				Vehicle[] vehicles = Caller.GetMyTrain().GetVehicles();
				int n;
				for (n = 0; n < vehicles.size(); n++) {
					if (vehicles[n].GetId() != Caller.GetId()) {
						PostMessage(vehicles[n],"SS","threemesh,"
							+ threemeshes.GetIndexedTagName(SSSoup.GetNamedTagAsInt("threemesh")),0.0);
					}
				}
			}
			
			else if (pID == "delfourmesh") {
				fourmesh = 0;
				Setfourmesh();
			}
			else if (pID == "fourmeshtrain") {
				Vehicle[] vehicles = Caller.GetMyTrain().GetVehicles();
				int n;
				for (n = 0; n < vehicles.size(); n++) {
					if (vehicles[n].GetId() != Caller.GetId()) {
						PostMessage(vehicles[n],"SS","fourmesh,"
							+ fourmeshes.GetIndexedTagName(SSSoup.GetNamedTagAsInt("fourmesh")),0.0);
					}
				}
			}
			
			else if (pID == "delfivemesh") {
				fivemesh = 0;
				Setfivemesh();
			}
			else if (pID == "fivemeshtrain") {
				Vehicle[] vehicles = Caller.GetMyTrain().GetVehicles();
				int n;
				for (n = 0; n < vehicles.size(); n++) {
					if (vehicles[n].GetId() != Caller.GetId()) {
						PostMessage(vehicles[n],"SS","fivemesh,"
							+ fivemeshes.GetIndexedTagName(SSSoup.GetNamedTagAsInt("fivemesh")),0.0);
					}
				}
			}
			
			else if (pID == "delsixmesh") {
				sixmesh = 0;
				Setsixmesh();
			}
			else if (pID == "sixmeshtrain") {
				Vehicle[] vehicles = Caller.GetMyTrain().GetVehicles();
				int n;
				for (n = 0; n < vehicles.size(); n++) {
					if (vehicles[n].GetId() != Caller.GetId()) {
						PostMessage(vehicles[n],"SS","sixmesh,"
							+ sixmeshes.GetIndexedTagName(SSSoup.GetNamedTagAsInt("sixmesh")),0.0);
					}
				}
			}
			
			else if (pID == "regAuto") 
			{
				SSSoup.SetNamedTag("vehicleNumber", "");
				SetRegistration();
			}
			else if (pID == "electrotrain")
			{
				Vehicle[] vehicles = Caller.GetMyTrain().GetVehicles();
				string val = "electro,0";
				if (SSSoup.GetNamedTagAsBool("electromanager")) val = "electro,1";
				int n;
				for (n = 0; n < vehicles.size(); n++) {
					if (vehicles[n].GetId() != Caller.GetId()) {
						PostMessage(vehicles[n],"SetProperty",val,0.0);
					}
				}
			}			
			else if (pID[0,7] == "electro")
			{
				if (pID == "electro,0")			SSSoup.SetNamedTag("electromanager", false);
				else if (pID == "electro,1")	SSSoup.SetNamedTag("electromanager", true);
				else							SSSoup.SetNamedTag("electromanager", !SSSoup.GetNamedTagAsBool("electromanager"));				
				PostMessage(Caller,"SetProperty","electro",0.0);
			}
			else {return "0";}
			return "";
		}
			
		if (function == "SetPropertyString") {
		}

		if (function == "SetPropertyValue") {
			string pID = Strings[0];
			string value = Strings[1];
			int index = Str.ToInt(Strings[2]);
			if (pID == "exbodymanager") {
				exbodymanager = index + 1;
				Setexbody();
			}
			else if (pID == "interiormanager") {
				interiormanager = index + 1;
				Setinterior();
			}
			else if (pID == "schememanager") {
				schememanager = index + 1;
				SetScheme();
			}
			else if (pID == "advertmanager") {
				advertmanager = index + 1;
				SetAdvert();
			}
			else if (pID == "drivermanager") {
				drivermanager = index + 1;
				SetDriver();
			}
			else if (pID == "onemesh") {
				onemesh = index + 1;
				Setonemesh();
			}
			else if (pID == "twomesh") {
				twomesh = index + 1;
				Settwomesh();
			}
			else if (pID == "threemesh") {
				threemesh = index + 1;
				Setthreemesh();
			}
			else if (pID == "fourmesh") {
				fourmesh = index + 1;
				Setfourmesh();
			}
			else if (pID == "fivemesh") {
				fivemesh = index + 1;
				Setfivemesh();
			}
			else if (pID == "sixmesh") {
				sixmesh = index + 1;
				Setsixmesh();
			}
			else if (pID == "registration") 
			{
				SSSoup.SetNamedTag("vehicleNumber", value);
				SSSoup.SetNamedTag("vehicleNumberAuto", (value == ""));
				SetRegistration();
			}
			else if (pID == "tch") SSSoup.SetNamedTag("tchNumber", value);
			else if (pID == "defaultexbody") SetexbodyDefault(index);
			else if (pID == "defaultinterior") SetinteriorDefault(index);
			else if (pID == "defaultscheme") SetSchemeDefault(index);
			else if (pID == "defaultadvert") SetAdvertDefault(index);
			else if (pID == "defaultdriver") SetDriverDefault(index);
			else {return "0";}
			return "";
		}

		if (function == "GetPropertyElementList") {
			int n;
			string pID = Strings[0];
			while (Strings.size() > 0) {U.Remove(Strings,Strings[0]);}// empty the array
			if (pID == "defaultexbody") {
				for (n = 0; n < exbodymanagers.CountTags(); n++) {
					Strings[Strings.size()] = exbodymanagers.GetNamedSoup(n).GetNamedTag("exbodymanager");
				}
			}
			else if (pID == "exbodymanager") {
				for (n = 1; n < exbodymanagers.CountTags(); n++) {
					Strings[Strings.size()] = exbodymanagers.GetNamedSoup(n).GetNamedTag("exbodymanager");
				}
			}
			else if (pID == "defaultinterior") {
				for (n = 0; n < interiormanagers.CountTags(); n++) {
					Strings[Strings.size()] = interiormanagers.GetNamedSoup(n).GetNamedTag("interiormanager");
				}
			}
			else if (pID == "interiormanager") {
				for (n = 1; n < interiormanagers.CountTags(); n++) {
					Strings[Strings.size()] = interiormanagers.GetNamedSoup(n).GetNamedTag("interiormanager");
				}
			}
			else if (pID == "defaultscheme") {
				for (n = 0; n < schememanagers.CountTags(); n++) {
					Strings[Strings.size()] = schememanagers.GetNamedSoup(n).GetNamedTag("schememanager");
				}
			}
			else if (pID == "schememanager") {
				for (n = 1; n < schememanagers.CountTags(); n++) {
					Strings[Strings.size()] = schememanagers.GetNamedSoup(n).GetNamedTag("schememanager");
				}
			}
			else if (pID == "defaultadvert") {
				for (n = 0; n < advertmanagers.CountTags(); n++) {
					Strings[Strings.size()] = advertmanagers.GetNamedSoup(n).GetNamedTag("advertmanager");
				}
			}
			else if (pID == "advertmanager") {
				for (n = 1; n < advertmanagers.CountTags(); n++) {
					Strings[Strings.size()] = advertmanagers.GetNamedSoup(n).GetNamedTag("advertmanager");
				}
			}
			else if (pID == "defaultdriver") {
				for (n = 0; n < drivermanagers.CountTags(); n++) {
					Strings[Strings.size()] = drivermanagers.GetNamedSoup(n).GetNamedTag("drivermanager");
				}
			}
			else if (pID == "drivermanager") {
				for (n = 1; n < drivermanagers.CountTags(); n++) {
					Strings[Strings.size()] = drivermanagers.GetNamedSoup(n).GetNamedTag("drivermanager");
				}
			}
			else if (pID == "onemesh") {
				for (n = 1; n < onemeshes.CountTags(); n++) {
					Strings[Strings.size()] = onemeshes.GetNamedTag(onemeshes.GetIndexedTagName(n));
				}
			}
			else if (pID == "twomesh") {
				for (n = 1; n < twomeshes.CountTags(); n++) {
					Strings[Strings.size()] = twomeshes.GetNamedTag(twomeshes.GetIndexedTagName(n));
				}
			}
			else if (pID == "threemesh") {
				for (n = 1; n < threemeshes.CountTags(); n++) {
					Strings[Strings.size()] = threemeshes.GetNamedTag(threemeshes.GetIndexedTagName(n));
				}
			}
			else if (pID == "fourmesh") {
				for (n = 1; n < fourmeshes.CountTags(); n++) {
					Strings[Strings.size()] = fourmeshes.GetNamedTag(fourmeshes.GetIndexedTagName(n));
				}
			}
			else if (pID == "fivemesh") {
				for (n = 1; n < fivemeshes.CountTags(); n++) {
					Strings[Strings.size()] = fivemeshes.GetNamedTag(fivemeshes.GetIndexedTagName(n));
				}
			}
			else if (pID == "sixmesh") {
				for (n = 1; n < sixmeshes.CountTags(); n++) {
					Strings[Strings.size()] = sixmeshes.GetNamedTag(sixmeshes.GetIndexedTagName(n));
				}
			}			
			else {return "0";}//inherited call
			return "";
		}

		if (function == "GetDescriptionHTML") {
			string cleaned = U.UserString("Clean");
			if (SSSoup.GetNamedTagAsBool("cleaned")) {cleaned = U.UserString("cleaned");}
			bool electromanager = SSSoup.GetNamedTagAsBool("electromanager");			
			string vehicleNumber = SSSoup.GetNamedTag("vehicleNumber");
			string tchNumber = SSSoup.GetNamedTag("tchNumber");
			if (tchNumber == "") tchNumber = "1";
			bool vehicleNumberAuto = SSSoup.GetNamedTagAsBool("vehicleNumberAuto",true);
			if (vehicleNumberAuto)
				vehicleNumber = vehicleNumber + " ("+ U.UserString("auto") + ")";
				
	//	Interface.Print("HTML:electromanager="+electromanager);	
			return
				U.Header(textured or textured2 or textured3 or textured4 or textured5 or attached or attached2 or attached3 or attached4 or attached5 or attached6,-1,U.UserString("OPTIONS"),"imgadd")
			
			+	U.Table(U.Section == -1 and textured,	
					"<tr><td bgcolor=#666666 width=100%><font face=Arial color=#D8D8D8 size=3><b>&nbsp;" + U.UserString("exbody") + "</b></font></td></tr>"
			)
			
			+	U.Table(U.Section == -1 and textured and exbodymanagers.CountTags() > 0,
					"<tr>"	+ U.Cell(U.W1,U.UserString("Default_exbody"))
								+ U.Cell(U.W2, U.Item(Caller.GetMyTrain().GetVehicles().size() > 1, U.Button(true,"trainapply","imgtrn") + "&nbsp;")
									+	U.Button(GetexbodyDefault() == 0,"defaultexbody","imgadd")
									+	U.Button(GetexbodyDefault() != 0,"deldefault","imgrem")
									+	"&nbsp;&nbsp;<a href=live://property/defaultexbody>"
									+	defaultexbodystring + "</a>"
									)
				+	"</tr>"

				+	"<tr>"	+ U.Cell(U.W1,U.UserString("exbodymanager"))
								+ U.Cell(U.W2, U.Item(Caller.GetMyTrain().GetVehicles().size() > 1, U.Button(true,"trainapply","imgtrn") + "&nbsp;")
									+	U.Button(true,"exbodymanager","imgadd")
									+	"&nbsp;&nbsp;<a href=live://property/exbodymanager>"
									+	exbodymanagerstring + "</a>"
									)
				+	"</tr>"
			)
			+	U.Table(U.Section == -1 and textured and extensions.GetNamedTagAsBool("cleaned") and exbodymanagers.CountTags() > 0,	
					"<tr>"	+ U.Cell(U.W1,U.UserString("cleaning"))
								+ U.Cell(U.W2, U.Item(Caller.GetMyTrain().GetVehicles().size() > 1, U.Button(true,"trainapply","imgtrn") + "&nbsp;")
									+	U.Button(!SSSoup.GetNamedTagAsBool("cleaned"),"cleaned","imgadd")
									+	U.Button(SSSoup.GetNamedTagAsBool("cleaned"),"cleaned","imgrem")
									+	"&nbsp;&nbsp;<a href=live://property/cleaned>"
									+	cleaned
									)
				+	"</tr>"
			)
						
			+	U.Table(U.Section == -1 and textured2 and interiormanagers.CountTags() > 0,	
					"<tr>"	+ U.Cell(U.W1,U.UserString("interiormanager"))
								+ U.Cell(U.W2, U.Item(Caller.GetMyTrain().GetVehicles().size() > 1, U.Button(true,"trainapply2","imgtrn") + "&nbsp;")
									+	U.Button(true,"interiormanager","imgadd")
									+	"&nbsp;&nbsp;<a href=live://property/interiormanager>"
									+	interiormanagerstring + "</a>"
									)
				+	"</tr>"
			)
			
			+	U.Table(U.Section == -1 and textured5 and schememanagers.CountTags() > 0,	
					"<tr>"	+ U.Cell(U.W1,U.UserString("schememanager"))
								+ U.Cell(U.W2, U.Item(Caller.GetMyTrain().GetVehicles().size() > 1, U.Button(true,"trainapply5","imgtrn") + "&nbsp;")
									+	U.Button(true,"schememanager","imgadd")
									+	"&nbsp;&nbsp;<a href=live://property/schememanager>"
									+	schememanagerstring + "</a>"
									)
				+	"</tr>"
			)
			
			+	U.Table(U.Section == -1 and textured3 and advertmanagers.CountTags() > 0,	
					"<tr>"	+ U.Cell(U.W1,U.UserString("advertmanager"))
								+ U.Cell(U.W2, U.Item(Caller.GetMyTrain().GetVehicles().size() > 1, U.Button(true,"trainapply3","imgtrn") + "&nbsp;")
									+	U.Button(true,"advertmanager","imgadd")
									+	"&nbsp;&nbsp;<a href=live://property/advertmanager>"
									+	advertmanagerstring + "</a>"
									)
				+	"</tr>"
			)
			
			+	U.Table(U.Section == -1 and textured4 and drivermanagers.CountTags() > 0,	
					"<tr>"	+ U.Cell(U.W1,U.UserString("drivermanager"))
								+ U.Cell(U.W2, U.Item(Caller.GetMyTrain().GetVehicles().size() > 1, U.Button(true,"trainapply4","imgtrn") + "&nbsp;")
									+	U.Button(true,"drivermanager","imgadd")
									+	"&nbsp;&nbsp;<a href=live://property/drivermanager>"
									+	drivermanagerstring + "</a>"
									)
				+	"</tr>"
			)
			
			+	U.Table(U.Section == -1 and attached,
					"<tr><td bgcolor=#666666 width=100%><font face=Arial color=#D8D8D8 size=3><b>&nbsp;" + U.UserString("GOPTIONS") + "</b></font></td></tr>"
			)
			
			+	U.Table(U.Section == -1 and attached,
					"<tr>"	+ U.Cell(U.W1,U.UserString("On_Meshes"))
								+ U.Cell(U.W2, U.Item(Caller.GetMyTrain().GetVehicles().size() > 1, U.Button(true,"onemeshtrain","imgtrn") + "&nbsp;")
									+	U.Button(onemesh == 0,"onemesh","imgadd")
									+	U.Button(onemesh != 0,"delonemesh","imgrem")
									+	"&nbsp;&nbsp;<a href=live://property/onemesh>"
									+	onemeshname + "</a>"
									)
				+	"</tr>"
			)
						
			+	U.Table(U.Section == -1 and attached2,
					"<tr>"	+ U.Cell(U.W1,U.UserString("Tw_Meshes"))
								+ U.Cell(U.W2, U.Item(Caller.GetMyTrain().GetVehicles().size() > 1, U.Button(true,"twomeshtrain","imgtrn") + "&nbsp;")
									+	U.Button(twomesh == 0,"twomesh","imgadd")
									+	U.Button(twomesh != 0,"deltwomesh","imgrem")
									+	"&nbsp;&nbsp;<a href=live://property/twomesh>"
									+	twomeshname + "</a>"
									)
				+	"</tr>"
			)
						
			+	U.Table(U.Section == -1 and attached3,
					"<tr>"	+ U.Cell(U.W1,U.UserString("Th_Meshes"))
								+ U.Cell(U.W2, U.Item(Caller.GetMyTrain().GetVehicles().size() > 1, U.Button(true,"threemeshtrain","imgtrn") + "&nbsp;")
									+	U.Button(threemesh == 0,"threemesh","imgadd")
									+	U.Button(threemesh != 0,"delthreemesh","imgrem")
									+	"&nbsp;&nbsp;<a href=live://property/threemesh>"
									+	threemeshname + "</a>"
									)
				+	"</tr>"
			)
						
			+	U.Table(U.Section == -1 and attached4,
					"<tr>"	+ U.Cell(U.W1,U.UserString("Fo_Meshes"))
								+ U.Cell(U.W2, U.Item(Caller.GetMyTrain().GetVehicles().size() > 1, U.Button(true,"fourmeshtrain","imgtrn") + "&nbsp;")
									+	U.Button(fourmesh == 0,"fourmesh","imgadd")
									+	U.Button(fourmesh != 0,"delfourmesh","imgrem")
									+	"&nbsp;&nbsp;<a href=live://property/fourmesh>"
									+	fourmeshname + "</a>"
									)
				+	"</tr>"
			)
			
			+	U.Table(U.Section == -1 and attached5,
					"<tr>"	+ U.Cell(U.W1,U.UserString("Fi_Meshes"))
								+ U.Cell(U.W2, U.Item(Caller.GetMyTrain().GetVehicles().size() > 1, U.Button(true,"fivemeshtrain","imgtrn") + "&nbsp;")
									+	U.Button(fivemesh == 0,"fivemesh","imgadd")
									+	U.Button(fivemesh != 0,"delfivemesh","imgrem")
									+	"&nbsp;&nbsp;<a href=live://property/fivemesh>"
									+	fivemeshname + "</a>"
									)
				+	"</tr>"
			)
			
			+	U.Table(U.Section == -1 and attached6,
					"<tr>"	+ U.Cell(U.W1,U.UserString("Si_Meshes"))
								+ U.Cell(U.W2, U.Item(Caller.GetMyTrain().GetVehicles().size() > 1, U.Button(true,"sixmeshtrain","imgtrn") + "&nbsp;")
									+	U.Button(sixmesh == 0,"sixmesh","imgadd")
									+	U.Button(sixmesh != 0,"delsixmesh","imgrem")
									+	"&nbsp;&nbsp;<a href=live://property/sixmesh>"
									+	sixmeshname + "</a>"
									)
				+	"</tr>"
			)
			
			+	U.Table(U.Section == -1 and registration,
					"<tr>"	+ U.Cell(U.W1,U.UserString("RegistrationM"))
								+ U.Cell(U.W2,
										U.Button(!vehicleNumberAuto,"regAuto","imgadd")
									+	U.Button(vehicleNumberAuto,"registration","imgrem")
									+	"&nbsp;&nbsp;<a href=live://property/registration>"
									+	vehicleNumber + "</a>"
									)
				+	"</tr>"
			)
			
			+	U.Table(U.Section == -1 and extensions.GetNamedTagAsBool("numtext"),
					"<tr>"	+ U.Cell(U.W1,U.UserString("tch"))
								+ U.Cell(U.W2, U.Item(Caller.GetMyTrain().GetVehicles().size() > 1, U.Button(true,"traintch","imgtrn") + "&nbsp;")
									+	"&nbsp;&nbsp;<a href=live://property/tch>"
									+	tchNumber + "</a>"
								)
				+	"</tr>"
			)

			+	U.Table(U.Section == -1,
					"<tr>"	+ U.Cell(U.W1,U.UserString("electromanager"))
								+ U.Cell(U.W2, U.Item(Caller.GetMyTrain().GetVehicles().size() > 1, U.Button(true,"electrotrain","imgtrn") + "&nbsp;")
									+	U.Button(!electromanager,"electro,1","imgadd")
									+	U.Button(electromanager,"electro,0","imgrem")
									+	"&nbsp;&nbsp;<a href=live://property/electro>"
									+	U.UserString("on_off") + "</a>"
									)
				+	"</tr>"
			)	
			
// DEFAULT CONFIGURATION
			+	U.Header(true,-2,U.UserString("DEFAULT_CONFIGURATION"),"imgadd")    // inherited HTML
			+	U.Item(U.Section == -2,"<br>" + Strings[0] + "<br>")
			
			+	U.copyrighttext;
		}

// Unknown Library Call Parameter
		U.Error(Caller,U.UserString("ERROR_REPORT"),"function: " + function + "<br>" + U.UserString("Library_OOD"));
		return "";
	}
};