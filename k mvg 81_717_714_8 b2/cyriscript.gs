include "cyriscriptsecondary.gs"

class CyriScript isclass CyriScriptSecondary 
{
	void  RedLampsOff()
	{		
		SetFXCoronaTexture("leftflash-0", null );
		SetFXCoronaTexture("leftflash-1", null );
		SetFXCoronaTexture("leftflash-2", null );
		SetFXCoronaTexture("leftflash-3", null );
		SetFXCoronaTexture("rightflash-0", null );
		SetFXCoronaTexture("rightflash-1", null );
		SetFXCoronaTexture("rightflash-2", null );
		SetFXCoronaTexture("rightflash-3", null );
	}

	void  WhiteLampsOff()
	{		
		SetFXCoronaTexture("doorlight-0", null );
		SetFXCoronaTexture("doorlight-1", null );
	}
	
	thread void LampsBlink()
	{
		Asset k_red01 = GetAsset().FindAsset("red");
		SetFXCoronaTexture("leftflash-0", k_red01 );
		SetFXCoronaTexture("leftflash-1", k_red01 );
		SetFXCoronaTexture("leftflash-2", k_red01 );
		SetFXCoronaTexture("leftflash-3", k_red01 );
		SetFXCoronaTexture("rightflash-0", k_red01 );
		SetFXCoronaTexture("rightflash-1", k_red01 );
		SetFXCoronaTexture("rightflash-2", k_red01 );
		SetFXCoronaTexture("rightflash-3", k_red01 );
		Sleep(7);
		WhiteLampsOff();
		Sleep(2.5);
		RedLampsOff();
	}
	
	public void SetDoorAnimationState(string p_meshName, bool p_state) 
	{
		inherited(p_meshName, p_state);
		if (p_state)
		{
			Asset k_white01 = GetAsset().FindAsset("white");
			SetFXCoronaTexture("doorlight-0", k_white01 );
			SetFXCoronaTexture("doorlight-1", k_white01 );
		}
		else
		{
			LampsBlink();
		}
	}

	public void SetElectroSupply(bool val)
	{
		inherited(val);
		if (!val)
		{
			RedLampsOff();
			WhiteLampsOff();
		}
	}
	
	public void Init(void) 
	{
		inherited();
		RedLampsOff();
		WhiteLampsOff();
	}
};


