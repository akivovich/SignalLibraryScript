// VehicleWithDestSign.gs
//
// (C) 2005 p-dehnert	
//
include "vehicle.gs"
include "sessionvariables.gs"

class VehicleWithDestSign isclass Locomotive
{

    string destination = "";

    //
    // Change destination signs
    //
    void ChangeDestinationSign(Message msg)
    {
	int maxlen = 999;		// en:	Maximum number of characters on sign. Change to adapt to the size of the sign.
					// de:	Maximale Anzahl von Zeichen in der Zielanzeige. An die Groesse der Anzeige anpassen.
	string new_destination = "";
	  
	if (msg) { new_destination = msg.minor; }
	
	// en:	Some modifications of the value contained in the message. Add your own modifications if needed.
	// de:	Einige Aenderungen des Wertes aus der Nachricht. Falls noetig koennen eigene Aenderungen eingefuegt werden.
	if ( new_destination == "" ) { new_destination = "POSADKI NET"; }
	if (new_destination.size() > maxlen) { new_destination = new_destination[,maxlen]; }

	// en:	Displaying the signs. Use the same names as in the config.txt. Any number of signs are possible.
	// de:	Anzeige der Ziele. Verwende die selben Namen wie in der config.txt. Eine beliebige Anzahl von Anzeigen ist möglich.
	SetFXNameText("dest1", new_destination);
	SetFXNameText("dest2", new_destination);
	SetFXNameText("dest3", new_destination);
	SetFXNameText("dest4", new_destination);
	
	destination = new_destination;
    }

    //
    // en:	Save support
    // de:	Speichern der Eigenschaften
    //
    public Soup GetProperties(void)
    {
	Soup soup = inherited();

	soup.SetNamedTag("destination", destination);
	
	return soup;
    }

    //
    // en:	Load support
    // de:	Laden der Eigenschaften
    //
    public void SetProperties(Soup soup)
    {
	string new_destination = soup.GetNamedTag("destination");
	PostMessage(me, "ChangeDestinationSign", new_destination, 0);
	
	inherited(soup);
    }

    //
    // en: Initialise the vehicle
    // de: Initialisierung des Fahrzeuges
    //
    public void Init(void)
    {

	inherited();

	// en: Install messagehandler and initialise signs
	// de: Routine fuer die Nachrichtenbehandlung installieren und Zielanzeigen initialisieren
	AddHandler(me,"ChangeDestinationSign", "", "ChangeDestinationSign");
	ChangeDestinationSign(null);
	
    }
};

