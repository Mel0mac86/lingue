import type { CEFRLevel, CurriculumUnit } from '../types';

/**
 * Language-independent curriculum: the pedagogical backbone shared by every
 * language. Each unit becomes a full lesson (vocabulary → expressions →
 * grammar → exercises → quiz → AI conversation) generated for the chosen
 * language by services/lessonFactory.ts.
 *
 * Difficulty grows smoothly: each level re-uses and extends the previous one.
 */
const UNITS: Record<CEFRLevel, Omit<CurriculumUnit, 'index' | 'level'>[]> = {
  A1: [
    { title: 'Saluta e presentati', topic: 'greetings', focus: ['salutare', 'presentarsi', 'verbo essere', 'pronomi personali'] },
    { title: 'Conta e dì la tua età', topic: 'numbers', focus: ['numeri 0-100', 'chiedere e dire l’età', 'verbo avere'] },
    { title: 'Parla della famiglia', topic: 'family', focus: ['membri della famiglia', 'aggettivi possessivi', 'descrivere persone'] },
    { title: 'Ordina al bar', topic: 'food', focus: ['cibi comuni', 'ordinare al bar', 'piacere/preferire', 'articoli'] },
    { title: 'Racconta la tua giornata', topic: 'daily_routine', focus: ['azioni quotidiane', 'presente semplice', 'orari', 'avverbi di frequenza'] },
    { title: 'Descrivi casa e città', topic: 'home_city', focus: ['stanze e mobili', 'negozi e luoghi', 'preposizioni di luogo', 'there is/are'] },
    { title: 'Parla dei tuoi hobby', topic: 'hobbies', focus: ['hobby e sport', 'esprimere gusti', 'domande semplici'] },
    { title: 'Fai shopping', topic: 'shopping_basics', focus: ['vestiti e colori', 'prezzi', 'this/that', 'chiedere in negozio'] },
  ],
  A2: [
    { title: 'Muoviti in viaggio', topic: 'travel', focus: ['mezzi di trasporto', 'chiedere indicazioni', 'imperativo', 'passato semplice: introduzione'] },
    { title: 'Racconta il passato', topic: 'past_events', focus: ['passato semplice', 'verbi irregolari comuni', 'espressioni di tempo'] },
    { title: 'Vai dal medico', topic: 'health', focus: ['parti del corpo', 'sintomi', 'consigli con should', 'dal medico'] },
    { title: 'Parla del meteo', topic: 'weather', focus: ['meteo e stagioni', 'futuro con going to', 'previsioni'] },
    { title: 'Descrivi il tuo lavoro', topic: 'work_basics', focus: ['professioni', 'presente continuo', 'routine di lavoro'] },
    { title: 'Fai progetti futuri', topic: 'future_plans', focus: ['will vs going to', 'inviti e proposte', 'promesse'] },
    { title: 'Racconta le tue esperienze', topic: 'experiences', focus: ['present perfect: introduzione', 'ever/never', 'raccontare esperienze'] },
    { title: 'Confronta e scegli', topic: 'comparisons', focus: ['comparativi', 'superlativi', 'opinioni semplici'] },
  ],
  B1: [
    { title: 'Opinioni e dibattiti', topic: 'opinions', focus: ['esprimere accordo/disaccordo', 'connettivi', 'argomentare'] },
    { title: 'Storie e narrazione', topic: 'storytelling', focus: ['passato continuo', 'used to', 'sequenze narrative'] },
    { title: 'Mondo del lavoro', topic: 'career', focus: ['colloqui', 'CV e competenze', 'condizionale: introduzione'] },
    { title: 'Ipotesi', topic: 'conditionals', focus: ['primo e secondo condizionale', 'consigli', 'situazioni immaginarie'] },
    { title: 'Media e tecnologia', topic: 'technology', focus: ['lessico digitale', 'passivo: introduzione', 'pro e contro'] },
    { title: 'Ambiente', topic: 'environment', focus: ['lessico ambientale', 'quantificatori', 'proposte e soluzioni'] },
    { title: 'Sentimenti ed emozioni', topic: 'feelings', focus: ['esprimere emozioni', 'verbi + preposizioni', 'phrasal verbs comuni'] },
    { title: 'Cultura e tradizioni', topic: 'culture', focus: ['feste e usanze', 'discorso indiretto: introduzione', 'descrivere tradizioni'] },
  ],
  B2: [
    { title: 'Argomentare con stile', topic: 'debate', focus: ['strutture enfatiche', 'concessive', 'registro formale/informale'] },
    { title: 'Business avanzato', topic: 'business', focus: ['negoziazione', 'e-mail formali', 'linguaggio delle riunioni'] },
    { title: 'Ipotesi complesse', topic: 'advanced_conditionals', focus: ['terzo condizionale', 'misti', 'rimpianti con wish'] },
    { title: 'Discorso indiretto', topic: 'reported_speech', focus: ['reported speech completo', 'verbi di reporting', 'interviste'] },
    { title: 'Sfumature di significato', topic: 'nuance', focus: ['modali di deduzione', 'collocazioni', 'sinonimi precisi'] },
    { title: 'Attualità e società', topic: 'society', focus: ['dibattiti sociali', 'passivo avanzato', 'dati e statistiche'] },
    { title: 'Espressioni idiomatiche', topic: 'idioms', focus: ['idiomi frequenti', 'phrasal verbs avanzati', 'linguaggio colloquiale'] },
    { title: 'Presentazioni efficaci', topic: 'presentations', focus: ['struttura di un talk', 'segnali discorsivi', 'gestire domande'] },
  ],
  C1: [
    { title: 'Eloquenza', topic: 'eloquence', focus: ['inversioni', 'cleft sentences', 'retorica'] },
    { title: 'Linguaggio accademico', topic: 'academic', focus: ['scrittura accademica', 'nominalizzazione', 'citare fonti'] },
    { title: 'Umorismo e ironia', topic: 'humor', focus: ['giochi di parole', 'sarcasmo', 'riferimenti culturali'] },
    { title: 'Negoziazioni complesse', topic: 'advanced_negotiation', focus: ['persuasione', 'linguaggio diplomatico', 'gestione dei conflitti'] },
    { title: 'Letteratura e critica', topic: 'literature', focus: ['analisi di testi', 'linguaggio figurato', 'registri letterari'] },
    { title: 'Sfumature culturali', topic: 'cultural_nuance', focus: ['variazioni regionali', 'tabù e cortesia', 'sottintesi'] },
  ],
  C2: [
    { title: 'Padronanza totale', topic: 'mastery', focus: ['precisione lessicale assoluta', 'stile personale', 'testi complessi'] },
    { title: 'Dibattito professionale', topic: 'expert_debate', focus: ['argomentazione esperta', 'improvvisazione', 'contro-argomentazioni'] },
    { title: 'Linguaggio specialistico', topic: 'specialist', focus: ['gergo tecnico', 'legale', 'medico e finanziario'] },
    { title: 'Mediazione e interpretariato', topic: 'mediation', focus: ['riformulare', 'riassumere', 'tradurre concetti'] },
    { title: 'Creatività linguistica', topic: 'creativity', focus: ['scrittura creativa', 'neologismi', 'oratoria avanzata'] },
    { title: 'Il tocco del madrelingua', topic: 'native_polish', focus: ['intonazione', 'ritmo', 'micro-espressioni idiomatiche'] },
  ],
};

export function unitsForLevel(level: CEFRLevel): CurriculumUnit[] {
  return UNITS[level].map((u, i) => ({ ...u, index: i, level }));
}

export function lessonIdFor(language: string, level: CEFRLevel, unitIndex: number): string {
  return `${language}-${level}-${unitIndex}`;
}
