# PROMPTS.md — méthodologie de travail avec l'IA

**BloodPulse** — Figma to Code Challenge, Édition 4.
Période de travail : **13 au 17 août 2026**, 4 sessions, **68 prompts significatifs**.

Ce document est reconstitué à partir des transcriptions réelles des sessions, pas de mémoire.
Les prompts cités le sont **verbatim**, fautes de frappe comprises.

---

## 1. Outils d'IA sollicités

### Outil principal

**Claude Code** (CLI Anthropic, via l'extension VS Code), modèle `claude-opus-5`.
Décompte réel sur les transcriptions : 2 707 messages sur `claude-opus-5`, 37 sur `claude-opus-4-6`.

C'est le seul outil qui a écrit du code dans ce dépôt. Il a un accès direct au système de
fichiers et au terminal, ce qui a orienté toute la méthode : l'IA lance elle-même `tsc`,
`oxlint`, `pnpm build`, et écrit des scripts de vérification jetables.

### Extensions de compétences chargées

Trois jeux d'instructions ont été chargés explicitement pendant le travail. Ils ne génèrent
pas de code : ils imposent à l'IA les pratiques officielles d'un domaine avant qu'elle écrive.


| Extension         | Origine                               | Usage                                                                                                              |
| ----------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `gsap-skills`     | plugin communautaire                  | `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-react`, `gsap-plugins`, `gsap-performance`, `gsap-utils` |
| `frontend-design` | réglages utilisateur                  | direction artistique, éviter les mises en page génériques                                                          |
| `impeccable`      | skill Apache 2.0, installé localement | passes de design : `polish`, plancher de qualité, détecteur d'anti-patterns                                        |


**Décision assumée :** ces extensions **ne sont pas versionnées** (`.claude/` est dans le
`.gitignore`). 3,4 Mo d'outillage tiers pour 368 Ko de code source, sous une licence dont le
fichier `LICENSE` n'était pas fourni par l'installation. Ce n'est pas le livrable.

Ce chargement est devenu une règle explicite en cours de route :

> « À CHAQUE FOIS QUE JE TE DEMANDE DE FAIRE OU D'AMÉLIORER LES ANIMATIONS QUE TU AS FAITES,
> EH BIEN TU DOIS ALLER CHARGER LES SKILLS À TA DISPOSITION ET C'EST ÇA TU UTILISES POUR
> FAIRE LE JOB. » *(16/08, 23 h 00)*

Elle a produit un gain mesurable : `gsap-core` impose `autoAlpha` là où l'IA écrivait
`opacity`. La différence n'est pas cosmétique — `autoAlpha` pose `visibility: hidden` à zéro,
donc retire l'élément du parcours clavier. Sans l'extension, la page aurait embarqué des
boutons invisibles mais focusables.

### Outils tiers évalués puis écartés

- **Unicorn Studio** (générateur de scènes WebGL). Scène de particules sanguines produite et
intégrée, puis **abandonnée** : le rendu porte un filigrane sur le plan gratuit.
→ « la scène unicorne viens avec les wattermarks et ça me déçoit vraiment […] Je ne peux
pas me prendre un abonnement unicorn. » *(14/08, 00 h 06)*
- **React Bits — composant** `Plasma` (WebGL sous `ogl`). Prompt d'intégration fourni à l'IA,
écarté au profit d'une simulation écrite sur mesure : l'effet plasma ne ressemblait pas à
du sang.
- **Originkit — composant** `Globe` (CLI propriétaire). Écarté après arbitrage : voir §3.



### Extraction de références

L'IA a analysé quatre sites de référence pour en extraire les **mécaniques d'interaction**
(pas l'identité visuelle) : `scrollsections.framer.ai`, `saasscrollstoryshowcase.framer.website`,
`stepsflow.framer.website`, et un projet Framer de carte pointillée. La méthode a consisté à
lire les bundles JavaScript compilés pour y retrouver les configurations exactes — durées,
courbes d'accélération, valeurs de ressort — plutôt que d'estimer à l'œil.

---



## 2. Séquence des prompts significatifs



### Phase 1 — Cadrage et matière première (13 août)

Le brief complet est fourni en un seul bloc, suivi de trois prototypes personnels comme
matière d'inspiration : un dépôt GitHub, un dossier local exporté, une scène WebGL.

Le premier arbitrage produit est **le sujet** : la page ne parlera pas du don de sang en
général mais du don de sang **au Bénin** — 14 centres, 9 départements, 11 villes. Décision
humaine, prise pour que le contenu soit vérifiable et incarné plutôt que générique.

### Phase 2 — La scène du hero (13–16 août)

C'est le poste qui a coûté le plus de prompts, et de loin. Après l'abandon d'Unicorn Studio
et de React Bits, l'IA écrit une simulation maison : `src/lib/cellPhysics.ts` et
`src/components/BloodCells.tsx`.

La direction est donnée par itérations sensorielles, pas techniques :

> « elle doivent plus avoir l'air liquide que cet air de particules solides parce qu'on a
> comme l'impression de voir des balles qui rebondissent alors qu'on avoir un aspect visqueux
> si je peux le dire ainsi. » *(14/08, 06 h 41)*

> « avec ou sans la présence du curseur, ça doit rendre l'effet de sang bouillant un peu comme
> de l'eau sur le feu, ou comme des battements de cœur, en activité intense. » *(15/08, 18 h 34)*

> « Il faut que ça soit 100000 plus intense que ça. » *(15/08, 19 h 02)*

Une tentative de pousser plus loin — fiche technique de rhéologie sanguine (fluide non
newtonien, viscosité 3–4 mPa·s, masse volumique 1060 kg/m³) donnée à l'IA pour reproduire la
texture — **a échoué** et a été annulée :

> « Champion, je ne suis pas du tout satisfait du rendu. Reviens juste sur ce qu'on était
> avant. On va s'en arrêter là. » *(15/08, 21 h 32)*

Savoir arrêter une piste est ici la décision utile. Le rendu retenu est celui d'avant.

### Phase 3 — Les sections du brief (14–15 août)

Enchaînement méthodique, une section par prompt, en s'appuyant sur les prototypes de
référence pour la structure et sur la palette du projet pour la forme :

- C1 « Pourquoi donner », C2 « Qui peut donner », C4 « Déroulement », C5 « Préparation »
- C6 « Où donner » — le répertoire des centres, fonctionnalité centrale du brief
- C7 « État des réserves », C8 « FAQ », puis CTA final et pied de page

Le tiroir de détail d'un centre est d'abord écrit à la main par l'IA, puis **remplacé** :

> « On va utiliser la librairie base UI pour que le drawer soit bien plus smooth que ce que
> tu proposes manuellement. » *(15/08, 06 h 45)*



### Phase 4 — Le simulateur d'éligibilité (15–16 août)

L'algorithme est imposé par le brief (18–65 ans, 50 kg, 3 mois homme / 4 mois femme). Le
travail de pilotage a porté sur **la forme de l'interaction**, pas sur la règle :

> « Peux-tu scrapper ce site : [https://scrollsections.framer.ai/](https://scrollsections.framer.ai/) et voir comment est faite
> cette animation et on va essayer de reproduire ça exactement comme ça avec gsap pour la
> section du test d'éligibilité **mais avec une différence. Le contrôle ne sera pas fait grâce
> au scroll chez nous mais grâce à notre bouton** » *(16/08, 11 h 22)*

C'est un exemple net d'arbitrage : la mécanique visuelle est empruntée, le mode de contrôle
est réinventé parce qu'un formulaire piloté au scroll est une mauvaise idée d'ergonomie.

Deux corrections ont suivi, toutes deux sur des malentendus de vocabulaire :

> « quand je disais changement de couleur, je voulais dire changement de couleur de la section
> en fait. » *(16/08, 12 h 02)*

> « Elle devrait être tout le bloc qui contient question 1/4 et pas que le contenu à
> l'intérieur de ce bloc en fait. » *(16/08, 12 h 15)*



### Phase 5 — La carte (16 août)

Prompt initial : intégrer un composant `Globe` propriétaire via CLI, puis le transformer en
carte plate centrée sur l'Afrique. **L'IA a été challengée sur ce choix** :

> « On ne peut pas utiliser react three fiber ? Si oui allons dessus ? Si non si on utilise
> three js on aura encore besoin de origin kit ? Si non allons dessus. **Réponds-moi d'abord**
> et on va voir par la suite » *(16/08, 14 h 46)*

Réponse : non, l'outil propriétaire n'apporte rien qu'un composant R3F ne fasse. Le composant
`AfricaFlatMap.tsx` est écrit sur mesure : projection équirectangulaire, grille de points
générée à la compilation depuis le jeu de données Natural Earth 50 m, zoom au cadre sur les
résultats de recherche, retour à la vue continentale quand la requête est vidée.

### Phase 6 — Système de boutons (16 août)

Un effet CSS « Fill Right » est fourni sous forme de spécification complète (balisage exact,
jetons de couleur, courbes). Demande : le refaire avec les couleurs du projet, en composant
réutilisable, et **y ajouter un échange de libellé au flou** qui n'existait pas dans la
référence. Puis : « Je veux l'appliquer à tous les boutons cher ami. » → 9 appels à l'action
convertis.

### Phase 7 — Préparation au don : trois réécritures (16–17 août)

La section la plus retravaillée du projet, et le meilleur exemple de pilotage exigeant.

1. Première proposition, à partir de `saasscrollstoryshowcase` → refusée sans appel :
  > « Franchement je suis vraiment pas du tout satisfait de ce que tu as fait. C'est nul.
  > Mais vraiment. […] C'est parce que la structure n'est pas la même. » *(16/08, 20 h 56)*
2. Deuxième, à partir de `stepsflow.framer.website` → structure bonne, mouvement raté :
  > « Il faut réussir à implémenter correctement chaque entrée et chaque sortie, chaque
  > interaction de l'animation, l'animation dans tous ses états avec une très bonne finesse. »
3. Troisième, après diagnostic : les listes étaient **démontées** à chaque changement, donc
  aucune sortie n'était animable. Réécriture complète — les trois listes cohabitent dans le
   DOM, superposées, ce qui rend les sorties possibles.

Puis deux passes de correction. La surbrillance de l'onglet actif a été signalée invisible
**deux fois de suite** — un fond translucide posé sur un panneau translucide ne se distingue
pas — et un bug de disparition intermittente a fini par être diagnostiqué : un `from()` piloté
par ScrollTrigger repose son état de départ à chaque `refresh()` tant que le seuil n'est pas
franchi, et la page en déclenche un au chargement de l'annuaire.

---



## 3. Ajustements manuels effectués



### Arbitrages produit et technique (décisions humaines)


| Décision                                       | Motif                                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| Sujet centré sur le **Bénin**                  | contenu vérifiable et incarné, plutôt qu'une page générique              |
| **Abandon d'Unicorn Studio**                   | filigrane sur le plan gratuit, incompatible avec un livrable             |
| **Abandon de React Bits** `Plasma`             | l'effet ne ressemblait pas à du sang                                     |
| **R3F plutôt qu'Originkit**                    | refus d'une dépendance propriétaire pour un besoin réalisable en interne |
| **Base UI pour le tiroir**                     | qualité d'interaction supérieure à une implémentation maison             |
| **Retour en arrière sur la simulation fluide** | la piste rhéologique dégradait le rendu                                  |
| **Skills non versionnées**                     | outillage local, pas un livrable                                         |




### Corrections de rédaction

L'IA a produit une première passe de copie **rejetée en bloc** :

> « Franchement, tu fais des phrases trop longues. Tu ne vois pas ce qui était proposé avant
> que tu ne commences à raconter ta vie ? » *(15/08, 07 h 32)*

- Titre du hero restauré à la version courte : « Un geste simple, une vie sauvée. »
- Textes des tuiles d'urgence et de maladies **réécrits à la main** et fournis mot pour mot.



### Retouches de code faites directement dans l'éditeur

Nombreuses, et assumées comme la boucle de travail normale — l'IA propose, l'humain ajuste au
pixel :

- palettes de phases de `Preparation.tsx` (teintes, bordures, fonds) ajustées à la main ;
- ratio de grille du répertoire porté à `lg:grid-cols-[1.5fr_0.5fr]` ;
- nombre de corps de la simulation ramené de 32 à 24 (« ça fait beaucoup ») ;
- notation Tailwind `text-(color:--x)` raccourcie en `text-(--x)` ;
- alignement des numéros d'onglets, largeurs maximales, hauteurs minimales, ombres ;
- **suppression de commentaires** ajoutés par l'IA, jugés envahissants.



### Reprises après diagnostic erroné de l'IA

- Carte écrasée horizontalement : le premier correctif proposé était hors sujet
(« Je ne vois pas en quoi ce que tu as fait change quelque chose. ») La vraie cause était
un `camera.lookAt(0, 0, 0)` appliqué implicitement par React Three Fiber.
- Un site de référence déclaré « vide » par l'IA alors qu'il ne l'était pas
(« voilà le lien inh et tu me dis que c'est truc vide ? »).

---



## 4. Limites rencontrées avec l'outil



### L'IA ne voit pas ce qu'elle produit

C'est la limite structurante de tout le projet. L'outil n'a pas de navigateur : il ne peut pas
regarder son propre rendu. **Chaque défaut visuel de ce projet a été trouvé par un humain**,
puis décrit en mots à l'IA. Les allers-retours de la section « Préparation » — cinq passes —
en sont la conséquence directe.

Contre-mesure adoptée : remplacer le regard par de la vérification mécanique.

- assertions sur le HTML rendu (`renderToStaticMarkup`) : structure, ARIA, comptes d'éléments ;
- rendu ASCII de la grille de points de la carte, pour prouver que les données étaient justes
et isoler le bug côté affichage ;
- caméra three.js reconstruite dans Node pour comparer la projection à la formule attendue ;
- lecture du CSS compilé pour confirmer que Tailwind émettait bien les valeurs voulues.

Ça attrape les erreurs de structure. Ça n'attrape **rien** de ce qui relève du goût.

### Un test peut être vert et faux

Le test de projection de la caméra a d'abord affiché une dérive de 0,0000 px — parfait, et
inutile : il ne reproduisait pas le comportement implicite du framework, donc il validait un
monde qui n'existait pas. Réécrit avec une contre-épreuve, il a montré l'écrasement réel
(1,97×). **Un test écrit par l'IA doit être suspecté au même titre que son code.**

### Accessibilité : l'IA livre des défauts silencieux

Trois manquements au contraste sont passés dans du code généré, et n'ont été trouvés qu'en
calculant les ratios explicitement :


| Cas                            | Mesuré | Corrigé en                               |
| ------------------------------ | ------ | ---------------------------------------- |
| blanc sur `blood-500`          | 3,8:1  | `blood-600` → 4,96:1                     |
| `blood-600` sur panneau sombre | 3,5:1  | variante `onDark` en `blood-400` → 6,2:1 |
| onglets inactifs en `ink-300`  | 2,2:1  | `ink-400` → 3,3:1                        |


L'IA ne signale pas spontanément ces écarts. Il faut le lui demander, ou le vérifier soi-même.

### Coût de performance non signalé

L'ajout de three.js a fait passer le bundle principal de ~174 Ko à **411 Ko gzip** sans que
l'outil le mentionne. Corrigé par chargement différé (`React.lazy` + observateur d'intersection) :
174 Ko sur le bundle principal, la carte isolée dans un fragment chargé à l'approche de la section.

### Perte de contexte sur les longues sessions

Les sessions dépassent la fenêtre de contexte et sont résumées automatiquement. Après
compaction, l'IA a perdu des décisions déjà prises et proposé des choses déjà écartées. Il
faut lui redonner l'état du projet — d'où l'intérêt d'avoir les décisions dans le code plutôt
que dans la conversation.

### Difficulté persistante sur le « ressenti » d'une animation

Trois réécritures complètes de la même section, plus quatre passes de correction. L'IA
implémente correctement ce qu'on décrit précisément ; elle ne sait pas juger si le résultat
« a l'air fin ». Les termes de direction — « fluide », « progressif », « avec finesse » — ne
se traduisent pas en valeurs sans plusieurs allers-retours.

### Blocages d'outillage

Une commande d'installation (`pnpm dlx originkit@latest add globe`) a été **bloquée par le
classificateur de sécurité** de l'outil et n'a pas pu être exécutée par l'IA.

### Fuite de secret — incident réel

Une **clé d'API en clair** a été collée dans la conversation pour authentifier une commande.
Elle s'est retrouvée dans la transcription de session, stockée sur disque. Elle a dû être
révoquée. Un assistant qui exécute des commandes n'est pas un coffre-fort : les secrets
passent par des variables d'environnement, jamais par le fil de discussion.

### Verbosité

L'IA documente spontanément beaucoup plus que nécessaire, jusqu'à devoir être arrêtée :
« Arrête de me mettre des commentaires partout. C'est moi qui décide si j'en ai besoin ou pas. »

---



## Note sur les références visuelles

Quatre sites ont été analysés pour leurs **mécaniques d'interaction**. À une exception près,
seule la mécanique a été reprise, pas la mise en page.

L'exception, signalée en toute transparence : la structure de la section « Préparation au don »
— colonne d'onglets verticale à surbrillance glissante, panneau à droite — **reproduit
délibérément** celle de `stepsflow.framer.website`, à la demande explicite (« on va faire
exactement like this »). Le contenu, la palette, la typographie, les couleurs par phase et
l'intégralité du code sont propres au projet.

La palette (`ink` / `blood` / `cream` / `sage`), le couple typographique Fraunces + Plus Jakarta
Sans, la scène WebGL du hero, la carte et le système de boutons sont des créations du projet.