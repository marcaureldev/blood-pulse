import { MIN_DELAY_MONTHS } from '@/data/eligibility'

/**
 * Questions fréquentes et idées reçues.
 *
 * Les réponses chiffrées sont interpolées depuis `eligibility.ts` plutôt que
 * recopiées. Le proto de référence annonçait ici « 8 semaines entre deux dons »
 * pendant que sa fiche critères disait « 4 mois » : deux textes figés, aucun
 * moyen de repérer la contradiction. En dérivant, un seuil qui bouge met à jour
 * la FAQ du même coup.
 */

export type FAQItem = {
  q: string
  a: string
  /** Marque les questions qui démentent une croyance répandue. */
  myth?: boolean
}

const maxPerYear = (months: number) => Math.floor(12 / months)

export const FAQ_ITEMS: FAQItem[] = [
  {
    q: 'Ça fait mal de donner son sang ?',
    a: "La piqûre de l'aiguille ressemble à celle d'une prise de sang classique — une pichenette de quelques secondes. Pendant le prélèvement, vous ne ressentez rien d'anormal. La grande majorité des donneurs ne ressentent aucune douleur pendant le don lui-même.",
    myth: true,
  },
  {
    q: 'Est-ce que je risque d’attraper une maladie en donnant ?',
    a: "Non. Tout le matériel en contact avec votre sang — aiguille, tubulure, poche — est stérile et à usage unique, puis détruit après le don. Il est matériellement impossible de contracter une infection en donnant son sang.",
    myth: true,
  },
  {
    q: 'Le don prend combien de temps ?',
    a: "Comptez 45 à 60 minutes au total, dont seulement 8 à 10 minutes pour le prélèvement lui-même. Le reste, c'est l'accueil, l'entretien médical et la collation de récupération.",
  },
  {
    q: 'Je vais être fatigué après ?',
    a: "Le volume prélevé, environ 450 ml, est reconstitué par votre organisme en quelques heures pour le plasma et en quelques semaines pour les globules rouges. Une collation et un repos de quinze minutes suffisent à repartir. La plupart des donneurs reprennent leur journée normalement.",
    myth: true,
  },
  {
    q: 'On peut donner combien de fois par an ?',
    a: `Le délai minimal entre deux dons de sang total est de ${MIN_DELAY_MONTHS.male} mois pour un homme et de ${MIN_DELAY_MONTHS.female} mois pour une femme — soit au plus ${maxPerYear(MIN_DELAY_MONTHS.male)} dons par an pour l'un et ${maxPerYear(MIN_DELAY_MONTHS.female)} pour l'autre. Cet écart tient compte des pertes en fer liées aux menstruations.`,
  },
  {
    q: 'Je prends des médicaments, est-ce que je peux donner ?',
    a: "Cela dépend du traitement, et beaucoup de médicaments courants ne sont pas un obstacle. C'est l'entretien médical avant le don qui déterminera votre aptitude : ne vous auto-excluez pas, laissez le professionnel évaluer.",
  },
  {
    q: 'Je suis tatoué ou percé, je peux donner ?',
    a: "Oui, après un délai de quatre mois suivant le tatouage ou le piercing, le temps que les tests de sécurité soient pleinement fiables. Passé ce délai, aucun problème.",
  },
  {
    q: 'Le sang est-il testé après le don ?',
    a: "Oui, systématiquement. Chaque don est analysé pour les maladies transmissibles — VIH, hépatites B et C, syphilis. Une poche qui ne passe pas les tests est écartée, et le donneur est informé du résultat.",
  },
  {
    q: 'Je peux donner si je suis végétarien ?',
    a: "Oui. Le régime alimentaire n'est pas un critère d'exclusion. On vous conseillera simplement de bien manger et de boire de l'eau avant le don, exactement comme pour tout autre donneur. Seul un taux d'hémoglobine insuffisant, mesuré avant le prélèvement, peut reporter un don.",
    myth: true,
  },
  {
    q: 'On est payé pour donner son sang ?',
    a: "Non. Le don est volontaire, bénévole et non rémunéré — un principe défendu par l'Organisation mondiale de la santé, parce qu'un donneur rémunéré est incité à taire ce qui le rendrait inapte. Ne pas payer le don, c'est ce qui le rend sûr. La collation est offerte.",
  },
  {
    q: 'Mon sang va vraiment servir à quelqu’un ?',
    a: "Oui. Une poche est séparée en globules rouges, plasma et plaquettes, et peut ainsi aider jusqu'à trois patients. Les besoins sont permanents : accouchements hémorragiques, drépanocytose, chirurgie, accidents. Le sang ne se fabrique pas, il ne se conserve que quelques semaines, et rien ne le remplace.",
  },
]
