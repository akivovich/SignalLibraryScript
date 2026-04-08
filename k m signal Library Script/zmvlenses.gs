include "signal.gs"

static class ZmvLenses
{    
    public void ShowLenses(Signal signal, string[] lenses, Asset[] assets)
    {
        //Interface.Print("ZmvLenses::ShowLenses");
        int i, 
            len = lenses.size();

        for (i = 0; i < len; i++)
        {
            //Interface.Print("ZmvLenses::ShowLenses lense="+lenses[i]);
            signal.SetFXCoronaTexture(lenses[i], assets[i]);
        }        
    }

    public void HideLenses(Signal signal, string[] lenses)
    {
        //Interface.Print("ZmvLenses::HideLenses");
        int i, 
            len = lenses.size();

        for (i = 0; i < len; i++)
        {
            //Interface.Print("ZmvLenses::HideLenses lense="+lenses[i]);
            signal.SetFXCoronaTexture(lenses[i], null);
        }        
    }
};