//
// Thanks to Combine for sharing this idea
//
// author: Combine
// modification: agentmike
// 2nd modification: TRam_
//

include "locomotive.gs"
include "common.gs"

//Air distibutor - VR
//Auxillary reservoir - ZR
//Brake pipe - TM
// :-)

class TWagonVRState
{
    public float OldTMPressure;
};

class TVRController_Locomotive2 isclass Locomotive
{
    TWagonVRState[] WagonVRs;
    Vehicle[]       trainVehicles;
    bool            checkingVRs = false;
    bool            controlsVRs = false;
    bool            autoUpdateVRs = false;

    public float GetTMPressure(Vehicle veh)
    {
        float pressureMultiplier = 1.0 / (0.145 * 0.0000703);
        float pressureBase = 14.7 * 0.0000703;

        return pressureMultiplier * (veh.GetEngineParam("brake-pipe-pressure") - pressureBase);
    }

    public float GetZRPressure(Vehicle veh)
    {
        float pressureMultiplier = 1.0 / (0.145 * 0.0000703);
        float pressureBase = 14.7 * 0.0000703;

        return pressureMultiplier * (veh.GetAuxReservoirPressure() - pressureBase);
    }

    thread void CheckVRs(void)
    {
        if(checkingVRs)
            return;
        checkingVRs = true;
        int i;

        for(i = 0; i < trainVehicles.size(); i++)
        {
            WagonVRs[i].OldTMPressure=GetTMPressure(trainVehicles[i]);
        }

        while(controlsVRs and GetMyTrain().GetAllowsUserControl())
        {
            bool to_perfom=true;

            while(to_perfom)
            {
                to_perfom=false;

                for(i = 0; i < trainVehicles.size(); i++)
                {
                    if (!trainVehicles[i].isclass(Locomotive) and GetZRPressure(trainVehicles[i]) - GetTMPressure(trainVehicles[i]) >= 25.0 and
                        GetTMPressure(trainVehicles[i]) > 300.0 and (WagonVRs[i].OldTMPressure - GetTMPressure(trainVehicles[i]) >= 50.0))
                    {
                        trainVehicles[i].SetBrakePipeEfficiency(0.6);
                        to_perfom=true;
                    }
                    else
                        trainVehicles[i].SetBrakePipeEfficiency(1);
                }
                Sleep(0.03);
            }

            for(i = 0; i < trainVehicles.size(); i++)
            {
                WagonVRs[i].OldTMPressure=GetTMPressure(trainVehicles[i]);
            }

            if(!autoUpdateVRs)
            {
                checkingVRs = false;
                return;
            }
            Sleep(0.4);
        }
        checkingVRs = false;
    }

    void InitVRs(void)
    {
        int i;
        WagonVRs = new TWagonVRState[trainVehicles.size()];
        for(i = 0; i < trainVehicles.size(); ++i)
        {
            WagonVRs[i] = new TWagonVRState();
        }
    }

    void ReInitVRs(void)
    {
        WagonVRs = null;
        if (controlsVRs)
            InitVRs();
    }

    void ReInitController(void)
    {
        trainVehicles = GetMyTrain().GetVehicles();
        int i;
        bool foundMe = false;
        for(i = 0; i < trainVehicles.size(); i++)
            if(trainVehicles[i].GetProperties().GetNamedTagAsBool("VRController",false))
            {
                if(trainVehicles[i] == me)
                    foundMe = true;
                break;
            }

        controlsVRs = foundMe;
        bool startMonitor = controlsVRs and autoUpdateVRs;
        if (startMonitor and !checkingVRs)
            CheckVRs();
    }

    void VRHandler(Message msg)
    {
        ReInitController();
        ReInitVRs();
    }

    public Soup GetProperties(void)
    {
        Soup sp = inherited();
        sp.SetNamedTag("VRController",true);
        return sp;
    }

    thread void InitDelayed(void)
    {
        Sleep(2.0);
        ReInitController();
        ReInitVRs();
    }

    public void Init(Asset asset)
    {
        inherited(asset);

        AddHandler(me,"Vehicle","Decoupled","VRHandler");
        AddHandler(me,"Vehicle","Coupled","VRHandler");

        InitDelayed();
    }
};
