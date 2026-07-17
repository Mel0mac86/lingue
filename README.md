# Lingue 🌍🗣️

**Impara le lingue parlando** — un tutor personale AI disponibile 24 ore su 24,
che unisce un percorso didattico progressivo (stile Duolingo) a **conversazioni
vocali realistiche con avatar AI** che insegnano, correggono e conversano come
persone vere.

App mobile realizzata con **React Native (Expo) + TypeScript**, AI powered by
**Groq** (LLM + Whisper), pronta per l'integrazione **Firebase**.

---

## ✨ Funzionalità

### Percorso di apprendimento (A1 → C2)
Ogni lezione segue sempre lo stesso flusso:

1. **Nuovo vocabolario** (con pronuncia audio)
2. **Nuove espressioni**
3. **Grammatica spiegata in modo semplice**
4. Esercizi di **ascolto** 🎧
5. Esercizi di **lettura** 📖
6. Esercizi di **scrittura** ✍️
7. Esercizi di **comprensione** 🧩
8. **Quiz finale** 🏁
9. **Conversazione vocale con avatar AI** che usa *solo* gli argomenti appena studiati
10. **Correzione dettagliata** della conversazione (colori: 🟢 corretto · 🟡 migliorabile · 🔴 errore)
11. La lezione successiva si **sblocca solo** con quiz ≥ 70% e conversazione ≥ 60/100

Gli esercizi sbagliati vengono **riproposti a fine argomento** finché non sono risolti.

### Conversazione con avatar AI
- **Avatar 3D realistici** (Three.js): volto con palpebre che sbattono davvero, iridi che si muovono, labbra e **mascella articolata per la sincronizzazione labiale**, capigliature e espressioni legate all'umore — su iOS/Android (expo-gl) e web (WebGL)
- **Per i bambini: 8 amici animali 3D** (volpe, orso, gatto, cane, coniglio, panda, leone, pinguino) — il bambino sceglie il suo nell'onboarding e parla con lui dopo ogni lezione
- **Ponte italiano** 🎙️🇮🇹: se non riesci a esprimerti nella lingua studiata puoi parlare in italiano; l'avatar ti capisce, ti insegna come dirlo e ti invita a ripeterlo (senza penalizzare i punteggi)
- Parla in modo naturale, fa domande, si adatta al livello, **usa il tuo nome**
- Voce naturale (TTS) + riconoscimento vocale (registrazione → **Groq Whisper**)
- Feedback con punteggi di **pronuncia, grammatica, fluidità, vocabolario** e suggerimenti

### Conversazione libera
- Scegli **avatar, lingua, livello, argomento, scenario**
- 30+ scenari in 6 categorie (viaggi, lavoro, scuola, vita quotidiana, social, cultura), ognuno giocabile in **Beginner / Intermediate / Advanced**
- Correzioni **in tempo reale (opzionale)** o solo nel report finale — l'avatar non ti interrompe

### Percorsi per fascia d'età
Al primo avvio l'app chiede **nome ed età** e adatta tutto:
- **Bambini (6–10)**: avatar giocosi, tono da gioco, lezioni brevi
- **Ragazzi (11–17)**: scuola, videogiochi, sport, social, musica
- **Adulti (18–59)**: lavoro, business, colloqui, viaggi, famiglia
- **Senior (60+)**: caratteri più grandi, ritmo lento, ripassi frequenti

### AI personalizzata
- Analisi continua di errori ricorrenti, pronuncia, grammatica e ritmo di studio
- **Piano di studio settimanale generato dall'AI** in base ai tuoi dati
- Le lezioni per tutte le lingue/livelli sono generate dall'AI e **salvate in cache** (le prime lezioni di inglese sono incluse offline)

### Dashboard & Gamification
- Minuti parlati, parole imparate, precisione, livello CEFR, streak, grafici
- XP, livelli, 12 badge, **missioni giornaliere**, obiettivo settimanale

### Design
- Palette **blu / verde acqua / bianco**, tema **chiaro e scuro**
- UI adattiva per fascia d'età (font, raggi, ritmo)

---

## 🚀 Avvio rapido

```bash
npm install

# Configura la chiave AI (scegli UNA delle due):
# a) copia .env.example in .env e inserisci EXPO_PUBLIC_GROQ_API_KEY
# b) oppure inseriscila in-app: Profilo → Impostazioni AI

npx expo start
```

Apri con **Expo Go** (Android/iOS) scansionando il QR code, oppure `npx expo start --web`.

## 📱 Installa su iPhone (senza App Store)

L'app si pubblica come **PWA su GitHub Pages** ad ogni push (workflow
`.github/workflows/deploy-web.yml`):

1. **Una sola volta**: attiva GitHub Pages dal repo su github.com →
   **Settings → Pages → Build and deployment → Source: "Deploy from a
   branch" → Branch: `gh-pages` / `/ (root)` → Save**.
   (Il workflow pubblica già il sito sul branch `gh-pages` ad ogni push;
   questo passaggio dice a GitHub di servirlo.)
2. Dopo ~1 minuto apri **https://mel0mac86.github.io/lingue/** in Safari sull'iPhone.
3. Tocca **Condividi (□↑) → "Aggiungi alla schermata Home"**.
4. Lingue appare come un'app vera: icona, schermo intero, tutto funzionante
   (microfono incluso, iOS ≥ 16.4).

Al primo avvio inserisci la chiave Groq in **Profilo → Impostazioni AI**.

> ⚠️ **Sicurezza**: non committare MAI chiavi API. Il file `.env` è gitignorato.
> Se una chiave è stata esposta, revocala su console.groq.com e generane una nuova.

## 🧱 Architettura

```
src/
├── types/          Modelli di dominio (Lesson, Feedback, Progress, Scenario…)
├── theme/          Tema chiaro/scuro + scaling per fascia d'età
├── content/        Lingue (9), avatar (8), scenari (30+), curriculum CEFR,
│                   lezioni seed offline
├── services/
│   ├── groq.ts           Client Groq: chat, JSON-mode, Whisper STT
│   ├── tutor.ts          Motore conversazionale: prompt per persona/età/livello,
│   │                     valutazione con punteggi e correzioni colorate
│   ├── lessonFactory.ts  Pipeline contenuti AI: curriculum → lezione (con cache)
│   ├── speech.ts         TTS (expo-speech) + registrazione (expo-av)
│   ├── gamification.ts   XP, livelli, badge, missioni giornaliere
│   ├── studyPlan.ts      Piano di studio AI personalizzato
│   └── firebase.ts       Sync opzionale Firestore + classifica
├── state/          Store globale con persistenza (AsyncStorage)
├── components/     Avatar animato (lip-sync), bolle chat con correzioni
│                   colorate, esercizi, grafici, UI kit
├── navigation/     Stack + tab (Percorso, Parla, Progressi, Profilo)
└── screens/        Onboarding, Home, Lezione, Conversazione, Feedback,
                    Ripasso errori, Conversazione libera, Dashboard, Profilo, Premium
```

**Aggiungere una lingua** = una riga in `src/content/languages.ts`: il
curriculum è indipendente dalla lingua e le lezioni vengono generate dall'AI.

**Avatar 3D**: renderer procedurale Three.js in `components/Avatar3D.tsx`
(react-three-fiber: stessa scena su nativo e web). Il vecchio avatar
vettoriale 2D resta in `components/Avatar.tsx` come fallback. Il passo
successivo naturale è un modello GLB fotorealistico (Ready Player Me) con
morph target per i visemi: la scena è già isolata dietro questo componente.

## 🔌 Integrazione Firebase (opzionale)

L'app funziona completamente offline. Configurando le variabili
`EXPO_PUBLIC_FIREBASE_*` in `.env` si attivano:
- **Firestore**: sync dei progressi multi-dispositivo + classifica globale
- **FCM**: notifiche promemoria (richiede build nativa)
- **Analytics**: eventi di apprendimento

## 💎 Premium

Paywall dimostrativo incluso (`PremiumScreen`): conversazioni illimitate,
tutti gli scenari/avatar, analisi avanzata. Per gli store va integrato un
sistema di acquisti reale (RevenueCat / StoreKit / Play Billing).

## ✅ Verifica

```bash
npx tsc --noEmit   # type-check completo
```
