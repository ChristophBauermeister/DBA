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
};

export const CLOUD_LIST = Object.values(CLOUDS);

export const RISK_LABELS = {
  low: "Ruhig beobachten",
  watch: "Aufmerksam bleiben",
  caution: "Vorbereiten",
  danger: "Sofort handeln",
};
