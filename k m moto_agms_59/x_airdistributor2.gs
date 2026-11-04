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
    Train m_train = null;
    TWagonVRState[] m_WagonVRs;
    bool m_bCheckingVRs = false;
    bool m_bControlsVRs = false;

    /*
    void Debug(string name, string info)
    {
        Interface.Print("Motovoz:"+GetName()+"::"+name+"::"+info);
    }
    */

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
        if (m_bCheckingVRs) return;
        if (!m_train) return;
        Vehicle[] trainVehicles = m_train.GetVehicles();
        m_bCheckingVRs = true;
        int i;

        for (i = 0; i < trainVehicles.size(); i++)
        {
            m_WagonVRs[i].OldTMPressure=GetTMPressure(trainVehicles[i]);
        }

        while (m_bControlsVRs and m_train.GetAllowsUserControl())
        {
            bool to_perfom=true;

            while (to_perfom)
            {
                to_perfom=false;

                for (i = 0; i < trainVehicles.size(); i++)
                {
                    if (!trainVehicles[i].isclass(Locomotive) and GetZRPressure(trainVehicles[i]) - GetTMPressure(trainVehicles[i]) >= 25.0 and
                        GetTMPressure(trainVehicles[i]) > 300.0 and (m_WagonVRs[i].OldTMPressure - GetTMPressure(trainVehicles[i]) >= 50.0))
                    {
                        trainVehicles[i].SetBrakePipeEfficiency(0.6);
                        to_perfom=true;
                    }
                    else
                        trainVehicles[i].SetBrakePipeEfficiency(1);
                }
                Sleep(0.03);
            }

            for (i = 0; i < trainVehicles.size(); i++)
            {
                m_WagonVRs[i].OldTMPressure=GetTMPressure(trainVehicles[i]);
            }

            m_bCheckingVRs = false;
            return;
        }
        m_bCheckingVRs = false;
    }

    void InitVRs(void)
    {
        if (!m_train) return;
        Vehicle[] trainVehicles = m_train.GetVehicles();
        int i;
        m_WagonVRs = new TWagonVRState[trainVehicles.size()];
        for (i = 0; i < trainVehicles.size(); ++i)
        {
            m_WagonVRs[i] = new TWagonVRState();
        }
    }

    void ReInitVRs(void)
    {
        m_WagonVRs = null;
        if (m_bControlsVRs)
            InitVRs();
    }

    void DetachTrainEvents()
    {        
    }

    void AttachTrainEvents()
    {        
    }

    void OnTrainChanged(Train train)
    {
        m_train = train;
    }

    void ReInitController()
    {
        //Debug("ReInitController", "");
        Train train = GetMyTrain();
        if (!train) return;
        DetachTrainEvents();
        OnTrainChanged(train);
        AttachTrainEvents();
    }

    public void CouplerHandler(Message msg)
    {
        ReInitController();
        ReInitVRs();
    }

    public void SetProperties(Soup sp)
    {
        inherited(sp);
        m_bControlsVRs = sp.GetNamedTagAsBool("VRController", false);
        ReInitController();
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

        AddHandler(me,"Vehicle","Decoupled","CouplerHandler");
        AddHandler(me,"Vehicle","Coupled","CouplerHandler");

        InitDelayed();
    }
};
