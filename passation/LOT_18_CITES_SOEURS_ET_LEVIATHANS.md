# 🦎 Lot 18 : Réseau Continental des Cités-Sœurs, Chasse aux Léviathans & Audit Final

> **Statut :** ⏳ À FAIRE  
> **Modèle Recommandé :** 🧠 Gemini 4 Argon (High)  
> **Prérequis :** Lots 1 à 17 terminés  
> **Fichiers à consulter/modifier :** [`config.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/config.js), [`i18n.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/i18n.js), [`game.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/game.js), [`game-world.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/game-world.js), [`combat.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/combat.js), [`renderer.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/renderer.js), [`renderer-effects.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/renderer-effects.js), [`index.html`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/index.html), [`style.css`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/style.css), [`tests/`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/tests).

---

## 🎯 Objectifs du Lot 18
Couronner l'**Acte VI (Fin de Jeu Ultime)** en donnant une **mémoire vivante aux Vols Nuptiaux** : chaque colonie fondée dans une vie précédente devient une **Cité-Sœur persistante** sur le Continent, et l'union de toutes vos Cités-Sœurs permet d'affronter le défi suprême à difficulté adaptative infinie : les **Léviathans** (prédateurs géants à l'échelle des fourmis). Terminer par l'audit global des 18 lots.

---

## 📋 Spécifications Détaillées

### 1. Mémoire des Vols Nuptiaux : Les Cités-Sœurs (`GAME_CONFIG.SISTER_CITIES`, `gameState.sisterCities`)
- Lors de chaque **Vol Nuptial** (Lot 6 / Lot 10), la colonie quittée est archivée sous forme de **Cité-Sœur** persistante (`{ id, species, biome, peakPower, maxRing, maxStratum, foundedAt }`) dans la limite d'un réseau continental extensible.
- Chaque Cité-Sœur verse un **Tribut Spécialisé** selon son couple Espèce/Biome (ex. une Cité-Sœur *Atta* en *Jungle* envoie des Spores ✨, une Cité-Sœur *Eciton* en *Désert* envoie de l'Obsidienne ⬛ et renforce l'armée).
- **Convois Continentaux** : les Cités-Sœurs peuvent envoyer des renforts militaires lors des sièges majeurs.

### 2. Chasse aux Léviathans — Boss Mondiaux à Difficulté Adaptative Infinie (`GAME_CONFIG.LEVIATHANS`)
- Au-delà des insectes, le monde extérieur abrite des **Titans Vertébrés & Arthropodes Géants** (échelons d'Extermination I → ∞) dont la puissance et les phases d'armure s'adaptent dynamiquement à `computeThreatIndex(state)` :
  1. **Bufo Rex (*Le Crapaud Cornu des Marais*)** : langue collante qui capture l'avant-garde → exige des Éclaireuses sur Coccinelles (Lot 9) et l'Acide des Guerrières.
  2. **Scolopendra Gigantea (*L'Empereur Centipède des Abîmes*)** : carapace segmentée régénérante → exige les Pioches Mythiques (Lot 8), les Scarabées Rhinocéros (Lot 9) et la souche Cordyceps (Lot 16).
  3. **Picus Viridis (*Le Pic-Vert Foreur de Dôme*)** : frappe le dôme depuis le ciel → exige le Dôme Impérial de Chitine (Lot 11), l'Acacia Cornigera (Lot 17) et les renforts des **Cités-Sœurs**.
  4. **Myrmecophaga (*L'Ombre du Grand Fourmilier — Boss Ultime Infini*)** : nécessite la coalition simultanée de la Colonie Mère, des Avant-Postes (Lot 11), des Vassaux (Lot 13) et des Cités-Sœurs.
- Résolution pure via `resolveCombat` (`combat.js`) en additionnant la puissance de la colonie active et les contingents des Cités-Sœurs mobilisées.
- Récompenses : **Cœurs de Gardien 💠** (T5), **Ambre 🟠**, **Essence de Gaïa** (Lot 12) et **Trophées de Léviathan** exposés dans la Chambre Royale et le Panthéon.

### 3. Audit Global de Fin de Roadmap (Lots 1 à 18)
- Vérification stricte de la règle **< 2 000 lignes par fichier** sur l'intégralité du dépôt.
- Zéro nombre magique ; parité bilingue `I18N.fr` == `I18N.en` à 100 %.
- **Jalon d'Équilibrage V (Anti-Trivialisation)** : test de simulation vérifiant que même avec toutes les Merveilles et Constellations, chaque nouvel échelon de Léviathan ($N \to N+1$) exige un investissement stratégique croissant et maintient la tension du jeu à l'infini.

---

## ✅ Critères d'Acceptation (Definition of Done)
- [ ] Archivage automatique d'une Cité-Sœur au Vol Nuptial et calcul des tributs/renforts purs et testés.
- [ ] Combat contre les 4 Léviathans résolu par `resolveCombat` avec scaling adaptatif infini vérifié par test.
- [ ] Sous-panneau **Armée › Cités-Sœurs & Léviathans** et entrées du **Codex** (Lot 12) opérationnels.
- [ ] Aucun fichier ne dépasse 2 000 lignes ; suite de tests 100 % verte, couverture ≥ 80 % sur l'ensemble du projet.
- [ ] Mise à jour finale de [`ROADMAP_PASSATION.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/ROADMAP_PASSATION.md) (18/18 `✅ TERMINÉ`) et de [`CONTEXT.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/CONTEXT.md).
