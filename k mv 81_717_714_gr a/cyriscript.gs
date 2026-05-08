include "CyriScript_717.gs"

class CyriScript isclass CyriScript_717 
{
	bool IsAssetCorrect()
	{
		string kuid = GetAsset().GetConfigSoup().GetNamedTag("kuid");
		string[] s = Str.Tokens(kuid,"<:>");
		return (s[1] == "522190" and s[2] == "8171701");
	}

	public void Init(void) {
		if (!IsAssetCorrect()) return;
		inherited();
	}
};
