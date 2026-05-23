include "common.gs"
include "Signal.gs"
include "trigger.gs"
include "gs.gs"

class TMS_AS isclass Trigger
{
	Signal m_signal;
	bool m_opened = true;
	bool m_thread;
	
	thread void InitSignal()
	{
		int count = 3;
		while (count--)
		{
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
			Sleep(3);
		}
		if (!m_signal) Exception("Signal not found");
	}

	thread void Animate(bool dir)
	{
		if (dir)
		{
			m_opened = true;
			SetMeshAnimationState("default",true);
			int i;
			for (i = 1; i < 30; ++i)
			{
				SetMeshAnimationFrame("default",i,0.12);
				Sleep(0.1);
			}
		}
		else 
		{
			m_opened = false;
			SetMeshAnimationState("default",true);
			int i;
			for (i = 30; i > 1; --i)
			{
				SetMeshAnimationFrame("default",i,0.12);
				Sleep(0.12);
			}
		}
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
	
	void StopTrain(Vehicle v)
	{
		World.PlaySound(GetAsset(), "autostop.wav", 1, 10.0f, 1000.0f, v, "a.bog0");
		Train train = v.GetMyTrain();
		Sleep(0.5);
		World.PlaySound(GetAsset(), "vz.wav", 1, 10.0f, 1000.0f, v, "a.bog0");
		train.SetAutopilotMode(Train.CONTROL_SCRIPT);
		train.SetDCCThrottle(0);
		train.SetTrainBrakes(Train.TRAIN_BRAKE_EMERGENCY);
		while (train.GetVelocity()) Sleep(1);
		train.SetAutopilotMode(Train.CONTROL_MANUAL);
	}

	thread void CheckTrainDistance(Vehicle v) 
	{
		if (m_thread) return;
		m_thread = true;
		GSTrackSearch GSTS;
 		MapObject mo;
		float velocity, timer = 2, distance;
//Interface.Print("CheckTrainDistance-Start:m_opened="+m_opened);
		while (m_thread) 
		{
			if (!m_opened) 
			{
				velocity = Math.Fabs(v.GetVelocity()) * Train.MPH_TO_KPH;
				if (velocity < 10) timer = 1;
				else if (velocity < 30) timer = 0.5;
				else timer = 0.2;
				GSTS = BeginTrackSearch(false);
				while (m_thread) 
				{
					mo = GSTS.SearchNext();
					if (!mo) break;
					if (mo.isclass(Vehicle) and v == mo) 
					{
						distance = GSTS.GetDistance() - (v.GetLength() / 2. + 2.5);
//Interface.Print("CheckTrainDistance:distance="+distance);
						if (distance <= 0) 
						{
							StopTrain(v);
							m_thread = false;
							break;
						}
					}
				}
			}
			Sleep(timer);
		}
//Interface.Print("CheckTrainDistance-Stop");
	}	
	
	void OnTrainEnter(Message msg)
	{
	//Interface.Print("OnTrainEnter");	
		Train train = cast<Train>(msg.src);
		if (train and train.GetAutopilotMode() == Train.CONTROL_MANUAL and CheckTrainDirection(train))
		{
			Vehicle v = train.GetFrontmostLocomotive();
			CheckTrainDistance(v);
		}
	}
	
	void OnTrainLeave(Message msg) 
	{
		m_thread = false;
	}
	
	thread void UpdateState(void)
	{
		while(true)
		{
			Sleep(3);
			bool shouldOpen = !!m_signal.GetSignalState();
			if (m_opened != shouldOpen)
				Animate(shouldOpen);
		}
	}
	
	public void Init (Asset asset)
	{
		SetMeshAnimationFrame("default", 1, 0);
		InitSignal();
		UpdateState();
		AddHandler(me, "Object", "Enter",  "OnTrainEnter");
		AddHandler(me, "Object", "Leave",  "OnTrainLeave");
	}
};