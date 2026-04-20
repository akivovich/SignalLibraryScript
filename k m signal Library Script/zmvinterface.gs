include "zmvSignalInterface.gs"

class ZmvInterface
{
    public void Init(Asset asset) {}    
    public void Init(ZmvSignalInterface signal, Soup config) {}    
    public void GetProperties(Soup db) {}
    public void SetProperties(Soup db) {}
    public string[] GetAllLenses() { return new string[0]; }
    public int GetLensesState() {return 0; }
	// public int GetLastAlsValue() {return -1; }
	// public int GetLastNextAlsValue() {return -1; }
	public int GetFreeBlocksCount() { return 0; }
	
    public void TurnOnInvitationSignal(Message msg) {}    
    public void SetAutoblock(Message msg) {}    
    public void SetPropagatedProperties(ZmvSignalInterface src, string par) {}
    public bool SetBlock(Train train, bool addToQueueIfBusy) {return false;}
    public void SetBlock(Message msg) {}
    public void SetUnblock(Train train) {}
    public void SetUnblock(Message msg) {}
    public void SetSemiautoMode(Message msg) {}
    public void SetAutoMode(Message msg) {}
	public void SetAutomatManually(bool auto) {}
    public void BrowserUrlHandler(Message msg) {}
	public void ObjectEnter(Message msg) {}
	public void ObjectLeave(Message msg) {}
	public void OnCTRL(Message msg) {}
	
    public string GetPropertyTitleHTML(string title) {return ""; }
    public string GetPropertyHTML(string name, string value, string valueId, string allPref)  {return ""; }
    public string GetDescriptionHTML(StringTable ST, string content)  {return ""; }
	
    public string GetPropertiesContent(StringTable ST) {return "";}
	public string[] GetPropertyElementList(string id) { return new string[0]; }
    public void SetPropertyValue(string id, string val) {}
    public void SetPropertyValue(string id, int val) {}
    public void SetPropertyValue(string id, string val, int index) {}
    public void LinkPropertyValue(string id) {}
 	public string GetPropertyType(string id) {return "string"; }
 	public string GetPropertyName(string id) {return ""; }
	public Soup GetNeighborProperties() { return null; }
	public string GetViewDetails() {return "";}
    public void ResetSignal() {}

    public bool IsSemiautomat() { return false; }
    public void OnChangeFreeBlocksCount() {}
    public void UpdateSignalState() {}

    public bool IsBlocked(Train train) {return true;}
    public bool IsAutomated() {return true;}
	public bool IsShuntMode() { return false;}
    public void Init() {}
};
