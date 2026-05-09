include "common.gs"
include "train.gs"
include "Browser.gs"

static class TabloState
{
	public define int None = 0;
	public define int Time = 1;
	public define int Dynamic = 2;
	public define int Static = 3;
	public define int Permanent = 4;
};

static class TabloHelper
{
	define int DaysIn20Years = 366*5 + 365*15;
	int  m_minutes;
	string m_date = null;
	
	string GetDateString()
	{
		int days = Str.ToInt(Interface.GetTimeStamp()) / 86400;
		int years = days/DaysIn20Years;
		int year = 1970 + years*20, month = 1;
		days = days - years*DaysIn20Years; 				
		while (days > 365)
		{
			if (++year%4 == 0) days = days - 366;
			else               days = days - 365;			
		}		
		if (days == 365 and year%4 != 0)
		{
			year++;
			days = 0;
		}
		if (days > 31) //jan
		{
			month++;
			days = days - 31;
		}
		if (days > 28) //feb
		{
			month++;
			days = days - 28;
		}
		if (days > 31) //mar
		{
			month++;
			days = days - 31;
		}
		if (days > 30) //apr
		{
			month++;
			days = days - 30;
		}
		if (days > 31) //may
		{
			month++;
			days = days - 31;
		}
		if (days > 30) //jun
		{
			month++;
			days = days - 30;
		}
		if (days > 31) //jul
		{
			month++;
			days = days - 31;
		}
		if (days > 31) //aug
		{
			month++;
			days = days - 31;
		}
		if (days > 30) //sep
		{
			month++;
			days = days - 30;
		}
		if (days > 31) //okt
		{
			month++;
			days = days - 31;
		}
		if (days > 30) //nov
		{
			month++;
			days = days - 30;
		}
				
		string d, m;
		if (++days < 10) d = "0"+days;
		else			 d = days;
		if (month < 10)  m = "0"+month;
		else			 m = month;
		
		return d + "." + m + "." + year;
	}
	
	public string GetDateTimeString()
	{
		float time = World.GetGameTime();
		int h = HTMLWindow.GetHoursFromFloat(time),
			m = HTMLWindow.GetMinutesFromFloat(time);//,
			//s = HTMLWindow.GetSecondsFromFloat(time);
		string sh, sm;//, ss;		
		if (h < 10) sh = "0"+h;
		else		sh = h;
		if (m < 10) sm = "0"+m;
		else		sm = m;
		//if (s < 10) ss = "0"+s;
		//else		ss = s;
		if (!m_date or (m_minutes == 59 and m != 59))
			m_date = GetDateString();
		m_minutes = m;		
		return  m_date + "  " + sh + ":" + sm;
	}
	
	public void SetTablo(Train train, string value)
	{
		Vehicle[] vehicles = train.GetVehicles();
		int i, len = vehicles.size();
		for (i = 0; i < len; i++)
		{
			if (vehicles[i])
				vehicles[i].SetFXNameText("tablo", value);
		}
	}
};
	
class TabloCalculator
{
	define int SpaceLen = 35;
	int  m_maxLen = 18;
	bool m_static;
	int  m_curParamIndex;
	string[] m_curParams = new string[0];
	int  m_curValueIndex;
	string m_curParam;
	int  m_curParamLen;
	bool m_finished = true,
		 m_forceFinish;
	
	public string GetSpacesString()
	{ 
		return "                                   "; //30
	}
		
	string GetStaticValue()
	{
		string res;
		int len = m_curParams.size();
		if (len)
		{
			if (m_curParamIndex == len) 
			{
				m_curParamIndex = 0;
				m_finished = true;
			}
			res = m_curParams[m_curParamIndex++];				
		}
		else
		{
			res = " ";
		}
		return res;
	}
	
	int  GetDynamicFrameLen()
	{
//Interface.Print("GetDynamicFrameLen:m_curValueIndex="+m_curValueIndex);
		int i = m_curValueIndex, 
			len, res;
		if (i < SpaceLen) 
		{
			len = res = SpaceLen - i;
			i = SpaceLen;
		}
		else
		{
			len = res = 0;
		}
//Interface.Print("GetDynamicFrameLen1:i="+i+",len="+len+",res="+res);
		while (len < m_maxLen)
		{
			res++;
			if (m_curParam[i] < 0 or i >= SpaceLen + m_curParamLen) 
			{
				i++;
				res++;
			}
			i++;
			len++;
		}
//Interface.Print("GetDynamicFrameLen2:i="+i+",len="+len+",res="+res);			
		return res;
	}
	
	string GetDynamicValue()
	{
		if (!m_curValueIndex)
		{
			string s = m_curParams[m_curParamIndex];
			m_curParamLen = s.size();
			m_curParam = GetSpacesString() + s + GetSpacesString() + GetSpacesString();
//	Interface.Print("m_curParam="+m_curParam+",m_curParamLen="+m_curParamLen);
		}		
		bool finished;
		int len;
		string res;
		if (m_curValueIndex + m_maxLen < SpaceLen)
		{
			len = 0;
			res = " ";
		}
		else
		{
			//res = Str.CloneString(m_curParam);
			len = GetDynamicFrameLen();
			//Str.Mid(res, m_curValueIndex, len);
			res = m_curParam[m_curValueIndex, m_curValueIndex+len];
			if (m_curParam[m_curValueIndex] < 0) m_curValueIndex++;
		}
		finished = (++m_curValueIndex + len >= m_curParamLen + 3*SpaceLen);
		if (finished)
		{
			m_curValueIndex = 0;
			if (++m_curParamIndex == m_curParams.size())
			{
				m_curParamIndex = 0;
				m_finished = true;
			}
			else if (m_forceFinish)
			{
				m_finished = true;
			}
		}				
		return res;
	}
	
	public bool IsFinished()
	{
		return m_finished;
	}
	
	public void SetMaxLen(int maxLen)
	{
		m_maxLen = maxLen;
	}
	
	public void Continue()
	{
		m_finished = false;
	}
	
	public void ForceFinish()
	{
		m_forceFinish = true;
	}
	
	public bool Init(string value, bool staticMode)
	{
		if (!m_finished)
		{
			Interface.Exception("TabloValue inin before Process finished");
			return false;
		}
		m_static = staticMode;
		m_curParams = Str.Tokens(value, "^");
		m_curParamIndex = 0;
		m_finished = m_forceFinish = false;
		return true;
	}
	
	public string GetValue()
	{
		if (m_finished or !m_curParams.size()) return " ";
		string res;
		if (m_static) 	res = GetStaticValue();
		else 			res = GetDynamicValue();
		return res;
	}		
};