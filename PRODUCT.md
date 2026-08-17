# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primo-donneurs et donneurs occasionnels au Bénin. Des personnes qui n'ont jamais donné leur sang ou qui l'ont fait une seule fois et hésitent à recommencer. Ils cherchent des réponses claires à trois questions : suis-je éligible, où aller, comment ça se passe.

## Product Purpose

BloodPulse existe pour transformer l'hésitation en action. Le site lève les freins informationnels qui empêchent le passage à l'acte du don du sang au Bénin, en rendant chaque étape compréhensible et accessible. Le succès se mesure au nombre de personnes qui localisent un centre et s'y rendent.

## Positioning

Simplifier le premier pas. Là où les campagnes institutionnelles informent de manière générale, BloodPulse répond directement aux trois blocages concrets du primo-donneur : éligibilité, localisation, déroulement. Une approche centrée sur l'action individuelle plutôt que sur la sensibilisation collective.

## Operating Context

- Langue : français
- Géographie : Bénin (centres de transfusion béninois, carte du Bénin)
- Contexte d'usage : consultation mobile et desktop, souvent après avoir vu une campagne ou entendu parler du don par un proche
- Fonctionnalités clés : simulateur d'éligibilité interactif, annuaire des centres avec carte, visualisation des réserves sanguines par groupe, guide étape par étape du processus de don

## Capabilities and Constraints

- Simulateur d'éligibilité en 4 questions (âge, poids, sexe, historique)
- Annuaire des centres de don avec géolocalisation sur carte du Bénin
- Indicateur de réserves sanguines par groupe (O+, O-, A+, A-, etc.)
- Processus de don en 4 étapes avec animation scroll-triggered
- Guide de préparation pré-don
- FAQ
- Scène 3D WebGL (globules rouges) dans le hero, avec fallback image
- Données statiques (pas de backend/API temps réel pour les réserves)

## Brand Commitments

- Nom : **BloodPulse** — confirmé
- Logos : `public/logo.svg`, `public/logo.png`, `public/symbole.svg` — confirmés
- Pas de charte graphique formelle
- Ton : accessible, rassurant, direct — pas institutionnel

## Evidence on Hand

- Données des centres de transfusion du Bénin (statiques, dans le code)
- Règles d'éligibilité OMS (seuil de 1 % de la population)
- Pas de témoignages réels, pas de données de fréquentation, pas de partenariat institutionnel documenté — ne pas en inventer

## Product Principles

1. **Action avant éducation** — Chaque section doit rapprocher le visiteur d'une décision concrète, pas seulement l'informer.
2. **Clarté radicale** — Aucun jargon médical, aucune ambiguïté. Si une question a une réponse simple, la donner immédiatement.
3. **Confiance par la transparence** — Montrer exactement ce qui va se passer (processus, durée, lieu) pour dissiper l'appréhension.
4. **Dignité du geste** — Le don du sang est un acte grave et généreux. Le traiter avec respect, sans gamification ni infantilisation.
