import type { Lesson } from '../types';

/**
 * Hand-written seed lessons (English for Italian speakers, first A1 units).
 * They guarantee a complete offline experience out of the box; every other
 * lesson (other units, levels and languages) is generated on demand by the
 * AI content pipeline in services/lessonFactory.ts and cached locally.
 */
export const SEED_LESSONS: Lesson[] = [
  {
    id: 'en-A1-0',
    language: 'en',
    level: 'A1',
    unitIndex: 0,
    title: 'Saluta e presentati',
    topic: 'greetings',
    vocabulary: [
      { term: 'hello', translation: 'ciao / salve', phonetic: '/həˈloʊ/', example: 'Hello! How are you?', exampleTranslation: 'Ciao! Come stai?' },
      { term: 'good morning', translation: 'buongiorno', phonetic: '/ɡʊd ˈmɔːrnɪŋ/', example: 'Good morning, Anna!', exampleTranslation: 'Buongiorno, Anna!' },
      { term: 'goodbye', translation: 'arrivederci', phonetic: '/ɡʊdˈbaɪ/', example: 'Goodbye! See you tomorrow.', exampleTranslation: 'Arrivederci! A domani.' },
      { term: 'name', translation: 'nome', phonetic: '/neɪm/', example: 'My name is Marco.', exampleTranslation: 'Il mio nome è Marco.' },
      { term: 'nice', translation: 'piacevole / bello', phonetic: '/naɪs/', example: 'Nice to meet you!', exampleTranslation: 'Piacere di conoscerti!' },
      { term: 'please', translation: 'per favore', phonetic: '/pliːz/', example: 'Repeat, please.', exampleTranslation: 'Ripeti, per favore.' },
      { term: 'thank you', translation: 'grazie', phonetic: '/θæŋk juː/', example: 'Thank you very much!', exampleTranslation: 'Grazie mille!' },
      { term: 'yes / no', translation: 'sì / no', phonetic: '/jɛs/ /noʊ/', example: 'Yes, I am Italian.', exampleTranslation: 'Sì, sono italiano.' },
    ],
    expressions: [
      { phrase: 'How are you?', translation: 'Come stai?', usage: 'Domanda standard dopo un saluto.' },
      { phrase: "I'm fine, thanks. And you?", translation: 'Sto bene, grazie. E tu?', usage: 'Risposta cortese a "How are you?".' },
      { phrase: 'What’s your name?', translation: 'Come ti chiami?', usage: 'Per chiedere il nome di qualcuno.' },
      { phrase: 'Nice to meet you!', translation: 'Piacere di conoscerti!', usage: 'Quando incontri qualcuno per la prima volta.' },
      { phrase: 'Where are you from?', translation: 'Di dove sei?', usage: 'Per chiedere la provenienza.' },
    ],
    grammar: [
      {
        title: 'Il verbo essere: to be (I / you)',
        explanation: 'In inglese "essere" si dice "to be". Al presente: I am (io sono), you are (tu sei). Nelle domande si inverte: Are you...? Nelle frasi negative si aggiunge "not": I am not.',
        examples: [
          { sample: 'I am Marco.', translation: 'Io sono Marco.' },
          { sample: 'You are my friend.', translation: 'Tu sei mio amico.' },
          { sample: 'Are you Italian?', translation: 'Sei italiano?' },
        ],
      },
      {
        title: 'I pronomi personali',
        explanation: 'I pronomi soggetto sono sempre obbligatori in inglese: I (io), you (tu/voi), he (lui), she (lei), it (esso), we (noi), they (loro).',
        examples: [
          { sample: 'She is a teacher.', translation: 'Lei è un’insegnante.' },
          { sample: 'We are students.', translation: 'Noi siamo studenti.' },
        ],
      },
    ],
    exercises: [
      { id: 'en-A1-0-l1', kind: 'listening', prompt: 'Ascolta e scegli cosa senti.', audioText: 'Good morning! Nice to meet you.', choices: ['Good morning! Nice to meet you.', 'Good night! See you later.', 'Hello! How old are you?'], answer: '0' },
      { id: 'en-A1-0-l2', kind: 'listening', prompt: 'Ascolta la domanda e scegli la risposta corretta.', audioText: 'What is your name?', choices: ['I am from Italy.', 'My name is Luca.', 'I am fine, thanks.'], answer: '1' },
      { id: 'en-A1-0-r1', kind: 'reading', prompt: 'Leggi e rispondi: di dove è Anna?', passage: 'Hello! My name is Anna. I am from Spain. Nice to meet you!', choices: ['Italia', 'Spagna', 'Francia'], answer: '1' },
      { id: 'en-A1-0-w1', kind: 'writing', prompt: 'Scrivi in inglese: "Piacere di conoscerti!"', answer: 'nice to meet you', hint: 'Inizia con "Nice..."' },
      { id: 'en-A1-0-w2', kind: 'writing', prompt: 'Completa: "___ are you?" (Come stai?)', answer: 'how', hint: 'Una parola di 3 lettere.' },
      { id: 'en-A1-0-b1', kind: 'wordbank', prompt: 'Componi la frase: "Il mio nome è Anna."', words: ['My', 'name', 'is', 'Anna', 'your', 'am'], answer: 'My name is Anna' },
      { id: 'en-A1-0-b2', kind: 'wordbank', prompt: 'Componi la frase: "Come stai?"', words: ['How', 'are', 'you', 'what', 'old'], answer: 'How are you' },
      { id: 'en-A1-0-c1', kind: 'comprehension', prompt: 'Tom dice: "I am fine, thanks. And you?" Cosa ti ha appena chiesto?', choices: ['Come ti chiami', 'Come stai', 'Di dove sei'], answer: '1' },
      { id: 'en-A1-0-q1', kind: 'quiz', prompt: '"Tu sei" in inglese si dice:', choices: ['You is', 'You are', 'You am'], answer: '1' },
      { id: 'en-A1-0-q2', kind: 'quiz', prompt: 'Come si chiede il nome a qualcuno?', choices: ['What’s your name?', 'How are you?', 'Where are you from?'], answer: '0' },
      { id: 'en-A1-0-q3', kind: 'quiz', prompt: '"Grazie mille" si dice:', choices: ['Please very much', 'Thank you very much', 'Nice very much'], answer: '1' },
      { id: 'en-A1-0-q4', kind: 'quiz', prompt: 'Completa: "I ___ Italian."', choices: ['is', 'are', 'am'], answer: '2' },
    ],
    conversationBrief: 'Prima conversazione in assoluto: salutare, chiedere e dire il nome, chiedere "How are you?", dire la provenienza. Usa SOLO: hello, good morning, goodbye, What’s your name?, My name is..., Nice to meet you, How are you?, I’m fine, Where are you from?, I am from... Frasi di massimo 6-8 parole.',
  },
  {
    id: 'en-A1-1',
    language: 'en',
    level: 'A1',
    unitIndex: 1,
    title: 'Conta e dì la tua età',
    topic: 'numbers',
    vocabulary: [
      { term: 'one, two, three', translation: 'uno, due, tre', example: 'I have two brothers.', exampleTranslation: 'Ho due fratelli.' },
      { term: 'ten', translation: 'dieci', phonetic: '/tɛn/', example: 'Ten students are here.', exampleTranslation: 'Dieci studenti sono qui.' },
      { term: 'twenty', translation: 'venti', phonetic: '/ˈtwɛnti/', example: 'She is twenty.', exampleTranslation: 'Lei ha vent’anni.' },
      { term: 'hundred', translation: 'cento', phonetic: '/ˈhʌndrəd/', example: 'One hundred euros, please.', exampleTranslation: 'Cento euro, per favore.' },
      { term: 'old', translation: 'vecchio / (per l’età)', phonetic: '/oʊld/', example: 'How old are you?', exampleTranslation: 'Quanti anni hai?' },
      { term: 'year', translation: 'anno', phonetic: '/jɪr/', example: 'I am 30 years old.', exampleTranslation: 'Ho 30 anni.' },
      { term: 'birthday', translation: 'compleanno', phonetic: '/ˈbɜːrθdeɪ/', example: 'Happy birthday!', exampleTranslation: 'Buon compleanno!' },
      { term: 'phone number', translation: 'numero di telefono', example: 'What is your phone number?', exampleTranslation: 'Qual è il tuo numero di telefono?' },
    ],
    expressions: [
      { phrase: 'How old are you?', translation: 'Quanti anni hai?', usage: 'In inglese l’età si chiede con "old", non con "avere".' },
      { phrase: "I'm ... years old.", translation: 'Ho ... anni.', usage: 'Risposta standard: I’m 25 years old.' },
      { phrase: 'What’s your phone number?', translation: 'Qual è il tuo numero?', usage: 'I numeri si leggono cifra per cifra.' },
      { phrase: 'Happy birthday!', translation: 'Buon compleanno!', usage: 'Auguri di compleanno.' },
    ],
    grammar: [
      {
        title: 'Il verbo avere: to have',
        explanation: '"Avere" si dice "to have": I have, you have, he/she has. Attenzione: per l’età NON si usa have ma il verbo be: "I am 20 (years old)".',
        examples: [
          { sample: 'I have a dog.', translation: 'Ho un cane.' },
          { sample: 'She has two sisters.', translation: 'Lei ha due sorelle.' },
          { sample: 'I am 20 years old.', translation: 'Ho 20 anni. (letteralmente: sono vecchio 20 anni)' },
        ],
      },
      {
        title: 'I numeri da 0 a 100',
        explanation: 'Da 13 a 19 finiscono in -teen (thirteen, fourteen...); le decine finiscono in -ty (twenty, thirty...). I composti si scrivono con trattino: twenty-one, thirty-five.',
        examples: [
          { sample: 'fifteen (15), fifty (50)', translation: 'quindici, cinquanta — attenzione alla differenza!' },
          { sample: 'ninety-nine (99)', translation: 'novantanove' },
        ],
      },
    ],
    exercises: [
      { id: 'en-A1-1-l1', kind: 'listening', prompt: 'Ascolta: che numero senti?', audioText: 'My sister is thirteen years old.', choices: ['30', '13', '3'], answer: '1' },
      { id: 'en-A1-1-l2', kind: 'listening', prompt: 'Ascolta e scegli la frase corretta.', audioText: 'How old are you?', choices: ['Ti chiede il nome', 'Ti chiede l’età', 'Ti chiede il numero di telefono'], answer: '1' },
      { id: 'en-A1-1-r1', kind: 'reading', prompt: 'Leggi: "Tom is twenty-two. His brother is thirty." Quanti anni ha il fratello di Tom?', choices: ['22', '30', '20'], answer: '1' },
      { id: 'en-A1-1-w1', kind: 'writing', prompt: 'Scrivi in lettere il numero 50.', answer: 'fifty', hint: 'Finisce in -ty.' },
      { id: 'en-A1-1-w2', kind: 'writing', prompt: 'Completa: "I ___ 25 years old."', answer: 'am', hint: 'Per l’età si usa il verbo essere!' },
      { id: 'en-A1-1-b1', kind: 'wordbank', prompt: 'Componi la frase: "Ho 20 anni."', words: ['I', 'am', '20', 'years', 'old', 'have'], answer: 'I am 20 years old' },
      { id: 'en-A1-1-b2', kind: 'wordbank', prompt: 'Componi la frase: "Lei ha due sorelle."', words: ['She', 'has', 'two', 'sisters', 'have', 'sister'], answer: 'She has two sisters' },
      { id: 'en-A1-1-c1', kind: 'comprehension', prompt: '"She has three dogs" significa:', choices: ['Lei ha tre cani', 'Lei ha tredici cani', 'Lei è tre cani'], answer: '0' },
      { id: 'en-A1-1-q1', kind: 'quiz', prompt: 'Come si chiede l’età in inglese?', choices: ['How many years do you have?', 'How old are you?', 'What age you are?'], answer: '1' },
      { id: 'en-A1-1-q2', kind: 'quiz', prompt: '15 si scrive:', choices: ['fivety', 'fifty', 'fifteen'], answer: '2' },
      { id: 'en-A1-1-q3', kind: 'quiz', prompt: 'Completa: "He ___ two brothers."', choices: ['have', 'has', 'is'], answer: '1' },
      { id: 'en-A1-1-q4', kind: 'quiz', prompt: '"Ho 40 anni" si dice:', choices: ['I have 40 years.', 'I am 40 years old.', 'I has 40 years old.'], answer: '1' },
    ],
    conversationBrief: 'Conversazione su numeri ed età: chiedere e dire l’età (How old are you? / I’m ... years old), contare oggetti, chiedere il numero di telefono, fare gli auguri di compleanno. Riusa anche i saluti della lezione precedente. Frasi brevissime.',
  },
  {
    id: 'en-A1-2',
    language: 'en',
    level: 'A1',
    unitIndex: 2,
    title: 'Parla della famiglia',
    topic: 'family',
    vocabulary: [
      { term: 'mother / mom', translation: 'madre / mamma', phonetic: '/ˈmʌðər/', example: 'My mother is a doctor.', exampleTranslation: 'Mia madre è un medico.' },
      { term: 'father / dad', translation: 'padre / papà', phonetic: '/ˈfɑːðər/', example: 'My father works in a bank.', exampleTranslation: 'Mio padre lavora in banca.' },
      { term: 'brother', translation: 'fratello', phonetic: '/ˈbrʌðər/', example: 'My brother is 15.', exampleTranslation: 'Mio fratello ha 15 anni.' },
      { term: 'sister', translation: 'sorella', phonetic: '/ˈsɪstər/', example: 'I have one sister.', exampleTranslation: 'Ho una sorella.' },
      { term: 'grandmother', translation: 'nonna', example: 'My grandmother is 80 years old.', exampleTranslation: 'Mia nonna ha 80 anni.' },
      { term: 'grandfather', translation: 'nonno', example: 'My grandfather likes tea.', exampleTranslation: 'A mio nonno piace il tè.' },
      { term: 'son / daughter', translation: 'figlio / figlia', example: 'They have a son and a daughter.', exampleTranslation: 'Hanno un figlio e una figlia.' },
      { term: 'tall / short', translation: 'alto / basso', example: 'My dad is very tall.', exampleTranslation: 'Mio papà è molto alto.' },
    ],
    expressions: [
      { phrase: 'This is my...', translation: 'Questo/a è mio/a...', usage: 'Per presentare familiari: This is my sister, Anna.' },
      { phrase: 'Do you have any brothers or sisters?', translation: 'Hai fratelli o sorelle?', usage: 'Domanda classica sulla famiglia.' },
      { phrase: 'There are four of us.', translation: 'Siamo in quattro.', usage: 'Per dire quante persone ci sono in famiglia.' },
    ],
    grammar: [
      {
        title: 'Gli aggettivi possessivi',
        explanation: 'my (mio), your (tuo), his (suo di lui), her (suo di lei), our (nostro), their (loro). Non cambiano mai al plurale: my brother, my brothers.',
        examples: [
          { sample: 'Her name is Julia.', translation: 'Il suo nome (di lei) è Julia.' },
          { sample: 'Their house is big.', translation: 'La loro casa è grande.' },
        ],
      },
      {
        title: 'Il genitivo sassone (’s)',
        explanation: 'Per indicare possesso si aggiunge ’s al possessore: "Marco’s sister" = la sorella di Marco. L’ordine è inverso rispetto all’italiano.',
        examples: [
          { sample: "Anna's brother is tall.", translation: 'Il fratello di Anna è alto.' },
          { sample: "My mother's car", translation: 'La macchina di mia madre' },
        ],
      },
    ],
    exercises: [
      { id: 'en-A1-2-l1', kind: 'listening', prompt: 'Ascolta: di chi parla?', audioText: 'My sister is a student. She is nineteen.', choices: ['Della sorella', 'Del fratello', 'Della madre'], answer: '0' },
      { id: 'en-A1-2-l2', kind: 'listening', prompt: 'Ascolta e scegli la traduzione.', audioText: 'This is my grandfather.', choices: ['Questa è mia nonna', 'Questo è mio nonno', 'Questo è mio padre'], answer: '1' },
      { id: 'en-A1-2-r1', kind: 'reading', prompt: 'Leggi: "I have two brothers. My brother Tom is tall, my brother Sam is short." Com’è Sam?', passage: 'I have two brothers. My brother Tom is tall, my brother Sam is short.', choices: ['Alto', 'Basso', 'Giovane'], answer: '1' },
      { id: 'en-A1-2-w1', kind: 'writing', prompt: 'Scrivi in inglese: "mia madre"', answer: 'my mother', hint: 'Possessivo + nome.' },
      { id: 'en-A1-2-w2', kind: 'writing', prompt: 'Completa: "___ name is Julia." (il nome di lei)', answer: 'her', hint: 'Possessivo femminile.' },
      { id: 'en-A1-2-b1', kind: 'wordbank', prompt: 'Componi la frase: "Mia madre è alta."', words: ['My', 'mother', 'is', 'tall', 'short', 'her'], answer: 'My mother is tall' },
      { id: 'en-A1-2-b2', kind: 'wordbank', prompt: 'Componi la frase: "Questo è mio fratello."', words: ['This', 'is', 'my', 'brother', 'sister', 'their'], answer: 'This is my brother' },
      { id: 'en-A1-2-c1', kind: 'comprehension', prompt: '"Marco’s sister" significa:', choices: ['Marco e sua sorella', 'La sorella di Marco', 'Marco è sua sorella'], answer: '1' },
      { id: 'en-A1-2-q1', kind: 'quiz', prompt: '"Nonna" si dice:', choices: ['grandfather', 'grandmother', 'granddaughter'], answer: '1' },
      { id: 'en-A1-2-q2', kind: 'quiz', prompt: 'Completa: "___ house is big." (la loro casa)', choices: ['They', 'Them', 'Their'], answer: '2' },
      { id: 'en-A1-2-q3', kind: 'quiz', prompt: '"Il fratello di Anna" si dice:', choices: ['The brother of Anna', "Anna's brother", 'Anna brother'], answer: '1' },
      { id: 'en-A1-2-q4', kind: 'quiz', prompt: '"Hai fratelli o sorelle?" si dice:', choices: ['Do you have any brothers or sisters?', 'Are you have brothers?', 'How many brothers you are?'], answer: '0' },
    ],
    conversationBrief: 'Conversazione sulla famiglia: chiedere e descrivere la famiglia (Do you have any brothers or sisters?, This is my..., aggettivi possessivi, genitivo sassone), età dei familiari (ripasso numeri), descrizioni semplici (tall/short). Frasi brevi e incoraggiamento continuo.',
  },
  {
    id: 'pl-A1-0',
    language: 'pl',
    level: 'A1',
    unitIndex: 0,
    title: 'Saluta e presentati',
    topic: 'greetings',
    vocabulary: [
      { term: 'cześć', translation: 'ciao (informale)', phonetic: '≈ “cesc’” (cesh-ć)', example: 'Cześć! Jak się masz?', exampleTranslation: 'Ciao! Come stai?' },
      { term: 'dzień dobry', translation: 'buongiorno', phonetic: '≈ “gen dòbri”', example: 'Dzień dobry, Anno!', exampleTranslation: 'Buongiorno, Anna!' },
      { term: 'do widzenia', translation: 'arrivederci', phonetic: '≈ “do vidzègna”', example: 'Do widzenia! Do jutra.', exampleTranslation: 'Arrivederci! A domani.' },
      { term: 'imię', translation: 'nome', phonetic: '≈ “ìmie”', example: 'Mam na imię Marek.', exampleTranslation: 'Mi chiamo Marek.' },
      { term: 'miło mi', translation: 'piacere', phonetic: '≈ “mìuo mi”', example: 'Miło mi cię poznać!', exampleTranslation: 'Piacere di conoscerti!' },
      { term: 'proszę', translation: 'per favore / prego', phonetic: '≈ “pròsce”', example: 'Powtórz, proszę.', exampleTranslation: 'Ripeti, per favore.' },
      { term: 'dziękuję', translation: 'grazie', phonetic: '≈ “gien-kùie”', example: 'Dziękuję bardzo!', exampleTranslation: 'Grazie mille!' },
      { term: 'tak / nie', translation: 'sì / no', phonetic: '≈ “tak / gne”', example: 'Tak, jestem z Włoch.', exampleTranslation: 'Sì, sono italiano.' },
    ],
    expressions: [
      { phrase: 'Jak się masz?', translation: 'Come stai?', usage: 'Domanda standard dopo un saluto (informale).' },
      { phrase: 'Dobrze, dziękuję. A ty?', translation: 'Bene, grazie. E tu?', usage: 'Risposta cortese a "Jak się masz?".' },
      { phrase: 'Jak masz na imię?', translation: 'Come ti chiami?', usage: 'Letteralmente: "come hai per nome?".' },
      { phrase: 'Miło mi cię poznać!', translation: 'Piacere di conoscerti!', usage: 'Quando incontri qualcuno per la prima volta.' },
      { phrase: 'Skąd jesteś?', translation: 'Di dove sei?', usage: 'Per chiedere la provenienza.' },
    ],
    grammar: [
      {
        title: 'Il verbo essere: być (io / tu)',
        explanation: 'In polacco "essere" è "być". Al presente: ja jestem (io sono), ty jesteś (tu sei). Il pronome (ja, ty) spesso si omette perché il verbo indica già la persona: "Jestem Marek".',
        examples: [
          { sample: 'Jestem Marek.', translation: 'Io sono Marek.' },
          { sample: 'Ty jesteś moim przyjacielem.', translation: 'Tu sei mio amico.' },
          { sample: 'Jesteś z Włoch?', translation: 'Sei italiano/a? (Sei dall’Italia?)' },
        ],
      },
      {
        title: 'I pronomi personali',
        explanation: 'I pronomi soggetto sono: ja (io), ty (tu), on (lui), ona (lei), my (noi), wy (voi), oni/one (loro). In polacco si usano soprattutto per enfasi: di solito basta il verbo.',
        examples: [
          { sample: 'Ona jest nauczycielką.', translation: 'Lei è un’insegnante.' },
          { sample: 'My jesteśmy studentami.', translation: 'Noi siamo studenti.' },
        ],
      },
    ],
    exercises: [
      { id: 'pl-A1-0-l1', kind: 'listening', prompt: 'Ascolta e scegli cosa senti.', audioText: 'Dzień dobry! Miło mi cię poznać.', choices: ['Dzień dobry! Miło mi cię poznać.', 'Do widzenia! Do jutra.', 'Cześć! Jak się masz?'], answer: '0' },
      { id: 'pl-A1-0-l2', kind: 'listening', prompt: 'Ascolta la domanda e scegli la risposta corretta.', audioText: 'Jak masz na imię?', choices: ['Jestem z Włoch.', 'Mam na imię Marek.', 'Dobrze, dziękuję.'], answer: '1' },
      { id: 'pl-A1-0-r1', kind: 'reading', prompt: 'Leggi e rispondi: di dove è Anna?', passage: 'Cześć! Mam na imię Anna. Jestem z Hiszpanii. Miło mi!', choices: ['Italia', 'Spagna', 'Francia'], answer: '1' },
      { id: 'pl-A1-0-w1', kind: 'writing', prompt: 'Scrivi in polacco: "Grazie!"', answer: 'dziękuję', hint: 'Puoi scriverlo senza segni diacritici: "dziekuje".' },
      { id: 'pl-A1-0-w2', kind: 'writing', prompt: 'Completa: "___ dobry!" (Buongiorno)', answer: 'dzień', hint: 'Anche "dzien" va bene.' },
      { id: 'pl-A1-0-b1', kind: 'wordbank', prompt: 'Componi la frase: "Mi chiamo Anna."', words: ['Mam', 'na', 'imię', 'Anna', 'jestem', 'ty'], answer: 'Mam na imię Anna' },
      { id: 'pl-A1-0-b2', kind: 'wordbank', prompt: 'Componi la frase: "Come stai?"', words: ['Jak', 'się', 'masz', 'skąd', 'jesteś'], answer: 'Jak się masz' },
      { id: 'pl-A1-0-c1', kind: 'comprehension', prompt: 'Qualcuno dice: "Dobrze, dziękuję. A ty?" Cosa ti sta chiedendo di rimando?', choices: ['Il tuo nome', 'Come stai tu', 'Di dove sei'], answer: '1' },
      { id: 'pl-A1-0-q1', kind: 'quiz', prompt: '"Tu sei" in polacco si dice:', choices: ['ty jest', 'ty jesteś', 'ty jestem'], answer: '1' },
      { id: 'pl-A1-0-q2', kind: 'quiz', prompt: 'Come si chiede il nome a qualcuno?', choices: ['Jak masz na imię?', 'Jak się masz?', 'Skąd jesteś?'], answer: '0' },
      { id: 'pl-A1-0-q3', kind: 'quiz', prompt: '"Grazie" si dice:', choices: ['Proszę', 'Dziękuję', 'Cześć'], answer: '1' },
      { id: 'pl-A1-0-q4', kind: 'quiz', prompt: 'Completa: "Ja ___ z Włoch." (io sono)', choices: ['jest', 'jesteś', 'jestem'], answer: '2' },
    ],
    conversationBrief: 'Prima conversazione in polacco: salutare, chiedere e dire il nome, chiedere "Jak się masz?", dire la provenienza. Usa SOLO: cześć, dzień dobry, do widzenia, Jak masz na imię?, Mam na imię..., Miło mi cię poznać, Jak się masz?, Dobrze dziękuję, Skąd jesteś?, Jestem z... Frasi di massimo 5-7 parole, molto lente e incoraggianti.',
  },
];

export const seedLessonById = (id: string): Lesson | undefined =>
  SEED_LESSONS.find((l) => l.id === id);
