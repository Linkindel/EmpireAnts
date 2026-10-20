---
trigger: always_on
---

# Règles de Robustesse, Maintenabilité, État et Qualité de Code

Ces règles garantissent la stabilité, la maintenabilité sans dette technique et la testabilité du code d'Empire Fourmi à chaque conversation.

## 1. Maintenabilité, Propreté & Limite de Taille (< 2000 Lignes)
- **Interdiction absolue des fichiers monolithiques (> 2000 lignes)** : Aucun fichier du projet ne doit jamais dépasser **2000 lignes de code**. Dès **1500 lignes**, extraire les responsabilités secondaires dans des sous-modules dédiés (`i18n.js`, `game-ui.js`, `game-combat.js`, `renderer-effects.js`, etc.) selon le plan défini dans `.agents/rules/architecture.md`.
- **Fonctions courtes et lisibles** : Chaque fonction doit rester concise ($\le 50$ lignes cible, $80$ lignes max) avec un nom explicite et un niveau d'indentation maximal de $3$ (utiliser les *Guard Clauses* / *Early Returns*).
- **Zéro Dette Technique** :
  - Aucune duplication de logique (*DRY*) : utiliser des fonctions génériques pilotées par `GAME_CONFIG`.
  - Aucun code mort, bloc commenté ou variable inutilisée.
  - Aucun bricolage temporaire (*workaround* non documenté ou système en doublon).

## 2. Flux de Données Unidirectionnel & Immutabilité Sélective
- **Principe d'accès** : Seul le moteur métier (`game*.js`) est habilité à muter `gameState`.
- **Rendu en lecture seule** : Le moteur de rendu (`renderer*.js`) et les gestionnaires d'événements du DOM ne doivent jamais modifier l'état directement ; ils invoquent des fonctions d'action métier explicites.
- **Pureté des calculs** : Les fonctions de calcul d'équilibrage, de production, de combat et de tirage aléatoire doivent être des fonctions pures ou isolées, facilement testables unitairement sans dépendre du DOM.

## 3. Robustesse de la Persistance & Migration de Schéma (*Schema Versioning*)
- **Version de schéma** : Toute sauvegarde dans le `localStorage` doit comporter un identifiant de version (`schemaVersion` / `SCHEMA_VERSION`).
- **Fusion défensive (*Deep Merge*)** : Au chargement (`sanitizeGameState`), fusionner défensivement l'objet chargé avec la structure par défaut (`INITIAL_STATE`) pour initialiser automatiquement les nouvelles propriétés absentes des anciennes sauvegardes sans corrompre la partie du joueur.
- **Tolérance aux pannes** : Tout échec de désérialisation JSON ou Base64 doit être capturé par un bloc `try/catch` avec fallback propre sur l'état initial sans blocage du jeu.

## 4. Séparation Stricte des Responsabilités (SoC)
- `config*.js` / `i18n.js` : Uniquement des constantes déclaratives (`GAME_CONFIG`), zéro code exécutable à effet de bord.
- `game*.js` : Moteur de règles métier et simulation d'état (`gameState`), zéro code de dessin Canvas 2D.
- `renderer*.js` : Rendu graphique Canvas uniquement, lecture de `gameState` et `GAME_CONFIG`, zéro logique de modification de ressources.
- `index.html` / `style.css` : Présentation, structure sémantique et design tokens CSS.

## 5. Déterminisme et Gestion du Temps (*Delta Time & Ticks*)
- **Temps réel et rattrapage** : Les calculs de production doivent s'appuyer sur le différentiel de temps réel ($\Delta t$ / horodatage `Date.now()`) pour garantir une vitesse de jeu indépendante de la fréquence de l'écran (60Hz, 120Hz, etc.).
- **Plafond d'absence (*Offline Cap*)** : La simulation hors-ligne ou de retour d'onglet inactif doit être plafonnée pour éviter des débordements de mémoire ou des sauts incontrôlés.

## 6. Programmation Défensive & Validation aux Frontières
- **Vérification systématique** : Protéger tout calcul critique contre les divisions par zéro, les valeurs `NaN`, `Infinity`, les nombres négatifs incohérents et les débordements de stock.
- **Isolation d'erreurs** : Une erreur dans l'affichage, l'audio ou une animation secondaire ne doit jamais interrompre la boucle principale `gameTick`.
