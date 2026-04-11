static class ZmvAls
{
	public define int ALS_0  = 0;
	public define int ALS_OC = 1;
	public define int ALS_AO = 2;
	public define int ALS_40 = 4;
	public define int ALS_60 = 6;
	public define int ALS_70 = 7;
	public define int ALS_80 = 8;
};

static class ZmvLenseTypes
{
    public define string scB  = "c_blue";
    public define string scR  = "c_red";
    public define string scY  = "c_yellow";
    public define string scYd = "c_yellow_dop";
    public define string scG  = "c_green";
    public define string scW  = "c_white";
    public define string scYt = "c_yellow_turn";
    public define string scYf = "c_yellow_fr";
    public define string scWf = "c_white_invitation";
    public define string scWW = "c_white_white";
};

static class ZmvSignalTypes
{
    //Signal types
    public define int R   = 0;
    public define int RY  = 1;
    public define int Y   = 2;
    public define int YG  = 3;
    public define int G   = 4;
    public define int PS  = 5;
    public define int W   = 6;
    public define int YY  = 7;
    public define int YfY = 8;
    public define int WW  = 9;
    public define int B   = 10;
};

//Signal types for external components
static class ZmvSignalExTypes
{
    public define int BLACK = 10000;
	public define int R     = 0;
	public define int RY    = 1000;
    public define int RWf   = 1;
    public define int YY    = 2;
    public define int YYgl  = 3;
    public define int Y     = 4;
    public define int YfY   = 5;
    public define int YfYgl = 6;
    public define int G     = 7;
    public define int Gf    = 8;
    public define int Yf    = 9;
    public define int GfYgl = 10;
    public define int YYY   = 11;
	public define int YG    = 12;
    public define int B     = 100;
    public define int W     = 101;
    public define int WW    = 102;
    public define int GG    = 27;
    public define int YW    = 34;
    public define int YfW   = 39;
	
	int[] _cache = new int[0];
	
	public int GetSignalEx(int type, bool ps)
	{
		if (ps)
            return ZmvSignalExTypes.RWf;

        if (_cache.size() == 0)
		{
			_cache[ZmvSignalTypes.R] 	= ZmvSignalExTypes.R;
			_cache[ZmvSignalTypes.RY] 	= ZmvSignalExTypes.RY;
			_cache[ZmvSignalTypes.Y] 	= ZmvSignalExTypes.Y;				
			_cache[ZmvSignalTypes.YG]   = ZmvSignalExTypes.YG;
			_cache[ZmvSignalTypes.G] 	= ZmvSignalExTypes.G;
			_cache[ZmvSignalTypes.W] 	= ZmvSignalExTypes.W;
			_cache[ZmvSignalTypes.YY] 	= ZmvSignalExTypes.YY;
			_cache[ZmvSignalTypes.YfY] 	= ZmvSignalExTypes.YfY;
			_cache[ZmvSignalTypes.WW] 	= ZmvSignalExTypes.WW;
			_cache[ZmvSignalTypes.B] 	= ZmvSignalExTypes.B;
		}
		if (type >= 0 and _cache.size() > type) return _cache[type];
		return ZmvSignalExTypes.R;					
	}
};
