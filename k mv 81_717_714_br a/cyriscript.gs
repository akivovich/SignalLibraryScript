include "cyriscriptsecondary.gs"

class CyriScript isclass CyriScriptSecondary 
{
	void  WhiteLampsOff()
	{		
		SetFXCoronaTexture("doorlight-0", null );
		SetFXCoronaTexture("doorlight-1", null );
	}
	
	thread void LampsBlink()
	{
		Sleep(5);
		WhiteLampsOff();
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
			WhiteLampsOff();
		}
	}
	
	bool IsAssetCorrect()
	{
		string kuid = GetAsset().GetConfigSoup().GetNamedTag("kuid");
		string[] s = Str.Tokens(kuid,"<:>");
		return (s[1] == "522190" and s[2] == "817177");
	}

	public void Init(void) {
		if (!IsAssetCorrect()) return;
		inherited();
		WhiteLampsOff();
	}
};


