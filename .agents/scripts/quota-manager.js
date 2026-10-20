/**
 * @fileoverview Gestionnaire de Quota Gemini 5h, Auto-Acceptation & Relance Automatique du Dossier `passation/`.
 * Conforme aux standards d'Architecture Senior (SOLID, SoC, Zéro Magic Number,
 * Fonctions Pures, Programmation Défensive, Migration de Schéma et Parité FR/EN).
 */

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Configuration centrale et dictionnaire bilingue FR/EN (Zéro Magic Number).
 */
const QUOTA_CONFIG = Object.freeze({
  SCHEMA_VERSION: 1,
  HOURS_PER_WINDOW: 5,
  MINUTES_PER_HOUR: 60,
  SECONDS_PER_MINUTE: 60,
  MS_PER_SECOND: 1000,
  FIVE_HOURS_MS: 5 * 60 * 60 * 1000, // 18 000 000 ms (5 heures)
  FIVE_HOURS_SECONDS: 5 * 60 * 60,   // 18 000 secondes
  MIN_SCHEDULE_DELAY_SECONDS: 60,
  DEFAULT_WARNING_THRESHOLD: 40,
  DEFAULT_MAX_AUTO_CONTINUE_STEPS: 15,
  DEFAULT_LANGUAGE: 'fr',
  TOTAL_PASSATION_LOTS: 15,

  STATUS: Object.freeze({
    ACTIVE: 'ACTIVE',
    COOLDOWN_5H: 'COOLDOWN_5H',
    IDLE: 'IDLE',
  }),

  TASK_STATUS: Object.freeze({
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    BLOCKED_QUOTA: 'blocked_by_quota',
  }),

  HOOK_EVENTS: Object.freeze({
    SESSION_START: 'SessionStart',
    PRE_TOOL_USE: 'PreToolUse',
    POST_TOOL_USE: 'PostToolUse',
    PRE_INVOCATION: 'PreInvocation',
    POST_INVOCATION: 'PostInvocation',
    STOP: 'Stop',
  }),

  TERMINATION_REASONS: Object.freeze({
    NO_TOOL_CALL: 'NO_TOOL_CALL',
    MAX_INVOCATIONS: 'MAX_INVOCATIONS',
    MAX_FORCED_INVOCATIONS: 'MAX_FORCED_INVOCATIONS',
    MAX_TOKEN_BUDGET_EXCEEDED: 'MAX_TOKEN_BUDGET_EXCEEDED',
    ERROR: 'ERROR',
    USER_CANCELED: 'USER_CANCELED',
  }),

  QUOTA_ERROR_PATTERNS: Object.freeze([
    'quota',
    'rate limit',
    'rate_limit',
    'resource_exhausted',
    '429',
    'too many requests',
    '5h',
    'limit exceeded',
  ]),

  DANGEROUS_COMMAND_PATTERNS: Object.freeze([
    'format-volume',
    'rm -rf /',
    'del /f /s /q c:\\',
    'rd /s /q c:\\',
    'shutdown /s',
    'restart-computer',
  ]),

  I18N: Object.freeze({
    fr: Object.freeze({
      windowActive: 'Fenêtre Gemini 5h active ({invocations} appels effectués, réinitialisation dans {remaining}).',
      windowReset: 'Nouvelle fenêtre de quota Gemini de 5h démarrée !',
      windowCooldown: 'Quota Gemini 5h en pause. Prochaine réinitialisation dans {remaining} (à {resetTime}).',
      nextTaskReady: 'Tâche autonome prête [{id}] : {title}',
      noPendingTask: 'Aucune tâche en attente dans le backlog autonome.',
      autoContinueReason: '[Auto-Pilot 5h & Passation] Quota disponible ({remaining} restant). Continue automatiquement le dossier passation sur {lotLabel} ({specFile}) jusqu\'à validation complète (tests >= 80%, FR/EN, statut ✅ TERMINÉ dans passation/ROADMAP_PASSATION.md et mise à jour de CONTEXT.md).',
      passationNextLot: 'Dossier Passation ({done}/{total} terminés) — Prochain lot actif : {lotLabel} ({specFile}).',
      passationAllDone: 'Tous les lots du dossier passation ({total}/{total}) sont terminés (✅ TERMINÉ) !',
      autoApproveTool: 'Auto-accepté par Quota 5h Auto-Pilot pour finir le lot sans interruption.',
      blockedDangerousTool: 'Commande système dangereuse bloquée par sécurité.',
      quotaHitRecorded: 'Limite de quota 5h détectée. Reprise automatique programmée dans {remainingSeconds}s ({resetTime}).',
      taskAdded: 'Tâche ajoutée au backlog [{id}] : {title}',
      taskCompleted: 'Tâche marquée comme terminée [{id}] : {title}',
      autopilotEnabled: 'Mode Auto-Pilot 5h activé.',
      autopilotDisabled: 'Mode Auto-Pilot 5h désactivé.',
    }),
    en: Object.freeze({
      windowActive: 'Gemini 5h window active ({invocations} calls made, resets in {remaining}).',
      windowReset: 'New 5h Gemini quota window started!',
      windowCooldown: 'Gemini 5h quota cooling down. Next reset in {remaining} (at {resetTime}).',
      nextTaskReady: 'Autonomous task ready [{id}]: {title}',
      noPendingTask: 'No pending task in the autonomous backlog.',
      autoContinueReason: '[5h Auto-Pilot & Passation] Quota available ({remaining} left). Auto-continuing passation folder on {lotLabel} ({specFile}) until full completion (tests >= 80%, FR/EN, ✅ TERMINÉ status in passation/ROADMAP_PASSATION.md and CONTEXT.md update).',
      passationNextLot: 'Passation Folder ({done}/{total} completed) — Next active batch: {lotLabel} ({specFile}).',
      passationAllDone: 'All batches in the passation folder ({total}/{total}) are completed (✅ TERMINÉ)!',
      autoApproveTool: 'Auto-accepted by 5h Quota Auto-Pilot to finish the batch without interruption.',
      blockedDangerousTool: 'Dangerous system command blocked for safety.',
      quotaHitRecorded: '5h quota limit detected. Automatic resume scheduled in {remainingSeconds}s ({resetTime}).',
      taskAdded: 'Task added to backlog [{id}]: {title}',
      taskCompleted: 'Task marked as completed [{id}]: {title}',
      autopilotEnabled: '5h Auto-Pilot mode enabled.',
      autopilotDisabled: '5h Auto-Pilot mode disabled.',
    }),
  }),
});

/**
 * Traduit une clé i18n avec remplacement de paramètres dynamiques.
 * Fonction pure et défensive.
 *
 * @param {string} key Clé de traduction
 * @param {Object<string, string|number>} [params={}] Paramètres à injecter
 * @param {string} [lang='fr'] Code langue ('fr' ou 'en')
 * @returns {string} Texte traduit
 */
function t(key, params = {}, lang = QUOTA_CONFIG.DEFAULT_LANGUAGE) {
  const safeLang = QUOTA_CONFIG.I18N[lang] ? lang : QUOTA_CONFIG.DEFAULT_LANGUAGE;
  const dict = QUOTA_CONFIG.I18N[safeLang];
  const fallbackDict = QUOTA_CONFIG.I18N[QUOTA_CONFIG.DEFAULT_LANGUAGE];
  let template = (dict && dict[key]) || (fallbackDict && fallbackDict[key]) || String(key || '');

  if (params && typeof params === 'object') {
    for (const [paramKey, paramVal] of Object.entries(params)) {
      const safeVal = paramVal !== undefined && paramVal !== null ? String(paramVal) : '';
      template = template.split(`{${paramKey}}`).join(safeVal);
    }
  }
  return template;
}

/**
 * Formate une durée en millisecondes en texte lisible (ex: "4h 12m" ou "35m 10s").
 * Fonction pure et défensive.
 *
 * @param {number} durationMs Durée en millisecondes
 * @returns {string} Durée formatée
 */
function formatDuration(durationMs) {
  const safeMs = Number.isFinite(durationMs) && durationMs > 0 ? Math.floor(durationMs) : 0;
  const totalSeconds = Math.ceil(safeMs / QUOTA_CONFIG.MS_PER_SECOND);
  const hours = Math.floor(
    totalSeconds / (QUOTA_CONFIG.MINUTES_PER_HOUR * QUOTA_CONFIG.SECONDS_PER_MINUTE)
  );
  const minutes = Math.floor(
    (totalSeconds % (QUOTA_CONFIG.MINUTES_PER_HOUR * QUOTA_CONFIG.SECONDS_PER_MINUTE)) /
      QUOTA_CONFIG.SECONDS_PER_MINUTE
  );
  const seconds = totalSeconds % QUOTA_CONFIG.SECONDS_PER_MINUTE;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  }
  return `${seconds}s`;
}

/**
 * Analyse le fichier `passation/ROADMAP_PASSATION.md` pour identifier automatiquement
 * l'état des 15 Lots et le prochain Lot à exécuter.
 * Fonction pure et défensive.
 *
 * @param {string} markdownContent Contenu brut de `ROADMAP_PASSATION.md`
 * @returns {{ totalLots: number, completedLots: number, pendingLots: number, nextLot: Object|null, lots: Array<Object> }}
 */
function parsePassationRoadmap(markdownContent) {
  if (typeof markdownContent !== 'string' || markdownContent.trim().length === 0) {
    return {
      totalLots: 0,
      completedLots: 0,
      pendingLots: 0,
      nextLot: null,
      lots: [],
    };
  }

  const lines = markdownContent.split(/\r?\n/);
  const lots = [];
  // Exemple de ligne : | **Lot 1** | [`LOT_1_SOCLE_ET_TESTS.md`](...) | Périmètre | Fichiers | ⏳ **À FAIRE (Prochain Lot)** |
  const rowRegex = /^\|\s*\*\*Lot\s+(\d+)\*\*\s*\|\s*\[`?(LOT_\d+_[A-Z0-9_]+\.md)`?\]/i;

  for (const line of lines) {
    const match = line.match(rowRegex);
    if (match) {
      const lotNumber = Number(match[1]);
      const specFileName = match[2];
      const cells = line
        .split('|')
        .map((c) => c.trim())
        .filter((c) => c.length > 0);
      let assignedModel = 'Gemini 4 Argon (High)';
      let scope = '';
      if (cells.length >= 6) {
        assignedModel = cells[2] || 'Gemini 4 Argon (High)';
        scope = cells[3] || '';
      } else {
        scope = cells[2] || '';
        assignedModel = line.includes('Flash') ? 'Gemini 3.8 Flash (High)' : 'Gemini 4 Argon (High)';
      }
      const rawStatus = cells[cells.length - 1] || '';
      const isCompleted =
        rawStatus.includes('✅') || rawStatus.toUpperCase().includes('TERMINÉ');

      lots.push({
        lotNumber,
        lotLabel: `Lot ${lotNumber}`,
        specFile: `passation/${specFileName}`,
        specFileName,
        assignedModel,
        scope,
        rawStatus,
        isCompleted,
      });
    }
  }

  lots.sort((a, b) => a.lotNumber - b.lotNumber);
  const completedLots = lots.filter((l) => l.isCompleted).length;
  const pendingList = lots.filter((l) => !l.isCompleted);

  return {
    totalLots: lots.length,
    completedLots,
    pendingLots: pendingList.length,
    nextLot: pendingList.length > 0 ? pendingList[0] : null,
    lots,
  };
}

/**
 * Évalue un appel d'outil dans le hook `PreToolUse` pour auto-accepter les opérations
 * de développement et permettre à la conversation de finir sans attente manuelle,
 * tout en bloquant les commandes destructrices système.
 * Fonction pure.
 *
 * @param {Object} hookInput Payload stdin de `PreToolUse`
 * @param {string} [lang='fr'] Langue active
 * @returns {{ decision: string, reason: string }}
 */
function evaluatePreToolUse(hookInput, lang = QUOTA_CONFIG.DEFAULT_LANGUAGE) {
  const safeInput = hookInput && typeof hookInput === 'object' ? hookInput : {};
  const toolCall = safeInput.toolCall && typeof safeInput.toolCall === 'object' ? safeInput.toolCall : {};
  const args = toolCall.args && typeof toolCall.args === 'object' ? toolCall.args : {};
  const cmdLine = typeof args.CommandLine === 'string' ? args.CommandLine.toLowerCase() : '';

  const isDangerous = QUOTA_CONFIG.DANGEROUS_COMMAND_PATTERNS.some((pattern) =>
    cmdLine.includes(pattern)
  );

  if (isDangerous) {
    return {
      decision: 'deny',
      reason: t('blockedDangerousTool', {}, lang),
    };
  }

  return {
    decision: 'allow',
    reason: t('autoApproveTool', {}, lang),
  };
}

/**
 * Crée l'état par défaut du gestionnaire de quota 5h.
 * Fonction pure.
 *
 * @param {number} [nowMs=Date.now()] Horodatage actuel en ms
 * @returns {Object} État initial valide
 */
function createDefaultQuotaState(nowMs = Date.now()) {
  const safeNow = Number.isFinite(nowMs) && nowMs > 0 ? nowMs : 0;
  return {
    schemaVersion: QUOTA_CONFIG.SCHEMA_VERSION,
    language: QUOTA_CONFIG.DEFAULT_LANGUAGE,
    autopilotEnabled: true,
    status: QUOTA_CONFIG.STATUS.ACTIVE,
    windowStartAt: safeNow,
    windowResetAt: safeNow + QUOTA_CONFIG.FIVE_HOURS_MS,
    invocationsInWindow: 0,
    totalInvocations: 0,
    autoContinueCountInTurn: 0,
    maxAutoContinueSteps: QUOTA_CONFIG.DEFAULT_MAX_AUTO_CONTINUE_STEPS,
    lastQuotaHitAt: null,
    lastUpdatedAt: safeNow,
    lastError: null,
  };
}

/**
 * Crée la structure par défaut du backlog autonome.
 * Fonction pure.
 *
 * @param {number} [nowMs=Date.now()] Horodatage actuel en ms
 * @returns {Object} Backlog initial valide
 */
function createDefaultBacklog(nowMs = Date.now()) {
  const safeNow = Number.isFinite(nowMs) && nowMs > 0 ? nowMs : 0;
  return {
    schemaVersion: QUOTA_CONFIG.SCHEMA_VERSION,
    updatedAt: safeNow,
    tasks: [],
  };
}

/**
 * Migre et valide défensivement un état de quota chargé depuis le disque.
 * Fonction pure.
 *
 * @param {Object|null|undefined} rawState État brut potentiellement incomplet
 * @param {number} [nowMs=Date.now()] Horodatage actuel en ms
 * @returns {Object} État assaini et migré
 */
function migrateQuotaState(rawState, nowMs = Date.now()) {
  const defaults = createDefaultQuotaState(nowMs);
  if (!rawState || typeof rawState !== 'object' || Array.isArray(rawState)) {
    return defaults;
  }

  const windowStartAt =
    Number.isFinite(rawState.windowStartAt) && rawState.windowStartAt > 0
      ? rawState.windowStartAt
      : defaults.windowStartAt;

  const windowResetAt =
    Number.isFinite(rawState.windowResetAt) && rawState.windowResetAt >= windowStartAt
      ? rawState.windowResetAt
      : windowStartAt + QUOTA_CONFIG.FIVE_HOURS_MS;

  const validStatuses = Object.values(QUOTA_CONFIG.STATUS);
  const status = validStatuses.includes(rawState.status)
    ? rawState.status
    : defaults.status;

  return {
    schemaVersion: QUOTA_CONFIG.SCHEMA_VERSION,
    language: QUOTA_CONFIG.I18N[rawState.language] ? rawState.language : defaults.language,
    autopilotEnabled:
      typeof rawState.autopilotEnabled === 'boolean'
        ? rawState.autopilotEnabled
        : defaults.autopilotEnabled,
    status,
    windowStartAt,
    windowResetAt,
    invocationsInWindow:
      Number.isFinite(rawState.invocationsInWindow) && rawState.invocationsInWindow >= 0
        ? Math.floor(rawState.invocationsInWindow)
        : 0,
    totalInvocations:
      Number.isFinite(rawState.totalInvocations) && rawState.totalInvocations >= 0
        ? Math.floor(rawState.totalInvocations)
        : 0,
    autoContinueCountInTurn:
      Number.isFinite(rawState.autoContinueCountInTurn) && rawState.autoContinueCountInTurn >= 0
        ? Math.floor(rawState.autoContinueCountInTurn)
        : 0,
    maxAutoContinueSteps:
      Number.isFinite(rawState.maxAutoContinueSteps) && rawState.maxAutoContinueSteps > 0
        ? Math.floor(rawState.maxAutoContinueSteps)
        : defaults.maxAutoContinueSteps,
    lastQuotaHitAt:
      Number.isFinite(rawState.lastQuotaHitAt) && rawState.lastQuotaHitAt > 0
        ? rawState.lastQuotaHitAt
        : null,
    lastUpdatedAt:
      Number.isFinite(rawState.lastUpdatedAt) && rawState.lastUpdatedAt > 0
        ? rawState.lastUpdatedAt
        : defaults.lastUpdatedAt,
    lastError: typeof rawState.lastError === 'string' ? rawState.lastError : null,
  };
}

/**
 * Migre et valide défensivement un backlog chargé depuis le disque.
 * Fonction pure.
 *
 * @param {Object|null|undefined} rawBacklog Backlog brut
 * @param {number} [nowMs=Date.now()] Horodatage actuel en ms
 * @returns {Object} Backlog assaini
 */
function migrateBacklog(rawBacklog, nowMs = Date.now()) {
  const defaults = createDefaultBacklog(nowMs);
  if (!rawBacklog || typeof rawBacklog !== 'object' || Array.isArray(rawBacklog)) {
    return defaults;
  }

  const validTaskStatuses = Object.values(QUOTA_CONFIG.TASK_STATUS);
  const rawTasks = Array.isArray(rawBacklog.tasks) ? rawBacklog.tasks : [];

  const sanitizedTasks = rawTasks
    .filter((item) => item && typeof item === 'object' && typeof item.id === 'string')
    .map((item) => ({
      id: item.id.trim(),
      title: {
        fr:
          item.title && typeof item.title.fr === 'string'
            ? item.title.fr
            : typeof item.title === 'string'
            ? item.title
            : item.id,
        en:
          item.title && typeof item.title.en === 'string'
            ? item.title.en
            : typeof item.title === 'string'
            ? item.title
            : item.id,
      },
      prompt: {
        fr:
          item.prompt && typeof item.prompt.fr === 'string'
            ? item.prompt.fr
            : typeof item.prompt === 'string'
            ? item.prompt
            : '',
        en:
          item.prompt && typeof item.prompt.en === 'string'
            ? item.prompt.en
            : typeof item.prompt === 'string'
            ? item.prompt
            : '',
      },
      priority: Number.isFinite(item.priority) ? Math.floor(item.priority) : 1,
      status: validTaskStatuses.includes(item.status)
        ? item.status
        : QUOTA_CONFIG.TASK_STATUS.PENDING,
      createdAt: Number.isFinite(item.createdAt) ? item.createdAt : nowMs,
      updatedAt: Number.isFinite(item.updatedAt) ? item.updatedAt : nowMs,
    }));

  return {
    schemaVersion: QUOTA_CONFIG.SCHEMA_VERSION,
    updatedAt: Number.isFinite(rawBacklog.updatedAt) ? rawBacklog.updatedAt : defaults.updatedAt,
    tasks: sanitizedTasks,
  };
}

/**
 * Synchronise automatiquement le backlog avec l'état réel de `passation/ROADMAP_PASSATION.md`.
 * Fonction pure.
 *
 * @param {Object} backlog Backlog actuel
 * @param {string} roadmapMarkdown Contenu de `passation/ROADMAP_PASSATION.md`
 * @param {number} [nowMs=Date.now()] Horodatage actuel
 * @returns {{ backlog: Object, passationInfo: Object }}
 */
function syncBacklogWithPassation(backlog, roadmapMarkdown, nowMs = Date.now()) {
  let safeBacklog = migrateBacklog(backlog, nowMs);
  const passationInfo = parsePassationRoadmap(roadmapMarkdown);

  if (passationInfo.totalLots === 0) {
    return { backlog: safeBacklog, passationInfo };
  }

  for (const lot of passationInfo.lots) {
    const taskId = `passation-lot-${lot.lotNumber}`;
    const existing = safeBacklog.tasks.find((tItem) => tItem.id === taskId);
    const desiredStatus = lot.isCompleted
      ? QUOTA_CONFIG.TASK_STATUS.COMPLETED
      : existing && existing.status === QUOTA_CONFIG.TASK_STATUS.BLOCKED_QUOTA
      ? QUOTA_CONFIG.TASK_STATUS.BLOCKED_QUOTA
      : existing && existing.status === QUOTA_CONFIG.TASK_STATUS.IN_PROGRESS
      ? QUOTA_CONFIG.TASK_STATUS.IN_PROGRESS
      : QUOTA_CONFIG.TASK_STATUS.PENDING;

    if (!existing) {
      safeBacklog = addTaskToBacklog(
        safeBacklog,
        {
          id: taskId,
          titleFr: `${lot.lotLabel} : ${lot.specFileName}`,
          titleEn: `Batch ${lot.lotNumber}: ${lot.specFileName}`,
          promptFr: `Continue le dossier de passation : exécute le ${lot.lotLabel} (${lot.specFile}) dans passation/ROADMAP_PASSATION.md jusqu'à validation complète (tests >= 80%, FR/EN, statut ✅ TERMINÉ).`,
          promptEn: `Continue the passation folder: execute Batch ${lot.lotNumber} (${lot.specFile}) in passation/ROADMAP_PASSATION.md until full completion (tests >= 80%, FR/EN, ✅ TERMINÉ status).`,
          priority: lot.lotNumber,
        },
        nowMs
      ).backlog;
    }

    if (desiredStatus !== QUOTA_CONFIG.TASK_STATUS.PENDING || (existing && existing.status !== desiredStatus)) {
      safeBacklog = updateTaskStatus(safeBacklog, taskId, desiredStatus, nowMs).backlog;
    }
  }

  return { backlog: safeBacklog, passationInfo };
}

/**
 * Calcule l'état courant de la fenêtre de 5h et réinitialise automatiquement
 * la fenêtre si les 5 heures sont écoulées.
 * Fonction pure.
 *
 * @param {Object} state État de quota actuel
 * @param {number} [nowMs=Date.now()] Horodatage actuel en ms
 * @returns {{ state: Object, windowWasReset: boolean, remainingMs: number, remainingSeconds: number, isAvailable: boolean }}
 */
function evaluateQuotaWindow(state, nowMs = Date.now()) {
  const safeState = migrateQuotaState(state, nowMs);
  const safeNow = Number.isFinite(nowMs) && nowMs > 0 ? nowMs : Date.now();

  if (safeNow >= safeState.windowResetAt) {
    const resetState = {
      ...safeState,
      status: QUOTA_CONFIG.STATUS.ACTIVE,
      windowStartAt: safeNow,
      windowResetAt: safeNow + QUOTA_CONFIG.FIVE_HOURS_MS,
      invocationsInWindow: 0,
      autoContinueCountInTurn: 0,
      lastUpdatedAt: safeNow,
      lastError: null,
    };
    return {
      state: resetState,
      windowWasReset: true,
      remainingMs: QUOTA_CONFIG.FIVE_HOURS_MS,
      remainingSeconds: QUOTA_CONFIG.FIVE_HOURS_SECONDS,
      isAvailable: true,
    };
  }

  const remainingMs = Math.max(0, safeState.windowResetAt - safeNow);
  const remainingSeconds = Math.max(
    QUOTA_CONFIG.MIN_SCHEDULE_DELAY_SECONDS,
    Math.ceil(remainingMs / QUOTA_CONFIG.MS_PER_SECOND)
  );
  const isAvailable = safeState.status !== QUOTA_CONFIG.STATUS.COOLDOWN_5H;

  return {
    state: safeState,
    windowWasReset: false,
    remainingMs,
    remainingSeconds,
    isAvailable,
  };
}

/**
 * Enregistre une nouvelle invocation du modèle dans la fenêtre de 5h.
 * Fonction pure.
 *
 * @param {Object} state État actuel
 * @param {number} [nowMs=Date.now()] Horodatage actuel en ms
 * @returns {Object} Nouvel état mis à jour
 */
function recordInvocation(state, nowMs = Date.now()) {
  const { state: current } = evaluateQuotaWindow(state, nowMs);
  return {
    ...current,
    status: QUOTA_CONFIG.STATUS.ACTIVE,
    invocationsInWindow: current.invocationsInWindow + 1,
    totalInvocations: current.totalInvocations + 1,
    lastUpdatedAt: nowMs,
  };
}

/**
 * Détecte si un message d'erreur ou une raison d'arrêt correspond à une limite de quota Gemini 5h.
 * Fonction pure.
 *
 * @param {string} [terminationReason=''] Raison d'arrêt du hook Stop
 * @param {string} [errorMessage=''] Message d'erreur éventuel
 * @returns {boolean} Vrai si c'est un dépassement de quota
 */
function isQuotaLimitReached(terminationReason = '', errorMessage = '') {
  if (terminationReason === QUOTA_CONFIG.TERMINATION_REASONS.MAX_TOKEN_BUDGET_EXCEEDED) {
    return true;
  }
  const combined = `${terminationReason || ''} ${errorMessage || ''}`.toLowerCase();
  return QUOTA_CONFIG.QUOTA_ERROR_PATTERNS.some((pattern) => combined.includes(pattern));
}

/**
 * Bascule l'état en COOLDOWN_5H lorsque la limite de 5h est atteinte.
 * Fonction pure.
 *
 * @param {Object} state État actuel
 * @param {string} [reason='Quota limit reached'] Motif du blocage
 * @param {number} [nowMs=Date.now()] Horodatage actuel en ms
 * @returns {{ state: Object, resumeDelaySeconds: number, resetIso: string }}
 */
function markQuotaExceeded(state, reason = 'Quota limit reached', nowMs = Date.now()) {
  const safeState = migrateQuotaState(state, nowMs);
  const safeNow = Number.isFinite(nowMs) && nowMs > 0 ? nowMs : Date.now();

  const targetResetAt =
    safeState.windowResetAt > safeNow
      ? safeState.windowResetAt
      : safeNow + QUOTA_CONFIG.FIVE_HOURS_MS;

  const remainingMs = Math.max(0, targetResetAt - safeNow);
  const resumeDelaySeconds = Math.max(
    QUOTA_CONFIG.MIN_SCHEDULE_DELAY_SECONDS,
    Math.ceil(remainingMs / QUOTA_CONFIG.MS_PER_SECOND)
  );

  const updatedState = {
    ...safeState,
    status: QUOTA_CONFIG.STATUS.COOLDOWN_5H,
    windowResetAt: targetResetAt,
    lastQuotaHitAt: safeNow,
    lastUpdatedAt: safeNow,
    lastError: String(reason || 'Quota limit reached'),
  };

  return {
    state: updatedState,
    resumeDelaySeconds,
    resetIso: new Date(targetResetAt).toISOString(),
  };
}

/**
 * Sélectionne la prochaine tâche prioritaire à exécuter dans le backlog.
 * Fonction pure.
 *
 * @param {Object} backlog Backlog assaini
 * @returns {Object|null} La tâche prioritaire ou null
 */
function getNextExecutableTask(backlog) {
  const safeBacklog = migrateBacklog(backlog);
  const activeCandidates = safeBacklog.tasks.filter(
    (task) =>
      task.status === QUOTA_CONFIG.TASK_STATUS.IN_PROGRESS ||
      task.status === QUOTA_CONFIG.TASK_STATUS.BLOCKED_QUOTA ||
      task.status === QUOTA_CONFIG.TASK_STATUS.PENDING
  );

  if (activeCandidates.length === 0) {
    return null;
  }

  const statusRank = {
    [QUOTA_CONFIG.TASK_STATUS.IN_PROGRESS]: 0,
    [QUOTA_CONFIG.TASK_STATUS.BLOCKED_QUOTA]: 1,
    [QUOTA_CONFIG.TASK_STATUS.PENDING]: 2,
  };

  return [...activeCandidates].sort((a, b) => {
    const rankDiff = (statusRank[a.status] ?? 99) - (statusRank[b.status] ?? 99);
    if (rankDiff !== 0) return rankDiff;
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.createdAt - b.createdAt;
  })[0];
}

/**
 * Ajoute une nouvelle tâche bilingue au backlog.
 * Fonction pure.
 *
 * @param {Object} backlog Backlog existant
 * @param {{ id?: string, titleFr: string, titleEn: string, promptFr?: string, promptEn?: string, priority?: number }} taskInput
 * @param {number} [nowMs=Date.now()] Horodatage actuel en ms
 * @returns {{ backlog: Object, addedTask: Object }}
 */
function addTaskToBacklog(backlog, taskInput, nowMs = Date.now()) {
  const safeBacklog = migrateBacklog(backlog, nowMs);
  const input = taskInput && typeof taskInput === 'object' ? taskInput : {};
  const nextIndex = safeBacklog.tasks.length + 1;
  const id =
    typeof input.id === 'string' && input.id.trim().length > 0
      ? input.id.trim()
      : `task-${nextIndex}`;

  const titleFr =
    typeof input.titleFr === 'string' && input.titleFr.trim().length > 0
      ? input.titleFr.trim()
      : id;
  const titleEn =
    typeof input.titleEn === 'string' && input.titleEn.trim().length > 0
      ? input.titleEn.trim()
      : titleFr;

  const promptFr = typeof input.promptFr === 'string' ? input.promptFr.trim() : titleFr;
  const promptEn = typeof input.promptEn === 'string' ? input.promptEn.trim() : titleEn;
  const priority = Number.isFinite(input.priority) ? Math.max(1, Math.floor(input.priority)) : 2;

  const newTask = {
    id,
    title: { fr: titleFr, en: titleEn },
    prompt: { fr: promptFr, en: promptEn },
    priority,
    status: QUOTA_CONFIG.TASK_STATUS.PENDING,
    createdAt: nowMs,
    updatedAt: nowMs,
  };

  const existingIndex = safeBacklog.tasks.findIndex((tItem) => tItem.id === id);
  const updatedTasks =
    existingIndex >= 0
      ? safeBacklog.tasks.map((tItem, idx) => (idx === existingIndex ? newTask : tItem))
      : [...safeBacklog.tasks, newTask];

  return {
    backlog: {
      ...safeBacklog,
      updatedAt: nowMs,
      tasks: updatedTasks,
    },
    addedTask: newTask,
  };
}

/**
 * Met à jour le statut d'une tâche dans le backlog.
 * Fonction pure.
 *
 * @param {Object} backlog Backlog existant
 * @param {string} taskId Identifiant de la tâche
 * @param {string} newStatus Nouveau statut valide
 * @param {number} [nowMs=Date.now()] Horodatage actuel
 * @returns {{ backlog: Object, updatedTask: Object|null }}
 */
function updateTaskStatus(backlog, taskId, newStatus, nowMs = Date.now()) {
  const safeBacklog = migrateBacklog(backlog, nowMs);
  const validStatuses = Object.values(QUOTA_CONFIG.TASK_STATUS);
  const targetStatus = validStatuses.includes(newStatus)
    ? newStatus
    : QUOTA_CONFIG.TASK_STATUS.PENDING;

  let updatedTask = null;
  const tasks = safeBacklog.tasks.map((task) => {
    if (task.id === taskId) {
      updatedTask = {
        ...task,
        status: targetStatus,
        updatedAt: nowMs,
      };
      return updatedTask;
    }
    return task;
  });

  return {
    backlog: {
      ...safeBacklog,
      updatedAt: nowMs,
      tasks,
    },
    updatedTask,
  };
}

/**
 * Traite un événement de Hook Antigravity (`SessionStart`, `PreToolUse`, `PreInvocation`, `Stop`)
 * et retourne le nouvel état ainsi que l'objet JSON exact attendu sur stdout.
 * Fonction pure.
 *
 * @param {string} eventType Type d'événement du hook
 * @param {Object} hookInput Payload JSON reçu sur stdin
 * @param {Object} quotaState État actuel du quota
 * @param {Object} backlog Backlog actuel
 * @param {number} [nowMs=Date.now()] Horodatage actuel
 * @param {string} [roadmapMarkdown=''] Contenu optionnel de `passation/ROADMAP_PASSATION.md`
 * @returns {{ quotaState: Object, backlog: Object, stdoutPayload: Object }}
 */
function processHookEvent(
  eventType,
  hookInput,
  quotaState,
  backlog,
  nowMs = Date.now(),
  roadmapMarkdown = ''
) {
  const evalResult = evaluateQuotaWindow(quotaState, nowMs);
  let currentState = evalResult.state;
  const syncResult = syncBacklogWithPassation(backlog, roadmapMarkdown, nowMs);
  let currentBacklog = syncResult.backlog;
  const passationInfo = syncResult.passationInfo;
  const lang = currentState.language || QUOTA_CONFIG.DEFAULT_LANGUAGE;
  const safeInput = hookInput && typeof hookInput === 'object' ? hookInput : {};

  // Hook PreToolUse : Auto-accepte les outils pour ne jamais bloquer la conversation
  if (eventType === QUOTA_CONFIG.HOOK_EVENTS.PRE_TOOL_USE) {
    return {
      quotaState: currentState,
      backlog: currentBacklog,
      stdoutPayload: evaluatePreToolUse(safeInput, lang),
    };
  }

  if (eventType === QUOTA_CONFIG.HOOK_EVENTS.SESSION_START) {
    currentState = {
      ...currentState,
      autoContinueCountInTurn: 0,
      lastUpdatedAt: nowMs,
    };
    const nextTask = getNextExecutableTask(currentBacklog);
    const remainingStr = formatDuration(evalResult.remainingMs);
    const statusMsg = evalResult.isAvailable
      ? t(
          'windowActive',
          { invocations: currentState.invocationsInWindow, remaining: remainingStr },
          lang
        )
      : t(
          'windowCooldown',
          {
            remaining: remainingStr,
            resetTime: new Date(currentState.windowResetAt).toLocaleTimeString(),
          },
          lang
        );

    let passationMsg = '';
    if (passationInfo.totalLots > 0) {
      passationMsg = passationInfo.nextLot
        ? t(
            'passationNextLot',
            {
              done: passationInfo.completedLots,
              total: passationInfo.totalLots,
              lotLabel: passationInfo.nextLot.lotLabel,
              specFile: passationInfo.nextLot.specFile,
            },
            lang
          )
        : t('passationAllDone', { total: passationInfo.totalLots }, lang);
    } else {
      passationMsg = nextTask
        ? t('nextTaskReady', { id: nextTask.id, title: nextTask.title[lang] || nextTask.title.fr }, lang)
        : t('noPendingTask', {}, lang);
    }

    return {
      quotaState: currentState,
      backlog: currentBacklog,
      stdoutPayload: {
        injectSteps: [
          {
            ephemeralMessage: `[Quota 5h & Passation Auto-Pilot] ${statusMsg} | ${passationMsg}`,
          },
        ],
      },
    };
  }

  if (eventType === QUOTA_CONFIG.HOOK_EVENTS.PRE_INVOCATION) {
    currentState = recordInvocation(currentState, nowMs);
    return {
      quotaState: currentState,
      backlog: currentBacklog,
      stdoutPayload: {},
    };
  }

  if (eventType === QUOTA_CONFIG.HOOK_EVENTS.STOP) {
    const terminationReason = safeInput.terminationReason || '';
    const errorMsg = safeInput.error || '';

    // 1. Arrêt causé par la limite de quota 5h
    if (isQuotaLimitReached(terminationReason, errorMsg)) {
      const exceeded = markQuotaExceeded(currentState, errorMsg || terminationReason, nowMs);
      currentState = exceeded.state;

      const activeTask = getNextExecutableTask(currentBacklog);
      if (activeTask) {
        const updated = updateTaskStatus(
          currentBacklog,
          activeTask.id,
          QUOTA_CONFIG.TASK_STATUS.BLOCKED_QUOTA,
          nowMs
        );
        currentBacklog = updated.backlog;
      }

      return {
        quotaState: currentState,
        backlog: currentBacklog,
        stdoutPayload: {
          decision: 'stop',
        },
      };
    }

    // 2. Relance automatique de la conversation pour finir le Lot actif ou continuer le dossier passation
    const nextTask = getNextExecutableTask(currentBacklog);
    const hasPassationPending = passationInfo.nextLot !== null;
    const hasBlockedOrInProgressTask =
      nextTask !== null &&
      (nextTask.status === QUOTA_CONFIG.TASK_STATUS.BLOCKED_QUOTA ||
        nextTask.status === QUOTA_CONFIG.TASK_STATUS.IN_PROGRESS ||
        hasPassationPending);

    const canAutoContinue =
      currentState.autopilotEnabled &&
      evalResult.isAvailable &&
      terminationReason === QUOTA_CONFIG.TERMINATION_REASONS.NO_TOOL_CALL &&
      safeInput.fullyIdle !== false &&
      hasBlockedOrInProgressTask &&
      currentState.autoContinueCountInTurn < currentState.maxAutoContinueSteps;

    if (canAutoContinue) {
      currentState = {
        ...currentState,
        autoContinueCountInTurn: currentState.autoContinueCountInTurn + 1,
        lastUpdatedAt: nowMs,
      };
      if (nextTask) {
        const updated = updateTaskStatus(
          currentBacklog,
          nextTask.id,
          QUOTA_CONFIG.TASK_STATUS.IN_PROGRESS,
          nowMs
        );
        currentBacklog = updated.backlog;
      }

      const lotLabel = passationInfo.nextLot
        ? passationInfo.nextLot.lotLabel
        : nextTask
        ? nextTask.id
        : 'Lot';
      const specFile = passationInfo.nextLot
        ? passationInfo.nextLot.specFile
        : nextTask
        ? nextTask.title[lang] || nextTask.title.fr
        : 'passation/ROADMAP_PASSATION.md';

      const reason = t(
        'autoContinueReason',
        {
          remaining: formatDuration(evalResult.remainingMs),
          lotLabel,
          specFile,
        },
        lang
      );

      return {
        quotaState: currentState,
        backlog: currentBacklog,
        stdoutPayload: {
          decision: 'continue',
          reason,
        },
      };
    }

    return {
      quotaState: {
        ...currentState,
        autoContinueCountInTurn: 0,
        lastUpdatedAt: nowMs,
      },
      backlog: currentBacklog,
      stdoutPayload: {
        decision: 'stop',
      },
    };
  }

  return {
    quotaState: currentState,
    backlog: currentBacklog,
    stdoutPayload: {},
  };
}

/**
 * Génère un rapport complet bilingue de l'état de la fenêtre de 5h, du dossier `passation/` et du backlog.
 * Fonction pure.
 *
 * @param {Object} quotaState État du quota
 * @param {Object} backlog Backlog
 * @param {number} [nowMs=Date.now()] Horodatage actuel
 * @param {string} [roadmapMarkdown=''] Contenu optionnel de `passation/ROADMAP_PASSATION.md`
 * @returns {Object} Rapport structuré prêt à afficher
 */
function buildStatusReport(quotaState, backlog, nowMs = Date.now(), roadmapMarkdown = '') {
  const evalResult = evaluateQuotaWindow(quotaState, nowMs);
  const { backlog: safeBacklog, passationInfo } = syncBacklogWithPassation(
    backlog,
    roadmapMarkdown,
    nowMs
  );
  const nextTask = getNextExecutableTask(safeBacklog);
  const lang = evalResult.state.language || QUOTA_CONFIG.DEFAULT_LANGUAGE;

  const pendingCount = safeBacklog.tasks.filter(
    (tItem) =>
      tItem.status === QUOTA_CONFIG.TASK_STATUS.PENDING ||
      tItem.status === QUOTA_CONFIG.TASK_STATUS.BLOCKED_QUOTA
  ).length;
  const inProgressCount = safeBacklog.tasks.filter(
    (tItem) => tItem.status === QUOTA_CONFIG.TASK_STATUS.IN_PROGRESS
  ).length;
  const completedCount = safeBacklog.tasks.filter(
    (tItem) => tItem.status === QUOTA_CONFIG.TASK_STATUS.COMPLETED
  ).length;

  return {
    status: evalResult.state.status,
    autopilotEnabled: evalResult.state.autopilotEnabled,
    isQuotaAvailable: evalResult.isAvailable,
    invocationsInWindow: evalResult.state.invocationsInWindow,
    totalInvocations: evalResult.state.totalInvocations,
    windowStartIso: new Date(evalResult.state.windowStartAt).toISOString(),
    windowResetIso: new Date(evalResult.state.windowResetAt).toISOString(),
    remainingFormatted: formatDuration(evalResult.remainingMs),
    remainingSeconds: evalResult.remainingSeconds,
    summaryMessage: evalResult.isAvailable
      ? t(
          'windowActive',
          {
            invocations: evalResult.state.invocationsInWindow,
            remaining: formatDuration(evalResult.remainingMs),
          },
          lang
        )
      : t(
          'windowCooldown',
          {
            remaining: formatDuration(evalResult.remainingMs),
            resetTime: new Date(evalResult.state.windowResetAt).toISOString(),
          },
          lang
        ),
    passation: {
      totalLots: passationInfo.totalLots,
      completedLots: passationInfo.completedLots,
      pendingLots: passationInfo.pendingLots,
      nextLot: passationInfo.nextLot,
    },
    backlogSummary: {
      total: safeBacklog.tasks.length,
      pending: pendingCount,
      inProgress: inProgressCount,
      completed: completedCount,
      nextTask: nextTask
        ? {
            id: nextTask.id,
            title: nextTask.title[lang] || nextTask.title.fr,
            prompt: nextTask.prompt[lang] || nextTask.prompt.fr,
            status: nextTask.status,
            priority: nextTask.priority,
          }
        : null,
    },
  };
}

// ============================================================================
// Couche d'Entrées / Sorties (Persistance Disque & CLI)
// ============================================================================

/**
 * Lit un fichier JSON sur le disque de manière résiliente.
 *
 * @param {string} filePath Chemin du fichier JSON
 * @returns {Object|null} Contenu parsé ou null
 */
function readJsonSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (_err) {
    return null;
  }
}

/**
 * Lit un fichier texte (ex: `passation/ROADMAP_PASSATION.md`) de manière résiliente.
 *
 * @param {string} filePath Chemin du fichier texte
 * @returns {string} Contenu du fichier ou chaîne vide
 */
function readTextSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return '';
    }
    return fs.readFileSync(filePath, 'utf8');
  } catch (_err) {
    return '';
  }
}

/**
 * Écrit un objet JSON sur le disque en créant les dossiers parents si nécessaire.
 *
 * @param {string} filePath Chemin du fichier JSON
 * @param {Object} data Données à sérialiser
 */
function writeJsonSafe(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

/**
 * Résout les chemins des fichiers d'état, de backlog et de `passation/ROADMAP_PASSATION.md`.
 *
 * @param {string} [baseDir=process.cwd()] Dossier de référence
 * @returns {{ statePath: string, backlogPath: string, roadmapPath: string }}
 */
function resolveStoragePaths(baseDir = process.cwd()) {
  let normalizedBase = baseDir;
  const currentBase = path.basename(normalizedBase);
  if (currentBase === '.agents' || currentBase === 'scripts') {
    normalizedBase = path.dirname(normalizedBase);
  }
  return {
    statePath: path.join(normalizedBase, '.agents', 'state', 'quota-state.json'),
    backlogPath: path.join(normalizedBase, '.agents', 'backlog.json'),
    roadmapPath: path.join(normalizedBase, 'passation', 'ROADMAP_PASSATION.md'),
  };
}

/**
 * Point d'entrée CLI et Hook.
 *
 * @param {string[]} [argv=process.argv.slice(2)] Arguments CLI
 * @param {string} [baseDir=process.cwd()] Répertoire de travail
 * @param {string} [stdinData=''] Données reçues sur stdin (pour les hooks)
 * @returns {{ exitCode: number, output: string }}
 */
function runCli(argv = process.argv.slice(2), baseDir = process.cwd(), stdinData = '') {
  const { statePath, backlogPath, roadmapPath } = resolveStoragePaths(baseDir);
  const nowMs = Date.now();

  let quotaState = migrateQuotaState(readJsonSafe(statePath), nowMs);
  let backlog = migrateBacklog(readJsonSafe(backlogPath), nowMs);
  const roadmapMarkdown = readTextSafe(roadmapPath);

  const command = argv[0] || 'status';

  if (command === 'hook') {
    const eventType = argv[1] || QUOTA_CONFIG.HOOK_EVENTS.PRE_INVOCATION;
    let parsedInput = {};
    if (stdinData && stdinData.trim().length > 0) {
      try {
        parsedInput = JSON.parse(stdinData);
      } catch (_e) {
        parsedInput = {};
      }
    }
    const result = processHookEvent(
      eventType,
      parsedInput,
      quotaState,
      backlog,
      nowMs,
      roadmapMarkdown
    );
    writeJsonSafe(statePath, result.quotaState);
    writeJsonSafe(backlogPath, result.backlog);
    return {
      exitCode: 0,
      output: JSON.stringify(result.stdoutPayload),
    };
  }

  if (command === 'status') {
    const evalResult = evaluateQuotaWindow(quotaState, nowMs);
    const { backlog: syncedBacklog } = syncBacklogWithPassation(
      backlog,
      roadmapMarkdown,
      nowMs
    );
    writeJsonSafe(statePath, evalResult.state);
    writeJsonSafe(backlogPath, syncedBacklog);
    const report = buildStatusReport(evalResult.state, syncedBacklog, nowMs, roadmapMarkdown);
    return {
      exitCode: 0,
      output: JSON.stringify(report, null, 2),
    };
  }

  if (command === 'hit-limit') {
    const reason = argv.slice(1).join(' ') || 'Manual 5h quota cooldown triggered';
    const result = markQuotaExceeded(quotaState, reason, nowMs);
    writeJsonSafe(statePath, result.state);
    return {
      exitCode: 0,
      output: JSON.stringify(
        {
          message: t(
            'quotaHitRecorded',
            {
              remainingSeconds: result.resumeDelaySeconds,
              resetTime: result.resetIso,
            },
            result.state.language
          ),
          resumeDelaySeconds: result.resumeDelaySeconds,
          resetIso: result.resetIso,
          state: result.state,
        },
        null,
        2
      ),
    };
  }

  if (command === 'reset-window') {
    const freshState = {
      ...quotaState,
      status: QUOTA_CONFIG.STATUS.ACTIVE,
      windowStartAt: nowMs,
      windowResetAt: nowMs + QUOTA_CONFIG.FIVE_HOURS_MS,
      invocationsInWindow: 0,
      autoContinueCountInTurn: 0,
      lastUpdatedAt: nowMs,
      lastError: null,
    };
    writeJsonSafe(statePath, freshState);
    return {
      exitCode: 0,
      output: JSON.stringify(
        {
          message: t('windowReset', {}, freshState.language),
          state: freshState,
        },
        null,
        2
      ),
    };
  }

  if (command === 'add-task') {
    const titleFr = argv[1] || 'Nouvelle tâche autonome';
    const titleEn = argv[2] || titleFr;
    const priority = argv[3] ? Number(argv[3]) : 2;
    const { backlog: updatedBacklog, addedTask } = addTaskToBacklog(
      backlog,
      { titleFr, titleEn, priority },
      nowMs
    );
    writeJsonSafe(backlogPath, updatedBacklog);
    return {
      exitCode: 0,
      output: JSON.stringify(
        {
          message: t(
            'taskAdded',
            { id: addedTask.id, title: addedTask.title[quotaState.language] || addedTask.title.fr },
            quotaState.language
          ),
          task: addedTask,
        },
        null,
        2
      ),
    };
  }

  if (command === 'complete-task') {
    const taskId = argv[1] || '';
    const { backlog: updatedBacklog, updatedTask } = updateTaskStatus(
      backlog,
      taskId,
      QUOTA_CONFIG.TASK_STATUS.COMPLETED,
      nowMs
    );
    writeJsonSafe(backlogPath, updatedBacklog);
    return {
      exitCode: 0,
      output: JSON.stringify(
        {
          message: updatedTask
            ? t(
                'taskCompleted',
                { id: updatedTask.id, title: updatedTask.title[quotaState.language] },
                quotaState.language
              )
            : `Task not found: ${taskId}`,
          task: updatedTask,
        },
        null,
        2
      ),
    };
  }

  const report = buildStatusReport(quotaState, backlog, nowMs, roadmapMarkdown);
  return {
    exitCode: 0,
    output: JSON.stringify(report, null, 2),
  };
}

/**
 * Lit l'entrée standard (stdin) de manière asynchrone, non bloquante et résiliente.
 * Évite tout blocage indéfini (deadlock) sous Windows si le flux reste ouvert sans EOF.
 *
 * @param {number} [maxWaitMs=500] Délai d'attente maximum en millisecondes
 * @param {NodeJS.ReadableStream} [stream=process.stdin] Flux à lire
 * @returns {Promise<string>} Contenu lu sur stdin
 */
function readStdinSafe(maxWaitMs = 500, stream = process.stdin) {
  if (!stream || stream.isTTY) {
    return Promise.resolve('');
  }

  return new Promise((resolve) => {
    let buffer = '';
    let settled = false;

    const cleanup = () => {
      if (typeof stream.pause === 'function') {
        stream.pause();
      }
      if (typeof stream.removeListener === 'function') {
        stream.removeListener('data', onData);
        stream.removeListener('end', onEnd);
        stream.removeListener('error', onError);
      }
    };

    const finish = (result) => {
      if (!settled) {
        settled = true;
        cleanup();
        resolve(result);
      }
    };

    const timer = setTimeout(() => {
      finish(buffer);
    }, Math.max(50, maxWaitMs));

    const onData = (chunk) => {
      buffer += chunk;
      try {
        JSON.parse(buffer);
        if (timer) clearTimeout(timer);
        finish(buffer);
      } catch (_e) {
        // Flux JSON partiel, continue la lecture
      }
    };

    const onEnd = () => {
      if (timer) clearTimeout(timer);
      finish(buffer);
    };

    const onError = () => {
      if (timer) clearTimeout(timer);
      finish(buffer);
    };

    if (typeof stream.setEncoding === 'function') {
      stream.setEncoding('utf8');
    }
    if (typeof stream.on === 'function') {
      stream.on('data', onData);
      stream.on('end', onEnd);
      stream.on('error', onError);
    }
    if (typeof stream.resume === 'function') {
      stream.resume();
    }
  });
}

/**
 * Exécute le point d'entrée principal en mode asynchrone non-bloquant.
 *
 * @param {string[]} [argv=process.argv.slice(2)] Arguments CLI
 * @param {string} [baseDir=process.cwd()] Répertoire d'exécution
 * @returns {Promise<{ exitCode: number, output: string }>}
 */
async function main(argv = process.argv.slice(2), baseDir = process.cwd()) {
  let stdinBuffer = '';
  if (argv[0] === 'hook') {
    try {
      stdinBuffer = await readStdinSafe(250);
    } catch (_e) {
      stdinBuffer = '';
    }
  }
  const res = runCli(argv, baseDir, stdinBuffer);
  process.stdout.write(res.output + '\n');
  process.exit(res.exitCode);
  return res;
}

/* istanbul ignore next */
if (require.main === module) {
  main().catch((err) => {
    process.stderr.write(String(err) + '\n');
    process.exit(1);
  });
}

module.exports = {
  QUOTA_CONFIG,
  t,
  formatDuration,
  parsePassationRoadmap,
  evaluatePreToolUse,
  createDefaultQuotaState,
  createDefaultBacklog,
  migrateQuotaState,
  migrateBacklog,
  syncBacklogWithPassation,
  evaluateQuotaWindow,
  recordInvocation,
  isQuotaLimitReached,
  markQuotaExceeded,
  getNextExecutableTask,
  addTaskToBacklog,
  updateTaskStatus,
  processHookEvent,
  buildStatusReport,
  readJsonSafe,
  readTextSafe,
  writeJsonSafe,
  resolveStoragePaths,
  runCli,
  readStdinSafe,
  main,
};
