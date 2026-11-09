import { CLOUDS, RISK_LABELS } from "./cloud-data.js";

export const IDENTIFICATION_TREE = {
  question: "Wo steht die Wolke am Himmel?",
  context: "Schritt 1 · Höhe und Form",
  options: [
    {
      title: "Sehr hoch, fein und weiß",
      detail: "Fasern, Schleier oder winzige Körnchen; Sonne scheint hindurch.",
      next: {
        question: "Welche Struktur überwiegt?",
        context: "Schritt 2 · Hohe Wolken",
        options: [
          { title: "Fasern, Federn oder Haken", detail: "Einzelne helle Striche", result: "cirrus" },
          {
            title: "Gleichmäßiger Milchschleier",
            detail: "Halo um Sonne oder Mond möglich",
            result: "cirrostratus",
          },
          {
            title: "Winzige Körnchen oder Rippel",
            detail: "Makrelenhimmel ohne Schatten",
            result: "cirrocumulus",
          },
        ],
      },
    },
    {
      title: "Mittlere Höhe",
      detail: "Ballen mit Schatten oder eine graue Schicht; Sonne matt sichtbar.",
      next: {
        question: "Ballen oder Schicht?",
        context: "Schritt 2 · Mittelhohe Wolken",
        options: [
          {
            title: "Ballen, Walzen oder Schäfchen",
            detail: "Ein bis drei Fingerbreit groß",
            next: {
              question: "Gibt es eine besondere Form?",
              context: "Schritt 3 · Struktur",
              options: [
                { title: "Flache Ballen", detail: "Felder mit Eigenabschattung", result: "altocumulus" },
                {
                  title: "Türmchen oder Zinnen",
                  detail: "Castellanus – erhöhte Gewitterneigung",
                  result: "altocumulus",
                  note:
                    "Türmchen am Vormittag deuten auf labile Luft in der Höhe. Nachmittagsentwicklung eng beobachten.",
                },
                {
                  title: "Glatte, ortsfeste Linsen",
                  detail: "Im Lee von Bergen oder Inseln",
                  result: "lenticularis",
                },
                {
                  title: "Beutel an der Unterseite",
                  detail: "Unter einem großen Wolkenschirm",
                  result: "mammatus",
                },
              ],
            },
          },
          {
            title: "Graue Schicht, Sonne wie hinter Milchglas",
            detail: "Kein Halo, kaum Schatten",
            result: "altostratus",
          },
          {
            title: "Dunkle Schicht mit Dauerregen",
            detail: "Sonne vollständig verdeckt",
            result: "nimbostratus",
          },
        ],
      },
    },
    {
      title: "Tief und schnell ziehend",
      detail: "Basis unter etwa zwei Kilometern; Details gut erkennbar.",
      next: {
        question: "Wie sieht die Unterseite aus?",
        context: "Schritt 2 · Tiefe Wolken",
        options: [
          {
            title: "Große Schollen mit Lücken",
            detail: "Graue Ballen oder Walzen",
            result: "stratocumulus",
          },
          {
            title: "Konturlose graue Decke",
            detail: "Hochnebel, eventuell Niesel",
            result: "stratus",
          },
          {
            title: "Dunkle Regendecke",
            detail: "Länger anhaltender Niederschlag",
            result: "nimbostratus",
          },
          {
            title: "Dunkle Rolle oder Wand rückt an",
            detail: "Vor einer Regenwand",
            result: "arcus",
          },
        ],
      },
    },
    {
      title: "Einzelne Haufen oder Türme",
      detail: "Flache Basis, blumenkohlartige Kuppen und vertikales Wachstum.",
      next: {
        question: "Wie stark ist die Wolke gewachsen?",
        context: "Schritt 2 · Quellwolken",
        options: [
          {
            title: "Flacher als breit",
            detail: "Kleine Schönwetterwolke",
            result: "cumulus",
          },
          {
            title: "Höher als breit, scharfe Kuppen",
            detail: "Congestus – wächst sichtbar",
            result: "cumulus",
            note:
              "Dieses Congestus-Stadium liegt nur einen Entwicklungsschritt vor der Gewitterwolke. Spitzen alle 10–15 Minuten prüfen.",
          },
          {
            title: "Faserige Spitze oder Amboss",
            detail: "Dunkle Basis, Regenschleier oder Blitze",
            result: "cumulonimbus",
          },
          {
            title: "Regenstreifen enden in der Luft",
            detail: "Niederschlag erreicht das Wasser nicht",
            result: "virga",
          },
        ],
      },
    },
  ],
};

export function resolveWizardPath(path, tree = IDENTIFICATION_TREE) {
  let node = tree;
  let selection = null;

  for (const index of path) {
    selection = node.options?.[index];
    if (!selection) return { node: tree, selection: null, invalid: true };
    if (selection.next) node = selection.next;
  }

  return { node, selection, invalid: false };
}

export function initWizard(container, { onOpenCloud } = {}) {
  let path = [];

  function render() {
    const { node, selection, invalid } = resolveWizardPath(path);
    if (invalid) path = [];

    if (selection?.result) {
      const cloud = CLOUDS[selection.result];
      container.innerHTML = `
        <div class="wizard-result">
          <div class="result-kicker">${RISK_LABELS[cloud.risk]}</div>
          <h2>${cloud.name}</h2>
          <div class="result-latin">${cloud.latin} · ${cloud.height}</div>
          <p>${cloud.summary}</p>
          ${
            selection.note
              ? `<div class="wizard-note"><strong>Sonderform</strong>${selection.note}</div>`
              : ""
          }
          <div class="sailing-advice">
            <div class="advice-heading">Empfehlung für den Törn</div>
            <p>${cloud.advice}</p>
          </div>
          <div class="wizard-actions">
            <button class="button button-primary" data-wizard-info type="button">Steckbrief öffnen</button>
            <button class="button button-secondary" data-wizard-reset type="button">Neu bestimmen</button>
          </div>
        </div>
      `;
      container.querySelector("[data-wizard-info]").addEventListener("click", () => {
        onOpenCloud?.(cloud.id);
      });
      container.querySelector("[data-wizard-reset]").addEventListener("click", () => {
        path = [];
        render();
      });
      return;
    }

    container.innerHTML = `
      <div class="wizard-progress">
        <span>${node.context}</span>
        <span>${Math.min(path.length + 1, 3)} / 3</span>
      </div>
      <h2 class="wizard-question">${node.question}</h2>
      <div class="wizard-options">
        ${node.options
          .map(
            (option, index) => `
              <button type="button" data-wizard-option="${index}">
                <span>
                  <strong>${option.title}</strong>
                  <small>${option.detail}</small>
                </span>
                <span aria-hidden="true">→</span>
              </button>
            `,
          )
          .join("")}
      </div>
      ${
        path.length
          ? '<button class="text-button wizard-back" data-wizard-back type="button">← Eine Frage zurück</button>'
          : ""
      }
    `;

    container.querySelectorAll("[data-wizard-option]").forEach((button) => {
      button.addEventListener("click", () => {
        path.push(Number(button.dataset.wizardOption));
        render();
      });
    });
    container.querySelector("[data-wizard-back]")?.addEventListener("click", () => {
      path.pop();
      render();
    });
  }

  render();
  return { reset: () => ((path = []), render()) };
}
