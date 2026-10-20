# 🧬 Lot 6 : Arbre Génétique, Hauts Faits & Prestige 1 « Vol Nuptial »

> **Statut :** ✅ TERMINÉ  
> **Modèle Recommandé :** 🧠 Gemini 4 Argon (High)  
> **Prérequis :** Lots 1 à 5 terminés  
> **Origine :** ancien Lot 4 (+ jalon d'équilibrage de l'ancien Lot 6)  
> **Fichiers à consulter/modifier :** [`config.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/config.js), [`i18n.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/i18n.js), [`game.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/game.js), [`game-ui.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/game-ui.js), [`combat.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/combat.js), [`evolution.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/evolution.js), [`index.html`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/index.html), [`style.css`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/style.css), [`tests/`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/tests).

---

## 🎯 Objectifs du Lot 6
Clore la **première boucle complète** du jeu (« v1.0 jouable ») : progression génétique, objectifs à long terme et première réinitialisation volontaire récompensée avec un **Planificateur de Vol Nuptial** transparent. Ce lot arrive après l'économie, ce qui permet à l'arbre de consommer Miellat et Spores.

---

## 📋 Spécifications Détaillées

### 1. Arbre Génétique à 3 Branches (`GAME_CONFIG.MUTATIONS` étendu avec `branch`, `tier`, `requires`, `cost`)
| Branche | Tier I | Tier II | Tier III (coût en Spores ✨) |
| :--- | :--- | :--- | :--- |
| **Biomécanique** (combat) | `mandibules` (existant) | `carapace` (existant) | `acide` (existant) + `royal_exo` |
| **Métabolisme** (économie) | `trophallaxis` (+20 % ouvrières) | `mycology` (+35 % champignonnière) | `preservation` (+25 % grenier, hiver adouci) |
| **Chimie Phéromonale** (couvain) | `antennae` (+30 % phéromones) | `thermal_brood` (+25 % incubation) | `imperial_fervor` (ponte gratuite) |
- Les mutations existantes sont **conservées et reclassées** (migration des sauvegardes).
- Les effets passent **uniquement** par `computeModifiers` (Lot 4).
- SFX ajouté au registre `AUDIO` : `mutation`.

### 2. Hauts Faits (`GAME_CONFIG.ACHIEVEMENTS`) & Statistiques (`gameState.stats`)
- Création de `gameState.stats` (fourmis nées, raids repoussés, boss vaincus, jours survécus…), **persistant à travers les prestiges**. Ces statistiques serviront au Codex du Lot 12.
- Au moins **10 hauts faits** évalués par une fonction pure `evaluateAchievements(state)` : *Première Éclosion*, *Colonie Prospère (50)*, *Architecte (toutes les salles niv. 3+)*, *Rempart (3 raids repoussés)*, *Survivant de l'Hiver*, *Tueur de Mante*, *Éleveur (100 miellat)*, *Polyvalente (4 métiers actifs)*…
- Récompense en phéromones, notification bilingue, SFX `achievement`.

### 3. Prestige 1 — Vol Nuptial (`GAME_CONFIG.PRESTIGE.nuptialFlight`) & Planificateur (`getNuptialFlightPreview`)
- Condition : Chambre Royale niv. 5+ et population ≥ 50 (tokens).
- Formule pure `computeRoyalDnaGain(state)` (population, salles, phéromones cumulées, hauts faits).
- **Planificateur de Vol Nuptial (`getNuptialFlightPreview(state)`)** :
  - Décompose l'ADN Royal gagné par source (population, niveaux de salles, phéromones, hauts faits).
  - Calcule le **prochain palier rentable (*Next Breakpoint*)** : indique combien de fourmis ou de niveaux de salles il manque pour obtenir `+1 ADN Royal` supplémentaire, évitant au joueur de réinitialiser juste avant un palier.
- **Réinitialise / conserve** : respecter strictement la *Hiérarchie de Méta-Progression* de la roadmap (§4).
- Bonus permanent par point d'ADN (`bonusPerDna`) injecté dans `computeModifiers`.
- Modale de confirmation affichant le gain prévu et le prochain palier ; SFX `prestige`.
- Sous-panneau **Évolution › Dynastie** (il accueillera les espèces au Lot 10 et la Transcendance au Lot 12).

---

## ✅ Critères d'Acceptation (Definition of Done)
- [x] Arbre complet avec prérequis visuels ; sauvegardes existantes migrées sans perte.
- [x] Hauts faits et `stats` persistés, conservés au prestige (test d'intégration *prestige → reload*).
- [x] `computeRoyalDnaGain` et `getNuptialFlightPreview` purs, monotones et testés (valeurs limites, NaN, calcul du prochain palier).
- [x] **Jalon d'équilibrage II** : premier Vol Nuptial atteignable en 2 à 4 h de jeu actif (simulation, cibles dans `BALANCE_TARGETS`).
- [x] Aucun fichier ne dépasse 2 000 lignes ; parité FR/EN, couverture ≥ 80 %, mise à jour de [`ROADMAP_PASSATION.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/ROADMAP_PASSATION.md) et [`CONTEXT.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/CONTEXT.md).

## 🚫 Hors Périmètre (Idées reportées)
- Choix d'espèce et de biome au Vol Nuptial (Lot 10) ; Défis (Lot 12).
