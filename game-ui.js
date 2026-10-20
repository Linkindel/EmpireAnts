/**
 * Empire Fourmi - Couche de Présentation DOM, Ergonomie, Navigation & Moteur Audio (game-ui.js)
 * Architecture Senior SOLID :
 * - Séparation stricte de la présentation (DOM/Audio) et de la simulation métier.
 * - Registre universel de navigation par onglets & sous-onglets (UI_PANELS).
 * - Moteur WebAudio procédural avec pitch jitter configurable et ambiance souterraine.
 * - HUD analytique bilingue, badges dynamiques et commandes rapides (raccourcis clavier).
 */

(function (root) {
  'use strict';

  // --- RÉCUPÉRATION SÉCURISÉE DES DÉPENDANCES ---
  const CONFIG = () => root.GAME_CONFIG || {};
  const STATE = () => root.gameState || {};
  const t = (key, params) => (typeof root.t === 'function' ? root.t(key, params) : key);

  // --- UTILITAIRES DOM SÉCURISÉS (PROGRAMMATION DÉFENSIVE) ---
  function getEl(id) {
    return typeof document !== 'undefined' ? document.getElementById(id) : null;
  }

  function setText(id, val) {
    const el = getEl(id);
    if (el) el.textContent = String(val);
  }

  function setDisabled(id, isDisabled) {
    const el = getEl(id);
    if (el) el.disabled = Boolean(isDisabled);
  }

  // =========================================================================
  // 1. FORMATEUR DE GRANDS NOMBRES (formatLargeNumber - PURE ET RÉSILIENNE)
  // =========================================================================

  /**
   * Formate un nombre quelconque en notation compacte ou scientifique.
   * Gère les nombres de 0 à 10^100, les valeurs négatives, NaN et Infinity.
   *
   * @param {number|string} value Valeur numérique à formater
   * @param {string} [lang='fr'] Langue active ('fr' ou 'en')
   * @param {string} [notationMode='compact'] Mode de notation ('compact' ou 'full')
   * @returns {string} Texte formaté lisible
   */
  function formatLargeNumber(value, lang = 'fr', notationMode = 'compact') {
    const num = Number(value);

    if (num === null || num === undefined || Number.isNaN(num)) {
      return '0';
    }

    const isFr = (lang === 'fr') || (!lang && STATE().lang === 'fr');
    const decimalSep = isFr ? ',' : '.';

    if (!Number.isFinite(num)) {
      if (num === Infinity) return isFr ? 'Infini' : 'Infinity';
      if (num === -Infinity) return isFr ? '-Infini' : '-Infinity';
      return '0';
    }

    if (num === 0) return '0';

    const isNegative = num < 0;
    const abs = Math.abs(num);

    const cfg = (CONFIG().NUMBER_FORMAT) || {
      suffixes: ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'],
      scientificThreshold: 1e36
    };
    const threshold = cfg.scientificThreshold || 1e36;

    // Si notation scientifique explicite ou au-delà du seuil de suffixe
    if (abs >= 1000 && (notationMode === 'scientific' || abs >= threshold)) {
      const expStr = abs.toExponential(2);
      const parts = expStr.split('e');
      const mantissa = parts[0].replace('.', decimalSep);
      const exponent = parts[1].replace('+', '');
      return (isNegative ? '-' : '') + `${mantissa}e${exponent}`;
    }

    // Nombres inférieurs à 1 000
    if (abs < 1000) {
      let formatted;
      if (Number.isInteger(abs)) {
        formatted = String(abs);
      } else {
        formatted = (Math.round(abs * 10) / 10).toFixed(1);
        if (formatted.endsWith('.0') || formatted.endsWith(',0')) {
          formatted = String(Math.round(abs));
        } else {
          formatted = formatted.replace('.', decimalSep);
        }
      }
      return (isNegative ? '-' : '') + formatted;
    }

    const suffixes = cfg.suffixes || ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
    const tier = Math.min(suffixes.length - 1, Math.floor(Math.log10(abs) / 3));
    const suffix = suffixes[tier] || '';
    const scaled = abs / Math.pow(10, tier * 3);

    let decimals = 1;
    if (scaled >= 100) {
      decimals = 0;
    } else if (scaled < 10) {
      decimals = 2;
    }

    let roundedStr = scaled.toFixed(decimals);
    roundedStr = roundedStr.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    roundedStr = roundedStr.replace('.', decimalSep);

    return (isNegative ? '-' : '') + roundedStr + suffix;
  }

  // =========================================================================
  // 2. BILAN ÉCONOMIQUE & POPOVER ANALYTIQUE (getEconomyBreakdown)
  // =========================================================================

  /**
   * Calcule le détail pur des revenus, dépenses, solde net et ETA (timeToFull / timeToEmpty).
   * Assertion stricte : breakdown.food.net === getNetFoodPerSec(state).
   *
   * @param {Object} [state=gameState] État de la simulation
   * @returns {Object} Analyse détaillée par ressource avec ETA prédictif
   */
  function getEconomyBreakdown(state = STATE()) {
    const s = state || {};
    const ants = s.ants || {};
    const rooms = s.rooms || {};
    const eco = CONFIG().ECONOMY || { basePopCap: 15, baseFoodConsumptionPerAnt: 0.08, basePheromoneGain: 0.2 };
    const castes = CONFIG().CASTES || {
      worker: { foodProd: 0.55 },
      tank: { extraUpkeep: 0.12 },
      warrior: { extraUpkeep: 0.06 },
      nurse: { extraUpkeep: 0 },
      scout: { pheroProd: 0.35 }
    };

    const getSeason = typeof root.getCurrentSeasonConfig === 'function'
      ? root.getCurrentSeasonConfig
      : () => (CONFIG().SEASONS && CONFIG().SEASONS.summer) || { workerFoodMultiplier: 1.0 };
    const season = getSeason(s);
    const seasonWorkerMult = (season && season.workerFoodMultiplier) !== undefined ? season.workerFoodMultiplier : 1.0;

    const getMods = typeof root.computeModifiers === 'function'
      ? root.computeModifiers
      : () => ({ fungusProductionMultiplier: 1.0, nurseCount: ants.nurse || 0 });
    const mods = getMods(s);

    const workerCount = ants.worker || 0;
    const workerRate = (castes.worker && castes.worker.foodProd !== undefined) ? castes.worker.foodProd : 0.55;
    const surfaceMult = (mods && mods.workerFoodMultiplier !== undefined) ? mods.workerFoodMultiplier : seasonWorkerMult;
    const workersIncome = workerCount * workerRate * surfaceMult;

    const fungusLvl = rooms.fungus || 0;
    const fungusProdRate = (CONFIG().ROOMS && CONFIG().ROOMS.fungus && CONFIG().ROOMS.fungus.foodPerLevel) || 1.2;
    const fungusIncome = fungusLvl * fungusProdRate * (mods.fungusProductionMultiplier || 1.0);

    const totalPop = (ants.worker || 0) + (ants.scout || 0) + (ants.warrior || 0) + (ants.tank || 0) + (ants.nurse || 0);
    const baseConsumption = totalPop * (eco.baseFoodConsumptionPerAnt || 0.08);

    const tankUpkeepRate = (castes.tank && castes.tank.extraUpkeep !== undefined) ? castes.tank.extraUpkeep : 0.12;
    const warriorUpkeepRate = (castes.warrior && castes.warrior.extraUpkeep !== undefined) ? castes.warrior.extraUpkeep : 0.06;
    const nurseUpkeepRate = (castes.nurse && castes.nurse.extraUpkeep !== undefined) ? castes.nurse.extraUpkeep : 0;

    const tankUpkeep = (ants.tank || 0) * tankUpkeepRate;
    const warriorUpkeep = (ants.warrior || 0) * warriorUpkeepRate;
    const nurseUpkeep = (ants.nurse || 0) * nurseUpkeepRate;
    const totalExtraUpkeep = tankUpkeep + warriorUpkeep + nurseUpkeep;

    const totalFoodIncome = workersIncome + fungusIncome;
    const totalFoodExpense = baseConsumption + totalExtraUpkeep;
    const netFood = totalFoodIncome - totalFoodExpense;

    const scoutCount = ants.scout || 0;
    const basePhero = eco.basePheromoneGain || 0.2;
    const scoutPheroRate = (castes.scout && castes.scout.pheroProd !== undefined) ? castes.scout.pheroProd : 0.35;
    const scoutPhero = scoutCount * scoutPheroRate;
    const totalPheroIncome = basePhero + scoutPhero;

    // Prédicteur Temporel (ETA) : timeToFull & timeToEmpty en secondes
    const maxFood = (s && s.maxFood) || 180;
    const currentFood = (s && s.food) || 0;
    let timeToFull = null;
    let timeToEmpty = null;

    if (netFood > 0) {
      timeToFull = currentFood >= maxFood ? 0 : Math.round(((maxFood - currentFood) / netFood) * 10) / 10;
    } else if (netFood < 0) {
      timeToEmpty = currentFood <= 0 ? 0 : Math.round((currentFood / Math.abs(netFood)) * 10) / 10;
    }

    return {
      food: {
        income: {
          workers: workersIncome,
          fungus: fungusIncome,
          total: totalFoodIncome
        },
        expense: {
          baseConsumption,
          tankUpkeep,
          warriorUpkeep,
          nurseUpkeep,
          total: totalFoodExpense
        },
        net: netFood,
        timeToFull,
        timeToEmpty
      },
      pheromone: {
        income: {
          base: basePhero,
          scouts: scoutPhero,
          total: totalPheroIncome
        },
        expense: {
          total: 0
        },
        net: totalPheroIncome,
        timeToFull: null,
        timeToEmpty: null
      }
    };
  }

  // =========================================================================
  // 3. BADGES DE NOTIFICATION & ESTIMATIONS (computeTabBadges)
  // =========================================================================

  /**
   * Calcule les pastilles de notification sur les onglets et sous-onglets.
   *
   * @param {Object} [state=gameState] État de la colonie
   * @returns {Object.<string, boolean|number>} Indicateurs par panneau
   */
  function computeTabBadges(state = STATE()) {
    const s = state || {};
    const rooms = s.rooms || {};
    const food = s.food || 0;
    const phero = s.pheromone || 0;
    const rCfg = (CONFIG().ROOMS) || {};
    const mutCfg = (CONFIG().MUTATIONS) || {};

    let canUpgradeRoom = false;
    ['queen', 'granary', 'dorm', 'barricade', 'fungus'].forEach(rKey => {
      const room = rCfg[rKey];
      if (room && typeof room.cost === 'function') {
        const lvl = rooms[rKey] || 0;
        if (food >= room.cost(lvl)) {
          canUpgradeRoom = true;
        }
      }
    });

    let canAffordMutation = false;
    const mutState = s.mutations || {};
    Object.values(mutCfg).forEach(m => {
      if (!mutState[m.id] && phero >= m.cost) {
        canAffordMutation = true;
      }
    });

    const hasUnreadReport = Boolean(s.lastBattleReport && !s.lastBattleReportViewed);

    return {
      colony: canUpgradeRoom,
      rooms: canUpgradeRoom,
      roomsCount: canUpgradeRoom ? 1 : 0,
      nursery: 0,
      army: hasUnreadReport,
      battle_report: hasUnreadReport,
      squad: 0,
      exploration: 0,
      evolution: canAffordMutation,
      mutations: canAffordMutation,
      mutationsCount: canAffordMutation ? 1 : 0,
      workshop: false,
      world: false,
      log: 0
    };
  }

  // =========================================================================
  // 4. MOTEUR AUDIO PROCÉDURAL WEBAUDIO & PAYSAGE SONORE ADAPTATIF
  // =========================================================================

  let audioCtx = null;
  let ambienceSource = null;
  let ambienceGainNode = null;
  let ambienceFilter = null;

  function ensureAudioContext() {
    if (typeof window === 'undefined') return null;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx) {
      try {
        audioCtx = new AudioContextClass();
      } catch (e) {
        return null;
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      const p = audioCtx.resume();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {});
      }
    }
    return audioCtx;
  }

  /**
   * Joue un effet sonore procédural synthétisé par la Web Audio API.
   * Consomme GAME_CONFIG.AUDIO.sfx avec variation de hauteur (pitch jitter).
   */
  function playSfx(type, options = {}) {
    const s = STATE();
    if (s.soundEnabled === false) return;
    const ctx = ensureAudioContext();
    if (!ctx) return;

    const audioCfg = (CONFIG().AUDIO) || {};
    const sfxMap = audioCfg.sfx || {};
    const sfxKey = (type === 'raid') ? 'raid_alert' : type;
    const soundData = sfxMap[sfxKey];

    const randomFn = (options && typeof options.randomFn === 'function') ? options.randomFn : Math.random;
    const jitterFactor = (options && options.pitchJitter !== undefined)
      ? options.pitchJitter
      : (audioCfg.pitchJitter || 0.04);
    const pitchMod = 1 + (randomFn() * 2 - 1) * jitterFactor;

    try {
      const now = ctx.currentTime;
      const masterVol = audioCfg.masterVolume || 0.15;

      if (sfxKey === 'upgrade') {
        const notes = (soundData && soundData.notes) || [523.25, 659.25, 783.99];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq * pitchMod, now + idx * 0.05);
          gain.gain.setValueAtTime((soundData && soundData.volume || 0.08) * masterVol, now + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.22);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.22);
        });
        return;
      }

      if (sfxKey === 'victory') {
        const notes = (soundData && soundData.notes) || [440, 554.37, 659.25, 880];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq * pitchMod, now + idx * 0.07);
          gain.gain.setValueAtTime((soundData && soundData.volume || 0.09) * masterVol, now + idx * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.07);
          osc.stop(now + idx * 0.07 + 0.25);
        });
        return;
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const dur = (soundData && soundData.duration) || 0.08;
      const vol = ((soundData && soundData.volume) || 0.08) * masterVol;
      const oscType = (soundData && soundData.type) || 'sine';
      const startFreq = ((soundData && soundData.startFreq) || 440) * pitchMod;
      const endFreq = ((soundData && soundData.endFreq) || 660) * pitchMod;

      osc.type = oscType;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + dur);

      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc.start(now);
      osc.stop(now + dur);
    } catch (err) {
      // Échec silencieux
    }
  }

  function startUndergroundAmbience() {
    const s = STATE();
    if (!s.soundEnabled || s.ambienceEnabled === false) return;
    const ctx = ensureAudioContext();
    if (!ctx) return;
    if (ambienceSource) return;

    try {
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;

      // Synthèse de bruit brun (Brown Noise) doux
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      }

      ambienceSource = ctx.createBufferSource();
      ambienceSource.buffer = buffer;
      ambienceSource.loop = true;

      ambienceFilter = ctx.createBiquadFilter();
      ambienceFilter.type = 'lowpass';
      ambienceFilter.frequency.setValueAtTime(180, ctx.currentTime);

      ambienceGainNode = ctx.createGain();
      const ambVol = (CONFIG().AUDIO && CONFIG().AUDIO.ambience && CONFIG().AUDIO.ambience.volume) || 0.04;
      ambienceGainNode.gain.setValueAtTime(ambVol, ctx.currentTime);

      ambienceSource.connect(ambienceFilter);
      ambienceFilter.connect(ambienceGainNode);
      ambienceGainNode.connect(ctx.destination);

      ambienceSource.start();
    } catch (e) {
      ambienceSource = null;
    }
  }

  function stopUndergroundAmbience() {
    if (ambienceSource) {
      try {
        ambienceSource.stop();
        ambienceSource.disconnect();
      } catch (e) {}
      ambienceSource = null;
      ambienceGainNode = null;
      ambienceFilter = null;
    }
  }

  /**
   * Adapte le paysage sonore procédural selon la saison active et l'imminence des raids.
   */
  function updateAmbientSoundscape(state = STATE()) {
    const s = state || {};
    if (!s.soundEnabled || s.ambienceEnabled === false) {
      stopUndergroundAmbience();
      return;
    }
    if (!ambienceSource) {
      startUndergroundAmbience();
    }
    if (audioCtx && ambienceFilter) {
      const season = typeof root.getCurrentSeasonConfig === 'function' ? root.getCurrentSeasonConfig(s) : { id: 'summer' };
      const seasonId = (season && season.id) || 'summer';
      const targetFreq = (seasonId === 'winter') ? 120 : ((seasonId === 'summer') ? 220 : 170);
      try {
        ambienceFilter.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.5);
      } catch (e) {}
    }
  }

  // Coupure automatique de l'ambiance si l'onglet est masqué
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopUndergroundAmbience();
      } else if (STATE().soundEnabled && STATE().ambienceEnabled !== false) {
        startUndergroundAmbience();
      }
    });
  }

  // =========================================================================
  // 4b. BOUSSOLE D'OBJECTIFS DYNAMIQUE & ÉPINGLAGE (Lot 3)
  // =========================================================================

  /**
   * Évalue l'avancement de la colonie et retourne en permanence 1 objectif court terme
   * et 1 défi majeur d'Acte avec pourcentage de complétion.
   *
   * @param {Object} [state=gameState] État de la colonie
   * @returns {{ shortTerm: Object, major: Object }} Objectifs actifs
   */
  function getNextMilestoneGoal(state = STATE()) {
    const s = state || {};
    const cfg = (CONFIG().MILESTONE_GOALS) || { shortTerm: [], majorMilestones: [] };
    const ants = s.ants || {};
    const rooms = s.rooms || {};
    const totalPop = (ants.worker || 0) + (ants.scout || 0) + (ants.warrior || 0) + (ants.tank || 0) + (ants.nurse || 0);

    // 1. Évaluation de l'objectif court terme actif
    let shortTerm = null;
    const shortGoals = cfg.shortTerm || [];
    for (let i = 0; i < shortGoals.length; i++) {
      const goal = shortGoals[i];
      let cur = 0;
      let target = goal.target;
      if (goal.type === 'ants_total') {
        cur = totalPop;
      } else if (goal.type === 'room_level') {
        cur = (rooms[goal.room] || 0);
      } else if (goal.type === 'squad_strength') {
        const sq = s.squad || {};
        const reqW = (goal.target && goal.target.warrior) || 0;
        const reqT = (goal.target && goal.target.tank) || 0;
        cur = Math.min(sq.warrior || 0, reqW) + Math.min(sq.tank || 0, reqT);
        target = reqW + reqT;
      } else if (goal.type === 'resource') {
        cur = Math.floor(s[goal.resource] || 0);
      }
      const pct = Math.min(100, Math.floor((cur / Math.max(1, target)) * 100));
      const completed = cur >= target;
      if (!completed) {
        shortTerm = {
          id: goal.id,
          i18nKey: goal.i18nKey,
          progress: cur,
          max: target,
          percent: pct,
          completed: false
        };
        break;
      }
    }
    if (!shortTerm && shortGoals.length > 0) {
      const last = shortGoals[shortGoals.length - 1];
      shortTerm = { id: last.id, i18nKey: last.i18nKey, progress: last.target, max: last.target, percent: 100, completed: true };
    }

    // 2. Évaluation du défi majeur d'Acte
    let major = null;
    const majorGoals = cfg.majorMilestones || [];
    for (let j = 0; j < majorGoals.length; j++) {
      const goal = majorGoals[j];
      let cur = 0;
      let target = goal.target || 1;
      if (goal.type === 'boss') {
        cur = (s.bossesDefeated && s.bossesDefeated[goal.bossId]) ? 1 : 0;
      } else if (goal.type === 'ants_total') {
        cur = totalPop;
      } else if (goal.type === 'prestige') {
        cur = (s.royalDna > 0 || (s.stats && s.stats.prestigesCount > 0)) ? 1 : 0;
      }
      const pct = Math.min(100, Math.floor((cur / Math.max(1, target)) * 100));
      const completed = cur >= target;
      if (!completed) {
        major = {
          id: goal.id,
          i18nKey: goal.i18nKey,
          progress: cur,
          max: target,
          percent: pct,
          completed: false
        };
        break;
      }
    }
    if (!major && majorGoals.length > 0) {
      const last = majorGoals[majorGoals.length - 1];
      major = { id: last.id, i18nKey: last.i18nKey, progress: last.target, max: last.target, percent: 100, completed: true };
    }

    return { shortTerm, major };
  }

  /**
   * Calcule le compte à rebours estimé (ETA) avant de pouvoir acheter un objectif épinglé.
   *
   * @param {Object} [state=gameState] État de la colonie
   * @param {Object} target Cible épinglée ({ type: 'room', id: 'fungus' } ou { cost: 60, res: 'food' })
   * @returns {Object|null} Détail de progression et secondes estimées
   */
  function computeTargetEta(state = STATE(), target = null) {
    if (!target) return null;
    const s = state || {};
    const breakdown = getEconomyBreakdown(s);

    let cost = 0;
    let resKey = 'food';

    if (typeof target.cost === 'number') {
      cost = target.cost;
      resKey = target.res || 'food';
    } else if (target.type === 'room') {
      const rCfg = (CONFIG().ROOMS && CONFIG().ROOMS[target.id]) || {};
      const lvl = (s.rooms && s.rooms[target.id]) || 0;
      cost = typeof rCfg.cost === 'function' ? rCfg.cost(lvl) : (rCfg.baseCost || 0);
      resKey = 'food';
    } else if (target.type === 'caste') {
      const cCfg = (CONFIG().CASTES && CONFIG().CASTES[target.id]) || {};
      cost = cCfg.cost || 10;
      resKey = 'food';
    } else if (target.type === 'mutation') {
      const mCfg = (CONFIG().MUTATIONS && CONFIG().MUTATIONS[target.id]) || {};
      cost = mCfg.cost || 20;
      resKey = 'pheromone';
    }

    const current = (s[resKey] || 0);
    const netRate = (breakdown[resKey] && breakdown[resKey].net) || 0;

    if (current >= cost) {
      return { cost, current, remaining: 0, netRate, etaSeconds: 0, ready: true, unreachable: false };
    }

    const remaining = cost - current;
    if (netRate <= 0) {
      return { cost, current, remaining, netRate, etaSeconds: Infinity, ready: false, unreachable: true };
    }

    const etaSeconds = Math.ceil(remaining / netRate);
    return { cost, current, remaining, netRate, etaSeconds, ready: false, unreachable: false };
  }

  // =========================================================================
  // 5. GESTION DES ONGLETS & SOUS-ONGLETS (NAVIGATION EXTENSIBLE UI_PANELS)
  // =========================================================================

  /**
   * Bascule vers un onglet principal et active son sous-onglet enregistré.
   *
   * @param {string} tabId Identifiant du panneau (ex: 'colony', 'army') ou ancien sous-onglet (ex: 'rooms')
   */
  function switchTab(tabId) {
    const s = STATE();
    const panels = (CONFIG().UI_PANELS) || {};

    // Rétrocompatibilité : si on appelle un sous-onglet existant (ex: 'rooms', 'squad', 'mutations')
    const panel = panels[tabId];
    let parentTab = tabId;
    let targetSubtab = null;

    if (panel && panel.parent) {
      parentTab = panel.parent;
      targetSubtab = tabId;
    }

    s.activeTab = parentTab;
    if (!s.activeSubtabs) s.activeSubtabs = {};
    if (targetSubtab) {
      s.activeSubtabs[parentTab] = targetSubtab;
    } else if (!s.activeSubtabs[parentTab]) {
      // Trouver le premier sous-onglet du panneau
      const firstChild = Object.values(panels).find(p => p.parent === parentTab);
      if (firstChild) s.activeSubtabs[parentTab] = firstChild.id;
    }

    // Mise à jour visuelle des boutons principaux
    const desktopBtns = document.querySelectorAll('#desktopTabs .tab-btn');
    const mobileBtns = document.querySelectorAll('#mobileNav .tab-btn');
    [...desktopBtns, ...mobileBtns].forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === parentTab);
    });

    // Mise à jour visuelle des conteneurs de contenu
    const allContents = document.querySelectorAll('.tab-content');
    allContents.forEach(c => c.classList.remove('active'));

    const activeContent = getEl(`tab-${parentTab}`) || (parentTab === 'army' ? getEl('tab-expeditions') : (parentTab === 'colony' ? getEl('tab-nursery') : (parentTab === 'evolution' ? getEl('tab-mutations') : null)));
    if (activeContent) activeContent.classList.add('active');

    // Mise à jour de la barre des sous-onglets
    renderSubTabsBar(parentTab);

    // Si on entre dans le panneau Armée et qu'un rapport existait, marquer comme vu
    if (parentTab === 'army' && s.activeSubtabs[parentTab] === 'battle_report') {
      s.lastBattleReportViewed = true;
    }

    updateTabBadgesUI();
    playSfx('click');
  }

  /**
   * Bascule vers un sous-onglet spécifique dans le panneau parent.
   */
  function switchSubtab(parentTab, subtabId) {
    const s = STATE();
    if (!s.activeSubtabs) s.activeSubtabs = {};
    s.activeSubtabs[parentTab] = subtabId;

    if (subtabId === 'battle_report') {
      s.lastBattleReportViewed = true;
    }

    renderSubTabsBar(parentTab);
    updateSubtabContentVisibility(parentTab, subtabId);
    updateTabBadgesUI();
    playSfx('click');
  }

  function renderSubTabsBar(parentTab) {
    const container = getEl('subTabsBar');
    if (!container) return;

    const panels = (CONFIG().UI_PANELS) || {};
    const s = STATE();
    const subPanels = Object.values(panels).filter(p => {
      if (p.parent !== parentTab) return false;
      if (typeof p.unlockCondition === 'function') {
        return p.unlockCondition(s);
      }
      return true;
    }).sort((a, b) => (a.order || 0) - (b.order || 0));

    if (subPanels.length <= 1) {
      container.style.display = 'none';
      container.innerHTML = '';
      return;
    }

    container.style.display = 'flex';
    const activeSub = (s.activeSubtabs && s.activeSubtabs[parentTab]) || (subPanels[0] && subPanels[0].id);
    const badges = computeTabBadges(s);

    container.innerHTML = subPanels.map(p => {
      const isActive = p.id === activeSub;
      const hasBadge = Boolean(badges[p.id]);
      const badgeHtml = hasBadge ? '<span class="tab-badge-dot"></span>' : '';
      return `
        <button class="subtab-btn ${isActive ? 'active' : ''}" data-parent="${parentTab}" data-subtab="${p.id}">
          <span class="subtab-icon">${p.icon}</span>
          <span class="subtab-label">${t(p.i18nKey)}</span>
          ${badgeHtml}
        </button>
      `;
    }).join('');

    if (typeof container.querySelectorAll === 'function') {
      container.querySelectorAll('.subtab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          switchSubtab(btn.dataset.parent, btn.dataset.subtab);
        });
      });
    }

    updateSubtabContentVisibility(parentTab, activeSub);
  }

  function updateSubtabContentVisibility(parentTab, activeSub) {
    const parentContainer = getEl(`tab-${parentTab}`) || (parentTab === 'army' ? getEl('tab-expeditions') : (parentTab === 'colony' ? getEl('tab-nursery') : (parentTab === 'evolution' ? getEl('tab-mutations') : null)));
    if (!parentContainer || typeof parentContainer.querySelectorAll !== 'function') return;

    const sections = parentContainer.querySelectorAll('[data-subtab-section]');
    if (sections.length === 0) return;

    sections.forEach(sec => {
      sec.style.display = (sec.dataset.subtabSection === activeSub) ? 'block' : 'none';
    });
  }

  function updateTabBadgesUI() {
    const s = STATE();
    const badges = computeTabBadges(s);

    const desktopBtns = document.querySelectorAll('#desktopTabs .tab-btn');
    const mobileBtns = document.querySelectorAll('#mobileNav .tab-btn');
    [...desktopBtns, ...mobileBtns].forEach(btn => {
      const tabId = btn.dataset.tab;
      const shouldShow = Boolean(badges[tabId]);
      let badgeEl = btn.querySelector('.tab-badge-dot');
      if (shouldShow) {
        if (!badgeEl) {
          badgeEl = document.createElement('span');
          badgeEl.className = 'tab-badge-dot';
          btn.appendChild(badgeEl);
        }
      } else if (badgeEl) {
        badgeEl.remove();
      }
    });
  }

  // =========================================================================
  // 6. SÉLECTEUR D'INCUBATION PAR LOTS (×1 / ×5 / Max)
  // =========================================================================

  function setIncubationMultiplier(mult) {
    const s = STATE();
    s.incubationMultiplier = mult;

    const btns = document.querySelectorAll('.mult-btn');
    btns.forEach(b => {
      b.classList.toggle('active', b.dataset.mult === String(mult));
    });

    playSfx('click');
    updateUI();
  }

  function initIncubationControls() {
    const container = getEl('incubationMultiplierGroup');
    if (!container) return;

    container.querySelectorAll('.mult-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.mult === 'max' ? 'max' : parseInt(btn.dataset.mult, 10);
        setIncubationMultiplier(val);
      });
    });
  }

  // =========================================================================
  // 7. RACCOURCIS CLAVIER (GAME_CONFIG.KEYBINDINGS)
  // =========================================================================

  function initKeybindings() {
    if (typeof document === 'undefined') return;

    document.addEventListener('keydown', (e) => {
      // Guard clauses : ignorer les saisies dans les formulaires et modales ouvertes
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const saveModal = getEl('saveModal');
      const offlineModal = getEl('offlineModal');
      if ((saveModal && saveModal.classList.contains('visible')) || (offlineModal && offlineModal.classList.contains('visible'))) {
        if (e.key === 'Escape') {
          if (typeof root.closeSaveModal === 'function') root.closeSaveModal();
          if (typeof root.closeOfflineModal === 'function') root.closeOfflineModal();
        }
        return;
      }

      const bindings = (CONFIG().KEYBINDINGS) || {
        pause: ' ',
        speed1: '1',
        speed2: '2',
        speed3: '3',
        tabColony: 'Alt+1',
        tabArmy: 'Alt+2',
        tabEvolution: 'Alt+3',
        tabWorkshop: 'Alt+4',
        tabWorld: 'Alt+5',
        tabLog: 'Alt+6'
      };

      // Pause (Espace)
      if (e.key === bindings.pause || e.code === 'Space') {
        e.preventDefault();
        const s = STATE();
        s.speed = s.speed === 0 ? 1 : 0;
        updateSpeedButtonsUI();
        playSfx('click');
        return;
      }

      // Vitesses (1, 2, 3)
      if (e.key === bindings.speed1) { STATE().speed = 1; updateSpeedButtonsUI(); playSfx('click'); return; }
      if (e.key === bindings.speed2) { STATE().speed = 2; updateSpeedButtonsUI(); playSfx('click'); return; }
      if (e.key === bindings.speed3) { STATE().speed = 3; updateSpeedButtonsUI(); playSfx('click'); return; }

      // Onglets (Alt + 1 à 6)
      if (e.altKey) {
        if (e.key === '1') { e.preventDefault(); switchTab('colony'); }
        else if (e.key === '2') { e.preventDefault(); switchTab('army'); }
        else if (e.key === '3') { e.preventDefault(); switchTab('evolution'); }
        else if (e.key === '4') { e.preventDefault(); switchTab('workshop'); }
        else if (e.key === '5') { e.preventDefault(); switchTab('world'); }
        else if (e.key === '6') { e.preventDefault(); switchTab('log'); }
      }
    });
  }

  function updateSpeedButtonsUI() {
    const spd = STATE().speed;
    const btns = {
      0: getEl('btnPause'),
      1: getEl('btnSpeed1'),
      2: getEl('btnSpeed2'),
      3: getEl('btnSpeed3')
    };
    Object.keys(btns).forEach(k => {
      if (btns[k]) btns[k].classList.toggle('active', Number(k) === spd);
    });
  }

  // =========================================================================
  // 8. SYNCHRONISATION UI & DOM (updateUI)
  // =========================================================================

  function updateUI() {
    if (typeof document === 'undefined') return;
    const s = STATE();
    const lang = s.lang || 'fr';
    const breakdown = getEconomyBreakdown(s);

    // --- Compteurs de ressources avec formatLargeNumber ---
    setText('resFood', formatLargeNumber(s.food || 0, lang));
    setText('resMaxFood', formatLargeNumber(s.maxFood || 180, lang));
    setText('resPheromone', formatLargeNumber(s.pheromone || 0, lang));

    // Jauges de delta /s
    const netFood = breakdown.food.net;
    const signFood = netFood >= 0 ? '+' : '';
    const deltaFoodEl = getEl('deltaFood');
    if (deltaFoodEl) {
      deltaFoodEl.textContent = `${signFood}${formatLargeNumber(netFood, lang)} 🍃/s`;
      deltaFoodEl.className = netFood >= 0 ? 'delta-positive' : 'delta-negative';
    }

    const netPhero = breakdown.pheromone.net;
    setText('deltaPheromone', `+${formatLargeNumber(netPhero, lang)} 🧪/s`);

    // Population & Reine
    const getPop = typeof root.getTotalPop === 'function' ? root.getTotalPop : () => 11;
    const getCap = typeof root.getPopCap === 'function' ? root.getPopCap : () => 15;
    const getRes = typeof root.getReservedPop === 'function' ? root.getReservedPop : () => 11;
    const totalPop = getPop(s);
    const popCap = getCap(s);
    const reservedPop = getRes(s);

    setText('resPop', totalPop);
    setText('resPopCap', popCap);
    setText('resQueenHealth', Math.round(s.queenHealth || 100));

    // Nouvelles Ressources du Lot 5 & Lot 7 (Ambre)
    const res = s.resources || {};
    setText('resTwigs', formatLargeNumber(s.twigs !== undefined ? s.twigs : (res.twigs || 0), lang));
    setText('resHoneydew', formatLargeNumber(s.honeydew !== undefined ? s.honeydew : (res.honeydew || 0), lang));
    setText('resChitin', formatLargeNumber(s.chitin !== undefined ? s.chitin : (res.chitin || 0), lang));
    setText('resSpores', formatLargeNumber(s.spores !== undefined ? s.spores : (res.spores || 0), lang));
    setText('resAmber', formatLargeNumber(s.amber !== undefined ? s.amber : (res.amber || 0), lang));

    // Saisons & Jour
    setText('hudDay', s.day || 1);
    const getSeason = typeof root.getCurrentSeasonConfig === 'function' ? root.getCurrentSeasonConfig : () => ({ icon: '🌸', nameKey: 'season.spring', descKey: 'season.spring.desc' });
    const curSeason = getSeason(s);
    setText('hudSeasonName', t(curSeason.nameKey));
    setText('hudSeasonDesc', t(curSeason.descKey));

    // Déclenchement de l'ambiance au premier besoin
    if (s.soundEnabled && s.ambienceEnabled !== false && !ambienceSource) {
      startUndergroundAmbience();
    }

    // Effectifs des castes
    const ants = s.ants || {};
    setText('countWorker', formatLargeNumber(ants.worker || 0, lang));
    setText('countScout', formatLargeNumber(ants.scout || 0, lang));
    setText('countWarrior', formatLargeNumber(ants.warrior || 0, lang));
    setText('countTank', formatLargeNumber(ants.tank || 0, lang));
    setText('countNurse', formatLargeNumber(ants.nurse || 0, lang));

    // Boutons d'incubation & gestion des multiplicateurs (Lot 3)
    const mult = s.incubationMultiplier || 1;
    const cMap = {
      worker: 'btnIncubateWorker',
      scout: 'btnIncubateScout',
      warrior: 'btnIncubateWarrior',
      tank: 'btnIncubateTank',
      nurse: 'btnIncubateNurse'
    };
    const castesCfg = (CONFIG().CASTES) || {};

    Object.keys(cMap).forEach(caste => {
      const cToken = castesCfg[caste] || { cost: 10 };
      const unitCost = cToken.cost;
      const spaceLeft = Math.max(0, popCap - reservedPop);
      const maxAffordable = Math.floor((s.food || 0) / unitCost);

      let batchCount = 1;
      if (mult === 'max') {
        batchCount = Math.max(1, Math.min(spaceLeft, maxAffordable));
      } else if (typeof mult === 'number') {
        batchCount = mult;
      }

      const totalCost = batchCount * unitCost;
      const btn = getEl(cMap[caste]);
      if (btn) {
        btn.disabled = (s.food < unitCost) || (reservedPop >= popCap);
        const costLabel = btn.querySelector('.caste-btn-cost');
        if (costLabel) {
          costLabel.textContent = `${formatLargeNumber(totalCost, lang)} 🍃`;
        }
      }
    });

    // Salles et Galeries (Lots 3 & 5 : aphid_farm, masonry_hall)
    const rCfg = (CONFIG().ROOMS) || {};
    const rooms = s.rooms || {};
    const activeConstructions = Array.isArray(s.activeConstructions) ? s.activeConstructions : [];
    const buildQueue = Array.isArray(s.buildQueue) ? s.buildQueue : [];

    ['queen', 'granary', 'dorm', 'barricade', 'fungus', 'aphid_farm', 'masonry_hall'].forEach(rKey => {
      const room = rCfg[rKey];
      if (!room) return;
      const lvl = rooms[rKey] || 0;
      const cost = typeof room.cost === 'function' ? room.cost(lvl) : 0;
      const capKey = rKey === 'queen' ? 'QueenRoom' : rKey.replace(/_([a-z])/g, (_, l) => l.toUpperCase()).replace(/^([a-z])/, (_, l) => l.toUpperCase());
      const lvlElId = 'lvl' + capKey;
      const costElId = 'cost' + capKey;
      const btnElId = 'btnUp' + capKey;

      setText(lvlElId, lvl);
      setText(costElId, `${formatLargeNumber(cost, lang)} 🍃`);

      // Vérifier si cette salle a déjà un chantier en cours ou en attente
      const activeJob = activeConstructions.find(c => c.roomKey === rKey);
      const queuedJob = buildQueue.find(c => c.roomKey === rKey);
      const btn = getEl(btnElId);

      if (btn) {
        if (activeJob) {
          const rem = Math.max(0, Math.ceil(activeJob.totalTime - activeJob.elapsed));
          btn.disabled = true;
          btn.textContent = `⏳ ${t('constructions.active.title')} (${rem}s)`;
        } else if (queuedJob) {
          btn.disabled = true;
          btn.textContent = `📋 ${t('constructions.queue.title')}`;
        } else {
          btn.disabled = (s.food || 0) < cost;
          btn.textContent = t(`room.${rKey}.btn`);
        }
      }
    });

    // Métiers des Ouvrières & Harmonie Symbiotique (Lot 5)
    updateSymbiosisUI(s, lang);

    // Popover analytique
    updateEconomyPopoverUI(breakdown, lang);

    // Boussole d'Objectifs & Épinglage (Lot 3)
    updateMilestoneCompassUI();
    updatePinnedTargetUI();
    updateAmbientSoundscape(s);

    // Évolution, Génétique & Prestiges (Lot 6)
    updateEvolutionUI();

    // Escouade, Incubation, Expéditions, Événements & Rapport de combat
    updateSquadUI();
    updateIncubationQueueUI();
    updateExpeditionsUI(curSeason);
    updateEventCardUI();
    updateBattleReportUI();
    updateExplorationUI();

    // Badges
    updateTabBadgesUI();
  }

  function logMessageKey(key, params = {}, type = '') {
    if (typeof document === 'undefined') return;
    const container = getEl('logContainer');
    if (!container) return;

    const resolved = typeof root.resolveTranslatedParams === 'function'
      ? root.resolveTranslatedParams(params)
      : params;
    const text = t(key, resolved);

    const entry = document.createElement('div');
    entry.className = 'log-entry' + (type ? ` log-${type}` : '');
    const s = STATE();
    const dayStr = `${t('time.day')} ${s.day || 1}`;
    entry.innerHTML = `<span class="log-time">[${dayStr}]</span> <span class="log-text">${text}</span>`;

    if (typeof container.prepend === 'function') {
      container.prepend(entry);
    } else if (typeof container.insertBefore === 'function') {
      container.insertBefore(entry, container.firstChild);
    } else if (typeof container.appendChild === 'function') {
      container.appendChild(entry);
    }
    const maxLogs = (CONFIG().UI && CONFIG().UI.maxLogEntries) || 40;
    while (container.children && container.children.length > maxLogs) {
      container.removeChild(container.lastElementChild || container.lastChild);
    }
  }

  function updateSquadUI() {
    if (typeof document === 'undefined') return;
    const s = STATE();
    const sq = s.squad || { tank: 0, warrior: 0, scout: 0 };
    setText('squadTankVal', sq.tank || 0);
    setText('squadWarriorVal', sq.warrior || 0);
    setText('squadScoutVal', sq.scout || 0);

    const total = (sq.tank || 0) + (sq.warrior || 0) + (sq.scout || 0);
    setText('squadTotalCount', total);
    const calcPwr = typeof root.calculateSquadPower === 'function' ? root.calculateSquadPower : () => 0;
    setText('squadPowerVal', calcPwr(sq));
  }

  function updateIncubationQueueUI() {
    if (typeof document === 'undefined') return;
    const s = STATE();
    const eggs = Array.isArray(s.eggs) ? s.eggs : [];
    setText('eggQueueCount', `${eggs.length}`);

    const listEl = getEl('eggQueueList');
    if (!listEl) return;

    if (eggs.length === 0) {
      listEl.innerHTML = `<div class="empty-queue">${t('nursery.queue.empty')}</div>`;
      return;
    }

    listEl.innerHTML = eggs.map(egg => {
      const pct = Math.min(100, Math.round(((egg.elapsed || 0) / Math.max(1, egg.totalTime || 1)) * 100));
      const rem = Math.max(0, Math.ceil((egg.totalTime || 1) - (egg.elapsed || 0)));
      const name = t(`caste.${egg.caste}.singular`);
      return `<div class="egg-item"><span>🥚 ${name} (${rem}s)</span><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div></div>`;
    }).join('');
  }

  function updateExpeditionsUI(season) {
    if (typeof document === 'undefined') return;
    const s = STATE();
    const banner = getEl('activeExpBanner');
    if (banner) {
      if (s.activeExpedition) {
        banner.classList.add('visible');
        setText('activeExpName', t(`mission.${s.activeExpedition.id}.short`));
        setText('activeExpTimer', `${s.activeExpedition.timer}s`);
        const pct = Math.min(100, Math.round(((s.activeExpedition.duration - s.activeExpedition.timer) / Math.max(1, s.activeExpedition.duration)) * 100));
        const bar = getEl('activeExpBar');
        if (bar) bar.style.width = `${pct}%`;
      } else {
        banner.classList.remove('visible');
      }
    }
  }

  function updateEventCardUI() {
    if (typeof document === 'undefined') return;
    const s = STATE();
    const section = getEl('activeEventSection');
    if (!section) return;

    if (!s.activeEvent) {
      section.style.display = 'none';
      return;
    }

    const evtCfg = CONFIG().EVENTS && CONFIG().EVENTS.registry && CONFIG().EVENTS.registry[s.activeEvent.id];
    if (!evtCfg) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    setText('activeEventTitle', t(evtCfg.titleKey));
    setText('activeEventDesc', t(evtCfg.descKey));
    setText('activeEventTimer', `${s.activeEvent.timeLeft}s`);
    if (evtCfg.choices && evtCfg.choices[0]) setText('btnEventChoiceA', t(evtCfg.choices[0].labelKey));
    if (evtCfg.choices && evtCfg.choices[1]) setText('btnEventChoiceB', t(evtCfg.choices[1].labelKey));
  }

  function handleChooseEvent(choiceIndex = 0) {
    const s = STATE();
    if (!s.activeEvent) return;
    const choiceId = choiceIndex === 1 ? 'choice_b' : 'choice_a';
    const resolveFn = typeof root.resolveEventChoice === 'function' ? root.resolveEventChoice : null;
    if (resolveFn) {
      const res = resolveFn(s, s.activeEvent.id, choiceId);
      if (res && res.outcomeKey) {
        logMessageKey('log.event_resolved', { outcome: t(res.outcomeKey, res.params || {}) });
      }
    }
    const eventsCfg = CONFIG().EVENTS || { minIntervalSeconds: 45, randomIntervalSeconds: 45 };
    s.activeEvent = null;
    s.nextEventTimer = eventsCfg.minIntervalSeconds + Math.floor(Math.random() * eventsCfg.randomIntervalSeconds);
    playSfx('click');
    if (typeof root.saveGame === 'function') root.saveGame();
    updateUI();
  }

  function updateBattleReportUI() {
    if (typeof document === 'undefined') return;
    const s = STATE();
    const section = getEl('battleReportSection');
    if (!section) return;

    const rep = s.lastBattleReport;
    if (!rep) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    setText('battleReportTarget', rep.targetKey ? t(rep.targetKey) : '-');
    const badge = getEl('battleReportBadge');
    if (badge) {
      badge.textContent = rep.victory ? t('combat.report.victory') : t('combat.report.defeat');
      badge.className = 'battle-badge ' + (rep.victory ? 'victory' : 'defeat');
    }
    setText('battleReportAlliedPower', rep.alliedPower || 0);
    setText('battleReportEnemyPower', rep.enemyPower || 0);
    setText('battleReportCounter', rep.counterDescKey ? t(rep.counterDescKey) : t('combat.report.counter_none'));
  }

  function updateExplorationUI() {
    if (typeof document === 'undefined') return;
    const s = STATE();
    const exp = s.exploration || {};
    const amberStock = Math.max(0, (s.resources && Number(s.resources.amber)) || Number(s.amber) || 0);

    // 1. Pont Vivant d'Ouvrières
    const bridgeActive = Boolean(exp.livingBridges && exp.livingBridges.surfaceHarvest);
    const bridgeBadge = getEl('bridgeStatusBadge');
    if (bridgeBadge) {
      bridgeBadge.textContent = t(bridgeActive ? 'exp.bridge.active_badge' : 'exp.bridge.inactive_badge');
      bridgeBadge.className = 'bridge-badge ' + (bridgeActive ? 'active' : 'inactive');
    }
    const bridgeBtn = getEl('btnLivingBridgeToggle');
    if (bridgeBtn) {
      bridgeBtn.textContent = t(bridgeActive ? 'exp.bridge.recall_btn' : 'exp.bridge.deploy_btn');
      bridgeBtn.onclick = () => {
        if (bridgeActive) {
          if (typeof root.releaseLivingBridgeAction === 'function') root.releaseLivingBridgeAction();
        } else {
          if (typeof root.formLivingBridgeAction === 'function') root.formLivingBridgeAction();
        }
      };
    }

    // 2. Abîmes & Forage
    const depth = Math.max(0, Number(exp.abyssDepth) || 0);
    setText('abyssDepthVal', depth);
    setText('abyssGeothermalVal', `+${depth * 2}%`);
    const hazardName = exp.activeHazard
      ? t(`hazard.${exp.activeHazard.replace('hazard_', '')}.name`)
      : t('exp.abyss.no_hazard');
    setText('abyssHazardVal', hazardName);

    const drillBtn = getEl('btnDrillStratum');
    if (drillBtn) {
      const isBlockedByGuardian = (depth > 0 && depth % 5 === 0 && !(exp.abyssGuardiansDefeated && exp.abyssGuardiansDefeated[depth]));
      drillBtn.disabled = Boolean(isBlockedByGuardian);
      drillBtn.title = isBlockedByGuardian ? t('exp.abyss.drill_locked') : '';
    }

    // 3. Reliques Ancestrales (Monnaie Ambre 🟠)
    const relics = exp.relics || {};
    const relicIds = ['queen_amber', 'fossil_mandible', 'eternal_spore', 'solar_sap'];
    const getCost = typeof root.computeRelicCost === 'function' ? root.computeRelicCost : () => 15;

    relicIds.forEach(rId => {
      const lvl = Math.max(0, Number(relics[rId]) || 0);
      setText(`relicLvl_${rId}`, lvl);
      const cost = getCost(rId, lvl);
      setText(`relicCost_${rId}`, t('relic.cost.amber', { cost }));

      const btn = getEl(`btnUpgradeRelic_${rId}`);
      if (btn) {
        btn.disabled = amberStock < cost;
      }
    });
  }

  function updateMilestoneCompassUI() {
    const s = STATE();
    const goals = getNextMilestoneGoal(s);

    if (goals.shortTerm) {
      setText('goalShortDesc', t(goals.shortTerm.i18nKey));
      setText('goalShortProgress', `${goals.shortTerm.progress} / ${goals.shortTerm.max}`);
      const bar = getEl('goalShortBar');
      if (bar) bar.style.width = `${goals.shortTerm.percent}%`;
    }

    if (goals.major) {
      setText('goalMajorDesc', t(goals.major.i18nKey));
      setText('goalMajorProgress', `${goals.major.progress} / ${goals.major.max}`);
      const bar = getEl('goalMajorBar');
      if (bar) bar.style.width = `${goals.major.percent}%`;
    }
  }

  function updatePinnedTargetUI() {
    const s = STATE();
    const targetWidget = getEl('pinnedTargetWidget');
    if (!targetWidget) return;

    if (!s.pinnedTarget) {
      targetWidget.style.display = 'none';
      return;
    }

    targetWidget.style.display = 'flex';
    const eta = computeTargetEta(s, s.pinnedTarget);
    if (!eta) return;

    if (eta.ready) {
      setText('pinnedTargetEta', t('hud.targetReady'));
    } else if (eta.unreachable) {
      setText('pinnedTargetEta', '∞');
    } else {
      const mins = Math.floor(eta.etaSeconds / 60);
      const secs = eta.etaSeconds % 60;
      const str = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
      setText('pinnedTargetEta', str);
    }
  }

  function updateEvolutionUI() {
    if (typeof document === 'undefined') return;
    const s = STATE();
    const cfg = CONFIG();
    const lang = s.lang || 'fr';
    const mutsCfg = (cfg && cfg.MUTATIONS) || {};
    const stateMuts = (s && s.mutations) || {};
    const phero = Math.max(0, (s && Number(s.pheromone)) || 0);

    // 1. Mise à jour de l'arbre génétique (9 mutations)
    Object.keys(mutsCfg).forEach(k => {
      const mut = mutsCfg[k];
      const btn = getEl(mut.btnId || `btnMut_${k}`);
      const costEl = getEl(`costMut_${k}`);
      const cost = Math.max(0, Number(mut.cost) || 0);

      if (costEl) {
        costEl.textContent = `${formatLargeNumber(cost, lang)} 🧪`;
      }

      if (btn) {
        if (stateMuts[k]) {
          btn.disabled = true;
          btn.textContent = t('mut.unlocked.btn');
          btn.classList.add('btn-unlocked');
          btn.classList.remove('btn-locked');
        } else {
          const hasReq = !mut.requires || Boolean(stateMuts[mut.requires]);
          if (!hasReq) {
            btn.disabled = true;
            const reqMut = mutsCfg[mut.requires];
            const reqName = reqMut ? t(`mut.${reqMut.id}.name`) : mut.requires;
            btn.textContent = t('mut.locked.req', { req: reqName });
            btn.classList.add('btn-locked');
            btn.classList.remove('btn-unlocked');
          } else {
            btn.disabled = (phero < cost);
            btn.textContent = t('mut.unlock.btn');
            btn.classList.remove('btn-locked', 'btn-unlocked');
          }
        }
      }
    });

    // 2. Mise à jour des Hauts Faits
    const achsCfg = (cfg && cfg.ACHIEVEMENTS) || {};
    const stateAchs = (s && s.achievements) || {};
    const allAchKeys = Object.keys(achsCfg);
    const unlockedCount = allAchKeys.filter(k => Boolean(stateAchs[k])).length;

    setText('achCount', `${unlockedCount} / ${allAchKeys.length}`);

    allAchKeys.forEach(k => {
      const isUnlocked = Boolean(stateAchs[k]);
      const card = getEl(`achCard_${k}`);
      if (card) {
        if (isUnlocked) {
          card.classList.add('unlocked');
          card.classList.remove('locked');
        } else {
          card.classList.add('locked');
          card.classList.remove('unlocked');
        }
      }
      const badge = getEl(`achBadge_${k}`);
      if (badge) {
        badge.textContent = isUnlocked ? t('ach.unlocked_badge') : t('ach.locked_badge');
        badge.className = `ach-badge ${isUnlocked ? 'ach-unlocked' : 'ach-locked'}`;
      }
    });

    // 3. Mise à jour de la Dynastie & Vol Nuptial
    const evoModule = root.getNuptialFlightPreview ? root : (typeof require === 'function' ? require('./evolution.js') : {});
    const getPreview = evoModule.getNuptialFlightPreview || root.getNuptialFlightPreview;
    if (typeof getPreview === 'function') {
      const preview = getPreview(s, cfg);
      const bonusPerDna = (cfg && cfg.PRESTIGE && cfg.PRESTIGE.nuptialFlight && cfg.PRESTIGE.nuptialFlight.bonusPerDna) || 0.05;
      const totalBonusPct = Math.round(preview.currentRoyalDna * bonusPerDna * 100);

      setText('dynastyRoyalDna', preview.currentRoyalDna);
      setText('dynastyBonusPercent', `+${totalBonusPct}%`);
      setText('prestigeReqQueen', `${preview.currentQueenLevel} / ${preview.minQueenLevel}`);
      setText('prestigeReqPop', `${preview.currentPop} / ${preview.minPop}`);
      setText('prestigeEstimatedGain', `+${preview.gainedDna} 🧬`);

      const reqQueenEl = getEl('prestigeReqQueen');
      if (reqQueenEl) {
        reqQueenEl.className = preview.currentQueenLevel >= preview.minQueenLevel ? 'req-met' : 'req-unmet';
      }
      const reqPopEl = getEl('prestigeReqPop');
      if (reqPopEl) {
        reqPopEl.className = preview.currentPop >= preview.minPop ? 'req-met' : 'req-unmet';
      }

      const btnFlight = getEl('btnTriggerFlight');
      if (btnFlight) {
        btnFlight.disabled = !preview.canTrigger;
      }
    }
  }

  function updateEconomyPopoverUI(breakdown, lang) {
    const popover = getEl('economyBreakdownPopover');
    if (!popover) return;

    setText('ecoWorkersIncome', `+${formatLargeNumber(breakdown.food.income.workers, lang)} 🍃/s`);
    setText('ecoFungusIncome', `+${formatLargeNumber(breakdown.food.income.fungus, lang)} 🍃/s`);
    setText('ecoBaseConsumption', `-${formatLargeNumber(breakdown.food.expense.baseConsumption, lang)} 🍃/s`);
    setText('ecoMilitaryUpkeep', `-${formatLargeNumber(breakdown.food.expense.total - breakdown.food.expense.baseConsumption, lang)} 🍃/s`);

    const netVal = breakdown.food.net;
    const sign = netVal >= 0 ? '+' : '';
    const netEl = getEl('ecoNetFood');
    if (netEl) {
      netEl.textContent = `${sign}${formatLargeNumber(netVal, lang)} 🍃/s`;
      netEl.className = netVal >= 0 ? 'risk-low' : 'risk-high';
    }

    const etaRow = getEl('ecoEtaRow');
    if (etaRow) {
      if (breakdown.food.timeToFull !== null) {
        etaRow.style.display = 'block';
        const mins = Math.floor(breakdown.food.timeToFull / 60);
        const secs = Math.round(breakdown.food.timeToFull % 60);
        const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
        setText('ecoEtaText', t('hud.timeToFull', { time: timeStr }));
      } else if (breakdown.food.timeToEmpty !== null) {
        etaRow.style.display = 'block';
        const mins = Math.floor(breakdown.food.timeToEmpty / 60);
        const secs = Math.round(breakdown.food.timeToEmpty % 60);
        const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
        setText('ecoEtaText', t('hud.timeToEmpty', { time: timeStr }));
      } else {
        etaRow.style.display = 'none';
      }
    }
  }

  // --- INTERFACE SYMBIOTIQUE, MÉTIERS & PALIERS (LOT 5) ---
  function updateSymbiosisUI(s, lang) {
    if (typeof document === 'undefined') return;
    const roles = (typeof root.getWorkerRoles === 'function')
      ? root.getWorkerRoles(s)
      : (s.workerRoles || { harvester: (s.ants && s.ants.worker) || 0, breeder: 0, grower: 0, mason: 0 });

    setText('roleHarvesterCount', roles.harvester);
    setText('roleBreederCount', roles.breeder);
    setText('roleGrowerCount', roles.grower);
    setText('roleMasonCount', roles.mason);

    const harmony = (typeof root.computeSymbiosisHarmony === 'function')
      ? root.computeSymbiosisHarmony(s)
      : { harmonyRatio: 0, incubationBonus: 0, organicProductionBonus: 0 };

    setText('harmonyRatioVal', `${Math.round(harmony.harmonyRatio * 100)}%`);
    setText('harmonyIncBonusVal', `+${Math.round(harmony.incubationBonus * 100)}%`);
    setText('harmonyOrgBonusVal', `+${Math.round(harmony.organicProductionBonus * 100)}%`);

    const bar = getEl('harmonyProgressBar');
    if (bar) bar.style.width = `${Math.round(harmony.harmonyRatio * 100)}%`;

    const honeyBtn = getEl('btnHoneyBoost');
    if (honeyBtn) {
      if (s.honeyBoostTimer > 0) {
        honeyBtn.disabled = true;
        honeyBtn.textContent = t('symbiosis.honey_boost.active', { sec: s.honeyBoostTimer });
      } else {
        const honeyCost = 20;
        const currentHoney = s.honeydew !== undefined ? s.honeydew : ((s.resources && s.resources.honeydew) || 0);
        honeyBtn.disabled = currentHoney < honeyCost;
        honeyBtn.textContent = t('symbiosis.honey_boost.btn');
      }
    }
  }

  // --- MODALES UI (SAUVEGARDE & RAPPORT HORS-LIGNE) ---
  function openSaveModal() {
    const modal = getEl('saveModal');
    if (modal) {
      modal.classList.add('visible');
      modal.setAttribute('aria-hidden', 'false');
    }
    const input = getEl('saveCodeInput');
    if (input) input.value = '';
    const status = getEl('saveStatusMsg');
    if (status) status.textContent = '';
    playSfx('click');
  }

  function closeSaveModal() {
    const modal = getEl('saveModal');
    if (modal) {
      modal.classList.remove('visible');
      modal.setAttribute('aria-hidden', 'true');
    }
    playSfx('click');
  }

  function handleExportSaveUI() {
    const expFn = typeof root.exportSaveString === 'function' ? root.exportSaveString : () => '';
    const code = expFn();
    const input = getEl('saveCodeInput');
    if (input) {
      input.value = code;
      input.select();
    }
    const status = getEl('saveStatusMsg');
    if (status) {
      status.textContent = t('save.status.exported');
      status.className = 'save-status-msg success';
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(code).catch(() => {});
    }
    playSfx('click');
  }

  function handleImportSaveUI() {
    const input = getEl('saveCodeInput');
    const code = input ? input.value : '';
    const impFn = typeof root.importSaveString === 'function' ? root.importSaveString : () => ({ ok: false });
    const res = impFn(code);
    const success = Boolean(res && res.ok);
    const status = getEl('saveStatusMsg');
    if (status) {
      status.textContent = success ? t('save.status.imported') : t('save.status.error');
      status.className = 'save-status-msg ' + (success ? 'success' : 'error');
    }
    if (success) {
      playSfx('upgrade');
      setTimeout(() => closeSaveModal(), 1200);
    } else {
      playSfx('raid');
    }
  }

  function showOfflineModal(report) {
    const modal = getEl('offlineModal');
    if (!modal) return;
    modal.classList.add('visible');
    modal.setAttribute('aria-hidden', 'false');

    const fmtFn = typeof root.formatDurationSeconds === 'function' ? root.formatDurationSeconds : (s) => `${s}s`;
    const durStr = fmtFn(report.effectiveSeconds);
    setText('offlineModalDesc', t('offline.modal.desc', { duration: durStr }));
    setText('offlineFoodVal', `+${Math.floor(report.foodGained)} 🍃`);
    setText('offlinePheroVal', `+${report.pheromoneGained} 🧪`);
    setText('offlineHatchedVal', `+${report.totalHatched}`);
  }

  function closeOfflineModal() {
    const modal = getEl('offlineModal');
    if (modal) {
      modal.classList.remove('visible');
      modal.setAttribute('aria-hidden', 'true');
    }
    playSfx('click');
  }

  function triggerNuptialFlight() {
    const s = STATE();
    const evoModule = root.getNuptialFlightPreview ? root : (typeof require === 'function' ? require('./evolution.js') : {});
    const getPreview = evoModule.getNuptialFlightPreview || root.getNuptialFlightPreview;
    if (typeof getPreview !== 'function') return;

    const preview = getPreview(s, CONFIG());
    if (!preview.canTrigger) return;
    const modal = getEl('prestigeModal');
    if (modal) {
      setText('prestigeGainDna', preview.gainedDna);
      setText('prestigeGainBonus', preview.nextBonusPercent);
      setText('prestigePopBreakdown', `+${preview.breakdown.population.points} (${preview.breakdown.population.current})`);
      setText('prestigeRoomBreakdown', `+${preview.breakdown.rooms.points} (${preview.breakdown.rooms.current})`);
      setText('prestigePheroBreakdown', `+${preview.breakdown.pheromones.points} (${preview.breakdown.pheromones.current})`);
      setText('prestigeAchBreakdown', `+${preview.breakdown.achievements.points} (${preview.breakdown.achievements.count})`);
      if (preview.breakdown.boss.points > 0) {
        setText('prestigeBossBreakdown', `+${preview.breakdown.boss.points}`);
      }
      const srcLabel = preview.nextBreakpoint.source === 'rooms' ? 'Salles / Chambers' : 'Population';
      setText('prestigeNextBreakpoint', `+1 ADN dans ${preview.nextBreakpoint.missingAmount} (${srcLabel})`);
      modal.classList.add('active');
    }
  }

  function closeNuptialFlightModal() {
    const modal = getEl('prestigeModal');
    if (modal) modal.classList.remove('active');
  }

  function confirmNuptialFlight() {
    closeNuptialFlightModal();
    const s = STATE();
    const evoModule = root.executeNuptialFlightPure ? root : (typeof require === 'function' ? require('./evolution.js') : {});
    const execFn = evoModule.executeNuptialFlightPure || root.executeNuptialFlightPure;
    if (typeof execFn !== 'function') return;

    const res = execFn(s, CONFIG());
    if (res.success) {
      Object.assign(s, res.nextState);
      playSfx('upgrade');
      logMessageKey('log.nuptial_flight', { dna: res.gainedDna, total: res.totalRoyalDna }, 'birth');
      if (typeof root.saveGame === 'function') root.saveGame();
      updateUI();
    }
  }

  // Exposition universelle (Browser + Node.js)
  const API = {
    formatLargeNumber,
    getEconomyBreakdown,
    getNextMilestoneGoal,
    computeTargetEta,
    computeTabBadges,
    playSfx,
    startUndergroundAmbience,
    stopUndergroundAmbience,
    updateAmbientSoundscape,
    switchTab,
    switchSubtab,
    renderSubTabsBar,
    setIncubationMultiplier,
    initIncubationControls,
    initKeybindings,
    updateUI,
    updateSymbiosisUI,
    updateEvolutionUI,
    updateMilestoneCompassUI,
    updatePinnedTargetUI,
    updateTabBadgesUI,
    logMessageKey,
    updateSquadUI,
    updateIncubationQueueUI,
    updateExpeditionsUI,
    updateEventCardUI,
    handleChooseEvent,
    updateBattleReportUI,
    updateExplorationUI,
    openSaveModal,
    closeSaveModal,
    handleExportSaveUI,
    handleImportSaveUI,
    showOfflineModal,
    closeOfflineModal,
    triggerNuptialFlight,
    closeNuptialFlightModal,
    confirmNuptialFlight
  };

  Object.assign(root, API);
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
