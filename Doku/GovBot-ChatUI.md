# GovBot-ChatUI [![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](http://www.gnu.org/licenses/agpl-3.0) 
Die Chat-UI dient der Einbettung des [GovBots](https://www.govbot.io) in eine Webseite,  
die folgenden JSON-Objekte sorgen für eine schönere Darstellung der Ergebnisse in der ChatUI:

## JSON-Objekte:
#### Buttons in der ChatUI:
Button-grid:
``` 
{  
  "text":"Hier die frage zu dem Button-grid", 
  "type":"buttons_grid", 
  "data": [ 
   {"title":"Ja", "response":"ja"}, 
   {"title":"Nein", "response":"nein"},
   {"title":"Vielleicht", "response":"vielleicht"}
  ],
  "language": "de"
}
```
Button-list:
```
{  
  "text":"Hier die frage zu dem Button-list", 
  "type":"buttons_list", 
  "data": [ 
   {"title":"Ja", "response":"ja"}, 
   {"title":"Nein", "response":"nein"},
   {"title":"Vielleicht", "response":"vielleicht"}
  ],
  "language": "de"
}
``` 
Link_list:
```
{
  "text": answer,
  "type": "link_list",
  "data": [
    {
      "title": "titleString",
      "href": decodeURIComponent(address.websiteURL)
    },
    {
      "title": "titleString",
      "href": decodeURIComponent(address.websiteURL)
    },
  ],
  "language": "de"
}
```

## MessageConverter:
Der MessageConverter erstellt aus dem ChatUI-JSON
Antworten für native Chat-Programme (telegram, slack, whatsapp):
```
session.toMessage(JSON-Objekte);
```

## License
Dieses Projekt steht unter der [AGPL v3 license](http://www.gnu.org/licenses/agpl-3.0)
##
