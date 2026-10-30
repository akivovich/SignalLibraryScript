include "locomotive.gs"


class chme5_CabinData isclass CabinData
{
 // public bool switchOn1 = false;
//  public bool switchOn2 = false;
  public bool switchOn3 = false;
  public bool switchOn4 = false;
  public bool switchOn5 = false;
  public bool switchOn6 = false;
  public bool switchOn7 = false; 
  public bool switchOn8 = false;
  public bool switchOn9 = false;
  public bool top_nasos1=false;
  public bool top_nasos2=false;
  public bool  zapusk1 = false;
  public bool  zapusk2 = false;

  public bool WeInsideCabin = false;
  
  public int stateCabLightbzp=1; 
  public int stateCabLightbzl=1;
  public int stateCabLightbpp=1;
  public int stateCabLightbpl=1;
  public int stateCabLightprtusklo=0;
  public int stateCabLightSvetCab=1;
  public int stateCabLightSvetPulta=1;
  public int stateCabtm=1;
  public int stateCabKm=0;
  public int stateCabLight=1;

  public bool lightOn1 = false;
  public bool lightOn2 = false;
  public bool lightOn3 = false;
  public bool lightOn4 = false;
  
};