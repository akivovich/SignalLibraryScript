include "signal.gs"

static class KM_Tables
{
    //Tables ids
    public define string name  = "name";
    //Tables textures replacement
    public define string tabl  = "tabl";
    //Assets
    Asset tex = null;
    int nTables;
    
    void showTable(Signal signal, int id, string text)
    {
        //Interface.Print("ShowTable:id="+id+",text="+text);
        string tablId = tabl + (id+1);
        string nameId = name + (id+1);

		int idTex = 0;
        if (text.size() != 0)
        {
 		    idTex = 1;
 	    }
        else
        {
            text = " ";
        }

        //Interface.Print("ZmvTables::showTable: tablId="+tablId+",tablBackId="+tablBackId+",idTex="+idTex+",idTexBack="+idTexBack);

	    signal.SetFXTextureReplacement(tablId, tex, idTex);
        signal.SetFXNameText(nameId, text);
    }

    void hideAllTables(Signal signal)
    {
        int i;
        for (i = 0; i < nTables; i++)
        {
            showTable(signal, i, "");
        }        
    }
    //Interface =========================================================================================================================
    public void SetName(Signal signal, string name)
    {
        //Interface.Print("SetName="+name+"size="+name.size());

        hideAllTables(signal);
        int i, j, len = name.size();
        //first table
        if (!len) return;
        
        string test, str = "";
        int n;

        for (i = 0, j = 0; i < len; i++)
        {
            test = name[i,i+1];
            if (test >= "0" and test <= "9")
            {
                if (str != "")
                {
                    showTable(signal, j++, str);
                    str = "";
                    if (j == nTables) break;
                }
                showTable(signal, j++, test);
                if (j == nTables) break;
            }
            else
            {
                str = str + test;
            }
        }
        if (str != "" and j < nTables)
            showTable(signal, j, str);
    }

    //initialization
    public void Init(Signal signal, int n)
    {
        nTables = n;
        if (tex == null)
        {
            tex = signal.GetAsset().FindAsset("tex_tabl");
            //if (tex != null)
            //    Interface.Print("ZmvTables::init: tex initiated");
        }
        if (n > 0)
            SetName(signal, "");
    }
};