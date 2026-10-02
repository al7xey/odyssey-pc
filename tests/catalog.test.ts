import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  catalog,
  categories,
  defaultSelection,
  presets,
  compatibility,
  repairSelection,
  validateSelection,
  validateAppearance,
  totalPrice,
  type Selection,
} from '../src/entities/catalog';
test('Default and recommended presets are compatible', () => {
  for (const preset of presets) assert.deepEqual(compatibility(preset.selection), [], preset.name);
});
test('Detects socket, clearance, cooling and power conflicts', () => {
  const selection: Selection = {
    ...defaultSelection,
    cpu: 'intel7',
    gpu: 'rtx4090',
    case: 'compact',
    cooler: 'aio240',
    psu: 'psu750',
  };
  const issues = compatibility(selection);
  for (const category of ['motherboard', 'case', 'cooler', 'psu'])
    assert.ok(
      issues.some((i) => i.category === category),
      category,
    );
  assert.deepEqual(compatibility(repairSelection(selection)), []);
});
test('Every catalog combination can be repaired', () => {
  for (const cpu of catalog.cpu)
    for (const gpu of catalog.gpu)
      for (const pcCase of catalog.case)
        for (const cooler of catalog.cooler)
          for (const psu of catalog.psu) {
            const result = repairSelection({
              ...defaultSelection,
              cpu: cpu.id,
              gpu: gpu.id,
              case: pcCase.id,
              cooler: cooler.id,
              psu: psu.id,
            });
            assert.deepEqual(compatibility(result), [], JSON.stringify(result));
          }
});
test('Broken persisted data falls back safely', () => {
  assert.deepEqual(validateSelection(null), defaultSelection);
  assert.deepEqual(validateSelection({ gpu: 'invalid', cpu: null }), defaultSelection);
  const look = validateAppearance({
    color: 'url(javascript:alert(1))',
    brightness: Infinity,
    fanSpeed: -900,
    theme: 'bad',
    quality: 'bad',
    exploded: true,
  });
  assert.equal(look.color, '#ffe031');
  assert.equal(look.brightness, 80);
  assert.equal(look.fanSpeed, 0);
  assert.equal(look.exploded, false);
});
test('Price includes all eight components and assembly exactly once', () => {
  assert.equal(
    totalPrice(defaultSelection),
    8900 +
      categories.reduce(
        (sum, c) => sum + catalog[c.id].find((p) => p.id === defaultSelection[c.id])!.price,
        0,
      ),
  );
});
test('Appearance persists glass while transient animation modes reset', () => {
  const look = validateAppearance({ glass: false, color: '#3bcfda', rotating: true, exploded: true });
  assert.equal(look.glass, false);
  assert.equal(look.color, '#3bcfda');
  assert.equal(look.rotating, false);
  assert.equal(look.exploded, false);
});
