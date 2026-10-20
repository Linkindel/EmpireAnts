---
trigger: always_on
---

# Règles d'Architecture Logicielle Senior, Modularité & Zéro Dette — Empire Fourmi

Ces règles définissent les standards obligatoires d'ingénierie logicielle pour que **chaque conversation** produise un code propre, structuré, sans dette technique et hautement maintenable.

---

## 1. Plafond Strict de Taille des Fichiers (< 2000 Lignes) & Découpage Modulaire

- **Limite absolue : < 2000 lignes par fichier** :
  Aucun fichier du projet (`.js`, `.css`, `.html`, tests) ne doit **jamais atteindre ou dépasser 2000 lignes de code**. Cette limite est vérifiée automatiquement par la suite de tests (`npm test`).
- **Seuil de découpage proactif (1500 lignes)** :
  Dès qu'un fichier dépasse **1500 lignes** ou que les ajouts d'un Lot risquent de lui faire franchir le plafond des **2000 lignes**, l'agent doit **obligatoirement extraire un sous-module thématique** avant ou pendant l'implémentation.
- **Granularité des fonctions** :
  - Chaque fonction doit faire une seule chose (idéalement $\le 50$ lignes, plafond strict à $80$ lignes).
  - Maximum $3$ niveaux d'imbrication (`if`/`for`) : utiliser systématiquement des clauses de garde (*Early Return* / *Guard Clauses*).

### Plan Standard de Découpage Modulaire (Compatible Navigateur & Node.js)

Lorsque `config.js`, `game.js`, `renderer.js` ou `style.css` approchent la limite, découpez-les selon cette cartographie standard sans créer de dépendances circulaires :

1. **Couche Configuration (`GAME_CONFIG`)** :
   - `config.js` : Cœur des constantes, économie de base, salles, castes, saisons.
   - `i18n.js` *(extraction prioritaire si `config.js` > 1500 lignes)* : Dictionnaires bilingues `GAME_CONFIG.I18N.fr` et `GAME_CONFIG.I18N.en`.
   - `config-world.js` / `config-combat.js` *(si besoin aux Lots 4–12)* : Extensions de `GAME_CONFIG` pour l'exploration infinie, l'atelier, les montures, la génétique et le lore.
2. **Couche Moteur & Interface (`gameState` & logique)** :
   - `game.js` : Modèle `gameState`, boucle temporelle `gameTick`, calculs économiques de base, sauvegarde/chargement (`sanitizeGameState`).
   - `game-ui.js` *(extraction prioritaire si `game.js` > 1500 lignes)* : Synchronisation DOM (`updateUI`), gestion des onglets/sous-onglets, modales, raccourcis clavier et synthèse WebAudio (`playSfx`).
   - `game-combat.js` / `game-world.js` *(si besoin aux Lots 4–12)* : Moteur de combat unifié (`resolveCombat`), événements, exploration procédurale (Anneaux/Abîmes), artisanat, écurie et prestiges.
3. **Couche Rendu Graphique Canvas (`renderer`)** :
   - `renderer.js` : Orchestrateur Canvas 2D, caméra, boucle principale, graphe des galeries et interaction (`hitTestNode`).
   - `renderer-effects.js` / `renderer-world.js` *(extraction prioritaire si `renderer.js` > 1500 lignes)* : Météo saisonnière, particules, phéromones lumineuses, textes flottants, dessin spécialisé des salles et entités.

### Patron Technique d'un Sous-Module (Dual Browser `<script>` + Node.js `require`)

Tout nouveau fichier `.js` extrait doit :
1. Être inclus dans `index.html` dans l'ordre exact des dépendances.
2. Être chargé dans les fichiers de tests (`tests/*.test.js`) et mis à jour dans `CONTEXT.md`.
3. Respecter le patron d'exposition universel (sans bundler) :
```javascript
(function (root) {
  'use strict';
  // Récupération des dépendances (GAME_CONFIG, gameState, etc.)
  const GAME_CONFIG = root.GAME_CONFIG || (typeof require === 'function' ? require('./config.js').GAME_CONFIG : null);

  function maFonctionMetierPure(state, params) {
    // ...
  }

  // Exposition globale Navigateur & Node.js
  const API = { maFonctionMetierPure };
  Object.assign(root, API);
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
```

---

## 2. Principes SOLID & Séparation des Responsabilités (SoC)

- **Single Responsibility Principle (SRP)** :
  - `config*.js` / `i18n.js` : Déclarations de données et tokens purs. **Zéro logique exécutable à effet de bord**.
  - `game*.js` (hors `game-ui.js`) : Logique métier, calculs mathématiques purs, mutations contrôlées de `gameState`. **Zéro appel à l'API 2D du Canvas**.
  - `game-ui.js` : Lecture de `gameState` pour mettre à jour le DOM et branchement des événements utilisateurs vers les actions de `game.js`.
  - `renderer*.js` : Moteur de rendu graphique Canvas 2D. **Lecture seule stricte** sur `gameState` (ne modifie jamais l'état du jeu).
  - `index.html` & `style.css` : Structure sémantique et design tokens CSS `:root`.
- **Open/Closed Principle (OCP)** :
  Ajouter une caste, une ressource, une salle, une recette ou un biome doit se faire en enrichissant les registres déclaratifs de `GAME_CONFIG` (*Data-Driven*), sans multiplier les `if/else` ou `switch` en dur dans le moteur.

---

## 3. Politique Zéro Dette Technique & Maintenabilité

- **Un Concept = Un Seul Système** : Consulter systématiquement le *Registre des Systèmes Partagés* (`passation/ROADMAP_PASSATION.md` §3). Étendre le système existant (`RESOURCES`, `resolveCombat`, `computeModifiers`, `UI_PANELS`) au lieu de créer une variante parallèle.
- **DRY (Don't Repeat Yourself)** : Factoriser immédiatement tout bloc de calcul ou de génération DOM dupliqué plus de 2 fois.
- **Zéro Code Mort** : Interdiction de laisser du code commenté, des fonctions dépréciées inutilisées ou des variables orphelines.
- **Règle du Boy Scout** : Si une conversation modifie un fichier approchant les 1500–1800 lignes, elle doit le nettoyer et, si nécessaire, en extraire un sous-module propre pour le ramener sous le seuil de confort.

---

## 4. Flux Unidirectionnel & Pureté des Fonctions

- **Source Unique de Vérité** : `gameState` est l'unique représentant de l'état de la partie en mémoire.
- **Mutations Explicites** : Seules les fonctions d'action métier modifient `gameState`. Le rendu (`updateUI`, `renderFrame`) est 100% passif et sans effet de bord sur les ressources.
- **Fonctions Pures & Déterminisme** :
  - Les formules (production, coûts, combat, progression hors-ligne, formatage) doivent être des fonctions pures (`(state, config, dt) => result`).
  - L'horloge (`Date.now`) et l'aléa (`Math.random`) doivent être injectables ou mockables pour les tests unitaires.

---

## 5. Règle du « Zéro Magic Number », Résilience & Persistance

- **Zéro Magic Number** : Tout seuil, coût, durée, coefficient, probabilité ou couleur doit provenir de `GAME_CONFIG` ou de `:root` CSS.
- **Programmation Défensive** : Protéger chaque frontière contre `NaN`, `null`, `undefined`, `Infinity`, les divisions par zéro et les stocks négatifs.
- **Persistance Versionnée (`SCHEMA_VERSION`)** : Toute évolution de `gameState` incrémente `SCHEMA_VERSION` et met à jour `sanitizeGameState` avec fusion défensive (*Deep Merge*) pour ne jamais casser une sauvegarde existante.
