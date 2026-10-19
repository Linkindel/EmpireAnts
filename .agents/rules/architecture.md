# Règles d'Architecture Logicielle Senior - Empire Fourmi

Ces règles définissent les standards d'ingénierie logicielle pour garantir un code modulaire, découplé, testable et pérenne.

---

## 1. Principes SOLID & Séparation des Responsabilités (SoC)

- **Single Responsibility Principle (SRP)** : Chaque fonction, module et classe doit avoir une unique raison de changer.
  - `config.js` : Déclarations de données et tokens purs. Interdiction formelle d'y inclure de la logique exécutable ou des effets de bord.
  - `game.js` : Logique métier, calculs mathématiques, état de la simulation. Ne contient aucun appel à l'API 2D du Canvas.
  - `renderer.js` : Moteur de rendu graphique. Ne modifie jamais l'état du jeu (`gameState`), se contente de le lire.
  - `index.html` & `style.css` : Présentation, structure sémantique et design tokens `:root`.
- **Open/Closed Principle (OCP)** : Le système doit permettre d'ajouter de nouvelles castes, salles, missions ou doctrines simplement en étendant la configuration `GAME_CONFIG`, sans réécrire le cœur du moteur de jeu.

---

## 2. Flux Unidirectionnel & Gestion d'État Déterministe

- **Source Unique de Vérité** : `gameState` est l'unique représentant de la réalité du jeu en mémoire.
- **Accès en écriture restreint** : Seules les fonctions de mutation explicites (actions métier de `game.js`) sont autorisées à modifier `gameState`.
- **Rendu réactif passif** : L'interface utilisateur (`updateUI`) et le Canvas (`renderFrame`) sont des fonctions d'affichage synchronisées en lecture seule.

---

## 3. Pureté des Fonctions et Testabilité Maximale

- **Isolation de la logique pure** : Les calculs critiques (production de ressources, formules de combat, équilibrage des coûts, conversion de temps, formatage de nombres) doivent être des fonctions pures :
  - Même entrée $\rightarrow$ Même sortie.
  - Zéro dépendance directe au DOM (`window`, `document`) ou à l'horloge système non injectée.
- **Inversion de dépendance / Injection** : L'aléa (`Math.random`) et le temps (`Date.now`) doivent pouvoir être injectés ou mockés dans les tests pour garantir des résultats 100% reproductibles.

---

## 4. Règle du « Zéro Magic Number » & Centralisation des Tokens

- **Interdiction des constantes magiques** : Toute valeur numérique, coefficient multiplicateur, durée, probabilité, coût ou couleur doit être nommée et centralisée dans `GAME_CONFIG` ou dans les variables CSS `:root`.
- **Clarté sémantique** : Les noms de variables et fonctions doivent être auto-documentés (ex: `calculateResourceProductionRate` plutôt que `calcProd`).

---

## 5. Résilience, Programmation Défensive & Persistance

- **Contrats d'interface et gardes** : Toujours vérifier les valeurs aux frontières (garde-fous contre `NaN`, `null`, `undefined`, divisions par zéro et stocks négatifs).
- **Versioning de schéma (*Schema Versioning*)** : Les sauvegardes `localStorage` possèdent un numéro de version (`schemaVersion`) et sont fusionnées défensivement (*Deep Merge*) avec l'état initial par défaut pour prévenir toute corruption lors des mises à jour.
- **Confinement d'erreurs** : Une exception dans un composant secondaire ou graphique ne doit jamais bloquer la boucle principale du jeu (`gameTick`).
