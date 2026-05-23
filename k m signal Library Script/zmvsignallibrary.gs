include "ZmvSignalLibraryInterface.gs"
include "ZmvInterface.gs"
include "zmvwrlibrary.gs"
include "zmvgrlibrary.gs"
include "zmvygrlibrary.gs"
include "zmvwygyrlibrary.gs"
include "zmvoplibrary.gs"

class ZmvSignalLibrary isclass ZmvSignalLibraryInterface
{
    
    public object GetSignalLibraryObject(string id)
    {
        //Interface.Print("ZmvSignalLibrary::GetSignalLibraryObject id="+id);
        
        ZmvInterface obj = null;
        if (id == "WR")
            obj = new ZmvWRLibrary();
        else if (id == "GR")
            obj = new ZmvGRLibrary();
        else if (id == "YGR")
            obj = new ZmvYGRLibrary();
        else if (id == "WYGYR")
            obj = new ZmvWYGYRLibrary();
        else if (id == "YWYR")
            obj = new ZmvYWYRLibrary();
        else if (id == "WYGR")
            obj = new ZmvWYGRLibrary();
        else if (id == "YGYR")
            obj = new ZmvYGYRLibrary();
        else if (id == "OP")
            obj = new ZmvOPLibrary();
        else if (id == "WRW")
            obj = new ZmvWRWLibrary();
        else if (id == "YR_DEPO") // Depo pass
            obj = new ZmvYRLibrary();
        else if (id == "RW")  // R,PS
            obj = new ZmvRWLibrary();
        else if (id == "DOP") // DOP
            obj = new ZmvDOPLibrary();
        
        if (obj != null)
            obj.Init(GetAsset());

        return cast<object>(obj);
    }
    
    public void Init() 
    {
        //Interface.Print("ZmvSignalLibrary::Init");
    }
};
