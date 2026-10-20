/**
 * @fileoverview Tests unitaires et d'intégration pour `.agents/scripts/quota-manager.js`.
 * Objectif : Couverture ≥ 80% (lignes, branches, fonctions), parité FR/EN,
 * auto-acceptation `PreToolUse` et synchronisation automatique du dossier `passation/`.
 */

'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const {
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
  resolveStoragePaths,
  runCli,
  readStdinSafe,
} = require('../.agents/scripts/quota-manager.js');
const rootWrapper = require('../scripts/quota-manager.js');
const { Readable } = require('node:stream');

const SAMPLE_ROADMAP_MD = `
| Lot | Fichier de Spécification | Périmètre Principal | Fichiers Ciblés | Statut |
| :--- | :--- | :--- | :--- | :--- |
| **Lot 1** | [\`LOT_1_SOCLE_ET_TESTS.md\`](file:///path/LOT_1_SOCLE_ET_TESTS.md) | Architecture Senior | \`config.js\` | ✅ TERMINÉ |
| **Lot 2** | [\`LOT_2_CANVAS_LIVING_WORLD.md\`](file:///path/LOT_2_CANVAS_LIVING_WORLD.md) | Canvas Interactif | \`renderer.js\` | ⏳ **À FAIRE (Prochain Lot)** |
| **Lot 3** | [\`LOT_3_GAMEPLAY_CASTES_BOSS.md\`](file:///path/LOT_3_GAMEPLAY_CASTES_BOSS.md) | Castes & Boss | \`game.js\` | ⏳ À FAIRE |
`;

describe('QuotaManager 5h - Parité Bilingue FR / EN et Traduction t()', () => {
  it('doit posséder exactement les mêmes clés en français et en anglais', () => {
    const frKeys = Object.keys(QUOTA_CONFIG.I18N.fr).sort();
    const enKeys = Object.keys(QUOTA_CONFIG.I18N.en).sort();
    assert.deepEqual(frKeys, enKeys);
    for (const key of frKeys) {
      assert.ok(QUOTA_CONFIG.I18N.fr[key].length > 0);
      assert.ok(QUOTA_CONFIG.I18N.en[key].length > 0);
    }
  });

  it('doit interpoler correctement les paramètres et gérer les cas limites', () => {
    const msgFr = t('windowActive', { invocations: 12, remaining: '3h 20m' }, 'fr');
    assert.ok(msgFr.includes('12'));
    assert.ok(msgFr.includes('3h 20m'));

    const msgEn = t('windowActive', { invocations: 12, remaining: '3h 20m' }, 'en');
    assert.ok(msgEn.includes('12'));
    assert.ok(msgEn.includes('3h 20m'));

    assert.equal(t('windowReset', {}, 'es'), QUOTA_CONFIG.I18N.fr.windowReset);
    assert.equal(t('unknown_key_xyz', { a: null }, 'fr'), 'unknown_key_xyz');
    assert.equal(t('', null, 'fr'), '');
  });
});

describe('QuotaManager 5h - Parseur du Dossier passation/ et Auto-Acceptation PreToolUse', () => {
  it('doit parser ROADMAP_PASSATION.md et identifier le prochain Lot à faire', () => {
    assert.equal(parsePassationRoadmap('').totalLots, 0);
    assert.equal(parsePassationRoadmap(null).totalLots, 0);

    const parsed = parsePassationRoadmap(SAMPLE_ROADMAP_MD);
    assert.equal(parsed.totalLots, 3);
    assert.equal(parsed.completedLots, 1);
    assert.equal(parsed.pendingLots, 2);
    assert.equal(parsed.nextLot.lotNumber, 2);
    assert.equal(parsed.nextLot.specFile, 'passation/LOT_2_CANVAS_LIVING_WORLD.md');
  });

  it('doit auto-accepter les outils de dev dans PreToolUse et bloquer les commandes dangereuses', () => {
    const safeRes = evaluatePreToolUse(
      {
        toolCall: {
          name: 'run_command',
          args: { CommandLine: 'node --test tests/quota-manager.test.js' },
        },
      },
      'fr'
    );
    assert.equal(safeRes.decision, 'allow');

    const editRes = evaluatePreToolUse(
      {
        toolCall: {
          name: 'edit_file',
          args: { Path: 'game.js' },
        },
      },
      'en'
    );
    assert.equal(editRes.decision, 'allow');

    const dangerRes = evaluatePreToolUse(
      {
        toolCall: {
          name: 'run_command',
          args: { CommandLine: 'rm -rf / --no-preserve-root' },
        },
      },
      'fr'
    );
    assert.equal(dangerRes.decision, 'deny');
  });

  it('doit synchroniser le backlog avec les lots de passation/ROADMAP_PASSATION.md', () => {
    const startMs = 1_700_000_000_000;
    const emptyBacklog = createDefaultBacklog(startMs);
    const { backlog: synced, passationInfo } = syncBacklogWithPassation(
      emptyBacklog,
      SAMPLE_ROADMAP_MD,
      startMs
    );

    assert.equal(passationInfo.totalLots, 3);
    assert.equal(synced.tasks.length, 3);
    assert.equal(synced.tasks[0].status, QUOTA_CONFIG.TASK_STATUS.COMPLETED);
    assert.equal(synced.tasks[1].status, QUOTA_CONFIG.TASK_STATUS.PENDING);

    const next = getNextExecutableTask(synced);
    assert.equal(next.id, 'passation-lot-2');
  });
});

describe('QuotaManager 5h - Formatage et Migration Défensive', () => {
  it('doit formater les durées en heures, minutes et secondes', () => {
    assert.equal(formatDuration(QUOTA_CONFIG.FIVE_HOURS_MS), '5h 00m');
    assert.equal(formatDuration(90 * 60 * 1000), '1h 30m');
    assert.equal(formatDuration(125 * 1000), '2m 05s');
    assert.equal(formatDuration(42 * 1000), '42s');
    assert.equal(formatDuration(-500), '0s');
    assert.equal(formatDuration(NaN), '0s');
  });

  it('doit créer et migrer un état de quota résilient face aux entrées corrompues', () => {
    const now = 1_700_000_000_000;
    const def = createDefaultQuotaState(now);
    assert.equal(def.windowStartAt, now);
    assert.equal(def.windowResetAt, now + QUOTA_CONFIG.FIVE_HOURS_MS);
    assert.equal(def.status, QUOTA_CONFIG.STATUS.ACTIVE);

    assert.deepEqual(migrateQuotaState(null, now), def);
    assert.deepEqual(migrateQuotaState([], now), def);

    const migrated = migrateQuotaState(
      {
        language: 'en',
        autopilotEnabled: false,
        status: 'INVALID_STATUS',
        windowStartAt: -10,
        windowResetAt: -50,
        invocationsInWindow: -3,
        totalInvocations: 15.8,
        autoContinueCountInTurn: 2,
        maxAutoContinueSteps: 0,
        lastQuotaHitAt: now - 1000,
        lastError: '429 Too Many Requests',
      },
      now
    );
    assert.equal(migrated.language, 'en');
    assert.equal(migrated.autopilotEnabled, false);
    assert.equal(migrated.status, QUOTA_CONFIG.STATUS.ACTIVE);
    assert.equal(migrated.invocationsInWindow, 0);
    assert.equal(migrated.totalInvocations, 15);
    assert.equal(migrated.maxAutoContinueSteps, QUOTA_CONFIG.DEFAULT_MAX_AUTO_CONTINUE_STEPS);
    assert.equal(migrated.lastError, '429 Too Many Requests');
  });

  it('doit migrer un backlog résilient avec normalisation bilingue', () => {
    const now = 1_700_000_000_000;
    assert.deepEqual(migrateBacklog(null, now), createDefaultBacklog(now));

    const migrated = migrateBacklog(
      {
        tasks: [
          null,
          { id: 't1', title: 'Simple Title', prompt: 'Simple Prompt', status: 'invalid' },
          {
            id: 't2',
            title: { fr: 'Titre FR', en: 'Title EN' },
            prompt: { fr: 'Prompt FR', en: 'Prompt EN' },
            priority: 1,
            status: QUOTA_CONFIG.TASK_STATUS.IN_PROGRESS,
          },
        ],
      },
      now
    );

    assert.equal(migrated.tasks.length, 2);
    assert.equal(migrated.tasks[0].title.fr, 'Simple Title');
    assert.equal(migrated.tasks[0].title.en, 'Simple Title');
    assert.equal(migrated.tasks[0].status, QUOTA_CONFIG.TASK_STATUS.PENDING);
    assert.equal(migrated.tasks[1].status, QUOTA_CONFIG.TASK_STATUS.IN_PROGRESS);
  });
});

describe('QuotaManager 5h - Logique Métier du Cycle de 5 Heures & Backlog', () => {
  const startMs = 1_700_000_000_000;

  it('doit évaluer la fenêtre active et la réinitialiser après 5 heures', () => {
    let state = createDefaultQuotaState(startMs);
    state = recordInvocation(state, startMs + 1000);
    assert.equal(state.invocationsInWindow, 1);
    assert.equal(state.totalInvocations, 1);

    const midEval = evaluateQuotaWindow(state, startMs + 2 * 3600 * 1000);
    assert.equal(midEval.windowWasReset, false);
    assert.equal(midEval.isAvailable, true);
    assert.equal(midEval.state.invocationsInWindow, 1);

    const after5h = startMs + QUOTA_CONFIG.FIVE_HOURS_MS + 1000;
    const resetEval = evaluateQuotaWindow(state, after5h);
    assert.equal(resetEval.windowWasReset, true);
    assert.equal(resetEval.state.invocationsInWindow, 0);
    assert.equal(resetEval.state.totalInvocations, 1);
    assert.equal(resetEval.state.windowResetAt, after5h + QUOTA_CONFIG.FIVE_HOURS_MS);
  });

  it('doit détecter les dépassements de quota et calculer le cooldown de 5h', () => {
    assert.equal(isQuotaLimitReached('MAX_TOKEN_BUDGET_EXCEEDED', ''), true);
    assert.equal(isQuotaLimitReached('ERROR', 'Resource_Exhausted: Quota exceeded'), true);
    assert.equal(isQuotaLimitReached('ERROR', 'HTTP 429 Too Many Requests'), true);
    assert.equal(isQuotaLimitReached('NO_TOOL_CALL', ''), false);

    const state = createDefaultQuotaState(startMs);
    const hit = markQuotaExceeded(state, '429 Rate Limit', startMs + 3600 * 1000);
    assert.equal(hit.state.status, QUOTA_CONFIG.STATUS.COOLDOWN_5H);
    assert.equal(hit.resumeDelaySeconds, 4 * 3600);
  });

  it('doit gérer le cycle de vie des tâches du backlog par priorité et statut', () => {
    let backlog = createDefaultBacklog(startMs);
    assert.equal(getNextExecutableTask(backlog), null);

    backlog = addTaskToBacklog(
      backlog,
      { id: 'low-prio', titleFr: 'Basse', titleEn: 'Low', priority: 3 },
      startMs
    ).backlog;
    backlog = addTaskToBacklog(
      backlog,
      { id: 'high-prio', titleFr: 'Haute', titleEn: 'High', priority: 1 },
      startMs + 10
    ).backlog;

    backlog = addTaskToBacklog(
      backlog,
      { id: 'high-prio', titleFr: 'Haute Modifiée', titleEn: 'High Updated', priority: 1 },
      startMs + 20
    ).backlog;
    backlog = addTaskToBacklog(
      backlog,
      { id: 'high-prio-2', titleFr: 'Haute 2', priority: 1 },
      startMs + 25
    ).backlog;
    backlog = addTaskToBacklog(backlog, null, startMs + 28).backlog;

    const next = getNextExecutableTask(backlog);
    assert.equal(next.id, 'high-prio');
    assert.equal(next.title.fr, 'Haute Modifiée');

    backlog = updateTaskStatus(
      backlog,
      'low-prio',
      QUOTA_CONFIG.TASK_STATUS.BLOCKED_QUOTA,
      startMs + 30
    ).backlog;
    assert.equal(getNextExecutableTask(backlog).id, 'low-prio');

    backlog = updateTaskStatus(
      backlog,
      'low-prio',
      QUOTA_CONFIG.TASK_STATUS.COMPLETED,
      startMs + 40
    ).backlog;
    assert.equal(getNextExecutableTask(backlog).id, 'high-prio');
  });
});

describe('QuotaManager 5h - Contrats de Hooks Antigravity & CLI', () => {
  let tmpDir;
  const startMs = 1_700_000_000_000;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'quota-5h-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('doit traiter SessionStart, PreToolUse, PreInvocation et Stop (passation + auto-continue)', () => {
    let state = createDefaultQuotaState(startMs);
    let backlog = createDefaultBacklog(startMs);

    // 1. SessionStart avec ROADMAP_PASSATION.md
    const startRes = processHookEvent(
      QUOTA_CONFIG.HOOK_EVENTS.SESSION_START,
      {},
      state,
      backlog,
      startMs,
      SAMPLE_ROADMAP_MD
    );
    assert.ok(Array.isArray(startRes.stdoutPayload.injectSteps));
    assert.ok(startRes.stdoutPayload.injectSteps[0].ephemeralMessage.includes('Lot 2'));

    // 2. PreToolUse (auto-accepte)
    const preToolRes = processHookEvent(
      QUOTA_CONFIG.HOOK_EVENTS.PRE_TOOL_USE,
      { toolCall: { name: 'write_file', args: { Path: 'game.js' } } },
      startRes.quotaState,
      startRes.backlog,
      startMs + 500,
      SAMPLE_ROADMAP_MD
    );
    assert.equal(preToolRes.stdoutPayload.decision, 'allow');

    // 3. PreInvocation
    const preRes = processHookEvent(
      QUOTA_CONFIG.HOOK_EVENTS.PRE_INVOCATION,
      {},
      preToolRes.quotaState,
      preToolRes.backlog,
      startMs + 1000,
      SAMPLE_ROADMAP_MD
    );
    assert.equal(preRes.quotaState.invocationsInWindow, 1);

    // 4. Stop pour dépassement de quota 5h
    const stopQuotaRes = processHookEvent(
      QUOTA_CONFIG.HOOK_EVENTS.STOP,
      { terminationReason: 'ERROR', error: 'Quota exceeded for 5h window' },
      preRes.quotaState,
      preRes.backlog,
      startMs + 3000,
      SAMPLE_ROADMAP_MD
    );
    assert.equal(stopQuotaRes.quotaState.status, QUOTA_CONFIG.STATUS.COOLDOWN_5H);
    assert.equal(stopQuotaRes.stdoutPayload.decision, 'stop');

    // 5. 5h plus tard : Stop avec NO_TOOL_CALL relance automatiquement le Lot 2 de passation !
    const after5h = startMs + QUOTA_CONFIG.FIVE_HOURS_MS + 5000;
    const stopResumeRes = processHookEvent(
      QUOTA_CONFIG.HOOK_EVENTS.STOP,
      { terminationReason: 'NO_TOOL_CALL', fullyIdle: true },
      stopQuotaRes.quotaState,
      stopQuotaRes.backlog,
      after5h,
      SAMPLE_ROADMAP_MD
    );
    assert.equal(stopResumeRes.stdoutPayload.decision, 'continue');
    assert.ok(stopResumeRes.stdoutPayload.reason.includes('Lot 2'));
  });

  it('doit exécuter toutes les commandes CLI (status, add-task, hit-limit, reset-window, complete-task, hook)', () => {
    const passationDir = path.join(tmpDir, 'passation');
    fs.mkdirSync(passationDir, { recursive: true });
    fs.writeFileSync(path.join(passationDir, 'ROADMAP_PASSATION.md'), SAMPLE_ROADMAP_MD, 'utf8');

    const addRes = runCli(['add-task', 'Ma tâche FR', 'My EN task', '1'], tmpDir);
    assert.equal(addRes.exitCode, 0);

    const statusRes = runCli(['status'], tmpDir);
    const statusObj = JSON.parse(statusRes.output);
    assert.equal(statusObj.passation.totalLots, 3);
    assert.equal(statusObj.passation.nextLot.lotNumber, 2);

    const hitRes = runCli(['hit-limit', 'Test 429'], tmpDir);
    const hitObj = JSON.parse(hitRes.output);
    assert.equal(hitObj.state.status, QUOTA_CONFIG.STATUS.COOLDOWN_5H);

    const resetRes = runCli(['reset-window'], tmpDir);
    const resetObj = JSON.parse(resetRes.output);
    assert.equal(resetObj.state.status, QUOTA_CONFIG.STATUS.ACTIVE);

    const hookPreTool = runCli(
      ['hook', 'PreToolUse'],
      path.join(tmpDir, '.agents'),
      JSON.stringify({ toolCall: { name: 'run_command', args: { CommandLine: 'node -v' } } })
    );
    assert.equal(JSON.parse(hookPreTool.output).decision, 'allow');

    const completeRes = runCli(['complete-task', 'passation-lot-2'], tmpDir);
    assert.equal(JSON.parse(completeRes.output).task.status, QUOTA_CONFIG.TASK_STATUS.COMPLETED);

    const notFoundComplete = runCli(['complete-task', 'non-existent'], tmpDir);
    assert.equal(JSON.parse(notFoundComplete.output).task, null);

    const unknownCmdRes = runCli(['unknown-cmd'], tmpDir);
    assert.equal(unknownCmdRes.exitCode, 0);

    const invalidStdinHook = runCli(['hook', 'PostInvocation'], tmpDir, '{invalid-json');
    assert.deepEqual(JSON.parse(invalidStdinHook.output), {});

    const cooldownState = markQuotaExceeded(
      createDefaultQuotaState(startMs),
      'Cooldown',
      startMs
    ).state;
    const emptyBacklog = createDefaultBacklog(startMs);
    const sessionCooldown = processHookEvent(
      QUOTA_CONFIG.HOOK_EVENTS.SESSION_START,
      null,
      cooldownState,
      emptyBacklog,
      startMs + 1000,
      ''
    );
    assert.ok(sessionCooldown.stdoutPayload.injectSteps[0].ephemeralMessage.includes('pause'));

    const cooldownReport = buildStatusReport(cooldownState, emptyBacklog, startMs + 1000, '');
    assert.equal(cooldownReport.isQuotaAvailable, false);
    assert.equal(cooldownReport.backlogSummary.nextTask, null);

    const normalStop = processHookEvent(
      QUOTA_CONFIG.HOOK_EVENTS.STOP,
      { terminationReason: 'NO_TOOL_CALL', fullyIdle: true },
      createDefaultQuotaState(startMs),
      emptyBacklog,
      startMs + 1000,
      ''
    );
    assert.equal(normalStop.stdoutPayload.decision, 'stop');

    const badPath = path.join(tmpDir, 'bad.json');
    fs.writeFileSync(badPath, '{not valid json', 'utf8');
    assert.equal(readJsonSafe(badPath), null);
    assert.equal(readTextSafe(path.join(tmpDir, 'missing.md')), '');
  });

  it('doit lire stdin de manière non bloquante et sécurisée (readStdinSafe)', async () => {
    // 1. TTY stream returns immediately ''
    const ttyStream = { isTTY: true };
    assert.equal(await readStdinSafe(100, ttyStream), '');

    // 2. Stream with valid JSON
    const jsonStream = Readable.from([JSON.stringify({ toolCall: { name: 'test' } })]);
    const resJson = await readStdinSafe(500, jsonStream);
    assert.ok(resJson.includes('test'));

    // 3. Stream with timeout / empty
    const emptyStream = new Readable({ read() {} });
    const resTimeout = await readStdinSafe(60, emptyStream);
    assert.equal(resTimeout, '');

    // 4. Stream with error
    const errStream = new Readable({
      read() {
        this.emit('error', new Error('stream error'));
      },
    });
    const resErr = await readStdinSafe(100, errStream);
    assert.equal(resErr, '');

    // 5. Test resolveStoragePaths with scripts and .agents
    const baseProject = path.join('tmp', 'mock-project');
    const pathAgents = resolveStoragePaths(path.join(baseProject, '.agents'));
    assert.equal(pathAgents.statePath, path.join(baseProject, '.agents', 'state', 'quota-state.json'));

    const pathScripts = resolveStoragePaths(path.join(baseProject, 'scripts'));
    assert.equal(pathScripts.statePath, path.join(baseProject, '.agents', 'state', 'quota-state.json'));

    // 6. Test rootWrapper export
    assert.equal(typeof rootWrapper.runCli, 'function');
    assert.equal(typeof rootWrapper.readStdinSafe, 'function');
  });
});
