/**
 * Tests Unitaires & Intégration - evolution.js (Lot 6)
 * Couverture complète du Moteur d'Évolution, Arbre Génétique à 3 Branches,
 * Système de Hauts Faits & Prestige 1 « Vol Nuptial » avec Planificateur Transparent.
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
  require('../evolution.js');
  require('../combat.js');
  require('../game.js');
}

const evoModule = (typeof require === 'function') ? require('../evolution.js') : (typeof window !== 'undefined' ? window : globalThis);
const configModule = (typeof require === 'function') ? require('../config.js') : (typeof window !== 'undefined' ? window : globalThis);
const combatModule = (typeof require === 'function') ? require('../combat.js') : (typeof window !== 'undefined' ? window : globalThis);
const gameModule = (typeof require === 'function') ? require('../game.js') : (typeof window !== 'undefined' ? window : globalThis);

const {
  getTotalAnts,
  getTotalRoomLevels,
  formatNumberCompact,
  canUnlockMutation,
  unlockMutationPure,
  evaluateAchievements,
  canTriggerNuptialFlight,
  computeRoyalDnaGain,
  getNuptialFlightPreview,
  executeNuptialFlightPure
} = evoModule;

const { GAME_CONFIG } = configModule;
const { computeModifiers } = combatModule;
const { sanitizeGameState, createFreshGameState } = gameModule;

describe('Lot 6 — Utilitaires Purs & Programmation Défensive', function() {
  it('doit calculer la population totale avec résilience aux entrées invalides', function() {
    assertEqual(getTotalAnts(null), 0);
    assertEqual(getTotalAnts({}), 0);
    assertEqual(getTotalAnts({ ants: null }), 0);
    assertEqual(getTotalAnts({ ants: { worker: -5, scout: NaN, warrior: 10, tank: '5', nurse: 3 } }), 18);
  });

  it('doit calculer les niveaux de salles avec résilience', function() {
    assertEqual(getTotalRoomLevels(null), 0);
    assertEqual(getTotalRoomLevels({}), 0);
    assertEqual(getTotalRoomLevels({ rooms: { queen: 3, granary: 2, dorm: -1, fungus: NaN } }), 5);
  });

  it('doit formater les grands nombres de façon compacte', function() {
    assertEqual(formatNumberCompact(null), '0');
    assertEqual(formatNumberCompact(NaN), '0');
    assertEqual(formatNumberCompact(Infinity), '0');
    assertEqual(formatNumberCompact(0), '0');
    assertEqual(formatNumberCompact(42), '42');
    assertEqual(formatNumberCompact(42.5), '42.5');
    assertEqual(formatNumberCompact(1500), '1.5K');
    assertEqual(formatNumberCompact(2000000), '2M');
    assertEqual(formatNumberCompact(-2500), '-2.5K');
  });
});

describe('Lot 6 — Arbre Génétique à 3 Branches (canUnlockMutation & unlockMutationPure)', function() {
  let baseState;

  beforeEach(() => {
    baseState = {
      food: 100,
      pheromone: 100,
      mutations: {},
      stats: { totalMutationsUnlocked: 0 }
    };
  });

  it('doit rejeter une mutation inconnue ou invalide', function() {
    const res = canUnlockMutation('mutation_inconnue', baseState, GAME_CONFIG);
    assertFalse(res.canUnlock);
    assertEqual(res.reason, 'INVALID_MUTATION');
  });

  it('doit rejeter une mutation déjà débloquée', function() {
    baseState.mutations.mandibules = true;
    const res = canUnlockMutation('mandibules', baseState, GAME_CONFIG);
    assertFalse(res.canUnlock);
    assertEqual(res.reason, 'ALREADY_UNLOCKED');
  });

  it('doit rejeter si le prérequis de branche n’est pas satisfait', function() {
    // Carapace requiert mandibules
    const resCarapace = canUnlockMutation('carapace', baseState, GAME_CONFIG);
    assertFalse(resCarapace.canUnlock);
    assertEqual(resCarapace.reason, 'MISSING_PREREQUISITE');
    assertEqual(resCarapace.requiresKey, 'mandibules');

    // Royal Exo requiert acide
    const resExo = canUnlockMutation('royal_exo', baseState, GAME_CONFIG);
    assertFalse(resExo.canUnlock);
    assertEqual(resExo.requiresKey, 'acide');

    // Mycology requiert trophallaxis
    const resMyco = canUnlockMutation('mycology', baseState, GAME_CONFIG);
    assertFalse(resMyco.canUnlock);
    assertEqual(resMyco.requiresKey, 'trophallaxis');

    // Thermal Brood requiert antennae
    const resBrood = canUnlockMutation('thermal_brood', baseState, GAME_CONFIG);
    assertFalse(resBrood.canUnlock);
    assertEqual(resBrood.requiresKey, 'antennae');
  });

  it('doit rejeter si les phéromones sont insuffisantes', function() {
    baseState.pheromone = 10; // mandibules coûte 25
    const res = canUnlockMutation('mandibules', baseState, GAME_CONFIG);
    assertFalse(res.canUnlock);
    assertEqual(res.reason, 'INSUFFICIENT_PHEROMONE');
  });

  it('doit valider et débloquer une mutation purement sans muter l’état original', function() {
    const res = unlockMutationPure('mandibules', baseState, GAME_CONFIG);
    assertTrue(res.success);
    assertEqual(res.reason, 'OK');
    assertNotNull(res.unlockedMutation);

    // L'état original reste intact
    assertEqual(baseState.pheromone, 100);
    assertFalse(baseState.mutations.mandibules);

    // Le nouvel état a consommé les phéromones et débloqué la mutation
    assertEqual(res.nextState.pheromone, 75);
    assertTrue(res.nextState.mutations.mandibules);
    assertEqual(res.nextState.stats.totalMutationsUnlocked, 1);
  });

  it('doit permettre de débloquer une chaîne complète de Tier 1 à Tier 3', function() {
    baseState.pheromone = 300;
    const res1 = unlockMutationPure('mandibules', baseState, GAME_CONFIG);
    assertTrue(res1.success);

    const res2 = unlockMutationPure('carapace', res1.nextState, GAME_CONFIG);
    assertTrue(res2.success);

    const res3 = unlockMutationPure('acide', res2.nextState, GAME_CONFIG);
    assertTrue(res3.success);

    const res4 = unlockMutationPure('royal_exo', res3.nextState, GAME_CONFIG);
    assertTrue(res4.success);
    assertTrue(res4.nextState.mutations.royal_exo);
    assertEqual(res4.nextState.stats.totalMutationsUnlocked, 4);
  });
});

describe('Lot 6 — Système de Hauts Faits (evaluateAchievements)', function() {
  it('doit évaluer les hauts faits et attribuer les récompenses', function() {
    const state = {
      food: 500, // food_hoarder (>= 400)
      pheromone: 20,
      ants: { worker: 30, scout: 10, warrior: 10, tank: 5, nurse: 0 }, // prosperous_colony (55 >= 50)
      rooms: { queen: 3, granary: 3, dorm: 3 }, // grand_architect
      mutations: { mandibules: true, carapace: true, acide: true }, // genetic_pioneer (>= 3)
      stats: {
        totalAntsHatched: 1, // first_hatch
        totalRaidsDefeated: 3, // impenetrable_wall
        winterSurvived: 1, // winter_survivor
        totalPheromonesEarned: 150 // pheromone_master
      },
      bossesDefeated: { mantis: true }, // mantis_slayer
      achievements: {}
    };

    const evalRes = evaluateAchievements(state, GAME_CONFIG);
    assertNotNull(evalRes);
    assertTrue(evalRes.newlyUnlocked.length >= 8);
    assertTrue(evalRes.totalRewardsPheromone > 0);
    assertTrue(evalRes.unlockedKeys.includes('first_hatch'));
    assertTrue(evalRes.unlockedKeys.includes('prosperous_colony'));
    assertTrue(evalRes.unlockedKeys.includes('grand_architect'));
    assertTrue(evalRes.unlockedKeys.includes('impenetrable_wall'));
    assertTrue(evalRes.unlockedKeys.includes('winter_survivor'));
    assertTrue(evalRes.unlockedKeys.includes('mantis_slayer'));
    assertTrue(evalRes.unlockedKeys.includes('genetic_pioneer'));
    assertTrue(evalRes.unlockedKeys.includes('food_hoarder'));
  });

  it('ne doit pas récompenser deux fois un haut fait déjà débloqué', function() {
    const state = {
      stats: { totalAntsHatched: 10 },
      achievements: { first_hatch: true }
    };
    const evalRes = evaluateAchievements(state, GAME_CONFIG);
    assertTrue(evalRes.unlockedKeys.includes('first_hatch'));
    assertEqual(evalRes.newlyUnlocked.length, 0);
    assertEqual(evalRes.totalRewardsPheromone, 0);
  });
});

describe('Lot 6 — Prestige 1 : Vol Nuptial & Planificateur Transparent', function() {
  let readyState;

  beforeEach(() => {
    readyState = {
      day: 15,
      food: 300,
      pheromone: 80,
      ants: { worker: 30, scout: 10, warrior: 10, tank: 5, nurse: 0 }, // Pop = 55 (>= 50)
      rooms: { queen: 5, granary: 4, dorm: 4, barricade: 2, fungus: 3 }, // Queen = 5 (>= 5)
      mutations: { mandibules: true, carapace: true },
      stats: {
        totalAntsHatched: 60,
        totalRaidsDefeated: 2,
        totalBossesDefeated: 0,
        totalDaysSurvived: 15,
        totalFoodHarvested: 1200,
        totalPheromonesEarned: 160,
        totalMutationsUnlocked: 2,
        winterSurvived: 1,
        highestPopReached: 55,
        prestigesCount: 0,
        totalRoyalDnaEarned: 0
      },
      bossesDefeated: { mantis: true },
      achievements: { first_hatch: true, prosperous_colony: true },
      royalDna: 0,
      lang: 'fr',
      soundEnabled: true
    };
  });

  it('doit refuser le vol nuptial si la Reine ou la population est insuffisante', function() {
    // Reine insuffisante
    const unreadyQueen = JSON.parse(JSON.stringify(readyState));
    unreadyQueen.rooms.queen = 4;
    const check1 = canTriggerNuptialFlight(unreadyQueen, GAME_CONFIG);
    assertFalse(check1.canTrigger);
    assertEqual(computeRoyalDnaGain(unreadyQueen, GAME_CONFIG), 0);

    // Population insuffisante
    const unreadyPop = JSON.parse(JSON.stringify(readyState));
    unreadyPop.ants = { worker: 20, scout: 5, warrior: 5, tank: 0, nurse: 0 }; // Pop = 30
    const check2 = canTriggerNuptialFlight(unreadyPop, GAME_CONFIG);
    assertFalse(check2.canTrigger);
    assertEqual(computeRoyalDnaGain(unreadyPop, GAME_CONFIG), 0);
  });

  it('doit autoriser le vol nuptial quand les conditions sont réunies et calculer l’ADN Royal', function() {
    const check = canTriggerNuptialFlight(readyState, GAME_CONFIG);
    assertTrue(check.canTrigger);
    assertEqual(check.currentQueenLevel, 5);
    assertEqual(check.currentPop, 55);

    const gain = computeRoyalDnaGain(readyState, GAME_CONFIG);
    assertTrue(gain >= 15, 'Gain d’ADN Royal substantiel');
  });

  it('doit fournir une prévisualisation transparente (getNuptialFlightPreview) avec prochain palier rentable', function() {
    const preview = getNuptialFlightPreview(readyState, GAME_CONFIG);
    assertTrue(preview.canTrigger);
    assertTrue(preview.gainedDna >= 15);
    assertNotNull(preview.breakdown);
    assertTrue(preview.breakdown.population.points > 0);
    assertTrue(preview.breakdown.rooms.points > 0);
    assertTrue(preview.breakdown.pheromones.points > 0);
    assertTrue(preview.breakdown.boss.mantisDefeated);
    assertEqual(preview.breakdown.achievements.count, 2);

    // Prochain palier rentable
    assertNotNull(preview.nextBreakpoint);
    assertTrue(preview.nextBreakpoint.missingAmount > 0);
    assertTrue(preview.nextBonusPercent > preview.currentBonusPercent);
  });

  it('doit exécuter purement le vol nuptial en préservant la méta-progression', function() {
    const res = executeNuptialFlightPure(readyState, GAME_CONFIG);
    assertTrue(res.success);
    assertEqual(res.reason, 'OK');
    assertTrue(res.gainedDna >= 15);
    assertEqual(res.totalRoyalDna, res.gainedDna);

    const next = res.nextState;
    // Réinitialisation des ressources et salles
    assertEqual(next.rooms.queen, 1);
    assertEqual(next.rooms.granary, 1);
    assertEqual(next.ants.worker, 6);

    // Méta-progression préservée
    assertEqual(next.royalDna, res.gainedDna);
    assertTrue(next.achievements.first_hatch);
    assertTrue(next.achievements.prosperous_colony);
    assertTrue(next.achievements.dynasty_founder, 'Haut fait fondateur de dynastie accordé');

    // Statistiques historiques incrémentées
    assertEqual(next.stats.prestigesCount, 1);
    assertEqual(next.stats.totalRoyalDnaEarned, res.gainedDna);
    assertEqual(next.stats.totalBossesDefeated, 1);
    assertEqual(next.stats.highestPopReached, 55);

    // Préférences utilisateur préservées
    assertEqual(next.lang, 'fr');
    assertTrue(next.soundEnabled);
  });
});

describe('Lot 6 — Intégration Combat & Modificateurs d’ADN Royal (computeModifiers)', function() {
  it('doit appliquer le bonus permanent d’ADN Royal sur les modificateurs de combat', function() {
    const stateNoDna = {
      royalDna: 0,
      ants: { worker: 6, scout: 2, warrior: 2, tank: 1, nurse: 0 },
      mutations: {}
    };
    const modsNoDna = computeModifiers(stateNoDna, GAME_CONFIG);
    assertEqual(modsNoDna.royalDnaBonusPercent, 0);

    const stateWithDna = {
      royalDna: 10, // 10 * 5% = +50%
      ants: { worker: 6, scout: 2, warrior: 2, tank: 1, nurse: 0 },
      mutations: {}
    };
    const modsWithDna = computeModifiers(stateWithDna, GAME_CONFIG);
    assertEqual(modsWithDna.royalDnaBonusPercent, 0.50);
    assertEqual(modsWithDna.royalDnaMultiplier, 1.50);
  });

  it('doit intégrer les 9 mutations dans les modificateurs globaux', function() {
    const stateAllMuts = {
      royalDna: 4,
      ants: { warrior: 4, tank: 2 },
      mutations: {
        mandibules: true,
        carapace: true,
        acide: true,
        royal_exo: true,
        trophallaxis: true,
        mycology: true,
        preservation: true,
        antennae: true,
        thermal_brood: true,
        imperial_fervor: true
      }
    };
    const mods = computeModifiers(stateAllMuts, GAME_CONFIG);
    assertTrue(mods.mandibulesUnlocked);
    assertTrue(mods.carapaceUnlocked);
    assertTrue(mods.acidUnlocked);
    assertTrue(mods.royalExoUnlocked);
    assertTrue(mods.damageMultiplier >= 1.30);
    assertTrue(mods.queenHpBonus >= 50);
  });
});

describe('Lot 6 — Robustesse de Sauvegarde Défensive & Rétrocompatibilité', function() {
  it('doit assainir une ancienne sauvegarde sans écraser ni crasher (Schema Versioning)', function() {
    // Ancienne sauvegarde v2 ou v3 sans royalDna ni stats
    const oldSave = {
      schemaVersion: 2,
      food: 150,
      pheromone: 10,
      ants: { worker: 8 }
    };
    const sanitized = sanitizeGameState(oldSave, GAME_CONFIG);
    assertNotNull(sanitized);
    assertEqual(sanitized.royalDna, 0);
    assertNotNull(sanitized.stats);
    assertEqual(sanitized.stats.totalAntsHatched, 0);
    assertNotNull(sanitized.achievements);
    assertEqual(sanitized.mutations.mandibules, false);
    assertEqual(sanitized.mutations.royal_exo, false);
  });
});
