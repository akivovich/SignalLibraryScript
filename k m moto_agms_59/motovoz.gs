// ---------------------------------------------------------------------------------------------
// k m moto_AGMs-59 (metro motor car built from RZD_MPT4-59): lamps and warning lamp.
// This script is the original of RZD_MPT4-59 plus the side lettering and the warning lamp control (see below).
//
// Side lettering: name effects side-r1..3 / side-l1..3 on a.sider1..3 / a.sidel1..3 show
//   "AGMS <number>" / "DEPO" / "<depo>" (in Russian); properties "number" and "depo"
//   (property editor and links in the description), saved with the session, see UpdateSideText().
//
// Lower lamps on the end beams (controlled by this script, LocoLightController_d2):
//   red    alr0 / arr0 (a.frr / a.flr)          front end,  blr0 / brr0 (a.frr001 / a.flr001)  rear end
//   Meshes from the kuid-table: "white" ADM1_llc_Wite_bufer, "red" AGV2_llc_RED_bufer.
//   Codes in the loco panel: flw, frw, flr, frr (front), blw, brw, blr, brr (rear).
//
// Roof searchlights (not controlled by this script, stay dark):
//   asw0 on a.light1  - front searchlight, lens at the front edge of the cab roof
//   bsw0 on a.light0  - rear searchlight, lens at the rear edge of the cab roof
//   (a.light1 / a.light0 also carry the game's headlight glow default-night-forward / -backward)
//   Spare points for that glow (change "att" of the night meshes in config.txt to try them):
//     a.light0_wall (0, 0.94, 3.30)      - old MPT4 spot on the cab rear wall
//     a.light0_out  (-0.02, 0.51, 3.73)  - 13 cm behind the rear searchlight lens
//     a.light1_out  (-0.02, -2.14, 3.73) - 13 cm in front of the front searchlight lens
//   Both are "attachment" effects in config.txt; to light one:
//     myLoc.SetFXAttachment("asw0", myLoc.GetAsset().FindAsset("white"));
//   and to switch it off: myLoc.SetFXAttachment("asw0", null);
//
// Warning lamp (orange lamp on the right of the cab roof, mesh body/warning_lamp.im from k mVg D-EKA):
//   warning_lamp0 - "corona" effect on a.warning_lamp0, texture <kuid:486576:81003> (kuid-table "warning_lamp"),
//   the point is just above the dome: a corona whose centre is covered by geometry (the opaque
//   lamp guard / the dome) is not drawn, even though SetFXCoronaTexture() succeeds,
//   frequency 1 Hz. Controlled in LocoLightController_d2: dark after Init() and in LightsOff(),
//   blinking after LightsOn() while at least one white lamp (flw/frw/blw/brw) is on:
//     myLoc.SetFXCoronaTexture("warning_lamp0", null);                                   // off
//     myLoc.SetFXCoronaTexture("warning_lamp0", myLoc.GetAsset().FindAsset("warning_lamp"));   // blinking
//
// Headlight beam: the standard Trainz headlight, colour from extensions/headlightrgb,
//   dimmed by HourMonitor() with the time of day (SetHeadlightColor).
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

class LocoLightController_d2
{
    Locomotive myLoc = null;

    public bool DoubleLoco = false;

    public int MyPosition(Train train)
    {
        Vehicle[] vehicles = train.GetVehicles();
        int  len = vehicles.size();

        if (len == 1)               return Pos.SingleLoco;
        if (me == vehicles[0])      return Pos.FirstLoco;
        if (me == vehicles[len-1])  return Pos.LastLoco;
        return Pos.MiddleLoco;
    }

    int  myPosition()
    {
        return MyPosition(myLoc.GetMyTrain());
    }

    bool isActive()
    {
        DriverCharacter adc = myLoc.GetMyTrain().GetActiveDriver();
        DriverCharacter[] dcl = World.GetDriverCharacterList();
        int i = 0;
        for(; i < dcl.size(); i++)
        {
            if (dcl[i].GetLocation()==myLoc and dcl[i] == adc) return true;
        }
        return false;
    }

    void setWarningLamp(bool turn_on)
    {        
        if (turn_on)
        {
            Asset warning_lamp = myLoc.GetAsset().FindAsset("warning_lamp");
            Interface.Print("setWarningLamp:Asset="+!!warning_lamp);
            myLoc.SetFXCoronaTexture("warning_lamp0",warning_lamp);
        }
        else
        {
            myLoc.SetFXCoronaTexture("warning_lamp0", null);
        }            
    }

    public void Init(Locomotive loc)
    {
        myLoc = loc;
        //myLoc.SetFXCoronaTexture("warning_lamp0", null);   // warning lamp is dark until the headlights are on
        //Asset warning_lamp = myLoc.GetAsset().FindAsset("warning_lamp");
        //Interface.Print("warning_lamp:"+!!warning_lamp);
        //myLoc.SetFXCoronaTexture("warning_lamp0",warning_lamp);
        setWarningLamp(false);
    }

    void LightsOff()
    {
        Interface.Print("LightsOff");
        myLoc.SetFXAttachment("alr0",null);
        myLoc.SetFXAttachment("blr0",null);
        myLoc.SetFXAttachment("brr0",null);
        myLoc.SetFXAttachment("arr0",null);
        myLoc.SetFXCoronaTexture("warning_lamp0",null);
        setWarningLamp(/*turn_on=*/false);
    }

    void LightsOn(bool dirForward)
    {        
        setWarningLamp(/*turn_on=*/true);
        Asset red = myLoc.GetAsset().FindAsset("red");
        int pos = myPosition();
        Interface.Print("LightsOn:pos="+pos+",dirForward="+dirForward);

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
            if (pos == Pos.SingleLoco or pos == Pos.FirstLoco)
                alr = arr = red;
            else
                alr = arr = null;
        }

        myLoc.SetFXAttachment("alr0", alr);
        myLoc.SetFXAttachment("blr0", blr);
        myLoc.SetFXAttachment("brr0", brr);
        myLoc.SetFXAttachment("arr0", arr);
    }

    public void LightsEvent(Message msg, bool dirForward)
    {
        Train myTrain = myLoc.GetMyTrain();
        bool lightState = myTrain.GetHeadlightState(); 
        Interface.Print("LightsEvent:"+msg.minor+",lightState="+lightState);

        if (lightState)
            LightsOn(dirForward);
        else 
            LightsOff();
    }
};

//
class MotovozLocomotive isclass TVRController_Locomotive2
{
    bool motor_vent, CompressorStarted = false,
         Disel1, zal_mv, fuel_cons;
    bool diselon = true, 
         diseloff = true;
    bool dirForward;
    string process="disel_is_off.tga", polozh="bgcolor='#AAAAAA'";
    chme5_CabinData cd=null;
    int  nmb_pos=8, number_start_s=1, number_stop_s=1;
    Train MyTrain2;
    float time1, time2,water_heat,water_cold;

    chme5_CabinData MyData;

    float LocoVelocity=0;

    Soup wavdb;

    float max_force=400;
    float max_force_bw=200;

    float headlR = 1;
    float headlG = 1;
    float headlB = 1;
    string sideNumber="986";
    string sideDepo="ПЕЧАТНИКИ";
    void UpdateSideText(void);

    Asset sounds_asset;

    float mr_press=500;
    float DizelAddSound = 0,
          DizelAddSoundbase,
          soundkoef = 1.4;

    bool powerState;
    ProductQueue fuelQ;
    float fuelCS,fcs_k;               // G = %throttle% * fcs_k + fuelCS, where G is fuel consumption speed on current throttle position

    float ComprEff=0;
    bool objectRunningDriver =false;

    bool toplivo_nasos=false;
    bool nasos_state=false;
    bool diselFlag=false;

    int Oter2TE116=-1;

    bool    m_dirForward = true;
    bool    DeRailed=false;
    Train   oldTrain=null;  //v
    int oldPrior=2;
    int     oldPos=-1;
    string  oldDayTime="";
    LocoLightController_d2 LLC = null;
    Browser VDB;
    Asset   SA3_coupled, sa3_uncoupled, sa3_uncoupled_NM, sa3_coupled_NM;

    public void LightHandler(Message msg); //v  ,

    public void Init(void);
    public void LPCHandler(Message msg);
    thread void PowerLoop(ProductQueue fQ);

    thread void Compressor();
    thread void Disel(Asset MyAsset);
    thread void beg11();
    
    public void ModuleInitHandler(Message msg)
    {
        if (objectRunningDriver)
            return;

        if (World.GetCurrentModule() == World.DRIVER_MODULE)
        {
            objectRunningDriver =true;
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

    bool IsFronmostLoco(void)
    {
        if (me.GetMyTrain() and me.GetId()==me.GetMyTrain().GetFrontmostLocomotive().GetId())
            return true;
        return false;
    }

    float VehicleNM(float MyPressure)
    {
        Vehicle[] veh=me.GetMyTrain().GetVehicles();
        float Locos=0;
        float LocosOn=0;
        Soup SP1;
        int q;
        float otherCE;
        for(q=0;q<veh.size();q++)
        {
            if (veh[q] and veh[q].isclass(Locomotive))
            {
                Locomotive loco1=cast<Locomotive>veh[q];
                Locos++;

                if (veh[q]!=me)
                {
                    SP1=veh[q].GetProperties().GetNamedSoup("MyVehicleSoup1");
                    if (SP1)
                    {
                        otherCE=SP1.GetNamedTagAsFloat("ComprEff");
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
                    if (SP1.GetNamedTagAsBool("powerState",false))
                        LocosOn++;
                }
                else
                    if (CompressorStarted)
                        LocosOn++;
            }
        }
        return LocosOn / Locos;
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
        Soup wavdb = srcAsset.GetConfigSoup().GetNamedSoup("extensions").GetNamedSoup("sound-length-base");
        Sleep(wavdb.GetNamedTagAsFloat(soundFile, 10.0) - 0.05);
    }

    thread void Compressor(void)
    {
        float oldpress;
        bool mode2;
        Asset MyAsset = sounds_asset;
        int j;

        if (!CompressorStarted and powerState )
        {
            CompressorStarted=true;
            DizelAddSound=DizelAddSoundbase;
            PlaySoundAndSleep(MyAsset,"sound/compressor_start.wav",soundkoef*0.5,10.0f,100.0f,me,"a.compressor");

            mr_press = GetPressureParam(me,"main-reservoir-pressure");

            while ((mr_press < 860) and powerState)     //oбычная "зарядка"
            {
                PlaySoundAndSleep(MyAsset,"sound/compressor_run.wav",soundkoef*0.5,10.0f,100.0f,me,"a.compressor");//7
                mr_press = GetPressureParam(me,"main-reservoir-pressure");
            }

            ComprEff=0;
            PlaySoundAndSleep(MyAsset,"sound/compressor_stop.wav",soundkoef*0.5,10.0f,100.0f,me,"a.compressor");
            DizelAddSound=0;
            CompressorStarted = false;
        }
    }

    thread void MainCompressorLooper()
    {
        while(!DeRailed)
        {
            Sleep(1);
            if (me.GetMyTrain().GetAutopilotMode()>1 and !powerState)
                beg11();

            //работа компрессора ТУТ !!!

            mr_press = GetPressureParam(me,"main-reservoir-pressure");
            if (IsFronmostLoco())
            {
                if (!(VehicleNM(mr_press)==0))
                {
                    ComprEff = VehicleNM(mr_press);
                    if (ComprEff<0) ComprEff=0;
                    if (ComprEff>1) ComprEff=1;
                    SetCompressorEfficiency(ComprEff);
                }
                else
                {
                    if (mr_press >0)
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
        fuel_cons = true;

        PostMessage(me,"LPCTimer-298469","FTick",1.0f);
        while(powerState)
        {
            wait()
            {
                on "LPCTimer-298469","FTick":
                {
                    if (!powerState)
                    {
                        fuel_cons = false;
                        break;
                    }//if

                    if (!fQ.GetQueueCount())
                    {
                        //SetDieselState(false);
                        fuel_cons = false;
                        powerState=false;
                        break;
                    }//if
                    consumed = consumed + (GetEngineSetting("throttle")*fcs_k + fuelCS) * dt;
                    while(consumed >= 1.0f)
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
            if (!powerState)
            {
                if (!fuelQ.GetQueueCount())
                {
                    SetMaximumTractiveEffort(0.0f);
                    return;
                }//if

                Disel(sounds_asset);
            }
            return;
        }//if
        if (msg.minor == "ShutDown")
        {
            SetMaximumTractiveEffort(0.0f);
            powerState = false;
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

        if (!Disel1)
        {
            Disel1=true;

            process="disel_is_going.tga";
            PostMessage(null,"RefreshBrowser","",0.0);

            PostMessage(me,"pfx","+2",16.0);

            PostMessage(me,"pfx","+1-2",33.0);

            for(qw=0;qw<number_start_s;qw++)
                PlaySoundAndSleep(MyAsset,"sound/engine_start_"+qw+".wav",soundkoef*(1.2+DizelAddSound),20.0f,1000.0f,me,"a.disel");

            if (World.GetWeatherType()<=2)
            {
                if (Oter2TE116>=0)
                    SetMaximumTractiveEffort(2*max_force_bw);
                else
                    SetMaximumTractiveEffort(max_force);
            }
            else
            {
                if (Oter2TE116>=0)
                    SetMaximumTractiveEffort(2*max_force_bw);
                else
                    SetMaximumTractiveEffort(max_force_bw);
            }

            SetWheelslipTractionMultiplier(0.6);

            SetMeshTranslation("dim",0,0,0);
            SetMeshTranslation("dim2",0,0,0);

            process="disel_is_on.tga";

            powerState = true;

            sndTr = 1;
            PowerLoop(fuelQ);
            PostMessage(null,"RefreshBrowser","",0.0);

            //Compressor();

            while(powerState and !DeRailed)
            {
                if (mr_press<780)
                    Compressor();

                currTr = (int)(GetEngineSetting("throttle")*nmb_pos);
                /*if (sndTr>4 and !k1) {soundkoef=soundkoef-0.5;k1 = true;}
                else if (sndTr<=4 and k1) {soundkoef=soundkoef+0.5;k1 =false;}
                if (sndTr>6 and !k7) {soundkoef=soundkoef-0.4;k7 = true;}
                else if (sndTr<=6 and k7) {soundkoef=soundkoef+0.4;k7 =false;}*/

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
                PlaySoundAndSleep(MyAsset,"sound/"+sndFile+".wav",soundkoef*(1.05+DizelAddSound),10.0f,1000.0f,me,"a.disel");
            }//while

            SetMeshTranslation("dim",0,-300.0,0);
            SetMeshTranslation("dim2",0,-300.0,0);

            PostMessage(me,"pfx","-0-1",0.6);

            for(qw=0;qw<number_stop_s;qw++)
                PlaySoundAndSleep(MyAsset,"sound/engine_stop_"+qw+".wav",soundkoef*(1.05+DizelAddSound),10.0f,1000.0f,me,"a.disel");

            SetMaximumTractiveEffort(0);

            SetWheelslipTractionMultiplier(1);

            process="disel_is_off.tga";
            PostMessage(null,"RefreshBrowser","",0.0);
            Disel1=false;
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
        //        false   -   разомкнутоя     (SA3-uncoupled)
        //        true    -   сомкнутоя       (SA3-coupled)

        if (pos == 0)           //перед вангона
        {
            if (type == true)   //устанавливаем размкнутую сцепку
            {
                SetFXAttachment ("front_couple", SA3_coupled);
            }
            else                //устанавливаем сомкнутую сцепку
            {
                SetFXAttachment ("front_couple", sa3_uncoupled);
            }
        }
        else                    //зад вагона
        {
            if (type == true)   //устанавливаем размкнутую сцепку
            {
                SetFXAttachment ("back_couple", SA3_coupled);
            }
            else                //устанавливаем сомкнутую сцепку
            {
                SetFXAttachment ("back_couple", sa3_uncoupled);
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
        //        true    -   направление вагона соотвецтвует направлению состава
        //        false   -   направление вагона не соотвецтвует направлению состава

        if (pos == 0)       // вагон одиночный
        {
            SetCouplerAttach(0,false);
            SetCouplerAttach(1,false);
        }
        else if (pos == 1)  // вагон в начале состава
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
        else if (pos == 2)  // вагон в центре состава
        {
            SetCouplerAttach(0,true);
            SetCouplerAttach(1,true);
        }
        else if (pos == 3)  // вагон в конце состава
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
            if (!powerState and fuelQ.GetQueueCount() )PostMessage(me,"LPC-298469","StartUp",0.0f);
        }
        else
        {
            if (powerState or ! fuelQ.GetQueueCount() )PostMessage(me,"LPC-298469","ShutDown",0.0f);
        }
    }

    void CouplerMonitor()
    {
        int     pos;
        bool    direction;

        Train myTrain = me.GetMyTrain();
        if (myTrain != null)        // пропускаем код если для вагона нет состава
        {
            direction = me.GetDirectionRelativeToTrain();   // получем направление вагона относительно состава
            pos = LLC.MyPosition(myTrain);                  // получем положение вагона в составе
            if (pos!=oldPos)
            {
                oldPos=pos;
                SetCoupler(pos, direction);                     // устанавливаем сцепки
                PostMessage(me,"LightsEvent","",0.01);
                PostMessage(null,"RefreshBrowser","",0.0);
            }
        }
    }

    thread void Nasos(Asset MyAsset)
    {
        if (!toplivo_nasos)
        {
            toplivo_nasos=true;
            nasos_state=true;
            while(nasos_state  and !DeRailed and !powerState)
            {
                PlaySoundAndSleep(MyAsset,"sound/topl_nasos.wav",soundkoef*0.3,8.0f,100.0f,me,"a.disel");
            }

            toplivo_nasos=false;
        }
    }

    void Nasos()
    {
        Nasos(sounds_asset);
    }

    thread void Ventilator(Asset MyAsset)//звук вентилятора
    {
        if (!zal_mv and powerState)
        {
            zal_mv=true;
            float dt;
            DizelAddSound=DizelAddSoundbase;
            PlaySoundAndSleep(MyAsset,"sound/ventilator_start.wav",soundkoef*0.5,8.0f,100.0f,me,"a.fan0");

            while(motor_vent and powerState and !DeRailed and zal_mv)
            {
                PlaySoundAndSleep(MyAsset,"sound/ventilator_run.wav",soundkoef*0.5,8.0f,100.0f,me,"a.fan0");
            }//while

            PlaySoundAndSleep(MyAsset,"sound/ventilator_stop.wav",soundkoef*0.5,8.0f,100.0f,me,"a.fan0");
            DizelAddSound=DizelAddSoundbase;
            zal_mv=false;
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
        while(!DeRailed)
        {
            if (oldPrior!=GetMyTrain().GetTrainPriorityNumber())
            {
                oldPrior=GetMyTrain().GetTrainPriorityNumber();
                PostMessage(me,"LightsEvent","",0.5);
                PostMessage(null,"RefreshBrowser","",0.8);
            }
            if (World.GetGameTime() >=0.25 and  World.GetGameTime()<=0.8  )
            {
                if (oldDayTime!="Night")
                {
                    oldDayTime="Night";
                    PostMessage(me,"LightsEvent","",0.5);
                    PostMessage(null,"RefreshBrowser","",1);
                }
            }
            else
            {
                if (oldDayTime!="Day")
                {
                    oldDayTime="Day";
                    PostMessage(me,"LightsEvent","",0.5);
                    PostMessage(null,"RefreshBrowser","",1);
                }
            }

            Currtime1= GetNormalTimeInMin();

            if (Currtime1>190 and Currtime1<330)
            {
                intencity= (330-Currtime1)/140;
                SetHeadlightColor(headlR*intencity,headlG*intencity,headlB*intencity);
            }

            else
                if (Currtime1>1050 and Currtime1<1170)
                {
                    intencity= (Currtime1-1050)/120;
                    SetHeadlightColor(headlR*intencity,headlG*intencity,headlB*intencity);
                }
            else
                if (Currtime1>330 and Currtime1<1020 and intencity!=0)
                {
                    intencity=0;
                    SetHeadlightColor(0,0,0);
                }
            else
                if ((Currtime1<190 or Currtime1>1020) and intencity!=1)
                {
                    intencity=1;
                    SetHeadlightColor(headlR,headlG,headlB);
                }
            t++;

            if (t>2)

            {
                t=0;
                Vehicle[] veh=me.GetMyTrain().GetVehicles();
                float Locos=0;
                float LocosOn=0;
                Soup SP1;
                //  int curr_116=0;
                bool MeIsMain=true;
                Oter2TE116=-1;

                int q=0;

                bool end=false;

                while(q<veh.size() and !end)
                {
                    if (veh[q]==me and me.GetDirectionRelativeToTrain())
                    {
                        if ((q+1)<veh.size() and veh[q+1].isclass(MotovozLocomotive) and !veh[q+1].GetDirectionRelativeToTrain())
                        {
                            Oter2TE116=q+1;
                            end=true;
                        }
                    }

                    if (veh[q].isclass(MotovozLocomotive) and veh[q].GetDirectionRelativeToTrain())
                    {
                        if ((q+1)<veh.size() and veh[q+1]==me and !me.GetDirectionRelativeToTrain())
                        {
                            Oter2TE116=q;
                            end=true;
                            MeIsMain=false;
                        }
                    }
                    q++;
                }

                if (!MeIsMain)
                    SetMeshVisible("mehanik",false,0.2);
                else
                    SetMeshVisible("mehanik",true,0.2);

                if (Oter2TE116>=0)
                {
                    SetFXAttachment ("back_couple_tm", sa3_coupled_NM);
                    SetMeshAnimationState("ploschadka",true);
                }
                else
                {
                    SetFXAttachment ("back_couple_tm", sa3_uncoupled_NM);
                    SetMeshAnimationState("ploschadka",false);
                }
            }

            CouplerMonitor();
            Sleep(5.0);
        }
    }

    public void NewHandlers(Message msg)
    {
        Train myTrain = me.GetMyTrain();
        if (oldTrain == myTrain)
        {
            return;
        }

        oldTrain = myTrain;
        //Sniff(oldTrain,"Train","NotifyHeadlights",true);
        AddHandler(oldTrain,"Train", "NotifyHeadlights","LightHandler");
        AddHandler(oldTrain,"Train", "TurnAround","LightHandler");
        AddHandler(oldTrain,"Train", "StartedMoving","LightHandler");
        AddHandler(oldTrain, "Train", "LightHandler", "LightHandler");
    }

    public void Derailed(Message msg)
    {
        if (msg.src==me)
            DeRailed=true;
    }

    public void LightHandler(Message msg)
    {
        Interface.Print("LightHandler:"+msg.minor);
        if (msg.src==me or msg.src==oldTrain)
        {
            if (msg.minor=="BoardedTrain" or msg.minor=="Coupled" or msg.minor=="EnterTrack")
            {
                NewHandlers(msg);
            }
            if (msg.minor == "TurnAround") m_dirForward = !m_dirForward;

            LLC.LightsEvent(msg, m_dirForward);
        }
    }

    string GetHeadCntVD()
    {
        string s="";
        HTMLWindow hw=HTMLWindow;
        int w=0,l=0,i=0;
        for(i=0;i<GetMyTrain().GetVehicles().size();i++)
        {
            w=w+GetMyTrain().GetVehicles()[i].GetMass();
            l=l+GetMyTrain().GetVehicles()[i].GetLength();
        }

        s=s+"<font color='#000000' size=3><b>"+GetMyTrain().GetTrainDisplayName()+"</b></font><br>";
        s=s+"<font color='#000000'>";
        s=s+"вес поезда "+w+" <br>";
        s=s+"длина поезда "+l+" <br>";
        s=s+hw.MakeLink("live://priority","приоритет")+" ";
        s=s+hw.MakeLink("live://priority"," "+GetMyTrain().GetTrainPriorityNumber());
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
                hw.MakeCell(hw.MakeImage(process,false,90,50))
        ));

        s=s+ hw.MakeTable( hw.MakeRow(
                hw.MakeCell(hw.GetPercentHTMLCode(null,fuelQ,GetAsset().FindAsset("fuel_product")/*"fuel: "+(string)fuelQ.GetQueueCount()+" litres, "+(string)hw.GetQueueRoundedPercent(fuelQ,GetAsset().FindAsset("fuel_product"))+"%"*/),polozh)
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
        //inherited(veh);
        if (!VDB)
        {
            VDB=Constructors.NewBrowser();
            VDB.SetWindowRect(100, 100, 560, 425);
        }

        string paramOutput="";
        paramOutput = paramOutput+GetHeadCntVD() +GetCntVD();
        int i;
        Vehicle[] veh=GetMyTrain().GetVehicles();
        for(i=0;i<veh.size();i++)
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
        VDB.LoadHTMLString(GetAsset(),paramOutput);
    }

	public void BrowserHandler(Message msg)
    {
 	 	string[] tok=Str.Tokens(msg.minor,"/");
 	 	string[] tok2=Str.Tokens(tok[1],"^");
 	 	if (tok2.size() > 1 and tok2[0]=="disel5on2" and Str.ToInt(tok2[1]) == GetId())
		{
            diseloff=!diseloff;
            if(!diseloff)
                Nasos();
            else
                nasos_state=false;

            SetDieselState(!diseloff);
        }
	 	PostMessage(null,"RefreshBrowser","",0.4);
	}


    public void RefreshBrowser(Message msg)
    {
        if (VDB)
        {
            ViewDetails(msg);
        }
    }

    thread void beg11() // запуск лока ботом
    {
        Sleep(5);
        if (diselon or me.GetMyTrain().GetAutopilotMode() > 1)
        {
            diseloff = false;
            SetDieselState(!diseloff);
        }
    }

    public void BrowserClose(Message msg)
    {
        if (msg.src==VDB)
        {
            VDB=null;
        }
    }

    public void UpdateLocomotiveHandler(Message msg)
    {
        // самый первый лок 2ТЭ116 - главный
        // второй - подчинённый
        // остальные не рассматриваются

        Vehicle[] veh=me.GetMyTrain().GetVehicles();
        float Locos=0;
        float LocosOn=0;
        Soup SP1;
        //  int curr_116=0;
        bool MeIsMain=true;
        Oter2TE116=-1;

        int q=0;

        bool end=false;

        while(q<veh.size() and !end)
        {
            if (veh[q]==me and me.GetDirectionRelativeToTrain())
            {
                if ((q+1)<veh.size() and veh[q+1].isclass(MotovozLocomotive) and !veh[q+1].GetDirectionRelativeToTrain())
                {
                    Oter2TE116=q+1;
                    end=true;
                }
            }

            if (veh[q].isclass(MotovozLocomotive) and veh[q].GetDirectionRelativeToTrain())
            {
                if ((q+1)<veh.size() and veh[q+1]==me and !me.GetDirectionRelativeToTrain())
                {
                    Oter2TE116=q;
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
        if (Oter2TE116>=0)
            minorSection = cast<MotovozLocomotive>veh[Oter2TE116];

        if (cast<MotovozLocomotive>msg.src==me or (minorSection and cast<MotovozLocomotive>msg.src==minorSection))
        {
            if (MyData.top_nasos1 or (minorSection and minorSection.MyData.top_nasos2))
            {
                if (!nasos_state)
                    Nasos();
                else
                    if (MyData.zapusk1 or (minorSection and minorSection.MyData.zapusk2))
                    {
                        SetDieselState(true);
                        MyData.zapusk1=false;
                        if (minorSection)
                            minorSection.MyData.zapusk2=false;
                    }
            }
            else
            {
                SetDieselState(false);
                nasos_state=false;
            }

            if (minorSection)
            {
                if (MyData.top_nasos2 or minorSection.MyData.top_nasos1)
                {
                    if (!minorSection.nasos_state)
                        minorSection.Nasos();
                    else
                        if (MyData.zapusk2 or minorSection.MyData.zapusk1)
                        {
                            minorSection.SetDieselState(true);
                            MyData.zapusk2=false;
                            minorSection.MyData.zapusk1=false;
                        }
                }
                else
                {
                    minorSection.SetDieselState(false);
                    minorSection.nasos_state=false;
                }
            }
        }
    }

    void DataReseacher(void) //обработчик данных, выданных кабиной
    {
        Vehicle[] veh = me.GetMyTrain().GetVehicles();
        int i;
        for(i = 0; i < veh.size(); i++)
        {
            PostMessage(veh[i], "LOCO", "Update", 0);
        }
    }

    CabinData GetCabinData()   // связь кабина-локомотив
    {
        return cast<CabinData>MyData;
    }

    void SetCabinData(CabinData data)
    {
        MyData=cast<chme5_CabinData>data;
        DataReseacher();
    }

    public void NMflow(Message msg)
    {
        ComprEff=Str.ToFloat(msg.minor);
    }

    Soup MyVehicleSoup1(void)  // выдавалка свойств напорной магистрали
    {
        Soup sp3= Constructors.NewSoup();
        sp3.SetNamedTag("ComprEff",ComprEff);       // мощность псевдокомпрессора (т.е. трубы от главного резервуара другого, запущенного лока)
        sp3.SetNamedTag("powerState",CompressorStarted);    // состояние компрессора текущего лока
        return sp3;
    }

    Soup GetProperties() 
    {        
        Soup sp = inherited();
        sp.SetNamedTag("GetCntVD",GetCntVD());
        sp.SetNamedSoup("MyVehicleSoup1", MyVehicleSoup1()); // запоминаются (или выдаются ф-ции VehicleNM другого лока) свойства Напорной Магистрали
        sp.SetNamedTag("diselon",diselon);
        sp.SetNamedTag("number",sideNumber);
        sp.SetNamedTag("depo",sideDepo);
        sp.SetNamedTag("dir_forward", m_dirForward);

        return sp;
    }

    void SetProperties(Soup sp)
    {
        inherited(sp);
        diselon = sp.GetNamedTagAsBool("diselon",false);
        m_dirForward = sp.GetNamedTagAsBool("dir_forward", true);
        if (sp.GetNamedTag("number")!="") sideNumber=sp.GetNamedTag("number");
        if (sp.GetNamedTag("depo")!="") sideDepo=sp.GetNamedTag("depo");
        UpdateSideText();
        ComprEff =  sp.GetNamedTagAsFloat("ComprEff");
        PostMessage(me,"LightsEventHand","autoOn",0.01);
    }

    void UpdateSideText(void)
    {
        string top="АГМС "+sideNumber;
        SetFXNameText("side-r1",top);
        SetFXNameText("side-l1",top);
        SetFXNameText("side-r2","ДЕПО");
        SetFXNameText("side-l2","ДЕПО");
        SetFXNameText("side-r3",sideDepo);
        SetFXNameText("side-l3",sideDepo);
    }

    string GetDescriptionHTML(void)
    {
        string s = inherited();
        s=s+HTMLWindow.CheckBox("live://property/diselon",diselon)+" Engine on at startup";
        s=s+"<br><a href='live://property/number'>Номер: "+sideNumber+"</a>";
        s=s+"<br><a href='live://property/depo'>Депо: "+sideDepo+"</a>";
        return s;
    }//GetDescriptionHTML

    string GetPropertyType(string propertyID)
    {
        if (propertyID == "diselon")
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
        if (propertyID == "number") return sideNumber;
        if (propertyID == "depo") return sideDepo;
        return inherited(propertyID);
    }//GetPropertyValue

    void SetPropertyValue(string propertyID, string value)
    {
        if (propertyID == "number" or propertyID == "depo")
        {
            if (propertyID == "number") sideNumber=value;
            else sideDepo=value;
            UpdateSideText();
            return;
        }//if
        inherited(propertyID,value);
    }//SetPropertyValue

    void LinkPropertyValue(string propertyID)
    {
        if (propertyID == "diselon")
        {
            diselon = !diselon;
            return;
        }//if
        inherited(propertyID);
    }//LinkPropertyValue

    public void InternalHandler(Message msg) // определяет, сидим ли мы внутри кабины или нет
    { // и посволяет кабине и локу знать это
        if (msg.minor=="Internal-View")
            MyData.WeInsideCabin=true;  // мы внутри кабины
        else
            MyData.WeInsideCabin=false;
    }

    thread void TZLoop()
    {
        while(1)
        {
            if ((me.GetBrakeCylinderPressure()*981.0173-1.0138 > 0.7) and  3.6*Math.Fabs(me.GetVelocity())>3 )
                PlaySoundAndSleep(sounds_asset, "sound/stop.wav", 1.0f, 10.0f, 100.0f, me, "a.bog0");
            else
                Sleep(1.0);
        }
    }

    public void CouplerHandler(Message msg)
    {
        if (msg.src==me)
        {
            if (msg.minor=="Decoupled")
                World.PlaySound(sounds_asset,"sound/decoupling.wav",1.0,10.0,100.0,me,"a.compressor");
            else
                World.PlaySound(sounds_asset,"sound/coupling.wav",1.0,10.0,100.0,me,"a.compressor");
        }
    }

    thread void ScripLoop()
    {
        float M_vel=Math.Rand(26.8,29.3);
        while(1)
        {
            if (Math.Fabs(GetVelocity())>M_vel)
                GetMyTrain().Derail ();
            else

                if (Math.Fabs(GetVelocity())>25.3)
                    PlaySoundAndSleep(sounds_asset, "sound/warning.wav", 1.0f, 10.0f, 100.0f, me, "a.disel");
            else
                if (Math.Fabs(GetVelocity())>19.4)
                    PlaySoundAndSleep(sounds_asset, "sound/skrip_speed.wav", 1.0f, 10.0f, 100.0f, me, "a.attach0");
            else

                Sleep(5.0);
        }
    }

    thread void SpeedSound()
    {
        float Min_vel=Math.Rand(2,10);
        float Max_vel=Math.Rand(Min_vel,3);

        while(1)
        {
            if (Math.Fabs(GetVelocity())>=Min_vel and Math.Fabs(GetVelocity())<=Max_vel)
                PlaySoundAndSleep(sounds_asset, "sound/skrip.wav", 1.0f, 10.0f, 100.0f, me, "a.bog0");
            else
                Sleep(5.0);
        }
    }

    thread void TED_sound()
    {
        while(1)
        {
            if (Math.Fabs(GetVelocity())<=3.2 and powerState and Math.Fabs(GetEngineParam ("applied-force"
                ))>0)

            PlaySoundAndSleep(sounds_asset, "sound/tp_dn.wav", 1.0f, 10.0f, 100.0f, me, "a.attach0");
            else

                Sleep(5.0);
        }
    }

    public void Init(void)
    {
        inherited();
        LLC = new LocoLightController_d2(); //v
        LLC.DoubleLoco = false;
        LLC.Init(me);  //v
        UpdateSideText();
        SetCabinSwayAmount(0.5);
        SetRollBasedOnTrack(-1.7);
        MyData = new chme5_CabinData();

        SA3_coupled     = GetAsset().FindAsset("SA3-coupled");
        sa3_uncoupled       = GetAsset().FindAsset("sa3-uncoupled");

        sa3_uncoupled_NM    = GetAsset().FindAsset("sa3-uncoupled-nm");
        sa3_coupled_NM      = GetAsset().FindAsset("sa3-coupled-nm");

        SetCouplerAttach(0,false);  // устанавливаем переднюю сцепку в положение - разомкнуто
        SetCouplerAttach(1,false);  // устанавливаем заднюю сцепку в положение - разомкнуто

        AddHandler(me, "World", "ModuleInit", "ModuleInitHandler");
        if ( HasMesh("fan0"))
            StopMeshAnimation("fan0");

        AddHandler(me,"LPC-298469","","LPCHandler");//minor can be "StartUp","ShutDown","QuietShutDown","QuietStartUp"
        SetCompressorEfficiency(0.0f);
        SetWheelslipTractionMultiplier(1); // выключение пищащего звука

        Soup extensions = GetAsset().GetConfigSoup().GetNamedSoup("extensions");

        number_start_s = extensions.GetNamedTagAsInt("number_start_sounds");
        number_stop_s = extensions.GetNamedTagAsInt("number_stop_sounds");

        fuelCS = extensions.GetNamedTagAsFloat("fuel_consume_speed");     //fuel consumption speed on idle
        fcs_k = extensions.GetNamedTagAsFloat("fuel_consume_speed_k");    //короч это число есть вот это: (G-fuelCS)/R = k
        time1 = extensions.GetNamedTagAsFloat("time_stopped_fan")/10;
        time2 = extensions.GetNamedTagAsFloat("time_looped_fan")/10;
        water_heat= extensions.GetNamedTagAsFloat("water_heating");
        water_cold = extensions.GetNamedTagAsFloat("water_colding");
        DizelAddSoundbase=extensions.GetNamedTagAsFloat("diesel_add_sound");
        soundkoef = extensions.GetNamedTagAsFloat("Sound_koef");
        nmb_pos = extensions.GetNamedTagAsFloat("koef_of_positions");
        max_force = extensions.GetNamedTagAsFloat("max_force")*10;
        max_force_bw = extensions.GetNamedTagAsFloat("max_force_bw")*10;
        //где R - разность расхода топлива между двумя соседними позициями контроллера. Физ смысл - равен повышению расхода топлива при
        //увеличении позиции контроллера на единицу. Зависимость конешн не прямая, но оч близка к ней. Сложность в том что в ТРС
        //тока 8 позиций плюс дробные, поэтому расчитывать нужно внимательно, если мыслей нет обращайтесь=)

        fuelQ = GetQueue("fuel");
        sounds_asset = GetAsset().FindAsset("sounds");

        PostMessage(me,"LPC-298469","ShutDown",0.1f);

        PostMessage(me,"pfx","-0-1",0.0);

        AddHandler(me,"NM-flow","","NMflow");

        string[] str1= Str.Tokens(extensions.GetNamedTag("headlightRGB"),",");

        headlR=((float)Str.ToInt(str1[0]))/255;
        headlG=((float)Str.ToInt(str1[1]))/255;
        headlB=((float)Str.ToInt(str1[2]))/255;

        SetMeshTranslation("dim",0,-300.0,0);
        SetMeshTranslation("dim2",0,-300.0,0);

        SetMeshOrientation("dim",-1.77,0,0);
        SetMeshOrientation("dim2",-1.77,0,0);

        TZLoop();
        ScripLoop();
        SpeedSound();

        // старое LLC этой версии работало криво, т.к. помещало в GlobalCode
        //все миноры сообщений TurnAround  StartedMoving BoardedTrain Coupled EnterTrack LeftTrain

        AddHandler(me,"LOCO","Update","UpdateLocomotiveHandler");
        AddHandler(me,"Camera","","InternalHandler");

        AddHandler(me,"Vehicle", "Derailed",  "Derailed");
        AddHandler(me,"Vehicle", "Coupled" , "LightHandler");

        AddHandler(me,"Vehicle","Coupled","CouplerHandler");
        AddHandler(me,"Vehicle","Decoupled","CouplerHandler");

        AddHandler(me,"DriverCharacter", "LeftTrain","LightHandler");
        AddHandler(me,"DriverCharacter",  "BoardedTrain","LightHandler");

        oldTrain=GetMyTrain();
        AddHandler(oldTrain,"Train", "TurnAround","LightHandler");
        AddHandler(oldTrain,"Train", "StartedMoving","LightHandler");
        AddHandler(oldTrain,"Train", "NotifyHeadlights","LightHandler");

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
