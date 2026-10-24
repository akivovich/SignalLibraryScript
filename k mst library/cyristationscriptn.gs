include "CyriStationScript.gs"

class CyriStationScriptN isclass CyriStationScript
{
	void PerformLoadUnloadAction(TrackLoadInfo info, Train train, bool isTerminus, bool fullUnload)
	{
		PassengerStationInfo platformInfo = psi[info.platformIndex];			
		Vehicle[] vehicles = train.GetVehicles();
		
		if (fullUnload and m_bSounds)
			vehicles[0].PlaySoundScriptEvent("door_end");

		Sleep(3);

		if (fullUnload) 
		{
			ProductQueue unloadQueue;
			if (isTerminus) unloadQueue = GetQueue("passengers_off_" + info.platformIndex);
			else			unloadQueue = GetQueue("passengers_on_" + info.platformIndex);
			FullUnload(unloadQueue, vehicles);
		}
		else
		{			
			ProductQueue unloadQueue = GetQueue("passengers_off_" + info.platformIndex);
			ProcessProductLoadAndUnload(unloadQueue, train, ACTION_UNLOADING);
			ProductQueue loadQueue = GetQueue("passengers_on_" + info.platformIndex);
			ProcessProductLoadAndUnload(loadQueue, train, ACTION_LOADING);
		}
		//
		Sleep(Math.Rand(7,15));
		// Close the doors of all the vehicles.
		
		if (!fullUnload and m_bSounds)
			vehicles[0].PlaySoundScriptEvent("door_close");
	}

	public void ProcessStart(Vehicle vehicle, string triggerName, TrackLoadInfo info, bool isTerminus, bool fullUnload)
	{
		Vehicle v;
		Train train = vehicle.GetMyTrain();
		Vehicle[] vehicles = train.GetVehicles();
		int i, len = vehicles.size();
		for (i = 0; i < len; i++)
		{
			v = vehicles[i];
			itcPassengerStation.AddVehicle(v, false);
			v.PlaySoundScriptEvent("door_open");
			if (isTerminus)
			{				
				if (info.trainLeftSide != v.GetDirectionRelativeToTrain())
					v.SetDoorAnimationState("left-passenger-door", true);
				else
					v.SetDoorAnimationState("right-passenger-door", true);			
			}
			else
			{
				v.SetDoorAnimationState("left-passenger-door", true);
				v.SetDoorAnimationState("right-passenger-door", true);						
			}
		}
		
		if (isTerminus)	PerformLoadUnloadAction(info, train, true, true);
		else			PerformLoadUnloadAction(info, train, isTerminus, fullUnload);

		for (i = 0; i < len; i++)
		{
			v = vehicles[i];
			v.SetDoorAnimationState("left-passenger-door", false);
			v.SetDoorAnimationState("right-passenger-door", false);						
		}
		
		if (isTerminus and !fullUnload)
		{
			TurnAroundTrain(train);			
			
			for (i = 0; i < len; i++)
			{
				v = vehicles[i];
				v.PlaySoundScriptEvent("door_open");
				if (info.trainLeftSide != v.GetDirectionRelativeToTrain())
					v.SetDoorAnimationState("left-passenger-door", true);
				else
					v.SetDoorAnimationState("right-passenger-door", true);			
			}
			
			PerformLoadUnloadAction(info, train, isTerminus, false);
		}
		
		Sleep(3);
	}
		
	public void Init(void)
	{
		inherited();
	}
};