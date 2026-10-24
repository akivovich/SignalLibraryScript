include "CyriStationScript.gs"

class CyriStationScriptGL isclass CyriStationScript
{
	bool[] m_bOpenedByCommand = new bool[2];

	//#region View Details =====================================================================================
	string getStationDoorsLink(StringTable ST, int track)
	{
		string text = ST.GetString("cyristation0"+track);
		string action, textLink;
		if (m_bOpenedByCommand[track-1])
		{
			action = "close#"+track;
			textLink = ST.GetString("station-doors-close");
		}
		else
		{
			action = "open#"+track;
			textLink = ST.GetString("station-doors-open");
		}		

		return GetDetailsColText(text) + GetDetailsColLink(action, textLink);
	}

	string getStationDoorsLink(StringTable ST) 
	{
		return GetDetailsRow(getStationDoorsLink(ST, 1)) +
			   GetDetailsRow(getStationDoorsLink(ST, 2));
	}

	string GetViewDetailsInt(StringTable ST) 
	{
		return getStationDoorsLink(ST);
	}
	//#endregion View Details
	//#region Process ==========================================================================================
	Vehicle GetControlVehicle(Train train)
	{
		Vehicle[] vehicles = train.GetVehicles();  
		/*	
		int i, len = vehicles.size();
		for (i = 0; i < len; i++)
			Interface.Print("GetControlVehicle:i="+i+"trigger="+FindTriggerContainingNode(vehicles[i].GetId(),true));
		*/	
		if (vehicles.size() < 3) return null;
		return vehicles[1];
	}
	
	void openStationDoorsInt(string door)
	{		
		SetMeshAnimationState(door, true);
		World.PlaySound(m_LibraryAsset,"Open.wav",900.0,10.0,150.0,me,"a.door");		
	}
	
	thread void closeStationDoorsInt(string door, float delay)
	{
		if (delay) Sleep(delay);
		SetMeshAnimationState(door, false);
		World.PlaySound(m_LibraryAsset,"Close.wav",900.0,10.0,150.0,me,"a.door");
	}
	
	void PostDoorsMessage(Train toTrain, bool opened, float delay)
	{
		if (opened)	PostMessage(toTrain, "HorLift", "HorLiftDoorsOpened", delay);
		else		PostMessage(toTrain, "HorLift", "HorLiftDoorsClosed", delay);
	}

	void PostDoorsMessage(Train toTrain, bool opened)
	{
		PostDoorsMessage(toTrain, opened, 0.3);
	}
	
	string CheckVehicle(Train train)
	{
		Vehicle[] vehicles = train.GetVehicles();
		Vehicle vehicle;
		if (vehicles.size() < 3) vehicle = vehicles[vehicles.size()-1];
		else					 vehicle = vehicles[2];
		return FindTriggerContainingNode(vehicle.GetId(),true);	
	}
	
	bool MoveTrain(Train train, string triggerName)
	{		
		Vehicle v = GetControlVehicle(train);		
		
//Debug(GetName(), GetSideByTrigger(triggerName),"MoveTrain:"+triggerName);
	
		if (!v) return false;
		string controlTrigger;
		if (triggerName == "trigger_track_one_c" or triggerName == "trigger_track_one_end") 	   controlTrigger = "trigger_track_one_end";
		else if (triggerName == "trigger_track_two_c" or triggerName == "trigger_track_two_end")   controlTrigger = "trigger_track_two_end";
		else if (triggerName == "trigger_track_one_start" or triggerName == "trigger_track_one_a") controlTrigger = "trigger_track_one_start";
		else if (triggerName == "trigger_track_two_start" or triggerName == "trigger_track_two_a") controlTrigger = "trigger_track_two_start";
		else return false;
		
		int side = GetSideByTrigger(triggerName);
		m_busy[side] = true;
		
		triggerName = FindTriggerContainingNode(v.GetId(),true);

//Debug(v.GetName(), "MoveTrain1:"+triggerName+",controlTrigger="+controlTrigger);
			
//Interface.Print("MoveTrain:start,triggerName="+triggerName);
		train.SetAutopilotMode(Train.CONTROL_SCRIPT);
		Message msg;
					
		if (triggerName == controlTrigger)
		{
			int i = 0;
			train.SetDCCThrottle(0.1);
			PostMessage(me, "CyriStation", "Check", 0.1);
			wait()
			{
				on "CyriStation", "Check":
	//Debug(v.GetName(), "MoveTrain::Check+::"+FindTriggerContainingNode(v.GetId(),true)+",controlTrigger="+controlTrigger);
					if (i++ > 100 or FindTriggerContainingNode(v.GetId(),true) != controlTrigger)
						break;
					PostMessage(me, "CyriStation", "Check", 0.1);
					if (!v.GetVelocity()) train.SetDCCThrottle(0.14);
					continue;

				on "Schedule", "Abort", msg:
					if (msg.dst == train)
					{
						break;
					}
					continue;
			}
		}
		else								
		{
			int i = 0;
			train.SetDCCThrottle(-0.1);
			PostMessage(me, "CyriStation", "Check", 0.1);
			wait()
			{
				on "CyriStation", "Check":
	//Debug(v.GetName(), "MoveTrain::Check-::"+FindTriggerContainingNode(v.GetId(),true)+",controlTrigger="+controlTrigger);
					if (i++ > 100 or FindTriggerContainingNode(v.GetId(),true) == controlTrigger)
						break;
					PostMessage(me, "CyriStation", "Check", 0.1);
					if (!v.GetVelocity()) train.SetDCCThrottle(-0.14);
					continue;

				on "Schedule", "Abort", msg:
					if (msg.dst == train)
					{
						break;
					}
					continue;
			}			
		}
		train.SetDCCThrottle(0.0);
		Sleep(1);		
				
//Interface.Print("MoveTrain:finish");		
//Debug(GetName(),GetSideByTrigger(triggerName), "MoveTrain::finish");
		
		m_busy[side] = false;
		
		return true;
	}

	bool TriggerSupportsMassStoppedLoad(Vehicle vehicle, string triggerName)
	{
		//if (m_moving) return false;
//Debug(me.GetName(),GetSideByTrigger(triggerName), "TriggerSupportsMassStoppedLoad::triggerName="+triggerName);
		
		Train train = vehicle.GetMyTrain();
		triggerName = CheckVehicle(train);
		if (triggerName == "trigger_track_one_start" or triggerName == "trigger_track_one_a" or triggerName == "trigger_track_one_c" or triggerName == "trigger_track_one_end")
		{			
		//Debug(me.GetName(), GetSideByTrigger(triggerName),"TriggerSupportsMassStoppedLoad:"+vehicle.GetName()+",trigger="+FindTriggerContainingNode(vehicle.GetId(),true));
			bool vehicleToTrain = !vehicle.GetDirectionRelativeToTrain();
			int direction = vehicle.GetRelationToTrack(me, "track_one");
			if (!vehicleToTrain)
				direction = -direction;

			if ((triggerName == "trigger_track_one_c" or triggerName == "trigger_track_one_end") and direction == Vehicle.DIRECTION_BACKWARD)
			{
		//Debug(me.GetName(),GetSideByTrigger(triggerName), "TriggerSupportsMassStoppedLoad:FOUND");
				return true;
			}
			else if ((triggerName == "trigger_track_one_start" or triggerName == "trigger_track_one_a") and direction == Vehicle.DIRECTION_FORWARD)
			{
		//Debug(me.GetName(),GetSideByTrigger(triggerName), "TriggerSupportsMassStoppedLoad:FOUND");
				return true;
			}
		}	    		
		else if (triggerName == "trigger_track_two_a" or triggerName == "trigger_track_two_start" or triggerName == "trigger_track_two_c" or triggerName == "trigger_track_two_end")
		{
		//Debug(me.GetName(),GetSideByTrigger(triggerName), "CheckVehicle2:"+vehicle.GetName()+",trigger="+FindTriggerContainingNode(vehicle.GetId(),true));			
			bool vehicleToTrain = !vehicle.GetDirectionRelativeToTrain();
			int direction = vehicle.GetRelationToTrack(me, "track_two");
			if (!vehicleToTrain)
				direction = -direction;

			if ((triggerName == "trigger_track_two_c" or triggerName == "trigger_track_two_end") and direction == Vehicle.DIRECTION_BACKWARD)
			{
		//Debug(me.GetName(),GetSideByTrigger(triggerName), "TriggerSupportsMassStoppedLoad:FOUND");
				return true;
			}
			else if ((triggerName == "trigger_track_two_start" or triggerName == "trigger_track_two_a") and direction == Vehicle.DIRECTION_FORWARD)
			{
		//Debug(me.GetName(),GetSideByTrigger(triggerName), "TriggerSupportsMassStoppedLoad:FOUND");
				return true;
			}
		}	    
		
	//Debug(me.GetName(),GetSideByTrigger(triggerName), "TriggerSupportsMassStoppedLoad:NOT_FOUND");
		return false;
	}

	public bool ShouldMoveTrain(Train train)
	{
		Vehicle[] vehicles = train.GetVehicles();
		int i, len = vehicles.size();
		string triggerName;
		
//Debug(me.GetName(),-1, "ShouldMoveTrain:len="+len);
		
		for (i = 0; i < len; i++)
		{
			triggerName = FindTriggerContainingNode(vehicles[i].GetId(), true);
			if (triggerName != "")
			{
Interface.Print("ShouldMoveTrain:i="+i+",Trigger="+FindTriggerContainingNode(vehicles[i].GetId(), true));	
				return true; //!MoveTrain(train, CheckVehicle(train));
			}
		}		
Interface.Print("ShouldMoveTrain:trigger="+triggerName);
		return false;
	}
	
	public void ProcessStart(Vehicle vehicle, string triggerName, TrackLoadInfo info, bool isTerminus, bool fullUnload)
	{
//Debug(me.GetName(),info.platformIndex, "ProcessStart");
		string name = Str.Tokens(triggerName, "_")[2];
		int track;
		if (name == "one") track = 1;
		else			   track = 2;	

		Vehicle v;
		Train train = vehicle.GetMyTrain();
		Vehicle[] vehicles = train.GetVehicles();
		if (!m_bOpenedByCommand[track-1])
		{
			PostDoorsMessage(train, true);
			openStationDoorsInt("door0"+track);
			v.PlaySoundScriptEvent("door_open");						
		}
		int i, len = vehicles.size();
		if (len > 6) len = 6;
		for (i = 0; i < len; i++)
		{			
			v = vehicles[i];
			if (info.trainLeftSide == v.GetDirectionRelativeToTrain())
				v.SetDoorAnimationState("left-passenger-door", true);
			else
				v.SetDoorAnimationState("right-passenger-door", true);
		}
				
		PerformLoadUnloadAction(info, train, isTerminus, fullUnload, false);
		
		if (isTerminus and !fullUnload)
		{
//Interface.Print("PerformMassStoppedLoad:Turn:"+vehicle.GetName());

			TurnAroundTrain(train);
			PerformLoadUnloadAction(info, train, true, false, true);
		}		
	}
	
	public void ProcessFinish(Vehicle vehicle, string triggerName, bool fullUnload)
	{
//Debug(me.GetName(), GetSideByTrigger(triggerName),"ProcessFinish");
		string name = Str.Tokens(triggerName, "_")[2];
		Vehicle v;
		Train train = vehicle.GetMyTrain();
		Vehicle[] vehicles = train.GetVehicles();
		int i, len = vehicles.size();
		if (!fullUnload and m_bSounds)
			vehicle.PlaySoundScriptEvent("door_close");
					
		for (i = 0; i < len; i++)
		{
			v = vehicles[i];											
			v.SetDoorAnimationState("left-passenger-door", false);
			v.SetDoorAnimationState("right-passenger-door", false);
		}

		int track;
		if (name == "one") track = 1;
		else			   track = 2;

		if (!m_bOpenedByCommand[track-1]) 
		{
			closeStationDoorsInt("door0"+track, 3);
			PostDoorsMessage(train, false, 3.5);
		}

//Interface.Print("PerformMassStoppedLoad:Remove:"+vehicle.GetName());
		
		Sleep(5);
	}
	
	bool PerformMassStoppedLoadInternal(Vehicle vehicle, string triggerName, TrackLoadInfo info)
	{
		Train train = vehicle.GetMyTrain();		
		triggerName = CheckVehicle(train);

//Debug(GetName(),GetSideByTrigger(triggerName), "PerformMassStoppedLoadInternal:"+triggerName);		
		
		if (triggerName != "" or !train.GetVelocity())
		{
//Debug(GetName(),GetSideByTrigger(triggerName), "PerformMassStoppedLoad:"+vehicle.GetName()+",nothing="+itc.IsTrainCommand(train, "nothing"));
			//m_moving = true;
			MoveTrain(train, triggerName);
			//m_moving = false;
			if (!itc.IsTrainCommand(train, "nothing"))
			{
				PassengerStationInfo platformInfo = psi[info.platformIndex];			
				bool isTerminus = (platformInfo.GetStationType() == PassengerStationInfo.TERMINUS_STATION);
				bool fullUnload = (!itc.IsTrainCommand(train, Industry.LOAD_COMMAND) and itc.IsTrainCommand(train, Industry.UNLOAD_COMMAND));
//Interface.Print("PerformMassStoppedLoad:isLoad="+itc.IsTrainCommand(train, Industry.LOAD_COMMAND)+",isUnload="+itc.IsTrainCommand(train, Industry.UNLOAD_COMMAND));
				ProcessStart(vehicle, triggerName, info, isTerminus, fullUnload);
				ProcessFinish(vehicle, triggerName, fullUnload);
			}
			PostMessage(vehicle.GetMyTrain(), "HandleTrain", "Release", 1.0);
			return true;
		}
		
		return false;
	}
	//#endregion Process
	//#region API ==============================================================================================
	void openStationDoors(int track)
	{
		//Debug("openStationDoors", track, "");

		if (m_bOpenedByCommand[track-1]) return;
		m_bOpenedByCommand[track-1] = true;
		openStationDoorsInt("door0"+track);
	}

	void closeStationDoors(int track)
	{
		if (!m_bOpenedByCommand[track-1]) return;
		m_bOpenedByCommand[track-1] = false;
		closeStationDoorsInt("door0"+track, 0);
	}
	void OperateDoorsGL(string cmd, string triggerName)
	{
		string name = Str.Tokens(triggerName, "_")[2];
		PostMessage(me, "StGL", name+"#"+cmd, 0.);
	}
	
	void OpenDoorsInternal(Train srcTrain, string triggerName)
	{		
		OperateDoorsGL("Open", triggerName);
		PostDoorsMessage(srcTrain, true);
	}
	
	void CloseDoorsInternal(Train srcTrain, string triggerName)
	{		
		Sleep(4.0);
		OperateDoorsGL("Close", triggerName);
		PostDoorsMessage(srcTrain, false);
	}
	//#endregion API
	//#region Properties =======================================================================================
	void syncDoorsState(int track)
	{
		if (m_bOpenedByCommand[track-1]) 
			openStationDoorsInt("door0"+track);
		else
			closeStationDoorsInt("door0"+track, 0);
	}

	public void SetProperties(Soup soup) 
	{
		inherited(soup);								
		m_bOpenedByCommand[0] = soup.GetNamedTagAsBool("opened1", false);
		m_bOpenedByCommand[1] = soup.GetNamedTagAsBool("opened2", false);
		syncDoorsState(1);
		syncDoorsState(2);
	}

	public Soup GetProperties() 
	{
		Soup soup = inherited();
		soup.SetNamedTag("opened1", m_bOpenedByCommand[0]);
		soup.SetNamedTag("opened2", m_bOpenedByCommand[1]);
		return soup;
	}
	//#endregion Properties
	//#region HTML Properties ==================================================================================
    void  operateStationDoorsByProperties(int track)
	{
		
		if (m_bOpenedByCommand[track-1]) 
			closeStationDoors(track);
		else
			openStationDoors(track);
	}

	string getDoorsOperateContent(StringTable ST, int track)
	{
		string text = ST.GetString("cyristation0" + track);
		string action = "station_doors_" + track;			   
		string textLink;
		if (m_bOpenedByCommand[track-1])
			textLink = ST.GetString("doors-opened");
		else
			textLink = ST.GetString("doors-closed");

		Debug("getDoorsOperateContent", track, "action="+action+",textLink="+textLink);

		return GetPropertyHTML(text, textLink, action);
	}

	string GetDescriptionHTMLInt(StringTable ST)
	{
		return inherited(ST) + 
			   getDoorsOperateContent(ST, 1) + 
			   getDoorsOperateContent(ST, 2);
	}

 	public string GetPropertyType(string id)
	{
		if (id == "station_doors_1" or id == "station_doors_2") return "link";
		return inherited(id);
	}

    public void LinkPropertyValue(string id)
    {
		if (id == "station_doors_1" or id == "station_doors_2")
		{
			string[] tokens = Str.Tokens(id, "_");
			int track = Str.ToInt(tokens[tokens.size()-1]);
			Debug("GL:LinkPropertyValue", "id="+id+",track="+track);
			operateStationDoorsByProperties(track);
		}
		else
		{
			inherited(id);
		}
    }
	//#endregion HTML Properties 
	//#region Handlers =========================================================================================	
	void ExecuteCommand(GameObject src, string[] tokens)
	{
		string cmd = tokens[0];
		Str.ToUpper(cmd);
		if (cmd == "StGL")
		{
			string action = tokens[1];
			int track = Str.ToInt(tokens[2]);
			if (action = "OPEN") 		openStationDoors(track);
			else if (action == "CLOSE") closeStationDoors(track);
		}
		else
		{
			inherited(src, tokens);
		}
	}

	public void BrowserUrlHandler(Message msg)
	{
		if (msg.src != info) return; //info - Browser in Base class
		Debug("BrowserUrlHandler", 0, msg.minor);
		string[] tokens = Str.Tokens(msg.minor, "//");
		int len = tokens.size();
		if (len == 0) return;
		string cmd = tokens[len-1];
		tokens = Str.Tokens(cmd, "#");
		cmd = tokens[0];
		int track = Str.ToInt(tokens[1]);
		if (cmd == "open") 
			openStationDoors(track);
		else if (cmd == "close")
			closeStationDoors(track);
		else 
			Exception("BrowserUrlHandler:"+msg.minor);

		RefreshViewDetails();
	}

	void OnStationDoorsCommandHandler(Message msg) 
	{
		//Interface.Print("OnStationDoorsCommandHandler="+msg.minor);		
		string[] tokens = Str.Tokens(msg.minor, "#");
		string action   = tokens[1],
			   platform = tokens[0];
		int track;
		if (platform == "one") track = 1;
		else				   track = 2;
		
		//Debug("OnStationDoorsCommandHandler", track, msg.minor);

		if (action == "Open") 
			openStationDoors(track);
		else
			closeStationDoors(track);
	}	
	
	void OnCabinCommandHandler(Message msg) 
	{
		Train train = cast<Train>(msg.src);
		CyriTrackLoadInfo trackInfo = GetTrackLoadInfo(train);
		if (trackInfo.triggerName == "") return;
		string door = "door0"+(trackInfo.info.platformIndex+1);
		if (msg.minor == "CloseDoors")  
		{
			closeStationDoorsInt(door, 3);
			PostDoorsMessage(train, false, 7.5);
		}
		else 
		{
			PostDoorsMessage(train, true);
			openStationDoorsInt(door);
		}
	}
	//#endregion Handlers
		
	public void Init(void)
	{
		inherited();
		AddHandler(me, "StGL", "", "OnStationDoorsCommandHandler");
		AddHandler(me, "Cab",  "", "OnCabinCommandHandler");
		AddHandler(me, "Browser-URL","","BrowserUrlHandler");
	}
};