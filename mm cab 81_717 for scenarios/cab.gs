include "defaultlocomotivecabin.gs"
include "locomotive.gs"
include "trainz.gs"
include "gs.gs"
include "common.gs"
include "world.gs"
include "vehicle.gs"
include "train.gs"

class MyCabinData isclass CabinData
{
    public bool m_simpleMode = true;

    public float kb;                 // Показания крана машиниста (тормозное давление)
    public float trainbrake_lever;   // Положение ручки тормоза поезда

    public bool doorleft_open;       // Левая дверь открыта
    public bool doorright_open;      // Правая дверь открыта
    public bool doors_locked = true; // Состояние "двери заблокированы"

    public bool left_right;          // Направление: true — вправо, false — влево
    public bool svet_kabina;         // Освещение кабины
    public bool rabota;              // Режим "Работа"
    public bool BPSN;                // БПСН (блок питания сети)
    public bool motor_compr;         // Мотор-компрессор
    public bool ars_sig;             // Сигнал АРС
    public bool als_sig;             // Сигнал АЛС
    public bool kvc_automat;         // Автомат КВЦ
    public bool avar_svet_a49;       // Аварийное освещение А49
    public bool AKB;                 // Аккумуляторная батарея (включена/отключена)
    public bool rc_1 = true;         // Реле цепей РЦ-1
    public bool avar_svet;           // Аварийное освещение
    public bool fary;                // Фары
    public bool vus;                 // ВУС (выключатель управления светом)
    public bool krishka_1;           // Крышка 1 (например, крышка аппаратного шкафа)
    public bool krishka_2;           // Крышка 2

    public Soup other;               // Дополнительные данные
};

class Cab isclass DefaultLocomotiveCabin 
{
	define int ALS_0  = 0;
	define int ALS_OC = 1;
	define int ALS_AO = 2;
	define int ALS_40 = 4;
	define int ALS_60 = 6;
	define int ALS_70 = 7;
	define int ALS_80 = 8;

	//kontroller
	define float KB_X3  = 3.6;
	define float KB_X2  = 2.4;
	define float KB_X1  = 1.2;
	define float KB_0   = 0.0;
	define float KB_T1  = -1.2;
	define float KB_T1a = -2.4;
	define float KB_T2  = -3.6;

	thread void Als_Thread();
	thread void ArsStartThread();
	Asset myasset;
	Asset textures;
	float m_throttleEngineValue;		

	float ov = 0.0;
	float dt;
	int kv_pos = 0;
	int kv_pos_old = 0;

	int cpos = 0;
	int cposc = 0;
	bool cm = false;

	bool m_ALSG = false;

	bool m_simpleModeThread;

	bool m_lsd, m_rk, m_rp, m_lsn, m_ln, m_lkvc, m_lkvd, m_lvd, m_lkt, m_lst;
	// Индикаторы различных ламп/сигналов:
	// m_lsd  — лампа "Двери закрыты"
	// m_rk   — реле контроля
	// m_rp   — реле питания
	// m_lsn  — лампа "СН"
	// m_ln   — лампа "Н"
	// m_lkvc — лампа КВЦ
	// m_lkvd — лампа КВД
	// m_lvd  — лампа ВД
	// m_lkt  — лампа КТ
	// m_lst  — лампа СТ

	bool m_arsOch, m_ars0, m_ars4, m_ars6, m_ars7, m_ars8, m_rs;
	// Сигналы АРС по частотам:
	// m_arsOch — отключение АРС
	// m_ars0   — код 0
	// m_ars4   — код 4
	// m_ars6   — код 6
	// m_ars7   — код 7
	// m_ars8   — код 8
	// m_rs     — разрешающий сигнал

	bool m_SpeedThread;

	bool m_arsStart;      // АРС: начало движения
	bool m_arsStopping;   // АРС: режим торможения

	bool m_passedRed;     // Проезд красного сигнала

	int  m_speedLimit;    // Ограничение скорости

	bool m_HorLiftDoorsOpened; // Горизонтальные лифтовые двери открыты

	bool kb_works = false; // Кран машиниста работает (есть управление тормозами)

	bool m_doorLapsInit;  // Инициализация фиксации дверных замков

	bool ars_disables_sch = false; // АРС отключает силовую цепь (размыкает контактор)

	MyCabinData cd = null;
	CabinControl throttle_lever2;
	Signal m_nextSignal;
	
	void SetHeadlightData();
	void PostMessageToMyTrain(string minor);
	void BatteryChanged(bool restore);
	void SetPowerOn();
	void SetPowerOff();
	void SetSimpleMode(bool value);
	void UpdateLightsState();
	void SetLampsOnThrottleDown();
	void SetLampsOnThrottleUp();
	void SetLampsByThrottlePos(int pos);
	void SetBrakeLight(int throttlePos);
	void OpenDoors(bool right);
	void CloseDoors();
	thread void SimpleModeThread();
	
	void Print(string s) {
		Interface.Print(loco.GetName()+":"+s);
	}
	
	void SetFirstLoco() {
		Train train = loco.GetMyTrain();
		if (loco != train.GetFrontmostLocomotive())
			train.Turnaround();							
	}
	
	void PlaySound(string sound)
	{
		World.PlaySound(myasset, "sound/" + sound, 1.0f, 3, 10, loco, "a.cabfront");
	}
	
	void SetControlsState() {
		if (cd.left_right) 		GetNamedControl("left_right").SetValue(1);
		else					GetNamedControl("left_right").SetValue(0);
		if (cd.krishka_1)		GetNamedControl("krishka_1").SetValue(1);
		else					GetNamedControl("krishka_1").SetValue(0);
		if (cd.krishka_2)		GetNamedControl("krishka_2").SetValue(1);
		else					GetNamedControl("krishka_2").SetValue(0);
		if (cd.kvc_automat) 	GetNamedControl("a53").SetValue(1);
		else					GetNamedControl("a53").SetValue(0);
		if (cd.avar_svet_a49)	GetNamedControl("a49").SetValue(1);
		else					GetNamedControl("a49").SetValue(0);
		if (cd.rc_1) 			GetNamedControl("rc_1").SetValue(1);
		else					GetNamedControl("rc_1").SetValue(0);
		if (cd.BPSN) 			GetNamedControl("bp").SetValue(1);
		else					GetNamedControl("bp").SetValue(0);
		if (cd.motor_compr) 	GetNamedControl("mk").SetValue(1);
		else					GetNamedControl("mk").SetValue(0);
		if (cd.als_sig) 		GetNamedControl("als").SetValue(1);
		else					GetNamedControl("als").SetValue(0);
		if (cd.ars_sig) 		GetNamedControl("ars").SetValue(1);
		else					GetNamedControl("ars").SetValue(0);
		if (cd.avar_svet) 		GetNamedControl("avar_osv").SetValue(1);
		else					GetNamedControl("avar_osv").SetValue(0);
		if (!cd.doors_locked) 	GetNamedControl("zakr_dver").SetValue(1);
		else					GetNamedControl("zakr_dver").SetValue(0);
		if (cd.svet_kabina) 	GetNamedControl("osv_kabiny").SetValue(1);
		else					GetNamedControl("osv_kabiny").SetValue(0);
		if (cd.AKB) 			GetNamedControl("batarei").SetValue(1);	
		else					GetNamedControl("batarei").SetValue(0);
		if (cd.fary)			GetNamedControl("fari").SetValue(1);
		else					GetNamedControl("fari").SetValue(0);
		if (cd.vus)				GetNamedControl("vus").SetValue(1);
		else					GetNamedControl("vus").SetValue(0);
	}
	
	void SetOpenDoorsLamps() {
		if (m_doorLapsInit) return;
		
		bool left_y, right_y;
		
		if (!cd.AKB or cd.doors_locked or loco.GetEngineSetting("reverser") == Train.TRACTION_NEUTRAL) {
			left_y = right_y = false;
		}
		else {
			right_y = cd.left_right;
			left_y = !right_y;
		}
		
		SetMeshVisible("otkr_dver1", !left_y, 0);
		SetMeshVisible("otkr_dver2", !left_y, 0);
		SetMeshVisible("otkr_dver3", !right_y, 0);
		SetMeshVisible("otkr_dver1_y", left_y, 0);
		SetMeshVisible("otkr_dver2_y", left_y, 0);
		SetMeshVisible("otkr_dver3_y", right_y, 0);
	}
	
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
	
	bool IsAlsWorks()
	{
		return (cd and cd.AKB and cd.als_sig);
	}
	
	// ARS
	public void SetArsOch(bool state) 
	{
		if (m_arsOch != state)
		{
			if (state and IsAlsWorks())
				SetMeshVisible("lamp_04", true, 0.3);
			else
				SetMeshVisible("lamp_04", false, 0.3);
			m_arsOch = state;
		}
	}
	// ----	
	public void SetArs0(bool state) 
	{
		if (m_ars0 != state)
		{
			if (state and IsAlsWorks())
				SetMeshVisible("lamp_0", true, 0.3);
			else
				SetMeshVisible("lamp_0", false, 0.3);
			m_ars0 = state;
		}
	}	
	// ----	
	public void SetArs4(bool state) 
	{
		if (m_ars4 != state)
		{
			if (state and IsAlsWorks())
				SetMeshVisible("lamp_40", true, 0.3);
			else
				SetMeshVisible("lamp_40", false, 0.3);
			m_ars4 = state;
		}
	}
	// ----
	public void SetArs6(bool state) 
	{
		if (m_ars6 != state)
		{
			if (state and IsAlsWorks())
				SetMeshVisible("lamp_60", true, 0.3);
			else
				SetMeshVisible("lamp_60", false, 0.3);
			m_ars6 = state;
		}
	}
	// ----	
	public void SetArs7(bool state) 
	{
		if (m_ars7 != state)
		{
			if (state and IsAlsWorks())
				SetMeshVisible("lamp_70", true, 0.3);
			else
				SetMeshVisible("lamp_70", false, 0.3);
			m_ars7 = state;
		}
	}	
	// ----	
	public void SetArs8(bool state) 
	{
		if (m_ars8 != state)
		{
			if (state and IsAlsWorks())
				SetMeshVisible("lamp_80", true, 0.3);
			else
				SetMeshVisible("lamp_80", false, 0.3);
			m_ars8 = state;
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
				SetMeshVisible("lamp_lsd1", true, 0.1);
				SetMeshVisible("lamp_lsd2", true, 0.1);
			}
			else
			{
				Sleep(0.7);
				SetMeshVisible("lamp_lsd1", false, 0.1);
				SetMeshVisible("lamp_lsd2", false, 0.1);
			}
		}
	}
	// *
	// m_rk
	void SetRk(bool state)
	{
		if (m_rk != state)
		{
			if (state and cd.AKB)
				SetMeshVisible("lamp_rk", true, 0.1);
			else
				SetMeshVisible("lamp_rk", false, 0.1);
			m_rk = state;
		}
	}
	// m_rp
	void SetRp(bool state)
	{
		if (m_rp != state)
		{
			if (state and cd.AKB)
				SetMeshVisible("lamp_rp", true, 0.1);
			else
				SetMeshVisible("lamp_rp", false, 0.1);
			m_rp = state;
		}
	}
	// *
	// Лампа ЛСН. Горит, когда поезд следует по участку с кодами АЛС/АРС.
	// В реальности она может мигать или гореть нестабильно из‑за особенностей кодирования,
	// но в симуляторе это отображается как обычное включение/выключение.
	// m_lsn
	void SetLsn(bool state)
	{
		if (m_lsn != state)
		{
			if (state and cd.AKB)
				SetMeshVisible("lamp_lsn", true, 0.1);
			else
				SetMeshVisible("lamp_lsn", false, 0.1);
			m_lsn = state;
		}
	}

	// Лампа КВЦ. Показывает состояние цепей управления.
	// В реальности может загораться, мигать или гаснуть в зависимости от множества факторов,
	// включая переходные процессы. В симуляторе отображается упрощённо.
	// m_lkvc
	void SetLkvc(bool state)
	{
		if (m_lkvc != state)
		{
			if (state and cd.AKB)
				SetMeshVisible("lamp_lkvc", true, 0.1);
			else
				SetMeshVisible("lamp_lkvc", false, 0.1);
			m_lkvc = state;
		}
	}

	// Лампа ЛН. Сигнализирует о наличии кодов АЛС.
	// В реальности её работа зависит от частоты, качества сигнала и переходных процессов.
	// Например, при коде «80» лампа может гореть слабее, чем при «40».
	// В симуляторе отображается в упрощённом виде.
	// m_ln
	void SetLn(bool state)
	{
		if (m_ln != state)
		{
			if (state and cd.AKB)
				SetMeshVisible("lamp_ln", true, 0.1);
			else
				SetMeshVisible("lamp_ln", false, 0.1);
			m_ln = state;
		}
	}

	// Лампа РС — разрешающий сигнал.
	// В реальности она загорается при получении разрешающего кода АЛС,
	// но может вести себя нестабильно при переходах между кодами.
	// Например, при смене кодов 70 ↔ 80 возможны кратковременные пропадания.
	// В симуляторе отображается упрощённо.
	// m_rs
	void SetRs(bool state)
	{
		if (m_rs != state)
		{
			if (state and cd.AKB)
				SetMeshVisible("lamp_rs", true, 0.1);
			else
				SetMeshVisible("lamp_rs", false, 0.1);
			m_rs = state;
		}
	}

	// Лампа КВД — контроль высоковольтного оборудования.
	// В реальности загорается при включении высоковольтных цепей.
	// Если лампа горит при отключённом оборудовании — это может быть неисправность,
	// например, пробой изоляции или ложное срабатывание реле.
	// На некоторых поездах это связано с работой реле РП-2.
	// m_lkvd
	void SetLkvd(bool state)
	{
		if (m_lkvd != state)
		{
			if (state and cd.AKB)
				SetMeshVisible("lamp_lkvd", true, 0.1);
			else
				SetMeshVisible("lamp_lkvd", false, 0.1);
			m_lkvd = state;
		}
	}
	// *
	// Лампа ЛВД — контроль высоковольтных цепей. 
	// В реальности она может загораться даже при кратковременном появлении напряжения,
	// то есть реагирует на очень короткие импульсы. Поэтому её работа не всегда стабильна.
	// m_lvd
	void SetLvd(bool state)
	{
		if (m_lvd != state)
		{
			if (state and cd.AKB)
				SetMeshVisible("lamp_lvd", true, 0.1);
			else
				SetMeshVisible("lamp_lvd", false, 0.1);
			m_lvd = state;
		}
	}

	// *
	// Лампа ЛКТ — контроль контакторов тяги.
	// В реальности её работа зависит от механики контакторов и переходных процессов,
	// поэтому она может загораться с задержкой или мигать при переключениях.
	// Это нормальное поведение для электромеханических систем.
	// m_lkt
	void SetLkt(bool state)
	{
		if (m_lkt != state)
		{
			if (state and cd.AKB)
				SetMeshVisible("lamp_lkt", true, 0.1);
			else
				SetMeshVisible("lamp_lkt", false, 0.1);
			m_lkt = state;
		}
	}

	// *
	// Лампа ЛСТ — контроль ступеней торможения.
	// В реальности она загорается при переходе на 6‑ю ступень тормоза,
	// то есть когда торможение достигает максимальной силы.
	// Это индикатор того, что поезд тормозит максимально интенсивно.
	// m_lst
	void SetLst(bool state)
	{
		if (m_lst != state)
		{
			if (state and cd.AKB)
				SetMeshVisible("lamp_lst", true, 0.1);
			else
				SetMeshVisible("lamp_lst", false, 0.1);
			m_lst = state;
		}
	}
// lamps
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
		SetLn(false);
		SetLkvc(false);		
		SetLkvd(false);
		SetLvd(false);
		SetLkt(false);
		SetLst(false);
	}
	
	void SetLsd() {
		SetLsd(cd.AKB and !(cd.doorright_open or cd.doorleft_open) and loco.GetEngineSetting("reverser") != Train.TRACTION_NEUTRAL);
	}
	
	void SetEngineSetting(string setting, float value) {
		//Interface.Print("Setting=" + setting + ", value=" + value);
		loco.SetEngineSetting(setting, value);
	}
	
	void SetThrottleEngingSettings(float value)
	{
		if (!cd.rabota or m_arsStopping) value = 0;
		loco.SetEngineSetting("throttle", value);
		m_throttleEngineValue = value;
	}
	
	int GetThrottlePosition() {
		int position;
		float value = throttle_lever2.GetValue();

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
	
	thread void RealisticModeThread() {
		//Interface.Print("KB:" + cd.rabota);
		if (kb_works) return;
		kb_works = true;
		Train train = loco.GetMyTrain();
		if (cd.rabota and train.GetAutopilotMode() == Train.CONTROL_MANUAL) {
			float a = 0.0;
			bool vz1_locked = false;
			bool add = false;
			float tadd = 0.0;
			float vel;
			kv_pos_old = GetThrottlePosition();
			while (cd.rabota and train.GetAutopilotMode() == Train.CONTROL_MANUAL) {
				/*
Interface.Print("KB=" + kv_pos + 
			"  pos=" + cposc + 
			"  ttl=" + loco.GetEngineSetting("throttle") + 
			"  f=" + loco.GetEngineParam("applied-force") + 
			"  a=" + a+ 
			"  db="+loco.GetEngineSetting("dynamic-brake")  + 
			"  ab="+loco.GetEngineSetting("loco-auto-brake"));
*/				
				Sleep(0.05);
				train = loco.GetMyTrain();
				cm = !cm;				
								
				tadd = 0.0;
				vel = Math.Fabs(loco.GetVelocity() * 3.6);
				if (m_arsStopping) kv_pos = -3;
				else			   kv_pos = GetThrottlePosition();

				if (kv_pos_old >= 0 and kv_pos < 0) { 
					Sleep(0.5);
					SetLampsOnThrottleDown();
				}
				else if (kv_pos_old < 0 and kv_pos >= 0) {
					Sleep(0.5);
					SetLampsOnThrottleUp();
				}

				kv_pos_old = kv_pos;

				if (!m_arsStopping) {
					if (throttle_lever2.GetValue() > 0) kv_pos = throttle_lever2.GetValue() + 0.3;
					if (throttle_lever2.GetValue() < 0) kv_pos = throttle_lever2.GetValue() - 0.3;
					if (kv_pos > 3) kv_pos = 3;
					if (kv_pos < -3) kv_pos = -3;
				}

				if (vel > 0.1) {
					if (vz1_locked) SetEngineSetting("loco-auto-brake", 100);
					if ((kv_pos < -1) and(cposc > 16) and(a > -0.4)) SetEngineSetting("loco-auto-brake", 100);
				}

				if (kv_pos == 0) {
					cpos = 1;
					cposc = 1;

					SetThrottleEngingSettings(0);
					SetEngineSetting("dynamic-brake", 0);
					SetLampsByThrottlePos(0);
				}
				if (kv_pos == 1) {
					SetEngineSetting("loco-auto-brake", 0);
					SetEngineSetting("dynamic-brake", 0);
					SetLampsByThrottlePos(1);
					if (cpos == 0) cposc = 1;
					if (cposc > 0) cpos = cposc;
				}
				if (kv_pos == 2 and cm) {
					cpos = (vel / 35.0) * 24 + 6;
					SetLampsByThrottlePos(2);
					if (cposc < 6) cposc = 6;
					if (cpos > 32) cpos = 32;
					if (cposc < cpos)++cposc;
					if ((cposc < 32) and(loco.GetEngineParam("applied-force") < 33000) and(vel < 25)) tadd = 8.0;
				}
				if (kv_pos == 3 and cm) {
					SetLampsByThrottlePos(3);
					if (cpos < 32) cpos = (vel / 35.0) * 20 + 6;
					if (cpos >= 32) cpos = 32 + (vel - 32) * 4 / 33.0;
					if (cpos > 36) cpos = 36;
					if (cposc < cpos)++cposc;

					if ((cposc < 36) and(loco.GetEngineParam("applied-force") < 33000) and(vel < 30)) tadd = 8.0;
				}
				if (kv_pos > 0) {
					float ttl = 0;
					if (vel > 3.0) vz1_locked = false;
					SetEngineSetting("loco-auto-brake", 0);

					if (cposc == 1) ttl = 1;
					if (cposc <= 32) ttl = 1 + (cposc / 32.0) * 3.0;
					if (cposc > 32) ttl = 4 + ((cposc - 32) / 4.0);

					if ((cpos - cposc > 0) and(cpos - cposc < 7)) ttl = 8;

					if (!ars_disables_sch) SetThrottleEngingSettings(ttl + tadd);
				}

				a = ( - 0.06 - cposc * 0.17 / 18.0) * (vel - (37 - cposc * 35 / 18.0));
				if (a > 0) a = 0;

				if (kv_pos == -1) {
					Sleep(1);
					SetEngineSetting("dynamic-brake", 2);
					SetThrottleEngingSettings(0.01);
					SetLampsByThrottlePos(-1);
					if (!vz1_locked) SetEngineSetting("loco-auto-brake", 0);
					if (cposc == 1 and a < -0.4) a = -0.4;
					add = false;
				}
				if (kv_pos == -2) {
					if (cm) {
						SetEngineSetting("dynamic-brake", 2);
						SetThrottleEngingSettings(0.01);
						SetLampsByThrottlePos(-2);
						if ((a > -1.07) and(!add) and(cposc < 18)) {
							add = true;
							cposc++;
						}
						if (cposc == 1 and a < -1.07) a = -1.07;
						add = true;
					}
				}
				if (kv_pos == -3) {
					if (cm) {
						cpos = 18; // 18 - (vel - 10)*18 / 55;
						SetLampsByThrottlePos(-3);
						if (cpos > 18) cpos = 18;
						if (cpos < 0) cpos = 0;
						if ((a > -1.07) and(cposc < 18)) cposc++;
						if ((cposc > 17) and(a > -0.8)) SetEngineSetting("loco-auto-brake", 100);
					}
				}
				if (kv_pos < 0) {
					if ((vel < 1) and(kv_pos < -1) and(cposc > 17)) vz1_locked = true;
					if (a < -1.2) a = -1.2;
					if (a > 0) a = 0;
					SetThrottleEngingSettings(-a);
					int logv = 1;
					if (loco.GetVelocity() < 0) logv = -1;
					if (!loco.GetDirectionRelativeToTrain()) logv = -logv;
					if (logv > 0) loco.GetMyTrain().AddVelocity(a * 0.05);
					else loco.GetMyTrain().AddVelocity( - a * 0.05);
				}
			}
		}
		SetEngineSetting("dynamic-brake", 0);
		SetThrottleEngingSettings(0);
		kb_works = false;
	}
	
	thread void DetectAutopilotThread()
	{
		Train train = loco.GetMyTrain();
		bool autopilot = train.GetAutopilotMode() != Train.CONTROL_MANUAL;
		if (train.GetTrainVelocity() and autopilot)
		{
			//SetSimpleMode(true);
			if (loco == train.GetFrontmostLocomotive()) {
				train.SetHeadlightState(true);
				SetPowerOn();				
			}
			else  {	  
				SetPowerOff();	
			}
		}
		if (cd.m_simpleMode or autopilot) SimpleModeThread();
		else							  RealisticModeThread();
	}
	
	bool m_BrakeSounderThread;
	
	thread void BrakeSounderThread() {
		if (m_BrakeSounderThread) return;
		m_BrakeSounderThread = true;
		float old_vz1st = 0.0;
		float new_vz1st = 0.0;
		while (!cd.m_simpleMode) {
			new_vz1st = loco.GetEngineSetting("loco-auto-brake");

			if (new_vz1st != old_vz1st) {
				if (new_vz1st < old_vz1st) {
					PlaySound("vz1_o.wav");
					SetRp(true);
					Sleep(0.5);
					SetLsn(true);
					Sleep(1.5);
					SetRp(false);
					Sleep(0.5);
					SetLsn(false);
					SetLst(false);
				}
				else if (new_vz1st > old_vz1st) {
					PlaySound("vz1_t.wav");
					Sleep(1.5);
					SetLst(true);
				}
				old_vz1st = loco.GetEngineSetting("loco-auto-brake");
			}
			else Sleep(0.5);
		}
		m_BrakeSounderThread = false;
	}

	void Check_Main_State() {		
		cd.rabota = (!cd.m_simpleMode and cd.BPSN and cd.AKB and cd.doors_locked and cd.kvc_automat and cd.motor_compr);
		if (!kb_works and cd.rabota)
			RealisticModeThread();
	}

	void UpdateSpeedIndicators() {
		int speed = GetCurrentSpeed();
		int temp = speed / 10;

		if (cd.AKB) {
			SetFXTextureReplacement("num1", textures, temp);
			SetFXTextureReplacement("num2", textures, speed - temp * 10);
		}
		else {
			SetFXTextureReplacement("num1", null, 0);
			SetFXTextureReplacement("num2", null, 0);
		}
	}
	
	thread void SpeedThread() {
		if (m_SpeedThread) return;
		m_SpeedThread = true;
		int currentSpeed = 0;
		int nextSpeed = 0;
		UpdateSpeedIndicators();
		while (cd.AKB) {
		// update speedometer
			currentSpeed =  GetCurrentSpeed();
			if (nextSpeed != currentSpeed or currentSpeed == 0)	{
				UpdateSpeedIndicators();
			}
			nextSpeed = GetCurrentSpeed();
			Sleep(0.3);
		}
		m_SpeedThread = false;
		UpdateSpeedIndicators();
		SetLsd(false);
		SetLkt(false);
	}
	
	thread void ArsStartThread() {
		if (m_arsStart) return;	
		m_arsStart = true; 
		Sleep(0.05);
		SetRk(true); 
		Sleep(0.05);
		SetRp(true); 
		SetLsn(true);
		Sleep(0.05);
		SetLkvd(true);
		SetLst(true); 
		Sleep(0.05);
		SetLkvc(true);
		SetLkt(true);
		while (m_arsStart)
		{
			PlaySound("ARSsig.wav");
			Sleep(0.35);
		}
		PlaySound("ARSend.wav");
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
	}

	bool m_CompressorThread;
	thread void CompressorThread() {
		if (m_CompressorThread) return;
		m_CompressorThread = true;
		while (!cd.m_simpleMode) {
			if (cd.motor_compr) PostMessageToMyTrain("MK_on");

			int N_cikle = Math.Rand(0, 5);
			int i = 0;

			while (i < N_cikle) // обозначает количество циклов			
			{
				Sleep(60);
				i++;
			}

			PostMessageToMyTrain("MK_off");

			N_cikle = Math.Rand(15, 30);
			i = 0;

			while (i < N_cikle) {
				Sleep(60);
				i++;
			}
		}
		PostMessageToMyTrain("MK_off");
		m_CompressorThread = false;
	}
	
	bool m_ReverserThread;
	thread void ReverserThread() {
		if (m_ReverserThread) return;
		m_ReverserThread = true;
		Train train;
		int revState = -1,
			revStateNew;
		while (true) {
			revStateNew = loco.GetEngineSetting("reverser");
			if (revStateNew != revState) {				
				SetOpenDoorsLamps();
				if (revState >= 0) {
					if (cd.AKB) PlaySound("rev.wav");
					else		PlaySound("kv.wav");
				}
				UpdateLightsState();				
				if (cd.AKB and revStateNew != Train.TRACTION_NEUTRAL) {
					SetFirstLoco();
					Sleep(0.3);
					SetLsd(!(cd.doorright_open or cd.doorleft_open));
				}
				else {
					
					Sleep(0.3);
					SetLsd(false);
				}
				
				SetLn(cd.AKB and revStateNew == Train.TRACTION_FORWARD);
				revState = revStateNew;				
			}
			Sleep(0.5);
		}
		m_ReverserThread = false;
	}
	
	public void Update() {
		inherited();
		
		if (!cd) return;
		
		float lightness;
		if (cd.svet_kabina and cd.AKB) lightness = 1.0;
		else {
			lightness = Math.Fabs(World.GetGameTime() - 0.5) * 2.1;
			if (lightness < 0.2 or loco.IsInTunnel()) lightness = 0.12;
		}
		SetCabLightIntensity(lightness);
		if (!m_ReverserThread)
			SetLsd();
	}
	
	MyCabinData GetOppositeCabinData()
	{
		Vehicle[] vehicles = loco.GetMyTrain().GetVehicles();
		int len = vehicles.size();
		if (len > 1)
		{
			Locomotive cur;
			if (loco == vehicles[0]) cur = cast<Locomotive>(vehicles[len-1]);
			else					 cur = cast<Locomotive>(vehicles[0]);
			CabinData cd = cur.GetCabinData();
			if (cd and cd.isclass(MyCabinData))
				return cast<MyCabinData>(cd);
		}
		return null;
	}
	
	thread void InitDoorsButtons() {
		m_doorLapsInit = true;
		SetMeshVisible("otkr_dver1_y", true, 0);
		SwapTextureOnMesh("otkr_dver1_y", "001 pol.texture","001 yellow_on.texture");
		Sleep(1);
		SetMeshVisible("otkr_dver1_y", false, 0);
		SetMeshVisible("otkr_dver1", true, 0);
		SetMeshVisible("otkr_dver2", true, 0);
		SetMeshVisible("otkr_dver3", true, 0);
		m_doorLapsInit = false;
	}
	
	void SyncDoorsState(bool load)	{
		MyCabinData ccd = GetOppositeCabinData();
		if (ccd)  {
			if (load)	{
				cd.doorleft_open  = ccd.doorright_open;
				cd.doorright_open = ccd.doorleft_open;
	Print("SyncDoorsState:doorleft_open="+cd.doorleft_open+",doorright_open="+cd.doorright_open);		
			}
			else	{
				ccd.doorleft_open  = cd.doorright_open;
				ccd.doorright_open = cd.doorleft_open;				
			}
		}
		SetLsd();
	}
//===========================================================================================================			
	void SyncStateOnInit() {
Print("SyncStateOnInit");
		MyCabinData ccd = GetOppositeCabinData();
		if (ccd) {
			cd.m_simpleMode = ccd.m_simpleMode;
			cd.AKB = ccd.AKB;
			cd.BPSN = ccd.BPSN;
			cd.rc_1 = ccd.rc_1;
			cd.fary = ccd.fary;
			cd.vus = ccd.vus;
			if (cd.m_simpleMode) {
				SetFirstLoco();
				cd.kb = ccd.kb;				
				cd.doors_locked = ccd.doors_locked;
				cd.left_right = ccd.left_right;
				cd.svet_kabina = ccd.svet_kabina;
				cd.motor_compr = ccd.motor_compr;
				cd.ars_sig = ccd.ars_sig;
				cd.als_sig = ccd.als_sig;
				cd.avar_svet_a49 = ccd.avar_svet_a49;
				cd.avar_svet = ccd.avar_svet;
				cd.krishka_1 = ccd.krishka_1;
				cd.krishka_2 = ccd.krishka_2;
			}
		}		
	}
	
	void OnThrottleLever(float p_value) {
		if (p_value >= 2.5) {
			throttle_lever2.SetText(GetAsset().GetStringTable().GetString("kv3"));
		} //else if
		else if (p_value >= 1.5) {
			throttle_lever2.SetText(GetAsset().GetStringTable().GetString("kv2"));
		} //else if
		else if (p_value >= 0.5) {
			throttle_lever2.SetText(GetAsset().GetStringTable().GetString("kv1"));
		} //else if
		else if (p_value >= -0.5) {
			throttle_lever2.SetText(GetAsset().GetStringTable().GetString("kv0"));
		} //else if
		else if (p_value >= -1.5) {
			throttle_lever2.SetText(GetAsset().GetStringTable().GetString("kv-1"));
		} //else if
		else if (p_value >= -2.5) {
			throttle_lever2.SetText(GetAsset().GetStringTable().GetString("kv-2"));
		} //else if
		else {
			throttle_lever2.SetText(GetAsset().GetStringTable().GetString("kv-3"));
		} //else

		if (Math.Fabs(p_value) < 0.1) throttle_lever2.SetValue(0.0);
	}	
		
	void ApplyOther() {
		string name;
		bool value;
		Soup other = cd.other;
		int i, len = other.CountTags();
		for (i = 0 ; i < len; i++) {
			name = other.GetIndexedTagName(i);
			value = other.GetNamedTagAsBool(name);
			GetNamedControl(name).SetValue(1);
		}		
	}
	
	void ApplyCD() {
		InitDoorsButtons();
		SetControlsState();
		BatteryChanged(true);
		GetNamedControl("trainbrake_lever").SetValue(cd.trainbrake_lever);
		GetNamedControl("reverser_lever").SetValue(loco.GetEngineSetting("reverser"));
		throttle_lever2.SetValue(cd.kb);
		OnThrottleLever(cd.kb);
		SetHeadlightData();
		ApplyOther();
		Check_Main_State();
		UpdateLightsState();
	}
	
	void SetTrainEventHandlers() {
		Train train = loco.GetMyTrain();
		Sniff(train,"Train","NotifyHeadlights", true);
		Sniff(train,"Train","StartedMoving", true);
		Sniff(train,"Train","BrakeLightChanged", true);
		Sniff(train, "CTRL", null, true);
		Sniff(train, "HorLift", null, true);
		//Sniff(train, "Train", null, true);
		AddHandler(me, "Train", "NotifyHeadlights", "OnMessageFromTrain");	
		AddHandler(me, "Train", "StartedMoving", "OnMessageFromTrain");	
		AddHandler(me, "Train", "BrakeLightChanged", "OnMessageFromTrain");	
	//AddHandler(me, "Train", null, "OnMessageFromTrain");	
		AddHandler(me, "CTRL", null, "OnCtrlMessage");	
		AddHandler(me, "HorLift", null, "OnMessageFromTrain");	
//		AddHandler(me, "Object", "Leave", "OnLeaveSignal");
	}
		
	void SetNewCabinData() {
		cd = new MyCabinData();
		loco.SetCabinData(cd);
		cd.other = Constructors.NewSoup();		
	}
	
	public void Attach(GameObject obj) {
		inherited(obj);
		
		Train train = loco.GetMyTrain();		
		SetTextureSelfIllumination("pult.texture.txt", 1, 0, 0);
		SetTextureSelfIllumination("pult.jpg", 1, 0, 0);
		SetFXNameText("als_lcd", "99");
		CompressorThread();
		BrakeSounderThread();
		
		(cast<Vehicle> obj).SetHeadlightColor(0.1, 0.1, 0.05);
		(cast<Vehicle> obj).SetRollBasedOnTrack(0.07);
		(cast<Vehicle> obj).SetCabinSwayAmount(40.0);

		cd = cast<MyCabinData>(loco.GetCabinData());
		if (!cd) 
		{ 
			SetNewCabinData();
			SyncDoorsState(true);
		}
		SyncStateOnInit();
		ApplyCD();
		m_throttleEngineValue = loco.GetEngineSetting("throttle");
		Check_Main_State();
		Als_Thread();
		SetTrainEventHandlers();
		if (train.GetTrainVelocity()) DetectAutopilotThread();
		ReverserThread();
	}

	void PostMessageToMyTrain(string minor) 
	{
		Vehicle[] vehicles = loco.GetMyTrain().GetVehicles();		
		int i, len = vehicles.size();
		for (i = 0; i < len; i++)
			loco.PostMessage(vehicles[i], "Metro717", minor, 0.0);
	}

	void SetAls(int alsCode, int alsCode_next, bool autoblocking)	{
//Print("alsCode="+alsCode+",alsCode_next="+alsCode_next+",autoblocking="+autoblocking);
		bool och = alsCode == ALS_OC;
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
							alsCode_next != ALS_AO and
							alsCode_next < alsCode;

			bool als_0 = alsCode == ALS_0 or alsCode == ALS_AO,
				 rs    = autoblocking and alsCode_next >= alsCode;

Print("SetAls::alsCode="+alsCode+",alsCode_next="+alsCode_next+",autoblocking="+autoblocking+",showDop="+showDop+",rs="+rs);
			SetArs0(als_0 or (showDop and alsNext_0));
			SetArs4(alsCode == ALS_40 or (showDop and alsCode_next == ALS_40));
			SetArs6(alsCode == ALS_60 or (showDop and alsCode_next == ALS_60));
			SetArs7(alsCode == ALS_70 or (showDop and alsCode_next == ALS_70));
			SetArs8(alsCode == ALS_80);
			SetRs(rs);
		}
	}
	
	thread void ArsStopThread()
	{
		if (m_arsStopping) return;		
//Print("ArsStopThread");
		m_arsStopping = true;
		SetLkvd(true);
		PlaySound("ARSsig.wav");
        SetThrottleEngingSettings(0);
        SetEngineSetting("dynamic-brake", 2);
		PlaySound("ARSsig.wav");
		Sleep(0.4);
		PlaySound("ARSsig.wav");
		Sleep(0.6);
		if (m_passedRed or GetCurrentSpeed() > m_speedLimit)
        {
			SetEngineSetting("dynamic-brake",2);
			SetEngineSetting("loco-auto-brake",100);
			while (m_arsStopping)
			{
				PlaySound("ARSsig.wav");
				Sleep(0.4);
				if (cd.m_simpleMode) {
					if (m_passedRed) {
						if (GetCurrentSpeed() == 0) break;
					}
					else if (GetCurrentSpeed() < m_speedLimit) break;
				}
			}
		}
		PlaySound("ARSend.wav");
		SetLkvd(false);
		SetEngineSetting("dynamic-brake", 0);
		SetEngineSetting("loco-auto-brake", 0);
		m_arsStopping = m_passedRed = false;
		m_speedLimit = 1000;
//Print("ArsStopThread-end::m_arsStopping="+m_arsStopping);	
	}
	
	void Ars() {
Print("Ars::m_passedRed="+m_passedRed+",GetCurrentSpeed()="+GetCurrentSpeed()+",m_speedLimit="+m_speedLimit);
		if (!m_arsStopping and (m_passedRed or GetCurrentSpeed() > m_speedLimit))
		{
Print("Ars:"+GetCurrentSpeed()+",m_speedLimit="+m_speedLimit);
			ArsStopThread();
		}
	}

	thread void Als_Thread() 
	{
		if (m_ALSG) return;
		m_ALSG = true;
		StringTable ST = GetAsset().GetStringTable();
		int  alsCode = -1, 
			 alsCode_next = -1;
		bool autoblock, rs, ps;
		Signal signal;
		Train  train;
//		string signalId, prevSignalId;
//		float speedLimit = -1;
		//Interface.Print("Als_Thread start:"+locoFocused+","+cd.ars_sig);
/*
	define int ALS_0  = 0;
	define int ALS_OC = 1;
	define int ALS_AO = 2;
	define int ALS_40 = 4;
	define int ALS_60 = 6;
	define int ALS_70 = 7;
	define int ALS_80 = 8;

*/
		while (cd.AKB and cd.ars_sig) 
		{
			train = loco.GetMyTrain();
			if (loco == train.GetFrontmostLocomotive())
			{			
				Sleep(0.5);
				if (m_HorLiftDoorsOpened) 
				{
					SetAls(0, 0, false);
				}
				else 
				{				
					GSTrackSearch GSTS = loco.BeginTrackSearch(true);
					MapObject mo = GSTS.SearchNext();
					while (mo) 
					{
						if (mo.isclass(Vehicle)) 
						{
							m_speedLimit = 5;
							alsCode_next = alsCode = ALS_AO;
//							prevSignalId = signalId = "";
							break;
						}
						if (mo.isclass(Signal) and GSTS.GetFacingRelativeToSearchDirection()) 
						{
							Soup props = mo.GetProperties();
							if (props.GetNamedTag("MSig-type") != "") 
							{
								signal = cast<Signal>(mo);
								if (signal != m_nextSignal) 
								{
									alsCode = alsCode_next;
								// 	if (m_nextSignal) Sniff(m_nextSignal, "Object", "Leave", false);
								// 	Sniff(signal, "Object", "Leave", true);
								 	m_nextSignal = signal;
									m_passedRed = (alsCode == ALS_AO or alsCode == ALS_0);
								}
//								signalId = signal.GetId();
//Print("1::m_passedRed="+m_passedRed+",m_arsStopping="+m_arsStopping+",speedLimit="+speedLimit+",signalId="+signalId+",prevSignalId="+prevSignalId);
//								if (!m_passedRed and !(speedLimit or signalId == prevSignalId))
//									m_passedRed = true;
								
								if (m_passedRed and !ps)
								{
									alsCode = alsCode_next = ALS_0;
								}
								else 
								{
									alsCode_next = props.GetNamedTagAsInt("MSig-als-fq");
									if (alsCode < 0) alsCode = alsCode_next;
									ps = props.GetNamedTagAsBool("ps");
									autoblock = props.GetNamedTagAsInt("autoblock");
Print("props::alsCode="+alsCode+",alsCode_next="+alsCode_next+",autoblock="+autoblock+",signal="+signal.GetName()+",distance="+GSTS.GetDistance());

									if (!m_arsStopping) 
									{
										if (ps) m_speedLimit = 20;
										else if (alsCode == ALS_AO) m_speedLimit = 0;
										else if (alsCode == ALS_0 or alsCode == ALS_OC) m_speedLimit = 20;
										else m_speedLimit = alsCode * 10;
Print("m_speedLimit="+m_speedLimit);
									}
								}							
//								prevSignalId = signalId;
								break;
							}
						}						
						mo = GSTS.SearchNext();
						if (GSTS.GetDistance() > 1500) 
						{
							m_speedLimit = 22;
							alsCode_next = alsCode = ALS_OC;
							break;
						}
					}
				}
			
			//Print("2::m_passedRed="+m_passedRed+",speedLimit="+speedLimit+",m_speedLimit="+m_speedLimit+",alsCode="+alsCode);
				
				SetAls(alsCode, alsCode_next, autoblock);
				if (train.GetAutopilotMode() == Train.CONTROL_MANUAL and (cd.m_simpleMode or cd.ars_sig))
					Ars();
			}
			else 
			{
				InitLampsAls();
				Sleep(0.5);
			}			
		}
		InitLampsAls();
		m_ALSG = false;
	}

	void SetThrottle(int n)
	{
		PlaySound("kv.wav");
		if (!cd.rabota) SetThrottleEngingSettings(0);
		else 			SetThrottleEngingSettings(2);
		loco.SetEngineSetting("throttle", m_throttleEngineValue);
		bool  changed = false;
		float value = throttle_lever2.GetValue();
		if (n > 0)	{
			if (value < KB_X3)	{
				changed = true;
				value = value + 1.2;
				if (value > KB_X3) value = KB_X3;
			}
		}
		else if (n < 0)	{
			if (value > KB_T2) 	{
				changed = true;
				value = value - 1.2;
				if (value < KB_T2) value = KB_T2;
			}
		}
		else if (value != KB_0)	{
			changed = true;
			value = KB_0;
		}		
		if (changed) {		
			throttle_lever2.SetValue(value);
			PlaySound("kv.wav");
			//SetNewLabel();
			OnThrottleLever(value);
		}
	}

	thread void LockKB(void) {
		throttle_lever2.SetLocked(false);
		throttle_lever2.SetLocked(false);
	}

	void UpdateLightsState(Vehicle v, bool isFirst, bool isLast) {
		Train train = loco.GetMyTrain();
		bool state = cd.AKB and cd.fary;
		if (cd.m_simpleMode) state = state and train.GetHeadlightState();
		
		bool fm, fv, fr;
		if (isFirst) {
			bool isNeutralPos = (loco.GetEngineSetting("reverser")== Train.TRACTION_NEUTRAL),
			     vus = state and cd.vus and train.GetHighBeams();
			fm = state and !isNeutralPos;
			fv = fm and vus;
			fr = state and isNeutralPos;
		}
		else if (isLast) {
			fm = fv = false;
			fr = state;			
		}
		else {
			fm = fv = fr = false;
		}
		v.SetMeshVisible("fara_0", fm, 0);
		v.SetMeshVisible("fara_1", fv, 0);
		v.SetMeshVisible("fara_2", fv, 0);
		v.SetMeshVisible("fara_3", fv, 0);
		v.SetMeshVisible("fara_4", fv, 0);
		v.SetMeshVisible("fara_5", fm, 0);
		v.SetMeshVisible("buf_red_r", fr, 0);
		v.SetMeshVisible("buf_red_l", fr, 0);				
	}
	
	void UpdateLightsState() {
		Train train = loco.GetMyTrain();
		Vehicle first = train.GetFrontmostLocomotive();
		if (first != loco) return;
		Vehicle[] vehicles = train.GetVehicles();
		int i, len = vehicles.size();
		Vehicle v;		
		for (i = 0; i < len; i++) {
			v = vehicles[i];
			UpdateLightsState(v, i == 0, i == len-1);
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
				break;
			case -2:
				SetRk(true);
				SetLst(false);
				SetLvd(false);
				break;
			case -1:
				SetRk(false);
				SetLst(false);
				SetLvd(false);
				break;
			case 0:
				SetRk(false);
				SetLvd(false);
				SetLst(false);
				break;
			case 1:
				SetRk(false);
				SetLvd(true);
				SetLst(false);
				break;
			case 2:
				SetRk(true);
				SetLvd(true);
				SetLst(false);
				break;
			case 3:
				SetRk(true);
				SetLvd(true);
				SetLst(false);
				break;
			default:
				break;
		}
		SetBrakeLight(pos);
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
	
	define int MaxCount = 6;
	thread void SimpleModeThread()
	{
		if (m_simpleModeThread) return;
		m_simpleModeThread = true;
		while (cd.m_simpleMode and !cd) Sleep(1);		
		float speed = 0, prev_speed = -1000, delta;
		int throttleValue = 0, newValue = 0, count = 0;
		CabinControl reverser = GetNamedControl("reverser_lever");
		while (cd.m_simpleMode or loco.GetMyTrain().GetAutopilotMode() != Train.CONTROL_MANUAL)
		{
			speed = loco.GetVelocity();
			if (prev_speed > -1000)
			{
				if (speed == 0)
				{
					if (!cd.kb)
					{
						Sleep(1);
						SetLampsByThrottlePos(0);
						throttle_lever2.SetValue(0);
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
								throttle_lever2.SetValue(throttleValue);
								SetLampsByThrottlePos(throttleValue);
								cd.kb = 0;							
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
								throttle_lever2.SetValue(throttleValue);
								cd.kb = 0;							
							}
						}
					}
					else
					{
						if (throttleValue != 0 and ++count == MaxCount)
						{
							SetLampsByThrottlePos(0);
							throttleValue = count = 0;
							throttle_lever2.SetValue(0);							
						}						
					}										
				}
			}			
			prev_speed = speed;			
			Sleep(0.5);
		}
		m_simpleModeThread = false;
	}	
	
	void  SetSimpleMode(bool value)	{		
		if (cd.m_simpleMode == value) return;
		MyCabinData ccd;
		Locomotive l;
		Vehicle[] vehicles = loco.GetMyTrain().GetVehicles();
		int i, len = vehicles.size();
		for (i = 0; i < len; i++) {
			l = cast<Locomotive>(vehicles[i]);
			if (l) {
				ccd = cast<MyCabinData>(l.GetCabinData());
				if (ccd) ccd.m_simpleMode = value;
			}
		}
		Check_Main_State();
		if (value) {
			SimpleModeThread();
		}
		else {
			PostMessage(null, "DriverMode", "Realistic", 0.2);
			RealisticModeThread();
			BrakeSounderThread();
			CompressorThread();
		}
	}	
	
	void SetBrakeLight(int throttlePos) {
		if (!cd.AKB) 			  SetLkt(false);
		else if (throttlePos < 0) SetLkt(true);
		else					  SetLkt(loco.GetBrakeCylinderPressure() > 0.001300);
	}
	
	void SetTrainPowerState(bool powerOn) {
		if (loco.GetMyTrain().GetTrainVelocity()) return;		
	Print("SetTrainPowerState:"+cd.m_simpleMode);	
		if (powerOn) {
			SetFirstLoco();
			SetPowerOn();
		}
		else {
			SetPowerOff();
		}
	}
	
	void  SetHeadlightData() {
		if (!cd.m_simpleMode) return;
		Train train = loco.GetMyTrain();
		int revState = loco.GetEngineSetting("reverser");
		bool headlight = train.GetHeadlightState();
		if (headlight) {
			if (!cd.AKB or revState == Train.TRACTION_NEUTRAL)	SetPowerOn();
		}
		else if (revState != Train.TRACTION_NEUTRAL) {
			SetPowerOff();
		}
		cd.fary = true;
		GetNamedControl("fari").SetValue(1);
		cd.vus = train.GetHighBeams();
		if (cd.vus)  	GetNamedControl("vus").SetValue(1);
		else			GetNamedControl("vus").SetValue(0);
		UpdateLightsState();
	}
	
	void DoorsOperate(bool open, bool right) {
		Vehicle v;
		Vehicle[] vehicles = loco.GetMyTrain().GetVehicles();
		int i, len = vehicles.size();
		if (open) {
			bool dir;
			if (right) {
				for (i = 0; i < len; i++) {
					v = vehicles[i];
					dir = v.GetDirectionRelativeToTrain();
					if (dir) v.SetMeshAnimationState("right-passenger-door", true);
					else 	 v.SetMeshAnimationState("left-passenger-door", true);
					World.PlaySound(myasset,"sound/open.wav",10,8,20,v,"a.doors");
				}
			}
			else {
				for (i = 0; i < len; i++) {
					v = vehicles[i];
					dir = v.GetDirectionRelativeToTrain();
					if (dir) v.SetMeshAnimationState("left-passenger-door", true);
					else 	 v.SetMeshAnimationState("right-passenger-door", true);
					World.PlaySound(myasset,"sound/open.wav",10,8,20,v,"a.doors");
				}
			}
		}
		else {
			for (i = 0; i < len; i++) {
				v = vehicles[i];
				v.SetMeshAnimationState("left-passenger-door", false);
				v.SetMeshAnimationState("right-passenger-door", false);
				World.PlaySound(myasset,"sound/close.wav",10,8,20,v,"a.doors");
			}
		}
	}
	
	void CloseDoors() {
		if (cd.AKB and loco.GetEngineSetting("reverser") != Train.TRACTION_NEUTRAL) {			
//Print("CloseDoors:doorright_open="+cd.doorright_open+",doorleft_open="+cd.doorleft_open);
			if (cd.doorleft_open or cd.doorright_open) {
				cd.doorleft_open = cd.doorright_open = false;
				//PostMessageToMyTrain("Close_left");
				//PostMessageToMyTrain("Close_right");
				DoorsOperate(false, false);
				Sleep(3.0);
				SetLsd(true);
				SyncDoorsState(false);
				loco.GetMyTrain().PostMessage(null, "Cab", "CloseDoors", 0);
			}
		}
	}
	
	void OpenDoors(bool right) {
		if (!(cd.doors_locked or loco.GetEngineSetting("reverser") == Train.TRACTION_NEUTRAL)) {
			if (right) {
//Print("OpenDoors:doorright_open="+cd.doorright_open+",left_right="+cd.left_right);
				if (!cd.doorright_open and cd.left_right) {
					cd.doorright_open = true;
//Print("OpenDoors:PostOpenRight");
					//PostMessageToMyTrain("Open_right");
					DoorsOperate(true, true);
					SetLsd(false);
					SyncDoorsState(false);
					loco.GetMyTrain().PostMessage(null, "Cab", "OpenDoorsRight", 0.5);
				}
			}
			else {
//Print("OpenDoors:doorleft_open="+cd.doorleft_open+",left_right="+cd.left_right);
				if (!cd.doorleft_open and !cd.left_right) {
					cd.doorleft_open = true;
//Print("OpenDoors:PostOpenLeft");
					//PostMessageToMyTrain("Open_left");
					DoorsOperate(true, false);
					SetLsd(false);
					SyncDoorsState(false);
					loco.GetMyTrain().PostMessage(null, "Cab", "OpenDoorsLeft", 0.5);
				}
			}
			
		}
	}	
//====  Change state handlers  =========================================================================================
	void VusChanged()
	{
		loco.GetMyTrain().SetHighBeams(cd.vus);
		UpdateLightsState();
	}
	
	void FaryChanged()
	{
		if (cd.m_simpleMode) return;
		loco.GetMyTrain().SetHeadlightState(cd.fary);
		UpdateLightsState();
	}
	
	void KvtPressed()	{
		if (m_arsStopping)	{
			if (throttle_lever2.GetValue() <= 0) { 
				if (m_passedRed) {
					if (GetCurrentSpeed() == 0) {
						m_arsStopping = m_passedRed = false;
						m_speedLimit = 100;
					}
				}
				else if (GetCurrentSpeed() < m_speedLimit) {
					m_arsStopping = false;
					m_speedLimit = 100;
				}
			}
		}
		else if (m_arsStart) {
			m_arsStart = false;
			Als_Thread();
		}
	}
	
	void ArsChanged(bool restore)	{
		m_arsStopping = false;
		bool enabled = cd.AKB and cd.ars_sig;
		if (enabled) {
			if (!(restore or cd.m_simpleMode))	ArsStartThread();
			Als_Thread();
		}
		else {
			m_arsStart = false;			
		}
	}
	
	void AlsChanged()	{				
		if (!(cd.AKB and cd.als_sig)) InitLampsAls();
	}
	
	void BpsnChanged()	{
		Check_Main_State();
//Print("BpsnChanged:"+cd.AKB);
		if (cd.BPSN) {	
			RealisticModeThread();
			PostMessageToMyTrain("BPSN_on");
		}
		else {
			PostMessageToMyTrain("BPSN_off");
		}
		UpdateLightsState();
	}
	
	void MotCompChanged() {
		Check_Main_State();
		if (cd.motor_compr) RealisticModeThread();
	}
	
	void BatteryChanged(bool restore)	{		
//Print("BatteryChanged:"+cd.battery+",restore="+restore);				
		ArsChanged(restore);
		AlsChanged();
		BpsnChanged();
		MotCompChanged();		
		UpdateSpeedIndicators();
		SetOpenDoorsLamps();
		
		if (!cd.AKB)		{
			InitLamps();
		}
		else {
			SpeedThread();								
			if (!cd.m_simpleMode) RealisticModeThread();
		}
		Check_Main_State();		
		UpdateLightsState();				
		if (cd.AKB)
			ReverserThread();
		SetLsd();
	}
	
	void  SetPowerOn()	{
	Print("SetPowerOn");
		if (!cd.AKB) {
			GetNamedControl("batarei").SetValue(1);
			cd.AKB = true;
			BatteryChanged(true);
		}
		if (!cd.kvc_automat)  {
			GetNamedControl("a53").SetValue(1);
			cd.kvc_automat = true;
		}
		if (!cd.fary) {
			cd.fary = true;
			GetNamedControl("fari").SetValue(1);
			FaryChanged();		
		}
		if (!cd.svet_kabina) {
			cd.svet_kabina = true;
			GetNamedControl("osv_kabiny").SetValue(1);
		}
		if (!cd.BPSN) {
			cd.BPSN = true;
			GetNamedControl("bp").SetValue(1);
			BpsnChanged();
		}
		if (!cd.motor_compr) {
			cd.motor_compr = true;
			GetNamedControl("mk").SetValue(1);
			MotCompChanged();
		}
		if (!cd.als_sig) {
			cd.als_sig = true;
			GetNamedControl("als").SetValue(1);
			AlsChanged();		
		}
		if (!cd.ars_sig) {
			cd.ars_sig = true;
			GetNamedControl("ars").SetValue(1);
			ArsChanged(cd.m_simpleMode);
		}		
		
		if (cd.m_simpleMode) {
			GetNamedControl("reverser_lever").SetValue(Train.TRACTION_FORWARD);
			loco.SetEngineSetting("reverser", Train.TRACTION_FORWARD);
			if (!cd.fary) {
				cd.fary = true;
				cd.vus = true;
				GetNamedControl("fari").SetValue(1);
				GetNamedControl("vus").SetValue(1);
			}			
		}		
		Check_Main_State();
	}
		
	void  SetPowerOff()	{
	Print("SetPowerOff");
		if (cd.kvc_automat)  {
			GetNamedControl("a53").SetValue(0);
			cd.kvc_automat = false;
		}
		if (cd.motor_compr) {
			cd.motor_compr = false;
			GetNamedControl("mk").SetValue(0);
			MotCompChanged();
		}
		if (cd.BPSN) {
			cd.BPSN = false;
			GetNamedControl("bp").SetValue(0);
			BpsnChanged();
		}
		if (cd.als_sig) {
			cd.als_sig = false;
			GetNamedControl("als").SetValue(0);
			AlsChanged();		
		}
		if (cd.ars_sig) {
			cd.ars_sig = false;
			GetNamedControl("ars").SetValue(0);
			ArsChanged(cd.m_simpleMode);
		}
		if (cd.krishka_1) {
			GetNamedControl("krishka_1").SetValue(0);
			cd.krishka_1 = false;
		}
		if (cd.krishka_2) {
			GetNamedControl("krishka_2").SetValue(0);
			cd.krishka_2 = false;
		}
		GetNamedControl("reverser_lever").SetValue(Train.TRACTION_NEUTRAL);
		loco.SetEngineSetting("reverser", Train.TRACTION_NEUTRAL);
		Check_Main_State();		
		SetOpenDoorsLamps();
		InitLamps();
	}
//===========================================================================================================		
	public void UserSetControl(CabinControl p_control, float p_value) {		
		if (cd.m_simpleMode) SetSimpleMode(false);		
		
		string name = p_control.GetName();
Print("UserSetControl:" + name + ", p_value="+p_value);
		if (name == "throttle_lever2" and kv_pos == -1)  LockKB();
		else if (name == "throttle_lever2") {
			PlaySound("kv.wav");
			cd.kb = p_value;
			OnThrottleLever(p_value);
		}
		else if (name == "krishka_1")
			cd.krishka_1 = (p_value == 1.0);
		else if (name == "krishka_2")
			cd.krishka_2 = (p_value == 1.0);
		else if (name == "left_right") {
			PlaySound("switch.wav");
			cd.left_right = p_value;
			SetOpenDoorsLamps();
		}
		else if (name == "otkr_dver1" or name == "otkr_dver2" or name == "otkr_dver3") {
			if (p_value == 1.0) PlaySound("knopka_press.wav");
		}
		else if (name == "otkr_dver1_y" or name == "otkr_dver2_y") {
			if (p_value == 1.0 and ((name == "otkr_dver1_y" and cd.krishka_1) or (name == "otkr_dver2_y" and cd.krishka_2))) {
				PlaySound("knopka_press.wav");
				OpenDoors(false);
			}
		}
		else if (name == "otkr_dver3_y") {
			if (p_value == 1.0) {
				PlaySound("knopka_press.wav");
				OpenDoors(true);
			}
		}
		else if (name == "zakr_dver") {
			PlaySound("bswitch.wav");
			cd.doors_locked = !p_value;
			if (!p_value) CloseDoors();
			SetOpenDoorsLamps();			
		}
		else if (name == "zakr_dver_rezerv") {						
			if (p_value == 1.0) {
				PlaySound("knopka_press.wav");
				CloseDoors();
			}
		}
		else if (name == "a53") {
			PlaySound("switch2.wav");
			cd.kvc_automat = (p_value == 1.0);
			Check_Main_State();
		}
		else if (name == "a49") {
			PlaySound("switch2.wav");
			cd.avar_svet_a49 = (p_value == 1.0);
		}
		else if (name == "batarei") {
			PlaySound("bswitch.wav");
			cd.AKB = (p_value == 1.0);
			BatteryChanged(false);
		}
		else if (name == "rc_1") {
			PlaySound("bswitch.wav");
			cd.rc_1 = (p_value == 1.0);
			Check_Main_State();
		}
		else if (name == "bp") {
			PlaySound("switch.wav");
			cd.BPSN = (p_value == 1.0);
			BpsnChanged();
		}
		else if (name == "mk") {
			PlaySound("switch.wav");
			if (p_value == 1.0) {
				cd.motor_compr = true;
			}

			if (p_value == 0.0) {
				cd.motor_compr = false;
				PostMessageToMyTrain("MK_off");
			}
			//Check_Main_State();
			MotCompChanged();
		}
		else if (name == "mot_kompr_rezerv") {
			PlaySound("knopka_press.wav");
			if (p_value == 1.0) {
				PostMessageToMyTrain("MK_on");
			}
			if (p_value == 0.0) {
				PostMessageToMyTrain("MK_off");
			}
			Check_Main_State();
		}
		else if (name == "ars") {
			PlaySound("switch.wav");
			cd.ars_sig = !!p_value;
			ArsChanged(false);
		}
		else if (name == "als") {
			PlaySound("switch.wav");
			cd.als_sig = !!p_value;
			AlsChanged();
		}
		else if (name == "ars_13v") {
			if (p_value) {
				SetArsOch(true);
				SetArs0(true);
				SetArs4(true);
				SetArs6(true);
				SetArs7(true);
				SetArs8(true);
			}
			if (p_value == 1.0)
				PlaySound("knopka_press.wav");
		}
		else if (name == "osv_kabiny") {
			PlaySound("switch.wav");
			cd.svet_kabina = !!p_value;
		}
		else if (name == "kvt") {
			if (p_value == 1.0) {
				PlaySound("knopka_press.wav");
				KvtPressed();
			}
		}
		else if (name == "kb_dau") {
			if (p_value == 1.0) {
				PlaySound("knopka_press.wav");
				m_arsStopping = false;
			}
		}
		else if (name == "vus") {
			PlaySound("switch.wav");
			cd.vus = (p_value > 0.5);
			VusChanged();
		}
		else if (name == "fari") {
			PlaySound("switch.wav");
			cd.fary = (p_value > 0.5);
			FaryChanged();
		}
		else if (name == "horn") {
			if (p_value == 1.0) {
				if (cd.AKB)
					loco.GetMyTrain().SoundHorn();
				else
					PlaySound("knopka_press.wav");					
			}
		}
		else if (name == "pusk_rezerv" or 
				 name == "signal_neisprav" or 
				 name == "zachtchita_preobr" or 
				 name == "zachtchita_preobr" or 
				 name == "vozvrat_rp" or
				 name == "ars_13v" or
				 name == "radio_13v") {
				 if (p_value == 1.0)
					PlaySound("knopka_press.wav");
		}
		else {
			if (name == "reverser_lever") {
				PlaySound("rev.wav");
			}
			else if (name == "independantbrake_lever") {
				PlaySound("vz-1.wav");
			}
			else if (name == "trainbrake_lever") {
				PlaySound("kran-013.wav");
				cd.trainbrake_lever = p_value;
			}			
			else {
				cd.other.SetNamedTag(name, (p_value == 1.0));			
				PlaySound("switch2.wav");
			}

			inherited(p_control, p_value);
		}
	}
	
	public void UserPressKey(string s) {		
		if (cd.m_simpleMode) SetSimpleMode(false);
		if (s == "train_cabin_aws_reset") { //Alt+space
			PlaySound("knopka_press.wav");
			m_arsStopping = false;
		}
	Print("cd.rabota="+cd.rabota);	
		if (s == "train_cabin_throttle_up")			SetThrottle(1); //W
		else if (s == "train_cabin_throttle_0")		SetThrottle(0); //S
		else if (s == "train_cabin_throttle_down") 	SetThrottle(-1);//X		
		else if (s == "train_cabin_engine_on")		SetTrainPowerState(true);  //Alt+[
		else if (s == "train_cabin_engine_off")		SetTrainPowerState(false); //Alt+]

		inherited(s);
	}
	
	void  OpenDoorsByCommand(bool right) {
		if (!cd.AKB or loco.GetEngineSetting("reverser") == Train.TRACTION_NEUTRAL) return;
		if (cd.doors_locked)  {	
			cd.doors_locked = false;
			GetNamedControl("zakr_dver").SetValue(1);
		}
		if (right) {
			if (cd.krishka_1) {
				GetNamedControl("krishka_1").SetValue(0);
				cd.krishka_1 = false;
			}
			if (cd.krishka_2) {
				GetNamedControl("krishka_2").SetValue(0);
				cd.krishka_2 = false;
			}
		}
		else if (!cd.krishka_1) {
			GetNamedControl("krishka_1").SetValue(1);
			cd.krishka_1 = true;
		}
		
		GetNamedControl("left_right").SetValue(right);		
		OpenDoors(right);		
	}
	
	void CloseDoorsByCommand() {
		if (!cd.AKB or loco.GetEngineSetting("reverser") == Train.TRACTION_NEUTRAL) return;
		if (!cd.doors_locked)  {	
			cd.doors_locked = true;
			GetNamedControl("zakr_dver").SetValue(0);
		}
		if (cd.krishka_1) {
			GetNamedControl("krishka_1").SetValue(0);
			cd.krishka_1 = false;
		}
		if (cd.krishka_2) {
			GetNamedControl("krishka_2").SetValue(0);
			cd.krishka_2 = false;
		}
		CloseDoors();	
	}
	//======== Event Handlers ================================================================================================================
//	void OnLeaveSignal(Message msg) 
//	{
//		Print("OnLeaveSignal");
//	}
	
	void OnDriverMode(Message msg) 
	{
		SetSimpleMode(msg.minor == "DCC");
	}
	
	void OnDriverModule(Message msg) 
	{
		SetSimpleMode(true);
		AddHandler(me, "DriveMode", null, "OnDriverMode");
	}
	
	void OnCtrlMessage(Message msg) 
	{
Print("OnCtrlMessage:"+msg.minor);	
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
	
	void OnMessageFromTrain(Message msg) {
Print("OnMessageFromTrain:"+msg.major+","+msg.minor);	
		if (loco != loco.GetMyTrain().GetFrontmostLocomotive()) return;		
		string cmd = msg.minor;
		if (cmd == "NotifyHeadlights") 		  SetHeadlightData();
		else if (cmd == "StartedMoving") 	  DetectAutopilotThread();
		else if (cmd == "BrakeLightChanged")  SetBrakeLight(GetThrottlePosition());
		else if (cmd == "HorLiftDoorsOpened") m_HorLiftDoorsOpened = true;
		else if (cmd == "HorLiftDoorsClosed") m_HorLiftDoorsOpened = false;
	}
	//========================================================================================================================================
	public void Init() {
		inherited();
		myasset = GetAsset();
		textures = GetAsset().FindAsset("letters");
		throttle_lever2 = GetNamedControl("throttle_lever2");

		AddHandler(me, "DriverModule", "DCC-Panel-Created", "OnDriverModule");
	}
};