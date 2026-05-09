//!!! Крышки, реверсер kryshka-l, kryshka-lr

//Объект кабины создаётся заново каждый раз, когда камера фокусируется на локомотиве.
//Объект loco передаётся кабине при вызве метода Attach - до вызова этого метода он будет null.
//CabinData - данные кабины, которые могут хранится в объекте локомотива.
//CabinData позволяют восстанавливать состояние кабины при смене фокуса на другой локомотив с последующим возвратом к ранее используемому.
//Для проверки изменения состояния кабины можно использовать метод Update, который вызывается из базового объекта 5-6 раз в секунду.

//Broadcast сообщения:
//"TrainDoors" - управление пассажирскими дверьми состава из кабины
//	"LeftOpened"  - двери слева открыты
//	"RightOpened" - двери справа открыты
//	"Closed" 	  - двери закрыты
//"DriverMode", "Realistic" - реалистичный режим вождения поезда

include "defaultlocomotivecabin.gs"
include "interface.gs"
include "CyriScriptSecondary.gs"

class CyriCabinData isclass CabinData
{
	public float kb;				//положение контроллера

	public bool AKB; 				//тумблер "батареи"
	public bool AKB_c;				//синхронизированное состояние "батареи"	
	public bool rc1 = true;			//тумблер "РЦ-1"
	public bool cabinlight; 		//тумблер "освещение кабины"
	public bool pultlight;  		//тумблер "освещение пульта"
	public bool als;				//тумблер "АЛС"
	public bool als_c;				//синхронизированное состояние "АЛС"
	public bool ars;				//тумблер "АРС"
	public bool ars_c;				//синхронизированное состояние "АРС"
	public bool blk_doors = true;	//тумблер "БЛОКИРОВКА ДВЕРЕЙ", true - заблокированы
	public bool ts_lr_doors;		//тумблер "ПРАВЫЕ/ЛЕВЫЕ двери", true - правые
	public bool doors_left_opened;	//двери слева открыты
	public bool doors_right_opened;	//двери справа открыты
	public bool kryshka_l;			//снята защитная крышка с левой кнопки открытия дверей слева 
	public bool kryshka_lr;			//снята защитная крышка с правой кнопки открытия дверей слева
	public bool kryshka_r;			//снята защитная крышка с кнопки открытия дверей справа
	public bool bpsn;				//тумблер "Блок питания собственных нужд"
	public bool bpsn_c;				//синхронизированное состояние BPSN
	public bool mot_comp;			//тумблер "Мотор компрессора"
	public bool mot_comp_c;			//синхронизированное состояние "Мотор компрессора"
	public bool compressor;			//работает компрессор
	public bool fary;				//тумблер "Фары"
	public bool vus;				//тумблер "ВУС" (вкл усиленный свет)
	public bool salon;				//тумблер "Освещение салона"
	public bool salon_c;			//синхронизированное состояние "Освещение салона"
	public bool m_arsOch, m_ars0, m_ars4, m_ars6, m_ars7, m_ars8, m_rs; //состояние ламп АЛС
};

class CyriNomerCab isclass DefaultLocomotiveCabin
{
	define int ALS_0  = 0;
	define int ALS_OC = 1;
	define int ALS_AO = 2;
	define int ALS_40 = 4;
	define int ALS_60 = 6;
	define int ALS_70 = 7;
	define int ALS_80 = 8;
	//m_textures constants
	define int  NUMBER_SPEED_OFF   = 6;
	define int  NUMBER_SPEED_START = 7;
	define int	NUMBER_GREEN_OFF   = 27;
	define int	NUMBER_GREEN_ON    = 28;
	define int	NUMBER_ORANGE_OFF  = 29;
	define int	NUMBER_ORANGE_ON   = 30;
	define int	NUMBER_RED_OFF     = 31;
	define int	NUMBER_RED_ON      = 32;
	define int	NUMBER_PULT_OFF    = 33;
	define int	NUMBER_PULT_ON     = 34;
	define int	NUMBER_PULT_W      = 35;
	//kontroller
	define float KB_X3  = 3.0;
	define float KB_X2  = 2.04;
	define float KB_X1  = 1.08;
	define float KB_0   = 0.0;
	define float KB_T1  = -1.08;
	define float KB_T1a = -2.04;
	define float KB_T2  = -3.0;
		
	//e constants
	define float ACCEL1 = -0.3;
	define float MAX_ACCEL = -1.1;
	define int   PULSE_ADD = 4;
	define int   PULSE1 = 26;
	define int   TRACTION = 34000;

	CyriCabinData m_cd;
	Asset m_textures;
	CabinControl m_throttle;
	Signal m_nextSignal;
			
	float m_throttleEngineValue;		
	//bool m_vz1Locked;	
	bool m_lsd, m_rk, m_rp, m_lsn, m_lkvc, m_ln, m_lkvd, m_lvd, m_lkt, m_lst;	
	bool m_lampArs, m_lampLeftDoors, m_lampRightDoors, m_lampLkvp, m_lampLzp, m_lampPt;	
	bool m_ALSG, m_simpleModeThread, m_controlThread,
		 m_simpleMode, m_workMode;
	bool m_arsStart, m_arsStopping;
	bool m_passedRed;
	int  m_speedLimit;
	bool m_HorLiftDoorsOpened;	
	
// functions
	void SetSimpleMode(bool value);
	void SetPowerOn();
	void SetPowerOff(bool all);
	void BatteryChanged(bool restore);
	void ArsChanged(bool restore);
	void AlsChanged();
	void BpsnChanged();
	void MotCompChanged();
	void SalonChanged();
	void SyncDoorsState();

	void Print(string info)
	{
		Interface.Print("Cab::"+loco.GetName()+":"+info);
	}
	
	void PlaySound(string sound)
	{
		World.PlaySound(GetAsset(),"sound/"+sound,1.0f,2,10,loco,"a.cabfront");
	}
	
	bool IsLastVehicle()
	{
		Vehicle[] vehicles = loco.GetMyTrain().GetVehicles();
		return (loco == vehicles[vehicles.size()-1]);
	}
	
	void PostMessageToVehicles(string cmd)
	{		
		if (cmd == "MK_on" or cmd == "MK_off" or cmd == "mode_request") 
		{
			loco.PostMessage(loco, "FromCab", cmd, 0);
		}
		else
		{		
			Vehicle v;
			Vehicle[] vehicles = loco.GetMyTrain().GetVehicles();
			int i, len = vehicles.size();
			if (cmd == "fary_on" or cmd == "fary_off")
			{
				loco.PostMessage(vehicles[0], "FromCab", cmd, 0);
				loco.PostMessage(vehicles[len-1], "FromCab", cmd, 0);
			}
			else
			{
	//Print("PostMessageToVehicles:cmd="+cmd);
				for (i = 0; i < len; i++)
					loco.PostMessage(vehicles[i], "FromCab", cmd, 0);
			}
		}
	}
	
	CyriCabinData GetOppositeCabinData()
	{
		Vehicle[] vehicles = loco.GetMyTrain().GetVehicles();
		int len = vehicles.size();
		if (len > 1)
		{
			Locomotive cur;
			if (loco == vehicles[0]) cur = cast<Locomotive>(vehicles[len-1]);
			else					 cur = cast<Locomotive>(vehicles[0]);
			CabinData cd = cur.GetCabinData();
			if (cd and cd.isclass(CyriCabinData))
				return cast<CyriCabinData>(cd);
		}
		return null;
	}

	void SetWorkMode()
	{
		m_workMode = !m_simpleMode and !m_arsStart and m_cd.AKB_c and m_cd.bpsn_c;
	}
	
//===================================================================================================================
	void  SetEngineSetting(string setting, float value, string from)
	{
	//Print("SetEngineSetting:setting="+setting+",value="+value+",from="+from);	
		loco.SetEngineSetting(setting, value);
		//if (setting == "throttle")
		//	m_throttleEngineValue = value;
	}
	
	void SetThrottleEngingSettings(float value)
	{
//Print("SetThrottleEngingSettings:"+value);	
		if (!m_workMode or m_arsStart or m_arsStopping) value = 0;
		loco.SetEngineSetting("throttle", value);
		m_throttleEngineValue = value;
	}
//===================================================================================================================
	bool IsReverserNeutral() 
	{
		return loco.GetEngineSetting("reverser") == Train.TRACTION_NEUTRAL;
	}

	// speed
	int GetCurrentSpeed()
	{
		int speed = 0;
		if (loco)
		{
			speed = (int)(loco.GetVelocity() * 3.6);
			if (speed < 0)
				speed = -speed;
		}
		return speed;
	}
	
	void UpdateSpeedIndicators(bool turn_off)
	{
	//Print("UpdateSpeedIndicators:"+turn_off);
		if (turn_off)
		{
			SetFXTextureReplacement("k_speed01", m_textures, NUMBER_SPEED_OFF);
			SetFXTextureReplacement("k_speed02", m_textures, NUMBER_SPEED_OFF);
		}
		else
		{
			int textureNumber;
			int speed = GetCurrentSpeed();
			textureNumber = speed % 10 + NUMBER_SPEED_START;
			SetFXTextureReplacement("k_speed02", m_textures, textureNumber);
			textureNumber = speed / 10 + NUMBER_SPEED_START;
			SetFXTextureReplacement("k_speed01", m_textures, textureNumber);
		}
	}
	
	// m_throttle
	int GetThrottlePosition()
	{
		int position;
		float value = m_throttle.GetValue();

		if (value < -2.5)
			position = -3;
		else if (-2.5 <= value and value < -1.75)
			position = -2;
		else if (-1.75 <= value and value < -0.1)
			position = -1;
		else if (-0.1 <= value and value < 0.1)
			position = 0;
		else if (0.1 <= value and value < 1.75)
			position = 1;
		else if (1.75 <= value and value < 2.5)
			position = 2;
		else if (2.5 <= value)
			position = 3;

		return position;
	}
	
	bool IsAlsWorks()
	{
		return (m_cd and m_cd.AKB_c and m_cd.als_c);
	}
	
	// ARS
	public void SetArsOch(bool state) 
	{
		if (m_cd.m_arsOch != state)
		{
			if (state and IsAlsWorks())
				SetFXTextureReplacement("k_ars_och", m_textures, NUMBER_RED_ON);
			else
				SetFXTextureReplacement("k_ars_och", m_textures, NUMBER_RED_OFF);
			m_cd.m_arsOch = state;
		}
	}
	// ----	
	public void SetArs0(bool state) 
	{
		if (m_cd.m_ars0 != state)
		{
			if (state and IsAlsWorks())
				SetFXTextureReplacement("k_ars_00", m_textures, NUMBER_RED_ON);
			else
				SetFXTextureReplacement("k_ars_00", m_textures, NUMBER_RED_OFF);
			m_cd.m_ars0 = state;
		}
	}	
	// ----	
	public void SetArs4(bool state) 
	{
		if (m_cd.m_ars4 != state)
		{
			if (state and IsAlsWorks())
				SetFXTextureReplacement("k_ars_40", m_textures, NUMBER_ORANGE_ON);
			else
				SetFXTextureReplacement("k_ars_40", m_textures, NUMBER_ORANGE_OFF);
			m_cd.m_ars4 = state;
		}
	}
	// ----
	public void SetArs6(bool state) 
	{
		if (m_cd.m_ars6 != state)
		{
			if (state and IsAlsWorks())
				SetFXTextureReplacement("k_ars_60", m_textures, NUMBER_GREEN_ON);
			else
				SetFXTextureReplacement("k_ars_60", m_textures, NUMBER_GREEN_OFF);
			m_cd.m_ars6 = state;
		}
	}
	// ----	
	public void SetArs7(bool state) 
	{
		if (m_cd.m_ars7 != state)
		{
			if (state and IsAlsWorks())
				SetFXTextureReplacement("k_ars_70", m_textures, NUMBER_GREEN_ON);
			else
				SetFXTextureReplacement("k_ars_70", m_textures, NUMBER_GREEN_OFF);
			m_cd.m_ars7 = state;
		}
	}	
	// ----	
	public void SetArs8(bool state) 
	{
		if (m_cd.m_ars8 != state)
		{
			if (state and IsAlsWorks())
				SetFXTextureReplacement("k_ars_80", m_textures, NUMBER_GREEN_ON);
			else
				SetFXTextureReplacement("k_ars_80", m_textures, NUMBER_GREEN_OFF);
			m_cd.m_ars8 = state;
		}
	}	
	// m_lsd
	thread void SetLsd(bool state) 
	{
	//Print("SetLsd:state="+state+",m_lsd="+m_lsd);
		if (m_lsd != state)
		{
			m_lsd = state;
			if (state)
			{
				Sleep(3);
				SetFXTextureReplacement("k_lsd1", m_textures, NUMBER_GREEN_ON);
				SetFXTextureReplacement("k_lsd2", m_textures, NUMBER_GREEN_ON);
			}
			else
			{
				Sleep(0.7);
				SetFXTextureReplacement("k_lsd1", m_textures, NUMBER_GREEN_OFF);
				SetFXTextureReplacement("k_lsd2", m_textures, NUMBER_GREEN_OFF);
			}
		}
	}
	// *
	// m_rk
	void SetRk(bool state)
	{
		if (m_rk != state)
		{
			if (state and m_cd.AKB_c)
				SetFXTextureReplacement("k_rk", m_textures, NUMBER_ORANGE_ON);
			else
				SetFXTextureReplacement("k_rk", m_textures, NUMBER_ORANGE_OFF);
			m_rk = state;
		}
	}
	// m_rp
	void SetRp(bool state)
	{
		if (m_rp != state)
		{
			if (state and m_cd.AKB_c)
				SetFXTextureReplacement("k_rp", m_textures, NUMBER_RED_ON);
			else
				SetFXTextureReplacement("k_rp", m_textures, NUMBER_RED_OFF);
			m_rp = state;
		}
	}
	// *
	// ЛСН горит при сборе схемы вместе с РП. А также когда на каком-то одном вагоне не собирается схема не по причине сработки РП.
	// m_lsn
	void SetLsn(bool state)
	{
		if (m_lsn != state)
		{
			if (state and m_cd.AKB_c)
				SetFXTextureReplacement("k_lsn", m_textures, NUMBER_RED_ON);
			else
				SetFXTextureReplacement("k_lsn", m_textures, NUMBER_RED_OFF);
			m_lsn = state;
		}
	}	
	// ЛКВЦ — Лампа Контроля Вспомогательных Цепей. Красная, горит, когда на каком-то из вагонов отключен контакт вспом.цепей (КВЦ).
	// m_lkvc
	void SetLkvc(bool state)
	{
		if (m_lkvc != state)
		{
			if (state and m_cd.AKB_c)
				SetFXTextureReplacement("k_lkvc", m_textures, NUMBER_RED_ON);
			else
				SetFXTextureReplacement("k_lkvc", m_textures, NUMBER_RED_OFF);
			m_lkvc = state;
		}
	}
	// ЛН — лампа направления. Горит, когда поезд получил особую кодовую частоту — признак направления. При горящей ЛН скорость ограничивается только АРС. При погашенной половинится — при разрешающей частоте «80» будет давать ехать 40. И так далее. Используется далеко не везде.
	// m_ln
	void SetLn(bool state)
	{
		if (m_ln != state)
		{
			if (state and m_cd.AKB_c)
				SetFXTextureReplacement("k_ln", m_textures, NUMBER_GREEN_ON);
			else
				SetFXTextureReplacement("k_ln", m_textures, NUMBER_GREEN_OFF);
			m_ln = state;
		}
	}	
	// РС — равенство скоростей. Горит, когда частота на блок-участке на котором находится поезд и частота на впередилежащем блок-участке равны. Если впереди частота меньше, то РС гореть не будет, а будут гореть две частоты 70 и 80, к примеру. Но это при АРС типа ДНЕПР 2/6, где одновременно могут приниматься 2 частоты из 6 возможных.
	// m_rs
	void SetRs(bool state)
	{
		if (m_cd.m_rs != state)
		{
			if (state and m_cd.AKB_c)
				SetFXTextureReplacement("k_rs", m_textures, NUMBER_GREEN_ON);
			else
				SetFXTextureReplacement("k_rs", m_textures, NUMBER_GREEN_OFF);
			m_cd.m_rs = state;
		}
	}	
	// ЛКВД — Лампа Контроля Выключения Двигателей. Горит, когда АРС запрещает тяговый режим.
	// Если в процессе торможения машинистом было допущено превышение, то лампа ЛКВД останется гореть до того, пока схема не будет пересобрана. При горящей ЛКВД при торможении до полной остановки (машинистом или АРС) в конце торможения сработаюи ВЗ-2.
	// m_lkvd
	void SetLkvd(bool state)
	{
		if (m_lkvd != state)
		{
			if (state and m_cd.AKB_c)
				SetFXTextureReplacement("k_lkvd", m_textures, NUMBER_RED_ON);
			else
				SetFXTextureReplacement("k_lkvd", m_textures, NUMBER_RED_OFF);
			m_lkvd = state;
		}
	}
	// *
	// ЛВД — лампа включения двигателей. Горит, когда есть питание на 1 поездном проводе. Т.е. при постановке КВ в ход.
	// m_lvd
	void SetLvd(bool state)
	{
		if (m_lvd != state)
		{
			if (state and m_cd.AKB_c)
				SetFXTextureReplacement("k_lvd", m_textures, NUMBER_GREEN_ON);
			else
				SetFXTextureReplacement("k_lvd", m_textures, NUMBER_GREEN_OFF);
			m_lvd = state;
		}
	}
	// *
	// ЛКТ — лампа контроля тормоза. Сигнализирует об эффективности торможения на всём составе
	// Сработка АРС или противоскатывания
	// m_lkt
	void SetLkt(bool state)
	{
		if (m_lkt != state)
		{
			if (state and m_cd.AKB_c)
				SetFXTextureReplacement("k_lkt", m_textures, NUMBER_GREEN_ON);
			else
				SetFXTextureReplacement("k_lkt", m_textures, NUMBER_GREEN_OFF);
			m_lkt = state;
		}
	}
	// *
	// ЛСТ — лампа сигнализации тормоза. Горит при напряжении на 6-м поездном проводе. Т.е. при собранной схеме на тормоз.
	// m_lst
	void SetLst(bool state)
	{
		if (m_lst != state)
		{
			if (state and m_cd.AKB_c)
				SetFXTextureReplacement("k_lst", m_textures, NUMBER_GREEN_ON);
			else
				SetFXTextureReplacement("k_lst", m_textures, NUMBER_GREEN_OFF);
			m_lst = state;
		}
	}
	// control lamps on pult	
	// ars
	void SetLampArs(bool state)
	{
		if (m_lampArs != state)
		{
			if (state and m_cd.AKB_c)
				SetFXTextureReplacement("k_control_ars", m_textures, NUMBER_PULT_ON);
			else
				SetFXTextureReplacement("k_control_ars", m_textures, NUMBER_PULT_OFF);
			m_lampArs = state;
		}
	}	
	// left doors
	void SetLampLeftDoors(bool state)
	{
		if (m_lampLeftDoors != state)
		{
			if (state and m_cd.AKB_c)
				SetFXTextureReplacement("k_control_ldoors", m_textures, NUMBER_PULT_W);
			else
				SetFXTextureReplacement("k_control_ldoors", m_textures, NUMBER_PULT_OFF);
			m_lampLeftDoors = state;
		}
	}
	// right doors
	void SetLampRightDoors(bool state)
	{
		if (m_lampRightDoors != state)
		{
			if (state and m_cd.AKB_c)
				SetFXTextureReplacement("k_control_rdoors", m_textures, NUMBER_PULT_W);
			else
				SetFXTextureReplacement("k_control_rdoors", m_textures, NUMBER_PULT_OFF);
			m_lampRightDoors = state;
		}
	}
	// lkvp
	void SetLampLkvp(bool state)
	{
		if (m_lampLkvp != state)
		{
			if (state and m_cd.AKB_c)
				SetFXTextureReplacement("k_control_lkvp", m_textures, NUMBER_PULT_ON);
			else
				SetFXTextureReplacement("k_control_lkvp", m_textures, NUMBER_PULT_OFF);
			m_lampLkvp = state;
		}
	}
	// lzp
	void SetLampLzp(bool state)
	{
		if (m_lampLzp != state)
		{
			if (state and m_cd.AKB_c)
				SetFXTextureReplacement("k_control_lzp", m_textures, NUMBER_PULT_ON);
			else
				SetFXTextureReplacement("k_control_lzp", m_textures, NUMBER_PULT_OFF);
			m_lampLzp = state;
		}
	}
	// pt
	void SetLampPt(bool state)
	{
		if (m_lampPt != state)
		{
			if (state and m_cd.AKB_c)
				SetFXTextureReplacement("k_control_pt", m_textures, NUMBER_PULT_ON);
			else
				SetFXTextureReplacement("k_control_pt", m_textures, NUMBER_PULT_OFF);
			m_lampPt = state;
		}
	}
	
	void SetLsdState()
	{
		SetLsd(m_cd and m_cd.AKB_c and !(m_cd.doors_left_opened or m_cd.doors_right_opened) and !IsReverserNeutral());
	}
	
// lamps
	void SetDoorsLamps()
	{
		//if (m_cd)	Print("SetDoorsLamps:isReverserNeutral="+IsReverserNeutral()+",m_cd.AKB_c="+m_cd.AKB_c+",m_cd.blk_doors="+m_cd.blk_doors+",m_cd.ts_lr_doors="+m_cd.ts_lr_doors);
		if (m_cd and m_cd.AKB_c and !m_cd.blk_doors and !IsReverserNeutral())
		{
			SetLampLeftDoors(!m_cd.ts_lr_doors);
			SetLampRightDoors(m_cd.ts_lr_doors);
		}
		else
		{
			SetLampLeftDoors(false);
			SetLampRightDoors(false);
		}
	}
	
	void InitLampsAls()
	{
		SetArsOch(false);
		SetArs0(false);
		SetArs4(false);
		SetArs6(false);
		SetArs7(false);
		SetArs8(false);
		SetRs(false);
	}
	
	void InitLamps()
	{			
		SetLsd(false);		
		SetRk(false);
		SetRp(false);		
		SetLsn(false);		
		SetLkvc(false);		
		SetLn(false);
		SetLkvd(false);
		SetLvd(false);
		SetLkt(false);
		SetLst(false);
		SetLampArs(false);
		SetLampLkvp(false);
		SetLampLzp(false);
		SetLampPt(false);
		SetDoorsLamps();
	}
	
	void InitSpeedControls()
	{
		UpdateSpeedIndicators(false);				
	}
		
	void SetAls(int alsCode, int alsCode_next, bool autoblocking)	
	{
//Print("SetAls1::alsCode="+alsCode+",alsCode_next="+alsCode_next+",autoblocking="+autoblocking);
		int als = alsCode;
		if (als < 0) als = alsCode_next;
		bool och = (als == ALS_OC);
		SetArsOch(och);
		if (och)
		{
			SetArs0(false);
			SetArs4(false);
			SetArs6(false);
			SetArs7(false);
			SetArs8(false);
			SetRs(false);
		}
		else
		{
			bool alsNext_0 = alsCode_next == ALS_0 or alsCode_next == ALS_AO;
			bool showDop = !autoblocking and
							alsCode_next != ALS_OC and 
							alsCode_next < als;

			bool als_0 = als == ALS_0 or als == ALS_AO,
				 rs    = autoblocking and alsCode_next >= als;

Print("SetAls2::alsCode="+alsCode+",alsCode_next="+alsCode_next+",autoblocking="+autoblocking+",showDop="+showDop+",rs="+rs);
			SetArs0(als_0 or (showDop and alsNext_0));
			SetArs4(als == ALS_40 or (showDop and alsCode_next == ALS_40));
			SetArs6(als == ALS_60 or (showDop and alsCode_next == ALS_60));
			SetArs7(als == ALS_70 or (showDop and alsCode_next == ALS_70));
			SetArs8(als == ALS_80);
			SetRs(rs);
		}
	}
	
	void SetAlsFromFrontmostLocomotive()
	{
//Print("SetAlsFromFrontmostLocomotive");
		CyriCabinData ccd = GetOppositeCabinData();
		if (!ccd)
		{
			InitLampsAls();
		}
		else
		{
			SetArsOch(ccd.m_arsOch);
			SetArs0(ccd.m_ars0);
			SetArs4(ccd.m_ars4);
			SetArs6(ccd.m_ars6);
			SetArs7(ccd.m_ars7);
			SetArs8(ccd.m_ars8);
			SetRs(ccd.m_rs);
		}			
	}
	
	thread void ArsStopThread()
	{
		if (m_arsStopping) return;		
		m_arsStopping = true;
		SetLkvd(true);
		PlaySound("ars.wav");
        SetThrottleEngingSettings(0);
        SetEngineSetting("dynamic-brake", 2, "100");
		Sleep(1);
		if (m_passedRed or GetCurrentSpeed() > m_speedLimit)
        {
			SetEngineSetting("dynamic-brake",2, "100");
			SetEngineSetting("loco-auto-brake",100, "100");
			while (m_arsStopping)
			{
				PlaySound("ars.wav");
				Sleep(0.7);
				if (m_simpleMode) {
					if (m_passedRed) {
						if (GetCurrentSpeed() == 0) break;
					}
					else if (GetCurrentSpeed() < m_speedLimit) break;
				}
			}
		}
		PlaySound("ars_end.wav");
		SetLkvd(false);
		SetEngineSetting("dynamic-brake",0, "101");
		SetEngineSetting("loco-auto-brake",0, "101");
		m_arsStopping = m_passedRed = false;
		m_speedLimit = 1000;
	}
	
	void Ars()
	{
		if (!m_arsStopping and (m_passedRed or GetCurrentSpeed() > m_speedLimit))
		{
	//Print("Ars:"+GetCurrentSpeed()+",m_speedLimit="+m_speedLimit);	
			ArsStopThread();
		}
	}
		
	void SetLampsByThrottlePos(int pos)
	{
		switch (pos)
		{
			case -3:
				SetRk(true);
				SetLst(true);
				SetLvd(false);
				SetLn(false);
				SetLkt(true);
				break;
			case -2:
				SetRk(true);
				SetLst(false);
				SetLvd(false);
				SetLn(false);
				SetLkt(true);
				break;
			case -1:
				SetRk(false);
				SetLst(false);
				SetLvd(false);
				SetLn(false);
				SetLkt(true);
				break;
			case 0:
				SetRk(false);
				SetLvd(false);
				SetLst(false);
				SetLn(false);
				SetLkt(false);
				break;
			case 1:
				SetRk(false);
				SetLvd(true);
				SetLn(false);
				SetLst(false);
				break;
			case 2:
				SetRk(true);
				SetLvd(true);
				SetLn(false);
				SetLst(false);
				break;
			case 3:
				SetRk(true);
				SetLvd(true);
				SetLn(false);
				SetLst(false);
				break;
			default:
				break;
		}
	}
	
	void SetLampsOnThrottleDown()
	{
		SetLsn(true);
		Sleep(0.1);
		SetRp(true);
		Sleep(0.5);
		SetRp(false);
		Sleep(0.3);
		SetLsn(false);
	}
	
	void SetLampsOnThrottleUp()
	{
		SetLsn(true);
		Sleep(0.1);
		SetRp(true);
		Sleep(0.3);
		SetRp(false);
		Sleep(0.2);
		SetLsn(false);
	}
	
// threads
	define int MaxCount = 6;
	thread void SimpleModeThread()
	{
		if (m_simpleModeThread) return;
		m_simpleModeThread = true;
		while (m_simpleMode and !m_cd) Sleep(1);		
		float speed = 0, prev_speed = -1000, delta;
		int throttleValue = 0, newValue = 0, count = 0;
		CabinControl reverser = GetNamedControl("reverser_lever");
		while (m_simpleMode)
		{
			speed = loco.GetVelocity();
			if (prev_speed > -1000)
			{
				if (speed == 0)
				{
					if (!m_cd.kb)
					{
						Sleep(1);
						SetLampsByThrottlePos(0);
						m_throttle.SetValue(0);
						throttleValue = count = 0;
					}					
				}
				else
				{
					delta = speed - prev_speed;
					if (speed > 0)	
					{
						reverser.SetValue(Train.TRACTION_FORWARD);
					}
					else
					{
						reverser.SetValue(Train.TRACTION_REVERSE);
						delta = -delta;
					}
					if (delta > -0.01 and delta < 0.01) delta = 0;
//Print("SimpleModeThread:delta="+delta);
					if (delta > 0)
					{
						if (delta > 0.2) newValue = 3;
						else if (delta > 0.15) newValue = Math.Max(newValue, 2);
						else newValue = Math.Max(newValue, 1);
						if (throttleValue <= 0) count = MaxCount - 1;						
						if (++count == MaxCount)
						{
							count = 0;
							if (newValue > throttleValue)
							{
								if (throttleValue <= 0) SetLampsOnThrottleUp();
								throttleValue = newValue;
								m_throttle.SetValue(throttleValue);
								SetLampsByThrottlePos(throttleValue);
								m_cd.kb = 0;							
							}
						}
					}
					else if (delta < 0)
					{
						if (throttleValue >= 0) count = MaxCount - 1;
						if (delta < -0.8) newValue = -3;
						else if (delta < -0.65) newValue = Math.Min(newValue, -2);
						else newValue = Math.Min(newValue, -1);
						if (++count == MaxCount)
						{
							count = 0;
							if (newValue < throttleValue)
							{
								if (throttleValue >= 0) SetLampsOnThrottleDown();
								throttleValue = newValue;
								SetLampsByThrottlePos(throttleValue);
								m_throttle.SetValue(throttleValue);
								m_cd.kb = 0;							
							}
						}
					}
					else
					{
						if (throttleValue != 0 and ++count == MaxCount)
						{
							SetLampsByThrottlePos(0);
							throttleValue = count = 0;
							m_throttle.SetValue(0);							
						}						
					}										
				}
			}			
			prev_speed = speed;			
			Sleep(0.5);
		}
		m_simpleModeThread = false;
	}
	
	thread void CompressorThread()
	{
		bool compressor = m_cd.compressor;
		int  i, minutes;
		while (!m_simpleMode and m_cd.AKB_c and m_cd.mot_comp)
		{
			i = 0;
			if (compressor) minutes = Math.Rand(1, 3);
			else			minutes = Math.Rand(15, 31); 
			while (i++ < minutes and !m_simpleMode and m_cd.AKB_c and m_cd.mot_comp and compressor == m_cd.compressor)
			{
				Sleep(60);
			}
			if (!m_simpleMode and m_cd.AKB_c and m_cd.mot_comp and compressor == m_cd.compressor)
			{
				if (compressor)
				{
					m_cd.compressor = false;
					PostMessageToVehicles("MK_off");
				}
				else
				{
					m_cd.compressor = true;
					PostMessageToVehicles("MK_on");
				}
			}
			compressor = m_cd.compressor;
		}
	}
	
	bool m_ReverserThread;
	thread void ReverserThread() 
	{
		if (m_ReverserThread) return;
		m_ReverserThread = true;
		int revState = loco.GetEngineSetting("reverser"),
			revStateNew;
		while (loco == loco.GetMyTrain().GetFrontmostLocomotive()) {
			revStateNew = loco.GetEngineSetting("reverser");
			if (revStateNew != revState) {				
				if (m_cd.AKB_c) PlaySound("revers_1.wav");
				else			  		   PlaySound("tumbler02.wav");
				revState = revStateNew;				
				if (m_cd.AKB_c and revState != Train.TRACTION_NEUTRAL) {
					PlaySound("revers_1.wav");
					Sleep(0.3);
					SetLsd(!(m_cd.doors_left_opened or m_cd.doors_right_opened));
				}
				else {
					
					Sleep(0.3);
					SetLsd(false);
				}
				SetDoorsLamps();
				SetLn(m_cd.AKB_c and revState == Train.TRACTION_FORWARD);
			}
			Sleep(0.5);
		}
		m_ReverserThread = false;
	}
	
	thread void DetectAutopilotThread()
	{
		Train train = loco.GetMyTrain();
		if (train.GetTrainVelocity() and train.GetAutopilotMode() != Train.CONTROL_MANUAL)
		{
			SetSimpleMode(true);
			if (loco == train.GetFrontmostLocomotive()) 
				SetPowerOn();
			else									  
				SetPowerOff(false);			
		}
	}

	thread void BrakeSounderThread()
	{
		float old_vz1st = 0.0;
		float new_vz1st = 0.0;
		while (!m_simpleMode)
		{
			new_vz1st = loco.GetEngineSetting("loco-auto-brake");
			if(new_vz1st != old_vz1st)
			{
				if (new_vz1st  < old_vz1st)
				{
					PlaySound("vz_o.wav");
				}
				else if (new_vz1st  > old_vz1st)
				{
					PlaySound("vz_t.wav");
				}
				old_vz1st = new_vz1st;
			}
			Sleep(0.5);
		}
	}

	int CalcSpeedLimit(int alsCode, int alsCode_next, bool ps) //mute
	{
		if (ps) return 20;
		int als = alsCode;
		if (als < 0) als = alsCode_next;
		if (als < 0 or als == ALS_0 or als == ALS_OC) return 20;
		if (als == ALS_AO) return 0;
		return als * 10;
	}

	thread void Als_Thread()
	{
		if (m_ALSG) return;
	//Print("Als_Thread start");
		m_ALSG = true;
		GSTrackSearch GSTS;
		MapObject mo;
		int  alsCode = -1, alsCode_next = -1;
		bool autoblock, ps;
		Signal signal;
		Train  train;
		while (m_cd.AKB_c and (m_cd.als or m_cd.als_c))
		{
			train = loco.GetMyTrain();
			if (loco == train.GetFrontmostLocomotive())
			{
				if (m_HorLiftDoorsOpened) 
				{
					alsCode = alsCode_next = 0;
					m_speedLimit = 0;					
				}
				else 
				{
					bool bVehicle = false, 
						 bSignal = false;			
					GSTS = loco.BeginTrackSearch(loco.GetDirectionRelativeToTrain());
					mo = GSTS.SearchNext();
					while (mo)
					{
						if (mo.isclass(Vehicle))
						{
							m_speedLimit = 20;
							alsCode_next = alsCode = ALS_0;
							m_nextSignal = null;
							bVehicle = true;
							break;
						}
						if (mo.isclass(Signal) and GSTS.GetFacingRelativeToSearchDirection())
						{
							Soup props = mo.GetProperties();
							if (props.GetNamedTag("MSig-type") != "")
							{
								bSignal = true;
								signal = cast<Signal>(mo);
								if (signal != m_nextSignal) 
								{
									alsCode = alsCode_next;
								 	m_nextSignal = signal;
									m_passedRed = alsCode == ALS_AO;
								}
								
								if (m_passedRed and !ps)
								{
									alsCode = alsCode_next = ALS_0;
								}
								else 
								{
									alsCode_next = props.GetNamedTagAsInt("MSig-als-fq");
									ps = props.GetNamedTagAsBool("ps");
									autoblock = props.GetNamedTagAsInt("autoblock");
//Print("props::alsCode="+alsCode+",alsCode_next="+alsCode_next+",autoblock="+autoblock+",signal="+signal.GetName()+",distance="+GSTS.GetDistance());
									if (!m_arsStopping) 
									{
										m_speedLimit = CalcSpeedLimit(alsCode, alsCode_next, ps);
//Print("m_speedLimit="+m_speedLimit);
									}
								}							
								break;
							}
						}
						mo = GSTS.SearchNext();
						if (GSTS.GetDistance() > 1500)
						{
							m_speedLimit = 20;
							alsCode_next = alsCode = ALS_OC;
							break;
						}
					}
					if (!bVehicle and !bSignal) 
					{
						m_nextSignal = null;
						m_speedLimit = 20;
						alsCode_next = alsCode = ALS_OC;
					}
				}
				SetAls(alsCode, alsCode_next, autoblock);
				if (train.GetAutopilotMode() == Train.CONTROL_MANUAL)  Ars();
			}
			else
			{
				SetAlsFromFrontmostLocomotive();
			}
			Sleep(0.5);
		}
		InitLampsAls();
		m_ALSG = false;
	//Print("Als_Thread end");
	}

	thread void RealisticModeThread(void)
	{	
		if (!m_controlThread and m_workMode)
		{
			m_controlThread = true;
    //float kv_pos1=-10, throttle1=-10, applied_force1=-10, a1=-10; 
	//int cposc1=-10;
			int  kv_pos, kv_pos_old = GetThrottlePosition();
			float a = 0.0;
          	bool vz1_locked = false;
          	bool add = false, cm = false;
          	float fval, tadd = 0.0;
			int cpos = 0, cposc = 0;
			int logv;
			while (m_workMode)
			{				
//if (kv_pos1 != kv_pos or cposc1 != cposc or a1 != a or throttle1 != loco.GetEngineSetting("throttle") or applied_force1 !=loco.GetEngineParam("applied-force"))
//{				
//kv_pos1=kv_pos;
//cposc1 = cposc;
//a1 = a;
//throttle1 = loco.GetEngineSetting("throttle");
//applied_force1 =loco.GetEngineParam("applied-force");
/*
  Print("KB=" + kv_pos + 
		"  pos=" + cposc + 
		"  ttl=" + throttle1 + 
		"  f=" + applied_force1 + 
		"  a=" + a);
*/		
//}
            	Sleep(0.05);				
				cm = !cm;
             
            	tadd = 0.0;
            	float vel = Math.Fabs(loco.GetVelocity() * 3.6);            	
				
				if (m_arsStopping) kv_pos = -3;
				else			   kv_pos = GetThrottlePosition();
				
				if (kv_pos_old >= 0 and kv_pos < 0) SetLampsOnThrottleDown();
				else if (kv_pos_old < 0 and kv_pos >= 0) SetLampsOnThrottleUp();
				
	//if (kv_pos_old != kv_pos) Print("kv_pos="+kv_pos);
		
       			kv_pos_old = kv_pos;


				//if ((ARSState == 1) or (ARSState == 2))
				//	kv_pos = -3;
			
				if (vel > 0.1)
				{
					if (vz1_locked)
						SetEngineSetting("loco-auto-brake",100, "12");
					if ((kv_pos < -1) and (cposc > 16) and (a > -0.4))
						SetEngineSetting("loco-auto-brake",100, "13");
				}			
			
				if (kv_pos == 0)
				{
					cpos = 1;
					cposc = 1;
					SetThrottleEngingSettings(0);
					SetEngineSetting("dynamic-brake",0, "15");
					SetEngineSetting("loco-auto-brake",0, "25");
					loco.GetMyTrain().SetTrainBrakes(0);
					SetLampsByThrottlePos(0);
				}
				else if (kv_pos == 1)
				{
					if (cpos == 0)
						cposc = 1;
					if (cposc > 0)
						cpos = cposc;
					SetLampsByThrottlePos(1);
				}
				else if (kv_pos == 2 and cm)
				{
					if (cm)
					{
						cpos = (vel / 35.0) *24 + 6;
						if (cposc < 6)
							cposc = 6;
						if (cpos > 32)
							cpos = 32;
						if (cposc < cpos)
							++cposc;
						if ((cposc  < 32) and (loco.GetEngineParam("applied-force") < 33000) and (vel < 25))
							tadd = 8.0;
						SetLampsByThrottlePos(2);
					}
				}
				else if (kv_pos == 3)
				{					
					if (cm)
					{
						SetLampsByThrottlePos(3);
						if (cpos < 32)
							cpos = (vel / 35.0) *20 + 6;
						if (cpos >= 32)
							cpos = 32 + (vel - 32)*4 / 33.0;
						if (cpos > 36)
							cpos = 36;
						if (cposc < cpos)
							++cposc;
						if ((cposc  < 36) and (loco.GetEngineParam("applied-force") < 33000) and (vel < 30))
							tadd = 8.0;
					}
				}
				if (kv_pos > 0)
				{
					SetEngineSetting("loco-auto-brake",0, "16");
					SetEngineSetting("dynamic-brake",0, "17");
					float ttl = 0;
					if (vel > 3.0)
						vz1_locked = false;
					if (cposc == 1)
						ttl = 1;
					if (cposc <= 32)
						ttl = 1 + (cposc / 32.0)*3.0;
					else if (cposc > 32)
						ttl = 4 + ((cposc - 32) / 4.0);
					if ((cpos - cposc  >  0) and (cpos - cposc  < 7) )
						ttl = 8;					
					fval = ttl + tadd;
					if (fval < 8)
					{
						if (kv_pos == 2) 		fval = fval * 1.25;
						else if (kv_pos == 3)	fval = fval * 1.5;
					}
					//if(!ars_disables_sch)
					SetThrottleEngingSettings(fval); //, "19");
				}

          		a = (-0.06 - cposc*0.17/18.0) * (vel - (37 - cposc*35/18.0));
          		if (a > 0) a = 0;
				if (kv_pos == -1)
				{
					Sleep(1);
					SetEngineSetting("dynamic-brake",0, "20");
					//SetThrottleEngingSettings(-1); //, "21");
					if (!vz1_locked)
						SetEngineSetting("loco-auto-brake", 0, "22");
					if (cposc == 1 and a < -0.4) a = -0.4;
					add = false;
				}					
				else if (kv_pos == -2)
				{
					if (cm)
					{
						SetEngineSetting("dynamic-brake",4, "23");
						//SetEngineSetting("loco-auto-brake",65, "25");
						SetLampsByThrottlePos(-2);
						if ((a > -1.07) and (!add) and (cposc < 18)) cposc++;
						if (cposc == 1 and a < -1.07)	a = -1.07;
						add = true;
					}
				}
				else if (kv_pos == -3)
				{
					if (cm)
					{
						SetEngineSetting("dynamic-brake",3, "23");
						cpos = 18;
						SetLampsByThrottlePos(-3);
						if (a > -1.07 and cposc < 18) ++cposc;
						if (cposc >17 and a > -0.8)
							SetEngineSetting("loco-auto-brake",100, "25");
					}
				}
				if (kv_pos < 0)
				{
					if ((vel < 1) and (kv_pos < -1) and (cposc > 17))
						vz1_locked = true;
					if (a < -1.2)	a = -1.2;
					else if (a > 0)	a = 0;		 
					//SetThrottleEngingSettings(-a);// , "26");
					SetThrottleEngingSettings(-5);// , "26");
					logv = 1;
					if (loco.GetVelocity() < 0) logv = -1;
					if (!loco.GetDirectionRelativeToTrain()) logv =- logv;
					loco.GetMyTrain().AddVelocity(logv*a*0.05);
				}
          	}
			SetEngineSetting("dynamic-brake",0, "27");
			SetThrottleEngingSettings(0); //, "28");
       	}
		m_controlThread = false;
	}
		
	thread void SpeedThread()
	{
		int currentSpeed = 0;
		int nextSpeed = 0;
		int speedCounter = 0;
		int lsdCounter = 0;				
		while (m_cd.AKB_c)
		{
		// update speedometer
			currentSpeed = GetCurrentSpeed();
			if (nextSpeed != currentSpeed and (speedCounter > 2 or currentSpeed == 0))
			{
				UpdateSpeedIndicators(false);
				speedCounter = 0;
			}
			nextSpeed = GetCurrentSpeed();
			++speedCounter;			
			if (++lsdCounter > 5)
			{
				lsdCounter = 0;
				SetLkt(loco.GetBrakeCylinderPressure() > 0.001200);	
			}			
			Sleep(0.1);
		}
		UpdateSpeedIndicators(true);
		SetLsd(false);
		SetLkt(false);
	}
	
	thread void ArsStartThread()
	{
		if (m_arsStart) return;	
		m_arsStart = true;
		Sleep(0.05);
		SetRk(true);
		Sleep(0.05);
		SetRp(true);
		SetLsn(true);
		Sleep(0.05);
		SetLkvd(true);
		SetLkt(true);
		SetLst(true);
		Sleep(0.05);
		SetLkvc(true);
		Asset asset = GetAsset();
		while (m_arsStart)
		{
			PlaySound("ars.wav");
			Sleep(0.35);
		}
		PlaySound("ars_end.wav");		
		SetLkvd(false);
		Sleep(0.15);
		SetLkvc(false);	
		Sleep(0.20);
		SetRk(false);	
		Sleep(0.30);
		SetRp(false);
		Sleep(0.35);	
		SetLsn(false);	
		Sleep(0.15);
		SetLst(false);
		Sleep(0.05);
		SetLkt(false);					
	}
	
	// updater
	public void Update()
	{
		inherited();
		SetTextureSelfIllumination("k_body01",-0.1,-0.1,-0.15);
		SetTextureSelfIllumination("k_windows01-k_windows01a",-0.1,-0.1,-0.15);	
		if (!m_ReverserThread)
			SetLsdState();
	}
	
	// Change state handlers
	void SalonChanged()
	{
		if (m_cd.salon) m_cd.salon_c = true;
		else
		{
			CyriCabinData ccd = GetOppositeCabinData();
			m_cd.salon_c = (ccd and ccd.salon);
		}
		if (m_cd.AKB_c and m_cd.salon_c)
			PostMessageToVehicles("salon_on");
		else
			PostMessageToVehicles("salon_off");
	}
	
	void VusChanged()
	{
		if (m_cd.AKB_c)
			loco.GetMyTrain().SetHighBeams(m_cd.vus);
	}
	
	void FaryChanged()
	{
		if (!IsLastVehicle())
		{
			if (m_cd.AKB_c and m_cd.fary)
				PostMessageToVehicles("fary_on");
			else
				PostMessageToVehicles("fary_off");
		}
	}
	
	void CabinLightChanged()
	{
		int n;
		if (m_cd.cabinlight and m_cd.AKB_c)
		{
			SetTextureSelfIllumination("k_cab01",0.1,0.1,0.05);
			SetTextureSelfIllumination("k_cab02",0.1,0.1,0.05);
			SetTextureSelfIllumination("k_cab04",0.1,0.1,0.05);
			for(n=0; n < 140; n++)
				SetFXTextureReplacement("k_cab01-"+n,m_textures,1);
			for(n=0; n < 5; n++)
			{
				SetFXTextureReplacement("k_cab02-"+n,m_textures,2);
				SetFXTextureReplacement("k_cab04-"+n,m_textures,4);
			}
		}
		else
		{
			SetTextureSelfIllumination("k_cab01",-0.1,-0.1,-0.15);
			SetTextureSelfIllumination("k_cab02",-0.1,-0.1,-0.15);
			SetTextureSelfIllumination("k_cab04",-0.1,-0.1,-0.15);
			for(n=0; n < 140; n++)
				SetFXTextureReplacement("k_cab01-"+n,null,0);
			
			for(n=0; n < 5; n++)
			{
				SetFXTextureReplacement("k_cab02-"+n,null,0);
				SetFXTextureReplacement("k_cab04-"+n, null, 0);
			}
		}
	}
	
	void PultLightChanged()
	{
		int n;
		if (m_cd.pultlight and m_cd.AKB_c)
		{
			SetMeshVisible("priblights", true, 0);
			SetTextureSelfIllumination("k_cab03",0.1,0.1,0.1);
			for(n=0; n < 7; n++) SetFXTextureReplacement("k_cab03-"+n,m_textures,3);
		}
		else
		{
			SetMeshVisible("priblights", false, 0);
			SetTextureSelfIllumination("k_cab03",-0.15,-0.15,-0.2);
			for(n=0; n < 7; n++) SetFXTextureReplacement("k_cab03-"+n,null,0);
		}
	
	}
	
	void KvtPressed()
	{
		if (m_arsStopping and GetThrottlePosition() <= 0)
		{
			int speed = GetCurrentSpeed();
			if (speed < m_speedLimit)
				m_arsStopping = false;
			return;
		}
		if (m_arsStart)
		{
			m_arsStart = false;
			Als_Thread();
		}
	}
	
	void ArsChanged(bool restore)
	{
		if (m_cd.ars) m_cd.ars_c = true;
		else if (IsLastVehicle())
		{
			CyriCabinData ccd = GetOppositeCabinData();
			m_cd.ars_c = (ccd and ccd.ars);
		}
		else 
		{
			m_cd.ars_c = false;
		}
		bool enabled = m_cd.AKB_c and m_cd.ars_c and m_cd.rc1;
		SetLampArs(enabled);
		m_arsStopping = false;
		if (enabled)
		{
			if (m_cd.ars) 
			{
				if (!(restore or m_simpleMode))	ArsStartThread();
				//Als_Thread();
			}
			else m_arsStart = false;
		}
		else
		{
			m_arsStart = false;			
		}
	}
	
	void AlsChanged()
	{				
		if (m_cd.als) m_cd.als_c = true;
		else if (IsLastVehicle())
		{
			CyriCabinData ccd = GetOppositeCabinData();
			m_cd.als_c = (ccd and ccd.als);
		}
		else 
		{
			m_cd.als_c = false;
		}
		
		if (!(m_cd.AKB_c and m_cd.als_c)) InitLampsAls();
		else							  Als_Thread();
	}
	
	void BpsnChanged()
	{
		if (m_cd.bpsn) m_cd.bpsn_c = true;
		else
		{
			if (IsLastVehicle())
			{
				CyriCabinData ccd = GetOppositeCabinData();
				m_cd.bpsn_c = (ccd and ccd.bpsn);
			}
			else m_cd.bpsn_c = false;
		}
		
		SetWorkMode();
//Print("BpsnChanged:"+m_cd.AKB_c);
		if (m_cd.bpsn_c)
		{
			RealisticModeThread();
			if (m_cd.AKB_c) PostMessageToVehicles("BPSN_on");				
		}
		else
		{
			PostMessageToVehicles("BPSN_off");
		}
		FaryChanged();
		SalonChanged();
	}
	
	void MotCompChanged()
	{
		if (m_cd.mot_comp) m_cd.mot_comp_c = true;
		else
		{
			if (IsLastVehicle())
			{
				CyriCabinData ccd = GetOppositeCabinData();
				m_cd.mot_comp_c = (ccd and ccd.mot_comp);
			}
			else m_cd.mot_comp_c = false;
		}
		SetWorkMode();
		if (m_cd.mot_comp_c) RealisticModeThread();
		if (m_cd.AKB_c and m_cd.mot_comp_c and m_cd.compressor)		
		{
			PostMessageToVehicles("MK_on");
		}
		else 
		{
			PostMessageToVehicles("MK_off");
			if (m_cd.compressor) 
				GetNamedControl("bb-rezkomp").SetValue(0);
		}
	}
	
	void Rc1Changed()
	{
	}
	
	void BatteryChanged(bool restore)
	{
		bool electro = m_cd.AKB_c;
		if (m_cd.AKB) m_cd.AKB_c = true;
		else
		{
			if (IsLastVehicle())
			{
				CyriCabinData ccd = GetOppositeCabinData();
				m_cd.AKB_c = (ccd and ccd.AKB);
//Print("BatteryChanged:m_cd.AKB_c ="+m_cd.AKB_c);
			}
			else m_cd.AKB_c = false;			
		}
		SetDoorsLamps();
//Print("BatteryChanged:"+m_cd.AKB+",restore="+restore);
		SetWorkMode();		
		if (!restore)
		{
//Print("BatteryChanged:"+m_cd.AKB);
			ArsChanged(false);
			AlsChanged();
			PultLightChanged();
			CabinLightChanged();
			BpsnChanged();
			MotCompChanged();
		}		
		if (electro != m_cd.AKB_c or restore)
		{
			if (m_cd.AKB_c)
			{
				PostMessageToVehicles("electro_on");
				InitSpeedControls();
				SpeedThread();								
				RealisticModeThread();
			}
			else			
			{
				InitLamps();
				PostMessageToVehicles("electro_off");
			}
		}
		if (m_cd.AKB_c)
			ReverserThread();
	}
	
	void  SetPowerOn()
	{
	//Print("SetPowerOn");
		if (!m_cd.AKB)
		{
			GetNamedControl("battery").SetValue(1);
			m_cd.AKB = true;
			BatteryChanged(true);
		}
		if (!m_cd.salon)
		{
			m_cd.salon = true;
			GetNamedControl("ts-salon").SetValue(1);
			SalonChanged();
		}
		if (!m_cd.fary)
		{
			m_cd.fary = true;
			GetNamedControl("ts-fary").SetValue(1);
			FaryChanged();		
		}
		if (!m_cd.pultlight)
		{
			m_cd.pultlight = true;
			GetNamedControl("ts-pult").SetValue(1);
			PultLightChanged();
		}
		if (!m_cd.cabinlight)
		{
			m_cd.cabinlight = true;
			GetNamedControl("ts-cabin").SetValue(1);
			CabinLightChanged();
		}
		if (!m_cd.bpsn)
		{
			m_cd.bpsn = true;
			GetNamedControl("ts-bp").SetValue(1);
			BpsnChanged();
		}
		if (!m_cd.als)
		{
			m_cd.als = true;
			GetNamedControl("ts-als").SetValue(1);
			AlsChanged();		
		}
		if (!m_cd.ars)
		{
			m_cd.ars = true;
			GetNamedControl("ts-ars").SetValue(1);
			ArsChanged(m_simpleMode);
		}
		GetNamedControl("reverser_lever").SetValue(Train.TRACTION_FORWARD);
		loco.SetEngineSetting("reverser", Train.TRACTION_FORWARD);
	}
		
	void  SetPowerOff(bool all)
	{
	//Print("SetPowerOff:all="+all);
		if (all)
		{
			if (m_cd.AKB)
			{
				GetNamedControl("battery").SetValue(0);
				m_cd.AKB = false;
				BatteryChanged(true);
			}
			if (m_cd.salon)
			{
				m_cd.salon = false;
				GetNamedControl("ts-salon").SetValue(0);
				SalonChanged();
			}
			if (m_cd.fary)
			{
				m_cd.fary = false;
				GetNamedControl("ts-fary").SetValue(0);
				FaryChanged();		
			}
			if (m_cd.pultlight)
			{
				m_cd.pultlight = false;
				GetNamedControl("ts-pult").SetValue(0);
				PultLightChanged();
			}
		}
		if (m_cd.cabinlight)
		{
			m_cd.cabinlight = false;
			GetNamedControl("ts-cabin").SetValue(0);
			CabinLightChanged();
		}
		if (m_cd.bpsn)
		{
			m_cd.bpsn = false;
			GetNamedControl("ts-bp").SetValue(0);
			BpsnChanged();
		}
		if (m_cd.als)
		{
			m_cd.als = false;
			GetNamedControl("ts-als").SetValue(0);
			AlsChanged();		
		}
		if (m_cd.ars)
		{
			m_cd.ars = false;
			GetNamedControl("ts-ars").SetValue(0);
			ArsChanged(true);
		}
		GetNamedControl("reverser_lever").SetValue(Train.TRACTION_NEUTRAL);
		loco.SetEngineSetting("reverser", Train.TRACTION_NEUTRAL);
	}
		
	void  SetTrainPowerState(bool powerOn)
	{
		if (loco.GetMyTrain().GetTrainVelocity()) return;
		if (powerOn) SetPowerOn();
		else		 SetPowerOff(true);
	}

	//For Scenarios
	void PostBroarcastTrainMessage(string minor) 
	{
		loco.GetMyTrain().PostMessage(null, "Cab", minor, 0.2);
	}

	void DoorsControl(bool open, bool left)
	{
		if (open)
		{		
			if (left and !m_cd.doors_left_opened)
			{
				PostMessageToVehicles("Open_left");
				PostBroarcastTrainMessage("OpenDoorsLeft");
				m_cd.doors_left_opened = true;
				SetLsd(false);
			}
			if (!left and !m_cd.doors_right_opened)
			{
				PostMessageToVehicles("Open_right");
				PostBroarcastTrainMessage("OpenDoorsRight");
				m_cd.doors_right_opened = true;
				SetLsd(false);
			}
		}
		else
		{				
			if (m_cd.doors_left_opened or m_cd.doors_right_opened)
			{
				PostMessageToVehicles("Close");
				PostBroarcastTrainMessage("CloseDoors");
				m_cd.doors_left_opened = m_cd.doors_right_opened = false;
				SetLsd(true);
			}
		}
		SyncDoorsState();
		SetDoorsLamps();
	}

	void SyncState()
	{
//Print("SyncState");
		if (!IsLastVehicle()) return;
		BatteryChanged(true);
		AlsChanged();
		ArsChanged(true);
		BpsnChanged();
		MotCompChanged();
		SalonChanged();
	}
	
	void SyncDoorsState()
	{
		CyriCabinData ccd = GetOppositeCabinData();
		if (ccd)
		{
			m_cd.doors_left_opened  = ccd.doors_right_opened;
			m_cd.doors_right_opened = ccd.doors_left_opened;
		}
	}
	
	void SetThrottle(int n)
	{		
		loco.SetEngineSetting("throttle", m_throttleEngineValue);
		bool  changed = false;
		float value = m_throttle.GetValue();
		if (n > 0)
		{
			if (value < KB_X3)
			{
				changed = true;
				value = value + 1;
				if (value > KB_X3) value = KB_X3;
			}
		}
		else if (n < 0)
		{
			if (value > KB_T2) 
			{
				changed = true;
				value = value - 1;
				if (value < KB_T2) value = KB_T2;
			}
		}
		else if (value != KB_0)
		{
			changed = true;
			value = KB_0;
		}		
		if (changed)
		{		
			m_throttle.SetValue(value);
			PlaySound("kontroler.wav");
		}
	}
	
	void  SetSimpleMode(bool value)
	{		
		if (m_simpleMode == value) return;
		m_simpleMode = value;
		SetWorkMode();
		if (value)
		{
			SimpleModeThread();
		}
		else
		{
			PostMessage(null, "DriverMode", "Realistic", 0.2);
			PostMessageToVehicles("simple_off");
			RealisticModeThread();
			BrakeSounderThread();
			CompressorThread();
		}
	}
	
	public void UserSetControl(CabinControl p_control, float p_value)
	{ 
		if (m_simpleMode) SetSimpleMode(false);		
		string name = p_control.GetName();
		
	//Print("UserSetControl:"+name+":"+p_value);
	
		if (name == "kontroler") //контроллер
		{
			PlaySound("kontroler.wav");
			m_cd.kb = p_value;
		}
		else if (name == "reverser_lever") //реверсер
		{
			PlaySound("revers_1.wav");
			SetEngineSetting("reverser", p_value, "0");
		}
		else if (name == "trainbrake_lever") //тормоз
		{
			PlaySound("kran013.wav");
			SetEngineSetting("train-auto-brake", p_value, "0");
		}
		else if (name == "ts-ars") //тумблер "АРС"
		{
			PlaySound("tumbler02.wav");
			m_cd.ars = (p_value > 0.5);
			ArsChanged(false);
		}
		else if (name == "ts-als") //тумблер "АЛС"
		{
			PlaySound("tumbler02.wav");
			m_cd.als = (p_value > 0.5);
			AlsChanged();
		}
		else if (name == "br-kvt") //кнопка КВТ (кнопка восприятия торможения)
		{
			PlaySound("button01.wav");
			//m_arsStart = false;
			KvtPressed();
		}
		else if (name == "ts-pult") //тумблер "ОСВЕЩЕНИЕ ПУЛЬТА"
		{
			PlaySound("tumbler02.wav");
			m_cd.pultlight = (p_value > 0.5);
			PultLightChanged();
		}
		else if (name == "ts-cabin") //тумблер "ОСВЕЩЕНИЕ КАБИНЫ"
		{
			PlaySound("tumbler02.wav");
			m_cd.cabinlight = (p_value > 0.5);
			CabinLightChanged();
		}
		else if (name == "b-cldoor") //тумблер "ЗАКРЫТИЕ ДВЕРЕЙ"
		{
			PlaySound("tumbler02.wav");
			m_cd.blk_doors = (p_value < 0.5);
			if (m_cd.AKB_c and m_cd.blk_doors)
				DoorsControl(/*open=*/false, /*left=*/false);
			else
				SetDoorsLamps();
		}
		else if (name == "ts-lrdoor") //тумблер "ПРАВЫЕ/ЛЕВЫЕ" двери
		{
			PlaySound("tumbler02.wav");
			m_cd.ts_lr_doors = (p_value > 0.5);
			SetDoorsLamps();
		}
		else if (name == "bb-ldoorr" or name == "bb-ldoor") //кнопка "ОТКРЫТЬ ЛЕВЫЕ ДВЕРИ"
		{
//	Print("Open left:m_cd.blk_doors="+m_cd.blk_doors+",m_cd.ts_lr_doors="+m_cd.ts_lr_doors);
			PlaySound("button01.wav");
			if (m_cd.AKB_c and !m_cd.blk_doors and !m_cd.ts_lr_doors and !IsReverserNeutral())
			{
				if ((name == "bb-ldoorr" and m_cd.kryshka_lr) or (name == "bb-ldoor" and m_cd.kryshka_l))
					DoorsControl(/*open=*/true, /*left=*/true);
			}
		}
		else if (name == "bb-rdoor") //кнопка "ОТКРЫТЬ ПРАВЫЕ ДВЕРИ"
		{
			PlaySound("button01.wav");
//	Print("Open right:m_cd.blk_doors="+m_cd.blk_doors+",m_cd.ts_lr_doors="+m_cd.ts_lr_doors);
			if (m_cd.AKB_c and !m_cd.blk_doors and m_cd.kryshka_r and m_cd.ts_lr_doors and !IsReverserNeutral())
			{
				DoorsControl(/*open=*/true, /*left=*/false);
			}			
		}
		else if (name == "bb-rezclosedoor") //кнопка "РЕЗЕРВНОЕ ЗАКРЫТИЕ ДВЕРЕЙ"
		{
			PlaySound("button01.wav");
			if (m_cd.AKB_c and !IsReverserNeutral())
			{
//	Print("Close reserv:m_cd.blk_doors="+m_cd.blk_doors+",m_cd.ts_lr_doors="+m_cd.ts_lr_doors);
				DoorsControl(/*open=*/false, /*left=*/false);
			}
		}
		else if (name == "kryshka-l")     m_cd.kryshka_l  = (p_value > 0.5);
		else if (name == "kryshka-lr")    m_cd.kryshka_lr = (p_value > 0.5);
		else if (name == "kryshka-r")     m_cd.kryshka_r  = (p_value > 0.5);
		else if (name == "ts-bp")
		{
			PlaySound("tumbler02.wav");
			m_cd.bpsn = (p_value > 0.5);
			BpsnChanged();
		}
		else if (name == "ts-vklmotkomp") 
		{
			PlaySound("tumbler02.wav");
			m_cd.mot_comp = (p_value > 0.5);
			MotCompChanged();
		}
		else if (name == "bb-rezkomp")
		{
			PlaySound("tumbler02.wav");
			m_cd.compressor = (p_value > 0.5);
			MotCompChanged();
		}
		else if (name == "rc-1")
		{
			PlaySound("ruchbatt.wav");
			m_cd.rc1 = (p_value > 0.5);
			Rc1Changed();
		}
		else if (name == "bb-zvonok")
		{
			if (m_cd.AKB_c) loco.GetMyTrain().SoundHorn();
		}
		else if (name == "battery") //тумблер "БАТАРЕИ"
		{
			PlaySound("ruchbatt.wav");
			m_cd.AKB = (p_value > 0.5);
			BatteryChanged(false);
		}
		else if (name == "ts-fary")
		{
			PlaySound("tumbler02.wav");
			m_cd.fary = (p_value > 0.5);
			FaryChanged();
		}
		else if (name == "ts-vus")
		{
			PlaySound("tumbler02.wav");
			m_cd.vus = (p_value > 0.5);
			VusChanged();		
		}
		else if (name == "ts-salon")
		{
			PlaySound("tumbler02.wav");
			m_cd.salon = (p_value > 0.5);
			SalonChanged();
		}
		// ...........
		else inherited(p_control, p_value);
	}

	void OpenDoorsByCommand(bool right)
	{
		//Print("OpenDoorsByCommand:right="+right);

		if (!m_cd.AKB or IsReverserNeutral()) return;
		if (m_cd.blk_doors)
		{
			m_cd.blk_doors = false;
			GetNamedControl("b-cldoor").SetValue(1);
		}
		if (right)
		{
			if (!m_cd.ts_lr_doors) 
			{
				GetNamedControl("ts-lrdoor").SetValue(1);
				m_cd.ts_lr_doors = true;
			}
			if (m_cd.kryshka_l) 
			{
				GetNamedControl("kryshka-l").SetValue(0);
				m_cd.kryshka_l = false;
			}
			if (m_cd.kryshka_lr) 
			{
				GetNamedControl("kryshka-lr").SetValue(0);
				m_cd.kryshka_lr = false;
			}
			if (!m_cd.kryshka_r)
			{
				GetNamedControl("kryshka-r").SetValue(1);
				m_cd.kryshka_r = true;
			}
		}
		else 
		{
			if (m_cd.ts_lr_doors) 
			{
				GetNamedControl("ts-lrdoor").SetValue(0);
				m_cd.ts_lr_doors = false;
			}
			if (m_cd.kryshka_r)
			{
				GetNamedControl("kryshka-r").SetValue(0);
				m_cd.kryshka_r = false;
			}
			if (!m_cd.kryshka_l) 
			{
				GetNamedControl("kryshka-l").SetValue(1);
				m_cd.kryshka_l = true;
			}
		}
		DoorsControl(/*open=*/true, /*left=*/!right);	
	}
	
	void CloseDoorsByCommand() 
	{
		//Print("CloseDoorsByCommand");

		if (!m_cd.AKB or IsReverserNeutral()) return;
		if (!m_cd.blk_doors)
		{
			m_cd.blk_doors = true;
			GetNamedControl("b-cldoor").SetValue(0);
		}
		if (m_cd.ts_lr_doors) 
		{
			GetNamedControl("ts-lrdoor").SetValue(0);
			m_cd.ts_lr_doors = false;
		}
		if (m_cd.kryshka_l)
		{
			GetNamedControl("kryshka-l").SetValue(0);
			m_cd.kryshka_l = false;
		}
		if (m_cd.kryshka_r)
		{
			GetNamedControl("kryshka-r").SetValue(0);
			m_cd.kryshka_r = false;
		}
		if (m_cd.kryshka_lr)
		{
			GetNamedControl("kryshka-lr").SetValue(0);
			m_cd.kryshka_lr = false;
		}
		DoorsControl(/*open=*/false, /*left=*/false);
	}

	void DoorsControlByPressKey(bool right)
	{
		//Print("DoorsControlByPressKey:right="+right+",cd.doorright_open="+m_cd.doors_right_opened+",cd.doorleft_open="+m_cd.doors_left_opened);
		if ((right and m_cd.doors_right_opened) or (!right and m_cd.doors_left_opened))
			CloseDoorsByCommand();
		else 
			OpenDoorsByCommand(right);
	}

	void UserPressKey(string s)
	{		
		if (m_simpleMode) SetSimpleMode(false);
		
	//Print("UserPressKey:"+s);
		// m_throttle		
		if (s == "train_cabin_throttle_up")			SetThrottle(1); //W
		else if (s == "train_cabin_throttle_0")		SetThrottle(0); //S
		else if (s == "train_cabin_throttle_down") 	SetThrottle(-1);//X
		else if (s == "train_cabin_engine_on")		SetTrainPowerState(true);  //Alt+[
		else if (s == "train_cabin_engine_off")		SetTrainPowerState(false); //Alt+]
		//else if (s == "train_cabin_wipers_on");  //Alt+,
		//else if (s == "train_cabin_wipers_off"); //Alt+.
		else if (s == "train_cabin_aws_reset")		KvtPressed();  //Alt+space
		else if (s == "train_cabin_hardware_0")		DoorsControlByPressKey(false); //Alt+;
		else if (s == "train_cabin_hardware_1")		DoorsControlByPressKey(true);  //Alt+'
		else inherited(s);		
	}
	
	void  SetHeadlightData()
	{
		if (!m_simpleMode) return;
		Train train = loco.GetMyTrain();
		int revState = loco.GetEngineSetting("reverser");
		bool headlight = train.GetHeadlightState();
		if (headlight)
		{
			if (!m_cd.AKB or revState == Train.TRACTION_NEUTRAL) SetPowerOn();
		}
		else if (revState != Train.TRACTION_NEUTRAL)
		{
			SetPowerOff(true);
		}
		m_cd.fary = m_cd.fary or headlight;
		m_cd.vus = train.GetHighBeams();
		if (m_cd.fary) 	GetNamedControl("ts-fary").SetValue(1);
		else			GetNamedControl("ts-fary").SetValue(0);
		if (m_cd.vus)  	GetNamedControl("ts-vus").SetValue(1);
		else			GetNamedControl("ts-vus").SetValue(0);
		if (headlight)			
		{
			GetNamedControl("reverser_lever").SetValue(Train.TRACTION_FORWARD);
			loco.SetEngineSetting("reverser", Train.TRACTION_FORWARD);
		}
	}
	
	void  ApplyCD()
	{
		if (m_cd.AKB)
		{
			GetNamedControl("battery").SetValue(1);
			BatteryChanged(true);
		}
		else
		{
			CabinLightChanged();
			PultLightChanged();
		}
		if (m_cd.ars)
		{
			GetNamedControl("ts-ars").SetValue(1);
			ArsChanged(true);
		}
		if (m_cd.als)
		{
			GetNamedControl("ts-als").SetValue(1);
			AlsChanged();
		}
		if (m_cd.pultlight)
		{
			GetNamedControl("ts-pult").SetValue(1);
			PultLightChanged();
		}
		if (m_cd.cabinlight)
		{
			GetNamedControl("ts-cabin").SetValue(1);
			CabinLightChanged();
		}
		SetHeadlightData();
		if (!m_cd.blk_doors)	GetNamedControl("b-cldoor").SetValue(1);
		if (m_cd.ts_lr_doors)	GetNamedControl("ts-lrdoor").SetValue(1);
		if (m_cd.kryshka_l)  	GetNamedControl("kryshka-l").SetValue(1);
		if (m_cd.kryshka_lr) 	GetNamedControl("kryshka-lr").SetValue(1);
		if (m_cd.kryshka_r) 	GetNamedControl("kryshka-r").SetValue(1);
		if (m_cd.bpsn)			GetNamedControl("ts-bp").SetValue(1);
		if (m_cd.mot_comp)		GetNamedControl("ts-vklmotkomp").SetValue(1);
		if (m_cd.compressor) 	GetNamedControl("bb-rezkomp").SetValue(1);
		if (m_cd.rc1) 			GetNamedControl("rc-1").SetValue(1);
		if (m_cd.salon)			GetNamedControl("ts-salon").SetValue(1);
		m_throttle.SetValue(m_cd.kb);
	}
	
	void SetTrainEventHandlers() 
	{
		Train train = loco.GetMyTrain();		
		Sniff(train,"Train","NotifyHeadlights",true);
		Sniff(train,"Train","NotifyBell",true);
		Sniff(train,"Train","NotifyPantographs",true);
		Sniff(train,"Train","StartedMoving",true);		
		Sniff(train, "HorLift", null, true);
		//Sniff(train,"Train","",true);
		AddHandler(me, "Train", null, "OnMessageFromTrain");	
		AddHandler(me, "HorLift", null, "OnMessageFromTrain");	
	}
	
    public void Attach(GameObject obj)
    {
		inherited(obj);
	//Speed
		UpdateSpeedIndicators(true);
	// Lamps
		InitLamps();
	// Cabin Sway
		Vehicle vehicle = cast<Vehicle> obj;
		vehicle.SetRollBasedOnTrack(0.07);
		vehicle.SetCabinSwayAmount(40.0);
	// cabin Data
		CabinData cd = loco.GetCabinData();
		if (cd and cd.isclass(CyriCabinData))
		{
			m_cd = cast<CyriCabinData>(cd);
		}
		else
		{
			m_cd = new CyriCabinData();
			loco.SetCabinData(m_cd);
			CabinLightChanged();
			PultLightChanged();
		}		
		InitLampsAls();
		SyncState();
		SyncDoorsState();
		ApplyCD();
		SetSimpleMode((cast<CyriScriptSecondary>(loco)).IsSimpleMode());
		if (loco.GetMyTrain().GetTrainVelocity()) DetectAutopilotThread();
		m_throttleEngineValue = loco.GetEngineSetting("throttle");
		SetTrainEventHandlers();
		ReverserThread();
	}
		
	void OnHeadlights()
	{	
//Print("OnHeadlights");
		SetHeadlightData();
		if (m_simpleMode) 
		{
			if (!(cast<CyriScriptSecondary>(loco)).IsElectroOn())
				loco.GetMyTrain().SetHeadlightState(false);
		}		
		else if (!m_cd.AKB_c or !m_cd.fary or loco.GetEngineSetting("reverser") != Train.TRACTION_FORWARD)
		{
			loco.GetMyTrain().SetHeadlightState(false);
		}
	}
	
	void OnBell()
	{
		if (!loco) return;
		CyriScriptSecondary v = cast<CyriScriptSecondary>(loco);
		if (v and v.IsSimpleMode())
		{
			if (v.IsElectroOn())
				PostMessageToVehicles("electro_off");
			else
				PostMessageToVehicles("electro_on");
		}
		//World.PlaySound(GetAsset(),"sound/shortgudok.wav",1.0f,2,40,loco,"a.cabfront");
	}
	
	void OnPantographs()
	{
		Train train = loco.GetMyTrain();
		if (train.GetTrainVelocity()) return;
		bool state = train.GetPantographState();
		if (state == 1 or state == 2)
			PostMessageToVehicles("driver_off");
		else
			PostMessageToVehicles("driver_on");
	}
	void OnCtrlMessage(Message msg) 
	{
//Print("OnCtrlMessage:"+msg.minor);	
		string[] tokens = Str.Tokens(msg.minor, "^");		
		string cmd = tokens[0];
		Str.ToUpper(cmd);		
		if (cmd == "CloseDoors") CloseDoorsByCommand();
		else if (cmd == "OpenDoors") {
			if (tokens.size() < 2) return;
			cmd = tokens[1];
			Str.ToUpper(cmd);
			if (cmd == "left") 		 OpenDoorsByCommand(false);
			else if (cmd == "right") OpenDoorsByCommand(true);
		}
	}
	
	void OnMessageFromTrain(Message msg)
	{
	//Print("OnMessageFromTrain:"+msg.minor);	
		string cmd = msg.minor;
		if (cmd == "NotifyHeadlights") OnHeadlights();
		else if (cmd == "NotifyBell")  OnBell();
		else if (cmd == "NotifyPantographs") OnPantographs();
		else if (cmd == "StartedMoving") DetectAutopilotThread();
		else if (cmd == "HorLiftDoorsOpened") m_HorLiftDoorsOpened = true;
		else if (cmd == "HorLiftDoorsClosed") m_HorLiftDoorsOpened = false;
	}
	
	void OnDriverMode(Message msg) 
	{
		SetSimpleMode(msg.minor == "DCC");
	}
	
	void OnDriverModule(Message msg)
	{
		SetSimpleMode(true);
		AddHandler(me, "DriveMode", null, "OnDriverMode");
	}
	
	// constructor
	public void Init(void) 
	{
		inherited();	
		m_throttle = GetNamedControl("kontroler");
		m_textures = GetAsset().FindAsset("textures");	
		AddHandler(me, "DriverModule", "DCC-Panel-Created", "OnDriverModule");
		AddHandler(me, "CTRL", null, "OnCtrlMessage");
	}	
};
