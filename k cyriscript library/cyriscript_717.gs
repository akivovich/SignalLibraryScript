include "CyriScriptSecondary.gs"

class CyriScript_717 isclass CyriScriptSecondary
{
	Asset m_soundAsset;
	bool m_Compressor;
	bool m_canPlaySounds = false;
	bool m_doorsState = false;
	
	void  WhiteLampsOff()
	{		
		SetFXCoronaTexture("doorlight-0", null );
		SetFXCoronaTexture("doorlight-1", null );
	}
	
	void  WhiteLampsOn()
	{		
		Asset k_white01 = GetAsset().FindAsset("white");
		SetFXCoronaTexture("doorlight-0", k_white01 );
		SetFXCoronaTexture("doorlight-1", k_white01 );
	}
	
	thread void LampsBlink()
	{
		Sleep(5);
		WhiteLampsOff();
	}
	
	public void SetDoorAnimationState(string p_meshName, bool p_state) 
	{
		m_doorsState = p_state;
		inherited(p_meshName, p_state);
		if (p_state) WhiteLampsOn();
		else		 LampsBlink();
	}

	public void SetElectroSupply(bool val)
	{
		inherited(val);
		if (val and m_doorsState) 
			WhiteLampsOn();			
		else	 
			WhiteLampsOff();
	}
	
	thread void CompressorThread()
	{		      
		if (!m_Compressor)
		{	
			m_Compressor = true;
			World.PlaySound(GetAsset(),"Sound/compressor_start.wav",1,10.0f,100.0f,me,"a.doors");
			Sleep(1.5);
			if (m_Compressor)
			{
				PlaySoundScriptEvent("compressor");
				while (m_Compressor)     
				{
					Sleep(1.3);
				}			
				StopSoundScriptEvent("compressor");
			}
			World.PlaySound(GetAsset(),"Sound/compressor_stop.wav",1,10.0f,100.0f,me,"a.doors");
		}
	}

	void PlayWheelsClatterSound(int n, float volume)
	{
		World.PlaySound(m_soundAsset,"Sound/styk" + n + ".wav", volume, 40, 220, me, "a.bog0");
	}

	thread void WheelsClatterPlayThread()
	{
		int n;
		float speed = Math.Fabs(GetVelocity());
		if (speed >= 1.5)
		{
			float volume = speed/14 + 0.5; 
			n = Math.Rand(1, 6);
			PlayWheelsClatterSound(n,volume);
			Sleep(2.1 / speed);
			PlayWheelsClatterSound(n,volume);
			Sleep(16.0/speed);
			speed = Math.Fabs(GetVelocity());
			if (speed >= 1.5)
			{			
				volume = speed/14 + 0.5;
				n = Math.Rand(1 , 6);
				PlayWheelsClatterSound(n,volume);
				Sleep(1.6/speed);
				PlayWheelsClatterSound(n,volume);
			}
		}
	}
	
	thread void WheelsClatterThread()
	{
		float speed;
		float tcorr = 0.1;
		int rnd = 0;
		while (m_canPlaySounds)
		{
			speed = Math.Fabs(GetVelocity());
			if (speed > 1.5) tcorr = tcorr + speed;
			Sleep(1);

			if (Math.Rand(0,100) < 30)
				rnd = Math.Rand(0,3);

			if (speed > 1.5)
			{
				if ((rnd == 0 and tcorr > 25) or (rnd == 1 and tcorr > 12.5) or (rnd == 2 and tcorr > 50))
				{
					tcorr = 0;
					WheelsClatterPlayThread();
				}
			}
		}
	}
	
	define int 	 mns = 32;
	define float dns = 2.8;
	
	thread void EngineSoundThread()
	{
		Asset asset = GetAsset();
		int   n = 0, nn = 0, nsu = 0, nsd = 0;
		bool  up = false, down = false;
		float delta,
			  s, ps = Math.Fabs(GetVelocity()) * 3.6;
		while (m_canPlaySounds)
		{
			s = Math.Fabs(GetVelocity()) * 3.6;
			if (s > 4 and s < 20)
			{
				if (ps > 20 or ps < 3)
				{
					n = 0;
					PlaySoundScriptEvent("slow_moving");
				}
				else
				{
					if (++n >= Math.Rand(11,21))
					{
						StopSoundScriptEvent("slow_moving");
						n = 0;
						PlaySoundScriptEvent("slow_moving");						
					}
				}
			}
			else
			{
				if (ps > 3 and ps < 20)
				{
					StopSoundScriptEvent("slow_moving");
				}
			}
			
			if (s > 0.5)
			{
				delta = s - ps;
				if (delta > -0.02 and delta < 0.02) delta = 0;
				if (up)
				{
					if (++nn > 3)
					{
						nn = 0;
						if (s > (nsu*dns-dns) and nsu < mns)
						{
							World.PlaySound(asset, "Sound/up_"+(++nsu)+".wav", 0.4, 10, 20, me, "a.bog0");
		//Print("Next up play:nsu="+nsu+",s="+s+",delta="+delta);				
						}
						else
						{
							up = false;
							//ns = 0;
		//Print("Stop up play:nsu="+nsu+",s="+s+",delta="+delta);				
						}
					}
					else if (delta < 0)
					{
						up = false;
						nn = 0;
		//Print("Stop up play:nsu="+nsu+",s="+s+",delta="+delta);				
					}
				}
				else if (down)
				{
					if (++nn > 3)
					{
						nn = 0;
						if (s < (nsd*dns+dns) and nsd > 2)
						{
							World.PlaySound(asset, "Sound/down_"+(--nsd)+".wav", 0.4, 10, 20, me, "a.bog0");
		//Print("Next down play:nsd="+nsd+",s="+s+",delta="+delta);				
						}
						else
						{
							down = false;
							//ns = 0;
		//Print("Stop down play:nsd="+nsd+",s="+s+",delta="+delta);				
						}
					}
					else if (delta > 0)
					{
						down = false;
						nn = 0;
		//Print("Stop down play:nsd="+nsd+",s="+s+",delta="+delta);				
					}				
				}
				if (!up)
				{			
					if ((!m_simpleMode and delta > 0.45) or (m_simpleMode and delta > 0.7))
					{
						up = true;
						int old = nsu;
						nsu = s/dns + 1;
						nn = 0;
						if (nsu > mns) nsu = mns;
		//Print("Start up play:nsu="+nsu+",s="+s+",delta="+delta);
						if (old != nsu)
							World.PlaySound(asset, "Sound/up_"+nsu+".wav", 0.4, 10, 20, me, "a.bog0");
					}
				}
				if (!down)
				{
					if ((!m_simpleMode and delta < -0.4) or (m_simpleMode and delta < -0.6))
					{
						int old = nsd;
						nsd = s/dns;
						if (nsd > 1)
						{
							down = true;						
							nn = 0;
							if (nsd > mns) nsd = mns;
		//Print("Start down play:nsd="+nsd+",s="+s+",delta="+delta);				
							if (old != nsd)
								World.PlaySound(asset, "Sound/down_"+nsd+".wav", 0.4, 10, 20, me, "a.bog0");
						}
					}				
				}
			}
	
	//if (Math.Fabs(delta) > 0.1)	Print("ps="+ps+",s="+s+",delta="+delta);
			
			ps = s;		
			Sleep(0.23);
		}
	}	
	
	thread void NoisePlayThread()
	{
		Sleep(5);
		bool prev;
		float speed;
		int n, nn = 0;
		while (true)
		{						
			m_canPlaySounds = (me == GetMyTrain().GetFrontmostLocomotive());
			if (m_canPlaySounds != prev)
			{
				prev = m_canPlaySounds;
				if (m_canPlaySounds)
				{
					EngineSoundThread();
					WheelsClatterThread();
				}
			}
			if (m_canPlaySounds)
			{
				speed = Math.Fabs(GetVelocity());
				if (speed > 8)
				{
					n = Math.Rand(1,4);
					if (n == nn) n++;
					if (n > 3) n = 1; 
					World.PlaySound(GetAsset(), "Sound/noise-"+n+".wav", speed / 40, 40, 220, me, "a.bog0");
					Sleep(1.3);
					nn = n;
				}
				else
				{
					Sleep(5);
				}
			}
			else
			{
				Sleep(5);
			}
		}
	}
	//========================================================================================================
	void OnCabinCommand(GameObject src, string cmd)
	{
	Print("OnCabinCommand:"+cmd);	
		if (cmd == "BPSN_on")  		PlaySoundScriptEvent("bpsn_sound");
		else if (cmd == "BPSN_off") StopSoundScriptEvent("bpsn_sound");
		else if (cmd == "MK_on")  	CompressorThread();
		else if (cmd == "MK_off") 	m_Compressor = false;
		else inherited(src, cmd);
	}
	//========================================================================================================
	/*
	void InitSoundSoup()
	{
		Soup data = m_soundAsset.GetConfigSoup().GetNamedSoup("extensions").GetNamedSoup("enginesound").GetNamedSoup("717");
		m_soundSoup = Constructors.NewSoup();
		int i, len = data.CountTags();
		string[] pars;
		
		for (i = 0; i < len; i++)
		{
			pars = Str.Tokens(data.GetNamedTag(data.GetIndexedTagName(i)), ",");
			m_soundSoup.SetNamedTag(pars[0], Str.ToFloat(pars[1]));
		}
	}
	*/
	public void Init() 
	{
		inherited();
		m_soundAsset = A.GetAsset();
		//InitSoundSoup();
		WhiteLampsOff();
		NoisePlayThread();
	}	
};