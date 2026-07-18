export const CLOUDS = {
  cirrus: {
    id: "cirrus",
    name: "Federwolken",
    latin: "Cirrus",
    category: "hoch",
    height: "6–13 km",
    weather: "Vorboten eines Wetterwechsels",
    risk: "watch",
    summary:
      "Feine, faserige Eiswolken in großer Höhe. Einzelne Cirren sind meist harmlos; verdichten sie sich und ziehen aus Westen auf, kann eine Warmfront folgen.",
    advice:
      "Entwicklung über mehrere Stunden beobachten. Bei zunehmender Bewölkung Seewetterbericht prüfen und auf fallenden Luftdruck achten.",
  },
  cirrocumulus: {
    id: "cirrocumulus",
    name: "Hohe Schäfchen",
    latin: "Cirrocumulus",
    category: "hoch",
    height: "6–13 km",
    weather: "Höhenturbulenz, Übergangsphase",
    risk: "low",
    summary:
      "Sehr kleine weiße Körnchen oder Rippel ohne Schattierung – der typische Makrelenhimmel. Meist kurzlebig, großflächig aber ein mögliches Zeichen für Wetteränderung.",
    recognition:
      "Einzelelemente kleiner als ein Fingerbreit bei ausgestrecktem Arm, regelmäßig angeordnet und ohne dunkle Eigenabschattung.",
    advice:
      "Beobachten, ob die Felder in einen dichten Schleier übergehen. Für die nächsten Stunden meist kein unmittelbarer Handlungsdruck.",
  },
  cirrostratus: {
    id: "cirrostratus",
    name: "Schleierwolken",
    latin: "Cirrostratus",
    category: "hoch",
    height: "6–12 km",
    weather: "Front möglich, Halo typisch",
    risk: "caution",
    summary:
      "Ein milchiger Schleier überzieht große Teile des Himmels. Ein Ring um Sonne oder Mond deutet oft auf Eiskristalle und eine heranziehende Warmfront hin.",
    advice:
      "Mit einer Wetterverschlechterung innerhalb der nächsten Stunden rechnen. Reffplan und Ausweichhäfen frühzeitig prüfen.",
  },
  altocumulus: {
    id: "altocumulus",
    name: "Schäfchenwolken",
    latin: "Altocumulus",
    category: "mittel",
    height: "2–7 km",
    weather: "Labilität möglich",
    risk: "watch",
    summary:
      "Weiße oder graue Felder aus vielen Ballen. Türmchen am Morgen können im Sommer auf zunehmende Labilität und spätere Gewitter hinweisen.",
    advice:
      "Form und Wachstum beobachten. Bei rascher vertikaler Entwicklung Gewitterlage prüfen und einen sicheren Kurs vorbereiten.",
  },
  altostratus: {
    id: "altostratus",
    name: "Mittelhohe Schicht",
    latin: "Altostratus",
    category: "mittel",
    height: "2–7 km",
    weather: "Frontniederschlag nähert sich",
    risk: "caution",
    summary:
      "Eine graue bis blaugraue, strukturarme Schicht. Die Sonne bleibt als matte Scheibe sichtbar, wirft aber keine deutlichen Schatten mehr.",
    recognition:
      "Anders als beim hohen Schleier fehlt der Halo. Die Sonne erscheint wie hinter Milchglas; die Schicht wirkt dichter werdend.",
    advice:
      "Ölzeug, Reffplan und Wachrhythmus vorbereiten. Bei fallendem Druck ist länger anhaltender Niederschlag in den nächsten Stunden wahrscheinlich.",
  },
  nimbostratus: {
    id: "nimbostratus",
    name: "Regenwolken",
    latin: "Nimbostratus",
    category: "mittel",
    height: "0,5–5 km",
    weather: "Anhaltender Niederschlag",
    risk: "caution",
    summary:
      "Eine dunkle, strukturlose Schicht mit länger anhaltendem Regen oder Schnee. Die Sicht kann deutlich zurückgehen.",
    advice:
      "Ölzeug und Navigationsbeleuchtung vorbereiten. Radarreflektor setzen, Ausguck verstärken und mit schlechter Sicht rechnen.",
  },
  stratus: {
    id: "stratus",
    name: "Schichtwolken",
    latin: "Stratus",
    category: "tief",
    height: "0–2 km",
    weather: "Trüb, Niesel oder Nebel",
    risk: "watch",
    summary:
      "Eine tiefe, gleichmäßige graue Decke. Sie kann Niesel bringen und auf See direkt in Nebel oder Hochnebel übergehen.",
    advice:
      "Sichtweite eng überwachen. Positionslichter einschalten, Schallsignale und sichere Geschwindigkeit bei Nebel beachten.",
  },
  stratocumulus: {
    id: "stratocumulus",
    name: "Haufenschicht",
    latin: "Stratocumulus",
    category: "tief",
    height: "0,5–2 km",
    weather: "Meist ruhig und gut segelbar",
    risk: "low",
    summary:
      "Große graue oder weißliche Ballen und Walzen mit dunklen Schattierungen, häufig in Reihen und mit blauen Lücken dazwischen.",
    recognition:
      "Die Elemente sind deutlich größer als mittelhohe Schäfchen und bilden oft eine zusammenhängende, aber strukturierte tiefe Decke.",
    advice:
      "Normalbetrieb. Schließt und senkt sich die Decke, auf Stratus, Niesel und schlechter werdende Sicht einstellen.",
  },
  cumulus: {
    id: "cumulus",
    name: "Haufenwolken",
    latin: "Cumulus",
    category: "vertikal",
    height: "0,5–6 km",
    weather: "Meist freundlich, Wachstum beachten",
    risk: "low",
    summary:
      "Klar begrenzte Quellwolken mit flacher Basis. Kleine Schönwetter-Cumuli sind harmlos; starkes Höhenwachstum zeigt zunehmende Labilität.",
    advice:
      "Bei flachen Wolken normale Aufmerksamkeit. Wachsen sie schnell und werden unten dunkel, Segelfläche reduzieren und Schauerböen einplanen.",
  },
  cumulonimbus: {
    id: "cumulonimbus",
    name: "Gewitterwolken",
    latin: "Cumulonimbus",
    category: "vertikal",
    height: "0,5–13 km",
    weather: "Gewitter, Böen, Starkregen",
    risk: "danger",
    summary:
      "Ein mächtiger Wolkenturm, oft mit dunkler Basis und ambossförmigem Oberteil. Er kann schwere Böen, Blitz, Hagel und Starkregen bringen.",
    advice:
      "Nicht abwarten: Abstand vergrößern, früh reffen oder Segel bergen, Crew sichern und geschützten Bereich anlaufen. Blitz- und Böenrisiko ernst nehmen.",
  },
  arcus: {
    id: "arcus",
    name: "Böenwalze",
    latin: "Arcus",
    category: "tief",
    height: "0,1–1 km",
    weather: "Gustfront in wenigen Minuten",
    risk: "danger",
    summary:
      "Eine horizontale dunkle Wolkenrolle oder keilförmige Regalwolke an der Vorderkante einer Gewitter- oder Squall-Linie.",
    recognition:
      "Wirkt wie eine schnell näherkommende Wand vor einem dunklen Niederschlagsbereich. Darunter sind oft aufgewühlte Fetzen sichtbar.",
    advice:
      "Letzte Warnung: Segel sofort stark reduzieren oder bergen, Luken dicht, Crew einpicken und mit hartem Böensprung sowie Winddrehung rechnen.",
  },
  lenticularis: {
    id: "lenticularis",
    name: "Linsenwolken",
    latin: "Lenticularis",
    category: "mittel",
    height: "2–7 km",
    weather: "Leewellen und Fallböen möglich",
    risk: "caution",
    summary:
      "Glatte linsen- oder mandelförmige Wolken, die trotz starken Höhenwinds scheinbar ortsfest im Lee von Gebirgen stehen.",
    recognition:
      "Scharfe glatte Ränder, häufig übereinander gestapelt. Typisch an Gebirgs-, Fjord- und Inselküsten.",
    advice:
      "Abstand zur Leeküste bewusst wählen. Trotz Sonnenschein mit Fallböen rechnen und Reffbereitschaft herstellen.",
  },
  mammatus: {
    id: "mammatus",
    name: "Beutelwolken",
    latin: "Mammatus",
    category: "vertikal",
    height: "Unter dem Gewitteramboss",
    weather: "Energiegeladenes System in der Nähe",
    risk: "caution",
    summary:
      "Beutelartige Ausstülpungen an der Unterseite eines Wolkenschirms, meist auf der Rückseite eines kräftigen Gewittersystems.",
    recognition:
      "Viele runde, nach unten hängende Taschen unter einer glatten, dunklen Wolkenfläche.",
    advice:
      "System und Zugrichtung lokalisieren, Blitzabstand messen und mindestens ein bis zwei Stunden erhöhte Wachsamkeit halten.",
  },
  virga: {
    id: "virga",
    name: "Fallstreifen",
    latin: "Virga",
    category: "mittel",
    height: "Unter der Wolkenbasis",
    weather: "Fallböen ohne Regen an Deck",
    risk: "caution",
    summary:
      "Regen- oder Schneeschleier hängen unter der Wolke, verdunsten aber, bevor sie Wasser oder Land erreichen.",
    recognition:
      "Faserige senkrechte Streifen, die nach unten dünner werden und sichtbar vor dem Horizont enden.",
    advice:
      "Mit unvermittelten Böen und Winddrehern rechnen. Schoten fierbereit halten und nicht darauf vertrauen, dass fehlender Regen Entwarnung bedeutet.",
  },
};

export const CLOUD_LIST = Object.values(CLOUDS);

export const RISK_LABELS = {
  low: "Ruhig beobachten",
  watch: "Aufmerksam bleiben",
  caution: "Vorbereiten",
  danger: "Sofort handeln",
};
