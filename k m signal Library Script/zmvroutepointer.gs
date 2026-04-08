include "signal.gs"

static class ZmvRouteLenses
{
	string[] m_Lenses = new string[0];
	
    void initLenses()
    {
        m_Lenses = new string[50];
        
        m_Lenses[0] =   "   ** "+
                        "  * * "+
                        "  * * "+
                        "  * * "+
                        "  * * "+
                        " *****"+
                        " *   *";

        m_Lenses[1] =   "   *  "+
                        "  **  "+
                        "   *  "+
                        "   *  "+
                        "   *  "+
                        "   *  "+
                        "  *** ";

        m_Lenses[2] =   "  *** "+
                        " *   *"+
                        "     *"+
                        "    * "+
                        "   *  "+
                        "  *   "+
                        " *****";

        m_Lenses[3] =   "  *** "+
                        " *   *"+
                        "     *"+
                        "   ** "+
                        "     *"+
                        " *   *"+
                        "  *** ";

        m_Lenses[4] =   " *   *"+
                        " *   *"+
                        " *   *"+
                        " *****"+
                        "     *"+
                        "     *"+
                        "     *";

        m_Lenses[5] =   " *****"+
                        " *    "+
                        " **** "+
                        "     *"+
                        "     *"+
                        " *   *"+
                        "  *** ";

        m_Lenses[6] =   "  *** "+
                        " *    "+
                        " *    "+
                        " **** "+
                        " *   *"+
                        " *   *"+
                        "  *** ";

        m_Lenses[7] =   " *****"+
                        "     *"+
                        "     *"+
                        "    * "+
                        "   *  "+
                        "  *   "+
                        "  *   ";

        m_Lenses[8] =   "  *** "+
                        " *   *"+
                        " *   *"+
                        "  *** "+
                        " *   *"+
                        " *   *"+
                        "  *** ";

        m_Lenses[9] =   "  *** "+
                        " *   *"+
                        " *   *"+
                        "  ****"+
                        "     *"+
                        "     *"+
                        "  *** ";

		m_Lenses[10] =  "   ***"+ //А
                        "  *  *"+
                        " *   *"+
                        " *****"+
                        " *   *"+
                        " *   *"+
                        " *   *";

		m_Lenses[11] =  " *****"+ //Б
                        " *    "+
                        " **** "+
                        " *   *"+
                        " *   *"+
                        " *   *"+
                        " **** ";

		m_Lenses[12] =  " **** "+ //В
                        " *   *"+
                        " *   *"+
                        " **** "+
                        " *   *"+
                        " *   *"+
                        " **** ";

		m_Lenses[13] =  " *****"+ //Г
                        " *    "+
                        " *    "+
                        " *    "+
                        " *    "+
                        " *    "+
                        " *    ";
						
		m_Lenses[14] =  " *****"+ //Е
                        " *    "+
                        " *    "+
                        " **** "+
                        " *    "+
                        " *    "+
                        " *****"; //Ж
						
		m_Lenses[15] =  " * * *"+
                        " * * *"+
                        "  *** "+
                        "  *** "+
                        " * * *"+
                        " * * *"+
                        " * * *";
						
		m_Lenses[16] =  " *   *"+ //И
                        " *   *"+
                        " *  **"+
                        " * * *"+
                        " **  *"+
                        " *   *"+
                        " *   *";
						
		m_Lenses[17] =  " *   *"+ //К
                        " *  * "+
                        " * *  "+
                        " **   "+
                        " * *  "+
                        " *  * "+
                        " *   *";
						
		m_Lenses[18] =  "   ***"+ //Л
                        "  *  *"+
                        "  *  *"+
                        "  *  *"+
                        "  *  *"+
                        "  *  *"+
                        " *   *";
						
		m_Lenses[19] =  " *   *"+ //М
                        " ** **"+
                        " * * *"+
                        " * * *"+
                        " *   *"+
                        " *   *"+
                        " *   *";
						
		m_Lenses[20] =  "*  ** "+ //10
                        "* *  *"+
                        "* *  *"+
                        "* *  *"+
                        "* *  *"+
                        "* *  *"+
                        "*  ** ";
						
		m_Lenses[21] =  "*   * "+ //11
                        "*   * "+
                        "*   * "+
                        "*   * "+
                        "*   * "+
                        "*   * "+
                        "*   * ";
						
		m_Lenses[22] =  "*  ** "+ //12
                        "* *  *"+
                        "*    *"+
                        "*   * "+
                        "*  *  "+
                        "* *   "+
                        "* ****";
						
		m_Lenses[23] =  "*  ** "+ //13
                        "* *  *"+
                        "*    *"+
                        "*  ** "+
                        "*    *"+
                        "* *  *"+
                        "*  ** ";
						
		m_Lenses[24] =  "* *  *"+ //14
                        "* *  *"+
                        "* *  *"+
                        "* ****"+
                        "*    *"+
                        "*    *"+
                        "*    *";
						
		m_Lenses[25] =  "* ****"+ //15
                        "* *   "+
                        "* *** "+
                        "*    *"+
                        "*    *"+
                        "* *  *"+
                        "*  ** ";
						
		m_Lenses[26] =  "*  ***"+ //16
                        "* *   "+
                        "* *   "+
                        "* *** "+
                        "* *  *"+
                        "* *  *"+
                        "*  ** ";
						
		m_Lenses[27] =  "* ****"+ //17
                        "*    *"+
                        "*    *"+
                        "*   * "+
                        "*  *  "+
                        "* *   "+
                        "* *   ";
						
		m_Lenses[28] =  "*  ** "+ //18
                        "* *  *"+
                        "* *  *"+
                        "*  ** "+
                        "* *  *"+
                        "* *  *"+
                        "*  ** ";
						
		m_Lenses[29] =  "*  ** "+ //19
                        "* *  *"+
                        "* *  *"+
                        "*  ***"+
                        "*    *"+
                        "*    *"+
                        "* *** ";
						
		m_Lenses[30] =  " *   *"+ //Н
                        " *   *"+
                        " *   *"+
                        " *****"+
                        " *   *"+
                        " *   *"+
                        " *   *";
						
		m_Lenses[31] =  "  *** "+ //О
                        " *   *"+
                        " *   *"+
                        " *   *"+
                        " *   *"+
                        " *   *"+
                        "  *** ";
						
		m_Lenses[32] =  " *****"+ //П
                        " *   *"+
                        " *   *"+
                        " *   *"+
                        " *   *"+
                        " *   *"+
                        " *   *";
						
		m_Lenses[33] =  " **** "+ //Р
                        " *   *"+
                        " *   *"+
                        " **** "+
                        " *    "+
                        " *    "+
                        " *    ";
						
		m_Lenses[34] =  "  *** "+ //С
                        " *   *"+
                        " *    "+
                        " *    "+
                        " *    "+
                        " *   *"+
                        "  *** ";
						
		m_Lenses[35] =  " *****"+ //Т
                        "   *  "+
                        "   *  "+
                        "   *  "+
                        "   *  "+
                        "   *  "+
                        "   *  ";
						
		m_Lenses[36] =  " *   *"+ //У
                        " *   *"+
                        " *   *"+
                        "  ****"+
                        "     *"+
                        "     *"+
                        "  *** ";
						
		m_Lenses[37] =  "   *  "+ //Ф
                        " *****"+
                        " * * *"+
                        " * * *"+
                        " *****"+
                        "   *  "+
                        "   *  ";
						
		m_Lenses[38] =  " *   *"+ //Х
                        " *   *"+
                        "  * * "+
                        "   *  "+
                        "  * * "+
                        " *   *"+
                        " *   *";
						
		m_Lenses[39] =  " *  * "+ //Ц
                        " *  * "+
                        " *  * "+
                        " *  * "+
                        " *  * "+
                        " *****"+
                        "     *";
						
		m_Lenses[40] =  " *   *"+ //Ч
                        " *   *"+
                        " *   *"+
                        "  ****"+
                        "     *"+
                        "     *"+
                        "     *";
						
		m_Lenses[41] =  " * * *"+ //Ш
                        " * * *"+
                        " * * *"+
                        " * * *"+
                        " * * *"+
                        " * * *"+
                        " *****";
						
		m_Lenses[42] =  "* * * "+ //Щ
                        "* * * "+
                        "* * * "+
                        "* * * "+
                        "* * * "+
                        "******"+
                        "     *";
						
		m_Lenses[43] =  "  *** "+ //Э
                        " *   *"+
                        "     *"+
                        "   ***"+
                        "     *"+
                        " *   *"+
                        "  *** ";
						
		m_Lenses[44] =  "*  ** "+ //Ю
                        "* *  *"+
                        "* *  *"+
                        "***  *"+
                        "* *  *"+
                        "* *  *"+
                        "*  ** ";
						
		m_Lenses[45] =  "  ****"+ //Я
                        " *   *"+
                        " *   *"+
                        "  ****"+
                        "  *  *"+
                        " *   *"+
                        " *   *";
						
		m_Lenses[46] =  "   *  "+ // |
                        "   *  "+
                        "   *  "+
                        "   *  "+
                        "   *  "+
                        "   *  "+
                        "   *  ";
						
		m_Lenses[47] =  "      "+ // -
                        "      "+
                        "      "+
                        "******"+
                        "      "+
                        "      "+
                        "      ";
						
		m_Lenses[48] =  "     *"+ // /
                        "    * "+
                        "   *  "+
                        "  *   "+
                        " *    "+
                        "*     "+
                        "      ";
						
		m_Lenses[49] =  "*     "+ // \
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
        int index;

        index = Str.ToInt(val);
		if (index < 0 or index > 49)
        {
			ClearLenses(signal, corona);
			return;
        }

        string lenses = m_Lenses[index];
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
		if (m_Lenses.size() == 0)
			initLenses();
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