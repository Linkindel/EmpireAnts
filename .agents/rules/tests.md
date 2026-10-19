---
trigger: always_on
---

# Règles de Tests et Couverture de Code (Minimum 80%)

Ces règles définissent les exigences obligatoires de test et de couverture pour chaque composant et module de code développé ou modifié.

## 1. Exigence de Couverture Minimale (≥ 80%)

- **Seuil strict** : Tout code JavaScript/TypeScript ou logique métier doit comporter une couverture de tests automatisés d'au moins **80%** (lignes, branches, fonctions et instructions).
- **Zéro régression** : Aucune nouvelle fonctionnalité, correction de bogue ou refactorisation ne doit faire passer le taux de couverture global ou par fichier sous la barre des 80%.

## 2. Typologie des Tests Obligatoires

Pour chaque fichier ou module de code :
1. **Tests Unitaires** :
   - Tester toutes les fonctions pures, calculs d'équilibrage, fonctions de formatage et logique métier unitaire.
   - Valider les cas nominaux, les cas limites (*edge cases* : valeurs nulles, négatives, limites de stock, division par zéro) et la gestion des erreurs.
2. **Tests d'Intégration & d'État** :
   - Valider les transitions d'état (ex: cycle de vie de `gameState`, progression des ticks, sauvegardes / restaurations).
   - Valider les interactions entre modules (ex: application des règles de `config.js` dans `game.js`).
3. **Tests d'Interface et Rendu (UI / Canvas / DOM)** :
   - Mocker l'environnement DOM (`jsdom` ou environnement simulé) pour vérifier la mise à jour des éléments sans erreurs.
   - Mocker le contexte Canvas 2D (`CanvasRenderingContext2D`) pour garantir la robustesse des fonctions de rendu sans planter.

## 3. Structure et Conventions des Fichiers de Test

- **Localisation** : Les fichiers de test doivent être placés dans un dossier `tests/` à la racine ou nommés en vis-à-vis : `[nom].test.js` ou `[nom].spec.js`.
- **Nommage des suites** :
  - Chaque suite `describe('NomDuModule / Fonction', ...)` doit clairement identifier le composant testé.
  - Chaque cas `it('doit ... lorsque ...')` ou `test('...')` doit décrire précisément le comportement attendu.
- **Indépendance et Déterminisme** :
  - Chaque test doit être autonome et reproductible (`beforeEach` / `afterEach` pour réinitialiser l'état).
  - Maîtriser l'aléa (`Math.random`) et le temps (`setInterval`, `Date.now`) via des mocks prévisibles si nécessaire.

## 4. Prise en Compte de l'Environnement d'Exécution

- Fournir un exécuteur de tests léger (ex: runner autonome compatible navigateur/HTML via page de test `tests.html` ou suite standardisée Node.js / Jest / Vitest).
- Permettre le calcul et l'affichage du pourcentage de couverture ou un rapport d'exécution clair validant l'atteinte des 80%.
