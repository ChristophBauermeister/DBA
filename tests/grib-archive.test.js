import test from "node:test";
import assert from "node:assert/strict";

import { parseGribHeader } from "../js/grib-archive.js";

function grib2Header(length = 64) {
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  for (const [index, character] of [..."GRIB"].entries()) {
    view.setUint8(index, character.charCodeAt(0));
  }
  view.setUint8(6, 10);
  view.setUint8(7, 2);
  view.setUint32(8, 0);
  view.setUint32(12, length);
  view.setUint32(16, 21);
  view.setUint8(20, 1);
  view.setUint16(28, 2026);
  view.setUint8(30, 7);
  view.setUint8(31, 18);
  view.setUint8(32, 6);
  return buffer;
}

test("reads edition, discipline, length and reference time from GRIB2", () => {
  const result = parseGribHeader(grib2Header());

  assert.equal(result.edition, 2);
  assert.equal(result.discipline, 10);
  assert.equal(result.disciplineLabel, "Ozeanographie");
  assert.equal(result.declaredLength, 64);
  assert.equal(result.referenceTime, "2026-07-18T06:00:00.000Z");
});

test("rejects files without a GRIB signature", () => {
  assert.throws(() => parseGribHeader(new ArrayBuffer(32)), /GRIB-Signatur/);
});

test("rejects unsupported GRIB editions", () => {
  const buffer = grib2Header();
  new DataView(buffer).setUint8(7, 3);
  assert.throws(() => parseGribHeader(buffer), /Edition 3/);
});
