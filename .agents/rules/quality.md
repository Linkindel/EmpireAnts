# Règles de Robustesse, d'État et de Qualité de Code

Ces règles garantissent la stabilité, la testabilité et la pérennité du code d'Empire Fourmi.

## 1. Flux de Données Unidirectionnel & Immutabilité Sélective
- **Principe d'accès** : Seul `game.js` est habilité à muter `gameState`.
- **Rendu en lecture seule** : Le moteur de rendu (`renderer.js`) et les gestionnaires d'événements du DOM ne doivent jamais modifier l'état directement ; ils invoquent des fonctions d'action déclarées dans `game.js`.
- **Pureté des calculs** : Les fonctions de calcul d'équilibrage, de production, de combat et de tirage aléatoire doivent être des fonctions pures ou isolées, facilement testables unitairement sans dépendre du DOM.

## 2. Robustesse de la Persistance & Migration de Schéma (*Schema Versioning*)
- **Version de schéma** : Toute sauvegarde dans le `localStorage` doit comporter un identifiant de version (`schemaVersion`).
- **Fusion défensive (*Deep Merge*)** : Au chargement, fusionner défensivement l'objet chargé avec la structure par défaut (`defaultGameState`) pour initialiser automatiquement les nouvelles propriétés absentes des anciennes sauvegardes sans corrompre la partie du joueur.
- **Tolérance aux pannes** : Tout échec de désérialisation JSON doit être capturé par un bloc `try/catch` avec fallback propre sur l'état initial sans blocage du jeu.

## 3. Séparation Stricte des Responsabilités (SoC)
- `config.js` : Uniquement des constantes déclaratives (`GAME_CONFIG`), zéro code exécutable ou effet de bord.
- `game.js` : Moteur de règles métier et simulation d'état (`gameState`), zéro code de dessin Canvas.
- `renderer.js` : Rendu graphique Canvas uniquement, lecture de `gameState` et `GAME_CONFIG`, zéro logique de modification de ressources.
- `index.html` / `style.css` : Présentation, structure et design tokens.

## 4. Déterminisme et Gestion du Temps (*Delta Time & Ticks*)
- **Temps réel et rattrapage** : Les calculs de production doivent s'appuyer sur le différentiel de temps réel ($\Delta t$ / horodatage `Date.now()`) pour garantir une vitesse de jeu indépendante de la fréquence de l'écran (60Hz, 120Hz, etc.).
- **Plafond d'absence (*Offline Cap*)** : La simulation hors-ligne ou de retour d'onglet inactif doit être plafonnée pour éviter des débordements de mémoire ou des sauts incontrôlés.

## 5. Programmation Défensive & Validation aux Frontières
- **Vérification systématique** : Protéger tout calcul critique contre les divisions par zéro, les valeurs `NaN`, les nombres négatifs incohérents et les débordements de stock.
- **Isolation d'erreurs** : Une erreur dans l'affichage ou dans une animation secondaire ne doit jamais interrompre la boucle principale `gameTick`.
