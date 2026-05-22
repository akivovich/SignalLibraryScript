include "gs.gs"
include "common.gs"
include "locomotive.gs"
include "world.gs"
include "vehicle.gs"
include "train.gs"
include "sessionvariables.gs"

class metro717_motor isclass Locomotive

{
Asset MyAsset;

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
	
	

    string destination = "";

    void ChangeDestinationSign(Message msg)
    {
	int maxlen = 999;		// en:	Maximum number of characters on sign. Change to adapt to the size of the sign.
					// de:	Maximale Anzahl von Zeichen in der Zielanzeige. An die Groesse der Anzeige anpassen.
	string new_destination = "";
	  
	if (msg) { new_destination = msg.minor; }
	
	if ( new_destination == "" ) { new_destination = "Posadki net"; }
	if (new_destination.size() > maxlen) { new_destination = new_destination[,maxlen]; }

	SetFXNameText("dest1", new_destination);
	SetFXNameText("dest2", new_destination);
	SetFXNameText("dest3", new_destination);
	SetFXNameText("dest4", new_destination);
	
	destination = new_destination;
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
		soup.SetNamedTag("destination", destination);

		if(!SoundSoup.IsLocked())
			soup.SetNamedSoup("SoundSoup",SoundSoup);
		return soup;
    		}

    	public void SetProperties(Soup soup)
    		{
		string new_destination = soup.GetNamedTag("destination");
		PostMessage(me, "ChangeDestinationSign", new_destination, 0);
		SoundSoup=soup.GetNamedSoup("SoundSoup");

		if(!SoundSoup or SoundSoup.GetNamedTagAsInt("numberofsounds")!=MyAsset.GetConfigSoup().GetNamedSoup("extensions").GetNamedTagAsInt("numberofsounds",0))
			InitSoundSoup();

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
	
	AddHandler(me,"ChangeDestinationSign", "", "ChangeDestinationSign");
	ChangeDestinationSign(null);
    	}
	
};



