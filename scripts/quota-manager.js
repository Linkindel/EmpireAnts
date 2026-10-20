#!/usr/bin/env node
/**
 * @fileoverview Relais racine pour le gestionnaire de quota 5h Antigravity.
 * Permet l'exécution sans faille de hooks quel que soit le répertoire courant (cwd).
 * Conforme aux standards d'Architecture Senior (SOLID, SoC, Zero Magic Number).
 */

'use strict';

const quotaManager = require('../.agents/scripts/quota-manager.js');

/* istanbul ignore next */
if (require.main === module) {
  quotaManager.main().catch((err) => {
    process.stderr.write(String(err) + '\n');
    process.exit(1);
  });
} else {
  module.exports = quotaManager;
}
