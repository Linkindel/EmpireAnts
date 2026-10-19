/**
 * Empire Fourmi - Moteur de Simulation, Saisons, Incubation, Audio, Sauvegarde & i18n (FR/EN)
 * Consomme exclusivement les tokens définis dans config.js (GAME_CONFIG)
 */

// --- ÉTAT DU JEU (Initialisé depuis GAME_CONFIG.INITIAL_STATE + localStorage) ---
function createFreshGameState() {
  const savedLang = (typeof localStorage !== 'undefined' && localStorage.getItem(GAME_CONFIG.LANG_KEY)) || GAME_CONFIG.INITIAL_STATE.lang;
  return {
    lang: savedLang,
    soundEnabled: GAME_CONFIG.INITIAL_STATE.soundEnabled,
    food: GAME_CONFIG.INITIAL_STATE.food,
    maxFood: GAME_CONFIG.INITIAL_STATE.maxFood,
    pheromone: GAME_CONFIG.INITIAL_STATE.pheromone,
    queenHealth: GAME_CONFIG.INITIAL_STATE.queenHealth,
    maxQueenHealth: GAME_CONFIG.INITIAL_STATE.maxQueenHealth,

    day: GAME_CONFIG.INITIAL_STATE.day,
    timeSeconds: GAME_CONFIG.INITIAL_STATE.timeSeconds,
    speed: GAME_CONFIG.INITIAL_STATE.speed,

    ants: { ...GAME_CONFIG.INITIAL_STATE.ants },
    rooms: { ...GAME_CONFIG.INITIAL_STATE.rooms },
    squad: { ...GAME_CONFIG.INITIAL_STATE.squad },
    activeExpedition: null,
    mutations: { ...GAME_CONFIG.INITIAL_STATE.mutations },

    nextRaidTimer: GAME_CONFIG.INITIAL_STATE.nextRaidTimer,
    raidActive: false,
    eggs: []
  };
}

const gameState = createFreshGameState();

// --- SYSTÈME AUDIO PROCÉDURAL (WEB AUDIO API) ---
let audioCtx = null;

function playSfx(type) {
  if (!gameState.soundEnabled) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.06);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'hatch') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.14);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'upgrade') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.setValueAtTime(495, now + 0.08);
      osc.frequency.setValueAtTime(660, now + 0.16);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    } else if (type === 'raid') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.35);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
      osc.start(now);
      osc.stop(now + 0.36);
    } else if (type === 'victory') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554, now + 0.1);
      osc.frequency.setValueAtTime(659, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch (e) {
    // Audio ignoré si bloqué par le navigateur
  }
}

window.toggleSound = function() {
  gameState.soundEnabled = !gameState.soundEnabled;
  const btn = document.getElementById('btnSound');
  if (btn) {
    btn.textContent = gameState.soundEnabled ? '🔊' : '🔇';
  }
  if (gameState.soundEnabled) playSfx('click');
  saveGame();
};

// --- SAUVEGARDE & CHARGEMENT (LOCALSTORAGE) ---
function saveGame() {
  try {
    const payload = {
      lang: gameState.lang,
      soundEnabled: gameState.soundEnabled,
      food: gameState.food,
      maxFood: gameState.maxFood,
      pheromone: gameState.pheromone,
      queenHealth: gameState.queenHealth,
      day: gameState.day,
      timeSeconds: gameState.timeSeconds,
      ants: gameState.ants,
      rooms: gameState.rooms,
      squad: gameState.squad,
      activeExpedition: gameState.activeExpedition,
      mutations: gameState.mutations,
      nextRaidTimer: gameState.nextRaidTimer,
      eggs: gameState.eggs
    };
    localStorage.setItem(GAME_CONFIG.SAVE_KEY, JSON.stringify(payload));
  } catch (e) {
    // Ignorer si localStorage indisponible
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(GAME_CONFIG.SAVE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);

    if (typeof data.food === 'number') gameState.food = data.food;
    if (typeof data.maxFood === 'number') gameState.maxFood = data.maxFood;
    if (typeof data.pheromone === 'number') gameState.pheromone = data.pheromone;
    if (typeof data.queenHealth === 'number') gameState.queenHealth = data.queenHealth;
    if (typeof data.day === 'number') gameState.day = data.day;
    if (typeof data.timeSeconds === 'number') gameState.timeSeconds = data.timeSeconds;
    if (typeof data.soundEnabled === 'boolean') gameState.soundEnabled = data.soundEnabled;
    if (typeof data.nextRaidTimer === 'number') gameState.nextRaidTimer = data.nextRaidTimer;

    if (data.ants) gameState.ants = { ...GAME_CONFIG.INITIAL_STATE.ants, ...data.ants };
    if (data.rooms) gameState.rooms = { ...GAME_CONFIG.INITIAL_STATE.rooms, ...data.rooms };
    if (data.squad) gameState.squad = { ...GAME_CONFIG.INITIAL_STATE.squad, ...data.squad };
    if (data.mutations) gameState.mutations = { ...GAME_CONFIG.INITIAL_STATE.mutations, ...data.mutations };
    if (Array.isArray(data.eggs)) gameState.eggs = data.eggs;
    if (data.activeExpedition) gameState.activeExpedition = data.activeExpedition;
  } catch (e) {
    // Sauvegarde corrompue ignorée
  }
}

window.resetGame = function() {
  if (!window.confirm(t('reset.confirm'))) return;
  try {
    localStorage.removeItem(GAME_CONFIG.SAVE_KEY);
  } catch (e) {}

  const currentLang = gameState.lang;
  const currentSound = gameState.soundEnabled;
  const fresh = createFreshGameState();
  Object.assign(gameState, fresh);
  gameState.lang = currentLang;
  gameState.soundEnabled = currentSound;

  const logContainer = document.getElementById('logContainer');
  if (logContainer) logContainer.innerHTML = '';

  setLanguage(gameState.lang);
  logMessageKey('log.init');
  logMessageKey('log.ready', {}, 'birth');
  updateUI();
};

// --- INITIALISATION AU CHARGEMENT ---
window.addEventListener('DOMContentLoaded', () => {
  loadGame();
  initTabs();
  initSpeedControls();

  const btnSound = document.getElementById('btnSound');
  if (btnSound) btnSound.textContent = gameState.soundEnabled ? '🔊' : '🔇';

  setLanguage(gameState.lang);
  initCanvas();
  updateUI();

  setInterval(gameTick, 1000);
  requestAnimationFrame(renderCanvasLoop);

  logMessageKey('log.ready', {}, 'birth');
});

// --- SYSTÈME DES 4 SAISONS ---
function getCurrentSeasonConfig() {
  const sCfg = GAME_CONFIG.SEASONS;
  const index = Math.floor((gameState.day - 1) / sCfg.daysPerSeason) % sCfg.order.length;
  const seasonKey = sCfg.order[index];
  return sCfg[seasonKey] || sCfg.summer;
}

// --- SYSTÈME BILINGUE FRANÇAIS / ANGLAIS (i18n) ---
window.setLanguage = function(lang) {
  if (!GAME_CONFIG.I18N[lang]) return;
  gameState.lang = lang;

  try {
    localStorage.setItem(GAME_CONFIG.LANG_KEY, lang);
  } catch (e) {}

  document.documentElement.lang = lang;
  document.title = t('app.title');

  const btnFR = document.getElementById('btnLangFR');
  const btnEN = document.getElementById('btnLangEN');
  if (btnFR) btnFR.classList.toggle('active', lang === 'fr');
  if (btnEN) btnEN.classList.toggle('active', lang === 'en');

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    el.setAttribute('title', t(key));
  });

  document.querySelectorAll('.doctrine-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.doctrine === gameState.squad.doctrine);
  });

  // Retraduire l'historique du journal d'événements
  document.querySelectorAll('#logContainer .log-entry[data-log-key]').forEach(entry => {
    const key = entry.getAttribute('data-log-key');
    const params = JSON.parse(entry.getAttribute('data-log-params') || '{}');
    const translatedParams = resolveTranslatedParams(params);
    const msgSpan = entry.querySelector('.log-msg');
    if (msgSpan) {
      msgSpan.textContent = t(key, translatedParams);
    }
  });

  initStaticTokensUI();
  updateUI();
};

function resolveTranslatedParams(params) {
  const out = { ...params };
  if (out.nameKey) out.name = t(out.nameKey);
  if (out.descKey) out.desc = t(out.descKey);
  if (out.upperNameKey) out.name = t(out.upperNameKey).toUpperCase();
  if (out.bonusWorkersCount) {
    out.bonus = t('log.exp_bonus_workers', { count: out.bonusWorkersCount });
  } else if (out.bonus === undefined) {
    out.bonus = '';
  }
  return out;
}

// --- SYNCHRONISATION INITIALE DES TOKENS DANS LE DOM ---
function initStaticTokensUI() {
  const workerUpkeep = document.getElementById('statWorkerUpkeep');
  if (workerUpkeep) workerUpkeep.textContent = `-${GAME_CONFIG.ECONOMY.baseFoodConsumptionPerAnt} 🍃/s`;

  const scoutPhero = document.getElementById('statScoutPhero');
  if (scoutPhero) scoutPhero.textContent = `+${GAME_CONFIG.CASTES.scout.pheroProd} 🧪/s`;

  Object.values(GAME_CONFIG.CASTES).forEach(caste => {
    const costEl = document.getElementById(`costIncubate_${caste.id}`);
    if (costEl) costEl.textContent = `${caste.cost} 🍃 (${caste.incubationSeconds}s)`;
  });

  Object.values(GAME_CONFIG.MUTATIONS).forEach(mut => {
    const costEl = document.getElementById(`costMut_${mut.id}`);
    if (costEl) costEl.textContent = `${mut.cost} 🧪`;
  });
}

// --- GESTION DES ONGLETS ---
function initTabs() {
  const desktopBtns = document.querySelectorAll('#desktopTabs .tab-btn');
  const mobileBtns = document.querySelectorAll('#mobileNav .tab-btn');

  function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    const target = document.getElementById(`tab-${tabId}`);
    if (target) target.classList.add('active');

    document.querySelectorAll(`[data-tab="${tabId}"]`).forEach(b => b.classList.add('active'));
  }

  desktopBtns.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
  mobileBtns.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
}

// --- CONTRÔLE DE VITESSE ---
function initSpeedControls() {
  const btns = {
    pause: document.getElementById('btnPause'),
    s1: document.getElementById('btnSpeed1'),
    s2: document.getElementById('btnSpeed2'),
    s3: document.getElementById('btnSpeed3')
  };

  function setSpeed(val, activeBtn) {
    gameState.speed = val;
    Object.values(btns).forEach(b => b.classList.remove('active'));
    if (activeBtn) activeBtn.classList.add('active');
  }

  btns.pause.addEventListener('click', () => setSpeed(0, btns.pause));
  btns.s1.addEventListener('click', () => setSpeed(1, btns.s1));
  btns.s2.addEventListener('click', () => setSpeed(2, btns.s2));
  btns.s3.addEventListener('click', () => setSpeed(3, btns.s3));
}

// --- CALCULS ÉCONOMIQUES, POPULATION & PUISSANCE ---
function getTotalPop() {
  return gameState.ants.worker + gameState.ants.scout + gameState.ants.warrior + gameState.ants.tank;
}

function getReservedPop() {
  return getTotalPop() + (gameState.eggs ? gameState.eggs.length : 0);
}

function getPopCap() {
  return GAME_CONFIG.ECONOMY.basePopCap + (gameState.rooms.dorm * GAME_CONFIG.ROOMS.dorm.popCapPerLevel);
}

function getNetFoodPerSec() {
  const eco = GAME_CONFIG.ECONOMY;
  const castes = GAME_CONFIG.CASTES;
  const season = getCurrentSeasonConfig();
  const popTotal = getTotalPop();

  const surfaceProduction = gameState.ants.worker * castes.worker.foodProd * season.workerFoodMultiplier;
  const fungusProduction = (gameState.rooms.fungus || 0) * GAME_CONFIG.ROOMS.fungus.foodPerLevel;
  const consumption =
    (popTotal * eco.baseFoodConsumptionPerAnt) +
    (gameState.ants.tank * castes.tank.extraUpkeep) +
    (gameState.ants.warrior * castes.warrior.extraUpkeep);

  return (surfaceProduction + fungusProduction) - consumption;
}

function getPheromoneGainPerSec() {
  return GAME_CONFIG.ECONOMY.basePheromoneGain + (gameState.ants.scout * GAME_CONFIG.CASTES.scout.pheroProd);
}

function getIncubationSpeedMultiplier() {
  const eco = GAME_CONFIG.ECONOMY;
  const season = getCurrentSeasonConfig();
  const queenBonus = 1 + ((gameState.rooms.queen - 1) * eco.queenIncubationSpeedPerLevel);
  return queenBonus * season.incubationSpeedMultiplier;
}

function calculateSquadPower(squadObj) {
  const castes = GAME_CONFIG.CASTES;
  const muts = GAME_CONFIG.MUTATIONS;
  const doctrine = GAME_CONFIG.DOCTRINES[squadObj.doctrine] || GAME_CONFIG.DOCTRINES.balanced;

  let power =
    (squadObj.tank * castes.tank.attackPower) +
    (squadObj.warrior * castes.warrior.attackPower) +
    (squadObj.scout * castes.scout.attackPower);

  if (gameState.mutations.mandibules) power *= muts.mandibules.powerMultiplier;
  if (gameState.mutations.carapace) power += (squadObj.tank * muts.carapace.tankPowerBonus);
  if (gameState.mutations.acide) power += (squadObj.warrior * muts.acide.warriorPowerBonus);

  power *= doctrine.powerMultiplier;
  if (doctrine.warriorBonusPerUnit) {
    power += squadObj.warrior * doctrine.warriorBonusPerUnit;
  }

  return Math.round(power);
}

// --- BOUCLE DE SIMULATION (LOGIQUE MÉTIER) ---
function gameTick() {
  if (gameState.speed === 0) return;

  const eco = GAME_CONFIG.ECONOMY;

  for (let s = 0; s < gameState.speed; s++) {
    gameState.timeSeconds++;

    // Passage de jour et vérification de changement de saison
    if (gameState.timeSeconds % eco.dayDurationSeconds === 0) {
      const prevSeason = getCurrentSeasonConfig().id;
      gameState.day++;
      const newSeason = getCurrentSeasonConfig().id;

      logMessageKey('log.new_day', { day: gameState.day, nameKey: `season.${newSeason}` });

      if (newSeason !== prevSeason) {
        logMessageKey(
          'log.season_change',
          { nameKey: `season.${newSeason}`, descKey: `season.${newSeason}.desc` },
          'birth'
        );
      }
    }

    // 1. Calcul économique (Nourriture)
    const netFood = getNetFoodPerSec();
    gameState.food = Math.min(gameState.maxFood, Math.max(0, gameState.food + netFood));

    // Risque de famine si la nourriture tombe à 0
    if (gameState.food <= 0) {
      gameState.queenHealth = Math.max(eco.starvationMinQueenHealth, gameState.queenHealth - eco.starvationQueenDamagePerSec);
      if (Math.random() < eco.starvationLogChance) {
        logMessageKey('log.starvation', {}, 'combat');
      }
    } else if (gameState.queenHealth < gameState.maxQueenHealth) {
      gameState.queenHealth = Math.min(gameState.maxQueenHealth, gameState.queenHealth + eco.queenHealRatePerSec);
    }

    // 2. Production passive de Phéromones
    const pheroGain = getPheromoneGainPerSec();
    gameState.pheromone = Math.round((gameState.pheromone + pheroGain) * 10) / 10;

    // 3. Progression de la file d'incubation (gameState.eggs)
    const incSpeed = getIncubationSpeedMultiplier();
    for (let i = gameState.eggs.length - 1; i >= 0; i--) {
      const egg = gameState.eggs[i];
      egg.elapsed += incSpeed;
      if (egg.elapsed >= egg.totalTime) {
        const hatchedCaste = egg.caste;
        gameState.eggs.splice(i, 1);
        gameState.ants[hatchedCaste]++;
        triggerAntSpawnEffect(hatchedCaste);
        playSfx('hatch');
        logMessageKey('log.incubated', { nameKey: `caste.${hatchedCaste}.short` }, 'birth');
      }
    }

    // 4. Ponte automatique de la Reine
    if (gameState.food >= eco.autoSpawnMinFood && getReservedPop() < getPopCap()) {
      const spawnChance = (eco.autoSpawnBaseChance + (gameState.rooms.queen * eco.autoSpawnQueenRoomBonusChance)) *
        getCurrentSeasonConfig().incubationSpeedMultiplier;
      if (Math.random() < spawnChance) {
        gameState.food -= eco.autoSpawnFoodCost;
        gameState.ants.worker++;
        triggerAntSpawnEffect('worker');
        logMessageKey('log.auto_spawn', {}, 'birth');
      }
    }

    // 5. Gestion des expéditions actives
    if (gameState.activeExpedition) {
      gameState.activeExpedition.timer--;
      if (gameState.activeExpedition.timer <= 0) {
        resolveExpedition();
      }
    }

    // 6. Gestion des raids ennemis
    handleRaidSystem();
  }

  saveGame();
  updateUI();
}

// --- SYSTÈME D'INCUBATION (FILE D'ATTENTE D'ŒUFS) ---
window.incubateAnt = function(caste) {
  const casteConfig = GAME_CONFIG.CASTES[caste];
  if (!casteConfig) return;

  if (gameState.food < casteConfig.cost) {
    logMessageKey('log.no_food_ant', {}, 'combat');
    return;
  }

  if (getReservedPop() >= getPopCap()) {
    logMessageKey('log.pop_cap', {}, 'combat');
    return;
  }

  gameState.food -= casteConfig.cost;
  gameState.eggs.push({
    caste,
    elapsed: 0,
    totalTime: casteConfig.incubationSeconds
  });

  playSfx('click');
  const effectiveSec = Math.max(1, Math.round(casteConfig.incubationSeconds / getIncubationSpeedMultiplier()));
  logMessageKey('log.egg_queued', { nameKey: `caste.${caste}.short`, sec: effectiveSec }, 'birth');
  saveGame();
  updateUI();
};

// --- SYSTÈME DE SALLES ---
window.upgradeRoom = function(roomKey) {
  const roomConfig = GAME_CONFIG.ROOMS[roomKey];
  if (!roomConfig) return;

  const currentLvl = gameState.rooms[roomKey] || 0;
  const cost = roomConfig.cost(currentLvl);

  if (gameState.food < cost) {
    logMessageKey('log.no_food_room', { cost });
    return;
  }

  gameState.food -= cost;
  gameState.rooms[roomKey] = currentLvl + 1;

  if (roomKey === 'granary') {
    gameState.maxFood += roomConfig.storagePerLevel;
  }

  playSfx('upgrade');
  logMessageKey('log.room_up', { nameKey: `room.${roomKey}.name`, lvl: gameState.rooms[roomKey] });
  saveGame();
  updateUI();
};

// --- GESTION DE L'ESCOUADE ET DOCTRINES ---
window.adjustSquad = function(caste, delta) {
  const currentInSquad = gameState.squad[caste];
  const maxAvailable = gameState.ants[caste];
  const nextVal = currentInSquad + delta;

  if (nextVal >= 0 && nextVal <= maxAvailable) {
    gameState.squad[caste] = nextVal;
    playSfx('click');
    updateUI();
  }
};

window.setDoctrine = function(doctrineName) {
  const doctrineConfig = GAME_CONFIG.DOCTRINES[doctrineName];
  if (!doctrineConfig) return;

  gameState.squad.doctrine = doctrineName;
  document.querySelectorAll('.doctrine-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.doctrine === doctrineName);
  });
  playSfx('click');
  logMessageKey('log.doctrine_set', { upperNameKey: `doctrine.${doctrineName}.name` });
  updateUI();
};

function updateSquadUI() {
  document.getElementById('squadTankVal').textContent = gameState.squad.tank;
  document.getElementById('squadWarriorVal').textContent = gameState.squad.warrior;
  document.getElementById('squadScoutVal').textContent = gameState.squad.scout;

  const total = gameState.squad.tank + gameState.squad.warrior + gameState.squad.scout;
  document.getElementById('squadTotalCount').textContent = total;

  const power = calculateSquadPower(gameState.squad);
  const powerEl = document.getElementById('squadPowerVal');
  if (powerEl) powerEl.textContent = power;
}

// --- EXPÉDITIONS & BATAILLES ---
window.launchExpedition = function(missionType) {
  const totalSquad = gameState.squad.tank + gameState.squad.warrior + gameState.squad.scout;
  if (totalSquad === 0) {
    logMessageKey('log.empty_squad', {}, 'combat');
    return;
  }

  if (gameState.activeExpedition) {
    logMessageKey('log.exp_busy');
    return;
  }

  const m = GAME_CONFIG.MISSIONS[missionType];
  if (!m) return;

  gameState.activeExpedition = {
    ...m,
    timer: m.duration,
    squadSnapshot: { ...gameState.squad }
  };

  playSfx('click');
  logMessageKey('log.exp_start', { nameKey: `mission.${m.id}.short`, dur: m.duration });
  saveGame();
  updateUI();
};

window.recallExpedition = function() {
  if (!gameState.activeExpedition) return;
  gameState.activeExpedition = null;
  playSfx('click');
  logMessageKey('log.exp_recalled');
  saveGame();
  updateUI();
};

function resolveExpedition() {
  const exp = gameState.activeExpedition;
  gameState.activeExpedition = null;

  const season = getCurrentSeasonConfig();
  const doctrine = GAME_CONFIG.DOCTRINES[exp.squadSnapshot.doctrine] || GAME_CONFIG.DOCTRINES.balanced;
  const armyPower = calculateSquadPower(exp.squadSnapshot);
  const win = armyPower >= exp.difficulty;

  if (win) {
    const lootFood = Math.round(exp.lootFood * season.lootMultiplier);
    const lootPhero = Math.round(exp.lootPhero * season.lootMultiplier);

    gameState.food = Math.min(gameState.maxFood, gameState.food + lootFood);
    gameState.pheromone = Math.round((gameState.pheromone + lootPhero) * 10) / 10;

    let addedWorkers = 0;
    if (exp.bonusWorkers > 0 && getReservedPop() < getPopCap()) {
      addedWorkers = Math.min(exp.bonusWorkers, getPopCap() - getReservedPop());
      gameState.ants.worker += addedWorkers;
      triggerAntSpawnEffect('worker');
    }

    playSfx('victory');
    logMessageKey(
      'log.exp_win',
      {
        nameKey: `mission.${exp.id}.short`,
        food: lootFood,
        phero: lootPhero,
        bonusWorkersCount: addedWorkers
      },
      'loot'
    );
  } else {
    let losses = 0;
    if (gameState.squad.warrior > 0 && Math.random() < doctrine.warriorLossChance) {
      gameState.squad.warrior--;
      gameState.ants.warrior = Math.max(0, gameState.ants.warrior - 1);
      losses++;
    }
    if (gameState.squad.tank > 0 && Math.random() < doctrine.tankLossChance) {
      gameState.squad.tank--;
      gameState.ants.tank = Math.max(0, gameState.ants.tank - 1);
      losses++;
    }
    playSfx('raid');
    logMessageKey('log.exp_loss', { nameKey: `mission.${exp.id}.short`, losses }, 'combat');
  }

  saveGame();
  updateUI();
}

// --- SYSTÈME DE RAIDS ADVERSES ---
function handleRaidSystem() {
  const raidCfg = GAME_CONFIG.RAIDS;
  gameState.nextRaidTimer--;

  const alertBanner = document.getElementById('raidAlert');
  if (gameState.nextRaidTimer <= raidCfg.alertThresholdSeconds) {
    alertBanner.style.display = 'block';
    alertBanner.textContent = t('alert.raid', { sec: gameState.nextRaidTimer });
    if (gameState.nextRaidTimer === raidCfg.alertThresholdSeconds) {
      playSfx('raid');
    }
  } else {
    alertBanner.style.display = 'none';
  }

  if (gameState.nextRaidTimer <= 0) {
    triggerEnemyRaid();
    gameState.nextRaidTimer = raidCfg.minIntervalSeconds + Math.floor(Math.random() * raidCfg.randomIntervalSeconds);
  }
}

function triggerEnemyRaid() {
  const raidCfg = GAME_CONFIG.RAIDS;
  const castes = GAME_CONFIG.CASTES;
  const season = getCurrentSeasonConfig();
  logMessageKey('log.raid_start', {}, 'combat');

  let raidStrength = Math.round((raidCfg.baseStrength + (gameState.day * raidCfg.strengthPerDay)) * season.raidStrengthMultiplier);

  if (gameState.rooms.barricade > 0) {
    const absorption = gameState.rooms.barricade * GAME_CONFIG.ROOMS.barricade.defensePerLevel;
    raidStrength = Math.max(0, raidStrength - absorption);
    logMessageKey('log.raid_barricade', { abs: absorption });
  }

  // Seules les troupes présentes dans le nid (non mobilisées à l'extérieur) défendent !
  const deployedTanks = (gameState.activeExpedition && gameState.activeExpedition.squadSnapshot.tank) || 0;
  const deployedWarriors = (gameState.activeExpedition && gameState.activeExpedition.squadSnapshot.warrior) || 0;
  const defendingTanks = Math.max(0, gameState.ants.tank - deployedTanks);
  const defendingWarriors = Math.max(0, gameState.ants.warrior - deployedWarriors);

  let defensePower =
    (defendingTanks * castes.tank.defensePower) +
    (defendingWarriors * castes.warrior.defensePower);

  if (gameState.mutations.carapace) defensePower += defendingTanks * GAME_CONFIG.MUTATIONS.carapace.tankPowerBonus;
  if (gameState.mutations.acide) defensePower += defendingWarriors * GAME_CONFIG.MUTATIONS.acide.warriorPowerBonus;

  const victory = defensePower >= raidStrength;
  if (typeof window.triggerRaidVisuals === 'function') {
    window.triggerRaidVisuals(victory);
  }

  if (victory) {
    playSfx('victory');
    logMessageKey('log.raid_win', {}, 'loot');
    gameState.pheromone = Math.round((gameState.pheromone + raidCfg.victoryPheroReward) * 10) / 10;
  } else {
    playSfx('raid');
    const foodStolen = Math.min(gameState.food, raidCfg.minFoodStolen + Math.floor(Math.random() * raidCfg.randomFoodStolen));
    gameState.food -= foodStolen;

    if (gameState.ants.warrior > 0) {
      gameState.ants.warrior--;
      gameState.squad.warrior = Math.min(gameState.squad.warrior, gameState.ants.warrior);
    }
    logMessageKey('log.raid_loss', { food: Math.floor(foodStolen) }, 'combat');
  }
}

// --- SYSTÈME DE MUTATIONS ---
window.researchMutation = function(mutKey) {
  const mutConfig = GAME_CONFIG.MUTATIONS[mutKey];
  if (!mutConfig) return;

  if (gameState.pheromone < mutConfig.cost) {
    logMessageKey('log.no_phero', { cost: mutConfig.cost });
    return;
  }

  if (gameState.mutations[mutKey]) {
    logMessageKey('log.mut_already');
    return;
  }

  gameState.pheromone = Math.round((gameState.pheromone - mutConfig.cost) * 10) / 10;
  gameState.mutations[mutKey] = true;

  playSfx('upgrade');
  logMessageKey('log.mut_unlocked', { upperNameKey: `mut.${mutKey}.name` }, 'loot');
  saveGame();
  updateUI();
};

// --- JOURNAL D'ÉVÉNEMENTS BILINGUE ---
function logMessageKey(key, params = {}, type = "normal") {
  const container = document.getElementById('logContainer');
  if (!container) return;

  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.setAttribute('data-log-key', key);
  entry.setAttribute('data-log-params', JSON.stringify(params));

  const mins = Math.floor(gameState.timeSeconds / 60).toString().padStart(2, '0');
  const secs = (gameState.timeSeconds % 60).toString().padStart(2, '0');
  const translatedParams = resolveTranslatedParams(params);
  const text = t(key, translatedParams);

  entry.innerHTML = `<span class="log-time">[${mins}:${secs}]</span> <span class="log-msg">${text}</span>`;
  container.appendChild(entry);
}

// --- MISE À JOUR DE L'INTERFACE UTILISATEUR (HUD & PANNEAUX) ---
function updateUI() {
  const season = getCurrentSeasonConfig();
  const popCap = getPopCap();
  const reservedPop = getReservedPop();

  document.getElementById('resFood').textContent = `${Math.floor(gameState.food)} / ${gameState.maxFood}`;
  document.getElementById('resPheromone').textContent = gameState.pheromone;
  const eggSuffix = gameState.eggs.length > 0 ? ` (+${gameState.eggs.length}🥚)` : '';
  document.getElementById('resPop').textContent = `${getTotalPop()}${eggSuffix} / ${popCap}`;
  document.getElementById('resQueen').textContent = `${Math.floor(gameState.queenHealth)}%`;

  const dayEl = document.getElementById('gameDay');
  if (dayEl) dayEl.textContent = gameState.day;

  // Alerte raid si active
  const raidCfg = GAME_CONFIG.RAIDS;
  const alertBanner = document.getElementById('raidAlert');
  if (alertBanner && gameState.nextRaidTimer <= raidCfg.alertThresholdSeconds) {
    alertBanner.textContent = t('alert.raid', { sec: gameState.nextRaidTimer });
  }

  // Delta nourriture et phéromones
  const netFood = getNetFoodPerSec();
  const deltaFoodElem = document.getElementById('deltaFood');
  deltaFoodElem.textContent = `${netFood >= 0 ? '+' : ''}${netFood.toFixed(1)}/s`;
  deltaFoodElem.className = `delta ${netFood >= 0 ? 'pos' : 'neg'}`;

  const deltaPheroElem = document.getElementById('deltaPheromone');
  if (deltaPheroElem) {
    deltaPheroElem.textContent = `+${getPheromoneGainPerSec().toFixed(1)}/s`;
  }

  // Production ouvrière ajustée selon la saison
  const effWorkerProd = (GAME_CONFIG.CASTES.worker.foodProd * season.workerFoodMultiplier).toFixed(2);
  const workerProdEl = document.getElementById('statWorkerProd');
  if (workerProdEl) workerProdEl.textContent = `+${effWorkerProd} 🍃/s`;

  // Castes & activation des boutons d'incubation
  document.getElementById('countWorker').textContent = gameState.ants.worker;
  document.getElementById('countScout').textContent = gameState.ants.scout;
  document.getElementById('countWarrior').textContent = gameState.ants.warrior;
  document.getElementById('countTank').textContent = gameState.ants.tank;

  const incBtns = {
    worker: document.getElementById('btnIncubateWorker'),
    scout: document.getElementById('btnIncubateScout'),
    warrior: document.getElementById('btnIncubateWarrior'),
    tank: document.getElementById('btnIncubateTank')
  };
  Object.keys(incBtns).forEach(caste => {
    const btn = incBtns[caste];
    if (btn) {
      btn.disabled = gameState.food < GAME_CONFIG.CASTES[caste].cost || reservedPop >= popCap;
    }
  });

  // File d'incubation (Nurserie)
  updateIncubationQueueUI();

  // Niveaux, Statistiques & Boutons des Salles
  const r = GAME_CONFIG.ROOMS;
  const qCost = r.queen.cost(gameState.rooms.queen);
  document.getElementById('lvlQueenRoom').textContent = gameState.rooms.queen;
  document.getElementById('costQueenRoom').textContent = `${qCost} 🍃`;
  const statQueenSpeed = document.getElementById('statQueenSpeed');
  if (statQueenSpeed) statQueenSpeed.textContent = `+${Math.round((getIncubationSpeedMultiplier() - 1) * 100)}%`;
  const btnUpQueen = document.getElementById('btnUpQueenRoom');
  if (btnUpQueen) btnUpQueen.disabled = gameState.food < qCost;

  const gCost = r.granary.cost(gameState.rooms.granary);
  document.getElementById('lvlGranary').textContent = gameState.rooms.granary;
  document.getElementById('costGranary').textContent = `${gCost} 🍃`;
  document.getElementById('statStorage').textContent = `${gameState.maxFood} 🍃`;
  const btnUpGranary = document.getElementById('btnUpGranary');
  if (btnUpGranary) btnUpGranary.disabled = gameState.food < gCost;

  const dCost = r.dorm.cost(gameState.rooms.dorm);
  document.getElementById('lvlDorm').textContent = gameState.rooms.dorm;
  document.getElementById('costDorm').textContent = `${dCost} 🍃`;
  document.getElementById('statPopCap').textContent = `${popCap} ${t('room.dorm.unit')}`;
  const btnUpDorm = document.getElementById('btnUpDorm');
  if (btnUpDorm) btnUpDorm.disabled = gameState.food < dCost;

  const bCost = r.barricade.cost(gameState.rooms.barricade);
  document.getElementById('lvlBarricade').textContent = gameState.rooms.barricade;
  document.getElementById('costBarricade').textContent = `${bCost} 🍃`;
  document.getElementById('statBarricade').textContent = `${gameState.rooms.barricade * r.barricade.defensePerLevel} ${t('room.barricade.unit')}`;
  const btnUpBarricade = document.getElementById('btnUpBarricade');
  if (btnUpBarricade) btnUpBarricade.disabled = gameState.food < bCost;

  const fLvl = gameState.rooms.fungus || 0;
  const fCost = r.fungus.cost(fLvl);
  const lvlFungus = document.getElementById('lvlFungus');
  if (lvlFungus) lvlFungus.textContent = fLvl;
  const costFungus = document.getElementById('costFungus');
  if (costFungus) costFungus.textContent = `${fCost} 🍃`;
  const statFungus = document.getElementById('statFungus');
  if (statFungus) statFungus.textContent = `+${(fLvl * r.fungus.foodPerLevel).toFixed(1)} 🍃/s`;
  const btnUpFungus = document.getElementById('btnUpFungus');
  if (btnUpFungus) btnUpFungus.disabled = gameState.food < fCost;

  // Mutations (états des boutons)
  Object.values(GAME_CONFIG.MUTATIONS).forEach(mut => {
    const btn = document.getElementById(mut.btnId);
    if (btn) {
      const unlocked = !!gameState.mutations[mut.id];
      btn.disabled = unlocked || gameState.pheromone < mut.cost;
      btn.textContent = unlocked ? t('mut.unlocked.btn') : t('mut.unlock.btn');
    }
  });

  // Escouade & Expéditions
  updateSquadUI();
  updateExpeditionsUI(season);
}

function updateIncubationQueueUI() {
  const countBadge = document.getElementById('incubationCountBadge');
  const emptyEl = document.getElementById('incubationEmpty');
  const listEl = document.getElementById('incubationList');
  if (!listEl || !emptyEl || !countBadge) return;

  countBadge.textContent = `${gameState.eggs.length}`;
  if (gameState.eggs.length === 0) {
    emptyEl.style.display = 'block';
    listEl.innerHTML = '';
    return;
  }

  emptyEl.style.display = 'none';
  const incSpeed = getIncubationSpeedMultiplier();

  listEl.innerHTML = gameState.eggs.map(egg => {
    const casteCfg = GAME_CONFIG.CASTES[egg.caste];
    const pct = Math.min(100, Math.round((egg.elapsed / egg.totalTime) * 100));
    const remSec = Math.max(1, Math.ceil((egg.totalTime - egg.elapsed) / incSpeed));
    return `
      <div class="egg-item">
        <div class="egg-item-top">
          <span>${casteCfg.icon} ${t(`caste.${egg.caste}.name`)}</span>
          <span>${remSec}s (${pct}%)</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  }).join('');
}

function updateExpeditionsUI(season) {
  const squadPower = calculateSquadPower(gameState.squad);
  const squadTotal = gameState.squad.tank + gameState.squad.warrior + gameState.squad.scout;

  // Bannière d'expédition active
  const banner = document.getElementById('activeExpBanner');
  if (banner) {
    if (gameState.activeExpedition) {
      const exp = gameState.activeExpedition;
      banner.classList.add('visible');
      document.getElementById('activeExpName').textContent = t(`mission.${exp.id}.short`);
      document.getElementById('activeExpTimer').textContent = `${exp.timer}s`;
      const pct = Math.min(100, Math.round(((exp.duration - exp.timer) / exp.duration) * 100));
      document.getElementById('activeExpBar').style.width = `${pct}%`;
    } else {
      banner.classList.remove('visible');
    }
  }

  // Cartes de missions (Difficulté, Chance de victoire %, Butin saisonnier)
  Object.values(GAME_CONFIG.MISSIONS).forEach(m => {
    const riskEl = document.getElementById(`missionRisk_${m.id}`);
    if (riskEl) {
      riskEl.textContent = `${t(m.riskKey)} (${m.difficulty})`;
      riskEl.className = m.riskClass;
    }

    const chanceEl = document.getElementById(`missionChance_${m.id}`);
    if (chanceEl) {
      const pct = squadTotal === 0 ? 0 : Math.min(100, Math.round((squadPower / m.difficulty) * 100));
      chanceEl.textContent = `${pct}%`;
      chanceEl.className = pct >= 100 ? 'risk-low' : (pct >= 65 ? 'risk-medium' : 'risk-high');
    }

    const lootEl = document.getElementById(`missionLoot_${m.id}`);
    if (lootEl) {
      const effFood = Math.round(m.lootFood * season.lootMultiplier);
      const effPhero = Math.round(m.lootPhero * season.lootMultiplier);
      const bonusText = m.bonusWorkers > 0 ? `, ${t('loot.larvae', { count: m.bonusWorkers })}` : '';
      lootEl.textContent = `+${effFood} 🍃, +${effPhero} 🧪${bonusText}`;
    }

    const btn = document.getElementById(`btnMission_${m.id}`);
    if (btn) {
      btn.disabled = squadTotal === 0 || !!gameState.activeExpedition;
    }
  });
}
