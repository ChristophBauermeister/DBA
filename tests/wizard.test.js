import test from "node:test";
import assert from "node:assert/strict";

import { CLOUD_LIST } from "../js/cloud-data.js";
import { IDENTIFICATION_TREE, resolveWizardPath } from "../js/wizard.js";

test("atlas includes all ten WMO genera and four relevant special forms", () => {
  assert.equal(CLOUD_LIST.length, 14);
  for (const cloud of CLOUD_LIST) {
    assert.ok(cloud.id);
    assert.ok(cloud.summary);
    assert.ok(cloud.advice);
  }
});

test("resolves a high fibrous cloud to cirrus", () => {
  const result = resolveWizardPath([0, 0]);
  assert.equal(result.selection.result, "cirrus");
});

test("resolves an approaching low cloud wall to arcus", () => {
  const result = resolveWizardPath([2, 3]);
  assert.equal(result.selection.result, "arcus");
});

test("rejects an invalid path without throwing", () => {
  const result = resolveWizardPath([99], IDENTIFICATION_TREE);
  assert.equal(result.invalid, true);
  assert.equal(result.selection, null);
});
