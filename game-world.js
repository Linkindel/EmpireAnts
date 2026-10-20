/**
 * Empire Fourmi - Moteur d'Exploration Procédurale, Anneaux, Abîmes & Reliques (game-world.js)
 * Lot 7 : Axe Horizontal (Anneaux de surface procéduraux 1 -> ∞),
 * Axe Vertical (Strates des Abîmes, Chaleur Géothermique, Forage, Aléas environnementaux),
 * Ponts Vivants d'Ouvrières (Living Bridges),
 * Scaling Adaptatif Anti-Snowball (Tier Gates super-exponentiels),
 * Monnaie Méta Ambre 🟠 & Reliques Ancestrales persistantes au Vol Nuptial.
 *
 * Module pur et déterministe (zéro accès direct au DOM, compatible Node.js et Navigateur).
 */

(function (root) {
  'use strict';

  /* c8 ignore next 7 */
  function getConfig() {
    if (root.GAME_CONFIG) return root.GAME_CONFIG;
    if (typeof require === 'function') {
      try { return require('./config.js').GAME_CONFIG || {}; } catch (e) { return {}; }
    }
    return {};
  }

  // =========================================================================
  // 1. CONFIGURATION DÉCLARATIVE DE L'EXPLORATION (GAME_CONFIG.EXPLORATION)
  // =========================================================================

  const EXPLORATION_DEFAULTS = {
    adaptiveScaling: {
      baseDifficulty: 25,
      difficultyScale: 1.25,
      tierGateInterval: 5,
      tierGateMultiplierStep: 1.6,
      lootScale: 1.16, // Facteur inférieur à la difficulté (~0.928) pour contraindre aux synergies
      baseFoodLoot: 60,
      basePheroLoot: 6,
      baseAmberLoot: 8
    },
    livingBridge: {
      requiredWorkers: 5,
      harvestSpeedBonus: 0.25, // +25% de vitesse de récolte
      chasmMitigation: 1.0 // annule le malus de crevasse
    },
    abyss: {
      baseHardness: 1,
      maxHardnessTier: 5,
      popCapPerStratum: 2,
      geothermalWarmthPerStratum: 0.02, // +2% atténuation froid par strate
      maxGeothermalMitigation: 0.80
    },
    hazards: {
      abyssal_darkness: {
        id: 'abyssal_darkness',
        nameKey: 'hazard.darkness.name',
        descKey: 'hazard.darkness.desc',
        counterCaste: 'scout',
        powerMalus: 0.20 // -20% puissance si pas d'éclaireuse
      },
      chasm_crevasse: {
        id: 'chasm_crevasse',
        nameKey: 'hazard.crevasse.name',
        descKey: 'hazard.crevasse.desc',
        requiresLivingBridge: true,
        lossRiskBonus: 0.30 // +30% risque de perte si pas de pont
      },
      acidic_vapors: {
        id: 'acidic_vapors',
        nameKey: 'hazard.vapors.name',
        descKey: 'hazard.vapors.desc',
        counterCaste: 'tank',
        counterDoctrine: 'acid',
        lossRiskBonus: 0.25 // neutralisé par tanks ou doctrine acide
      },
      geothermal_vent: {
        id: 'geothermal_vent',
        nameKey: 'hazard.geothermal.name',
        descKey: 'hazard.geothermal.desc',
        heatBonus: 0.15, // bonus de chaleur ponctuel
        damageRisk: 0.10
      }
    },
    relics: {
      queen_amber: {
        id: 'queen_amber',
        icon: '👑',
        nameKey: 'relic.queen_amber.name',
        descKey: 'relic.queen_amber.desc',
        baseCost: 15,
        costMultiplier: 1.6,
        queenHpBonusPerLevel: 25,
        queenHealBonusPerLevel: 0.10
      },
      fossil_mandible: {
        id: 'fossil_mandible',
        icon: '🦴',
        nameKey: 'relic.fossil_mandible.name',
        descKey: 'relic.fossil_mandible.desc',
        baseCost: 20,
        costMultiplier: 1.6,
        militaryPowerBonusPerLevel: 0.08 // +8% puissance globale d'escouade
      },
      eternal_spore: {
        id: 'eternal_spore',
        icon: '🍄',
        nameKey: 'relic.eternal_spore.name',
        descKey: 'relic.eternal_spore.desc',
        baseCost: 25,
        costMultiplier: 1.6,
        fungusBonusPerLevel: 0.15, // +15% prod champignonnière
        compostYieldBonusPerLevel: 0.10 // +10% rendement compostage
      },
      solar_sap: {
        id: 'solar_sap',
        icon: '☀️',
        nameKey: 'relic.solar_sap.name',
        descKey: 'relic.solar_sap.desc',
        baseCost: 30,
        costMultiplier: 1.6,
        incubationSpeedBonusPerLevel: 0.10, // +10% vitesse incubation
        winterWorkerFoodBonusPerLevel: 0.15 // +15% récolte ouvrière hiver
      }
    }
  };

  // Attachement défensif universel
  root.EXPLORATION_DEFAULTS = EXPLORATION_DEFAULTS;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports.EXPLORATION_DEFAULTS = EXPLORATION_DEFAULTS;
  }
  const initialCfg = getConfig();
  if (initialCfg) {
    initialCfg.EXPLORATION = initialCfg.EXPLORATION || EXPLORATION_DEFAULTS;
  }

  // =========================================================================
  // 2. FORMULES PURS DE SCALING & TIER GATES SUPER-EXPONENTIELS
  // =========================================================================

  /**
   * Calcule le multiplicateur de palier super-exponentiel (Tier Gate).
   * Tous les 5 niveaux (Anneaux ou Strates), un saut de palier (x1.6^tier)
   * empêche le snowball linéaire par force brute pure.
   *
   * @param {number} level Niveau de la zone (1 -> ∞)
   * @param {Object} [config] Configuration
   * @returns {number} Multiplicateur de palier (≥ 1.0)
   */
  function computeTierGateMultiplier(level, config) {
    const cfg = (config && config.EXPLORATION && config.EXPLORATION.adaptiveScaling) ||
                (GAME_CONFIG && GAME_CONFIG.EXPLORATION && GAME_CONFIG.EXPLORATION.adaptiveScaling) ||
                EXPLORATION_DEFAULTS.adaptiveScaling;
    const safeLvl = Math.max(1, Math.floor(Number(level) || 1));
    const interval = cfg.tierGateInterval || 5;
    const step = cfg.tierGateMultiplierStep || 1.6;
    const tier = Math.floor((safeLvl - 1) / interval);
    return Math.pow(step, tier);
  }

  /**
   * Calcule la difficulté d'une zone (Anneau ou Strate).
   * D(lvl) = D_0 * scale^(lvl-1) * TierGate(lvl) * (isGuardian ? 1.5 : 1.0)
   */
  function computeZoneDifficulty(level, isGuardian = false, config) {
    const cfg = (config && config.EXPLORATION && config.EXPLORATION.adaptiveScaling) ||
                (GAME_CONFIG && GAME_CONFIG.EXPLORATION && GAME_CONFIG.EXPLORATION.adaptiveScaling) ||
                EXPLORATION_DEFAULTS.adaptiveScaling;
    const safeLvl = Math.max(1, Math.floor(Number(level) || 1));
    const base = cfg.baseDifficulty || 25;
    const scale = cfg.difficultyScale || 1.25;
    const tierGate = computeTierGateMultiplier(safeLvl, config);
    const guardianCoeff = isGuardian ? 1.5 : 1.0;

    return Math.round(base * Math.pow(scale, safeLvl - 1) * tierGate * guardianCoeff);
  }

  /**
   * Calcule le butin pur d'une zone (Nourriture, Phéromones, Ambre).
   * Les gains croissent avec un facteur inférieur à la difficulté (ratio ~0.928)
   * pour éviter l'hyper-inflation sans prestiges ni synergies.
   */
  function computeZoneLoot(level, isGuardian = false, config) {
    const cfg = (config && config.EXPLORATION && config.EXPLORATION.adaptiveScaling) ||
                (GAME_CONFIG && GAME_CONFIG.EXPLORATION && GAME_CONFIG.EXPLORATION.adaptiveScaling) ||
                EXPLORATION_DEFAULTS.adaptiveScaling;
    const safeLvl = Math.max(1, Math.floor(Number(level) || 1));
    const lootScale = cfg.lootScale || 1.16;
    const baseFood = cfg.baseFoodLoot || 60;
    const basePhero = cfg.basePheroLoot || 6;
    const baseAmber = cfg.baseAmberLoot || 8;

    const guardianCoeff = isGuardian ? 2.5 : 1.0;
    const food = Math.round(baseFood * Math.pow(lootScale, safeLvl - 1) * guardianCoeff);
    const phero = Math.round(basePhero * Math.pow(lootScale, safeLvl - 1) * (isGuardian ? 3.0 : 1.0));

    // L'Ambre 🟠 tombe exclusivement sur les Gardiens d'Anneaux et d'Abîmes
    let amber = 0;
    if (isGuardian) {
      const amberTier = Math.floor(safeLvl / 5);
      amber = Math.max(5, Math.round(baseAmber * Math.pow(1.20, amberTier)));
    }

    return { food, phero, amber };
  }

  // =========================================================================
  // 3. GÉNÉRATEUR PROCÉDURAL UNIQUE (generateZone - PURE ET DÉTERMINISTE)
  // =========================================================================

  /**
   * Générateur procédural unique pour les deux axes :
   * - Horizontal : Anneaux de surface (axis: 'ring')
   * - Vertical : Strates des abîmes (axis: 'stratum')
   *
   * @param {Object} params
   * @param {'ring'|'stratum'} params.axis Axe d'exploration
   * @param {number} params.level Niveau (Anneau 1 -> ∞ ou Strate 1 -> ∞)
   * @param {number} [params.seed=0] Graine optionnelle de déterminisme
   * @param {Object} [params.config] Configuration centrale
   * @returns {Object} Zone générée
   */
  function generateZone({ axis = 'ring', level = 1, seed = 0, config } = {}) {
    const activeCfg = config || root.GAME_CONFIG || getConfig();
    const safeAxis = axis === 'stratum' ? 'stratum' : 'ring';
    const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
    const tierGateMultiplier = computeTierGateMultiplier(safeLevel, config);
    const factions = ['fire_ants', 'termites', 'wasps'];

    if (safeAxis === 'ring') {
      // --- ANNEAU DE SURFACE ---
      // Cas particulier Anneau 1 : Rétrocompatibilité avec les 5 missions historiques d'Acte I
      if (safeLevel === 1) {
        return {
          axis: 'ring',
          level: 1,
          nameKey: 'ring.1.name',
          tierGateMultiplier: 1.0,
          sectors: [
            { id: 'pucerons', index: 1, faction: null, difficulty: 25, loot: { food: 75, phero: 6, amber: 0 }, bonusWorkers: 0, isGuardian: false, nameKey: 'mission.pucerons.name' },
            { id: 'chenille', index: 2, faction: null, difficulty: 65, loot: { food: 180, phero: 18, amber: 0 }, bonusWorkers: 0, isGuardian: false, nameKey: 'mission.chenille.name' },
            { id: 'fourmis_rouges', index: 3, faction: 'fire_ants', difficulty: 110, loot: { food: 320, phero: 40, amber: 0 }, bonusWorkers: 1, isGuardian: false, nameKey: 'mission.fourmis_rouges.name' },
            { id: 'termites_bastion', index: 4, faction: 'termites', difficulty: 210, loot: { food: 550, phero: 75, amber: 0 }, bonusWorkers: 2, isGuardian: false, nameKey: 'mission.termites_bastion.name' }
          ],
          guardian: {
            id: 'mantis_boss',
            nameKey: 'mission.mantis_boss.name',
            faction: 'wasps',
            difficulty: 380,
            loot: { food: 1100, phero: 180, amber: 12 },
            bonusWorkers: 3,
            isBoss: true,
            isGuardian: true,
            trophyKey: 'trophy.mantis'
          }
        };
      }

      // Anneaux procéduraux (Niveau ≥ 2)
      const sectorsCount = 4;
      const sectors = [];
      for (let i = 1; i <= sectorsCount; i++) {
        const sectorFaction = factions[(safeLevel + i + seed) % factions.length];
        const stepDifficulty = computeZoneDifficulty(safeLevel + (i - 1) * 0.25, false, config);
        const loot = computeZoneLoot(safeLevel, false, config);
        sectors.push({
          id: `ring_${safeLevel}_sector_${i}`,
          index: i,
          faction: sectorFaction,
          difficulty: stepDifficulty,
          loot: { ...loot, amber: 0 },
          bonusWorkers: (safeLevel % 3 === 0 && i === sectorsCount) ? 1 : 0,
          isGuardian: false,
          nameKey: `exp.sector.procedural`
        });
      }

      const guardianDifficulty = computeZoneDifficulty(safeLevel, true, config);
      const guardianLoot = computeZoneLoot(safeLevel, true, config);
      const guardianFaction = factions[(safeLevel * 2 + seed) % factions.length];

      return {
        axis: 'ring',
        level: safeLevel,
        nameKey: `ring.procedural.name`,
        tierGateMultiplier,
        sectors,
        guardian: {
          id: `ring_${safeLevel}_guardian`,
          nameKey: `guardian.ring.name`,
          faction: guardianFaction,
          difficulty: guardianDifficulty,
          loot: guardianLoot,
          bonusWorkers: Math.min(5, Math.floor(safeLevel / 2)),
          isBoss: true,
          isGuardian: true
        }
      };
    }

    // --- STRATE DES ABÎMES ---
    const isGuardianStratum = (safeLevel % 5 === 0);
    const difficulty = computeZoneDifficulty(safeLevel, isGuardianStratum, config);
    const loot = computeZoneLoot(safeLevel, isGuardianStratum, config);
    const hardnessTier = Math.min(5, Math.ceil(safeLevel / 10));

    // Détermination de l'aléa environnemental de strate
    let hazard = null;
    const hazardsList = ['chasm_crevasse', 'abyssal_darkness', 'acidic_vapors', 'geothermal_vent'];
    if (safeLevel >= 3) {
      const hazardIndex = (safeLevel + seed) % hazardsList.length;
      const hazardKey = hazardsList[hazardIndex];
      const hzCfg = (config && config.EXPLORATION && config.EXPLORATION.hazards && config.EXPLORATION.hazards[hazardKey]) ||
                    EXPLORATION_DEFAULTS.hazards[hazardKey];
      hazard = hzCfg || null;
    }

    // Filon minéral découvert
    const mineral = safeLevel <= 10 ? 'flint' : 'obsidian';

    let guardian = null;
    if (isGuardianStratum) {
      guardian = {
        id: `abyss_guardian_${safeLevel}`,
        nameKey: `guardian.abyss.${safeLevel}.name`,
        stratum: safeLevel,
        difficulty,
        loot,
        isBoss: true,
        isGuardian: true
      };
    }

    return {
      axis: 'stratum',
      level: safeLevel,
      difficulty,
      loot,
      hardnessTier,
      hazard,
      mineral,
      isGuardian: isGuardianStratum,
      guardian,
      tierGateMultiplier,
      popCapBonus: EXPLORATION_DEFAULTS.abyss.popCapPerStratum
    };
  }

  // =========================================================================
  // 4. PONTS VIVANTS D'OUVRIÈRES (formLivingBridge / releaseLivingBridge)
  // =========================================================================

  /**
   * Mobilise un groupe d'ouvrières pour former un Pont Vivant.
   * Fonction pure et défensive.
   *
   * @param {Object} state État de jeu
   * @param {'surface'|'crevasse'} [bridgeType='surface'] Type d'utilisation du pont
   * @param {Object} [config=GAME_CONFIG] Configuration
   * @returns {{ success: boolean, nextState: Object, reason: string }}
   */
  function formLivingBridge(state, bridgeType = 'surface', config) {
    if (!state) return { success: false, nextState: state, reason: 'INVALID_STATE' };
    const activeCfg = config || root.GAME_CONFIG || getConfig();
    const next = JSON.parse(JSON.stringify(state));
    const cfg = (activeCfg && activeCfg.EXPLORATION && activeCfg.EXPLORATION.livingBridge) || EXPLORATION_DEFAULTS.livingBridge;
    const req = cfg.requiredWorkers || 5;

    if (!next.exploration) {
      next.exploration = { livingBridges: { surfaceHarvest: false, activeBridgeWorkers: 0 } };
    }
    if (!next.exploration.livingBridges) {
      next.exploration.livingBridges = { surfaceHarvest: false, activeBridgeWorkers: 0 };
    }

    const currentBridge = next.exploration.livingBridges;
    if (bridgeType === 'surface' && currentBridge.surfaceHarvest) {
      return { success: false, nextState: next, reason: 'ALREADY_ACTIVE' };
    }

    const totalWorkers = (next.ants && Number(next.ants.worker)) || 0;
    const currentActiveWorkers = currentBridge.activeBridgeWorkers || 0;
    const availableWorkers = Math.max(0, totalWorkers - currentActiveWorkers);

    if (availableWorkers < req) {
      return { success: false, nextState: next, reason: 'INSUFFICIENT_WORKERS' };
    }

    if (bridgeType === 'surface') {
      currentBridge.surfaceHarvest = true;
    }
    currentBridge.activeBridgeWorkers = (currentBridge.activeBridgeWorkers || 0) + req;

    return {
      success: true,
      nextState: next,
      reason: 'OK'
    };
  }

  /**
   * Rappelle et libère les ouvrières mobilisées dans un Pont Vivant.
   */
  function releaseLivingBridge(state, bridgeType = 'surface', config) {
    if (!state || !state.exploration || !state.exploration.livingBridges) {
      return { success: false, nextState: state, reason: 'NO_ACTIVE_BRIDGE' };
    }
    const activeCfg = config || root.GAME_CONFIG || getConfig();
    const next = JSON.parse(JSON.stringify(state));
    const currentBridge = next.exploration.livingBridges;
    const cfg = (activeCfg && activeCfg.EXPLORATION && activeCfg.EXPLORATION.livingBridge) || EXPLORATION_DEFAULTS.livingBridge;
    const req = cfg.requiredWorkers || 5;

    if (bridgeType === 'surface') {
      if (!currentBridge.surfaceHarvest) {
        return { success: false, nextState: next, reason: 'BRIDGE_NOT_ACTIVE' };
      }
      currentBridge.surfaceHarvest = false;
      currentBridge.activeBridgeWorkers = Math.max(0, (currentBridge.activeBridgeWorkers || req) - req);
    } else {
      currentBridge.activeBridgeWorkers = Math.max(0, (currentBridge.activeBridgeWorkers || req) - req);
    }

    return {
      success: true,
      nextState: next,
      reason: 'OK'
    };
  }

  // =========================================================================
  // 5. AMBRE 🟠 & RELIQUES ANCESTRALES (upgradeRelicPure & computeRelicModifiers)
  // =========================================================================

  /**
   * Calcule le coût en Ambre 🟠 d'une relique selon son niveau actuel.
   * C(lvl) = baseCost * (costMultiplier ^ lvl)
   */
  function computeRelicCost(relicId, currentLevel = 0, config) {
    const activeCfg = config || root.GAME_CONFIG || getConfig();
    const relicsCfg = (activeCfg && activeCfg.EXPLORATION && activeCfg.EXPLORATION.relics) || EXPLORATION_DEFAULTS.relics;
    const r = relicsCfg[relicId];
    if (!r) return Infinity;
    const lvl = Math.max(0, Math.floor(Number(currentLevel) || 0));
    return Math.round(r.baseCost * Math.pow(r.costMultiplier || 1.6, lvl));
  }

  /**
   * Améliore purement une Relique Ancestrale avec l'Ambre de la colonie.
   */
  function upgradeRelicPure(state, relicId, config) {
    if (!state) return { success: false, nextState: state, reason: 'INVALID_STATE' };
    const activeCfg = config || root.GAME_CONFIG || getConfig();
    const relicsCfg = (activeCfg && activeCfg.EXPLORATION && activeCfg.EXPLORATION.relics) || EXPLORATION_DEFAULTS.relics;
    if (!relicsCfg[relicId]) {
      return { success: false, nextState: state, reason: 'UNKNOWN_RELIC' };
    }

    const next = JSON.parse(JSON.stringify(state));
    if (!next.exploration) next.exploration = {};
    if (!next.exploration.relics) next.exploration.relics = {};

    const curLvl = Math.max(0, Number(next.exploration.relics[relicId]) || 0);
    const cost = computeRelicCost(relicId, curLvl, config);
    const curAmber = Math.max(0, (next.resources && Number(next.resources.amber)) || Number(next.amber) || 0);

    if (curAmber < cost) {
      return { success: false, nextState: next, cost, reason: 'INSUFFICIENT_AMBER' };
    }

    // Déduction d'Ambre (miroir et resources)
    const newAmber = Math.round((curAmber - cost) * 10) / 10;
    if (!next.resources) next.resources = {};
    next.resources.amber = newAmber;
    next.amber = newAmber;

    // Incrément de niveau de relique
    next.exploration.relics[relicId] = curLvl + 1;

    return {
      success: true,
      nextState: next,
      cost,
      newLevel: curLvl + 1,
      reason: 'OK'
    };
  }

  /**
   * Calcule tous les modificateurs de combat, économie et incubation
   * apportés par les Reliques Ancestrales et la profondeur des Abîmes.
   * Injecté dans computeModifiers (combat.js).
   */
  function computeRelicModifiers(state, config) {
    const activeCfg = config || root.GAME_CONFIG || getConfig();
    const s = state || {};
    const exp = s.exploration || {};
    const relics = exp.relics || {};
    const abyssDepth = Math.max(0, Number(exp.abyssDepth) || 0);

    const queenAmberLvl = Math.max(0, Number(relics.queen_amber) || 0);
    const fossilMandibleLvl = Math.max(0, Number(relics.fossil_mandible) || 0);
    const eternalSporeLvl = Math.max(0, Number(relics.eternal_spore) || 0);
    const solarSapLvl = Math.max(0, Number(relics.solar_sap) || 0);

    // Relique 1 : Ambre de la Reine
    const queenHpBonus = queenAmberLvl * 25;
    const queenHealBonus = queenAmberLvl * 0.10;

    // Relique 2 : Mandibule Fossile
    const militaryPowerMultiplier = 1 + (fossilMandibleLvl * 0.08);

    // Relique 3 : Spore Éternelle
    const fungusMultiplier = 1 + (eternalSporeLvl * 0.15);
    const compostYieldBonus = eternalSporeLvl * 0.10;

    // Relique 4 : Sève Solaire
    const incubationSpeedMultiplier = 1 + (solarSapLvl * 0.10);
    const winterWorkerFoodBonus = solarSapLvl * 0.15;

    // Chaleur Géothermique des Abîmes (+2% atténuation du malus hivernal par strate)
    const geothermalMitigation = Math.min(0.80, abyssDepth * 0.02);

    // Bonus de récolte par Pont Vivant
    const livingBridgeActive = Boolean(exp.livingBridges && exp.livingBridges.surfaceHarvest);
    const livingBridgeHarvestBonus = livingBridgeActive ? 0.25 : 0.0;

    return {
      queenHpBonus,
      queenHealBonus,
      militaryPowerMultiplier,
      fungusMultiplier,
      compostYieldBonus,
      incubationSpeedMultiplier,
      winterWorkerFoodBonus,
      geothermalMitigation,
      livingBridgeActive,
      livingBridgeHarvestBonus,
      abyssDepth,
      relicLevels: {
        queen_amber: queenAmberLvl,
        fossil_mandible: fossilMandibleLvl,
        eternal_spore: eternalSporeLvl,
        solar_sap: solarSapLvl
      }
    };
  }

  // =========================================================================
  // 6. FORAGE DES ABÎMES & DÉCOUVERTE GÉOTHERMIQUE (drillStratumPure)
  // =========================================================================

  /**
   * Fait forer la colonie vers la strate suivante des Abîmes.
   */
  function drillStratumPure(state, config) {
    if (!state) return { success: false, nextState: state, reason: 'INVALID_STATE' };
    const activeCfg = config || root.GAME_CONFIG || getConfig();
    const next = JSON.parse(JSON.stringify(state));
    if (!next.exploration) next.exploration = {};

    const curDepth = Math.max(0, Number(next.exploration.abyssDepth) || 0);
    const targetDepth = curDepth + 1;

    // Vérification : si la strate précédente était un Gardien non vaincu
    if (curDepth > 0 && curDepth % 5 === 0) {
      const def = next.exploration.abyssGuardiansDefeated || {};
      if (!def[curDepth]) {
        return { success: false, nextState: next, reason: 'GUARDIAN_NOT_DEFEATED', requiredGuardianDepth: curDepth };
      }
    }

    const stratumInfo = generateZone({ axis: 'stratum', level: targetDepth, config });

    next.exploration.abyssDepth = targetDepth;
    next.exploration.maxAbyssDepth = Math.max(next.exploration.maxAbyssDepth || 0, targetDepth);
    next.exploration.activeHazard = stratumInfo.hazard ? stratumInfo.hazard.id : null;

    // Récompense immédiate de forage : Ambre si strate de Gardien
    if (stratumInfo.isGuardian && stratumInfo.loot.amber > 0) {
      const curAmber = Math.max(0, (next.resources && Number(next.resources.amber)) || Number(next.amber) || 0);
      const newAmber = curAmber + stratumInfo.loot.amber;
      if (!next.resources) next.resources = {};
      next.resources.amber = newAmber;
      next.amber = newAmber;
    }

    return {
      success: true,
      nextState: next,
      stratumInfo,
      reason: 'OK'
    };
  }

  // =========================================================================
  // 7. ACTIONS D'INTERFACE INTERACTIVE (COMMUTATION D'ÉTAT & NOTIFICATIONS)
  // =========================================================================

  function formLivingBridgeAction(bridgeType = 'surface') {
    const state = root.gameState;
    if (!state) return false;
    const res = formLivingBridge(state, bridgeType);
    if (!res.success) {
      if (typeof root.playSfx === 'function') root.playSfx('denied');
      return false;
    }
    root.gameState = res.nextState;
    if (typeof root.logMessageKey === 'function') {
      root.logMessageKey('log.bridge_formed', {}, 'exploration');
    }
    if (typeof root.playSfx === 'function') root.playSfx('build');
    if (typeof root.saveGame === 'function') root.saveGame();
    if (typeof root.updateUI === 'function') root.updateUI();
    return true;
  }

  function releaseLivingBridgeAction(bridgeType = 'surface') {
    const state = root.gameState;
    if (!state) return false;
    const res = releaseLivingBridge(state, bridgeType);
    if (!res.success) {
      if (typeof root.playSfx === 'function') root.playSfx('denied');
      return false;
    }
    root.gameState = res.nextState;
    if (typeof root.logMessageKey === 'function') {
      root.logMessageKey('log.bridge_released', {}, 'exploration');
    }
    if (typeof root.playSfx === 'function') root.playSfx('click');
    if (typeof root.saveGame === 'function') root.saveGame();
    if (typeof root.updateUI === 'function') root.updateUI();
    return true;
  }

  function drillStratumAction() {
    const state = root.gameState;
    if (!state) return false;
    const res = drillStratumPure(state);
    if (!res.success) {
      if (typeof root.playSfx === 'function') root.playSfx('denied');
      return false;
    }
    root.gameState = res.nextState;
    if (typeof root.logMessageKey === 'function') {
      root.logMessageKey('log.abyss_drilled', { depth: res.stratumInfo.level }, 'exploration');
    }
    if (typeof root.playSfx === 'function') root.playSfx('upgrade');
    if (typeof root.saveGame === 'function') root.saveGame();
    if (typeof root.updateUI === 'function') root.updateUI();
    return true;
  }

  function upgradeRelicAction(relicId) {
    const state = root.gameState;
    if (!state) return false;
    const res = upgradeRelicPure(state, relicId);
    if (!res.success) {
      if (typeof root.playSfx === 'function') root.playSfx('denied');
      return false;
    }
    root.gameState = res.nextState;
    if (typeof root.logMessageKey === 'function') {
      const relicName = typeof root.t === 'function' ? root.t(`relic.${relicId}.name`) : relicId;
      root.logMessageKey('log.relic_upgraded', { name: relicName, lvl: res.newLevel }, 'loot');
    }
    if (typeof root.playSfx === 'function') root.playSfx('upgrade');
    if (typeof root.saveGame === 'function') root.saveGame();
    if (typeof root.updateUI === 'function') root.updateUI();
    return true;
  }

  // =========================================================================
  // 8. EXPOSITION UNIVERSELLE (BROWSER + NODE.JS)
  // =========================================================================

  const API = {
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
  };

  Object.assign(root, API);
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
