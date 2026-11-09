const DATABASE_NAME = "wolkenlotse-grib";
const DATABASE_VERSION = 1;
const STORE_NAME = "files";
const MAX_GRIB_SIZE = 128 * 1024 * 1024;

const DISCIPLINES = {
  0: "Meteorologie",
  1: "Hydrologie",
  2: "Landoberfläche",
  3: "Weltraum",
  10: "Ozeanographie",
};

function readUint24(view, offset) {
  return (view.getUint8(offset) << 16) | (view.getUint8(offset + 1) << 8) | view.getUint8(offset + 2);
}

export function parseGribHeader(buffer) {
  if (!(buffer instanceof ArrayBuffer) || buffer.byteLength < 16)
    throw new Error("Datei ist zu klein für einen GRIB-Kopf.");
  const view = new DataView(buffer);
  const magic = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3),
  );
  if (magic !== "GRIB") throw new Error("Datei besitzt keine GRIB-Signatur.");
  const edition = view.getUint8(7);
  if (![1, 2].includes(edition)) throw new Error(`GRIB-Edition ${edition} wird nicht unterstützt.`);

  let declaredLength = null;
  let discipline = null;
  let referenceTime = null;
  if (edition === 2) {
    discipline = view.getUint8(6);
    const high = view.getUint32(8);
    const low = view.getUint32(12);
    declaredLength = high * 2 ** 32 + low;

    // GRIB2 section 1 starts immediately after the 16-byte indicator section.
    if (buffer.byteLength >= 35 && view.getUint8(20) === 1) {
      const year = view.getUint16(28);
      const month = view.getUint8(30);
      const day = view.getUint8(31);
      const hour = view.getUint8(32);
      const minute = view.getUint8(33);
      const second = view.getUint8(34);
      const timestamp = Date.UTC(year, month - 1, day, hour, minute, second);
      if (year >= 1900 && month >= 1 && month <= 12 && Number.isFinite(timestamp)) {
        referenceTime = new Date(timestamp).toISOString();
      }
    }
  } else {
    declaredLength = readUint24(view, 4);
  }

  return {
    edition,
    discipline,
    disciplineLabel: DISCIPLINES[discipline] || (discipline == null ? "Nicht angegeben" : `Code ${discipline}`),
    declaredLength,
    referenceTime,
  };
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error("IndexedDB ist auf diesem Gerät nicht verfügbar."));
      return;
    }
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

async function transact(mode, operation) {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, mode);
      const store = transaction.objectStore(STORE_NAME);
      const request = operation(store);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  } finally {
    database.close();
  }
}

export async function storeGribFile(file) {
  if (!(file instanceof Blob)) throw new Error("Keine gültige Datei ausgewählt.");
  if (file.size > MAX_GRIB_SIZE) throw new Error("GRIB-Datei ist größer als 128 MB.");
  const headerBuffer = await file.slice(0, 64).arrayBuffer();
  const header = parseGribHeader(headerBuffer);
  if (header.declaredLength && Math.abs(header.declaredLength - file.size) > 16) {
    throw new Error(
      `GRIB-Längenangabe (${header.declaredLength} Byte) passt nicht zur Datei (${file.size} Byte).`,
    );
  }
  const id = `grib-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const record = {
    id,
    name: String(file.name || "forecast.grib2").slice(0, 240),
    size: file.size,
    type: file.type || "application/octet-stream",
    addedAt: Date.now(),
    ...header,
    blob: file,
  };
  await transact("readwrite", (store) => store.put(record));
  return { ...record, blob: undefined };
}

export async function listGribFiles() {
  const records = await transact("readonly", (store) => store.getAll());
  return records
    .map(({ blob, ...metadata }) => metadata)
    .sort((a, b) => b.addedAt - a.addedAt);
}

export async function getGribFile(id) {
  return transact("readonly", (store) => store.get(id));
}

export async function deleteGribFile(id) {
  await transact("readwrite", (store) => store.delete(id));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function initGribArchive({ onToast = () => {} } = {}) {
  const elements = {
    input: document.querySelector("#grib-import"),
    list: document.querySelector("#grib-file-list"),
  };

  async function render() {
    try {
      const files = await listGribFiles();
      elements.list.innerHTML = files.length
        ? files
            .map(
              (file) => `
                <article class="grib-file">
                  <span class="grib-badge">GRIB${file.edition}</span>
                  <div>
                    <strong>${escapeHtml(file.name)}</strong>
                    <small>${formatBytes(file.size)} · ${escapeHtml(file.disciplineLabel)}${
                      file.referenceTime
                        ? ` · Lauf ${new Date(file.referenceTime).toLocaleString("de-DE")}`
                        : ""
                    }</small>
                  </div>
                  <div>
                    <button class="text-button" data-grib-download="${file.id}" type="button">Export</button>
                    <button class="text-button danger" data-grib-delete="${file.id}" type="button">Löschen</button>
                  </div>
                </article>
              `,
            )
            .join("")
        : `
            <div class="grib-empty">
              <strong>Keine GRIB-Datei an Bord</strong>
              <span>Importierte Rohdateien werden unverändert offline gespeichert.</span>
            </div>
          `;
    } catch (error) {
      elements.list.innerHTML = `<div class="grib-empty"><strong>GRIB-Ablage nicht verfügbar</strong><span>${escapeHtml(
        error.message,
      )}</span></div>`;
    }
  }

  elements.input.addEventListener("change", async () => {
    const file = elements.input.files?.[0];
    if (!file) return;
    try {
      await storeGribFile(file);
      await render();
      onToast("GRIB-Datei wurde validiert und offline gespeichert.");
    } catch (error) {
      onToast(`GRIB-Import fehlgeschlagen: ${error.message}`);
    } finally {
      elements.input.value = "";
    }
  });

  elements.list.addEventListener("click", async (event) => {
    const downloadButton = event.target.closest("[data-grib-download]");
    const deleteButton = event.target.closest("[data-grib-delete]");
    if (downloadButton) {
      const record = await getGribFile(downloadButton.dataset.gribDownload);
      if (!record?.blob) return;
      const url = URL.createObjectURL(record.blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = record.name;
      anchor.click();
      URL.revokeObjectURL(url);
    }
    if (deleteButton) {
      await deleteGribFile(deleteButton.dataset.gribDelete);
      await render();
      onToast("GRIB-Datei gelöscht.");
    }
  });

  render();
  return { refresh: render, list: listGribFiles };
}
