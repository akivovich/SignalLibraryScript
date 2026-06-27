include "signal.gs"

static class ZmvRouteLenses
{
	bool     m_bInitialized = false;
    string[] m_PointerLenses = new string[50];
	
    void initLenses()
    {
   		m_bInitialized = true;

        m_PointerLenses[0] =    "   ** "+
                                "  * * "+
                                "  * * "+
                                "  * * "+
                                "  * * "+
                                " *****"+
                                " *   *";

        m_PointerLenses[1] =    "   *  "+
                                "  **  "+
                                "   *  "+
                                "   *  "+
                                "   *  "+
                                "   *  "+
                                "  *** ";

        m_PointerLenses[2] =    "  *** "+
                                " *   *"+
                                "     *"+
                                "    * "+
                                "   *  "+
                                "  *   "+
                                " *****";

        m_PointerLenses[3] =    "  *** "+
                                " *   *"+
                                "     *"+
                                "   ** "+
                                "     *"+
                                " *   *"+
                                "  *** ";

        m_PointerLenses[4] =    " *   *"+
                                " *   *"+
                                " *   *"+
                                " *****"+
                                "     *"+
                                "     *"+
                                "     *";

        m_PointerLenses[5] =    " *****"+
                                " *    "+
                                " **** "+
                                "     *"+
                                "     *"+
                                " *   *"+
                                "  *** ";

        m_PointerLenses[6] =    "  *** "+
                                " *    "+
                                " *    "+
                                " **** "+
                                " *   *"+
                                " *   *"+
                                "  *** ";

        m_PointerLenses[7] =    " *****"+
                                "     *"+
                                "     *"+
                                "    * "+
                                "   *  "+
                                "  *   "+
                                "  *   ";

        m_PointerLenses[8] =    "  *** "+
                                " *   *"+
                                " *   *"+
                                "  *** "+
                                " *   *"+
                                " *   *"+
                                "  *** ";

        m_PointerLenses[9] =    "  *** "+
                                " *   *"+
                                " *   *"+
                                "  ****"+
                                "     *"+
                                "     *"+
                                "  *** ";

		m_PointerLenses[10] =   "   ***"+ //А
                                "  *  *"+
                                " *   *"+
                                " *****"+
                                " *   *"+
                                " *   *"+
                                " *   *";

		m_PointerLenses[11] =   " *****"+ //Б
                                " *    "+
                                " **** "+
                                " *   *"+
                                " *   *"+
                                " *   *"+
                                " **** ";

		m_PointerLenses[12] =   " **** "+ //В
                                " *   *"+
                                " *   *"+
                                " **** "+
                                " *   *"+
                                " *   *"+
                                " **** ";

		m_PointerLenses[13] =   " *****"+ //Г
                                " *    "+
                                " *    "+
                                " *    "+
                                " *    "+
                                " *    "+
                                " *    ";
						
		m_PointerLenses[14] =   " *****"+ //Е
                                " *    "+
                                " *    "+
                                " **** "+
                                " *    "+
                                " *    "+
                                " *****";
						
		m_PointerLenses[15] =   " * * *"+  //Ж
                                " * * *"+
                                "  *** "+
                                "  *** "+
                                " * * *"+
                                " * * *"+
                                " * * *";
						
		m_PointerLenses[16] =   " *   *"+ //И
                                " *   *"+
                                " *  **"+
                                " * * *"+
                                " **  *"+
                                " *   *"+
                                " *   *";
						
		m_PointerLenses[17] =   " *   *"+ //К
                                " *  * "+
                                " * *  "+
                                " **   "+
                                " * *  "+
                                " *  * "+
                                " *   *";
						
		m_PointerLenses[18] =  "   ***"+ //Л
                                "  *  *"+
                                "  *  *"+
                                "  *  *"+
                                "  *  *"+
                                "  *  *"+
                                " *   *";
						
		m_PointerLenses[19] =   " *   *"+ //М
                                " ** **"+
                                " * * *"+
                                " * * *"+
                                " *   *"+
                                " *   *"+
                                " *   *";
						
		m_PointerLenses[20] =   "*  ** "+ //10
                                "* *  *"+
                                "* *  *"+
                                "* *  *"+
                                "* *  *"+
                                "* *  *"+
                                "*  ** ";
						
		m_PointerLenses[21] =   "*   * "+ //11
                                "*   * "+
                                "*   * "+
                                "*   * "+
                                "*   * "+
                                "*   * "+
                                "*   * ";
						
		m_PointerLenses[22] =   "*  ** "+ //12
                                "* *  *"+
                                "*    *"+
                                "*   * "+
                                "*  *  "+
                                "* *   "+
                                "* ****";
						
		m_PointerLenses[23] =   "*  ** "+ //13
                                "* *  *"+
                                "*    *"+
                                "*  ** "+
                                "*    *"+
                                "* *  *"+
                                "*  ** ";
						
		m_PointerLenses[24] =   "* *  *"+ //14
                                "* *  *"+
                                "* *  *"+
                                "* ****"+
                                "*    *"+
                                "*    *"+
                                "*    *";
						
		m_PointerLenses[25] =   "* ****"+ //15
                                "* *   "+
                                "* *** "+
                                "*    *"+
                                "*    *"+
                                "* *  *"+
                                "*  ** ";
						
		m_PointerLenses[26] =   "*  ***"+ //16
                                "* *   "+
                                "* *   "+
                                "* *** "+
                                "* *  *"+
                                "* *  *"+
                                "*  ** ";
						
		m_PointerLenses[27] =   "* ****"+ //17
                                "*    *"+
                                "*    *"+
                                "*   * "+
                                "*  *  "+
                                "* *   "+
                                "* *   ";
						
		m_PointerLenses[28] =   "*  ** "+ //18
                                "* *  *"+
                                "* *  *"+
                                "*  ** "+
                                "* *  *"+
                                "* *  *"+
                                "*  ** ";
						
		m_PointerLenses[29] =   "*  ** "+ //19
                                "* *  *"+
                                "* *  *"+
                                "*  ***"+
                                "*    *"+
                                "*    *"+
                                "* *** ";
						
		m_PointerLenses[30] =   " *   *"+ //Н
                                " *   *"+
                                " *   *"+
                                " *****"+
                                " *   *"+
                                " *   *"+
                                " *   *";
						
		m_PointerLenses[31] =   "  *** "+ //О
                                " *   *"+
                                " *   *"+
                                " *   *"+
                                " *   *"+
                                " *   *"+
                                "  *** ";
						
		m_PointerLenses[32] =   " *****"+ //П
                                " *   *"+
                                " *   *"+
                                " *   *"+
                                " *   *"+
                                " *   *"+
                                " *   *";
						
		m_PointerLenses[33] =   " **** "+ //Р
                                " *   *"+
                                " *   *"+
                                " **** "+
                                " *    "+
                                " *    "+
                                " *    ";
						
		m_PointerLenses[34] =   "  *** "+ //С
                                " *   *"+
                                " *    "+
                                " *    "+
                                " *    "+
                                " *   *"+
                                "  *** ";
						
		m_PointerLenses[35] =   " *****"+ //Т
                                "   *  "+
                                "   *  "+
                                "   *  "+
                                "   *  "+
                                "   *  "+
                                "   *  ";
						
		m_PointerLenses[36] =   " *   *"+ //У
                                " *   *"+
                                " *   *"+
                                "  ****"+
                                "     *"+
                                "     *"+
                                "  *** ";
						
		m_PointerLenses[37] =   "  *** "+ //Ф
                                " * * *"+
                                " * * *"+
                                " * * *"+
                                "  *** "+
                                "   *  "+
                                "   *  ";
						
		m_PointerLenses[38] =   " *   *"+ //Х
                                " *   *"+
                                "  * * "+
                                "   *  "+
                                "  * * "+
                                " *   *"+
                                " *   *";
						
		m_PointerLenses[39] =   " *  * "+ //Ц
                                " *  * "+
                                " *  * "+
                                " *  * "+
                                " *  * "+
                                " *****"+
                                "     *";
						
		m_PointerLenses[40] =   " *   *"+ //Ч
                                " *   *"+
                                " *   *"+
                                "  ****"+
                                "     *"+
                                "     *"+
                                "     *";
						
		m_PointerLenses[41] =   " * * *"+ //Ш
                                " * * *"+
                                " * * *"+
                                " * * *"+
                                " * * *"+
                                " * * *"+
                                " *****";
						
		m_PointerLenses[42] =   "* * * "+ //Щ
                                "* * * "+
                                "* * * "+
                                "* * * "+
                                "* * * "+
                                "******"+
                                "     *";
						
		m_PointerLenses[43] =   "  *** "+ //Э
                                " *   *"+
                                "     *"+
                                "   ***"+
                                "     *"+
                                " *   *"+
                                "  *** ";
						
		m_PointerLenses[44] =   "*  ** "+ //Ю
                                "* *  *"+
                                "* *  *"+
                                "***  *"+
                                "* *  *"+
                                "* *  *"+
                                "*  ** ";
						
		m_PointerLenses[45] =   "  ****"+ //Я
                                " *   *"+
                                " *   *"+
                                "  ****"+
                                "  *  *"+
                                " *   *"+
                                " *   *";
						
		m_PointerLenses[46] =   "   *  "+ // |
                                "   *  "+
                                "   *  "+
                                "   *  "+
                                "   *  "+
                                "   *  "+
                                "   *  ";
						
		m_PointerLenses[47] =   "      "+ // -
                                "      "+
                                "      "+
                                "******"+
                                "      "+
                                "      "+
                                "      ";
						
		m_PointerLenses[48] =   "     *"+ // /
                                "    * "+
                                "   *  "+
                                "  *   "+
                                " *    "+
                                "*     "+
                                "      ";
						
		m_PointerLenses[49] =   "*     "+ // \
                                " *    "+
                                "  *   "+
                                "   *  "+
                                "    * "+
                                "     *"+
                                "      ";
    }
	
    public void ClearLenses(Signal signal, string corona)
    {
        int i, ilen = 6,
            j, jlen = 7;

        for (j = 1; j <= jlen; j++)
        {
            for (i = 1; i <= ilen; i++)
            {
                signal.SetFXCoronaTexture(corona+j+i, null);
            }
        }
    }

    public void SetLenses(Signal signal, Asset asset, string corona, string val)
    {
        int index  = Str.ToInt(val);
//Interface.Print("RoutePointer::SetLenses: index="+index);
		if (index < 0 or index > 49)
        {
			ClearLenses(signal, corona);
			return;
        }

        if (!m_bInitialized) initLenses();
        if (m_PointerLenses.size() <= index)
            signal.Exception("!!!ERROR!!!:RoutePointer::SetLenses: signal="+ signal.GetName() +",index="+index+",m_PointerLenses.size()="+m_PointerLenses.size());
        
        string lenses = m_PointerLenses[index];
        //Interface.Print("SetLenses: lense="+lenses);        
        int i, ilen = 6,
            j, jlen = 7,
            k = 0;

        for (j = 1; j <= jlen; j++)
        {
            for (i = 1; i <= ilen; i++, k++)
            {
                
                //Interface.Print("SetLenses: i="+i);
                //Interface.Print("SetLenses: j="+j);
                //Interface.Print("SetLenses: k="+k);
                //Interface.Print("SetLenses: lense="+lenses[k, k+1]);
                //Interface.Print("SetLenses: id="+("m"+j+i));
                
                if (lenses[k, k+1] != " ")
                    signal.SetFXCoronaTexture(corona+j+i, asset);
                else
                    signal.SetFXCoronaTexture(corona+j+i, null);
            }
        }
    }
	
	public void Init()
	{        
		if (m_bInitialized) return;        
        initLenses();
        Interface.Print("ZmvRouteLenses::Init m_bInitialized="+m_bInitialized);
	}	
};

class ZmvRoutePointer
{
    string m_corona;
	Asset m_asset = null;
    public void ClearLenses(Signal signal)
    {
		ZmvRouteLenses.ClearLenses(signal, m_corona);
    }

    public void SetLenses(Signal signal, string val)
	{
		ZmvRouteLenses.SetLenses(signal, m_asset, m_corona, val);
	}
    
    //initialization
    public void Init(Asset asset, string corona)
    {
        //Interface.Print("RouteMarkerInit");
        m_asset = asset;
		m_corona = corona;
		ZmvRouteLenses.Init();
    }
};