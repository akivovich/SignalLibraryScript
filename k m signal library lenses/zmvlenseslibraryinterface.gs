include "Library.gs"

class ZmvLensesInterface
{
    public void Init(Asset asset) {}
    public void Init(Soup config) {}
    public Asset[] GetAssets(string[] lenses) { return new Asset[0]; }
    public Asset GetAssetRP() { return null; }
	public Asset GetAssetRP2() { return null; }
    //Properties
    public void GetProperties(Soup db) {}
    public void SetProperties(Soup db, Soup neighborDb) {}

    public string GetPropertiesContent() {return "";}
    public string[] GetPropertyElementList(string id) {return new string[0];}
    public bool HasProperty(string id) { return false; }
	public void SetPropertyValue(string id, string val, int index) {}
 	public string GetPropertyType(string id) {return ""; }
	public string GetPropertyName(string id) {return ""; }
	public string GetPropertyValue(string id) {return ""; }
};

class ZmvLensesLibraryInterface isclass Library
{
    public ZmvLensesInterface GetInstance() {return null;}
};


