---
name: quota-5h-autopilot
description: >-
  Orchestrateur autonome type Paperclip adapté aux fenêtres de quota Gemini de 5 heures et au dossier passation/.
  Auto-accepte les actions pour finir les conversations sans interruption, synchronise les 15 Lots de
  passation/ROADMAP_PASSATION.md, et relance automatiquement la conversation dès que le quota de 5h se recharge.
---

# Skill : Quota 5h Auto-Pilot & Orchestrateur `passation/`

Ce skill prend en charge **deux missions critiques** en autonomie complète :
1. **Auto-accepter les étapes de la conversation en cours pour qu'elle aille jusqu'au bout du Lot sans bloquer**.
2. **Relancer automatiquement la conversation (immédiatement si quota disponible, ou au bout du cycle de 5h) pour enchaîner tous les Lots du dossier `passation/` (`Lot 1` $\rightarrow$ `Lot 15`)**.

---

## 1. Fonctionnement Automatique (Hooks + Passation + Schedule 5h)

1. **Auto-Acceptation (`PreToolUse` dans `.agents/hooks.json`)** :
   - Chaque outil appelé pendant le Lot (`run_command`, `write_file`, `edit_file`, `read_file`, `schedule`, etc.) est **auto-accepté (`decision: "allow"`)** par `scripts/quota-manager.js`, tout en filtrant les commandes système destructrices.
   - La conversation ne reste jamais bloquée en attente d'un clic « Accept / Allow ».

2. **Lecture & Synchronisation Native de `passation/ROADMAP_PASSATION.md`** :
   - `scripts/quota-manager.js` analyse automatiquement le tableau des **15 Lots** dans `passation/ROADMAP_PASSATION.md`.
   - Il repère les lots marqués `⏳ À FAIRE` et cible toujours le premier lot non terminé (`nextLot`, ex: `Lot 1` $\rightarrow$ `passation/LOT_1_SOCLE_ET_TESTS.md`).

3. **Relance Continue en Fin de Tour (`Stop` Hook)** :
   - Tant que le quota de 5h est actif et qu'un Lot du dossier `passation/` n'est pas marqué `✅ TERMINÉ`, le hook `Stop` renvoie `{"decision": "continue", "reason": "..."}` pour que l'agent termine complètement le Lot (tests $\ge 80\%$, parité FR/EN, mise à jour de `ROADMAP_PASSATION.md` et `CONTEXT.md`) et enchaîne.
   - Si le quota de 5h est atteint (`429`, `RESOURCE_EXHAUSTED`, `MAX_TOKEN_BUDGET_EXCEEDED`), le Lot est marqué `blocked_by_quota` et l'heure exacte de réinitialisation (`+5h`) est enregistrée.

4. **Relance Automatique de Conversation toutes les 5h (`schedule` + Sidecar `Relance Auto Quota Gemini 5h`)** :
   - Le cron daemon (`0 */5 * * *`) et l'automation `gemini-5h-autoresume` lancent automatiquement une nouvelle conversation (`agentapi new-conversation`) avec l'instruction :
     `« Continue le dossier de passation : exécute le prochain lot à faire dans passation/ROADMAP_PASSATION.md. »`

---

## 2. Commandes Utilitaires

- **Vérifier l'état du quota 5h et la progression des 15 Lots de `passation/`** :
  ```powershell
  & "C:\Program Files\nodejs\node.exe" .agents/scripts/quota-manager.js status
  ```
- **Simuler ou enregistrer une limite de 5h** :
  ```powershell
  & "C:\Program Files\nodejs\node.exe" .agents/scripts/quota-manager.js hit-limit "Quota 5h atteint"
  ```
- **Réinitialiser manuellement la fenêtre de 5h** :
  ```powershell
  & "C:\Program Files\nodejs\node.exe" .agents/scripts/quota-manager.js reset-window
  ```
