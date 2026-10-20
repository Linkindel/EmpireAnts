# 🌪️ Lot 15 : Grands Cataclysmes Climatiques & Écosystème Vivant

> **Statut :** ⏳ À FAIRE  
> **Modèle Recommandé :** 🧠 Gemini 4 Argon (High)  
> **Prérequis :** Lots 1 à 14 terminés  
> **Fichiers à consulter/modifier :** [`config.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/config.js), [`i18n.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/i18n.js), [`game.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/game.js), [`game-world.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/game-world.js), [`combat.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/combat.js), [`renderer.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/renderer.js), [`renderer-effects.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/renderer-effects.js), [`index.html`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/index.html), [`style.css`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/style.css), [`tests/`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/tests).

---

## 🎯 Objectifs du Lot 15
Clore l'**Acte V** avec des événements climatiques majeurs à l'échelle du terrarium (**Grands Cataclysmes**) dont l'intensité s'adapte à la puissance de la colonie (`computeThreatIndex`) et qui mettent à l'épreuve toutes les mécaniques (Thermorégulation du dôme, Maçonnes, Chauffage fongique, Barricade, Merveilles), récompensant la survie par des **Bénédictions de Gaïa**.

---

## 📋 Spécifications Détaillées

### 1. Registre des Grands Cataclysmes (`GAME_CONFIG.CATACLYSMS`)
- Événements cycliques de haute intensité (annoncés plusieurs jours à l'avance avec compte à rebours dans le HUD) dont le seuil d'effort scale avec `computeThreatIndex(state)` :
  1. **Mousson Diluvienne** : menace d'inondation des galeries basses → contrée par le **Dôme Scellé** (Lot 5), les **Maçonnes** et des digues de **Brindilles/Silex**.
  2. **Fournaise Solaire** : assèchement des dépôts de surface → contrée par le **Dôme Ouvert** (ventilation), le **Miellat** (`aphid_farm`) et l'**Arbre Fongique Bioluminescent** (Lot 11).
  3. **Vague de Gel Centennal** : chute drastique de vitesse et d'incubation → contrée par le **Dôme Scellé**, la chaleur géothermique des **Abîmes** (Lot 7) et les **Nourrices** (Lot 4).
  4. **Séisme des Abîmes** : éboulements souterrains et assaut d'un Essaim Abyssal → contré par le **Dôme Impérial de Chitine** (Lot 11) et résolu via `resolveCombat`.

### 2. Préparation, Résolution Pure & Récompenses (`resolveCataclysm`)
- Fonction pure `contributeCataclysmDefense(state, resourceId, amount)` permettant d'investir des ressources avant l'impact pour hisser le bouclier de préparation de $0\%$ à $100\%$.
- Fonction pure `resolveCataclysm(state)` :
  - Si la préparation atteint $\ge 100\%$ : **Triomphe Écologique** → octroie de l'**Ambre 🟠**, de l'**Essence de Gaïa** (Lot 12) et un multiplicateur permanent de *Résilience Climatique* dans `computeModifiers`.
  - Si la préparation est partielle : pertes amorties proportionnellement (sans jamais détruire définitivement la partie).
- Rendu Canvas (`renderer-effects.js`) : pluie torrentielle, mirage thermique, blizzard cristallin ou secousses telluriques.

---

## ✅ Critères d'Acceptation (Definition of Done)
- [ ] `contributeCataclysmDefense` et `resolveCataclysm` purs, déterministes, indexés sur `computeThreatIndex` et testés.
- [ ] Synergie avec la Thermorégulation du Dôme (`open` / `sealed` du Lot 5) vérifiée par test.
- [ ] Effets climatiques rendus sur le Canvas sans erreur et respectant `gameState.settings.particleDensity` (Lot 3).
- [ ] Entrées des 4 cataclysmes ajoutées automatiquement au **Codex** (Lot 12).
- [ ] Aucun fichier ne dépasse 2 000 lignes ; suite de tests 100 % verte, couverture ≥ 80 %.
- [ ] Mise à jour de [`ROADMAP_PASSATION.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/ROADMAP_PASSATION.md) et de [`CONTEXT.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/CONTEXT.md).
