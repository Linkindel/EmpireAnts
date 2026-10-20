/**
 * Tests Unitaires & Intégration - Lot 5 : Économie Symbiotique, Chambre des Bâtisseuses,
 * Chantiers Réels Bornés, Métiers d'Ouvrières, Paliers d'Ères & Compostage (symbiosis.test.js)
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
  require('../i18n.js');
  require('../config.js');
  require('../combat.js');
  require('../symbiosis.js');
  require('../game.js');
  globalThis.window = globalThis.window || globalThis;
  globalThis.window.t = globalThis.t;
}

const SYM = (typeof require === 'function') ? require('../symbiosis.js') : globalThis;
const CFG = (typeof require === 'function') ? require('../config.js').GAME_CONFIG : globalThis.GAME_CONFIG;
const COMBAT = (typeof require === 'function') ? require('../combat.js') : globalThis;
const GAME = (typeof require === 'function') ? require('../game.js') : globalThis;

describe('Lot 5 - Durée des Chantiers Asymptotiques & Multiplicateurs de Vitesse', function () {
  it('doit calculer une durée de base de 30s au niveau 1 sans bonus', function () {
    const state = { rooms: { masonry_hall: 0 }, workerRoles: { mason: 0 }, honeyBoostTimer: 0 };
    const duration = SYM.computeConstructionTime('granary', 1, state, CFG);
    assertEqual(duration, 30, 'Au niveau 1 sans modificateur, la durée doit être exactement 30s');
  });

  it('doit rester strictement borné sous le plafond de 2h (7200s) même à très haut niveau', function () {
    const state = { rooms: { masonry_hall: 0 }, workerRoles: { mason: 0 }, honeyBoostTimer: 0 };
    const durationLvl100 = SYM.computeConstructionTime('granary', 100, state, CFG);
    const durationLvl1000 = SYM.computeConstructionTime('granary', 1000, state, CFG);

    assertTrue(durationLvl100 <= 7200, 'Niveau 100 doit être <= 7200s');
    assertTrue(durationLvl1000 <= 7200, 'Niveau 1000 doit être <= 7200s');
    assertTrue(durationLvl100 > 30, 'Niveau 100 doit être supérieur à 30s');
  });

  it('doit respecter le plancher de sécurité minimal de 5s', function () {
    const state = {
      rooms: { masonry_hall: 50 },
      workerRoles: { mason: 100 },
      honeyBoostTimer: 300
    };
    const duration = SYM.computeConstructionTime('granary', 1, state, CFG);
    assertEqual(duration, 5, 'Plancher minimal garanti à 5s');
  });

  it('doit réduire le temps de chantier grâce au niveau de masonry_hall', function () {
    const stateNoHall = { rooms: { masonry_hall: 0 }, workerRoles: { mason: 0 }, honeyBoostTimer: 0 };
    const stateWithHall = { rooms: { masonry_hall: 3 }, workerRoles: { mason: 0 }, honeyBoostTimer: 0 };

    const t1 = SYM.computeConstructionTime('dorm', 10, stateNoHall, CFG);
    const t2 = SYM.computeConstructionTime('dorm', 10, stateWithHall, CFG);
    assertTrue(t2 < t1, 'La chambre des bâtisseuses doit réduire le temps');
  });

  it('doit accélérer la vitesse grâce aux maçonnes et au coup de collier au miellat', function () {
    const state0 = { workerRoles: { mason: 0 }, honeyBoostTimer: 0 };
    const state10 = { workerRoles: { mason: 10 }, honeyBoostTimer: 0 };
    const stateHoney = { workerRoles: { mason: 10 }, honeyBoostTimer: 100 };

    const sp0 = SYM.computeActiveConstructionSpeed(state0, CFG);
    const sp10 = SYM.computeActiveConstructionSpeed(state10, CFG);
    const spHoney = SYM.computeActiveConstructionSpeed(stateHoney, CFG);

    assertEqual(sp0, 1.0);
    assertTrue(sp10 > 1.0, '10 maçonnes doivent procurer un bonus de vitesse');
    assertEqual(spHoney, sp10 * 2.0, 'Le boost miellat double la vitesse de chantier');
  });
});

describe('Lot 5 - Limites de Chantiers Simultanés & File d\'Attente', function () {
  it('doit renvoyer 1 chantier actif et 1 en file sans Chambre des Bâtisseuses', function () {
    const state = { rooms: { masonry_hall: 0 } };
    const lim = SYM.getConstructionLimits(state, CFG);
    assertEqual(lim.maxActive, 1);
    assertEqual(lim.maxQueued, 1);
    assertEqual(SYM.getMaxActiveConstructions(state, CFG), 1);
  });

  it('doit augmenter les chantiers simultanés avec le niveau de masonry_hall', function () {
    const state1 = { rooms: { masonry_hall: 1 } };
    const lim1 = SYM.getConstructionLimits(state1, CFG);
    assertEqual(lim1.maxActive, 1);
    assertEqual(lim1.maxQueued, 2);

    const state3 = { rooms: { masonry_hall: 3 } };
    const lim3 = SYM.getConstructionLimits(state3, CFG);
    assertEqual(lim3.maxActive, 2);
    assertEqual(lim3.maxQueued, 4);

    const state5 = { rooms: { masonry_hall: 5 } };
    const lim5 = SYM.getConstructionLimits(state5, CFG);
    assertEqual(lim5.maxActive, 3);
    assertEqual(lim5.maxQueued, Infinity);
  });
});

describe('Lot 5 - Harmonie Symbiotique & Production des Métiers', function () {
  it('doit retourner un score de 0 si aucune ouvrière n\'est spécialisée', function () {
    const state = {
      workerRoles: { harvester: 10, breeder: 0, grower: 0, mason: 0 },
      ants: { nurse: 0 }
    };
    const harmony = SYM.computeSymbiosisHarmony(state, CFG);
    assertEqual(harmony.harmonyScore, 0);
    assertEqual(harmony.incubationBonus, 0);
    assertEqual(harmony.organicBonus, 0);
  });

  it('doit atteindre une harmonie maximale quand les métiers sont parfaitement équilibrés', function () {
    const state = {
      workerRoles: { harvester: 5, breeder: 5, grower: 5, mason: 5 },
      ants: { nurse: 5 }
    };
    const harmony = SYM.computeSymbiosisHarmony(state, CFG);
    assertEqual(harmony.harmonyScore, 1.0);
    assertTrue(harmony.incubationBonus > 0, 'Bonus incubation positif attendu');
    assertTrue(harmony.organicBonus > 0, 'Bonus organique positif attendu');
  });

  it('doit calculer les flux de production par seconde des métiers', function () {
    const state = {
      workerRoles: { harvester: 4, breeder: 2, grower: 3, mason: 2 },
      ants: { nurse: 2 }
    };
    const prod = SYM.computeWorkerRoleProduction(state, CFG);
    assertTrue(prod.food > 0, 'Production de nourriture par les récolteuses');
    assertTrue(prod.honeydew > 0, 'Production de miellat par les éleveuses');
    assertTrue(prod.spores > 0, 'Production de spores par les cultivatrices');
    assertTrue(prod.twigs > 0, 'Production de brindilles par les maçonnes');
    assertTrue(prod.chitin > 0, 'Production de chitine par les maçonnes');
  });
});

describe('Lot 5 - Compostage Fongique de Combat (recycleCombatBiomass)', function () {
  it('doit recycler les pertes alliées en spores et chitine', function () {
    const losses = {
      ants: { worker: 4, scout: 2, warrior: 1, tank: 1, nurse: 0 }
    };
    const compost = SYM.recycleCombatBiomass(losses, 0, CFG);
    assertTrue(compost.spores > 0, 'Spores gagnées sur les pertes');
    assertTrue(compost.chitin > 0, 'Chitine gagnée sur les pertes');
  });

  it('doit récompenser la puissance ennemie vaincue en compost additionnel', function () {
    const compost = SYM.recycleCombatBiomass({ ants: {} }, 100, CFG);
    assertTrue(compost.spores >= 15, 'Ratio spores sur puissance ennemie');
    assertTrue(compost.chitin >= 10, 'Ratio chitine sur puissance ennemie');
  });

  it('doit gérer défensivement les cas limites (pertes nulles ou négatives)', function () {
    const compost = SYM.recycleCombatBiomass(null, -10, CFG);
    assertEqual(compost.spores, 0);
    assertEqual(compost.chitin, 0);
  });
});

describe('Lot 5 - Paliers d\'Ères Architecturales', function () {
  it('doit détecter les paliers atteints (10, 25, 50, 100, 250, 500+)', function () {
    const rooms = {
      queen: 25,
      granary: 10,
      dorm: 5,
      aphid_farm: 0
    };
    const res = SYM.evaluateRoomMilestoneBonuses(rooms, CFG);
    assertTrue(res.unlockedCount >= 3, 'Au moins 3 paliers débloqués (10 granary, 10 queen, 25 queen)');
    assertTrue(res.upkeepReduction > 0, 'Réduction d\'entretien active');
    assertTrue(res.efficiencyBonus > 0, 'Bonus d\'efficacité actif');
  });

  it('doit filtrer les bonus d\'une salle spécifique via getRoomMilestoneBonuses', function () {
    const milestones = SYM.getRoomMilestoneBonuses('queen', 50, CFG);
    assertTrue(milestones.length >= 3, 'Paliers 10, 25 et 50 de la reine');
  });
});

describe('Lot 5 - Assignation des Rôles d\'Ouvrières (assignWorkerRolePure)', function () {
  it('doit transférer des ouvrières depuis les récolteuses vers un autre métier', function () {
    const currentRoles = { harvester: 6, breeder: 0, grower: 0, mason: 0 };
    const res = SYM.assignWorkerRolePure(currentRoles, 6, 'breeder', 2);
    assertEqual(res.harvester, 4);
    assertEqual(res.breeder, 2);
    assertEqual(res.harvester + res.breeder + res.grower + res.mason, 6);
  });

  it('doit renvoyer les ouvrières vers les récolteuses lors d\'un retrait', function () {
    const currentRoles = { harvester: 3, breeder: 3, grower: 0, mason: 0 };
    const res = SYM.assignWorkerRolePure(currentRoles, 6, 'breeder', -2);
    assertEqual(res.harvester, 5);
    assertEqual(res.breeder, 1);
  });

  it('doit refuser les rôles invalides', function () {
    const res = SYM.assignWorkerRolePure({ harvester: 6 }, 6, 'invalid_role', 1);
    assertEqual(res, null);
  });
});

describe('Lot 5 - Cycle de Vie des Chantiers Réels (startRoomConstruction & tickConstructions)', function () {
  let state;

  beforeEach(() => {
    state = {
      food: 500,
      maxFood: 1000,
      resources: { food: 500, honeydew: 50, chitin: 10, spores: 10, twigs: 10 },
      rooms: { granary: 1, masonry_hall: 0 },
      activeConstructions: [],
      buildQueue: [],
      workerRoles: { harvester: 6, breeder: 0, grower: 0, mason: 0 },
      honeyBoostTimer: 0
    };
  });

  it('doit démarrer un chantier si la nourriture est suffisante', function () {
    const res = SYM.startRoomConstruction('granary', state, CFG);
    assertTrue(res.success, 'Le chantier doit démarrer avec succès');
    assertEqual(state.activeConstructions.length, 1);
    assertEqual(state.activeConstructions[0].roomKey, 'granary');
    assertEqual(state.activeConstructions[0].targetLevel, 2);
    assertTrue(state.food < 500, 'Le coût en nourriture doit être déduit');
  });

  it('doit refuser de lancer un doublon de chantier pour la même salle', function () {
    SYM.startRoomConstruction('granary', state, CFG);
    const res2 = SYM.startRoomConstruction('granary', state, CFG);
    assertFalse(res2.success);
    assertEqual(res2.reason, 'ALREADY_UNDER_CONSTRUCTION');
  });

  it('doit faire progresser le chantier et monter le niveau à complétion', function () {
    SYM.startRoomConstruction('granary', state, CFG);
    const initialLvl = state.rooms.granary;
    const initialMaxFood = state.maxFood;

    // Simuler le passage du temps suffisant pour achever le chantier
    const completed = SYM.tickConstructions(state, 5000, CFG);
    assertEqual(completed.length, 1);
    assertEqual(state.activeConstructions.length, 0);
    assertEqual(state.rooms.granary, initialLvl + 1);
    assertTrue(state.maxFood > initialMaxFood, 'La capacité maximale de nourriture doit être étendue');
  });

  it('doit promouvoir un chantier de la file d\'attente quand un emplacement se libère', function () {
    state.rooms.masonry_hall = 1; // maxActive: 1, maxQueued: 2
    SYM.startRoomConstruction('granary', state, CFG);
    SYM.startRoomConstruction('dorm', state, CFG);

    assertEqual(state.activeConstructions.length, 1);
    assertEqual(state.buildQueue.length, 1);
    assertEqual(state.buildQueue[0].roomKey, 'dorm');

    // Terminer le premier chantier
    SYM.tickConstructions(state, 5000, CFG);
    assertEqual(state.rooms.granary, 2);
    assertEqual(state.activeConstructions.length, 1, 'Le chantier en file doit être promu actif');
    assertEqual(state.activeConstructions[0].roomKey, 'dorm');
    assertEqual(state.buildQueue.length, 0);
  });
});

describe('Lot 5 - Coup de Collier au Miellat, Thermorégulation & Régime Royal', function () {
  it('doit consommer le miellat et activer le boost de 300s', function () {
    const state = { honeydew: 30, resources: { honeydew: 30 }, honeyBoostTimer: 0 };
    const res = SYM.boostConstructionWithHoney(state, CFG);
    assertTrue(res.success);
    assertEqual(state.honeydew, 10);
    assertEqual(state.honeyBoostTimer, 300);
  });

  it('doit refuser le boost si le stock de miellat est insuffisant', function () {
    const state = { honeydew: 5, resources: { honeydew: 5 }, honeyBoostTimer: 0 };
    const res = SYM.boostConstructionWithHoney(state, CFG);
    assertFalse(res.success);
    assertEqual(res.reason, 'INSUFFICIENT_HONEYDEW');
  });

  it('doit basculer la thermorégulation du dôme et le régime de la reine', function () {
    const state = { domeVentilation: 'open', queenDiet: 'standard' };
    SYM.setDomeVentilation('sealed', state);
    assertEqual(state.domeVentilation, 'sealed');

    SYM.setQueenDiet('royal_jelly', state);
    assertEqual(state.queenDiet, 'royal_jelly');
  });
});

describe('Lot 5 - Persistance Défensive & Migration de Schéma vers SCHEMA_VERSION: 5', function () {
  it('doit migrer un état v4 vers v5 avec initialisation des 6 ressources et des rôles', function () {
    const oldState = {
      schemaVersion: 4,
      food: 120,
      pheromone: 25,
      ants: { worker: 8, scout: 2, warrior: 2, tank: 1, nurse: 0 },
      rooms: { queen: 1, granary: 1, dorm: 1 }
    };
    const sanitized = GAME.sanitizeGameState(oldState, CFG.INITIAL_STATE);
    assertEqual(sanitized.schemaVersion, 5);
    assertNotNull(sanitized.resources);
    assertEqual(sanitized.resources.food, 120);
    assertEqual(sanitized.resources.pheromone, 25);
    assertEqual(sanitized.resources.twigs, 0);
    assertEqual(sanitized.resources.honeydew, 0);
    assertEqual(sanitized.resources.chitin, 0);
    assertEqual(sanitized.resources.spores, 0);

    assertNotNull(sanitized.workerRoles);
    assertEqual(sanitized.workerRoles.harvester, 8);
    assertEqual(sanitized.rooms.aphid_farm, 0);
    assertEqual(sanitized.rooms.masonry_hall, 0);
    assertTrue(Array.isArray(sanitized.activeConstructions));
    assertTrue(Array.isArray(sanitized.buildQueue));
  });
});

describe('Lot 5 - Parité Bilingue Stricte FR/EN (i18n.js)', function () {
  it('doit avoir toutes les clés de ressources, salles et symbiosis en FR et en EN', function () {
    const requiredKeys = [
      'res.twigs', 'res.honeydew', 'res.chitin', 'res.spores',
      'room.aphid_farm.name', 'room.aphid_farm.desc',
      'room.masonry_hall.name', 'room.masonry_hall.desc',
      'symbiosis.title', 'symbiosis.harmony', 'symbiosis.honeyBoost',
      'job.harvester', 'job.breeder', 'job.grower', 'job.mason'
    ];

    const fr = CFG.I18N.fr;
    const en = CFG.I18N.en;

    requiredKeys.forEach(key => {
      const curFr = fr[key];
      const curEn = en[key];
      assertNotNull(curFr, 'Clé FR manquante : ' + key);
      assertNotNull(curEn, 'Clé EN manquante : ' + key);
      assertTrue(typeof curFr === 'string' && curFr.length > 0, 'Texte FR vide : ' + key);
      assertTrue(typeof curEn === 'string' && curEn.length > 0, 'Texte EN vide : ' + key);
    });
  });
});

describe('Lot 5 - Garde-fou d\'Architecture Senior (< 2000 lignes par fichier)', function () {
  it('doit vérifier qu\'aucun fichier source du projet ne dépasse 2000 lignes', function () {
    const MAX_LINES_PER_FILE = 2000;
    if (typeof require === 'function') {
      const fs = require('node:fs');
      const path = require('node:path');
      const rootDir = path.resolve(__dirname, '..');
      const ignoredDirs = new Set(['node_modules', 'coverage', '.git', '.agents']);
      const targetExts = new Set(['.js', '.css', '.html']);
      const violations = [];

      function scanDir(dirPath) {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        entries.forEach(function (entry) {
          const fullPath = path.join(dirPath, entry.name);
          if (entry.isDirectory()) {
            if (!ignoredDirs.has(entry.name)) {
              scanDir(fullPath);
            }
          } else if (entry.isFile() && targetExts.has(path.extname(entry.name))) {
            const relPath = path.relative(rootDir, fullPath);
            const content = fs.readFileSync(fullPath, 'utf8');
            const lineCount = content.split(/\r\n|\r|\n/).length;
            if (lineCount >= MAX_LINES_PER_FILE) {
              violations.push(relPath + ' (' + lineCount + ' lignes >= ' + MAX_LINES_PER_FILE + ')');
            }
          }
        });
      }

      scanDir(rootDir);
      assertEqual(violations.length, 0, 'Violation de la règle des 2000 lignes : ' + violations.join(', '));
    }
  });
});
