# 🌌 Lot 12 : Défis, Prestige 2 « Transcendance », Carte Céleste, Codex & Lore Optionnel

> **Statut :** ⏳ À FAIRE  
> **Modèle Recommandé :** 🧠 Gemini 4 Argon (High)  
> **Prérequis :** Lots 1 à 11 terminés  
> **Fusion de :** ancien Lot 12 (Défis, Transcendance, Codex) + Lore et Portail de l'ancien Lot 16  
> **Fichiers à consulter/modifier :** [`config.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/config.js), [`i18n.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/i18n.js), [`game.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/game.js), [`game-world.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/game-world.js), [`combat.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/combat.js), [`renderer.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/renderer.js), [`index.html`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/index.html), [`style.css`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/style.css), [`tests/`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/tests).

---

## 🎯 Objectifs du Lot 12
Couronner l'Acte IV avec la seconde couche de prestige (**Transcendance** et sa **Carte Céleste / Racinaire interactive**), des Défis rejouables à paliers, une encyclopédie (**Codex**) qui raconte la progression du joueur et une histoire **100 % optionnelle**.

---

## 📋 Spécifications Détaillées

### 1. Défis à Paliers (`GAME_CONFIG.CHALLENGES`)
- Activés au moment du Vol Nuptial ; chaque réussite augmente le palier (1 → ∞) et un multiplicateur permanent :
  1. **Ère Glaciaire** : hiver permanent → bonus fongique à vie.
  2. **Assaut Incessant** : raids ×3 → bonus militaire à vie.
  3. **Colonie Minimaliste** : `popCap` ÷ 2 → bonus d'équipement à vie.
  4. **Sécheresse** : aucune récolte de surface → bonus de miellat et de forage à vie.
- Les contraintes sont des modificateurs (`computeModifiers`), pas des branches de code spéciales.

### 2. Prestige 2 — Transcendance Planétaire (`GAME_CONFIG.PRESTIGE.transcendence`) & Carte des Constellations
- Condition : maîtrise de plusieurs espèces/biomes (Lot 10) et strate profonde atteinte (tokens).
- Monnaie : **Essence de Gaïa** (couche 2), investie dans des **Constellations** sans plafond de niveau (vitesse globale, multiplicateur d'ADN Royal, conservation de salles au prestige…). Certaines constellations coûtent aussi de l'**Ambre** (puits de fin de jeu, Lot 7).
- **Carte Interactive des Constellations** : rendu graphique en réseau stellaire / racinaire dans le sous-panneau **Évolution › Dynastie**, permettant de visualiser et d'améliorer les nœuds de Constellations.
- Réinitialise / conserve : selon la *Hiérarchie de Méta-Progression* de la roadmap (§4).

### 3. Codex & Panthéon (sous-panneau **Monde › Codex**)
- Encyclopédie bilingue générée **depuis les registres** (`CASTES`, `SPECIES`, `BIOMES`, `FACTIONS`, `RELICS`, `MOUNTS`, `MERCHANTS`) : une entrée se débloque à la première rencontre.
- Panthéon : statistiques historiques (`gameState.stats`, Lot 6).

### 4. Lore Optionnel — *Les Vestiges de l'Empire Primordial*
- **Tablettes de Chitine** (`loreFragments`) trouvées en forant les strates, en conquérant des anneaux ou auprès du Professeur Bombus (Lot 9) ; elles sont lisibles dans le Codex.
- Toutes les tablettes réunies → construction facultative du **Portail de la Ruche Ancienne** → Gardien légendaire optionnel (*Gardien Mécanique d'Ambre*) résolu par `resolveCombat`. Le jeu continue ensuite à l'infini.
- Aucune mécanique principale n'est bloquée par le lore.

### 5. Jalon d'Équilibrage IV
- **Jalon d'équilibrage IV** : simulation complète de la boucle (premier prestige, première transcendance) dans les cibles de `BALANCE_TARGETS`.

---

## ✅ Critères d'Acceptation (Definition of Done)
- [ ] Défis à paliers fonctionnels, avec multiplicateurs permanents.
- [ ] Transcendance et Carte des Constellations opérationnelles et persistées (migration de schéma).
- [ ] Codex généré depuis les registres, lore non bloquant, Portail optionnel.
- [ ] Aucun fichier ne dépasse 2 000 lignes ; suite de tests 100 % verte, couverture ≥ 80 % sur l'ensemble du projet.
- [ ] Mise à jour de [`ROADMAP_PASSATION.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/ROADMAP_PASSATION.md) et de [`CONTEXT.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/CONTEXT.md).
