include "common.gs"
include "Signal.gs"
include "trigger.gs"
include "gs.gs"

class TMS_AS isclass Trigger
{
	Signal  m_signal;
	Train   m_train;

	bool  m_bDebug;
	bool  m_bOpened = true;
	bool  m_bAnimation = false;
	bool  m_bWaiting = false;

	bool IsDebug()
	{
		string name = GetName();
		return name[0,2] == "t_";
	}

	void Print(string s) 
	{
	 	Interface.Print("Autostop::"+GetName()+"::"+s);
	}

	thread void Animate()
	{
		if (m_bAnimation) return;
		m_bAnimation = true;
		if (m_bDebug) Print("Animate:dir="+m_bOpened+",name="+m_signal.GetName()+",state="+m_signal.GetSignalState());
		if (m_bOpened)	SetMeshAnimationFrame("default", 30, 1.5);
		else			SetMeshAnimationFrame("default",  2, 1.5);
		m_bAnimation = false;
	}

	void UpdateState(bool force)
	{
		bool shouldOpen = !!m_signal.GetSignalState();
		if (m_bDebug) Print("UpdateState:shouldOpen="+shouldOpen+",name="+m_signal.GetName()+",state="+m_signal.GetSignalState());
		if (!force and m_bOpened == shouldOpen)	return;
		m_bOpened = shouldOpen;
		Animate();
	}

	thread void WaitingAnimation() 
	{
		if (m_bWaiting) return;
		m_bWaiting = true;
		while (m_bAnimation) Sleep(3);
		m_bWaiting = false;
		UpdateState(false);
	}

	thread void InitSignal()
	{
		int count = 3;
		while (count--)
		{
			Sleep(3);
			GSTrackSearch GSTS = BeginTrackSearch(true);
			MapObject mo = GSTS.SearchNext();
			while(mo)
			{
				if (mo.isclass(Signal) and GSTS.GetFacingRelativeToSearchDirection())
				{
					m_signal = cast<Signal>mo;
					break;
				}
				mo=GSTS.SearchNext();
			}
			if (m_signal) break;
		}
		if (!m_signal) Exception("Signal not found");
		if (m_bDebug) ("InitSignal:name="+m_signal.GetName()+",state="+m_signal.GetSignalState());
		AddHandler(me, "Signal", "StateChanged", null);
		AddHandler(me, "Signal", "StateChanged", "OnSignalStateChanged");
		UpdateState(true);
	}

	public void SetProperties(Soup db) 
	{
		inherited(db);
		InitSignal();
	}

	bool CheckTrainDirection(Train train)
	{
		bool found = false;
		GSTrackSearch GSTS = BeginTrackSearch(false);
 		MapObject mo = GSTS.SearchNext();
		while (mo) 
		{
			if ((mo.isclass(Vehicle)) and (!GSTS.GetFacingRelativeToSearchDirection())) 
			{
				found = (cast<Vehicle>(mo) == train.GetFrontmostLocomotive());
				break;
			}
			mo = GSTS.SearchNext();
		}
		return found;
	}
	
	void StopTrain()
	{
		if (m_bDebug) Print("StopTrain");
		Vehicle v = m_train.GetFrontmostLocomotive();
		World.PlaySound(GetAsset(), "autostop.wav", 1, 10.0f, 1000.0f, v, "a.bog0");
		Sleep(0.5);
		World.PlaySound(GetAsset(), "vz.wav", 1, 10.0f, 1000.0f, v, "a.bog0");
		m_train.SetAutopilotMode(Train.CONTROL_SCRIPT);
		m_train.SetDCCThrottle(0);
		m_train.SetTrainBrakes(Train.TRAIN_BRAKE_EMERGENCY);
		while (m_train.GetVelocity()) Sleep(1);
		m_train.SetAutopilotMode(Train.CONTROL_MANUAL);
		PostMessage(null, "Autostop", "StopTrain", 0);
	}

	thread void CheckTrainDistance() 
	{
		if (!m_train) return;
		Vehicle v;
		GSTrackSearch GSTS;
 		MapObject mo;
		float velocity, distance, timer = 2;
		if (m_bDebug) Print("CheckTrainDistance-Start:m_bOpened="+m_bOpened);
		while (m_train)
		{
			if (!m_bOpened) 
			{
				v = m_train.GetFrontmostLocomotive();		
				velocity = Math.Fabs(v.GetVelocity()) * Train.MPH_TO_KPH;
				if (velocity < 10) timer = 1;
				else if (velocity < 30) timer = 0.5;
				else timer = 0.2;
				GSTS = BeginTrackSearch(false);
				while (m_train) 
				{
					mo = GSTS.SearchNext();
					if (!mo) break;
					if (v == mo)
					{
						distance = GSTS.GetDistance() - (v.GetLength() / 2. + 2.5);
						if (m_bDebug) Print("CheckTrainDistance:distance="+distance);
						if (distance <= 0)
						{
							StopTrain();
							m_train = null;
							break;
						}
					}
				}
			}
			Sleep(timer);
		}
		if (m_bDebug) Print("CheckTrainDistance-Stop");
	}	
	
	void OnTrainEnter(Message msg)
	{
		if (m_bDebug) Print("OnTrainEnter");	
		Train train = cast<Train>(msg.src);
		if (train and train.GetAutopilotMode() == Train.CONTROL_MANUAL and CheckTrainDirection(train))
		{
			if (m_bDebug) Print("OnTrainEnter::OK");
			m_train = train;
			CheckTrainDistance();
		}
	}
	
	void OnTrainLeave(Message msg)
	{
		if (m_bDebug) Print("OnTrainLeave");	
		m_train = null;
	}
	
	void OnSignalStateChanged(Message msg)
	{
		if (msg.src != m_signal) return;
		if (m_bDebug) Print("OnSignalStateChanged:name="+m_signal.GetName()+",state="+m_signal.GetSignalState());
		if (m_bAnimation) WaitingAnimation();
		else			  UpdateState(false);
	}
	
	public void Init (Asset asset)
	{
		inherited(asset);
		SetMeshAnimationFrame("default", 2, 0);
		m_bDebug = IsDebug();
		AddHandler(me, "Object", "Enter", "OnTrainEnter");
		AddHandler(me, "Object", "Leave", "OnTrainLeave");
	}
};