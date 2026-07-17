import type { AvatarDef, AvatarRole } from '../types';

/**
 * Avatar roster. Each avatar has a distinct personality that is injected
 * into the conversation system prompt, plus visual traits used by the
 * animated avatar renderer (components/Avatar.tsx).
 */
export const AVATARS: AvatarDef[] = [
  {
    id: 'emma', name: 'Emma', gender: 'female', ageLook: 29, role: 'teacher', species: 'human',
    personality: 'calorosa, paziente, incoraggiante; spiega con esempi semplici',
    accent: 'britannico', color: '#2563EB', skin: '#F5C9A6', hair: '#8A5A2B', emoji: '👩‍🏫', voicePitch: 1.08,
  },
  {
    id: 'jack', name: 'Jack', gender: 'male', ageLook: 24, role: 'friend', species: 'human',
    personality: 'spiritoso, rilassato, ama sport e videogiochi',
    accent: 'americano', color: '#0FA3A3', skin: '#E8B48C', hair: '#2C2C2C', emoji: '🧑', voicePitch: 1.0,
  },
  {
    id: 'sofia', name: 'Sofía', gender: 'female', ageLook: 34, role: 'colleague', species: 'human',
    personality: 'professionale ma amichevole, esperta di business',
    accent: 'spagnolo', color: '#7C3AED', skin: '#EAB58F', hair: '#1F1F1F', emoji: '👩‍💼', voicePitch: 1.05,
  },
  {
    id: 'marcel', name: 'Marcel', gender: 'male', ageLook: 41, role: 'tour_guide', species: 'human',
    personality: 'entusiasta, curioso, racconta aneddoti culturali',
    accent: 'francese', color: '#EA580C', skin: '#D9A06B', hair: '#4A3320', emoji: '🧭', voicePitch: 0.95,
  },
  {
    id: 'yuki', name: 'Yuki', gender: 'female', ageLook: 26, role: 'receptionist', species: 'human',
    personality: 'gentile, precisa, molto cortese',
    accent: 'giapponese', color: '#DB2777', skin: '#F7D7BC', hair: '#141414', emoji: '💁‍♀️', voicePitch: 1.15,
  },
  {
    id: 'hans', name: 'Hans', gender: 'male', ageLook: 52, role: 'employer', species: 'human',
    personality: 'diretto, esigente ma corretto; perfetto per colloqui',
    accent: 'tedesco', color: '#475569', skin: '#EFC6A2', hair: '#9CA3AF', emoji: '👔', voicePitch: 0.78,
  },
  {
    id: 'omar', name: 'Omar', gender: 'male', ageLook: 45, role: 'doctor', species: 'human',
    personality: 'calmo, rassicurante, chiarissimo nelle spiegazioni',
    accent: 'neutro', color: '#16A34A', skin: '#C98850', hair: '#111111', emoji: '🩺', voicePitch: 0.88,
  },
];

/**
 * Animal companions for the kids path (6-10): the child picks their favourite
 * during onboarding and it becomes their talking 3D buddy in every lesson.
 * `skin` = muzzle/belly colour, `hair` = fur colour.
 */
export const ANIMAL_AVATARS: AvatarDef[] = [
  {
    id: 'foxy', name: 'Foxy', gender: 'female', ageLook: 8, role: 'friend', species: 'fox',
    personality: 'volpina furba e giocherellona, adora indovinelli e mini-giochi',
    accent: 'neutro', color: '#F97316', skin: '#FFE8D1', hair: '#E5732A', emoji: '🦊', voicePitch: 1.4,
  },
  {
    id: 'bruno', name: 'Bruno', gender: 'male', ageLook: 9, role: 'friend', species: 'bear',
    personality: 'orsetto dolce e paziente, fa tanti complimenti e abbracci virtuali',
    accent: 'neutro', color: '#B45309', skin: '#EBC79E', hair: '#8B5A2B', emoji: '🐻', voicePitch: 0.7,
  },
  {
    id: 'milly', name: 'Milly', gender: 'female', ageLook: 7, role: 'friend', species: 'cat',
    personality: 'gattina curiosa e coccolona, fa le fusa quando rispondi bene',
    accent: 'neutro', color: '#6B7280', skin: '#F5F5F4', hair: '#9CA3AF', emoji: '🐱', voicePitch: 1.5,
  },
  {
    id: 'rex', name: 'Rex', gender: 'male', ageLook: 8, role: 'friend', species: 'dog',
    personality: 'cagnolino entusiasta e fedele, festeggia ogni tua risposta giusta',
    accent: 'neutro', color: '#A16207', skin: '#F3D9B1', hair: '#C58940', emoji: '🐶', voicePitch: 1.2,
  },
  {
    id: 'lola', name: 'Lola', gender: 'female', ageLook: 6, role: 'friend', species: 'rabbit',
    personality: 'coniglietta timida e gentile, spiega le cose piano piano',
    accent: 'neutro', color: '#EC4899', skin: '#FDF2F8', hair: '#E8E3DD', emoji: '🐰', voicePitch: 1.45,
  },
  {
    id: 'popo', name: 'Popo', gender: 'male', ageLook: 7, role: 'friend', species: 'panda',
    personality: 'panda tranquillo e buffo, ama il bambù e le filastrocche',
    accent: 'neutro', color: '#0FA3A3', skin: '#FFFFFF', hair: '#F2F2F2', emoji: '🐼', voicePitch: 0.85,
  },
  {
    id: 'leo', name: 'Leo', gender: 'male', ageLook: 9, role: 'friend', species: 'lion',
    personality: 'leoncino coraggioso, ti sprona come un piccolo re della savana',
    accent: 'neutro', color: '#F59E0B', skin: '#FCE1B0', hair: '#C87A1E', emoji: '🦁', voicePitch: 0.75,
  },
  {
    id: 'pip', name: 'Pip', gender: 'female', ageLook: 6, role: 'friend', species: 'penguin',
    personality: 'pinguina pasticciona e divertentissima, scivola sul ghiaccio quando ridi',
    accent: 'neutro', color: '#3B82F6', skin: '#FFFFFF', hair: '#1F2A44', emoji: '🐧', voicePitch: 1.6,
  },
];

/** Characters inspired by the user's reference art, sculpted procedurally. */
export const EXTRA_ANIMALS: AvatarDef[] = [
  {
    id: 'nanuk', name: 'Nanuk', gender: 'male', ageLook: 10, role: 'friend', species: 'bear',
    personality: 'orso polare buongustaio: parla spesso di cibo e del suo igloo, grande e tenerissimo',
    accent: 'neutro', color: '#7FB7D9', skin: '#FFFFFF', hair: '#F2EFE8', emoji: '🐻‍❄️', voicePitch: 0.65,
  },
  {
    id: 'berto', name: 'Berto', gender: 'male', ageLook: 8, role: 'friend', species: 'beaver',
    personality: 'castoro emotivo e buffissimo dai dentoni: si stupisce di tutto e costruisce dighe',
    accent: 'neutro', color: '#2F8F6B', skin: '#D9A873', hair: '#8A5A33', emoji: '🦫', voicePitch: 1.1,
  },
  {
    id: 'piuma', name: 'Piuma', gender: 'female', ageLook: 7, role: 'tour_guide', species: 'owl',
    personality: 'gufetta avventuriera con cappuccio arancione: saggia, curiosa, ama le storie di viaggio',
    accent: 'neutro', color: '#E8862E', skin: '#F3E9D7', hair: '#8C9BA8', emoji: '🦉', voicePitch: 1.3,
  },
  {
    id: 'tito', name: 'Tito', gender: 'male', ageLook: 9, role: 'friend', species: 'mouse',
    personality: 'topino furbo ed elegante: battuta pronta e consigli intelligenti',
    accent: 'neutro', color: '#5B667A', skin: '#EFE5DA', hair: '#8E959D', emoji: '🐭', voicePitch: 1.55,
  },
  {
    id: 'rocco', name: 'Rocco', gender: 'male', ageLook: 12, role: 'colleague', species: 'raccoon',
    personality: 'procione smart col maglione viola: sembra sempre in videochiamata, parla di tecnologia',
    accent: 'neutro', color: '#6D3F8E', skin: '#E9E2D8', hair: '#9A938B', emoji: '🦝', voicePitch: 1.05,
  },
];

export const ROLE_LABELS: Record<AvatarRole, string> = {
  teacher: 'Insegnante',
  friend: 'Amico/a',
  colleague: 'Collega',
  receptionist: 'Receptionist',
  customer: 'Cliente',
  employer: 'Datore di lavoro',
  tour_guide: 'Guida turistica',
  doctor: 'Medico',
};

const ALL = () => [...AVATARS, ...ANIMAL_AVATARS, ...EXTRA_ANIMALS];

export const avatarById = (id: string): AvatarDef =>
  ALL().find((a) => a.id === id) ?? AVATARS[0];

export const avatarForRole = (role: AvatarRole): AvatarDef =>
  AVATARS.find((a) => a.role === role) ?? AVATARS[0];

/** Kids get the animal buddies; everyone else can pick humans AND animals. */
export const rosterForAgeBand = (band: string): AvatarDef[] =>
  band === 'kids'
    ? [...ANIMAL_AVATARS, ...EXTRA_ANIMALS]
    : [...AVATARS, ...EXTRA_ANIMALS, ...ANIMAL_AVATARS];
