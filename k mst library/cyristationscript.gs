include "GenericPassengerStation.gs"

class CyriTrackLoadInfo
{
	public string triggerName;
	public TrackLoadInfo info; 
};

class CyriStationScript isclass GenericPassengerStation
{
	int m_Tracks;
	Asset  m_LibraryAsset;
	bool m_bSounds;
	bool m_bShowSoundsProperty = true;
	
	bool[] m_busy = new bool[2];
	bool[] m_busyPlatform = new bool[2];
	
	//bool m_Debug;
	
	//#region Debug ============================================================================================
	void Debug(string name, int side, string info)
	{
		//if (!m_Debug) return;
		//		if (GetName() == "s2-Sadovaa")// or GetName() == "s2-Sport")
		Interface.Print("CyriStationScript::"+name+"::"+side+"::"+info);
	}	
	void Debug(string name, string info)
	{
		//if (!m_Debug) return;
		//		if (GetName() == "s2-Sadovaa")// or GetName() == "s2-Sport")
		Interface.Print("CyriStationScript::"+name+"::"+info);
	}	
	//#endregion Debug
	//#region View Details =====================================================================================
	string GetDetailsRow(string html)
	{
		return "<tr>"+ html +"</tr>";
	}

	string GetDetailsColText(string text)
	{
		return "<td><font color=#B8B8B8>" + text + "</font></td>";
	}

	string GetDetailsColLink(string id, string text)
	{
		return "<td><font color=#B8B8B8><b><a href='live://"+id+"'>" + text + "</a></b></font></td>";
	}

	string GetViewDetailsInt(StringTable ST) 
	{
		return HTMLWindow.MakeRow(HTMLWindow.MakeCell(""));
	}

	string getViewDetails()
	{
		StringTable stringTable = m_LibraryAsset.GetStringTable();
		return HTMLWindow.MakeTable(GetViewDetailsInt(stringTable), "width=100% cellspacing=1");
	}
	
	string GetViewDetailsHTMLCode() 
	{
		return inherited() + getViewDetails();
	}
	//#endregion View Details
	//#region Process ==========================================================================================
	int  GetSideByTrigger(string triggerName)
	{
//Interface.Print("GetSideByTrigger:"+triggerName);
		if (triggerName == "") return -2;
		string name = Str.Tokens(triggerName, "_")[2];
		if (name == "one") return 0; 
		return 1;
	}
	
	thread void PerformStopped(Vehicle vehicle, string triggerName)
	{
		if (m_busy[GetSideByTrigger(triggerName)]) return;
		if (itc.IsLockedVehicle(vehicle))
		{
			// this vehicle is already involved in some other loading.
			// probably caused by having two overlapping triggers both calling PerformStopped.
			Interface.Log("BaseIndustry.PerformStopped> vehicle already locked");
			return;
		}

		Interface.Log("BaseIndustry.PerformStopped");

		bool isUnderScriptControl = itc.IsControllingVehicle(vehicle);

		// Ensure we only lock and unlock on the same train.
		Train myTrain = vehicle.GetMyTrain();
		myTrain.IncTrainBusy();

		// Ensure the user can't take control of the train while it is loading
		if (!isUnderScriptControl)
			itc.AddVehicle(vehicle, true);

		// Stop the train
		itc.AddVehicleLock(vehicle);
		itc.SetVehicleSpeed(vehicle, 0.0f);
    
    	PerformStoppedLoad(vehicle, triggerName);
		PostMessage(me, "GenericIndustry", "LoadComplete", 0.0f);

		itc.RemoveVehicleLock(vehicle);

    	myTrain.DecTrainBusy();

		if (itc.RemoveVehicle(vehicle))
			PostMessage(vehicle.GetMyTrain(), "HandleTrain", "Release", 1.0);
		else if (isUnderScriptControl and !itc.IsTrainLocked(vehicle.GetMyTrain()))
			itc.SetVehicleSpeed(vehicle, m_trainLoadingSpeed);
    
		Interface.Log("BaseIndustry.PerformStopped- done");
	}
	
	void PerformStoppedNoTrigger(Vehicle vehicle)
	{
//		if (m_busy[GetSideByTrigger(triggerName)]) return;
//		inherited(vehicle);	
	}
	
	thread void PerformMassStopped(Vehicle vehicle, string triggerName)
	{
		if (m_busy[GetSideByTrigger(triggerName)])	return;		
		
		Train myTrain = vehicle.GetMyTrain();
		
//Debug(me.GetName(), GetSideByTrigger(triggerName), "PerformMassStopped-1:"+triggerName+"v="+vehicle.GetName());

		if (itc.IsLockedVehicle(vehicle))
		{
			// this vehicle is already involved in some other loading.
			// probably caused by having two overlapping triggers both calling PerformStopped.
			return;
		}

//Debug(me.GetName(), GetSideByTrigger(triggerName), "PerformMassStopped-2");

		bool isUnderScriptControl = itc.IsControllingVehicle(vehicle);

		myTrain.IncTrainBusy();

		// Ensure the user can't take control of the train while it is loading
		if (!isUnderScriptControl)
			itc.AddVehicle(vehicle, true);

		// Stop the train
		itc.AddVehicleLock(vehicle);
		itc.SetVehicleSpeed(vehicle, 0.0f);

		ThreadPerformMassStoppedLoad(vehicle, triggerName);
	}
	//============================================================================	
	bool TriggerSupportsMassStoppedLoad(Vehicle vehicle, string triggerName)
	{
		bool vehicleToTrain = !vehicle.GetDirectionRelativeToTrain();
		
//Debug(me.GetName(), GetSideByTrigger(triggerName), "TriggerSupportsMassStoppedLoad-1:"+triggerName+",v="+vehicle.GetName());

		if (triggerName == "trigger_track_one_a" or triggerName == "trigger_track_one_c")
		{
			int direction = vehicle.GetRelationToTrack(me, "track_one");
			if (!vehicleToTrain)
				direction = -direction;

			if (direction == Vehicle.DIRECTION_BACKWARD and triggerName == "trigger_track_one_c")
				return true;		
			if (direction == Vehicle.DIRECTION_FORWARD and triggerName == "trigger_track_one_a")
				return true;
		}
		else if (triggerName == "trigger_track_two_a" or triggerName == "trigger_track_two_c")
		{
			int direction = vehicle.GetRelationToTrack(me, "track_two");
			if (!vehicleToTrain)
				direction = -direction;

			if (direction == Vehicle.DIRECTION_BACKWARD and triggerName == "trigger_track_two_c")
				return true;
		
			if (direction == Vehicle.DIRECTION_FORWARD and triggerName == "trigger_track_two_a")
				return true;
		}

		if (triggerName == "trigger_track_one_a" or triggerName == "trigger_track_one_b" or triggerName == "trigger_track_one_c" or triggerName == "trigger_track_two_a" or triggerName == "trigger_track_two_b" or triggerName == "trigger_track_two_c")
		{
			if (vehicle.GetMyTrain().IsStopped())
				return true;
		}


//Debug(me.GetName(), GetSideByTrigger(triggerName),"TriggerSupportsMassStoppedLoad-2");

		return false;
	}
	
	public bool ShouldMoveTrain(Train train)
	{
		bool supportsMassStoppedLoad = false;
		Vehicle[] vehicles = train.GetVehicles();
		int i, len = vehicles.size();
		string triggerName;
		
		for (i = 0; i < len and !supportsMassStoppedLoad; i++)
		{
			triggerName = FindTriggerContainingNode(vehicles[i].GetId(), true);
			supportsMassStoppedLoad = (triggerName != "" and TriggerSupportsMassStoppedLoad(vehicles[i], triggerName));
//Interface.Print("ShouldMoveTrain:i="+i+",Trigger="+FindTriggerContainingNode(vehicles[i].GetId(), true)+",res="+supportsMassStoppedLoad);
		}
		
//Interface.Print("ShouldMoveTrain:res="+!supportsMassStoppedLoad);
		return !supportsMassStoppedLoad;
	}

	int FullUnload(ProductQueue prod, Vehicle v)
	{
		int k, passengersCount = 0;
		ProductQueue[] vehicleQueues = v.GetQueues();
		for (k = 0; k < vehicleQueues.size(); k++)
		{
			ProductQueue vehicleQueue = vehicleQueues[k];
			passengersCount = passengersCount + vehicleQueue.GetQueueCount();
			vehicleQueue.DestroyAllProducts();
		}
    	ProductFilter passengerFilter = prod.GetProductFilter();
		prod.CreateProduct(passengerFilter.GetProducts()[0], passengersCount);
		return passengersCount;
	}
	
	int FullUnload(ProductQueue prod, Vehicle[] vehicles)
	{
    	int i, len = vehicles.size();
		int passengersCountInTrain = 0;
    	for (i = 0; i < len; i++)
    	{
			passengersCountInTrain = passengersCountInTrain + FullUnload(prod, vehicles[i]);
    	}
		return passengersCountInTrain;
	}
	
	bool PerformProductLoad(ProductQueue queue, Vehicle vehicle, int maxPassengers)
	{
		ProductQueue[] vehicleQueues = vehicle.GetQueues();
		if (!vehicleQueues.size()) return true;
		ProductFilter filter, stationFilter = queue.GetProductFilter();
		int passengersInStation, maxPassengersToLoad, passengersToLoad, passengers = 0;
		ProductQueue vehicleQueue;
		int i, len = vehicleQueues.size();
		for (i = 0; i < len and passengers < maxPassengers; i++)
		{
			passengersInStation = queue.GetQueueCount();
			if (!passengersInStation) return false;
			vehicleQueue = vehicleQueues[i];
			maxPassengersToLoad = vehicleQueue.GetQueueSpace();
			if (!maxPassengersToLoad) continue;
			if (passengersInStation > maxPassengersToLoad) passengersInStation = maxPassengersToLoad;
			passengersToLoad = Math.Min(Math.Rand(0, passengersInStation), maxPassengers);
			if (!passengersToLoad) continue;
			queue.DestroyProductMatching(stationFilter, passengersToLoad);
			filter = vehicleQueue.GetProductFilter();
			vehicleQueue.CreateProduct(filter.GetProducts()[0], passengersToLoad);
			passengers = passengers + passengersToLoad;
		}
		return true;
	}	
	
	void PerformProductUnload(ProductQueue queue, Vehicle vehicle)
	{
		ProductQueue[] vehicleQueues = vehicle.GetQueues();
		if (!vehicleQueues.size()) return;
		ProductFilter filter, stationFilter = queue.GetProductFilter();
		int passengersInVehicle, maxPassengersToUnload, passengersToUnload;	
		ProductQueue vehicleQueue;
		int i, len = vehicleQueues.size();
		for (i = 0; i < len; i++)
		{
			maxPassengersToUnload = queue.GetQueueSpace();
			if (!maxPassengersToUnload) break;
			vehicleQueue = vehicleQueues[i];
			passengersInVehicle = vehicleQueue.GetQueueCount();
			if (!passengersInVehicle) continue;
			if (passengersInVehicle > maxPassengersToUnload) passengersInVehicle = maxPassengersToUnload;
			passengersToUnload = Math.Rand(0, passengersInVehicle);
			if (!passengersToUnload) continue;			
			filter = vehicleQueue.GetProductFilter();
			vehicleQueue.DestroyProductMatching(filter, passengersToUnload);						
			queue.CreateProduct(stationFilter.GetProducts()[0], passengersToUnload);			
		}
	}	
	
	void ProcessProductLoadAndUnload(ProductQueue queue, Train train, int action)
	{
    	Vehicle[] vehicles = train.GetVehicles();
		int i, len = vehicles.size();
    	if (action == ACTION_LOADING)
		{
			int maxPassengers = queue.GetQueueSize() / (len + 1) + 1;
			for (i = 0; i < len; i++)
			{
				if (!PerformProductLoad(queue, vehicles[i], maxPassengers)) break;
			}
		}
		else
		{
			for (i = 0; i < len; i++)
			{
				PerformProductUnload(queue, vehicles[i]);
			}
		}
	}
	
	public void PerformLoadUnloadAction(TrackLoadInfo info, Train train, bool isTerminus, bool fullUnload, bool onlyLoad)
	{
//Debug(me.GetName(), info.platformIndex, "PerformLoadUnloadAction");
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
			if (!onlyLoad)
			{
				ProductQueue unloadQueue = GetQueue("passengers_off_" + info.platformIndex);
				ProcessProductLoadAndUnload(unloadQueue, train, ACTION_UNLOADING);
			}
			ProductQueue loadQueue = GetQueue("passengers_on_" + info.platformIndex);
			ProcessProductLoadAndUnload(loadQueue, train, ACTION_LOADING);
		}
		//
		Sleep(Math.Rand(4,7));		
	}
	
	public TrackLoadInfo GetTrackAndSide(Vehicle vehicle, string triggerName)
	{
		Soup conf = GetAsset().GetConfigSoup().GetNamedSoup("string-table");
		bool rightPlatforms = conf.GetNamedTagAsBool("right-platforms", false);
		TrackLoadInfo retInfo = new TrackLoadInfo();
		
		string name = Str.Tokens(triggerName, "_")[2];
		
		if (name == "one")
		{
			retInfo.trackName = "track_one";
			retInfo.trainLeftSide = (vehicle.GetRelationToTrack(me, retInfo.trackName) != Vehicle.DIRECTION_BACKWARD) == vehicle.GetDirectionRelativeToTrain();
			if (rightPlatforms)
				retInfo.trainLeftSide = !retInfo.trainLeftSide;
			retInfo.platformIndex = 0;
		}
		else if (name == "two")
		{
			retInfo.trackName = "track_two";
			retInfo.trainLeftSide = (vehicle.GetRelationToTrack(me, retInfo.trackName) != Vehicle.DIRECTION_BACKWARD) == vehicle.GetDirectionRelativeToTrain();
			if (rightPlatforms)
				retInfo.trainLeftSide = !retInfo.trainLeftSide;
			retInfo.platformIndex = 1;
		}
		
		return retInfo;
	}
	
    CyriTrackLoadInfo GetTrackLoadInfo(Train train)
	{
		Vehicle[] vehicles = train.GetVehicles();		
		string triggerName = "";
		int i, len = vehicles.size();
		CyriTrackLoadInfo retInfo = new CyriTrackLoadInfo();
		
		for (i = 0; i < len and triggerName == ""; i++)
		{
			triggerName = FindTriggerContainingNode(vehicles[i].GetId(),true);
		}
		
		retInfo.triggerName = triggerName;
		if (i < len) retInfo.info = GetTrackAndSide(vehicles[i], triggerName);

		return retInfo;
	}

	void TurnAroundTrain(Train train)
	{
		Vehicle[] vehicles = train.GetVehicles();
		Vehicle first = vehicles[0];
		Vehicle last = vehicles[vehicles.size()-1];
		
		train.SetHeadlightState(false);
		Sleep(5);
		PostMessage(first, "Locomotive", "HideDriver", 0.2);
		PostMessage(last, "Locomotive", "HideDriver", 0.2);
		Sleep(Math.Rand(20,30));
		train.Turnaround();
		PostMessage(first, "Locomotive", "ShowDriver", 0.2);
		PostMessage(last, "Locomotive", "ShowDriver", 0.2);
		Sleep(5);
		train.SetHeadlightState(true);				
	}
	
	public bool IsTerminus(int platformIndex);

	public void ProcessStart(Vehicle vehicle, string triggerName, TrackLoadInfo info, bool isTerminus, bool fullUnload)
	{
//Debug(me.GetName(), info.platformIndex, "ProcessStart");
		Vehicle v;
		Train train = vehicle.GetMyTrain();
		Vehicle[] vehicles = train.GetVehicles();
		int i, len = vehicles.size();
		
		for (i = 0; i < len; i++)
		{
			v = vehicles[i];
			vehicle.PlaySoundScriptEvent("door_open");
		
			if (info.trainLeftSide == v.GetDirectionRelativeToTrain())
				v.SetDoorAnimationState("left-passenger-door", true);
			else
				v.SetDoorAnimationState("right-passenger-door", true);
		}
		
		PerformLoadUnloadAction(info, train, isTerminus, fullUnload, false);
		
		if (isTerminus and !fullUnload)
		{
			TurnAroundTrain(train);
			PerformLoadUnloadAction(info, train, true, false, true);
		}	
	}
	
	public void ProcessFinish(Vehicle vehicle, string triggerName, bool fullUnload)
	{
//Debug(me.GetName(), GetSideByTrigger(triggerName),"ProcessFinish");
		Vehicle v;
		Vehicle[] vehicles = vehicle.GetMyTrain().GetVehicles();
		int i, len = vehicles.size();
		
		if (!fullUnload and m_bSounds)
			vehicle.PlaySoundScriptEvent("door_close");

		for (i = 0; i < len; i++)
		{
			v = vehicles[i];
			v.SetDoorAnimationState("left-passenger-door", false);
			v.SetDoorAnimationState("right-passenger-door", false);
		}
		
		Sleep(5);	
	}
			
	bool PerformMassStoppedLoadInternal(Vehicle vehicle, string triggerName, TrackLoadInfo info)
	{
		Train train = vehicle.GetMyTrain();
		if (!itc.IsTrainCommand(train, "nothing"))
		{
//Debug(vehicle.GetName(), GetSideByTrigger(triggerName),"PerformMassStoppedLoadInternal");		
			bool isTerminus = IsTerminus(info.platformIndex);
			bool fullUnload = (!itc.IsTrainCommand(train, Industry.LOAD_COMMAND) and itc.IsTrainCommand(train, Industry.UNLOAD_COMMAND));
			ProcessStart(vehicle, triggerName, info, isTerminus, fullUnload);
			ProcessFinish(vehicle, triggerName, fullUnload);
		}
		PostMessage(vehicle.GetMyTrain(), "HandleTrain", "Release", 1.0);		
		return true;
	}
	
	bool PerformMassStoppedLoad(Vehicle vehicle, string triggerName)
	{
		bool res;
		Train train = vehicle.GetMyTrain();

//GameObject obj = train.GetLastVisitedIndustry();
//string n = "none";
//if (obj)  n = obj.GetName();		
//Debug(me.GetName(),GetSideByTrigger(triggerName),"PerformMassStoppedLoad::triggerName="+triggerName+",train.GetLastVisitedIndustry()="+n);
	
		if (me != train.GetLastVisitedIndustry())
		{
			res = true;
		}
		else
		{

//Debug(me.GetName(),GetSideByTrigger(triggerName),"PerformMassStoppedLoad::m_busyPlatform[1]="+m_busyPlatform[1]+",m_busyPlatform[0]="+m_busyPlatform[0]);
	
			TrackLoadInfo info = GetTrackAndSide(vehicle, triggerName);
			if (!info.trackName)
				return false;

			if (m_busyPlatform[info.platformIndex])
			{
				while(m_busyPlatform[info.platformIndex])
				{				
					Sleep(1);
				}
	//Interface.Print(vehicle.GetName()+":Wait="+m_busyPlatform[info.platformIndex]);
				return true;
			}
//Debug(me.GetName(),GetSideByTrigger(triggerName),"PerformMassStoppedLoad::start1");
			m_busyPlatform[info.platformIndex] = true;
			res = PerformMassStoppedLoadInternal(vehicle, triggerName, info);
			m_busyPlatform[info.platformIndex] = false;
//Debug(me.GetName(),GetSideByTrigger(triggerName),"PerformMassStoppedLoad::end1");			
			train.SetLastVisitedBuildable(null);
		}
//Interface.Print(vehicle.GetName()+":PerformMassStoppedLoad="+res);
		return res;
	}
	
	thread void ThreadPerformMassStoppedLoad(Vehicle vehicle, string triggerName)
	{
//		Interface.Log("* ThreadPerformMassStoppedLoad::vehicle = " + vehicle.GetLocalisedName());
		Train myTrain = vehicle.GetMyTrain();
		bool loadingAllDone = PerformMassStoppedLoad(vehicle, triggerName);
		itc.RemoveVehicleLock(vehicle);
		myTrain.DecTrainBusy();
		itc.RemoveVehicle(vehicle);		
		if (loadingAllDone)
		{
			PostMessage(myTrain, "HandleTrain", "Release", 1.0);
			PostMessage(me, "GenericIndustry", "LoadComplete", 0.0f);
		}
	}
	
	public void AppendDriverDestinations(string[] destNames, string[] destTracks)
	{		
		if (m_Tracks > 1)
		{
			StringTable stringTable = m_LibraryAsset.GetStringTable();
			destNames[destNames.size()] = stringTable.GetString("cyristation01");
			destTracks[destTracks.size()] = "track_one";
			destNames[destNames.size()] = stringTable.GetString("cyristation02");
			destTracks[destTracks.size()] = "track_two";
		}
	}	
	
	public bool IsPlaySounds()
	{
		return m_bSounds;
	}
	
	public bool IsTerminus(int platformIndex)
	{
		PassengerStationInfo platformInfo = psi[platformIndex];			
		return (platformInfo.GetStationType() == PassengerStationInfo.TERMINUS_STATION);
	}
	//#endregion Process
	//#region API ==============================================================================================
	void OpenDoorsInternal(Train srcTrain, string triggerName)
	{		
	}
	
	void OpenDoors(Train train, TrackLoadInfo trackLoadInfo, string mode, string triggerName)
	{		
//Debug(me.GetName(), trackLoadInfo.platformIndex, "OpenDoors");
		Vehicle[] vehicles = train.GetVehicles();								
		Vehicle vehicle = vehicles[0];
		Vehicle v;
		int i, len = vehicles.size();

		OpenDoorsInternal(train, triggerName);

		bool  left = (mode == "L") or (mode == "S" and trackLoadInfo.trainLeftSide);
		bool  both = (mode == "B");
						
		for (i = 0; i < len; i++)
		{
			v = vehicles[i];
			vehicle.PlaySoundScriptEvent("door_open");
			
			if (both)
			{
				v.SetDoorAnimationState("left-passenger-door", true);
				v.SetDoorAnimationState("right-passenger-door", true);
			}
			else
			{			
				if (left == v.GetDirectionRelativeToTrain())
					v.SetDoorAnimationState("left-passenger-door", true);
				else
					v.SetDoorAnimationState("right-passenger-door", true);
			}
		}		
	}

	void CloseDoorsInternal(Train srcTrain, string triggerName)
	{		
	}
	
	void CloseDoors(Train train, string triggerName)
	{		
//Debug(me.GetName(),GetSideByTrigger(triggerName),"CloseDoors");
		Vehicle[] vehicles = train.GetVehicles();								
		Vehicle v;
	
		int i, len = vehicles.size();
		
		for (i = 0; i < len; i++)
		{
			v = vehicles[i];
			v.SetDoorAnimationState("left-passenger-door", false);
			v.SetDoorAnimationState("right-passenger-door", false);
		}						
		
		CloseDoorsInternal(train, triggerName);

		Sleep(6.0);
	}
		
	public thread void HandleLoadUnload(Train train, string mode, string method)
	{	
//Debug(me.GetName(),-1, "HandleLoadUnload:mode="+mode+",method="+method);
		CyriTrackLoadInfo trackInfo = GetTrackLoadInfo(train);
		string triggerName = trackInfo.triggerName;
//Debug(me.GetName(),trackInfo.info.platformIndex,"HandleLoadUnload::mode="+mode+"method="+method);
		if (triggerName == "" or m_busy[trackInfo.info.platformIndex]) return;
//Debug(me.GetName(),trackLoadInfo.platformIndex, "HandleLoadUnload::start");		
		TrackLoadInfo trackLoadInfo = trackInfo.info;
		m_busy[trackLoadInfo.platformIndex] = true;
		
		train.SetAutopilotMode(Train.CONTROL_SCRIPT);
		train.SetDCCThrottle(0.0);
		
		Sleep(1.5);
				
		Vehicle v = train.GetVehicles()[0];
		bool isTerminus = IsTerminus(trackLoadInfo.platformIndex);
		
		if (mode == "S" or mode == "R" or mode == "L" or mode == "B")
		{
			if (method == "U" and IsPlaySounds())
				v.PlaySoundScriptEvent("door_end");
			OpenDoors(train, trackLoadInfo, mode, triggerName);
			if (method == "L")
			{
//Debug(me.GetName(),-1, "PerformLoadUnloadAction");
				PerformLoadUnloadAction(trackLoadInfo, train, isTerminus, false, false);
			}
			else
			{
				PerformLoadUnloadAction(trackLoadInfo, train, isTerminus, true, false);
				CloseDoors(train, triggerName);
			}
		}
		else if (mode == "A") //Auto Load or Unload
		{
			bool fullUnload = (method == "U");
			ProcessStart(v, triggerName, trackLoadInfo, isTerminus, fullUnload);
			if (fullUnload)
			{
				ProcessFinish(v, triggerName, true);
			}
		}
		else // "F"
		{
			PerformLoadUnloadAction(trackLoadInfo, train, isTerminus, false, true);
			if (IsPlaySounds())
				v.PlaySoundScriptEvent("door_close");
			CloseDoors(train, triggerName);
		}

//Debug(me.GetName(), trackLoadInfo.platformIndex, "send LoadUnloadFinished");		
		PostMessage(train, "LoadUnloadFinished", "", 0.5);
		PostMessage(me, "LoadUnloadFinished", "", 0);

		m_busy[trackLoadInfo.platformIndex] = false;
	}
	
	public bool HandleTrainCommand(Train train, string mode, string method)
	{		
//m_Debug = (train.GetVehicles()[0].GetName() == "krm-42.");
	
//if (m_Debug) 
//{
//m_train = train;
//Debug(me.GetName(), -1, "HandleTrainCommand");		
//}
		itc.AddTrain(train);
		itc.SetTrainSpeed(train, m_trainLoadingSpeed);
		itc.SetTrainCommand(train, "nothing");
		
		// re-send any enter messages in case we missed them while executing a previous command
		// (not mentioning any names, Mr. Drive To.)
		InnerReEnterTrain(train);

		AITrainScope aiScope = train.OpenAITrainScope();
	
		Message msg;
		wait()
		{
			on "HandleTrain", "Release", msg:
//Debug(me.GetName(),-1, "HandleTrainCommand::Release");		
				if (msg.dst == train and msg.src == me)
				{					
					HandleLoadUnload(train, mode, method);
					//break;
				}
				continue;
			
			on "LoadUnloadFinished", "":
//Debug(me.GetName(),-1, "LoadUnloadFinished");		
				break;
			
			on "Schedule", "Abort", msg:
				if (msg.dst == train)
				{
					// release any unlocked vehicles so we abort as soon as possible
					if (itc.RemoveAllUnlockedVehicles(train))
					{
						break;
					}
				}
				continue;

			on "Train", "StoppedMoving", msg:
//Debug(me.GetName(), -1,"StoppedMoving");		
				// ceeb040316: added this to ensure a clear path (through junctions) out of the industry
				// this may be fired off due to the industry stopping the train. that shouldnt be a problem
				if (msg.src == train)
					train.BeginAITrainStuck(aiScope);
				continue;

			on "Train", "StartedMoving", msg:
				if (msg.src == train)
				{
//Debug(me.GetName(), -1,"StartedMoving");		
					train.EndAITrainStuck(aiScope);
				}
				continue;
		}
				
		train.CloseAITrainScope(aiScope);
	
		// clean up the ITC (in case the train left the industry behind while still in loading mode)
		itc.RemoveAllUnlockedVehicles(train);
		itc.ClearTrainCommand(train);

//Debug(me.GetName(), -1,"HandleTrainCommand::Finished");
		PostMessage(train, "HandleStationFinished", "", 0);
		return true;
	}

	void LoadPassengers(Train train, int platform)
	{
		ProductQueue unloadQueue = GetQueue("passengers_off_" + platform);
		ProcessProductLoadAndUnload(unloadQueue, train, ACTION_UNLOADING);
		ProductQueue loadQueue = GetQueue("passengers_on_" + platform);
		ProcessProductLoadAndUnload(loadQueue, train, ACTION_LOADING);
	}
	
	void UnloadPassengers(Train train, int platform)
	{
		bool isTerminus = IsTerminus(platform);
		ProductQueue unloadQueue;
		if (isTerminus) unloadQueue = GetQueue("passengers_off_" + platform);
		else			unloadQueue = GetQueue("passengers_on_" + platform);
//Interface.Print("Unload: platform="+);		
		FullUnload(unloadQueue, train.GetVehicles());
	}
	
	void ClearPassengers(int platform)
	{
		GetQueue("passengers_on_" + platform).DestroyAllProducts();
		GetQueue("passengers_off_" + platform).DestroyAllProducts();
	}
	
	void PlacePassengers(int platform, int passengersCount)
	{
		ProductQueue queue = GetQueue("passengers_on_" + platform);
		ProductFilter passengerFilter = queue.GetProductFilter();
		queue.CreateProduct(passengerFilter.GetProducts()[0], passengersCount);

	}
	//#endregion API 
	//#region Properties =======================================================================================
	public void SetProperties(Soup soup) 
	{
		inherited(soup);								
		m_bSounds = soup.GetNamedTagAsBool("sounds", true);
	}

	public Soup GetProperties() 
	{
		Soup soup = inherited();
		soup.SetNamedTag("sounds", m_bSounds);		
		return soup;
	}
	//#endregion Properties
	//#region HTML Properties ==================================================================================
	string getAnswerOption(StringTable ST, bool opt)
	{
		if (opt) return ST.GetString("property-yes");
		return ST.GetString("property-no");
	}

	string GetPropertyHTML(string name, string value, string valueId)
    {
        string link = "live://property/" + valueId;
        string content = HTMLWindow.MakeCell(HTMLWindow.MakeLink(link, "<font face=Arial color=#B8B8B8 size=3><b>"+name+"</b></font>"),"bgcolor=#0")+
    			         HTMLWindow.MakeCell(HTMLWindow.MakeLink(link, "<font face=Arial color=#B8B8B8 size=3><b>"+value+"</b></font>"),"bgcolor=#0");

        return HTMLWindow.MakeRow(content);
    }
	
    string GetDescriptionHTMLInt(StringTable ST)
	{
		return GetPropertyHTML(ST.GetString("sound-property"), getAnswerOption(ST, m_bSounds), "sounds");
	}

    public string getDescriptionHTML(string content)
	{
       	return HTMLWindow.MakeTable(content, "width=100% border=1 cellspacing=1");
	}

 	public string GetPropertyType(string id)
	{
		Debug("GetPropertyType", id);

		if (id == "sounds") return "link";
		return inherited(id);
	}

    public void LinkPropertyValue(string id)
    {
		Debug("LinkPropertyValue", id);
		if (id == "sounds") m_bSounds = !m_bSounds;
		else 				inherited(id);
    }

	public string GetDescriptionHTML(void) 
	{
		StringTable ST = m_LibraryAsset.GetStringTable();
		
		string html = inherited();
		if (m_bShowSoundsProperty)
			html = html + getDescriptionHTML(GetDescriptionHTMLInt(ST));
		html = html + "<br><font face=Arial color=#B8B8B8 size=1><b>  � CyriTRAINZ 2026</b></font>";
		return html;
	}
	//#endregion HTML Properties  
	//#region Handlers ====================================================================================	
	void CommandException()
	{
		Interface.Exception("Station Command expected: '[Load|Unload|Clear]^platform' or 'Set^platform^passengers'");
	}
	void CommandExceptionPlaform(string platform)
	{
		Interface.Exception("Station Command Error: wrong platform: "+ platform);
	}

	void ExecuteCommand(GameObject src, string[] tokens)
	{
		string cmd = tokens[0];
		Str.ToUpper(cmd);
		bool isLoading =   (cmd == "LOAD"),
			 isUnloading = (cmd == "UNLOAD"),
			 isClearing =  (cmd == "CLEAR"),
			 isSetting =   (cmd == "SET");
		int len = tokens.size();		
		if (isSetting)
		{
			if (len != 3) 
			{
				CommandException();
				return;
			}		
		}
		else if (len != 2 or !(isLoading or isUnloading or isClearing))
		{
			CommandException();
			return;
		}		
		string platform = tokens[1];
		int track = Str.ToInt(platform);
		if (track == 0 or track > m_Tracks) 
		{
			CommandExceptionPlaform(platform);
			return;
		}		
		track--;
		Train train = cast<Train>(src);
		if (isLoading)  	  LoadPassengers(train, track);
		else if (isUnloading) UnloadPassengers(train, track);
		else if (isClearing)  ClearPassengers(track);
		else
		{
			ClearPassengers(track);
			int passengersCount = Str.ToInt(tokens[2]);
			PlacePassengers(track, passengersCount);
		}
	}

	public void OnCommandHandler(Message msg)
	{
//Interface.Print("minor="+msg.minor);
		string[] tokens = Str.Tokens(msg.minor, "^");
		ExecuteCommand(msg.src, tokens);
	}
	//#endregion Handlers
	//#region  Init =======================================================================================	
	public void Init(void)
	{		
		m_LibraryAsset = World.GetLibrary(GetAsset().LookupKUIDTable("library")).GetAsset();
		inherited();
		Soup config = GetAsset().GetConfigSoup().GetNamedSoup("attached-track");
		if (config.GetIndexForNamedTag("track_two") >= 0) 	m_Tracks = 2;
		else												m_Tracks = 1;
		InitPassengerStation(m_Tracks);
		StationMain();
		AddHandler(me, "CTRL", "", "OnCommandHandler");
	}
	//#endregion  Init
};