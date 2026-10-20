/**
 * Tests Unitaires & Intégration - game-ui.js (Couche Présentation & Formatage)
 * Couverture de formatLargeNumber, getEconomyBreakdown, computeTabBadges, updateEvolutionUI
 */

if (typeof describe === 'undefined' && typeof require === 'function') {
  const nodeTest = require('node:test');
  const assert = require('node:assert/strict');
  globalThis.describe = nodeTest.describe;
  globalThis.it = nodeTest.it;
  globalThis.beforeEach = nodeTest.beforeEach;
  globalThis.assertNotNull = (val, msg) => assert.notEqual(val, null, msg);
  globalThis.assertEqual = (a, b, msg) => assert.equal(a, b, msg);
  globalThis.assertTrue = (val, msg) => assert.equal(Boolean(val), true, msg);
  globalThis.assertFalse = (val, msg) => assert.equal(Boolean(val), false, msg);
  require('../config.js');
  require('../i18n.js');
  require('../game-ui.js');
}

const uiModule = (typeof require === 'function') ? require('../game-ui.js') : (typeof window !== 'undefined' ? window : globalThis);
const configModule = (typeof require === 'function') ? require('../config.js') : (typeof window !== 'undefined' ? window : globalThis);
const { formatLargeNumber, getEconomyBreakdown, computeTabBadges, updateEvolutionUI } = uiModule;
const { GAME_CONFIG } = configModule;

describe('game-ui.js — formatLargeNumber (Formateur Universel)', function() {
  it('doit gérer les entrées nulles, non définies ou NaN', function() {
    assertEqual(formatLargeNumber(null), '0');
    assertEqual(formatLargeNumber(undefined), '0');
    assertEqual(formatLargeNumber(NaN), '0');
    assertEqual(formatLargeNumber('invalid'), '0');
  });

  it('doit gérer l’infini positif et négatif selon la langue', function() {
    assertEqual(formatLargeNumber(Infinity, 'fr'), 'Infini');
    assertEqual(formatLargeNumber(Infinity, 'en'), 'Infinity');
    assertEqual(formatLargeNumber(-Infinity, 'fr'), '-Infini');
    assertEqual(formatLargeNumber(-Infinity, 'en'), '-Infinity');
  });

  it('doit formater les nombres usuels avec séparateur décimal adapté', function() {
    assertEqual(formatLargeNumber(0, 'fr'), '0');
    assertEqual(formatLargeNumber(15, 'fr'), '15');
    assertEqual(formatLargeNumber(15.5, 'fr'), '15,5');
    assertEqual(formatLargeNumber(15.5, 'en'), '15.5');
  });

  it('doit formater les grands nombres avec suffixes et notation compacte', function() {
    assertTrue(formatLargeNumber(1500, 'fr').includes('1,5'));
    assertTrue(formatLargeNumber(2500000, 'en').includes('2.5'));
    assertTrue(formatLargeNumber(1000000000, 'fr').includes('1'));
  });

  it('doit préserver le signe négatif', function() {
    assertTrue(formatLargeNumber(-2500, 'fr').startsWith('-'));
  });
});

describe('game-ui.js — getEconomyBreakdown (Décomposition Économique Pure)', function() {
  it('doit calculer les flux de nourriture et de phéromones', function() {
    const state = {
      food: 100,
      pheromone: 20,
      day: 1,
      ants: { worker: 10, scout: 2, warrior: 4, tank: 2, nurse: 1 },
      rooms: { fungus: 2 }
    };
    const breakdown = getEconomyBreakdown(state, GAME_CONFIG);
    assertNotNull(breakdown);
    assertNotNull(breakdown.food);
    assertTrue(breakdown.food.income.total > 0);
    assertTrue(breakdown.food.expense.total > 0);
    assertNotNull(breakdown.pheromone);
    assertTrue(breakdown.pheromone.income.total >= 0);
  });
});

describe('game-ui.js — computeTabBadges (Badges de Navigation)', function() {
  it('doit signaler les actions en attente', function() {
    const state = {
      food: 500,
      pheromone: 100,
      rooms: { queen: 1 },
      mutations: {},
      raidWarning: true
    };
    const badges = computeTabBadges(state, GAME_CONFIG);
    assertNotNull(badges);
    assertTrue(badges.roomsCount >= 0);
    assertTrue(badges.mutationsCount >= 0);
  });
});

describe('game-ui.js — updateEvolutionUI (Résilience DOM)', function() {
  it('doit s’exécuter sans erreur même sans DOM (environnement Node)', function() {
    assertTrue(typeof updateEvolutionUI === 'function');
    // En environnement Node, document est undefined => sortie immédiate défensive
    updateEvolutionUI();
  });

  it('doit tester les fonctions UI et les contrôles avec mock DOM', function() {
    const createdEls = [];
    const elementsMap = new Map();
    function createMock(id = '') {
      const cls = new Set();
      const el = {
        id,
        className: '',
        textContent: '',
        innerHTML: '',
        style: {},
        dataset: {},
        classList: {
          add: (c) => cls.add(c),
          remove: (c) => cls.delete(c),
          toggle: (c, f) => (f ? cls.add(c) : cls.delete(c)),
          contains: (c) => cls.has(c)
        },
        querySelectorAll: () => [],
        querySelector: () => null,
        addEventListener: (ev, fn) => { el['on' + ev] = fn; },
        appendChild: (child) => createdEls.push(child),
        prepend: (child) => createdEls.unshift(child),
        removeChild: (child) => {}
      };
      return el;
    }

    const origDoc = globalThis.document;
    try {
      globalThis.document = {
        getElementById: (id) => {
          if (!elementsMap.has(id)) elementsMap.set(id, createMock(id));
          return elementsMap.get(id);
        },
        createElement: (tag) => createMock(tag),
        querySelectorAll: (sel) => [],
        addEventListener: () => {}
      };

      if (uiModule.switchSubtab) uiModule.switchSubtab('colony', 'nursery');
      if (uiModule.renderSubTabsBar) uiModule.renderSubTabsBar('colony');
      if (uiModule.setIncubationMultiplier) uiModule.setIncubationMultiplier(5);
      if (uiModule.initIncubationControls) uiModule.initIncubationControls();
      if (uiModule.initKeybindings) uiModule.initKeybindings();
      if (uiModule.logMessageKey) uiModule.logMessageKey('log.init', {}, 'birth');
      if (uiModule.updateIncubationQueueUI) uiModule.updateIncubationQueueUI();
      if (uiModule.updateExpeditionsUI) uiModule.updateExpeditionsUI({ id: 'summer' });
      if (uiModule.updateEventCardUI) uiModule.updateEventCardUI();
      if (uiModule.handleChooseEvent) uiModule.handleChooseEvent(0);
      if (uiModule.updateBattleReportUI) uiModule.updateBattleReportUI();
      if (uiModule.updateUI) uiModule.updateUI();
      if (uiModule.updateTabBadgesUI) uiModule.updateTabBadgesUI();
    } finally {
      globalThis.document = origDoc;
    }
  });
});
