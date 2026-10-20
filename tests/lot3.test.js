/**
 * Tests Unitaires & Intégration - Lot 3 : UX « Command Center », Socle Extensible,
 * Boussole d'Objectifs & Paysage Sonore Adaptatif WebAudio
 */

if (typeof describe === 'undefined' && typeof require === 'function') {
  const nodeTest = require('node:test');
  const assert = require('node:assert/strict');
  globalThis.describe = nodeTest.describe;
  globalThis.it = nodeTest.it;
  globalThis.assertNotNull = (val, msg) => assert.notEqual(val, null, msg);
  globalThis.assertEqual = (a, b, msg) => assert.equal(a, b, msg);
  globalThis.assertTrue = (val, msg) => assert.equal(Boolean(val), true, msg);
  globalThis.assertFalse = (val, msg) => assert.equal(Boolean(val), false, msg);
  require('../i18n.js');
  require('../config.js');
  require('../combat.js');
  require('../game-ui.js');
  require('../game.js');
  globalThis.window = globalThis.window || globalThis;
  globalThis.window.t = globalThis.t;
}

const UI = (typeof require === 'function') ? require('../game-ui.js') : globalThis;
const CFG = (typeof require === 'function') ? require('../config.js').GAME_CONFIG : globalThis.GAME_CONFIG;
const GAME = (typeof require === 'function') ? require('../game.js') : globalThis;

describe('Lot 3 - Formateur de Grands Nombres (formatLargeNumber)', function () {
  const fn = UI.formatLargeNumber;

  it('doit formater correctement 0 et les petits nombres', function () {
    assertEqual(fn(0, 'fr'), '0');
    assertEqual(fn(0, 'en'), '0');
    assertEqual(fn(42, 'fr'), '42');
    assertEqual(fn(120.4, 'fr'), '120,4');
    assertEqual(fn(120.4, 'en'), '120.4');
  });

  it('doit formater avec les suffixes compacts de K à Dc', function () {
    assertEqual(fn(1500, 'fr'), '1,5K');
    assertEqual(fn(1500, 'en'), '1.5K');
    assertEqual(fn(2500000, 'fr'), '2,5M');
    assertEqual(fn(1e9, 'fr'), '1B');
    assertEqual(fn(4.2e12, 'fr'), '4,2T');
    assertEqual(fn(7e15, 'en'), '7Qa');
    assertEqual(fn(9.5e18, 'en'), '9.5Qi');
    assertEqual(fn(3e21, 'fr'), '3Sx');
    assertEqual(fn(6e24, 'en'), '6Sp');
    assertEqual(fn(8e27, 'fr'), '8Oc');
    assertEqual(fn(5e30, 'en'), '5No');
    assertEqual(fn(2e33, 'fr'), '2Dc');
  });

  it('doit basculer en notation scientifique au-delà du seuil de suffixe (1e36)', function () {
    const bigNum = 1.25e38;
    const formattedFr = fn(bigNum, 'fr');
    const formattedEn = fn(bigNum, 'en');
    assertTrue(formattedFr.includes('1,25e38'), 'Notation scientifique FR attendue');
    assertTrue(formattedEn.includes('1.25e38'), 'Notation scientifique EN attendue');
  });

  it('doit gérer les très grands nombres jusqu à 10^100', function () {
    const huge = 5.67e99;
    const res = fn(huge, 'en');
    assertTrue(res.includes('5.67e99'), 'Doit supporter 10^99 sans plantage');
  });

  it('doit supporter le mode de notation scientifique explicite', function () {
    const res = fn(5000, 'fr', 'scientific');
    assertTrue(res.includes('5e3') || res.includes('5,00e3'), 'Mode scientifique pour 5000');
  });

  it('doit gérer les valeurs négatives', function () {
    assertEqual(fn(-45, 'fr'), '-45');
    assertEqual(fn(-1500, 'fr'), '-1,5K');
    assertEqual(fn(-2.5e6, 'en'), '-2.5M');
  });

  it('doit gérer défensivement NaN, null, undefined et Infinity', function () {
    assertEqual(fn(NaN, 'fr'), '0');
    assertEqual(fn(null, 'fr'), '0');
    assertEqual(fn(undefined, 'fr'), '0');
    assertEqual(fn('invalid', 'fr'), '0');
    assertEqual(fn(Infinity, 'fr'), 'Infini');
    assertEqual(fn(Infinity, 'en'), 'Infinity');
    assertEqual(fn(-Infinity, 'fr'), '-Infini');
    assertEqual(fn(-Infinity, 'en'), '-Infinity');
  });
});

describe('Lot 3 - Bilan Économique & ETA (getEconomyBreakdown)', function () {
  it('doit calculer les flux détaillés de revenus et de dépenses', function () {
    const state = {
      food: 80,
      maxFood: 200,
      pheromone: 10,
      ants: { worker: 8, scout: 2, warrior: 2, tank: 1, nurse: 1 },
      rooms: { fungus: 1, granary: 1, dorm: 1, queen: 1 },
      mutations: {}
    };

    const breakdown = UI.getEconomyBreakdown(state);
    assertNotNull(breakdown.food);
    assertNotNull(breakdown.food.income);
    assertNotNull(breakdown.food.expense);
    assertTrue(breakdown.food.income.total > 0, 'Revenus nourriture positifs');
    assertTrue(breakdown.food.expense.total > 0, 'Dépenses nourriture positives');
    assertTrue(Number.isFinite(breakdown.food.net), 'Solde net nourriture fini');

    assertNotNull(breakdown.pheromone);
    assertTrue(breakdown.pheromone.income.total > 0, 'Revenus phéromones positifs');
    assertEqual(breakdown.pheromone.net, breakdown.pheromone.income.total);
  });

  it('doit vérifier l assertion stricte breakdown.food.net === getNetFoodPerSec(state)', function () {
    const state = {
      food: 100,
      maxFood: 250,
      pheromone: 20,
      day: 5,
      ants: { worker: 10, scout: 3, warrior: 4, tank: 2, nurse: 2 },
      rooms: { fungus: 2, granary: 2, dorm: 2, queen: 1 },
      mutations: {}
    };

    const breakdown = UI.getEconomyBreakdown(state);
    const netFromGame = GAME.getNetFoodPerSec(state);
    const diff = Math.abs(breakdown.food.net - netFromGame);
    assertTrue(diff < 0.001, `Égalité stricte attendue: breakdown=${breakdown.food.net}, getNetFoodPerSec=${netFromGame}`);
  });

  it('doit calculer le prédicteur temporel ETA (timeToFull et timeToEmpty)', function () {
    // Cas 1 : flux positif avec place restante
    const posState = {
      food: 50,
      maxFood: 150,
      ants: { worker: 10, scout: 1, warrior: 0, tank: 0, nurse: 0 },
      rooms: { fungus: 0 },
      mutations: {}
    };
    const bdPos = UI.getEconomyBreakdown(posState);
    assertTrue(bdPos.food.net > 0, 'Flux positif attendu');
    assertNotNull(bdPos.food.timeToFull, 'timeToFull doit être calculé');
    assertTrue(bdPos.food.timeToFull > 0, 'Temps restant > 0');
    assertEqual(bdPos.food.timeToEmpty, null, 'timeToEmpty doit être nul en flux positif');

    // Cas 2 : flux négatif (consommation militaire sans ouvrières)
    const negState = {
      food: 60,
      maxFood: 150,
      ants: { worker: 0, scout: 0, warrior: 10, tank: 5, nurse: 0 },
      rooms: { fungus: 0 },
      mutations: {}
    };
    const bdNeg = UI.getEconomyBreakdown(negState);
    assertTrue(bdNeg.food.net < 0, 'Flux négatif attendu');
    assertEqual(bdNeg.food.timeToFull, null, 'timeToFull doit être nul en flux négatif');
    assertNotNull(bdNeg.food.timeToEmpty, 'timeToEmpty doit être calculé');
    assertTrue(bdNeg.food.timeToEmpty > 0, 'Temps avant famine > 0');
  });
});

describe('Lot 3 - Boussole d Objectifs Dynamique (getNextMilestoneGoal)', function () {
  it('doit retourner un objectif court terme et un défi majeur initialement non complétés', function () {
    const state = {
      food: 50,
      ants: { worker: 6, scout: 2, warrior: 2, tank: 1, nurse: 0 },
      rooms: { barricade: 0, fungus: 0 },
      bossesDefeated: { mantis: false },
      royalDna: 0
    };

    const goals = UI.getNextMilestoneGoal(state);
    assertNotNull(goals.shortTerm, 'Objectif court terme requis');
    assertNotNull(goals.major, 'Défi majeur requis');

    assertEqual(goals.shortTerm.id, 'first_ants');
    assertEqual(goals.shortTerm.progress, 11);
    assertEqual(goals.shortTerm.max, 15);
    assertEqual(goals.shortTerm.completed, false);

    assertEqual(goals.major.id, 'act1_boss');
    assertEqual(goals.major.completed, false);
  });

  it('doit avancer vers l objectif court terme suivant dès complétion', function () {
    // Avec 16 fourmis, first_ants (15) est validé, doit passer à upgrade_barricade
    const state = {
      food: 50,
      ants: { worker: 10, scout: 2, warrior: 3, tank: 1, nurse: 0 },
      rooms: { barricade: 0, fungus: 0 },
      bossesDefeated: { mantis: false },
      royalDna: 0
    };

    const goals = UI.getNextMilestoneGoal(state);
    assertEqual(goals.shortTerm.id, 'upgrade_barricade', 'Doit passer à upgrade_barricade');
    assertEqual(goals.shortTerm.progress, 0);
    assertEqual(goals.shortTerm.max, 2);
  });
});

describe('Lot 3 - Épinglage d Objectif (computeTargetEta)', function () {
  it('doit calculer l ETA pour une salle ou une caste', function () {
    const state = {
      food: 40,
      maxFood: 200,
      pheromone: 5,
      ants: { worker: 10, scout: 1, warrior: 0, tank: 0, nurse: 0 },
      rooms: { granary: 1, fungus: 0 },
      mutations: {}
    };

    // Coût fungus niveau 0 = baseCost (55)
    const targetRoom = { type: 'room', id: 'fungus' };
    const eta = UI.computeTargetEta(state, targetRoom);
    assertNotNull(eta);
    assertEqual(eta.cost, 55);
    assertEqual(eta.current, 40);
    assertEqual(eta.remaining, 15);
    assertFalse(eta.ready);
    assertTrue(eta.etaSeconds > 0 && Number.isFinite(eta.etaSeconds));
  });

  it('doit marquer ready: true lorsque les ressources sont déjà réunies', function () {
    const state = { food: 100, pheromone: 10, ants: { worker: 10 } };
    const target = { cost: 50, res: 'food' };
    const eta = UI.computeTargetEta(state, target);
    assertTrue(eta.ready);
    assertEqual(eta.remaining, 0);
    assertEqual(eta.etaSeconds, 0);
  });

  it('doit marquer unreachable: true lorsque le solde net est négatif ou nul', function () {
    const state = { food: 10, ants: { worker: 0, warrior: 10 } };
    const target = { cost: 100, res: 'food' };
    const eta = UI.computeTargetEta(state, target);
    assertTrue(eta.unreachable);
    assertEqual(eta.etaSeconds, Infinity);
  });
});

describe('Lot 3 - Badges de Notification (computeTabBadges)', function () {
  it('doit signaler lorsqu une salle est améliorable', function () {
    const richState = {
      food: 500,
      pheromone: 0,
      rooms: { queen: 1, granary: 1, dorm: 1, barricade: 0, fungus: 0 },
      mutations: {}
    };
    const badges = UI.computeTabBadges(richState);
    assertTrue(badges.colony, 'Badge colonie actif si salle améliorable');
    assertTrue(badges.rooms, 'Badge salles actif');

    const poorState = {
      food: 0,
      pheromone: 0,
      rooms: { queen: 1, granary: 1, dorm: 1, barricade: 0, fungus: 0 },
      mutations: {}
    };
    const poorBadges = UI.computeTabBadges(poorState);
    assertFalse(poorBadges.colony, 'Aucun badge si trop pauvre');
  });

  it('doit signaler un rapport de combat non lu', function () {
    const stateWithReport = {
      food: 0,
      pheromone: 0,
      lastBattleReport: { victory: true },
      lastBattleReportViewed: false
    };
    const badges = UI.computeTabBadges(stateWithReport);
    assertTrue(badges.army, 'Badge armée actif sur rapport non lu');
    assertTrue(badges.battle_report, 'Badge battle_report actif');
  });
});

describe('Lot 3 - Multiplicateur d Incubation (incubateAnt par lot)', function () {
  it('doit incuber par lots (x1, x5, max)', function () {
    GAME.gameState.food = 100;
    GAME.gameState.eggs = [];
    GAME.gameState.rooms.dorm = 2; // Capacité pop suffisante

    // Incubation x1
    GAME.incubateAnt('worker', 1);
    assertEqual(GAME.gameState.eggs.length, 1);
    assertEqual(GAME.gameState.food, 90);

    // Incubation x5
    GAME.incubateAnt('worker', 5);
    assertEqual(GAME.gameState.eggs.length, 6);
    assertEqual(GAME.gameState.food, 40);

    // Incubation max (avec 40 nourriture et coût 10 = 4 œufs max)
    GAME.incubateAnt('worker', 'max');
    assertEqual(GAME.gameState.eggs.length, 10);
    assertEqual(GAME.gameState.food, 0);
  });
});

describe('Lot 3 - Persistance Défensive & Migration de Schéma', function () {
  it('doit migrer défensivement une sauvegarde v2 ou v3 vers la version active', function () {
    const oldSave = {
      schemaVersion: 3,
      food: 80,
      pheromone: 15,
      ants: { worker: 6, scout: 2, warrior: 2, tank: 1, nurse: 1 },
      rooms: { queen: 1, granary: 1, dorm: 1 }
    };

    const sanitized = GAME.sanitizeGameState(oldSave, CFG.INITIAL_STATE);
    assertEqual(sanitized.schemaVersion, CFG.SCHEMA_VERSION, 'Doit être migré vers la version active');
    assertNotNull(sanitized.resources, 'Le registre resources doit être initialisé');
    assertEqual(sanitized.resources.food, 80);
    assertEqual(sanitized.resources.pheromone, 15);
    assertEqual(sanitized.incubationMultiplier, 1);
    assertEqual(sanitized.activeTab, 'colony');
    assertNotNull(sanitized.settings);
    assertTrue(sanitized.settings.screenShakeEnabled);
    assertEqual(sanitized.settings.numberNotation, 'standard');
    assertEqual(sanitized.pinnedTarget, null);
  });

  it('doit inclure les nouveaux champs dans buildSavePayload', function () {
    const payload = GAME.buildSavePayload(GAME.gameState);
    assertEqual(payload.schemaVersion, CFG.SCHEMA_VERSION);
    assertNotNull(payload.resources);
    assertNotNull(payload.incubationMultiplier);
    assertNotNull(payload.settings);
  });
});

describe('Lot 3 - Moteur Audio Procédural WebAudio', function () {
  it('doit invoquer playSfx sans lever d erreur avec randomFn injectable', function () {
    let played = false;
    UI.playSfx('click', { randomFn: () => 0.5, pitchJitter: 0.04 });
    UI.playSfx('upgrade', { randomFn: () => 0.5 });
    UI.playSfx('victory', { randomFn: () => 0.5 });
    UI.playSfx('raid_alert', { randomFn: () => 0.5 });
    played = true;
    assertTrue(played, 'playSfx s est exécuté avec succès');
  });

  it('doit gérer l ambiance et updateAmbientSoundscape sans exception', function () {
    UI.startUndergroundAmbience();
    UI.updateAmbientSoundscape({ soundEnabled: true, ambienceEnabled: true, day: 3 });
    UI.stopUndergroundAmbience();
    assertTrue(true, 'Ambiance gérée sans erreur');
  });
});

describe('Garde-fou Senior : Plafond Strict < 2000 Lignes par Fichier', function () {
  it('aucun fichier de code du projet ne doit jamais atteindre ou dépasser 2000 lignes', function () {
    const fs = require('node:fs');
    const path = require('node:path');

    const criticalFiles = [
      'config.js',
      'i18n.js',
      'combat.js',
      'evolution.js',
      'game-ui.js',
      'game.js',
      'renderer.js',
      'renderer-effects.js',
      'style.css'
    ];

    criticalFiles.forEach(file => {
      const filePath = path.resolve(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const lineCount = content.split('\n').length;
        assertTrue(
          lineCount < 2000,
          `Le fichier ${file} compte ${lineCount} lignes (doit rester < 2000 lignes)`
        );
      }
    });
  });
});
