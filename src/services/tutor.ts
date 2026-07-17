import type {
  AgeBand, AvatarDef, CEFRLevel, ConversationFeedback, ConversationTurn,
  Lesson, Scenario, ScenarioDifficulty, UserProfile,
} from '../types';
import { languageByCode } from '../content/languages';
import { ROLE_LABELS } from '../content/avatars';
import { chat, chatJson, type ChatMessage } from './groq';

// ─── Prompt building ─────────────────────────────────────────────────────────

function ageStyle(band: AgeBand, age: number): string {
  switch (band) {
    case 'kids':
      return `L'utente è un bambino di ${age} anni: usa un tono giocoso, frasi cortissime, tanti complimenti, piccoli giochi e indovinelli. Mai argomenti da adulti.`;
    case 'teens':
      return `L'utente è un ragazzo di ${age} anni: tono amichevole e informale, argomenti come scuola, sport, musica, videogiochi, social.`;
    case 'seniors':
      return `L'utente ha ${age} anni: parla lentamente, frasi chiare, ripeti i concetti importanti, ritmo rilassato, dialoghi molto pratici.`;
    default:
      return `L'utente è un adulto di ${age} anni: tono naturale da conversazione tra pari, argomenti concreti e utili.`;
  }
}

function levelRules(level: CEFRLevel | ScenarioDifficulty): string {
  const map: Record<string, string> = {
    A1: 'frasi di 5-8 parole, solo presente, vocabolario base (max ~500 parole), parla molto lentamente',
    A2: 'frasi semplici, presente e passato semplice, vocabolario quotidiano',
    B1: 'frasi articolate, tutti i tempi comuni, qualche espressione idiomatica spiegata',
    B2: 'conversazione naturale, idiomi frequenti, argomenti astratti',
    C1: 'conversazione da madrelingua colto, sfumature, ironia, registri diversi',
    C2: 'nessuna semplificazione: parla come con un madrelingua',
    beginner: 'frasi di 5-8 parole, solo presente, vocabolario base, parla lentamente',
    intermediate: 'frasi articolate, tempi comuni, vocabolario quotidiano ricco',
    advanced: 'conversazione completamente naturale, idiomi e sfumature',
  };
  return map[level];
}

function basePersona(avatar: AvatarDef, profile: UserProfile, targetName: string): string {
  const verse: Record<string, string> = {
    fox: 'Yip yip!', bear: 'Groar!', cat: 'Miaooo!', dog: 'Bau bau!',
    rabbit: 'Squit squit!', panda: 'Mnam mnam!', lion: 'Roooar!', penguin: 'Uek uek!',
  };
  const identity = avatar.species === 'human'
    ? `Sei ${avatar.name}, un avatar AI di Lingue, app per imparare le lingue.`
    : [
      `Sei ${avatar.name}, un simpatico animale parlante (${avatar.species}) di Lingue, app per imparare le lingue.`,
      `Il tuo PRIMO messaggio inizia SEMPRE con il tuo verso: "${verse[avatar.species] ?? 'Ciao!'}". Poi, ogni tanto (non sempre), infila il verso o un gesto buffo tipico del tuo animale.`,
    ].join(' ');
  return [
    identity,
    `Ruolo: ${ROLE_LABELS[avatar.role]}. Personalità: ${avatar.personality}. Accento: ${avatar.accent}.`,
    `Ti comporti come una persona reale: hai opinioni, ricordi ciò che l'utente dice, fai domande di follow-up, reagisci con emozioni. Non dire mai di essere un modello linguistico.`,
    `L'utente si chiama ${profile.name}: usa spesso il suo nome.`,
    ageStyle(profile.ageBand, profile.age),
    `Parla in ${targetName}. Se l'utente è in grave difficoltà puoi aggiungere UNA breve spiegazione in italiano tra parentesi.`,
    `PONTE ITALIANO: l'utente è italiano. Se ti scrive o parla in italiano perché non riesce a esprimersi in ${targetName}, NON rimproverarlo mai: capiscilo, rispondi in modo semplice, insegnagli come si dice quella frase in ${targetName} e invitalo con dolcezza a ripeterla. L'obiettivo è riportarlo gradualmente a parlare in ${targetName}.`,
    `REGOLE: risposte brevi (2-4 frasi), UNA sola domanda alla volta, non interrompere il flusso con lunghe correzioni, incoraggia sempre.`,
  ].join('\n');
}

/** System prompt for the post-lesson conversation (step 9 of every lesson). */
export function lessonConversationPrompt(
  lesson: Lesson, avatar: AvatarDef, profile: UserProfile,
): string {
  const lang = languageByCode(lesson.language);
  return [
    basePersona(avatar, profile, lang.name),
    `CONTESTO: ${profile.name} ha appena completato la lezione "${lesson.title}" (${lesson.level}).`,
    `USA ESCLUSIVAMENTE gli argomenti appena studiati: ${lesson.conversationBrief}`,
    `Vocabolario della lezione: ${lesson.vocabulary.map((v) => v.term).join(', ')}.`,
    `Espressioni della lezione: ${lesson.expressions.map((e) => e.phrase).join(' | ')}.`,
    `Livello ${lesson.level}: ${levelRules(lesson.level)}.`,
    `Fai praticare OGNI vocabolo ed espressione della lezione almeno una volta. Se l'utente sbaglia, correggi con gentilezza in una riga e prosegui.`,
    `Apri tu la conversazione salutando ${profile.name} per nome.`,
  ].join('\n');
}

/** System prompt for free conversation / scenario mode. */
export function freeConversationPrompt(
  avatar: AvatarDef,
  profile: UserProfile,
  opts: {
    language: string;
    difficulty: ScenarioDifficulty;
    scenario?: Scenario;
    topic?: string;
    realTimeCorrections: boolean;
  },
): string {
  const parts = [
    basePersona(avatar, profile, opts.language),
    `Difficoltà ${opts.difficulty}: ${levelRules(opts.difficulty)}.`,
  ];
  if (opts.scenario) {
    parts.push(
      `SIMULAZIONE: "${opts.scenario.title}" — ${opts.scenario.description}`,
      `Tu interpreti: ${ROLE_LABELS[opts.scenario.avatarRole]}. L'utente interpreta: ${opts.scenario.userRole}. Resta SEMPRE nel personaggio e nella situazione.`,
    );
  }
  if (opts.topic) parts.push(`Argomento scelto dall'utente: ${opts.topic}.`);
  parts.push(
    opts.realTimeCorrections
      ? `Correzioni IN TEMPO REALE: se l'utente fa un errore importante, correggilo in UNA riga ("💡 Meglio dire: ...") e continua subito la conversazione.`
      : `NON correggere durante la conversazione: lascia parlare l'utente liberamente. Le correzioni arriveranno nel report finale.`,
    `Apri tu la conversazione, in modo coerente con la situazione, salutando ${profile.name}.`,
  );
  return parts.join('\n');
}

// ─── Conversation turns ──────────────────────────────────────────────────────

export async function nextAvatarReply(
  systemPrompt: string, turns: ConversationTurn[],
): Promise<string> {
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...turns.map((t) => ({ role: t.role, content: t.text } as ChatMessage)),
  ];
  if (turns.length === 0) {
    messages.push({ role: 'user', content: '(La conversazione inizia ora: apri tu.)' });
  }
  return chat(messages, { temperature: 0.8, maxTokens: 320 });
}

// ─── End-of-conversation evaluation ──────────────────────────────────────────

interface RawFeedback {
  pronunciation: number;
  grammar: number;
  fluency: number;
  vocabulary: number;
  suggestions: string[];
  encouragement: string;
  corrected_turns: {
    original: string;
    better?: string;
    segments: { text: string; status: 'ok' | 'warn' | 'error'; fix?: string; note?: string }[];
  }[];
}

/**
 * Detailed post-conversation evaluation: scores (0-100) for pronunciation,
 * grammar, fluency and vocabulary, colour-coded per-sentence corrections
 * (green = correct, yellow = improvable, red = wrong) and suggestions.
 *
 * Pronunciation is estimated from the speech-to-text transcript (recognition
 * confidence proxy: garbled/misrecognised words indicate unclear speech).
 */
export async function evaluateConversation(
  turns: ConversationTurn[],
  language: string,
  level: string,
  spokenTurns: number,
): Promise<ConversationFeedback> {
  const userTurns = turns.filter((t) => t.role === 'user');
  if (userTurns.length === 0) {
    return {
      pronunciation: 0, grammar: 0, fluency: 0, vocabulary: 0, overall: 0,
      suggestions: ['Prova a parlare di più la prossima volta!'],
      correctedTurns: [], encouragement: 'La prossima volta lanciati: sbagliare è il modo migliore per imparare!',
    };
  }
  const transcript = turns
    .map((t) => `${t.role === 'user' ? 'STUDENTE' : 'AVATAR'}: ${t.text}`)
    .join('\n');

  const system = [
    `Sei un esaminatore esperto di ${language} (livello atteso: ${level}). Valuta SOLO le frasi dello STUDENTE nella conversazione.`,
    `Rispondi in JSON con questo schema esatto:`,
    `{"pronunciation":0-100,"grammar":0-100,"fluency":0-100,"vocabulary":0-100,"suggestions":["...max 4, in italiano"],"encouragement":"1 frase in italiano","corrected_turns":[{"original":"frase studente","better":"versione più naturale (se serve)","segments":[{"text":"porzione","status":"ok|warn|error","fix":"correzione","note":"spiegazione breve in italiano"}]}]}`,
    `Regole: dividi ogni frase dello studente in segmenti; status "ok" = corretto, "warn" = comprensibile ma migliorabile, "error" = errore vero. La concatenazione dei segmenti deve ricostruire la frase originale. Includi "fix" e "note" solo per warn/error.`,
    `${spokenTurns > 0 ? `Lo studente ha parlato a voce (${spokenTurns} turni vocali): stima la pronuncia dalle parole mal riconosciute o storpiate nella trascrizione.` : 'Lo studente ha solo scritto: stima "pronunciation" come potenziale (usa il valore di grammar).'}`,
    `Frasi dette dallo studente in ITALIANO: erano una richiesta di aiuto, NON valutarle come errori né abbassare i punteggi per questo; ignorale nei corrected_turns e, se utili, cita nei suggerimenti come si dicevano in ${language}.`,
    `Sii onesto ma incoraggiante. Punteggi coerenti col livello ${level}.`,
  ].join('\n');

  const raw = await chatJson<RawFeedback>([
    { role: 'system', content: system },
    { role: 'user', content: transcript },
  ], 3000);

  const clamp = (n: unknown) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
  const scores = {
    pronunciation: clamp(raw.pronunciation),
    grammar: clamp(raw.grammar),
    fluency: clamp(raw.fluency),
    vocabulary: clamp(raw.vocabulary),
  };
  return {
    ...scores,
    overall: Math.round(
      (scores.pronunciation + scores.grammar + scores.fluency + scores.vocabulary) / 4,
    ),
    suggestions: Array.isArray(raw.suggestions) ? raw.suggestions.slice(0, 4) : [],
    encouragement: raw.encouragement || 'Ottimo lavoro, continua così!',
    correctedTurns: (raw.corrected_turns ?? []).map((t) => ({
      original: t.original,
      better: t.better,
      segments: (t.segments ?? []).map((s) => ({
        text: s.text,
        status: s.status === 'error' || s.status === 'warn' ? s.status : 'ok',
        fix: s.fix,
        note: s.note,
      })),
    })),
  };
}
