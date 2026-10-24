include "GenericIndustry.gs"

//
class CyriStationScriptShed isclass GenericIndustry
{
	bool scriptletEnabled = true;
	bool m_bInT1, m_bOutT0;
	
	thread void ViewDetails(void)
	{
		if (!info)
		{
			info = Constructors.NewBrowser();
			info.LoadHTMLString(HTMLWindow.GetCompleteIndustryViewDetailsHTMLCode(me, scriptletEnabled));
			info.SetWindowRect(100, 80, 500, 545);
		}
	}	
	
	bool IsVehicleSupportProduct(Vehicle vehicle)
	{
		ProductQueue goodsOutQueue = GetQueue("goods_in_q");
		ProductFilter prodFilter = goodsOutQueue.GetProductFilter();
		ProductFilter vehicleFilter = Constructors.NewProductFilter();
	  	ProductQueue[] vehicleQueues = vehicle.GetQueues();
		int i, len = vehicleQueues.size();		
		for (i = 0; i < len; i++)
		{
			ProductQueue vehicleQueue = vehicleQueues[i];
			ProductFilter filter = vehicleQueue.GetProductFilter();
        	vehicleFilter.AppendFilter(filter);
  		}		
		ProductFilter sect = prodFilter.IntersectFilter(vehicleFilter);
		return !sect.IsEmpty();
	}
	
	int  GetVehicleProductCount(Vehicle vehicle)
	{
		int count = 0;
		ProductFilter prodFilter = GetQueue("goods_in_q").GetProductFilter();
		ProductQueue[] vehicleQueues = vehicle.GetQueues();
		int i, len = vehicleQueues.size();		
		for (i = 0; i < len; i++)
		{
			count = count + vehicleQueues[i].CountProductMatching(prodFilter);
  		}		
		return count;
	}
	
	void SetTrainSpeed(Vehicle vehicle, float speed)
	{
		Vehicle[] vehicles = vehicle.GetMyTrain().GetVehicles();
		int i, len = vehicles.size();
		for (i = 0; i < len; i++)
			itc.SetVehicleSpeed(vehicle, speed);
	}
	
	bool TriggerSupportsStoppedLoad(Vehicle vehicle, string triggerName) 
	{		
		Train train = vehicle.GetMyTrain();
		if (train.IsStopped() and IsVehicleSupportProduct(vehicle))
		{
			return true;
		}

		if (itc.IsTrainCommand(train, Industry.LOAD_COMMAND) != itc.IsTrainCommand(train, Industry.UNLOAD_COMMAND) and IsVehicleSupportProduct(vehicle))
		{
			int  dirOut = vehicle.GetRelationToTrack(me, "out_track");		
			int  dirIn  = vehicle.GetRelationToTrack(me, "in_track");		
			
			if (triggerName == "goods_in_t1") 		
			{
				m_bInT1 = (dirOut == Vehicle.DIRECTION_NONE);
				m_bOutT0 = !m_bInT1;
				if (m_bInT1)
					SetTrainSpeed(vehicle, 2.0);
			}
			else if (triggerName == "goods_out_t0") 
			{
				m_bOutT0 = (dirIn == Vehicle.DIRECTION_NONE);
				m_bInT1 = !m_bOutT0;
				if (m_bOutT0)
					SetTrainSpeed(vehicle, 2.0);
			}
			
//	Interface.Print("TriggerSupportsStoppedLoad::vehicle="+vehicle.GetName()+",triggerName="+triggerName+",dirOut="+dirOut+",dirIn="+dirIn+",m_bInT1="+m_bInT1+",m_bOutT0="+m_bOutT0);

			if (m_bInT1)
			{
				if (dirIn == Vehicle.DIRECTION_FORWARD)
				{
					if (triggerName == "goods_in_t0") return true;
				}
				else
				{
					if (triggerName == "goods_out_t0") return true;
				}				
			}
			else if (m_bOutT0)
			{
				if (dirOut == Vehicle.DIRECTION_FORWARD)
				{
					if (triggerName == "goods_in_t1") return true;
				}
				else
				{
					if (triggerName == "goods_out_t1") return true;
				}				
			}												
		}
		
		return false;		
	}
	
	void FullUnload(Vehicle vehicle)
	{
		ProductQueue[] queues = vehicle.GetQueues();
		int i, len = queues.size();
		// unload every queue in the vehicle that has something in it...
		for (i = 0; i < len; i++) 
		{
			ProductQueue queue = queues[i];
			if (queue and queue.GetQueueCount()) 
				queue.DestroyAllProducts();
		}
	}
	
	void PerformStoppedLoad(Vehicle vehicle, string triggerName)
	{  
		//Interface.Print("PerformStoppedLoad:vehicle="+vehicle.GetName()+",triggerName="+triggerName);									
		Sleep(5);
		World.PlaySound(GetAsset(),"open.wav",100.0,5.0,100.0,me,"a.trig00");
		SetMeshAnimationState("doors", true);
		Sleep(10);
		int i, count = GetVehicleProductCount(vehicle);
		if (count)
		{
			//Interface.Print("Unload:"+count);	
			ProductQueue goodsInQueue = GetQueue("goods_in_q");
			for (i = 0; i < count; i++)
			{			
				//Interface.Print("unload:"+i+" of "+count);
				World.PlaySound(GetAsset(),"work.wav",100.0,5.0,100.0,me,"a.trig00");
				Sleep(5);
				LoadingReport report = CreateUnloadingReport(goodsInQueue, 1);
				vehicle.UnloadProduct(report);
				Sleep(2);
			}
			FullUnload(vehicle);
			Sleep(5);
		}
		else
		{
			ProductQueue goodsOutQueue = GetQueue("goods_out_q");
			count = goodsOutQueue.GetQueueCount();
			//Interface.Print("Load:"+count);	
			for (i = 0; i < count; i++)
			{			
				//Interface.Print("load:"+i+" of "+count);
				World.PlaySound(GetAsset(),"work.wav",100.0,5.0,100.0,me,"a.trig00");
				Sleep(2);
				LoadingReport report = CreateLoadingReport(goodsOutQueue, 1);
				vehicle.LoadProduct(report);			
				Sleep(5);
			}
		}
		
		World.PlaySound(GetAsset(),"close.wav",100.0,5.0,100.0,me,"a.trig00");
		SetMeshAnimationState("doors", false);
		Sleep(7);
		
		PostMessage(vehicle.GetMyTrain(), "HandleTrain", "Release", 0.0);
	}
  
  //
	public void Init(void)
	{
		inherited();

		AddAssetToIndustryProductInfo("gen_goods", "goods_out_q", "goodsshed_consumer", true);
		AddAssetToIndustryProductInfo("gen_goods", "goods_in_q",  "goodsshed_consumer", false);
	}
};
