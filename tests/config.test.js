/**
 * Tests Unitaires & Intégrité - config.js & i18n
 * Couverture complète des Game Tokens, Économie, Saisons, Castes, Salles, Doctrines, Missions, Mutations et Parité Bilingue FR/EN
 */

describe('Configuration - Tokens Initiaux & Structure Générale', function() {
  it('doit posséder les clés de sauvegarde et de langue', function() {
    assertNotNull(GAME_CONFIG.SAVE_KEY, "SAVE_KEY doit être défini");
    assertNotNull(GAME_CONFIG.LANG_KEY, "LANG_KEY doit être défini");
    assertEqual(typeof GAME_CONFIG.SAVE_KEY, 'string');
    assertEqual(typeof GAME_CONFIG.LANG_KEY, 'string');
  });

  it('doit initialiser un état de base complet et cohérent', function() {
    const init = GAME_CONFIG.INITIAL_STATE;
    assertNotNull(init, "INITIAL_STATE doit exister");
    assertEqual(init.lang, 'fr');
    assertTrue(init.soundEnabled);
    assertTrue(init.food > 0, "Nourriture de départ positive");
    assertTrue(init.maxFood >= init.food, "Capacité max de stockage suffisante");
    assertTrue(init.queenHealth === 100);
    assertEqual(init.day, 1);
    assertEqual(init.speed, 1);

    // Castes de départ
    assertNotNull(init.ants);
    assertEqual(init.ants.worker, 6);
    assertEqual(init.ants.scout, 2);
    assertEqual(init.ants.warrior, 2);
    assertEqual(init.ants.tank, 1);

    // Salles initiales
    assertNotNull(init.rooms);
    assertEqual(init.rooms.queen, 1);
    assertEqual(init.rooms.granary, 1);
    assertEqual(init.rooms.dorm, 1);
    assertEqual(init.rooms.barricade, 0);
    assertEqual(init.rooms.fungus, 0);

    // Escouade initiale vide
    assertEqual(init.squad.tank, 0);
    assertEqual(init.squad.warrior, 0);
    assertEqual(init.squad.scout, 0);
    assertEqual(init.squad.doctrine, 'balanced');
  });
});

describe('Configuration - Économie & Cycle Temporel', function() {
  it('doit définir des constantes temporelles et de ponte valides', function() {
    const eco = GAME_CONFIG.ECONOMY;
    assertNotNull(eco);
    assertEqual(eco.dayDurationSeconds, 60);
    assertTrue(eco.basePopCap >= 10);
    assertTrue(eco.baseFoodConsumptionPerAnt > 0);
    assertTrue(eco.basePheromoneGain > 0);
    assertTrue(eco.starvationQueenDamagePerSec > 0);
    assertTrue(eco.queenHealRatePerSec > 0);
    assertTrue(eco.autoSpawnMinFood > 0);
    assertTrue(eco.autoSpawnFoodCost > 0);
    assertTrue(eco.autoSpawnBaseChance > 0);
    assertTrue(eco.queenIncubationSpeedPerLevel > 0);
  });
});

describe('Configuration - Saisons', function() {
  it('doit comporter 4 saisons bien ordonnées', function() {
    const seasons = GAME_CONFIG.SEASONS;
    assertNotNull(seasons);
    assertEqual(seasons.daysPerSeason, 2);
    assertEqual(seasons.order.length, 4);
    assertEqual(seasons.order[0], 'spring');
    assertEqual(seasons.order[1], 'summer');
    assertEqual(seasons.order[2], 'autumn');
    assertEqual(seasons.order[3], 'winter');
  });

  it('doit configurer les multiplicateurs spécifiques à chaque saison', function() {
    const seasons = GAME_CONFIG.SEASONS;

    // Printemps : bonus incubation
    assertTrue(seasons.spring.incubationSpeedMultiplier > 1.0);
    assertEqual(seasons.spring.workerFoodMultiplier, 1.0);

    // Été : bonus récolte et butin
    assertTrue(seasons.summer.workerFoodMultiplier > 1.0);
    assertTrue(seasons.summer.lootMultiplier > 1.0);

    // Automne : fort butin mais raids accrus
    assertTrue(seasons.autumn.lootMultiplier > 1.0);
    assertTrue(seasons.autumn.raidStrengthMultiplier > 1.0);

    // Hiver : gel et malus de récolte en surface
    assertTrue(seasons.winter.workerFoodMultiplier < 1.0);
    assertTrue(seasons.winter.incubationSpeedMultiplier < 1.0);
  });
});

describe('Configuration - Castes & Équilibrage Militaire', function() {
  it('doit déclarer les 4 castes (worker, scout, warrior, tank)', function() {
    const castes = GAME_CONFIG.CASTES;
    assertNotNull(castes.worker);
    assertNotNull(castes.scout);
    assertNotNull(castes.warrior);
    assertNotNull(castes.tank);
  });

  it('doit attribuer des rôles spécialisés à chaque caste', function() {
    const castes = GAME_CONFIG.CASTES;

    // Ouvrière : produit de la nourriture, 0 attaque
    assertTrue(castes.worker.foodProd > 0);
    assertEqual(castes.worker.attackPower, 0);
    assertEqual(castes.worker.defensePower, 0);

    // Éclaireuse : rapide, produit des phéromones
    assertTrue(castes.scout.pheroProd > 0);
    assertTrue(castes.scout.moveSpeed > castes.worker.moveSpeed);
    assertTrue(castes.scout.attackPower > 0);

    // Guerrière : force d'attaque élevée
    assertTrue(castes.warrior.attackPower > castes.scout.attackPower);
    assertTrue(castes.warrior.extraUpkeep > 0);

    // Tank : points de vie et rempart défensif majeurs
    assertTrue(castes.tank.hp > castes.warrior.hp);
    assertTrue(castes.tank.defensePower > castes.warrior.defensePower);
    assertTrue(castes.tank.cost > castes.warrior.cost);
  });
});

describe('Configuration - Salles & Fonctions de Coût Dynamique', function() {
  it('doit calculer les coûts de façon progressive et croissante pour toutes les salles', function() {
    const rooms = GAME_CONFIG.ROOMS;
    const roomKeys = ['queen', 'granary', 'dorm', 'barricade', 'fungus'];

    roomKeys.forEach(function(key) {
      const room = rooms[key];
      assertNotNull(room, "La salle " + key + " doit exister");
      assertEqual(typeof room.cost, 'function', "cost() doit être une fonction pour " + key);

      const cost0 = room.cost(0);
      const cost1 = room.cost(1);
      const cost2 = room.cost(2);

      assertEqual(cost0, room.baseCost, "Le coût niv 0 doit être baseCost pour " + key);
      assertTrue(cost1 > cost0, "Le coût niv 1 doit être supérieur au niv 0 pour " + key);
      assertTrue(cost2 > cost1, "Le coût niv 2 doit être supérieur au niv 1 pour " + key);
      assertEqual(cost1 - cost0, room.costPerLevel, "L'incrément de coût doit correspondre à costPerLevel pour " + key);
    });
  });

  it('doit fournir des propriétés spécifiques pour chaque type de salle', function() {
    const rooms = GAME_CONFIG.ROOMS;
    assertEqual(rooms.granary.storagePerLevel, 60);
    assertEqual(rooms.dorm.popCapPerLevel, 10);
    assertEqual(rooms.barricade.defensePerLevel, 25);
    assertEqual(rooms.fungus.foodPerLevel, 1.2);
  });
});

describe('Configuration - Doctrines Tactiques', function() {
  it('doit définir 4 doctrines avec des multiplicateurs variés', function() {
    const doctrines = GAME_CONFIG.DOCTRINES;
    assertNotNull(doctrines.balanced);
    assertNotNull(doctrines.turtle);
    assertNotNull(doctrines.rush);
    assertNotNull(doctrines.acid);

    assertEqual(doctrines.balanced.powerMultiplier, 1.0);
    assertTrue(doctrines.rush.powerMultiplier > 1.0);
    assertEqual(doctrines.turtle.tankLossChance, 0.0, "La doctrine tortue protège les tanks de la perte");
    assertTrue(doctrines.acid.warriorBonusPerUnit > 0);
  });
});

describe('Configuration - Missions d\'Expédition & Mutations', function() {
  it('doit calibrer 3 missions d\'expédition avec difficulté et durée croissantes', function() {
    const missions = GAME_CONFIG.MISSIONS;
    const pucerons = missions.pucerons;
    const chenille = missions.chenille;
    const rouges = missions.fourmis_rouges;

    assertTrue(pucerons.difficulty < chenille.difficulty);
    assertTrue(chenille.difficulty < rouges.difficulty);

    assertTrue(pucerons.duration < chenille.duration);
    assertTrue(chenille.duration < rouges.duration);

    assertTrue(pucerons.lootFood < chenille.lootFood);
    assertTrue(chenille.lootFood < rouges.lootFood);

    assertEqual(rouges.bonusWorkers, 1, "Raid sur fourmis rouges rapporte des larves");
  });

  it('doit calibrer les 3 mutations génétiques', function() {
    const muts = GAME_CONFIG.MUTATIONS;
    assertEqual(muts.mandibules.cost, 25);
    assertEqual(muts.mandibules.powerMultiplier, 1.3);

    assertEqual(muts.carapace.cost, 35);
    assertEqual(muts.carapace.tankPowerBonus, 15);

    assertEqual(muts.acide.cost, 45);
    assertEqual(muts.acide.warriorPowerBonus, 12);
  });

  it('doit paramétrer le système de raids ennemis', function() {
    const raids = GAME_CONFIG.RAIDS;
    assertTrue(raids.alertThresholdSeconds > 0);
    assertTrue(raids.baseStrength > 0);
    assertTrue(raids.strengthPerDay > 0);
    assertTrue(raids.victoryPheroReward > 0);
  });
});

describe('Configuration - Canvas Theme & Graphe des Galeries', function() {
  it('doit contenir les nœuds clés du réseau souterrain', function() {
    const nodes = GAME_CONFIG.CANVAS_THEME.nodes;
    assertNotNull(nodes.queen);
    assertNotNull(nodes.granary);
    assertNotNull(nodes.dorm);
    assertNotNull(nodes.fungus);
    assertNotNull(nodes.nursery);
    assertNotNull(nodes.entrance);
    assertNotNull(nodes.barricade);

    assertTrue(nodes.queen.isChamber);
    assertTrue(nodes.granary.isChamber);
    assertTrue(nodes.dorm.isChamber);
    assertTrue(nodes.fungus.isChamber);
    assertTrue(nodes.nursery.isChamber);
    assertFalse(nodes.entrance.isChamber);
  });

  it('doit relier les nœuds par des arêtes cohérentes', function() {
    const edges = GAME_CONFIG.CANVAS_THEME.edges;
    assertTrue(Array.isArray(edges));
    assertTrue(edges.length >= 8);

    const nodes = GAME_CONFIG.CANVAS_THEME.nodes;
    edges.forEach(function(edge) {
      assertNotNull(nodes[edge[0]], "Nœud source " + edge[0] + " doit exister");
      assertNotNull(nodes[edge[1]], "Nœud cible " + edge[1] + " doit exister");
    });
  });
});

describe('Internationalisation (i18n) - Parité Stricte FR / EN', function() {
  it('doit disposer des deux dictionnaires fr et en', function() {
    assertNotNull(GAME_CONFIG.I18N.fr, "Dictionnaire FR requis");
    assertNotNull(GAME_CONFIG.I18N.en, "Dictionnaire EN requis");
  });

  it('doit avoir une parité exacte à 100% sans aucune clé manquante entre FR et EN', function() {
    const frKeys = Object.keys(GAME_CONFIG.I18N.fr);
    const enKeys = Object.keys(GAME_CONFIG.I18N.en);

    assertEqual(frKeys.length, enKeys.length, "Nombre de clés identique entre FR et EN (" + frKeys.length + " vs " + enKeys.length + ")");

    const missingInEn = frKeys.filter(function(k) { return GAME_CONFIG.I18N.en[k] === undefined; });
    assertEqual(missingInEn.length, 0, "Clés manquantes en EN: " + missingInEn.join(', '));

    const missingInFr = enKeys.filter(function(k) { return GAME_CONFIG.I18N.fr[k] === undefined; });
    assertEqual(missingInFr.length, 0, "Clés manquantes en FR: " + missingInFr.join(', '));
  });

  it('doit interpoler correctement les variables avec la fonction t()', function() {
    const testKey = 'alert.raid';
    const translatedFR = window.t(testKey, { sec: 18 });
    assertTrue(translatedFR.indexOf('18s') !== -1, "La variable {sec} doit être remplacée par 18s");

    const bonusTrans = window.t('log.exp_bonus_workers', { count: 3 });
    assertTrue(bonusTrans.indexOf('3') !== -1, "La variable {count} doit être remplacée");
  });

  it('doit basculer dynamiquement la langue dans gameState et t()', function() {
    const origLang = gameState.lang;

    gameState.lang = 'en';
    const enTitle = window.t('brand.title');
    assertEqual(enTitle, 'ANT EMPIRE');

    gameState.lang = 'fr';
    const frTitle = window.t('brand.title');
    assertEqual(frTitle, 'EMPIRE FOURMI');

    gameState.lang = origLang;
  });
});
