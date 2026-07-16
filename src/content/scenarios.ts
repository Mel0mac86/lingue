import type { Scenario, ScenarioCategory } from '../types';

export const CATEGORY_LABELS: Record<ScenarioCategory, { label: string; emoji: string }> = {
  travel: { label: 'Viaggi', emoji: '✈️' },
  work: { label: 'Lavoro', emoji: '💼' },
  school: { label: 'Scuola', emoji: '🎓' },
  daily: { label: 'Vita quotidiana', emoji: '🏙️' },
  social: { label: 'Social & Hobby', emoji: '🎮' },
  culture: { label: 'Cultura & Attualità', emoji: '🌍' },
};

/**
 * Scenario catalog. Every scenario is playable at Beginner, Intermediate and
 * Advanced difficulty (the difficulty is applied by the conversation engine,
 * which adapts vocabulary, speed and complexity — see services/tutor.ts).
 */
export const SCENARIOS: Scenario[] = [
  // ── Viaggi ────────────────────────────────────────────────────────────────
  { id: 'airport', category: 'travel', title: 'In aeroporto', emoji: '🛫', description: 'Check-in, imbarco, controlli e imprevisti di volo.', avatarRole: 'receptionist', userRole: 'viaggiatore' },
  { id: 'hotel', category: 'travel', title: 'In hotel', emoji: '🏨', description: 'Prenota una stanza, chiedi servizi, gestisci un problema.', avatarRole: 'receptionist', userRole: 'ospite' },
  { id: 'taxi', category: 'travel', title: 'In taxi', emoji: '🚕', description: 'Indica la destinazione, chiacchiera con il tassista, paga la corsa.', avatarRole: 'friend', userRole: 'passeggero' },
  { id: 'restaurant', category: 'travel', title: 'Al ristorante', emoji: '🍝', description: 'Ordina, chiedi consigli, gestisci allergie e il conto.', avatarRole: 'receptionist', userRole: 'cliente' },
  { id: 'shopping', category: 'travel', title: 'Shopping', emoji: '🛍️', description: 'Taglie, colori, prezzi, resi e sconti.', avatarRole: 'customer', userRole: 'cliente' },
  { id: 'museum', category: 'travel', title: 'Al museo', emoji: '🖼️', description: 'Biglietti, visite guidate e opere d’arte.', avatarRole: 'tour_guide', userRole: 'visitatore' },
  { id: 'station', category: 'travel', title: 'In stazione', emoji: '🚆', description: 'Biglietti, binari, coincidenze e ritardi.', avatarRole: 'receptionist', userRole: 'viaggiatore' },
  { id: 'customs', category: 'travel', title: 'Alla dogana', emoji: '🛂', description: 'Documenti, motivo del viaggio, dichiarazioni.', avatarRole: 'employer', userRole: 'viaggiatore' },

  // ── Lavoro ────────────────────────────────────────────────────────────────
  { id: 'interview', category: 'work', title: 'Colloquio di lavoro', emoji: '🤝', description: 'Presentati, punti di forza, domande difficili.', avatarRole: 'employer', userRole: 'candidato' },
  { id: 'meeting', category: 'work', title: 'Meeting', emoji: '📊', description: 'Aggiornamenti, opinioni e decisioni di gruppo.', avatarRole: 'colleague', userRole: 'collega' },
  { id: 'phonecall', category: 'work', title: 'Telefonata di lavoro', emoji: '📞', description: 'Chiama un cliente, prendi appunti, fissa appuntamenti.', avatarRole: 'customer', userRole: 'impiegato' },
  { id: 'presentation', category: 'work', title: 'Presentazione', emoji: '🎤', description: 'Presenta un progetto e rispondi alle domande.', avatarRole: 'colleague', userRole: 'relatore', premium: true },
  { id: 'negotiation', category: 'work', title: 'Negoziazione', emoji: '⚖️', description: 'Tratta prezzi, condizioni e scadenze.', avatarRole: 'customer', userRole: 'venditore', premium: true },
  { id: 'office', category: 'work', title: 'Vita d’ufficio', emoji: '🏢', description: 'Small talk, pause caffè e collaborazione.', avatarRole: 'colleague', userRole: 'collega' },

  // ── Scuola ────────────────────────────────────────────────────────────────
  { id: 'university', category: 'school', title: 'Università', emoji: '🏛️', description: 'Iscrizioni, corsi, esami e vita da campus.', avatarRole: 'teacher', userRole: 'studente' },
  { id: 'professor', category: 'school', title: 'Parlare col professore', emoji: '👨‍🏫', description: 'Chiedi chiarimenti, discuti un voto, chiedi consigli.', avatarRole: 'teacher', userRole: 'studente' },
  { id: 'classmates', category: 'school', title: 'Compagni di classe', emoji: '🧑‍🤝‍🧑', description: 'Fai amicizia, organizza lo studio di gruppo.', avatarRole: 'friend', userRole: 'studente' },
  { id: 'library', category: 'school', title: 'In biblioteca', emoji: '📚', description: 'Cerca libri, prenota sale studio, chiedi aiuto.', avatarRole: 'receptionist', userRole: 'studente' },

  // ── Vita quotidiana ──────────────────────────────────────────────────────
  { id: 'supermarket', category: 'daily', title: 'Al supermercato', emoji: '🛒', description: 'Trova prodotti, chiedi offerte, paga alla cassa.', avatarRole: 'customer', userRole: 'cliente' },
  { id: 'pharmacy', category: 'daily', title: 'In farmacia', emoji: '💊', description: 'Descrivi sintomi e chiedi medicinali.', avatarRole: 'doctor', userRole: 'cliente' },
  { id: 'doctor', category: 'daily', title: 'Dal medico', emoji: '🩺', description: 'Visita medica: sintomi, diagnosi, cure.', avatarRole: 'doctor', userRole: 'paziente' },
  { id: 'gym', category: 'daily', title: 'In palestra', emoji: '🏋️', description: 'Abbonamenti, allenamenti e consigli.', avatarRole: 'friend', userRole: 'cliente' },
  { id: 'bank', category: 'daily', title: 'In banca', emoji: '🏦', description: 'Apri un conto, bonifici, problemi con la carta.', avatarRole: 'receptionist', userRole: 'cliente' },
  { id: 'publicoffice', category: 'daily', title: 'Uffici pubblici', emoji: '🏛️', description: 'Documenti, moduli e appuntamenti.', avatarRole: 'receptionist', userRole: 'cittadino' },
  { id: 'friends', category: 'daily', title: 'Con gli amici', emoji: '🎉', description: 'Organizza una serata, racconta la tua settimana.', avatarRole: 'friend', userRole: 'amico' },
  { id: 'family', category: 'daily', title: 'In famiglia', emoji: '👨‍👩‍👧', description: 'Parla di casa, progetti e ricordi.', avatarRole: 'friend', userRole: 'familiare' },

  // ── Social & Hobby ───────────────────────────────────────────────────────
  { id: 'videogames', category: 'social', title: 'Videogiochi', emoji: '🎮', description: 'Parla dei tuoi giochi preferiti e strategie.', avatarRole: 'friend', userRole: 'giocatore' },
  { id: 'sport', category: 'social', title: 'Sport', emoji: '⚽', description: 'Partite, squadre e allenamenti.', avatarRole: 'friend', userRole: 'tifoso' },
  { id: 'music', category: 'social', title: 'Musica', emoji: '🎵', description: 'Generi, concerti e artisti preferiti.', avatarRole: 'friend', userRole: 'fan' },
  { id: 'socialmedia', category: 'social', title: 'Social network', emoji: '📱', description: 'Trend, contenuti e vita online.', avatarRole: 'friend', userRole: 'utente' },

  // ── Cultura & Attualità ──────────────────────────────────────────────────
  { id: 'news', category: 'culture', title: 'Attualità', emoji: '📰', description: 'Commenta le notizie del momento.', avatarRole: 'colleague', userRole: 'interlocutore', premium: true },
  { id: 'traditions', category: 'culture', title: 'Tradizioni locali', emoji: '🎎', description: 'Feste, cibi e usanze del paese.', avatarRole: 'tour_guide', userRole: 'ospite' },
  { id: 'cinema', category: 'culture', title: 'Cinema e serie TV', emoji: '🎬', description: 'Film, serie e recensioni.', avatarRole: 'friend', userRole: 'spettatore' },
  { id: 'freechat', category: 'culture', title: 'Chiacchiera libera', emoji: '💬', description: 'Nessun copione: parla di qualsiasi cosa.', avatarRole: 'friend', userRole: 'interlocutore' },
];

export const scenarioById = (id: string): Scenario =>
  SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[SCENARIOS.length - 1];
