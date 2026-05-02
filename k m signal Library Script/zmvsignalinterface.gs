include "Signal.gs"
include "zmvConsts.gs"
include "zmvMarker.gs"

//API:
//Обновить состояние
//obj.PostMessage(Router.GetGameObject(signalName), "CTRL", "UpdateState", 1); 
//Открыть полуавтомат:
//obj.PostMessage(Router.GetGameObject(signalName), "CTRL", "MayOpen^true", 1); 
//Закрыть полуавтомат:
//obj.PostMessage(Router.GetGameObject(signalName), "CTRL", "MayOpen^false", 1);
//Включить пригласительный сигнал (ПС)
//obj.PostMessage(Router.GetGameObject(signalName), "CTRL", "SetPS^true", 1); 
//Выключить пригласительный сигнал (ПС)
//obj.PostMessage(Router.GetGameObject(signalName), "CTRL", "SetPS^false", 1); 

class ZmvSignalInterface isclass Signal
{       
    public void ShowAllLenses() {}    
    public void HideAllLenses() {}
    public void SetLensesState(string[] lenses, int signalState, int speedLimit) {}
    public void ClrRouteNumber() {}
    public void SetRouteNumber(ZmvMarker marker) {}
    public int  GetLensesState() { return -1; }
    public string GetTableString() { return ""; }
    public void SetTableString(string name) {}
    public void SetCheckerWorkMode(int interval) {}
    public bool IsBlocked(Train train) {return false;}
    public bool IsAutomated() {return true;}
    public bool IsSemiautomat() {return false;}
    public bool IsInvisible() {return false;}
    public bool SetBlock(Train train, bool addToQueueIfBusy) {return false;}
    public void SetUnblock(Train train) {}
	public void UpdateBrowser() {}
	public bool IsShuntMode() { return false;}
	public bool IsProhodnoy() { return false;}
	public int  GetFreeBlocksCount() { return 0; }
	public void AddObjectEnterOrLeaveHandler() {}
    public void UpdateSignalState() {}
    public void SetDebugMode(bool tunOn) {}
	
	public void Init() { inherited(); }
};