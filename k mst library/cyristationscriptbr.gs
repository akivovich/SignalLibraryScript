include "CyriStationScript.gs"

class CyriStationScriptBr isclass CyriStationScript
{
	Asset m_product;
	Train m_train;
	Vehicle m_vehicle;
	
	bool SetVehicle(Vehicle v, bool fullUnload)
	{

//Interface.Print("v="+v.GetName());
		
		ProductFilter filter;

		ProductQueue[] vehicleQueues = v.GetQueues();
		ProductQueue vehicleQueue;
		int i, len = vehicleQueues.size();
		for (i = 0; i < len; i++)
		{
			vehicleQueue = vehicleQueues[i];
			filter = vehicleQueue.GetProductFilter();
			if (filter.DoesAcceptProduct(m_product) and (!fullUnload or vehicleQueue.GetQueueCount()))
			{
				m_vehicle = v;
//Interface.Print("OK:Space="+vehicleQueues[i].GetQueueSpace()+",Count="+vehicleQueues[i].GetQueueCount());				
				return true;
			}
		}
		return false;

	}
		
	void InitBrigada()
	{
		bool fullUnload = (!itc.IsTrainCommand(m_train, Industry.LOAD_COMMAND) and itc.IsTrainCommand(m_train, Industry.UNLOAD_COMMAND));
		if (!fullUnload)
		{
			ProductQueue productQueue = GetQueue("passengers_on_0");
			productQueue.CreateProduct(m_product, productQueue.GetQueueSpace());
//Interface.Print("Off:Space="+productQueue.GetQueueSpace()+",Count="+productQueue.GetQueueCount());
			//SetProcessEnabled("passenger_spawn_0", true);
		}
	}
	
	void SetNewTrain(Train train)
	{
		m_train = train;
		Vehicle[] vehicles = train.GetVehicles();
		bool set = false;
		bool fullUnload = (!itc.IsTrainCommand(train, Industry.LOAD_COMMAND) and itc.IsTrainCommand(train, Industry.UNLOAD_COMMAND));
		
		int i, len = vehicles.size();		
		int ilen = len - 1;
		
		if (len > 2)
		{
			for (i = 1; i < ilen and !set; i++)
			{
				set = SetVehicle(vehicles[i], fullUnload);				
			}
		}
		
		if (!set) set = SetVehicle(vehicles[0], fullUnload);
		if (!set) set = SetVehicle(vehicles[ilen], fullUnload);
		if (!set) m_vehicle = null;
		//else 	  InitBrigada();
	}
	
	bool TriggerSupportsMassStoppedLoad(Vehicle vehicle, string triggerName)
	{
		bool vehicleToTrain = !vehicle.GetDirectionRelativeToTrain();
		Train train = vehicle.GetMyTrain();
		
		if (triggerName == "trigger_track_one_a" or triggerName == "trigger_track_one_b" or triggerName == "trigger_track_one_c")
		{
			if (train.IsStopped())
			{
				bool fullUnload = (!itc.IsTrainCommand(train, Industry.LOAD_COMMAND) and itc.IsTrainCommand(train, Industry.UNLOAD_COMMAND));
				return SetVehicle(vehicle, fullUnload);
			}
		}

		if (triggerName == "trigger_track_one_a" or triggerName == "trigger_track_one_c")
		{
			if (itc.IsTrainCommand(train, Industry.LOAD_COMMAND) != itc.IsTrainCommand(train, Industry.UNLOAD_COMMAND))
			{
				if (train != m_train)
					SetNewTrain(train);
				
				if (vehicle == m_vehicle)
				{			
					int direction = vehicle.GetRelationToTrack(me, "track_one");
					if (!vehicleToTrain)
						direction = -direction;

					if (direction == Vehicle.DIRECTION_BACKWARD and triggerName == "trigger_track_one_c")
						return true;		
					if (direction == Vehicle.DIRECTION_FORWARD and triggerName == "trigger_track_one_a")
						return true;
				}
			}
		}

		return false;
	}
	
	bool PerformMassStoppedLoad(Vehicle vehicle, string triggerName)
	{
		if (itcPassengerStation.IsAlreadyAdded(vehicle))
			return false;

		TrackLoadInfo info = GetTrackAndSide(vehicle, triggerName);
		
		if (!info.trackName)
			return false;
		
		if (vehicle == m_vehicle)
		{
			Train train = vehicle.GetMyTrain();
			ProductQueue prod;
			bool load = itc.IsTrainCommand(train, Industry.LOAD_COMMAND),
				 unload = itc.IsTrainCommand(train, Industry.UNLOAD_COMMAND);
			bool isCommand = (load != unload);
			bool fullUnload = (!load and unload);
			PassengerStationInfo platformInfo = psi[info.platformIndex];			

			itcPassengerStation.AddVehicle(vehicle, false);
			
			if (!isCommand)
			{
				fullUnload = vehicle.GetQueues()[0].GetQueueCount();				
			}
			
			if (!fullUnload)
			{
				InitBrigada();
				Sleep(3);
			}
				
			
			vehicle.PlaySoundScriptEvent("door_open");
		
			if (info.trainLeftSide != vehicle.GetDirectionRelativeToTrain())
				vehicle.SetDoorAnimationState("left-door", true);
			else
				vehicle.SetDoorAnimationState("right-door", true);
						
			
			if (fullUnload)
			{
				Sleep(3);
				ProductQueue unloadQueue = GetQueue("passengers_off_" + info.platformIndex);
				FullUnload(unloadQueue, vehicle);
			}
			else
			{							
				Sleep(3);
				ProductQueue loadQueue = GetQueue("passengers_on_" + info.platformIndex);
				LoadingReport report = CreateLoadingReport(loadQueue, loadQueue.GetQueueCount());
				vehicle.LoadProduct(report);
				if (loadQueue.GetQueueCount() != 0) 
				{
					loadQueue.DestroyAllProducts();
				}				
			}
			
			Sleep(10);
			
			vehicle.SetDoorAnimationState("left-door", false);
			vehicle.SetDoorAnimationState("right-door", false);
			itcPassengerStation.RemoveVehicle(vehicle);

			Sleep(5);
			PostMessage(vehicle.GetMyTrain(), "HandleTrain", "Release", 1.0);
			
			return true;
		}
		return false;
	}
	
	public void Init(void)
	{
		inherited();
		m_bShowSoundsProperty = m_bSounds = false;
		ProductQueue productQueue = GetQueue("passengers_on_0");
		m_product = productQueue.GetProductList()[0];
	}
};