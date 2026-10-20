/**
 * Tests Unitaires & Intégration - game-world.js (Lot 7)
 * Couverture complète de l'Exploration Infinie :
 * Anneaux de surface (1 -> ∞), Abîmes géothermiques, Ponts Vivants,
 * Scaling Adaptatif Super-Exponentiel (Tier Gates),
 * Ambre 🟠, Reliques Ancestrales persistantes au Vol Nuptial & Forage.
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
  require('../game-world.js');
  require('../combat.js');
  require('../evolution.js');
  require('../game-ui.js');
  require('../renderer-effects.js');
  require('../game.js');
}

const worldModule = (typeof require === 'function') ? require('../game-world.js') : (typeof window !== 'undefined' ? window : globalThis);
const configModule = (typeof require === 'function') ? require('../config.js') : (typeof window !== 'undefined' ? window : globalThis);
const combatModule = (typeof require === 'function') ? require('../combat.js') : (typeof window !== 'undefined' ? window : globalThis);
const evoModule = (typeof require === 'function') ? require('../evolution.js') : (typeof window !== 'undefined' ? window : globalThis);
const uiModule = (typeof require === 'function') ? require('../game-ui.js') : (typeof window !== 'undefined' ? window : globalThis);
const effectsModule = (typeof require === 'function') ? require('../renderer-effects.js') : (typeof window !== 'undefined' ? window : globalThis);
const gameModule = (typeof require === 'function') ? require('../game.js') : (typeof window !== 'undefined' ? window : globalThis);

const {
  EXPLORATION_DEFAULTS,
  computeTierGateMultiplier,
  computeZoneDifficulty,
  computeZoneLoot,
  generateZone,
  formLivingBridge,
  releaseLivingBridge,
  computeRelicCost,
  upgradeRelicPure,
  computeRelicModifiers,
  drillStratumPure,
  formLivingBridgeAction,
  releaseLivingBridgeAction,
  drillStratumAction,
  upgradeRelicAction
} = worldModule;

const { GAME_CONFIG } = configModule;
const { computeModifiers, resolveCombat } = combatModule;
const { executeNuptialFlightPure } = evoModule;
const { updateExplorationUI } = uiModule;
const { drawLivingBridgeEffect, drawAbyssShaftDetails } = effectsModule;
const { sanitizeGameState, createFreshGameState } = gameModule;

describe('Lot 7 — Scaling Adaptatif & Tier Gates Super-Exponentiels', function () {
  it('doit calculer les multiplicateurs de paliers (Tier Gates) de façon stable jusqu au niveau 1000', function () {
    assertEqual(computeTierGateMultiplier(0), 1.0);
    assertEqual(computeTierGateMultiplier(1), 1.0);
    assertEqual(computeTierGateMultiplier(5), 1.0);
    // Au niveau 6, 1er palier franchi : 1.6^1 = 1.6
    assertEqual(Math.round(computeTierGateMultiplier(6) * 100) / 100, 1.6);
    // Au niveau 11, 2e palier franchi : 1.6^2 = 2.56
    assertEqual(Math.round(computeTierGateMultiplier(11) * 100) / 100, 2.56);
    // Au niveau 16, 3e palier franchi : 1.6^3 = 4.096
    assertEqual(Math.round(computeTierGateMultiplier(16) * 1000) / 1000, 4.096);

    // Test au niveau 1000 : pas de NaN, nombre fini positif
    const lvl1000Mult = computeTierGateMultiplier(1000);
    assertTrue(Number.isFinite(lvl1000Mult));
    assertTrue(lvl1000Mult > 1e10);
  });

  it('doit prouver la difficulté super-exponentielle aux paliers 5, 10, 15 et le ratio gain/difficulté décroissant', function () {
    const diff1 = computeZoneDifficulty(1, false);
    const diff5 = computeZoneDifficulty(5, false);
    const diff10 = computeZoneDifficulty(10, false);
    const diff15 = computeZoneDifficulty(15, false);

    assertTrue(diff1 > 0);
    assertTrue(diff5 > diff1);
    assertTrue(diff10 > diff5);
    assertTrue(diff15 > diff10);

    // Comparaison avec une croissance linéaire pure (15/5 = 3 vs diff15/diff5 ~ 23.8)
    const linearRatio = 15 / 5;
    const diffRatio = diff15 / diff5;
    assertTrue(diffRatio > linearRatio * 5, 'La difficulté doit exploser super-exponentiellement');

    // Vérification du ratio gain / difficulté < 1 (contraignant aux synergies et reliques)
    const loot1 = computeZoneLoot(1, false);
    const loot10 = computeZoneLoot(10, false);
    const lootGrowth = loot10.food / loot1.food;
    const diffGrowth = diff10 / diff1;
    assertTrue(lootGrowth < diffGrowth, 'Le loot doit croître moins vite que la difficulté');

    // Les Gardiens doivent posséder une difficulté supérieure et rapporter de l Ambre
    const normalDiff = computeZoneDifficulty(5, false);
    const bossDiff = computeZoneDifficulty(5, true);
    assertTrue(bossDiff > normalDiff * 1.4);

    const bossLoot = computeZoneLoot(5, true);
    assertTrue(bossLoot.amber > 0, 'Le boss doit obligatoirement rapporter de l Ambre');
  });
});

describe('Lot 7 — Générateur Procédural Unique (generateZone)', function () {
  it('doit assurer la rétrocompatibilité parfaite de l Anneau 1 avec les 5 missions de base', function () {
    const ring1 = generateZone({ axis: 'ring', level: 1 });
    assertEqual(ring1.axis, 'ring');
    assertEqual(ring1.level, 1);
    assertEqual(ring1.sectors.length, 4);
    assertEqual(ring1.sectors[0].id, 'pucerons');
    assertEqual(ring1.sectors[3].id, 'termites_bastion');
    assertNotNull(ring1.guardian);
    assertEqual(ring1.guardian.id, 'mantis_boss');
    assertTrue(ring1.guardian.isBoss);
  });

  it('doit générer les secteurs procéduraux et le Gardien pour les Anneaux >= 2', function () {
    const ring3 = generateZone({ axis: 'ring', level: 3, seed: 42 });
    assertEqual(ring3.axis, 'ring');
    assertEqual(ring3.level, 3);
    assertEqual(ring3.sectors.length, 4);
    assertTrue(ring3.sectors[0].difficulty > 0);
    assertNotNull(ring3.guardian);
    assertTrue(ring3.guardian.difficulty > ring3.sectors[3].difficulty);
    assertTrue(ring3.guardian.loot.amber > 0);
  });

  it('doit être strictement déterministe (même niveau + même seed = résultat identique)', function () {
    const genA = generateZone({ axis: 'ring', level: 12, seed: 9876 });
    const genB = generateZone({ axis: 'ring', level: 12, seed: 9876 });
    assertEqual(JSON.stringify(genA), JSON.stringify(genB));

    const stratA = generateZone({ axis: 'stratum', level: 17, seed: 5432 });
    const stratB = generateZone({ axis: 'stratum', level: 17, seed: 5432 });
    assertEqual(JSON.stringify(stratA), JSON.stringify(stratB));
  });

  it('doit générer correctement les Strates des Abîmes, minéraux, aléas et gardiens de palier', function () {
    // Strate 2 : pas d'aléa (niveau < 3), minéral silex
    const st2 = generateZone({ axis: 'stratum', level: 2 });
    assertEqual(st2.axis, 'stratum');
    assertEqual(st2.mineral, 'flint');
    assertEqual(st2.hazard, null);
    assertEqual(st2.isGuardian, false);

    // Strate 5 : Gardien Scolopendre des Failles
    const st5 = generateZone({ axis: 'stratum', level: 5 });
    assertTrue(st5.isGuardian);
    assertNotNull(st5.guardian);
    assertEqual(st5.guardian.id, 'abyss_guardian_5');
    assertTrue(st5.loot.amber >= 8);

    // Strate 12 : Minéral obsidienne, aléa actif
    const st12 = generateZone({ axis: 'stratum', level: 12, seed: 1 });
    assertEqual(st12.mineral, 'obsidian');
    assertNotNull(st12.hazard);
  });
});

describe('Lot 7 — Ponts Vivants d Ouvrières (Living Bridges)', function () {
  it('doit mobiliser 5 ouvrières pour former le pont et refuser si effectif insuffisant', function () {
    const statePoor = {
      ants: { worker: 3 },
      exploration: { livingBridges: { surfaceHarvest: false, activeBridgeWorkers: 0 } }
    };
    const resFail = formLivingBridge(statePoor, 'surface');
    assertFalse(resFail.success);
    assertEqual(resFail.reason, 'INSUFFICIENT_WORKERS');

    const stateRich = {
      ants: { worker: 10 },
      exploration: { livingBridges: { surfaceHarvest: false, activeBridgeWorkers: 0 } }
    };
    const resOk = formLivingBridge(stateRich, 'surface');
    assertTrue(resOk.success);
    assertTrue(resOk.nextState.exploration.livingBridges.surfaceHarvest);
    assertEqual(resOk.nextState.exploration.livingBridges.activeBridgeWorkers, 5);

    // Tentative de re-déploiement alors que déjà actif
    const resDouble = formLivingBridge(resOk.nextState, 'surface');
    assertFalse(resDouble.success);
    assertEqual(resDouble.reason, 'ALREADY_ACTIVE');
  });

  it('doit libérer les ouvrières lors de la dissolution du pont', function () {
    const activeState = {
      ants: { worker: 10 },
      exploration: { livingBridges: { surfaceHarvest: true, activeBridgeWorkers: 5 } }
    };
    const resRel = releaseLivingBridge(activeState, 'surface');
    assertTrue(resRel.success);
    assertFalse(resRel.nextState.exploration.livingBridges.surfaceHarvest);
    assertEqual(resRel.nextState.exploration.livingBridges.activeBridgeWorkers, 0);

    // Tentative de libération alors qu'aucun pont n'est actif
    const resRelAgain = releaseLivingBridge(resRel.nextState, 'surface');
    assertFalse(resRelAgain.success);
  });

  it('doit appliquer le bonus de récolte de +25% dans computeRelicModifiers', function () {
    const sInactive = { exploration: { livingBridges: { surfaceHarvest: false } } };
    const modsInactive = computeRelicModifiers(sInactive);
    assertEqual(modsInactive.livingBridgeActive, false);
    assertEqual(modsInactive.livingBridgeHarvestBonus, 0);

    const sActive = { exploration: { livingBridges: { surfaceHarvest: true } } };
    const modsActive = computeRelicModifiers(sActive);
    assertEqual(modsActive.livingBridgeActive, true);
    assertEqual(modsActive.livingBridgeHarvestBonus, 0.25);
  });
});

describe('Lot 7 — Ambre 🟠 & Reliques Ancestrales Méta-Persistantes', function () {
  it('doit calculer le coût exponentiel en Ambre (baseCost * 1.6^lvl)', function () {
    const c0 = computeRelicCost('queen_amber', 0);
    assertEqual(c0, 15);
    const c1 = computeRelicCost('queen_amber', 1);
    assertEqual(c1, Math.round(15 * 1.6));
    const c2 = computeRelicCost('queen_amber', 2);
    assertEqual(c2, Math.round(15 * 1.6 * 1.6));

    // Relique inconnue
    assertEqual(computeRelicCost('unknown_relic', 0), Infinity);
  });

  it('doit améliorer une relique en déduisant l Ambre et refuser si insuffisant', function () {
    const state = {
      resources: { amber: 10 },
      amber: 10,
      exploration: { relics: { queen_amber: 0 } }
    };
    // Coût niveau 0 = 15 Ambre, on a 10 -> échec
    const resFail = upgradeRelicPure(state, 'queen_amber');
    assertFalse(resFail.success);
    assertEqual(resFail.reason, 'INSUFFICIENT_AMBER');

    // On donne 20 Ambre -> succès
    state.resources.amber = 20;
    state.amber = 20;
    const resOk = upgradeRelicPure(state, 'queen_amber');
    assertTrue(resOk.success);
    assertEqual(resOk.newLevel, 1);
    assertEqual(resOk.nextState.exploration.relics.queen_amber, 1);
    assertEqual(resOk.nextState.resources.amber, 5);
  });

  it('doit calculer tous les bonus de reliques et chaleur géothermique dans computeRelicModifiers', function () {
    const state = {
      exploration: {
        abyssDepth: 10,
        relics: {
          queen_amber: 2,
          fossil_mandible: 3,
          eternal_spore: 1,
          solar_sap: 2
        }
      }
    };
    const mods = computeRelicModifiers(state);

    // Reine : +25 PV et +0.10 regen par niveau
    assertEqual(mods.queenHpBonus, 50);
    assertEqual(Math.round(mods.queenHealBonus * 100) / 100, 0.20);

    // Militaire : +8% par niveau (3 * 0.08 = +24%)
    assertEqual(Math.round(mods.militaryPowerMultiplier * 100) / 100, 1.24);

    // Champignons : +15% par niveau
    assertEqual(Math.round(mods.fungusMultiplier * 100) / 100, 1.15);
    assertEqual(Math.round(mods.compostYieldBonus * 100) / 100, 0.10);

    // Incubation & Hiver : +10% incubation, +15% hiver par niveau
    assertEqual(Math.round(mods.incubationSpeedMultiplier * 100) / 100, 1.20);
    assertEqual(Math.round(mods.winterWorkerFoodBonus * 100) / 100, 0.30);

    // Chaleur géothermique : 10 strates * 2% = +20% d'atténuation hivernale
    assertEqual(Math.round(mods.geothermalMitigation * 100) / 100, 0.20);
  });

  it('doit injecter les bonus de reliques dans le calcul de combat (computeModifiers)', function () {
    const state = {
      queenHealth: 100,
      ants: { worker: 10, scout: 2, warrior: 5, tank: 2, nurse: 1 },
      mutations: {},
      exploration: {
        relics: {
          queen_amber: 1,
          fossil_mandible: 2
        }
      }
    };
    const mods = computeModifiers(state);
    assertTrue(mods.damageMultiplier >= 1.16, 'Le bonus de Mandibule Fossile (+16%) doit être inclus dans damageMultiplier');
    assertEqual(mods.queenHpBonus, 25, 'Le bonus d Ambre de la Reine (+25 PV) doit être inclus dans queenHpBonus');
  });

  it('doit préserver intégralement l Ambre et les niveaux de reliques lors du Vol Nuptial', function () {
    const preFlightState = {
      royalDna: 5,
      food: 500,
      pheromone: 200,
      resources: { food: 500, pheromone: 200, amber: 85 },
      amber: 85,
      rooms: { queen: 5, granary: 3, dorm: 2 },
      ants: { worker: 60, warrior: 10 },
      exploration: {
        currentRing: 4,
        abyssDepth: 8,
        relics: {
          queen_amber: 2,
          fossil_mandible: 3,
          eternal_spore: 1,
          solar_sap: 1
        }
      }
    };

    const postFlight = executeNuptialFlightPure(preFlightState);
    assertTrue(postFlight.success);
    // Vérification de la conservation d'Ambre
    assertEqual(postFlight.nextState.resources.amber, 85, 'L Ambre doit être conservé');
    assertEqual(postFlight.nextState.amber, 85);

    // Vérification de la conservation des Reliques
    assertEqual(postFlight.nextState.exploration.relics.queen_amber, 2);
    assertEqual(postFlight.nextState.exploration.relics.fossil_mandible, 3);
    assertEqual(postFlight.nextState.exploration.relics.eternal_spore, 1);
    assertEqual(postFlight.nextState.exploration.relics.solar_sap, 1);
  });
});

describe('Lot 7 — Forage des Abîmes (drillStratumPure)', function () {
  it('doit forer la strate suivante et incrémenter la profondeur', function () {
    const state = {
      resources: { amber: 0 },
      exploration: { abyssDepth: 2, maxAbyssDepth: 2 }
    };
    const res = drillStratumPure(state);
    assertTrue(res.success);
    assertEqual(res.nextState.exploration.abyssDepth, 3);
    assertEqual(res.nextState.exploration.maxAbyssDepth, 3);
    assertEqual(res.stratumInfo.level, 3);
  });

  it('doit bloquer le forage au palier 5 si le Gardien de strate n a pas été battu', function () {
    const stateAt5 = {
      resources: { amber: 0 },
      exploration: {
        abyssDepth: 5,
        maxAbyssDepth: 5,
        abyssGuardiansDefeated: {}
      }
    };
    const resBlocked = drillStratumPure(stateAt5);
    assertFalse(resBlocked.success);
    assertEqual(resBlocked.reason, 'GUARDIAN_NOT_DEFEATED');

    // Défaite du gardien enregistrée -> déblocage
    stateAt5.exploration.abyssGuardiansDefeated[5] = true;
    const resUnblocked = drillStratumPure(stateAt5);
    assertTrue(resUnblocked.success);
    assertEqual(resUnblocked.nextState.exploration.abyssDepth, 6);
  });
});

describe('Lot 7 — Actions UI & Rendu Graphique Canvas', function () {
  it('doit exécuter les actions interactives avec mise à jour d état', function () {
    const s = createFreshGameState();
    s.ants.worker = 12;
    s.resources.amber = 50;
    s.amber = 50;
    globalThis.gameState = s;

    // Déploiement pont vivant action
    const bridgeOk = formLivingBridgeAction('surface');
    assertTrue(bridgeOk);
    assertTrue(globalThis.gameState.exploration.livingBridges.surfaceHarvest);

    // Rappel pont vivant action
    const releaseOk = releaseLivingBridgeAction('surface');
    assertTrue(releaseOk);
    assertFalse(globalThis.gameState.exploration.livingBridges.surfaceHarvest);

    // Forage action
    const drillOk = drillStratumAction();
    assertTrue(drillOk);
    assertEqual(globalThis.gameState.exploration.abyssDepth, 1);

    // Éveil relique action
    const relicOk = upgradeRelicAction('queen_amber');
    assertTrue(relicOk);
    assertEqual(globalThis.gameState.exploration.relics.queen_amber, 1);
    assertTrue(globalThis.gameState.resources.amber < 50);
  });

  it('doit exécuter updateExplorationUI sans erreur sur environnement DOM mocké', function () {
    const mockElements = {};
    const fakeDoc = {
      getElementById: (id) => {
        if (!mockElements[id]) {
          mockElements[id] = { textContent: '', className: '', style: {}, setAttribute: () => {}, querySelector: () => null };
        }
        return mockElements[id];
      }
    };
    const origDoc = globalThis.document;
    globalThis.document = fakeDoc;

    updateExplorationUI();

    globalThis.document = origDoc;
  });

  it('doit dessiner les détails du puits des abîmes et le pont vivant sans erreur', function () {
    const mockCtx = {
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      arc: () => {},
      ellipse: () => {},
      fill: () => {},
      stroke: () => {},
      moveTo: () => {},
      lineTo: () => {},
      quadraticCurveTo: () => {},
      fillText: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} })
    };
    globalThis.ctx = mockCtx;

    // Dessin Abyss Shaft
    drawAbyssShaftDetails(100, 200, 30, 20);

    // Dessin Pont Vivant (actif)
    if (globalThis.gameState && globalThis.gameState.exploration) {
      globalThis.gameState.exploration.livingBridges.surfaceHarvest = true;
    }
    drawLivingBridgeEffect(800, 100);
  });
});
