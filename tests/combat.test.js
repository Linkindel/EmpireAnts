/**
 * Tests Unitaires & Intégration - combat.js (Lot 4)
 * Moteur de Combat Unifié, Factions & Contres Tactiques, Agrégateur de Modificateurs,
 * Événements à Choix & Jalon d'Équilibrage Mante Royale.
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
  require('../combat.js');
}

const combatModule = (typeof require === 'function') ? require('../combat.js') : (typeof window !== 'undefined' ? window : globalThis);
const configModule = (typeof require === 'function') ? require('../config.js') : (typeof window !== 'undefined' ? window : globalThis);
const { computeModifiers, resolveCombat, resolveEventChoice, getSeasonConfigPure } = combatModule;
const { GAME_CONFIG } = configModule;

describe('Combat Engine - computeModifiers (Agrégateur Unique)', function() {
  it('doit agréger correctement les valeurs par défaut sans bonus', function() {
    const baseState = {
      day: 1,
      ants: { worker: 6, scout: 2, warrior: 2, tank: 1, nurse: 0 },
      mutations: { mandibules: false, carapace: false, acide: false }
    };
    const mods = computeModifiers(baseState, GAME_CONFIG);
    assertNotNull(mods);
    assertEqual(mods.damageMultiplier, 1.0);
    assertEqual(mods.nurseCount, 0);
    assertEqual(mods.nurseIncubationBonus, 0);
    assertEqual(mods.queenHealRateBonus, 0);
    assertEqual(mods.fungusProductionMultiplier, 1.0);
    assertFalse(mods.acidUnlocked);
    assertFalse(mods.carapaceUnlocked);
  });

  it('doit appliquer les bonus progressifs de la caste nourrice (avec plafonnement)', function() {
    // 5 nourrices : +15% incubation, +0.20 PV/s reine, +25% champignons
    const state5 = {
      day: 1,
      ants: { nurse: 5 },
      mutations: {}
    };
    const mods5 = computeModifiers(state5, GAME_CONFIG);
    assertEqual(mods5.nurseCount, 5);
    assertTrue(Math.abs(mods5.nurseIncubationBonus - 0.15) < 0.001);
    assertTrue(Math.abs(mods5.queenHealRateBonus - 0.20) < 0.001);
    assertTrue(Math.abs(mods5.fungusProductionMultiplier - 1.25) < 0.001);

    // 30 nourrices : incubation plafonnée à 60%, champignons plafonnés à 100% (+1.0)
    const state30 = {
      day: 1,
      ants: { nurse: 30 },
      mutations: {}
    };
    const mods30 = computeModifiers(state30, GAME_CONFIG);
    assertEqual(mods30.nurseIncubationBonus, 0.60, 'Incubation plafonnée à +60%');
    assertEqual(mods30.fungusProductionMultiplier, 2.00, 'Fungus bonus plafonné à +100%');
    assertTrue(mods30.queenHealRateBonus > 1.0);
  });

  it('doit détecter les mutations actives dans computeModifiers', function() {
    const stateMuts = {
      day: 1,
      ants: { nurse: 0 },
      mutations: { mandibules: true, carapace: true, acide: true }
    };
    const mods = computeModifiers(stateMuts, GAME_CONFIG);
    assertEqual(mods.damageMultiplier, 1.30);
    assertTrue(mods.carapaceUnlocked);
    assertTrue(mods.acidUnlocked);
  });
});

describe('Combat Engine - resolveCombat (Moteur de Combat Unifié)', function() {
  it('doit calculer une victoire nette pour une force alliée supérieure', function() {
    const allies = { tank: 2, warrior: 4, scout: 2 };
    const enemy = { id: 'pucerons', difficulty: 50, lootFood: 100, lootPhero: 10 };
    const res = resolveCombat({
      allies,
      enemy,
      doctrine: 'balanced',
      rng: () => 0.5
    });

    assertTrue(res.victory, 'Les alliés doivent remporter le combat');
    assertTrue(res.alliedPower > 150);
    assertEqual(res.enemyPower, 50);
    assertEqual(res.losses.tank, 0);
    assertEqual(res.losses.warrior, 0);
    assertEqual(res.losses.scout, 0);
    assertEqual(res.loot.food, 100);
    assertEqual(res.loot.phero, 10);
  });

  it('doit infliger une défaite et des pertes lorsque l’ennemi est supérieur', function() {
    const allies = { tank: 0, warrior: 1, scout: 0 };
    const enemy = { id: 'boss', power: 300 };
    const res = resolveCombat({
      allies,
      enemy,
      doctrine: 'balanced',
      rng: () => 0.1 // Force le tirage de perte
    });

    assertFalse(res.victory, 'Défaite attendue face à un ennemi 10x plus puissant');
    assertTrue(res.losses.warrior >= 1, 'La guerrière doit être perdue');
    assertEqual(res.loot.food, 0);
  });

  it('doit appliquer le contre tactique contre les Fourmis de Feu (Tanks)', function() {
    const alliesWithoutTanks = { tank: 0, warrior: 3, scout: 0 };
    const alliesWithTanks = { tank: 2, warrior: 3, scout: 0 };
    const enemy = { id: 'fire_raid', power: 120, faction: 'fire_ants' };

    const resNoTank = resolveCombat({ allies: alliesWithoutTanks, enemy });
    const resWithTank = resolveCombat({ allies: alliesWithTanks, enemy });

    assertEqual(resNoTank.counterApplied, null);
    assertEqual(resWithTank.counterApplied, 'tank');
    assertEqual(resWithTank.counterDescKey, 'faction.fire_ants.counter');
    assertTrue(resWithTank.breakdown.counterBonus > 0, 'Les tanks doivent accorder un bonus de contre');
  });

  it('doit appliquer le contre tactique contre les Termites (Acide des Guerrières)', function() {
    const allies = { tank: 1, warrior: 3, scout: 0 };
    const enemy = { id: 'termites', power: 150, faction: 'termites' };

    // Sans acide
    const resStandard = resolveCombat({
      allies,
      enemy,
      doctrine: 'balanced',
      modifiers: { acidUnlocked: false, damageMultiplier: 1.0 }
    });
    assertEqual(resStandard.counterApplied, null);

    // Avec doctrine acide
    const resAcidDoctrine = resolveCombat({
      allies,
      enemy,
      doctrine: 'acid',
      modifiers: { acidUnlocked: false, damageMultiplier: 1.0 }
    });
    assertEqual(resAcidDoctrine.counterApplied, 'warrior_acid');
    assertTrue(resAcidDoctrine.breakdown.counterBonus > 0);

    // Avec mutation acide
    const resAcidMut = resolveCombat({
      allies,
      enemy,
      doctrine: 'balanced',
      modifiers: { acidUnlocked: true, damageMultiplier: 1.0 }
    });
    assertEqual(resAcidMut.counterApplied, 'warrior_acid');
    assertTrue(resAcidMut.breakdown.counterBonus > 0);
  });

  it('doit appliquer le contre tactique contre les Guêpes (Éclaireuses)', function() {
    const alliesWithoutScouts = { tank: 1, warrior: 2, scout: 0 };
    const alliesWithScouts = { tank: 1, warrior: 2, scout: 3 };
    const enemy = { id: 'wasp_ambush', power: 100, faction: 'wasps' };

    const resNoScout = resolveCombat({ allies: alliesWithoutScouts, enemy });
    const resWithScout = resolveCombat({ allies: alliesWithScouts, enemy });

    assertEqual(resNoScout.counterApplied, null);
    assertEqual(resWithScout.counterApplied, 'scout');
    assertTrue(resWithScout.breakdown.counterBonus > 0);
  });

  it('doit intégrer l’absorption de la barricade lors des combats défensifs', function() {
    const alliesNoBarricade = { tank: 1, warrior: 2, scout: 0, barricadeLvl: 0 };
    const alliesWithBarricade = { tank: 1, warrior: 2, scout: 0, barricadeLvl: 3 };
    const enemy = { id: 'raid', power: 120 };

    const res0 = resolveCombat({ allies: alliesNoBarricade, enemy });
    const res3 = resolveCombat({ allies: alliesWithBarricade, enemy });

    assertEqual(res0.breakdown.barricadeAbsorption, 0);
    assertEqual(res3.breakdown.barricadeAbsorption, 3 * 25);
    assertTrue(res3.alliedPower > res0.alliedPower);
  });

  it('doit attribuer le trophée unique lors de la défaite du Boss Mante Royale', function() {
    const army = { tank: 4, warrior: 8, scout: 3 };
    const mantis = {
      id: 'mantis_boss',
      isBoss: true,
      power: 380,
      trophyKey: 'trophy.mantis',
      lootFood: 1100,
      lootPhero: 180,
      bonusWorkers: 3
    };
    const res = resolveCombat({
      allies: army,
      enemy: mantis,
      doctrine: 'rush',
      modifiers: { damageMultiplier: 1.3, carapaceUnlocked: true, acidUnlocked: true }
    });

    assertTrue(res.victory, 'L\'armée de haut niveau doit battre la Mante');
    assertEqual(res.loot.trophy, 'trophy.mantis');
    assertEqual(res.loot.bonusWorkers, 3);
  });
});

describe('Choice Events - resolveEventChoice (Résolution des Événements à Choix)', function() {
  it('doit résoudre les choix de Sève Dorée (nourriture vs phéromones)', function() {
    const stateA = { food: 50, maxFood: 200, pheromone: 10, ants: { worker: 6 } };
    const resA = resolveEventChoice(stateA, 'golden_sap', 'choice_a', () => 0.9); // pas de perte
    assertTrue(resA.success);
    assertEqual(stateA.food, 50 + 90);
    assertEqual(resA.workersLost, 0);

    const stateB = { food: 50, maxFood: 200, pheromone: 10, ants: { worker: 6 } };
    const resB = resolveEventChoice(stateB, 'golden_sap', 'choice_b');
    assertTrue(resB.success);
    assertEqual(stateB.pheromone, 25);
  });

  it('doit résoudre le choix de l’Averse Diluvienne et du Coléoptère Invité', function() {
    const stateRain = { food: 80, maxFood: 300, pheromone: 10, ants: { worker: 5 } };
    const resRain = resolveEventChoice(stateRain, 'heavy_rain', 'choice_a');
    assertTrue(resRain.success);
    assertEqual(stateRain.food, 60); // coût de 20
    assertEqual(stateRain.pheromone, 20);

    const stateBeetle = { food: 100, maxFood: 300, pheromone: 10, ants: { worker: 5 } };
    const resBeetle = resolveEventChoice(stateBeetle, 'myrmecophile_beetle', 'choice_b');
    assertTrue(resBeetle.success);
    assertEqual(stateBeetle.food, 135);
  });

  it('doit résoudre le sauvetage des Éclaireuses Égarées', function() {
    const stateScouts = {
      food: 100,
      maxFood: 300,
      pheromone: 10,
      rooms: { dorm: 3 }, // pop cap = 45
      ants: { worker: 10, scout: 2, warrior: 2, tank: 1, nurse: 0 }
    };
    const resScouts = resolveEventChoice(stateScouts, 'lost_scouts', 'choice_a');
    assertTrue(resScouts.success);
    assertEqual(stateScouts.food, 70); // coût de 30
    assertEqual(stateScouts.ants.scout, 4, '+2 éclaireuses sauvées');
  });

  it('doit appliquer le choix par défaut à l’expiration ou sur identifiant inconnu', function() {
    const stateDef = { food: 20, maxFood: 200, pheromone: 0, ants: { worker: 5 } };
    const res = resolveEventChoice(stateDef, 'aphid_swarm', 'unknown_choice');
    assertTrue(res.success);
    assertTrue(stateDef.food > 20);
  });

  it('doit échouer proprement si l’événement n’existe pas', function() {
    const res = resolveEventChoice({}, 'non_existent_event');
    assertFalse(res.success);
    assertEqual(res.reason, 'event_not_found');
  });
});

describe('Jalon d\'Équilibrage I - Simulation Victoire Mante Royale', function() {
  it('doit vérifier qu\'une colonie active peut défaire la Mante en 25 à 60 minutes de jeu', function() {
    const target = GAME_CONFIG.BALANCE_TARGETS.mantisBossTargetMinutes;
    assertNotNull(target, 'BALANCE_TARGETS.mantisBossTargetMinutes doit exister');
    assertEqual(target.min, 25);
    assertEqual(target.max, 60);

    // Simulation mathématique de 35 minutes de jeu (soit Jour 35 in-game)
    // À ce stade, le joueur possède au moins Dortoirs niv 3 (pop cap 45), 3 tanks, 6 guerrières, 3 éclaireuses, 4 nourrices
    // et les 3 mutations génétiques
    const simulatedArmy = {
      tank: 3,
      warrior: 6,
      scout: 3,
      nurse: 4
    };
    const simulatedState = {
      day: 35,
      ants: simulatedArmy,
      mutations: { mandibules: true, carapace: true, acide: true },
      rooms: { queen: 3, granary: 3, dorm: 3, barricade: 2, fungus: 2 }
    };

    const mods = computeModifiers(simulatedState, GAME_CONFIG);
    const mantisBossCfg = GAME_CONFIG.MISSIONS.mantis_boss;

    const combatResult = resolveCombat({
      allies: simulatedArmy,
      enemy: mantisBossCfg,
      doctrine: 'acid',
      modifiers: mods,
      rng: () => 0.5
    });

    assertTrue(
      combatResult.alliedPower >= mantisBossCfg.difficulty,
      `La puissance alliée (${combatResult.alliedPower}) doit surclasser la Mante (${mantisBossCfg.difficulty}) au Jour 35`
    );
    assertTrue(combatResult.victory, 'La victoire sur la Mante Royale doit être validée');
  });
});
