# 🗺️ Lot 7 : Exploration Infinie — Anneaux, Abîmes, Ponts Vivants & Scaling Adaptatif

> **Statut :** ⏳ À FAIRE  
> **Modèle Recommandé :** 🧠 Gemini 4 Argon (High)  
> **Prérequis :** Lots 1 à 6 terminés  
> **Fusion de :** ancien Lot 8 (Carte du monde) + ancien Lot 11 (Abîmes & Reliques) + Ponts Vivants & Scaling Anti-Snowball  
> **Fichiers à consulter/modifier :** [`config.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/config.js), [`i18n.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/i18n.js), [`game.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/game.js), [`game-world.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/game-world.js), [`combat.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/combat.js), [`renderer.js`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/renderer.js), [`index.html`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/index.html), [`style.css`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/style.css), [`tests/`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/tests).

---

## 🎯 Objectifs du Lot 7
Ouvrir la **progression infinie** sur deux axes portés par **un seul générateur procédural** (`game-world.js`) et **un seul moteur de combat** (`resolveCombat`, Lot 4) : l'horizontal (anneaux de surface) et le vertical (strates des abîmes avec aléas environnementaux), avec une **courbe de difficulté super-exponentielle par paliers** pour garantir que chaque nouvel anneau ou strate reste un vrai défi stratégique.

---

## 📋 Spécifications Détaillées

### 1. Générateur Procédural Unique (`generateZone`) & Courbe de Difficulté Anti-Snowball
- Isoler la logique d'exploration procédurale dans **`game-world.js`** pour maintenir `game.js` sous 1 500 lignes.
- Fonction pure et déterministe `generateZone({ axis: 'ring' | 'stratum', level, seed })` → `{ sectors, faction, difficulty, loot, guardian, hardnessTier, hazard, tierGateMultiplier }`.
- **Scaling Adaptatif par Paliers (*Tier Gates* — `GAME_CONFIG.EXPLORATION.adaptiveScaling`)** :
  - Difficulté de base : $D(\text{level}) = D_0 \times \text{scale}^{\text{level}} \times \text{TierGate}(\lfloor \text{level} / 5 \rfloor)$.
  - Tous les **5 Anneaux** et toutes les **5 Strates**, un multiplicateur de palier (*Tier Gate*) et une combinaison **Faction + Aléa** empêchent de franchir la zone par simple force brute : le joueur doit adapter sa composition d'escouade, ses contres tactiques, puis ses outils (Lot 8), montures (Lot 9) et pistes phéromonales (Lot 14).
  - Les récompenses ($R_0 \times \text{lootScale}^{\text{level}}$) restent toujours inférieures d'un léger facteur ($\gamma \approx 0.92$) à la croissance de la difficulté pour **obliger le joueur à utiliser les synergies multi-systèmes et les Vols Nuptiaux** pour progresser toujours plus loin.

### 2. Axe Horizontal — Anneaux de Surface & Ponts Vivants d'Ouvrières (`formLivingBridge`)
- Les missions fixes (`pucerons`, `chenille`, `fourmis_rouges`, `termites`, `mantis_boss`) deviennent les **secteurs de l'Anneau 1** (migration douce des sauvegardes).
- Chaque anneau : 3 à 5 secteurs portant une **faction** du Lot 4, plus un **Gardien d'Anneau**. Le vaincre débloque l'anneau N+1.
- **Ponts Vivants & Chaînes d'Ouvrières (`formLivingBridge(state, targetSectorOrTunnel)`)** :
  - Comme les vraies fourmis légionnaires (*Eciton*) et tisserandes (*Oecophylla*), le joueur peut mobiliser temporairement un groupe d'ouvrières (`bridgeWorkers`) pour former un **Pont Vivant** :
    - Sur le Canvas : relie directement l'entrée aux dépôts de surface (+25 % vitesse de récolte) avec rendu visuel d'une chaîne d'ouvrières accrochées par les mandibules.
    - En Exploration : permet de franchir un secteur à crevasse avant d'avoir débloqué l'Atelier du Lot 8, en immobilisant ces ouvrières pendant la durée de l'expédition.

### 3. Axe Vertical — Strates des Abîmes (`abyssDepth`) & Aléas Environnementaux (`ABYSS_HAZARDS`)
- Nouveau nœud Canvas `abyss_shaft` (position réservée `0.40, 0.95`) : puits qui s'assombrit avec la profondeur.
- Chaque strate franchie augmente `popCap`, la chaleur géothermique (qui atténue l'hiver, surtout en mode *Dôme Scellé* du Lot 5) et révèle des filons : Silex (strates 1-10), **Obsidienne** (T4, strates 10+).
- **Aléas Environnementaux des Abîmes (`GAME_CONFIG.ABYSS_HAZARDS`)** : *Obscurité Abyssale*, *Faille Crevassée*, *Vapeurs Acides*, *Veine Géothermique*.
- Toutes les 5 strates, un **Gardien de Strate** (*Scolopendre*, *Scorpion Cristallin*, *Ver de Magma*…) bloque le forage.
- Chaque strate porte un `hardnessTier` (`requiredToolTier`, activé au Lot 8).

### 4. Ambre 🟠 & Reliques (`RESOURCES.amber`, `GAME_CONFIG.RELICS`)
- **L'Ambre est la monnaie méta unique du jeu** : elle tombe des Gardiens (des deux axes).
- Reliques : *Ambre de la Reine Primordiale*, *Mandibule Fossile*, *Spore Éternelle*, *Goutte de Sève Solaire*. Niveau 1 → ∞, coûts croissants anti-inflation, **conservées au Vol Nuptial**, effets via `computeModifiers`.

---

## ✅ Critères d'Acceptation (Definition of Done)
- [ ] `generateZone` (incluant `hazard` et `tierGateMultiplier`) pur, déterministe et testé jusqu'au niveau 1 000.
- [ ] Test de simulation prouvant que la difficulté des paliers 5, 10, 15 croît plus vite que la simple production linéaire, exigeant les multiplicateurs combinés.
- [ ] `formLivingBridge` pur et testé (immobilisation et libération des ouvrières).
- [ ] Gardiens résolus par `resolveCombat` ; Ambre et Reliques persistées et conservées au prestige.
- [ ] Aucun fichier ne dépasse 2 000 lignes ; parité FR/EN, couverture ≥ 80 %, mise à jour de [`ROADMAP_PASSATION.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/passation/ROADMAP_PASSATION.md) et [`CONTEXT.md`](file:///c:/Users/Lebrun%20David/Documents/Projet/Projet1/CONTEXT.md).
