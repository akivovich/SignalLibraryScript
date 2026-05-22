include "gs.gs"
include "common.gs"
include "locomotive.gs"
include "world.gs"
include "vehicle.gs"
include "train.gs"
include "sessionvariables.gs"

class metro717_motor isclass Locomotive
{
Asset MyAsset, meAsset, destsigntexturesAsset;
KUID destsigntexturesKUID;
string destination = "";
Train my_train = null;
Soup SoundSoup;

thread void Compressor();

bool naprav = me.GetDirectionRelativeToTrain();
bool dvrleftanim = false;
bool dvrrightanim = false;
bool BPSN = false;
bool bufers = false;
bool bufers_all = false;
bool doors_left_open = false;
bool doors_right_open = false;
bool mk = false;
bool CompressorStarted = false;
bool DeRailed = false;
bool fari = false;

float soundkoef = 1.4;
float mr_press = 500;


int oldPos = -1;

	public void SetDoorAnimationState(string p_meshName, bool p_state) 
	{
		inherited(p_meshName, p_state);
  		if (p_state)
			World.PlaySound(MyAsset,"open.wav",10,8,20,me,"a.doors");
		else
			World.PlaySound(MyAsset,"close.wav",10,8,20,me,"a.doors");
  	}

	thread void NoisePlay(void)
		{
		float ve_ty;
		while(1)
			{
			ve_ty=Math.Fmin(Math.Fabs(GetVelocity() / 50.0),0.4);
			if(ve_ty>0.05)
				World.PlaySound(MyAsset,"sound/noise.wav",ve_ty,40,220,me,"a.bog0");
			Sleep(4.3);
			}
		}

	thread void PlayStykSound(int SampleNum)
		{
		World.PlaySound(MyAsset,"sound/styk" + SampleNum +  ".wav",0.5,40,220,me,"a.bog0");
		Sleep(0.001);		
		}

	thread void StykPlay(void)
	{
		float spd = Math.Fabs( GetVelocity() );
		if (spd < 1)
			return;

		int SampleNum = 1;
		SampleNum = Math.Rand(1,6);
		PlayStykSound(SampleNum);
		Sleep(2.1/spd);
		PlayStykSound(SampleNum);

		Sleep(16.0/spd);

		SampleNum = Math.Rand(1,6);
		PlayStykSound(SampleNum);
		Sleep(2.1/spd);
		PlayStykSound(SampleNum);
	}

	
	thread void Styk(void)
	{
		float spd = 0.0;
		float tcorr = 0.1;
		int cls = 0;
		while(1)
		{
			spd = Math.Fabs( GetVelocity() );
			if (spd > 1)
				tcorr = tcorr + spd;
			Sleep(1);

			if (Math.Rand(0,100) < 30)
				cls = Math.Rand(0,3);

			if (GetMyTrain().GetAutopilotMode() == 2)
				return;

			if (spd > 1)
			{
				if (cls == 0 and tcorr > 25)
				{
					tcorr = 0;
					StykPlay();
				}
				if (cls == 1 and tcorr > 12.5)
				{
					tcorr = 0;
					StykPlay();
				}
				if (cls == 2 and tcorr > 100)
				{
					tcorr = 0;
					StykPlay();
				}
			}
		}
	}
	
	thread void Compressor(void)
		{		      
		if (!CompressorStarted)
			{	
			CompressorStarted=true;

			World.PlaySound(MyAsset,"sound/compressor_start.wav",1,10.0f,100.0f,me,"a.bog1");
			Sleep(1.5);

			while (mk)     
					{
					World.PlaySound(MyAsset,"sound/compressor_loop.wav",1,10.0f,100.0f,me,"a.bog1");
					Sleep(1.3);
					}
			
			World.PlaySound(MyAsset,"sound/compressor_stop.wav",1,10.0f,100.0f,me,"a.bog1");

			CompressorStarted = false;
			}
		}

	thread void TEDSound(void)
		{
		float spd = 0.0;
		float vol = 1.0;
		int SampleNum = 1;
		Sleep(Math.Rand(0.3,1));
		while(1)
			{
			vol = Math.Fabs(me.GetEngineParam("applied-force") / 40000);
			spd = Math.Fabs( GetVelocity() ) * 3.6;
			SampleNum = spd;
			if (SampleNum < 0)
				SampleNum = 0;
			if (SampleNum > 80)
				SampleNum = 80;
			
			int i = 0;
			if ((GetEngineSetting("dynamic-brake") > 0) or (GetEngineSetting("throttle") > 1))
				i = 1;
			SampleNum = SampleNum*i;

			if (GetEngineSetting("dynamic-brake") > 0)
				vol = GetEngineSetting("throttle");

			if (vol < 0.45)
				vol = 0.45;
			
			if (GetMyTrain().GetAutopilotMode() == 2)
				SampleNum = 0;

			if (SampleNum != 0)
				{
				World.PlaySound(MyAsset,"tedsound/idle_" + SampleNum +  ".wav",vol,40,220,me,"a.bog0");
				Sleep(SoundSoup.GetNamedTagAsFloat("tedsound/idle_" + SampleNum +  ".wav")-0.07);
				}
			else
				Sleep(0.5);
			}
		}

	
	
	void Nomernoy(void)
        	{	
		if(BPSN)
        		PlaySoundScriptEvent("bpsn_sound");
		else
			StopSoundScriptEvent("bpsn_sound");
       		}



	   
	void NomerHandler(Message msg)
		{
 
        	//Interface.Log ("----81-717, nachalo raboty"); 
		
		if (msg.minor == "BPSN_on")
         		{
         		BPSN = true;
         		Nomernoy();         
         		}
         
        if (msg.minor == "BPSN_off")
         		{
         		BPSN = false;
         		Nomernoy();     
         		}
				
		if (msg.minor == "bufers_on")
				{
				bufers = true;         
				}
		 
		 if (msg.minor == "bufers_off")
				{
				bufers = false;         
				}
		 
		if (msg.minor == "MK_on")
				{
				mk = true; 
				Compressor();
				}
		 
		 if (msg.minor == "MK_off")
				{
				mk = false;         
				}
				
		if (msg.minor == "fari_on")
				{
				fari = true;         
				}
				
		if (msg.minor == "fari_off")
				{
				fari = false;         
				}
				
		if (msg.minor == "bufers_on_all")
				{
				bufers_all = true;         
				}
				
		if (msg.minor == "bufers_of_all")
				{
				bufers_all = false;         
				}
		}
		
void DvrleftHandler(Message msg)
	{
	Asset meAsset = GetAsset();
	naprav = me.GetDirectionRelativeToTrain();
	if (msg.minor == "Open_left" and !doors_left_open)
		{
		World.PlaySound(meAsset,"sound/open.wav",10,8,20,me,"a.doors");
		doors_left_open = true;
		if (naprav==true)
			dvrleftanim = true;
		else	
			dvrrightanim = true;
		}
		
		
	if (msg.minor == "Close_left" and doors_left_open)
		{
		World.PlaySound(meAsset,"sound/close.wav",10,8,20,me,"a.doors");
		doors_left_open = false;
		if (naprav==true)
			dvrleftanim = false;
		else
			dvrrightanim = false;
		}

	SetMeshAnimationState("left-passenger-door",dvrleftanim); 
	SetMeshAnimationState("right-passenger-door",dvrrightanim);
	}
 
void DvrrightHandler(Message msg)
	{
	naprav = me.GetDirectionRelativeToTrain();
	Asset meAsset = GetAsset();
	if (msg.minor == "Open_right" and !doors_right_open)
		{
		doors_right_open = true;
		
		if (naprav==true)
			dvrrightanim = true;
		else
			dvrleftanim = true;

		World.PlaySound(meAsset,"sound/open.wav",1,8,20,me,"a.doors");
		}
		
	if (msg.minor == "Close_right" and doors_right_open)
		{
		doors_right_open = false;
		
		if (naprav==true)
			dvrrightanim = false;
		else
			dvrleftanim= false;

		World.PlaySound(meAsset,"sound/close.wav",1,8,20,me,"a.doors");
		}
	SetMeshAnimationState("right-passenger-door",dvrrightanim); 
	SetMeshAnimationState("left-passenger-door",dvrleftanim);
	}


float sin(float x)
		{
		int a= (int)(x/(2*Math.PI));
		x=x-2*a*Math.PI;
		a=1;
		if(Math.PI<x and x<=2*Math.PI)
			{
			x=x-Math.PI;
			a=-a;
			}
		if(Math.PI/2<x and x<=Math.PI)
			{
			x=Math.PI-x;
			}
		return a*(x-x*x*x/6+x*x*x*x*x/120-x*x*x*x*x*x*x/5040+x*x*x*x*x*x*x*x*x/362880);
		}

thread void K_loop()
	{
	Bogey[] bog_l=  GetBogeyList();

	float R_level=0;
	float J_level=0;

	bool IsNight=false;

	Bogey[] bog=GetBogeyList();

	while(1)
		{

		if(World.GetCurrentTrain() == GetMyTrain())				// ������������� ����� ������ ��� �����, � ������� ����� �����
			{
				float veh_vel=Math.Fabs(GetVelocity())*3.6;

				if(veh_vel>20)
					{
					float maxAmpl=0.7*Math.Fmin(0.00020*(veh_vel-20),0.045); //��������� ������ ���
					R_level=R_level+Math.PI*Math.Rand(0.06,0.09);
					int a= (int)(R_level/(2*Math.PI));
					R_level=R_level-2*a*Math.PI;

					float value1=maxAmpl* sin(R_level);

					SetMeshOrientation("default",0,value1,0);
					bog_l[0].SetMeshOrientation("default",0,-value1,0);
					bog_l[1].SetMeshOrientation("default",0,-value1,0);




					J_level=J_level+Math.PI*Math.Rand(0.06,0.1);
					a= (int)(J_level/(2*Math.PI));
					J_level=J_level-2*a*Math.PI;

					maxAmpl=maxAmpl*1.2;

					value1=maxAmpl*sin(J_level);
					SetMeshTranslation("default",0,0,value1);
					bog_l[0].SetMeshTranslation("default",0,0,-value1);
					bog_l[1].SetMeshTranslation("default",0,0,-value1);
					}
				else
					if(veh_vel>19)
						{
						SetMeshOrientation("default",0,0,0);
						SetMeshTranslation("default",0,0,0);
						}

			}
		else
			Sleep(5);



		Sleep(0.03);
		}

	}
	

    Soup GetDestnamesSoup(Asset srcAsset)
    {
	Soup retSoup = null;
	string uid = Str.Tokens(srcAsset.GetKUID().GetLogString(), ":")[1];
	Soup extSoup = srcAsset.GetConfigSoup().GetNamedSoup("extensions");
	if (extSoup)
	{
	    retSoup = extSoup.GetNamedSoup("destnames-" + uid);
	    if (!retSoup)
		retSoup = extSoup.GetNamedSoup("destnames");
	}
	return retSoup;
    }


    // Message handler: Change destination signs
    void ChangeDestinationSign(Message msg)
    {
	string new_destination = destination;
	string [] destnames = new string[0];
	int i;

	if (msg) { new_destination = msg.minor; }
	if (new_destination == null) new_destination = "";

	Soup destnamesSoup = GetDestnamesSoup(destsigntexturesAsset);

	if (destnamesSoup and destnamesSoup.CountTags() > 0)
	{
	    // Find name matching new_destination
	    for (i = 0; i < destnamesSoup.CountTags(); i++)
	    {
		if (destnamesSoup.GetNamedTag( (string) i) == new_destination)
		{
		    // Change texture
		    SetFXTextureReplacement("destsign", destsigntexturesAsset, i);
		    destination = new_destination;
		    break;
		}
	    }
	}
    }



    public string GetDescriptionHTML(void)
    {
	StringTable strTable = meAsset.GetStringTable();
	string retstr = inherited();
	string html = "<body><html><font color=#000000><table bgcolor=#C08000 border=0 bordercolor=#804000 width=100%>";

	html = html + "<tr><td>" + strTable.GetString("html_texturegroup") + "<a href=live://property/destsigns>";
	html = html + BrowserInterface.Quote(destsigntexturesAsset.GetLocalisedName()) + "</a></td></tr>";

	string tmp_dest = "**undef**";
	if (destination != "")
	    tmp_dest = destination;
	html = html + "<tr><td>" + strTable.GetString("html_dest") + "<a href=live://property/dest>";
	html = html + BrowserInterface.Quote(tmp_dest) + "</a></td></tr></table></font></html></body>";

	retstr = retstr + html;
	return retstr;
    }


    string GetPropertyName(string propertyID)
    {
	StringTable strTable = GetAsset().GetStringTable();
	if (propertyID == "destsigns")
	    return strTable.GetString("destsigns_name");
	if (propertyID == "dest")
	    return strTable.GetString("dest_name");
	return inherited(propertyID);
    }


    string GetPropertyDescription(string propertyID)
    {
	StringTable strTable = GetAsset().GetStringTable();
	if (propertyID == "destsigns")
	    return strTable.GetString("destsigns_desc");
	if (propertyID == "dest")
		return strTable.GetString("dest_desc");
	return inherited(propertyID);
    }


    string GetPropertyType(string propertyID)
    {
	if (propertyID == "destsigns")
	    return "list,1";
	if (propertyID == "dest")
	    return "list,1";
	return inherited(propertyID);
    }


    // Partial workaround for the broken TRS2006 function World.GetAssetList("texture-group").
    // If the function returns an empty list, try looking for references in vehicle configs.
    Asset[] GetTextureGroupList(void)
    {
	Asset[] retval = World.GetAssetList("texture-group");
	if (retval.size())
	    // Found texturegroups, return the list
	    return retval;

	// Scan all vehicles for references to a texture-group
	Vehicle[] vehicles = World.GetVehicleList();
	KUIDList vehicleKUIDs = Constructors.NewKUIDList();
	KUIDList checkedKUIDs = Constructors.NewKUIDList();
	int numVehicles = vehicles.size();
	int i;
	for (i = 0; i < numVehicles; i++)
	{
	    Asset vehicleAsset = vehicles[i].GetAsset();
	    KUID vehicleKUID = vehicleAsset.GetKUID();
	    if ( !vehicleKUIDs.HasKUID(vehicleKUID) )
	    {
		vehicleKUIDs.AddKUID(vehicleKUID);
		Soup vehicleSoup = vehicleAsset.GetConfigSoup();
		if (vehicleSoup)
		{
		    Soup kuidtableSoup = vehicleSoup.GetNamedSoup("kuid-table");
		    if (kuidtableSoup and kuidtableSoup.CountTags() > 0)
		    {
			int j;
			for (j = 0; j < kuidtableSoup.CountTags(); j++)
			{
			    string tagName = kuidtableSoup.GetIndexedTagName(j);
			    KUID kuid = kuidtableSoup.GetNamedTagAsKUID(tagName);
			    if (kuid and !checkedKUIDs.HasKUID(kuid))
			    {
				checkedKUIDs.AddKUID(kuid);
				Asset checkAsset = World.FindAsset(kuid);
				Soup checkAssetSoup = checkAsset.GetConfigSoup();
				if (checkAssetSoup)
				{
				    string kind = checkAssetSoup.GetNamedTag("kind");
				    if (kind == "texture-group")
				    {
					retval[retval.size()] = checkAsset;
				    }
				}
			    }
			}
		    }
		}
	    }
	}
	return retval;
    }


    void SetPropertyValue(string propertyID, string value, int valueIndex)
    {
	if (propertyID == "destsigns")
	{
	    Asset[] textures = GetTextureGroupList();
	    int i = 0;
	    while ( i < textures.size() )
	    {
		if (textures[i].GetLocalisedName() == value)
		{
		    KUID texturesKUID = textures[i].GetKUID();
		    Soup destnamesSoup = GetDestnamesSoup(textures[i]);
		    if (destnamesSoup and destnamesSoup.CountTags() > 0)
		    {
			destsigntexturesKUID = texturesKUID;
			destsigntexturesAsset = textures[i];
			break;
		    }
		}
		i++;
	    }
	    return;
	}
	if (propertyID == "dest")
	{
	    if (value > "" and value != "**undef**")
	    {
		destination = value;
		PostMessage(me, "ChangeDestinationSign", value, 0);
	    }
	    return;
	}
	inherited(propertyID, value, valueIndex);
    }


    string[] GetTextureGroups(void)
    {
	string[] retval = new string[0];
	Asset[] textures = GetTextureGroupList();
	int i = 0;
	while ( i < textures.size() )
	{
	    Soup destnamesSoup = GetDestnamesSoup(textures[i]);
	    if (destnamesSoup and destnamesSoup.CountTags() > 0)
		retval[retval.size()] = textures[i].GetLocalisedName();
	    i++;
	}
	return retval;
    }


    string[] GetDestnames(Asset srcAsset)
    {
	string[] retval = new string[0];
	int i;
	Soup destnamesSoup = GetDestnamesSoup(srcAsset);
	if (destnamesSoup and destnamesSoup.CountTags() > 0)
	    // Get the names of the destiantions
	    for (i = 0; i < destnamesSoup.CountTags(); i++)
		retval[i] = destnamesSoup.GetNamedTag( (string) i);
	return retval;
    }


    public string[] GetPropertyElementList(string propertyID)
    {
	if (propertyID == "destsigns")
	{
	    string[] retval = new string[0];
	    retval = GetTextureGroups();
	    return retval;
	}
	if (propertyID == "dest")
	{
	    string[] retval = new string[0];
	    retval = GetDestnames(destsigntexturesAsset);
	    return retval;
	}
	return inherited(propertyID);
    }
	
	void InitSoundSoup()
		{
		Soup extensions2 = MyAsset.GetConfigSoup().GetNamedSoup("extensions");
		int N=extensions2.GetNamedTagAsInt("numberofsounds",0);
		if(N==0)
			return;
		SoundSoup=Constructors.NewSoup();
		int i;
		string[] tok;
		string temp;

		for(i=1;i<=N;i++)
			{
			temp=extensions2.GetNamedTag(i+"");
			tok=Str.Tokens(temp,",");
			SoundSoup.SetNamedTag(tok[0],Str.ToFloat(tok[1]));
			}
		SoundSoup.SetNamedTag("numberofsounds",N);
		}



    	public Soup GetProperties(void)
    		{
		Soup soup = inherited();

	// Save support
	// Save the properties to the soup, then return the soup
	soup.SetNamedTag("destination", destination);
	soup.SetNamedTag("destsignsKUID", destsigntexturesKUID);

		if(!SoundSoup.IsLocked())
			soup.SetNamedSoup("SoundSoup",SoundSoup);
		return soup;
    		}

    	public void SetProperties(Soup soup)
    		{
			SoundSoup=soup.GetNamedSoup("SoundSoup");

			if(!SoundSoup or SoundSoup.GetNamedTagAsInt("numberofsounds")!=MyAsset.GetConfigSoup().GetNamedSoup("extensions").GetNamedTagAsInt("numberofsounds",0))
				InitSoundSoup();
			
				KUID new_destsigntexturesKUID = soup.GetNamedTagAsKUID("destsignsKUID");
	if (new_destsigntexturesKUID)
	{
	    destsigntexturesKUID = new_destsigntexturesKUID;
	    destsigntexturesAsset = World.FindAsset(destsigntexturesKUID);
	}
	string new_destination = soup.GetNamedTag("destination");
	PostMessage(me, "ChangeDestinationSign", new_destination, 0);

		inherited(soup);
    		}



    
 
	
public void Init(Asset asset1)
    	{
	inherited(asset1);
	MyAsset = asset1;
	Nomernoy();
	TEDSound();
	Styk();
	K_loop();
	NoisePlay();
	SetWheelslipTractionMultiplier(1.0); // 1.0 �������� ����������
    AddHandler(me,"Metro717","Open_left","DvrleftHandler");
    AddHandler(me,"Metro717","Close_left","DvrleftHandler");
    AddHandler(me,"Metro717","Open_right","DvrrightHandler");
    AddHandler(me,"Metro717","Close_right","DvrrightHandler");
    AddHandler(me,"Metro717","BPSN_on","NomerHandler");
	AddHandler(me,"Metro717","BPSN_off","NomerHandler");
	AddHandler(me,"Metro717","MK_on","NomerHandler");
	AddHandler(me,"Metro717","MK_off","NomerHandler");
	AddHandler(me,"Metro717","bufers_on","NomerHandler");
	AddHandler(me,"Metro717","bufers_off","NomerHandler");
	AddHandler(me,"Metro717","bufers_on_all","NomerHandler");
	AddHandler(me,"Metro717","bufers_off_all","NomerHandler");
	AddHandler(me,"Metro717","fari_on","NomerHandler");
	AddHandler(me,"Metro717","fari_off","NomerHandler");
	
	meAsset = GetAsset();
	destsigntexturesKUID = meAsset.LookupKUIDTable("destsigntextures");
	destsigntexturesAsset = World.FindAsset(destsigntexturesKUID);
	AddHandler(me,"ChangeDestinationSign", "", "ChangeDestinationSign");
	ChangeDestinationSign(null);
	AddHandler(me, "World", "ModuleInit", "ModuleInitHandler");
    	}
	
};



