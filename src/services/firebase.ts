/**
 * Firebase integration (optional).
 *
 * The app works fully offline with AsyncStorage; when a Firebase project is
 * configured the same state is mirrored to Firestore, enabling multi-device
 * sync, the global leaderboard, FCM reminders and Analytics.
 *
 * Setup: create a project on console.firebase.google.com, then put the web
 * config in a local (gitignored) .env file — see .env.example.
 */
import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getFirestore, doc, setDoc, collection, getDocs, query, orderBy, limit,
  type Firestore,
} from 'firebase/firestore';
import type { ProgressState, UserProfile } from '../types';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

function readConfig() {
  const cfg = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };
  return cfg.apiKey && cfg.projectId ? cfg : null;
}

export function firebaseAvailable(): boolean {
  return readConfig() !== null;
}

function ensureDb(): Firestore | null {
  if (db) return db;
  const cfg = readConfig();
  if (!cfg) return null;
  app = initializeApp(cfg);
  db = getFirestore(app);
  return db;
}

/** Stable anonymous id for the local profile (name+createdAt hash). */
function userDocId(profile: UserProfile): string {
  const raw = `${profile.name}-${profile.createdAt}`;
  let h = 0;
  for (const c of raw) h = ((h << 5) - h + c.charCodeAt(0)) | 0;
  return `u${Math.abs(h)}`;
}

export async function syncProgress(
  profile: UserProfile, progress: ProgressState,
): Promise<void> {
  const database = ensureDb();
  if (!database) return;
  try {
    await setDoc(doc(database, 'users', userDocId(profile)), {
      name: profile.name,
      ageBand: profile.ageBand,
      targetLanguage: profile.targetLanguage,
      level: profile.level,
      xp: progress.xp,
      streak: progress.streak,
      lessonsCompleted: progress.lessonsCompleted,
      updatedAt: Date.now(),
    }, { merge: true });
  } catch {
    // Sync is best-effort: never break the offline experience.
  }
}

export interface LeaderboardEntry {
  name: string;
  xp: number;
  streak: number;
  isYou?: boolean;
}

export async function fetchLeaderboard(profile: UserProfile): Promise<LeaderboardEntry[]> {
  const database = ensureDb();
  if (!database) return [];
  try {
    const snap = await getDocs(
      query(collection(database, 'users'), orderBy('xp', 'desc'), limit(20)),
    );
    const you = userDocId(profile);
    return snap.docs.map((d) => ({
      name: (d.data().name as string) ?? 'Anonimo',
      xp: (d.data().xp as number) ?? 0,
      streak: (d.data().streak as number) ?? 0,
      isYou: d.id === you,
    }));
  } catch {
    return [];
  }
}
