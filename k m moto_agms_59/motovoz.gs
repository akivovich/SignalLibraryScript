// ---------------------------------------------------------------------------------------------
// k m moto_AGMs-59 (metro motor car built from RZD_MPT4-59): lamps and warning lamp.
// This script is the original of RZD_MPT4-59 plus the side lettering and the warning lamp control (see below).
//
// Side lettering: name effects side-r1..3 / side-l1..3 on a.sider1..3 / a.sidel1..3 show
//   "AGMS <number>" / "DEPO" / "<depo>" (in Russian); properties "number" and "depo"
//   (property editor and links in the description), saved with the session, see UpdateSideText().
//
// Warning lamp (orange lamp on the right of the cab roof, mesh body/warning_lamp.im from k mVg D-EKA):
//   warning_lamp0 - "corona" effect on a.warning_lamp0, texture <kuid:486576:81003> (kuid-table "warning_lamp"),
//   the point is just above the dome: a corona whose centre is covered by geometry (the opaque
//   lamp guard / the dome) is not drawn, even though SetFXCoronaTexture() succeeds,
//   frequency 1 Hz. Controlled in LocoLightController_d2: dark after Init() and in LightsOff(),
//   blinking after LightsOn() while at least one white lamp (flw/frw/blw/brw) is on:
//     m_myLoc.SetFXCoronaTexture("warning_lamp0", null);                                   // off
//     m_myLoc.SetFXCoronaTexture("warning_lamp0", m_myLoc.GetAsset().FindAsset("warning_lamp"));   // blinking
// ---------------------------------------------------------------------------------------------

include "gs.gs"
include "common.gs"
include "locomotive.gs"
include "chme5_CD.gs"
include "x_airdistributor2.gs"

static class Pos
{
    public int SingleLoco = 0;
    public int FirstLoco  = 1;
    public int MiddleLoco = 2;
    public int LastLoco   = 3;
};

//#region LocoLightController_d2 ====================================================================
class LocoLightController_d2
{
    Locomotive m_myLoc = null;
    Train m_train = null;

/*
    void Debug(string name, string info)
    {
        if (!m_myLoc) return;
        Interface.Print("Motovoz Controller::"+m_myLoc.GetName()+"::"+name+"::"+info);
    }
*/
    public int MyPosition()
    {
        if (!m_train) return Pos.MiddleLoco;
        Vehicle[] vehicles = m_train.GetVehicles();
        int  len = vehicles.size();
        if (len == 1)                    return Pos.SingleLoco;
        if (m_myLoc == vehicles[0])      return Pos.FirstLoco;
        if (m_myLoc == vehicles[len-1])  return Pos.LastLoco;
        return Pos.MiddleLoco;
    }

    bool isActive()
    {
        if (!m_train) return false;
        DriverCharacter adc = m_train.GetActiveDriver();
        DriverCharacter[] dcl = World.GetDriverCharacterList();
        int i = 0;
        for (; i < dcl.size(); i++)
        {
            if (dcl[i].GetLocation()==m_myLoc and dcl[i] == adc) return true;
        }
        return false;
    }

    void setWarningLamp(bool turn_on)
    {        
        if (turn_on)
        {
            Asset warning_lamp = m_myLoc.GetAsset().FindAsset("warning_lamp");
            m_myLoc.SetFXCoronaTexture("warning_lamp0",warning_lamp);
        }
        else
        {
            m_myLoc.SetFXCoronaTexture("warning_lamp0", null);
        }            
    }

    public void Init(Locomotive loc)
    {
        m_myLoc = loc;
        m_train = loc.GetMyTrain();
        setWarningLamp(false);
    }

    void LightsOff()
    {
        //Debug("LightsOff", "");
        m_myLoc.SetFXAttachment("alr0",null);
        m_myLoc.SetFXAttachment("blr0",null);
        m_myLoc.SetFXAttachment("brr0",null);
        m_myLoc.SetFXAttachment("arr0",null);
        m_myLoc.SetFXCoronaTexture("warning_lamp0",null);
        setWarningLamp(/*turn_on=*/false);
    }

    void LightsOn(bool dirForward)
    {        
        setWarningLamp(/*turn_on=*/true);
        Asset red = m_myLoc.GetAsset().FindAsset("red");
        int pos = MyPosition();
        //Debug("LightsOn", "pos="+pos+",dirForward="+dirForward);

        Asset alr, blr, brr, arr;
        if (dirForward)
        {
            alr = arr = null;
            if (pos == Pos.SingleLoco or pos == Pos.LastLoco)
                blr = brr = red;
            else
                blr = brr = null;
        }
        else
        {
            blr = brr = null;
            if (pos == Pos.SingleLoco or pos == Pos.LastLoco)
                alr = arr = red;
            else
                alr = arr = null;
        }

        m_myLoc.SetFXAttachment("alr0", alr);
        m_myLoc.SetFXAttachment("blr0", blr);
        m_myLoc.SetFXAttachment("brr0", brr);
        m_myLoc.SetFXAttachment("arr0", arr);
    }

    public void LightsEvent(Message msg, bool dirForward)
    {
        if (!m_train) return;
        bool lightState = m_train.GetHeadlightState(); 
        //Debug("LightsEvent", "msg.minor="+msg.minor+",lightState="+lightState);

        if (lightState)
            LightsOn(dirForward);
        else 
            LightsOff();
    }
};
//#endregion LocoLightController_d2 
//#region MotovozLocomotive =========================================================================
class MotovozLocomotive isclass TVRController_Locomotive2
{
    bool m_bMotorVent, m_bCompressorStarted = false,
         m_bDisel1, m_bZal_mv;
    bool m_bDiselOn = true, 
         m_bDiselOff = true;
    
    string m_sProcess = "disel_is_off.tga", polozh="bgcolor='#AAAAAA'";
    int   m_nmb_pos = 8, 
          m_number_start_s = 1, 
          m_number_stop_s = 1;
    
    chme5_CabinData m_CabData;

    Soup m_wavDb;

    float m_fMax_force = 400;
    float m_fMax_force_bw = 200;

    float m_fHeadlR = 1;
    float m_fHeadlG = 1;
    float m_fHeadlB = 1;
    string m_sLocoNumber = "986";
    string m_sDepo = "ПЕЧАТНИКИ";
    void UpdateSideText(void);

    Asset m_sounds_asset;

    float m_fMr_press = 500;
    float m_fDizelAddSound = 0,
          m_fDizelAddSoundbase,
          m_fSoundkoef = 1.4;

    bool m_bPowerState;
    bool m_bObjectRunningDriver;
    ProductQueue m_fuelQ;
    float m_fFuelCS, m_fFcs_k; // G = %throttle% * m_fFcs_k + m_fFuelCS, where G is fuel consumption speed on current throttle position

    float m_fComprEff = 0;

    bool m_bToplivo_nasos = false;
    bool m_bNasos_state = false;
    bool diselFlag = false;

    int  m_nTheSameLocoIndex = -1;

    bool    m_bDirForward = true;
    bool    m_bDeRailed = false;
    
    int     m_nOldPrior = 2;
    int     m_nOldPos = -1;
    string  m_sOldDayTime = "";
    LocoLightController_d2 m_LLC = null;
    Browser m_Browser;
    Asset   m_SA3_coupled, m_Sa3_uncoupled, m_Sa3_uncoupled_NM, m_Sa3_coupled_NM;

    public void LightHandler(Message msg); //v  ,

    public void Init(void);
    public void LPCHandler(Message msg);
    thread void PowerLoop(ProductQueue fQ);

    thread void Disel(Asset MyAsset);
    thread void beg11();
    //==========================================================
    public void ModuleInitHandler(Message msg)
    {
        if (m_bObjectRunningDriver)
            return;

        if (World.GetCurrentModule() == World.DRIVER_MODULE)
        {
            m_bObjectRunningDriver =true;
            beg11();
        }
    }

    float sin(float x)
    {
        int a= (int)(x/(2*Math.PI));
        x=x-2*a*Math.PI;
        a=1;
        if (Math.PI<x and x<=2*Math.PI)
        {
            x=x-Math.PI;
            a=-a;
        }
        if (Math.PI/2<x and x<=Math.PI)
        {
            x=Math.PI-x;
        }
        return a*(x-x*x*x/6+x*x*x*x*x/120-x*x*x*x*x*x*x/5040+x*x*x*x*x*x*x*x*x/362880);
    }

    float GetPressureParam(Locomotive loco, string param)
    {
        return 98101.7 * (loco.GetEngineParam(param) - 0.00103341);
    }

    bool IsFronmostLoco(Train train)
    {
        if (train) return false;
        return me.GetId() == m_train.GetFrontmostLocomotive().GetId();
    }

    float VehicleNM(float MyPressure)
    {
        if (!m_train) return 0.0;
        Vehicle[] veh = m_train.GetVehicles();
        int locosCount = 0;
        int poweredLocosCount=0;
        Soup SP1;
        int q;
        float otherCE;
        for (q = 0; q < veh.size(); q++)
        {
            if (veh[q] and veh[q].isclass(Locomotive))
            {
                Locomotive loco1=cast<Locomotive>veh[q];
                locosCount++;

                if (veh[q]!=me)
                {
                    SP1=veh[q].GetProperties().GetNamedSoup("MyVehicleSoup1");
                    if (SP1)
                    {
                        otherCE=SP1.GetNamedTagAsFloat("m_fComprEff");
                        if (GetPressureParam(loco1,"main-reservoir-pressure")<MyPressure)
                        {
                            if (otherCE<=0.5)
                                otherCE=otherCE+0.05;
                        }
                        else
                        {
                            if (GetPressureParam(loco1,"main-reservoir-pressure")-MyPressure>5 and otherCE<=0)
                            {
                                PostMessage(me,"presureX",GetPressureParam(loco1,"main-reservoir-pressure")+" my="+MyPressure,0);
                                otherCE=otherCE-0.05;
                            }
                            else
                                otherCE=0;
                        }

                        (cast<Locomotive>loco1).SetCompressorEfficiency(otherCE);

                        PostMessage(loco1,"NM-flow",otherCE,0);
                    }
                    if (SP1.GetNamedTagAsBool("m_bPowerState",false))
                        poweredLocosCount++;
                }
                else
                    if (m_bCompressorStarted)
                        poweredLocosCount++;
            }
        }
        return (float)poweredLocosCount / locosCount;
    }

    final void PlaySoundAndSleep(
        Asset srcAsset,
        string soundFile,
        float volume,
        float minDistance,
        float maxDistance,
        GameObject srcObject,
        string att)
    {
        World.PlaySound(srcAsset, soundFile, volume, minDistance, maxDistance, srcObject, att);
        Soup m_wavDb = srcAsset.GetConfigSoup().GetNamedSoup("extensions").GetNamedSoup("sound-length-base");
        Sleep(m_wavDb.GetNamedTagAsFloat(soundFile, 10.0) - 0.05);
    }

    thread void MainCompressorLooper()
    {
        Train train;
        while (!m_bDeRailed)
        {          
            Sleep(1);
            train = GetMyTrain();  
            if (!train) continue;
            if (train.GetAutopilotMode() > 1 and !m_bPowerState)
                beg11();

            //работа компрессора ТУТ !!!
            m_fMr_press = GetPressureParam(me,"main-reservoir-pressure");
            if (IsFronmostLoco(train))
            {
                if (!(VehicleNM(m_fMr_press)==0))
                {
                    m_fComprEff = VehicleNM(m_fMr_press);
                    if (m_fComprEff < 0) m_fComprEff=0;
                    if (m_fComprEff > 1) m_fComprEff=1;
                    SetCompressorEfficiency(m_fComprEff);
                }
                else
                {
                    if (m_fMr_press >0)
                        SetCompressorEfficiency(- 0.001);
                    else
                        SetCompressorEfficiency(0);
                }
            }
        }
    }

    thread void PowerLoop(ProductQueue fQ)
    {
        float dt = 1.0f;
        float consumed = 0.0f;

        PostMessage(me,"LPCTimer-298469","FTick",1.0f);
        while (m_bPowerState)
        {
            wait()
            {
                on "LPCTimer-298469","FTick":
                {
                    if (!m_bPowerState)
                    {
                        break;
                    }//if

                    if (!fQ.GetQueueCount())
                    {
                        m_bPowerState=false;
                        break;
                    }//if
                    consumed = consumed + (GetEngineSetting("throttle")*m_fFcs_k + m_fFuelCS) * dt;
                    while (consumed >= 1.0f)
                    {
                        consumed = consumed - 1;
                        fQ.DestroyProductMatching(null,1);
                        PostMessage(null,"RefreshBrowser","",0.0);
                    }//if
                    PostMessage(me,"LPCTimer-298469","FTick",dt);
                }//on
            }//wait
        }
        return;
    }//PowerLoop

    public void LPCHandler(Message msg)
    {
        if (msg.minor == "StartUp")
        {
            if (!m_bPowerState)
            {
                if (!m_fuelQ.GetQueueCount())
                {
                    SetMaximumTractiveEffort(0.0f);
                    return;
                }//if

                Disel(m_sounds_asset);
            }
            return;
        }//if
        if (msg.minor == "ShutDown")
        {
            SetMaximumTractiveEffort(0.0f);
            m_bPowerState = false;
            return;
        }//if
    }//LPCHandler

    thread void Disel(Asset MyAsset)
    {
        int i, currTr, sndTr;//currTr - текущая позиция контроллера, sndTr - позиция, звук которой проигрывается
        float dt;
        string sndFile;
        bool k1=false,k7=false;
        int qw=0;

        if (!m_bDisel1)
        {
            m_bDisel1=true;

            m_sProcess="disel_is_going.tga";
            PostMessage(null,"RefreshBrowser","",0.0);

            PostMessage(me,"pfx","+2",16.0);

            PostMessage(me,"pfx","+1-2",33.0);

            for (qw=0;qw<m_number_start_s;qw++)
                PlaySoundAndSleep(MyAsset,"sound/engine_start_"+qw+".wav",m_fSoundkoef*(1.2+m_fDizelAddSound),20.0f,1000.0f,me,"a.disel");

            if (World.GetWeatherType()<=2)
            {
                if (m_nTheSameLocoIndex>=0)
                    SetMaximumTractiveEffort(2*m_fMax_force_bw);
                else
                    SetMaximumTractiveEffort(m_fMax_force);
            }
            else
            {
                if (m_nTheSameLocoIndex>=0)
                    SetMaximumTractiveEffort(2*m_fMax_force_bw);
                else
                    SetMaximumTractiveEffort(m_fMax_force_bw);
            }

            SetWheelslipTractionMultiplier(0.6);

            SetMeshTranslation("dim",0,0,0);
            SetMeshTranslation("dim2",0,0,0);

            m_sProcess="disel_is_on.tga";

            m_bPowerState = true;

            sndTr = 1;
            PowerLoop(m_fuelQ);
            PostMessage(null,"RefreshBrowser","",0.0);


            while (m_bPowerState and !m_bDeRailed)
            {
                currTr = (int)(GetEngineSetting("throttle")*m_nmb_pos);
                /*if (sndTr>4 and !k1) {m_fSoundkoef=m_fSoundkoef-0.5;k1 = true;}
                else if (sndTr<=4 and k1) {m_fSoundkoef=m_fSoundkoef+0.5;k1 =false;}
                if (sndTr>6 and !k7) {m_fSoundkoef=m_fSoundkoef-0.4;k7 = true;}
                else if (sndTr<=6 and k7) {m_fSoundkoef=m_fSoundkoef+0.4;k7 =false;}*/

                if (currTr<=1 and sndTr>1)
                    PostMessage(me,"pfx","-0+1",0.1);

                if (currTr>1 and sndTr<=1)
                    PostMessage(me,"pfx","+0-1",0.1);

                if (sndTr < 2 and currTr < 2)
                {
                    sndTr = 1;
                    sndFile = "idle_"+(string)sndTr;
                }//if
                else if (currTr == sndTr)
                {
                    sndFile = "idle_"+(string)sndTr;
                }//else if
                else if (currTr > sndTr) //контроллер на более высокой позиции
                {
                    sndTr++;
                    sndFile = "up_"+(string)(sndTr-1)+"_-_"+(string)sndTr;
                }//else if
                else if (currTr < sndTr)  //контроллер на более низкой позиции
                {
                    sndTr--;
                    sndFile = "down_"+(string)(sndTr+1)+"_-_"+(string)sndTr;
                }//else if
                PlaySoundAndSleep(MyAsset,"sound/"+sndFile+".wav",m_fSoundkoef*(1.05+m_fDizelAddSound),10.0f,1000.0f,me,"a.disel");
            }//while

            SetMeshTranslation("dim",0,-300.0,0);
            SetMeshTranslation("dim2",0,-300.0,0);

            PostMessage(me,"pfx","-0-1",0.6);

            for (qw=0;qw<m_number_stop_s;qw++)
                PlaySoundAndSleep(MyAsset,"sound/engine_stop_"+qw+".wav",m_fSoundkoef*(1.05+m_fDizelAddSound),10.0f,1000.0f,me,"a.disel");

            SetMaximumTractiveEffort(0);

            SetWheelslipTractionMultiplier(1);

            m_sProcess="disel_is_off.tga";
            PostMessage(null,"RefreshBrowser","",0.0);
            m_bDisel1=false;
        }//if
    }//Disel

    void SetCouplerAttach(int pos, bool type)
    {
        // Устанавливает сцепку взависимости от параметров
        // void SetCouplerAttach(int type, int pos)
        //    pos:
        //        0       -   спереди вагона  (front_couple)
        //        1       -   сзади вагона    (back_couple)
        //    type:
        //        false   -   разомкнуто      (SA3-uncoupled)
        //        true    -   сомкнуто        (SA3-coupled)

        //Debug("SetCouplerAttach", "pos="+pos+",type="+type);

        if (pos == 0) //перед вагона
        {
            if (type == true)   //устанавливаем разомкнутую сцепку
            {
                SetFXAttachment ("front_couple", m_SA3_coupled);
            }
            else                //устанавливаем сомкнутую сцепку
            {
                SetFXAttachment ("front_couple", m_Sa3_uncoupled);
            }
        }
        else  //зад вагона
        {
            if (type == true)   //устанавливаем разомкнутую сцепку
            {
                SetFXAttachment ("back_couple", m_SA3_coupled);
            }
            else                //устанавливаем сомкнутую сцепку
            {
                SetFXAttachment ("back_couple", m_Sa3_uncoupled);
            }
        }
    }

    void SetCoupler(int pos, bool direction)
    {
        // устонавливает соотвецтвующий тип сцепки для переда и зада вагона
        // в зависимости от положения и направления вагона в составе
        // void SetCouplerType(int pos, bool direction);
        //    pos :
        //        0       -   одиночный
        //        1       -   Первый
        //        2       -   В центре
        //        3       -   Последний
        //
        //    durection :
        //        true    -   направление вагона соответсвует направлению состава
        //        false   -   направление вагона не соответствует направлению состава

        //Debug("SetCoupler", "pos="+pos+",direction="+direction);

        if (pos == Pos.SingleLoco)
        {
            SetCouplerAttach(0,false);
            SetCouplerAttach(1,false);
        }
        else if (pos == Pos.FirstLoco)
        {
            if (direction)
            {
                SetCouplerAttach(0,false);
                SetCouplerAttach(1,true);
            }
            else
            {
                SetCouplerAttach(0,true);
                SetCouplerAttach(1,false);
            }
        }
        else if (pos == Pos.MiddleLoco)
        {
            SetCouplerAttach(0,true);
            SetCouplerAttach(1,true);
        }
        else if (pos == Pos.LastLoco)
        {
            if (direction)
            {
                SetCouplerAttach(0,true);
                SetCouplerAttach(1,false);
            }
            else
            {
                SetCouplerAttach(0,false);
                SetCouplerAttach(1,true);
            }
        }
    }

    void SetDieselState(bool DisState)
    {
        if (DisState)
        {
            if (!m_bPowerState and m_fuelQ.GetQueueCount() )PostMessage(me,"LPC-298469","StartUp",0.0f);
        }
        else
        {
            if (m_bPowerState or ! m_fuelQ.GetQueueCount() )PostMessage(me,"LPC-298469","ShutDown",0.0f);
        }
    }

    void CouplerMonitor()
    {
        int     pos;
        bool    direction;

        //Debug("CouplerMonitor", "m_train="+!!m_train);

        if (m_train != null)    // пропускаем код если для вагона нет состава
        {
            direction = me.GetDirectionRelativeToTrain();   // получем направление вагона относительно состава
            pos = m_LLC.MyPosition();                       // получем положение вагона в составе
            if (pos != m_nOldPos)
            {
                m_nOldPos = pos;
                SetCoupler(pos, direction); // устанавливаем сцепки
                PostMessage(me,"LightsEvent","",0.01);
                PostMessage(null,"RefreshBrowser","",0.0);
            }
        }
    }

    thread void Nasos(Asset MyAsset)
    {
        if (!m_bToplivo_nasos)
        {
            m_bToplivo_nasos=true;
            m_bNasos_state=true;
            while (m_bNasos_state  and !m_bDeRailed and !m_bPowerState)
            {
                PlaySoundAndSleep(MyAsset,"sound/topl_nasos.wav",m_fSoundkoef*0.3,8.0f,100.0f,me,"a.disel");
            }

            m_bToplivo_nasos=false;
        }
    }

    void Nasos()
    {
        Nasos(m_sounds_asset);
    }

    thread void Ventilator(Asset MyAsset)//звук вентилятора
    {
        if (!m_bZal_mv and m_bPowerState)
        {
            m_bZal_mv=true;
            float dt;
            m_fDizelAddSound=m_fDizelAddSoundbase;
            PlaySoundAndSleep(MyAsset,"sound/ventilator_start.wav",m_fSoundkoef*0.5,8.0f,100.0f,me,"a.fan0");

            while (m_bMotorVent and m_bPowerState and !m_bDeRailed and m_bZal_mv)
            {
                PlaySoundAndSleep(MyAsset,"sound/ventilator_run.wav",m_fSoundkoef*0.5,8.0f,100.0f,me,"a.fan0");
            }//while

            PlaySoundAndSleep(MyAsset,"sound/ventilator_stop.wav",m_fSoundkoef*0.5,8.0f,100.0f,me,"a.fan0");
            m_fDizelAddSound=m_fDizelAddSoundbase;
            m_bZal_mv=false;
        }
    }

    float GetNormalTimeInMin()
    {
        float h = World.GetGameTime()+0.5;
        if (h>1) h=h-1;
        h=h*24*60;
        return h;
    }

    thread void HourMonitor()
    {
        int t=0;
        float Currtime1,intencity=0;
        Train train;
        while (!m_bDeRailed)
        {
            train = GetMyTrain();
            Sleep(5.0);
            if (train) continue;

            if (m_nOldPrior != train.GetTrainPriorityNumber())
            {
                m_nOldPrior = train.GetTrainPriorityNumber();
                PostMessage(me,"LightsEvent","",0.5);
                PostMessage(null,"RefreshBrowser","",0.8);
            }
            if (World.GetGameTime() >=0.25 and  World.GetGameTime()<=0.8  )
            {
                if (m_sOldDayTime!="Night")
                {
                    m_sOldDayTime="Night";
                    PostMessage(me,"LightsEvent","",0.5);
                    PostMessage(null,"RefreshBrowser","",1);
                }
            }
            else
            {
                if (m_sOldDayTime!="Day")
                {
                    m_sOldDayTime="Day";
                    PostMessage(me,"LightsEvent","",0.5);
                    PostMessage(null,"RefreshBrowser","",1);
                }
            }

            Currtime1= GetNormalTimeInMin();

            if (Currtime1>190 and Currtime1<330)
            {
                intencity= (330-Currtime1)/140;
                SetHeadlightColor(m_fHeadlR*intencity,m_fHeadlG*intencity,m_fHeadlB*intencity);
            }
            else if (Currtime1>1050 and Currtime1<1170)
            {
                intencity= (Currtime1-1050)/120;
                SetHeadlightColor(m_fHeadlR*intencity,m_fHeadlG*intencity,m_fHeadlB*intencity);
            }
            else if (Currtime1>330 and Currtime1<1020 and intencity!=0)
            {
                intencity=0;
                SetHeadlightColor(0,0,0);
            }
            else if ((Currtime1<190 or Currtime1>1020) and intencity!=1)
            {
                intencity=1;
                SetHeadlightColor(m_fHeadlR,m_fHeadlG,m_fHeadlB);
            }
            t++;

            if (t > 2)
            {
                t=0;
                Vehicle[] veh = train.GetVehicles();
                bool MeIsMain=true;
                m_nTheSameLocoIndex=-1;

                int q = 0;

                bool end=false;

                while (q < veh.size() and !end)
                {
                    if (veh[q]==me and me.GetDirectionRelativeToTrain())
                    {
                        if ((q+1)<veh.size() and veh[q+1].isclass(MotovozLocomotive) and !veh[q+1].GetDirectionRelativeToTrain())
                        {
                            m_nTheSameLocoIndex=q+1;
                            end=true;
                        }
                    }

                    if (veh[q].isclass(MotovozLocomotive) and veh[q].GetDirectionRelativeToTrain())
                    {
                        if ((q+1)<veh.size() and veh[q+1]==me and !me.GetDirectionRelativeToTrain())
                        {
                            m_nTheSameLocoIndex=q;
                            end=true;
                            MeIsMain=false;
                        }
                    }
                    q++;
                }
            }

            CouplerMonitor();
        }
    }

    void DetachTrainEvents()
    {
        inherited();
        AddHandler(m_train,"Train", "NotifyHeadlights", null);
        AddHandler(m_train,"Train", "TurnAround", null);
        AddHandler(m_train,"Train", "StartedMoving", null);
        AddHandler(m_train, "Train", "LightHandler", null);
    }

    void AttachTrainEvents()
    {        
        inherited();
        AddHandler(m_train,"Train", "TurnAround", "LightHandler");
        AddHandler(m_train,"Train", "StartedMoving","LightHandler");
        AddHandler(m_train,"Train", "NotifyHeadlights","LightHandler");
        AddHandler(m_train, "Train", "LightHandler", "LightHandler");
    }

    void OnTrainChanged(Train train)
    {
        //Debug("OnTrainChanged", "");
        inherited(train);
        m_LLC.Init(me);
        CouplerMonitor();
    }

    public void Derailed(Message msg)
    {
        if (msg.src == me)
            m_bDeRailed=true;
    }

    public void LightHandler(Message msg)
    {
        //Debug("LightHandler", msg.minor);
        
        if (msg.src==me or msg.src==m_train)
        {
            if (msg.minor=="BoardedTrain" or msg.minor=="EnterTrack")
            {
                ReInitController();
            }
            if (msg.minor == "TurnAround") m_bDirForward = !m_bDirForward;

            m_LLC.LightsEvent(msg, m_bDirForward);
        }
    }

    string GetHeadCntVD()
    {
        string s = "";
        Vehicle[] vehicles = m_train.GetVehicles();
        HTMLWindow hw = HTMLWindow;
        int w = 0, l = 0, 
            i, len = vehicles.size();
        for (i = 0; i < len; i++)
        {
            w = w + vehicles[i].GetMass();
            l = l + vehicles[i].GetLength();
        }

        s=s+"<font color='#000000' size=3><b>" + m_train.GetTrainDisplayName()+"</b></font><br>";
        s=s+"<font color='#000000'>";
        s=s+"вес поезда "+w+" <br>";
        s=s+"длина поезда "+l+" <br>";
        s=s+hw.MakeLink("live://priority","приоритет")+" ";
        s=s+hw.MakeLink("live://priority", " "+m_train.GetTrainPriorityNumber());
        s=s+"</font>";
        s=s+"<br><br>";
        return s;
    }

    string GetCntVD()
    {
        StringTable ST=GetAsset().GetStringTable();

        string s;
        HTMLWindow hw=HTMLWindow;
        string tbl= hw.MakeTable(
            hw.MakeRow(
                hw.MakeCell(hw.MakeLink("live://disel5on2^"+GetId()+"^diselff",hw.MakeImage("pusk.tga",false,40,40)))+
                hw.MakeCell(hw.MakeImage(m_sProcess,false,90,50))
        ));

        s=s+ hw.MakeTable( hw.MakeRow(
                hw.MakeCell(hw.GetPercentHTMLCode(null,m_fuelQ,GetAsset().FindAsset("fuel_product")/*"fuel: "+(string)m_fuelQ.GetQueueCount()+" litres, "+(string)hw.GetQueueRoundedPercent(m_fuelQ,GetAsset().FindAsset("fuel_product"))+"%"*/),polozh)
        ))+

            hw.MakeTable(
            hw.MakeRow(
                hw.MakeCell(
                    hw.MakeTable(
                        hw.MakeRow(
                            hw.MakeCell(tbl,"bgcolor='#AAAAAA'")
                        )
                    )
                    ,"bgcolor='#555555'")
            )

        ) ;
        return s;
    }

    public void ViewDetails(Message msg)
    {
        if (!m_Browser)
        {
            m_Browser=Constructors.NewBrowser();
            m_Browser.SetWindowRect(100, 100, 560, 425);
        }

        string paramOutput="";
        paramOutput = paramOutput+GetHeadCntVD() +GetCntVD();
        int i;
        Vehicle[] veh = m_train.GetVehicles();
        for (i = 0; i < veh.size(); i++)
        {
            if (veh[i].isclass(Locomotive) and veh[i] !=me)
            {
                Soup sp=veh[i].GetProperties();
                string sl=sp.GetNamedTag("stateLights");
                if (sl!="")
                {
                    paramOutput=paramOutput+sp.GetNamedTag("GetCntVD");
                }
            }
        }
        m_Browser.LoadHTMLString(GetAsset(),paramOutput);
    }

	public void BrowserHandler(Message msg)
    {
 	 	string[] tok=Str.Tokens(msg.minor,"/");
 	 	string[] tok2=Str.Tokens(tok[1],"^");
 	 	if (tok2.size() > 1 and tok2[0]=="disel5on2" and Str.ToInt(tok2[1]) == GetId())
		{
            m_bDiselOff=!m_bDiselOff;
            if(!m_bDiselOff)
                Nasos();
            else
                m_bNasos_state=false;

            SetDieselState(!m_bDiselOff);
        }
	 	PostMessage(null,"RefreshBrowser","",0.4);
	}


    public void RefreshBrowser(Message msg)
    {
        if (m_Browser)
        {
            ViewDetails(msg);
        }
    }

    thread void beg11() // запуск лока ботом
    {
        Train train = null;
        while (!train) 
        {
            Sleep(5);
            train = GetMyTrain();
        }
        if (m_bDiselOn or train.GetAutopilotMode() > 1)
        {
            m_bDiselOff = false;
            SetDieselState(true);
            train.SetHeadlightState(true);
        }
    }

    public void BrowserClose(Message msg)
    {
        if (msg.src==m_Browser)
        {
            m_Browser=null;
        }
    }

    public void UpdateLocomotiveHandler(Message msg)
    {
        // самый первый лок - главный
        // второй - подчинённый
        // остальные не рассматриваются

        Vehicle[] veh = m_train.GetVehicles();
        bool MeIsMain=true;
        m_nTheSameLocoIndex=-1;

        int q = 0;

        bool end=false;

        while (q < veh.size() and !end)
        {
            if (veh[q]==me and me.GetDirectionRelativeToTrain())
            {
                if ((q+1)<veh.size() and veh[q+1].isclass(MotovozLocomotive) and !veh[q+1].GetDirectionRelativeToTrain())
                {
                    m_nTheSameLocoIndex=q+1;
                    end=true;
                }
            }

            if (veh[q].isclass(MotovozLocomotive) and veh[q].GetDirectionRelativeToTrain())
            {
                if ((q+1)<veh.size() and veh[q+1]==me and !me.GetDirectionRelativeToTrain())
                {
                    m_nTheSameLocoIndex=q;
                    end=true;
                    MeIsMain=false;
                }
            }
            q++;
        }

        if (!MeIsMain)
        {
            SetMeshVisible("mehanik",false,0.2);
            return;
        }

        SetMeshVisible("mehanik",true,0.2);

        MotovozLocomotive minorSection=null;
        if (m_nTheSameLocoIndex>=0)
            minorSection = cast<MotovozLocomotive>veh[m_nTheSameLocoIndex];

        if (cast<MotovozLocomotive>msg.src==me or (minorSection and cast<MotovozLocomotive>msg.src==minorSection))
        {
            if (m_CabData.top_nasos1 or (minorSection and minorSection.m_CabData.top_nasos2))
            {
                if (!m_bNasos_state)
                    Nasos();
                else
                    if (m_CabData.zapusk1 or (minorSection and minorSection.m_CabData.zapusk2))
                    {
                        SetDieselState(true);
                        m_CabData.zapusk1=false;
                        if (minorSection)
                            minorSection.m_CabData.zapusk2=false;
                    }
            }
            else
            {
                SetDieselState(false);
                m_bNasos_state=false;
            }

            if (minorSection)
            {
                if (m_CabData.top_nasos2 or minorSection.m_CabData.top_nasos1)
                {
                    if (!minorSection.m_bNasos_state)
                        minorSection.Nasos();
                    else
                        if (m_CabData.zapusk2 or minorSection.m_CabData.zapusk1)
                        {
                            minorSection.SetDieselState(true);
                            m_CabData.zapusk2=false;
                            minorSection.m_CabData.zapusk1=false;
                        }
                }
                else
                {
                    minorSection.SetDieselState(false);
                    minorSection.m_bNasos_state=false;
                }
            }
        }
    }

    void DataReseacher(void) //обработчик данных, выданных кабиной
    {
        Vehicle[] veh = m_train.GetVehicles();
        int i;
        for (i = 0; i < veh.size(); i++)
        {
            PostMessage(veh[i], "LOCO", "Update", 0);
        }
    }

    CabinData GetCabinData()   // связь кабина-локомотив
    {
        return cast<CabinData>m_CabData;
    }

    void SetCabinData(CabinData data)
    {
        m_CabData=cast<chme5_CabinData>data;
        DataReseacher();
    }

    public void NMflow(Message msg)
    {
        m_fComprEff=Str.ToFloat(msg.minor);
    }

    Soup MyVehicleSoup1(void)  // выдавалка свойств напорной магистрали
    {
        Soup sp3= Constructors.NewSoup();
        sp3.SetNamedTag("m_fComprEff",m_fComprEff);       // мощность псевдокомпрессора (т.е. трубы от главного резервуара другого, запущенного лока)
        sp3.SetNamedTag("m_bPowerState",m_bCompressorStarted);    // состояние компрессора текущего лока
        return sp3;
    }

    Soup GetProperties() 
    {        
        Soup sp = inherited();
        sp.SetNamedTag("GetCntVD",GetCntVD());
        sp.SetNamedSoup("MyVehicleSoup1", MyVehicleSoup1()); // запоминаются (или выдаются ф-ции VehicleNM другого лока) свойства Напорной Магистрали
        sp.SetNamedTag("m_bDiselOn",m_bDiselOn);
        sp.SetNamedTag("number",m_sLocoNumber);
        sp.SetNamedTag("depo",m_sDepo);
        sp.SetNamedTag("dir_forward", m_bDirForward);

        return sp;
    }

    void SetProperties(Soup sp)
    {
        inherited(sp);
        m_bDiselOn = sp.GetNamedTagAsBool("m_bDiselOn",false);
        m_bDirForward = sp.GetNamedTagAsBool("dir_forward", true);
        if (sp.GetNamedTag("number")!="") m_sLocoNumber = sp.GetNamedTag("number");
        if (sp.GetNamedTag("depo")!="") m_sDepo=sp.GetNamedTag("depo");
        UpdateSideText();
        m_fComprEff =  sp.GetNamedTagAsFloat("m_fComprEff");
        PostMessage(me,"LightsEventHand","autoOn",0.01);
    }

    void UpdateSideText(void)
    {
        string top="АГМС "+ m_sLocoNumber;
        SetFXNameText("side-r1",top);
        SetFXNameText("side-l1",top);
        SetFXNameText("side-r2","ДЕПО");
        SetFXNameText("side-l2","ДЕПО");
        SetFXNameText("side-r3",m_sDepo);
        SetFXNameText("side-l3",m_sDepo);
    }

    string GetDescriptionHTML(void)
    {
        string s = inherited();
        s=s+HTMLWindow.CheckBox("live://property/m_bDiselOn",m_bDiselOn)+" Engine on at startup";
        s=s+"<br><a href='live://property/number'>Номер: "+m_sLocoNumber+"</a>";
        s=s+"<br><a href='live://property/depo'>Депо: "+m_sDepo+"</a>";
        return s;
    }//GetDescriptionHTML

    string GetPropertyType(string propertyID)
    {
        if (propertyID == "m_bDiselOn")
        {
            return "link";
        }//if
        if (propertyID == "number" or propertyID == "depo")
            return "string";
        return inherited(propertyID);
    }//GetPropertyType

    string GetPropertyName(string propertyID)
    {
        if (propertyID == "number") return "Номер";
        if (propertyID == "depo") return "Депо";
        return inherited(propertyID);
    }//GetPropertyName

    string GetPropertyValue(string propertyID)
    {
        if (propertyID == "number") return m_sLocoNumber;
        if (propertyID == "depo") return m_sDepo;
        return inherited(propertyID);
    }//GetPropertyValue

    void SetPropertyValue(string propertyID, string value)
    {
        if (propertyID == "number" or propertyID == "depo")
        {
            if (propertyID == "number") 
                m_sLocoNumber = value;
            else 
                m_sDepo = value;
            
            UpdateSideText();
            return;
        }//if
        inherited(propertyID,value);
    }//SetPropertyValue

    void LinkPropertyValue(string propertyID)
    {
        if (propertyID == "m_bDiselOn")
        {
            m_bDiselOn = !m_bDiselOn;
            return;
        }//if
        inherited(propertyID);
    }//LinkPropertyValue

    public void InternalHandler(Message msg) // определяет, сидим ли мы внутри кабины или нет
    { // и посволяет кабине и локу знать это
        if (msg.minor=="Internal-View")
            m_CabData.WeInsideCabin=true;  // мы внутри кабины
        else
            m_CabData.WeInsideCabin=false;
    }

    thread void TZLoop()
    {
        while (1)
        {
            if ((me.GetBrakeCylinderPressure()*981.0173-1.0138 > 0.7) and  3.6*Math.Fabs(me.GetVelocity())>3 )
                PlaySoundAndSleep(m_sounds_asset, "sound/stop.wav", 1.0f, 10.0f, 100.0f, me, "a.bog0");
            else
                Sleep(1.0);
        }
    }

    public void CouplerHandler(Message msg)
    {
        if (msg.src != me) return;
        
        //Debug("CouplerHandler", msg.minor);
        inherited(msg);

        if (msg.minor=="Decoupled")
            World.PlaySound(m_sounds_asset,"sound/decoupling.wav",1.0,10.0,100.0,me,"a.bog0");
        else
            World.PlaySound(m_sounds_asset,"sound/coupling.wav",1.0,10.0,100.0,me,"a.bog0");
        
        LightHandler(msg);
    }

    thread void ScripLoop()
    {
        float M_vel=Math.Rand(26.8,29.3);
        Train train = null;
        while (!m_bDeRailed)
        {
            train = GetMyTrain();
            if (!train)
            {
                Sleep(5);
                continue;
            }
            if (Math.Fabs(GetVelocity()) > M_vel)
                train.Derail();
            else  if (Math.Fabs(GetVelocity())>25.3)
                PlaySoundAndSleep(m_sounds_asset, "sound/warning.wav", 1.0f, 10.0f, 100.0f, me, "a.disel");
            else  if (Math.Fabs(GetVelocity())>19.4)
                PlaySoundAndSleep(m_sounds_asset, "sound/skrip_speed.wav", 1.0f, 10.0f, 100.0f, me, "a.attach0");
            else
                Sleep(5.0);
        }
    }

    thread void SpeedSound()
    {
        float Min_vel=Math.Rand(2,10);
        float Max_vel=Math.Rand(Min_vel,3);

        while (!m_bDeRailed)
        {
            if (Math.Fabs(GetVelocity()) >= Min_vel and Math.Fabs(GetVelocity()) <= Max_vel)
                PlaySoundAndSleep(m_sounds_asset, "sound/skrip.wav", 1.0f, 10.0f, 100.0f, me, "a.bog0");
            else
                Sleep(5.0);
        }
    }

    thread void TED_sound()
    {
        while (!m_bDeRailed)
        {
            if (Math.Fabs(GetVelocity())<=3.2 and m_bPowerState and Math.Fabs(GetEngineParam ("applied-force")) > 0)
                PlaySoundAndSleep(m_sounds_asset, "sound/tp_dn.wav", 1.0f, 10.0f, 100.0f, me, "a.attach0");
            else
                Sleep(5.0);
        }
    }

    public void Init(void)
    {
        inherited();
        m_LLC = new LocoLightController_d2(); //v
        m_LLC.Init(me);  //v
        UpdateSideText();
        SetCabinSwayAmount(0.5);
        SetRollBasedOnTrack(-1.7);
        m_CabData = new chme5_CabinData();

        m_SA3_coupled     = GetAsset().FindAsset("SA3-coupled");
        m_Sa3_uncoupled       = GetAsset().FindAsset("sa3-uncoupled");

        m_Sa3_uncoupled_NM    = GetAsset().FindAsset("sa3-uncoupled-nm");
        m_Sa3_coupled_NM      = GetAsset().FindAsset("sa3-coupled-nm");

        SetCouplerAttach(0,false);  // устанавливаем переднюю сцепку в положение - разомкнуто
        SetCouplerAttach(1,false);  // устанавливаем заднюю сцепку в положение - разомкнуто

        AddHandler(me, "World", "ModuleInit", "ModuleInitHandler");
        if ( HasMesh("fan0"))
            StopMeshAnimation("fan0");

        AddHandler(me,"LPC-298469","","LPCHandler");//minor can be "StartUp","ShutDown","QuietShutDown","QuietStartUp"
        SetCompressorEfficiency(0.0f);
        SetWheelslipTractionMultiplier(1); // выключение пищащего звука

        Soup extensions = GetAsset().GetConfigSoup().GetNamedSoup("extensions");

        m_number_start_s = extensions.GetNamedTagAsInt("number_start_sounds");
        m_number_stop_s = extensions.GetNamedTagAsInt("number_stop_sounds");

        m_fFuelCS = extensions.GetNamedTagAsFloat("fuel_consume_speed");     //fuel consumption speed on idle
        m_fFcs_k = extensions.GetNamedTagAsFloat("fuel_consume_speed_k");    //короч это число есть вот это: (G-m_fFuelCS)/R = k
        m_fDizelAddSoundbase=extensions.GetNamedTagAsFloat("diesel_add_sound");
        m_fSoundkoef = extensions.GetNamedTagAsFloat("Sound_koef");
        m_nmb_pos = extensions.GetNamedTagAsFloat("koef_of_positions");
        m_fMax_force = extensions.GetNamedTagAsFloat("m_fMax_force")*10;
        m_fMax_force_bw = extensions.GetNamedTagAsFloat("m_fMax_force_bw")*10;
        //где R - разность расхода топлива между двумя соседними позициями контроллера. Физ смысл - равен повышению расхода топлива при
        //увеличении позиции контроллера на единицу. Зависимость конешн не прямая, но оч близка к ней. Сложность в том что в ТРС
        //тока 8 позиций плюс дробные, поэтому расчитывать нужно внимательно, если мыслей нет обращайтесь=)

        m_fuelQ = GetQueue("fuel");
        m_sounds_asset = GetAsset().FindAsset("sounds");

        PostMessage(me,"LPC-298469","ShutDown",0.1f);

        PostMessage(me,"pfx","-0-1",0.0);

        AddHandler(me,"NM-flow","","NMflow");

        string[] str1= Str.Tokens(extensions.GetNamedTag("headlightRGB"),",");

        m_fHeadlR=((float)Str.ToInt(str1[0]))/255;
        m_fHeadlG=((float)Str.ToInt(str1[1]))/255;
        m_fHeadlB=((float)Str.ToInt(str1[2]))/255;

        SetMeshTranslation("dim",0,-300.0,0);
        SetMeshTranslation("dim2",0,-300.0,0);

        SetMeshOrientation("dim",-1.77,0,0);
        SetMeshOrientation("dim2",-1.77,0,0);

        TZLoop();
        ScripLoop();
        SpeedSound();

        // старое m_LLC этой версии работало криво, т.к. помещало в GlobalCode
        //все миноры сообщений TurnAround  StartedMoving BoardedTrain Coupled EnterTrack LeftTrain

        AddHandler(me,"LOCO","Update","UpdateLocomotiveHandler");
        AddHandler(me,"Camera","","InternalHandler");

        AddHandler(me,"Vehicle", "Derailed", "Derailed");

        AddHandler(me,"Vehicle","Coupled","CouplerHandler");
        AddHandler(me,"Vehicle","Decoupled","CouplerHandler");

        AddHandler(me,"DriverCharacter", "LeftTrain", "LightHandler");
        AddHandler(me,"DriverCharacter",  "BoardedTrain","LightHandler");

        AddHandler(me,"LightsEvent","","LightHandler"); //v     :)
        AddHandler(me,"LightsEventHand","","LightHandler"); //v     :)
        AddHandler(me,"MapObject","View-Details","ViewDetails");
        AddHandler(me,"RefreshBrowser","","RefreshBrowser");
		AddHandler(me,"Browser-URL", "", "BrowserHandler");
        AddHandler(me,"Browser-Closed","","BrowserClose");

        AddHandler(me,"", "Enter" , "AnyEnterH");

        MainCompressorLooper();
        HourMonitor(); //v       , ..
        TED_sound();
    }
};
//#endregion MotovozLocomotive 

