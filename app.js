const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
$$('svg.icon').forEach((element) => element.setAttribute('aria-hidden', 'true'));
const icon = (name, className = '') => `<svg class="icon ${className}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const escapeHTML = (text) => String(text).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const normalize = (text) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[¿?¡!.,;:]/g, '').replace(/\s+/g, ' ').trim();
const shuffle = (items) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const STORAGE_KEY = 'hola-club-progress-v1';
const defaults = { xp: 0, dailyXP: 0, day: '', streak: 0, sessions: 0, correct: 0, attempted: 0, effects: true, autoSpeak: true, rate: .85 };
let saved = { ...defaults };
let storageAvailable = true;
try {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  for (const key of Object.keys(defaults)) {
    if (typeof data[key] === typeof defaults[key]) saved[key] = data[key];
  }
  for (const key of ['xp', 'dailyXP', 'streak', 'sessions', 'correct', 'attempted']) {
    if (!Number.isFinite(saved[key]) || saved[key] < 0) saved[key] = 0;
  }
  if (![.7, .85, 1].includes(saved.rate)) saved.rate = .85;
} catch {
  storageAvailable = false;
}

const pronouns = [
  { subject: 'yo', english: 'I', verb: 'soy', phrase: 'Yo soy', translation: 'I am' },
  { subject: 'tú', english: 'you · informal, one person', verb: 'eres', phrase: 'Tú eres', translation: 'You are (informal)' },
  { subject: 'él', english: 'he', verb: 'es', phrase: 'Él es', translation: 'He is' },
  { subject: 'ella', english: 'she', verb: 'es', phrase: 'Ella es', translation: 'She is' },
  { subject: 'usted', english: 'you · formal, one person', verb: 'es', phrase: 'Usted es', translation: 'You are (formal)' },
  { subject: 'nosotros', english: 'we · masculine or mixed group', verb: 'somos', phrase: 'Nosotros somos', translation: 'We are' },
  { subject: 'nosotras', english: 'we · feminine group', verb: 'somos', phrase: 'Nosotras somos', translation: 'We are (feminine group)' },
  { subject: 'vosotros', english: 'you all · informal, Spain', verb: 'sois', phrase: 'Vosotros sois', translation: 'You all are (informal, Spain)' },
  { subject: 'vosotras', english: 'you all · feminine, informal, Spain', verb: 'sois', phrase: 'Vosotras sois', translation: 'You all are (feminine, informal, Spain)' },
  { subject: 'ustedes', english: 'you all · Latin America; formal in Spain', verb: 'son', phrase: 'Ustedes son', translation: 'You all are' },
  { subject: 'ellos', english: 'they · masculine or mixed group', verb: 'son', phrase: 'Ellos son', translation: 'They are (masculine or mixed group)' },
  { subject: 'ellas', english: 'they · feminine group', verb: 'son', phrase: 'Ellas son', translation: 'They are (feminine group)' }
];
const verbs = ['soy', 'eres', 'es', 'somos', 'sois', 'son'];
const uses = [
  { label: 'Identity', sentence: 'Es un libro.', translation: 'It is a book.', hint: 'Ser identifies who or what something is.' },
  { label: 'Occupation', sentence: 'Ella es profesora.', translation: 'She is a teacher.', hint: 'Use ser to say what someone does.' },
  { label: 'Description', sentence: 'Joaquín es tranquilo.', translation: 'Joaquín is a calm person.', hint: 'Ser describes a characteristic, not a temporary mood.' },
  { label: 'Time & date', sentence: 'Son las dos.', translation: 'It is two o’clock.', hint: 'Use son for most hours; es for one o’clock.' },
  { label: 'Relationships', sentence: 'Felipe y Joaquín son amigos.', translation: 'Felipe and Joaquín are friends.', hint: 'Use ser for relationships between people.' },
  { label: 'Origin', sentence: 'Ella es de México.', translation: 'She is from Mexico.', hint: 'Ser + de tells where someone is from.' },
  { label: 'Possession', sentence: 'La casa es de Juan.', translation: 'The house belongs to Juan.', hint: 'Ser + de can tell you who owns something.' }
];
const sentences = [
  { words: ['Yo', 'soy', 'estudiante'], english: 'I am a student.', hint: 'Yo pairs with soy. Estudiante means student.' },
  { words: ['Tú', 'eres', 'mi', 'amigo'], english: 'You are my friend. (informal, male friend)', hint: 'Tú pairs with eres. Mi amigo means my friend.' },
  { words: ['Ella', 'es', 'profesora'], english: 'She is a teacher.', hint: 'Ella pairs with es. Profesora means teacher.' },
  { words: ['Nosotros', 'somos', 'amigos'], english: 'We are friends. (masculine or mixed group)', hint: 'Nosotros pairs with somos.' },
  { words: ['Vosotros', 'sois', 'estudiantes'], english: 'You all are students. (informal, Spain)', hint: 'Vosotros pairs with sois.' },
  { words: ['Ustedes', 'son', 'estudiantes'], english: 'You all are students. (Latin America)', hint: 'Ustedes pairs with son.' },
  { words: ['Ellas', 'son', 'amigas'], english: 'They are friends. (feminine group)', hint: 'Ellas pairs with son. Amigas is feminine plural.' },
  { words: ['Ella', 'es', 'de', 'México'], english: 'She is from Mexico.', hint: 'Ser + de describes origin.' },
  { words: ['La', 'casa', 'es', 'de', 'Juan'], english: 'The house belongs to Juan.', hint: 'Ser + de also describes possession.' },
  { words: ['Hoy', 'es', 'miércoles'], english: 'Today is Wednesday.', hint: 'Hoy means today. Dates and days use ser.' }
];
const activities = [
  { mode: 'flash', title: 'Flip & remember', description: 'Little cards. Big lightbulb moments.', tag: 'FLASHCARDS', icon: 'card', tone: 'peach' },
  { mode: 'match', title: 'Find your match', description: 'Some words just belong together.', tag: 'MATCHING PAIRS', icon: 'grid', tone: 'purple' },
  { mode: 'listen', title: 'Listen up!', description: 'Give your Spanish ears a workout.', tag: 'LISTEN & CHOOSE', icon: 'headphones', tone: 'green' },
  { mode: 'build', title: 'Sentence shuffle', description: 'Piece together something worth saying.', tag: 'BUILD A SENTENCE', icon: 'book', tone: 'blue' },
  { mode: 'type', title: 'Fill the little gap', description: 'One missing word. You know this.', tag: 'TYPE YOUR ANSWER', icon: 'keyboard', tone: 'yellow' },
  { mode: 'speak', title: 'Say it, superstar', description: 'Find your voice, one phrase at a time.', tag: 'SPEAK OR TYPE', icon: 'mic', tone: 'rose' },
  { mode: 'choice', title: 'Pick the perfect fit', description: 'Pronouns, ser, and real-life situations.', tag: 'MULTIPLE CHOICE', icon: 'check', tone: 'green' }
];
let session = null;
let currentPage = 'learn';
let audioContext;
let recognition = null;
let recognitionTimer;
let speechTimer;
let speechVersion = 0;
let pageVersion = 0;

const announce = (message) => { $('#app-status').textContent = message; };
const persist = () => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); }
  catch { storageAvailable = false; announce('Your browser can’t save progress right now. You can still play; keep this tab open to keep your wins.'); }
};
const refreshStats = () => {
  const today = localDate();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const currentStreak = [today, localDate(yesterday)].includes(saved.day) ? saved.streak : 0;
  const dailyXP = saved.day === today ? saved.dailyXP : 0;
  $('#header-xp').textContent = saved.xp;
  $('#header-streak').textContent = currentStreak;
  $('#daily-xp').textContent = dailyXP;
  $('#daily-progress').value = Math.min(dailyXP, 50);
  $('#goal-caption').textContent = dailyXP >= 50 ? 'Your daily little win? Done!' : dailyXP ? 'Look at that. You’re growing!' : 'Let’s get your day growing';
};
const addXP = (amount) => {
  const today = localDate();
  if (saved.day !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    saved.streak = saved.day === localDate(yesterday) ? saved.streak + 1 : 1;
    saved.dailyXP = 0;
    saved.day = today;
  }
  saved.xp += amount;
  saved.dailyXP += amount;
  session.xp += amount;
  persist();
  refreshStats();
};
const chime = (success = true) => {
  if (!saved.effects) return;
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    audioContext ||= new Audio();
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    const now = audioContext.currentTime;
    (success ? [523.25, 659.25, 783.99] : [329.63, 293.66]).forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, now + index * .085);
      gain.gain.linearRampToValueAtTime(.07, now + index * .085 + .015);
      gain.gain.exponentialRampToValueAtTime(.001, now + index * .085 + .26);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(now + index * .085);
      oscillator.stop(now + index * .085 + .28);
    });
  } catch { /* Audio is optional when browser playback is restricted. */ }
};
const stopSpeech = () => {
  speechVersion++;
  clearTimeout(speechTimer);
  window.speechSynthesis?.cancel();
};
const speak = (text, language = 'es-ES') => {
  stopSpeech();
  stopListening();
  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
    announce(`Spoken audio isn’t available in this browser. You can read the phrase here: ${text}`);
    return;
  }
  const token = speechVersion;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  utterance.rate = saved.rate;
  const voices = window.speechSynthesis.getVoices();
  utterance.voice = voices.find((voice) => voice.lang === language) || voices.find((voice) => voice.lang.startsWith(language.slice(0, 2))) || null;
  utterance.onerror = (event) => {
    clearTimeout(speechTimer);
    if (token === speechVersion && !['interrupted', 'canceled'].includes(event.error)) announce(`Audio couldn’t play. Try the speaker again, or read: ${text}`);
  };
  utterance.onend = () => { if (token === speechVersion) clearTimeout(speechTimer); };
  speechTimer = setTimeout(() => {
    if (token !== speechVersion) return;
    stopSpeech();
    announce(`The voice took too long to respond. Try again, or read: ${text}`);
  }, 20000);
  try { window.speechSynthesis.speak(utterance); }
  catch {
    clearTimeout(speechTimer);
    announce(`The voice couldn’t start. Try again, or read: ${text}`);
  }
};
const stopListening = () => {
  clearTimeout(recognitionTimer);
  if (recognition) {
    const active = recognition;
    recognition = null;
    active.abort();
  }
  const button = $('#mic-button');
  if (button) {
    button.classList.remove('mic-listening');
    button.setAttribute('aria-pressed', 'false');
    button.innerHTML = `${icon('mic')} Try the microphone`;
    const status = $('#mic-status');
    if (status && /Listening|Waiting/.test(status.textContent)) status.textContent = 'Microphone stopped. You can try again or type your answer.';
  }
};
const showPage = (page, focus = true) => {
  stopListening();
  stopSpeech();
  pageVersion++;
  currentPage = page;
  $$('.page').forEach((element) => { element.hidden = element.id !== `${page}-page`; });
  $$('.nav-item').forEach((element) => {
    const active = element.dataset.page === page || (['lesson', 'result'].includes(page) && element.dataset.page === 'learn');
    element.classList.toggle('active', active);
    if (active) element.setAttribute('aria-current', 'page');
    else element.removeAttribute('aria-current');
  });
  $('#page-label').textContent = ({ learn: 'Let’s learn', practice: 'Practice playground', notes: 'My cheat sheet', progress: 'My little wins', lesson: 'A little practice', result: 'A little celebration' })[page];
  announce('');
  if (page === 'progress') renderProgress();
  if (focus) {
    $(`#${page}-page h1`)?.focus();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
};
const activityHTML = (activity) => `<button class="activity-card" data-start="${activity.mode}"><span class="activity-icon tone-${activity.tone}">${icon(activity.icon)}</span><h3>${activity.title}</h3><p>${activity.description}</p><span class="activity-tag">${activity.tag}</span>${icon('arrow', 'card-arrow')}</button>`;
$('#home-activities').innerHTML = activities.slice(0, 3).map(activityHTML).join('');
$('#all-activities').innerHTML = activities.map(activityHTML).join('');
$('#pronoun-reference').innerHTML = pronouns.map((item) => `<div class="pronoun-row"><div><strong lang="es">${item.subject}</strong><small>${item.english}</small></div><span class="verb-label" lang="es">${item.verb}</span><button class="icon-button" data-say="${item.phrase}" aria-label="Listen: ${item.phrase}">${icon('sound')}</button></div>`).join('');
$('#uses-reference').innerHTML = uses.map((item) => `<div class="use-row"><strong>${item.label}</strong><p><span lang="es">${item.sentence}</span><br>${item.translation}</p></div>`).join('');

const makeChoice = (answer, pool) => shuffle([answer, ...shuffle([...new Set(pool)].filter((value) => value !== answer)).slice(0, 3)]);
const createQuestion = (mode, index) => {
  const person = session.people[index % session.people.length];
  const sentence = session.sentences[index % session.sentences.length];
  const usage = session.uses[index % session.uses.length];
  if (mode === 'match') {
    const pairs = shuffle([
      { left: 'yo', right: 'soy' }, { left: 'tú', right: 'eres' }, { left: 'ella / él / usted', right: 'es' },
      { left: 'nosotros / nosotras', right: 'somos' }, { left: 'vosotros / vosotras', right: 'sois' }, { left: 'ellos / ellas / ustedes', right: 'son' }
    ]).slice(0, 4);
    return { mode, title: 'Better together.', instruction: 'Tap a pronoun group, then its form of ser. Find all four pairs.', pairs, answer: '', say: pairs.map((pair) => `${pair.left.split(' / ')[0]} ${pair.right}`).join('. '), hint: 'Yo soy. Tú eres. Él, ella, usted es. Nosotros somos. Vosotros sois. Ellos, ellas, ustedes son.' };
  }
  if (mode === 'flash') return { mode, title: 'A little memory magic.', instruction: 'Think of the Spanish, then tap the card to check.', person, answer: person.phrase, say: person.phrase, hint: `${person.subject} takes the verb ${person.verb}.` };
  if (mode === 'build') return { mode, title: 'Let’s put it together.', instruction: 'Tap the words in order. Tap a word in your sentence to put it back.', sentence, answer: sentence.words.join(' '), say: sentence.words.join(' '), hint: sentence.hint };
  if (mode === 'listen') return { mode, title: 'What did you hear?', instruction: 'Play the Spanish phrase, then choose its English meaning.', person, answer: person.translation, options: makeChoice(person.translation, pronouns.map((item) => item.translation)), say: person.phrase, hint: `The first word is ${person.subject}. It means ${person.english}.` };
  if (mode === 'type') return { mode, title: 'One little word is missing.', instruction: 'Type the correct present-tense form of ser.', person, answer: person.verb, say: person.phrase, hint: `Think of “${person.translation}”: ${person.phrase}.` };
  if (mode === 'speak') return { mode, title: 'Your voice. Your Spanish.', instruction: 'Say the Spanish phrase, or type it below. Both ways count!', person, answer: person.phrase, say: person.phrase, hint: `Say “${person.phrase}.” You can listen first, then give it a try.` };
  const kind = index % 3;
  if (kind === 1) return { mode: 'choice', title: 'Who’s who?', instruction: 'Choose the Spanish subject pronoun.', prompt: person.english, answer: person.subject, options: makeChoice(person.subject, pronouns.map((item) => item.subject)), say: person.subject, hint: `${person.subject} means ${person.english}.`, englishPrompt: true };
  if (kind === 2) return { mode: 'choice', title: 'Why do we use ser here?', instruction: 'Find the reason for using ser in this sentence.', prompt: usage.sentence, translation: usage.translation, answer: usage.label, options: makeChoice(usage.label, uses.map((item) => item.label)), say: usage.sentence, hint: usage.hint, englishOptions: true };
  return { mode: 'choice', title: 'Pick the perfect little word.', instruction: 'Which form of ser belongs in the gap?', prompt: `${person.subject} _____`, answer: person.verb, options: makeChoice(person.verb, verbs), say: person.phrase, hint: `${person.subject} means ${person.english}. The phrase is ${person.phrase}.` };
};
const startSession = (mode) => {
  const mix = ['choice', 'match', 'listen', 'build', 'type', 'choice', 'speak', 'flash', 'build', 'choice'];
  session = { mode, index: 0, xp: 0, correct: 0, combo: 0, mistakes: [], questions: [], answered: false, selection: null, people: shuffle(pronouns), sentences: shuffle(sentences), uses: shuffle(uses) };
  session.questions = Array.from({ length: 10 }, (_, index) => createQuestion(mode === 'mix' ? mix[index] : mode, index));
  showPage('lesson', false);
  renderQuestion();
};
const question = () => session.questions[session.index];
const promptHTML = (text, speech, subtitle = '', english = false) => `<div class="prompt-card"><div class="prompt-text"${english ? '' : ' lang="es"'}>${escapeHTML(text)}${subtitle ? `<small lang="en">${escapeHTML(subtitle)}</small>` : ''}</div><button class="icon-button" data-say="${escapeHTML(speech)}" ${english ? 'data-language="en-US"' : ''} aria-label="Listen to the question">${icon('sound')}</button></div>`;
const renderQuestion = () => {
  stopListening();
  stopSpeech();
  pageVersion++;
  const q = question();
  session.answered = false;
  session.selection = null;
  session.usedHint = false;
  $('#lesson-title').textContent = q.title;
  $('#lesson-instruction').textContent = q.instruction;
  $('#lesson-count').textContent = `${session.index + 1} / 10`;
  $('#lesson-progress').value = session.index;
  $('#lesson-xp').textContent = `${session.xp} XP`;
  $('#combo').textContent = session.combo >= 2 ? `✦ ${session.combo} in a row!` : '';
  $('#exercise-kind').textContent = activities.find((activity) => activity.mode === q.mode)?.tag || 'A LITTLE CHALLENGE';
  $('#answer-feedback').hidden = true;
  $('#answer-feedback').className = 'answer-feedback';
  $('#hint-button').hidden = q.mode === 'flash';
  $('#hint-button').disabled = false;
  $('#check-answer').hidden = q.mode === 'flash';
  $('#check-answer').disabled = true;
  $('#check-answer').innerHTML = `Check answer ${icon('check')}`;
  if (q.mode === 'match') {
    session.matches = new Set();
    session.matchSelection = null;
    session.matchErrors = 0;
    $('#exercise').innerHTML = `<div class="match-grid"><div class="match-column" aria-label="Pronouns">${q.pairs.map((pair, index) => `<button class="match-button" data-pair="${index}" data-side="left" lang="es" aria-pressed="false">${pair.left}</button>`).join('')}</div><div class="match-column" aria-label="Forms of ser">${shuffle(q.pairs.map((pair, index) => ({ ...pair, index }))).map((pair) => `<button class="match-button" data-pair="${pair.index}" data-side="right" lang="es" aria-pressed="false">${pair.right}</button>`).join('')}</div></div>`;
  } else if (q.mode === 'flash') {
    $('#exercise').innerHTML = `<button id="flashcard" class="flashcard" aria-label="Reveal Spanish for ${escapeHTML(q.person.translation)}"><span>HOW DO YOU SAY…</span><strong>${q.person.translation}</strong><span>Tap to flip ${icon('card')}</span></button><div class="self-grade" id="flash-controls" hidden><button class="button button-soft" data-grade="again">Still learning</button><button class="button button-green" data-grade="known">Got it! ${icon('check')}</button></div>`;
  } else if (q.mode === 'build') {
    session.tiles = [];
    session.bank = shuffle(q.sentence.words.map((word, id) => ({ word, id })));
    $('#exercise').innerHTML = `${promptHTML(q.sentence.english, q.sentence.english, '', true)}<div class="sentence-tray" id="sentence-tray" role="group" aria-label="Your sentence"><span class="tray-placeholder">Your Spanish sentence goes here…</span></div><div class="word-bank" aria-label="Available words">${session.bank.map((item) => `<button class="word-tile" data-tile="${item.id}" lang="es">${item.word}</button>`).join('')}</div>`;
  } else if (['type', 'speak'].includes(q.mode)) {
    $('#exercise').innerHTML = `${q.mode === 'type' ? promptHTML(`${q.person.subject} _____`, q.person.subject) : `${promptHTML(q.person.translation, q.person.translation, '', true)}<div class="mic-controls"><button class="button button-soft" id="mic-button" aria-pressed="false">${icon('mic')} Try the microphone</button><p id="mic-status" class="mic-status" role="status">Spanish voice input is optional.</p></div>`}<label class="answer-label" for="typed-answer">${q.mode === 'type' ? 'The missing form of ser' : 'Your Spanish answer'}</label><input id="typed-answer" class="answer-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" lang="es" aria-describedby="input-help answer-feedback"><p id="input-help" class="input-help">${q.mode === 'type' ? 'Just one word: soy, eres, es, somos, sois, or son.' : 'Say or type the complete phrase. You can edit before checking.'} Accents are welcome, but not required.</p>`;
    if (q.mode === 'speak' && !(window.SpeechRecognition || window.webkitSpeechRecognition)) $('#mic-status').textContent = 'Voice input isn’t supported here. Type your answer, or try Chrome or Safari.';
  } else {
    $('#exercise').innerHTML = `${q.mode === 'listen' ? `<div class="listen-prompt"><button class="listen-button" data-say="${q.say}" aria-label="Play the Spanish phrase">${icon('sound')}</button><p>A little listening goes a long way.</p><button class="text-button" id="reveal-transcript">Audio not working? Show the Spanish</button><p id="listen-transcript" lang="es" hidden>${q.say}</p></div>` : promptHTML(q.prompt, q.prompt, q.translation, q.englishPrompt)}<div class="choices" role="group" aria-label="Answer choices">${q.options.map((option, index) => `<button class="choice" data-choice="${escapeHTML(option)}" aria-pressed="false"${q.mode === 'listen' || q.englishOptions ? '' : ' lang="es"'}><span class="choice-number" aria-hidden="true">${index + 1}</span>${escapeHTML(option)}</button>`).join('')}</div>`;
  }
  $('#lesson-title').focus();
};
const showFeedback = (heading, text, kind = '') => {
  const feedback = $('#answer-feedback');
  feedback.className = `answer-feedback ${kind}`;
  feedback.innerHTML = `<strong>${escapeHTML(heading)}</strong><p>${escapeHTML(text)}</p>`;
  feedback.hidden = false;
};
const completeQuestion = (correct) => {
  if (session.answered) return;
  stopListening();
  const q = question();
  session.answered = true;
  saved.attempted++;
  if (correct) {
    session.correct++;
    saved.correct++;
    session.combo++;
    addXP(session.usedHint ? 5 : 10);
    chime();
    showFeedback(['That’s a little win!', '¡Muy bien! You’ve got it.', 'Look at you go!'][session.index % 3], q.mode === 'match' ? 'Every pair found its person. Nice work!' : `${q.say}${q.person ? ` — ${q.person.translation}` : ''}`, 'success');
  } else {
    session.combo = 0;
    session.mistakes.push(q);
    addXP(2);
    chime(false);
    showFeedback('Not yet. And that’s okay.', `Let’s keep this one: ${q.answer || q.hint}. You earned 2 XP for giving it a go.`, 'retry');
  }
  persist();
  $('#lesson-xp').textContent = `${session.xp} XP`;
  $('#lesson-progress').value = session.index + 1;
  $('#hint-button').hidden = true;
  $('#check-answer').hidden = false;
  $('#check-answer').disabled = false;
  $('#check-answer').innerHTML = `${session.index === 9 ? 'See my little wins' : 'Keep going'} ${icon('arrow')}`;
  $$('#exercise button').forEach((button) => {
    if (!button.dataset.say) button.disabled = true;
  });
  const input = $('#typed-answer');
  if (input) {
    input.readOnly = true;
    if (!correct) input.setAttribute('aria-invalid', 'true');
  }
  $$('.choice').forEach((button) => {
    if (button.dataset.choice === q.answer) button.classList.add('correct');
    else if (button.dataset.choice === session.selection) button.classList.add('wrong');
  });
  $('#answer-feedback').insertAdjacentHTML('beforeend', `<button class="text-button feedback-speak" data-say="${escapeHTML(q.say)}">${icon('sound')} Hear the Spanish</button>`);
  if (saved.autoSpeak) speak(q.say);
  $('#check-answer').focus();
};
const checkAnswer = () => {
  if (!session || currentPage !== 'lesson') return;
  if (session.answered) {
    session.index++;
    if (session.index === session.questions.length) finishSession();
    else renderQuestion();
    return;
  }
  const q = question();
  let correct = false;
  if (q.mode === 'match') correct = session.matches.size === q.pairs.length && session.matchErrors === 0;
  else if (q.mode === 'build') correct = normalize(session.tiles.map((id) => q.sentence.words[id]).join(' ')) === normalize(q.answer);
  else if (['type', 'speak'].includes(q.mode)) correct = normalize($('#typed-answer').value) === normalize(q.answer);
  else correct = session.selection === q.answer;
  completeQuestion(correct);
};
const handleMatch = (button) => {
  const id = Number(button.dataset.pair);
  const side = button.dataset.side;
  if (session.matches.has(id)) return;
  $$('.match-button').forEach((item) => item.classList.remove('mismatch'));
  const previous = session.matchSelection;
  if (previous?.id === id && previous.side === side) {
    button.classList.remove('selected');
    button.setAttribute('aria-pressed', 'false');
    session.matchSelection = null;
    return;
  }
  if (!previous || previous.side === side) {
    $$('.match-button').forEach((item) => { item.classList.remove('selected'); item.setAttribute('aria-pressed', 'false'); });
    session.matchSelection = { id, side, button };
    button.classList.add('selected');
    button.setAttribute('aria-pressed', 'true');
    return;
  }
  previous.button.classList.remove('selected');
  previous.button.setAttribute('aria-pressed', 'false');
  session.matchSelection = null;
  if (previous.id === id) {
    session.matches.add(id);
    [button, previous.button].forEach((item) => { item.classList.add('matched'); item.disabled = true; });
    chime();
    if (session.matches.size === question().pairs.length) {
      // Matching is a recovery activity: completing all pairs counts, even after retries.
      completeQuestion(true);
    } else {
      showFeedback('A perfect pair!', `${session.matches.size} of 4 pairs found.`, 'success');
      $('.match-button:not(:disabled)')?.focus();
    }
  } else {
    session.matchErrors++;
    session.usedHint = true;
    [button, previous.button].forEach((item) => item.classList.add('mismatch'));
    showFeedback('These two aren’t a pair yet.', 'Pick another pronoun and verb. Your matched pairs are safe.', 'retry');
    chime(false);
  }
};
const renderTray = () => {
  const q = question();
  $('#sentence-tray').innerHTML = session.tiles.length ? session.tiles.map((id) => `<button class="word-tile" data-remove="${id}" lang="es" aria-label="Remove ${q.sentence.words[id]}">${q.sentence.words[id]}</button>`).join('') : '<span class="tray-placeholder">Your Spanish sentence goes here…</span>';
  $$('[data-tile]').forEach((button) => { button.disabled = session.tiles.includes(Number(button.dataset.tile)); });
  $('#check-answer').disabled = session.tiles.length === 0;
};
const startListening = () => {
  if (recognition) {
    stopListening();
    $('#mic-status').textContent = 'Microphone stopped. You can edit or type your answer.';
    return;
  }
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const status = $('#mic-status');
  if (!Recognition) { status.textContent = 'Voice input isn’t supported here. Type below, or try Chrome or Safari.'; return; }
  if (!window.isSecureContext) { status.textContent = 'The microphone needs HTTPS. Type below for now; speaking will work on a supported browser over HTTPS.'; return; }
  stopSpeech();
  const token = pageVersion;
  let receivedResult = false;
  const active = new Recognition();
  recognition = active;
  active.lang = 'es-ES';
  active.interimResults = false;
  active.continuous = false;
  status.textContent = 'Waiting for the microphone… Allow access if your browser asks.';
  $('#mic-button').classList.add('mic-listening');
  $('#mic-button').setAttribute('aria-pressed', 'true');
  $('#mic-button').innerHTML = `${icon('mic')} Stop listening`;
  active.onstart = () => {
    if (token === pageVersion && recognition === active) status.textContent = 'Listening… Say your Spanish phrase.';
  };
  active.onresult = (event) => {
    if (token !== pageVersion || recognition !== active || session.answered) return;
    const transcript = event.results[0]?.[0]?.transcript;
    if (!transcript) return;
    receivedResult = true;
    $('#typed-answer').value = transcript;
    $('#check-answer').disabled = !transcript.trim();
    status.textContent = `Heard: “${transcript}”. Edit it if needed, then check your answer.`;
  };
  active.onerror = (event) => {
    if (token !== pageVersion || recognition !== active) return;
    receivedResult = true;
    const messages = {
      'not-allowed': 'Microphone permission was denied. Allow it in your browser’s site settings and try again, or type below.',
      'service-not-allowed': 'Your browser’s speech service isn’t allowed. Type your answer below.',
      'audio-capture': 'No microphone was found. Connect one and retry, or type below.',
      network: 'Voice recognition couldn’t connect. Check your connection and retry, or type below.',
      'no-speech': 'No speech was picked up. Try the microphone again, or type below.',
      'language-not-supported': 'This browser can’t recognize Spanish. Type your answer below.',
      aborted: 'Listening stopped. You can try again or type below.'
    };
    status.textContent = messages[event.error] || 'Voice input didn’t work this time. Try again or type below.';
  };
  active.onend = () => {
    if (token !== pageVersion || recognition !== active) return;
    recognition = null;
    clearTimeout(recognitionTimer);
    $('#mic-button').classList.remove('mic-listening');
    $('#mic-button').setAttribute('aria-pressed', 'false');
    $('#mic-button').innerHTML = `${icon('mic')} Try the microphone`;
    if (!receivedResult) status.textContent = 'No answer was captured. Try speaking again, or type below.';
  };
  recognitionTimer = setTimeout(() => {
    if (token !== pageVersion || recognition !== active) return;
    stopListening();
    status.textContent = 'Listening timed out. Your typed answer is safe. Try again or type below.';
  }, 15000);
  try { active.start(); }
  catch { stopListening(); status.textContent = 'The microphone couldn’t start. Try again, or type your answer below.'; }
};
const finishSession = () => {
  saved.sessions++;
  persist();
  const review = [...new Map(session.mistakes.map((q) => [q.say, q])).values()];
  $('#result-page').innerHTML = `<div class="result-card"><div class="result-art" aria-hidden="true">${icon('cup')}</div><p class="eyebrow">ONE SESSION. SO MANY LITTLE WINS.</p><h1 id="result-title" tabindex="-1">${session.correct >= 8 ? 'You’ve got a little more hola.' : 'That’s what growing looks like.'}</h1><p>${session.correct >= 8 ? 'New words, new connections, and a reason to feel proud.' : 'Every try helped your brain make a new connection. Keep those little steps going.'}</p><div class="result-stats"><div class="result-stat"><strong>+${session.xp}</strong><span>XP EARNED</span></div><div class="result-stat"><strong>${session.correct}/10</strong><span>${session.mode === 'flash' ? 'CARDS REMEMBERED' : 'CHALLENGES SOLVED'}</span></div><div class="result-stat"><strong>${saved.streak}</strong><span>DAY${saved.streak === 1 ? '' : 'S'} GROWING</span></div></div>${review.length ? `<div class="review-list"><h2>A few friends to meet again</h2>${review.map((q) => `<p><span lang="es">${escapeHTML(q.say)}</span> <button class="icon-button" data-say="${escapeHTML(q.say)}" aria-label="Listen: ${escapeHTML(q.say)}">${icon('sound')}</button></p>`).join('')}</div>` : ''}<div class="result-actions"><button class="button button-purple" data-start="${session.mode}">Another little adventure ${icon('arrow')}</button><button class="button button-soft" data-page="learn">Back to my space</button></div></div>`;
  showPage('result');
  chime();
};
const renderProgress = () => {
  $('#progress-content').innerHTML = `<div class="progress-cards"><section class="win-card"><h2>Little bits of effort</h2><strong>${saved.xp} XP</strong><p>Every correct answer earns 10 XP, or 5 with a hint. Every try earns 2.</p></section><section class="win-card"><h2>Adventures finished</h2><strong>${saved.sessions}</strong><p>Ten little challenges in every complete session.</p></section><section class="win-card"><h2>Connections made</h2><strong>${saved.attempted ? Math.round(saved.correct / saved.attempted * 100) : 0}%</strong><p>${saved.correct} of ${saved.attempted} challenges solved, including self-rated flashcards.</p></section></div><section class="progress-message"><h2>${saved.attempted ? 'Your brain is doing a pretty cool thing.' : 'Your first little win is waiting.'}</h2><p>${saved.attempted ? 'Keep coming back, explore a new activity, and let those connections grow.' : 'No scores to beat. No hearts to lose. Just you, a few words, and a fresh start.'}</p><button class="button button-purple" data-start="mix">${saved.attempted ? 'Keep growing' : 'Plant the first seed'} ${icon('arrow')}</button>${saved.attempted ? `<div class="badge-list"><span class="badge">🌱 First little step</span>${saved.sessions ? '<span class="badge">✦ Adventure complete</span>' : ''}${saved.xp >= 100 ? '<span class="badge">⚡ 100 XP explorer</span>' : ''}${saved.streak >= 3 ? '<span class="badge">☀ Three-day grower</span>' : ''}</div>` : ''}</section><p class="input-help">Progress is saved on this browser and device, not synced between devices.</p>`;
};

document.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  if (button.dataset.page) { showPage(button.dataset.page); return; }
  if (button.dataset.start) { startSession(button.dataset.start); return; }
  if (button.dataset.say) { speak(button.dataset.say, button.dataset.language || 'es-ES'); return; }
  if (currentPage !== 'lesson' || !session || session.answered) return;
  if (button.hasAttribute('data-choice')) {
    session.selection = button.dataset.choice;
    $$('.choice').forEach((item) => { item.classList.toggle('selected', item === button); item.setAttribute('aria-pressed', String(item === button)); });
    $('#check-answer').disabled = false;
  } else if (button.hasAttribute('data-pair')) handleMatch(button);
  else if (button.id === 'flashcard') {
    button.classList.add('flipped');
    button.setAttribute('aria-label', `${question().answer}. ${question().person.translation}.`);
    button.innerHTML = `<span lang="es">¡ASÍ SE DICE!</span><strong lang="es">${question().answer}</strong><span>${question().person.translation}</span>`;
    $('#flash-controls').hidden = false;
    session.flipped = true;
    if (saved.autoSpeak) speak(question().say);
    $('#flash-controls button').focus();
  } else if (button.dataset.grade) {
    $('#flash-controls').hidden = true;
    completeQuestion(button.dataset.grade === 'known');
  } else if (button.hasAttribute('data-tile')) {
    const id = Number(button.dataset.tile);
    session.tiles.push(id);
    renderTray();
    $$('.word-bank .word-tile:not(:disabled)')[0]?.focus();
    if (session.tiles.length === question().sentence.words.length) $('#check-answer').focus();
  } else if (button.hasAttribute('data-remove')) {
    const id = Number(button.dataset.remove);
    session.tiles = session.tiles.filter((item) => item !== id);
    renderTray();
    $(`[data-tile="${id}"]`).focus();
  } else if (button.id === 'mic-button') startListening();
  else if (button.id === 'reveal-transcript') {
    $('#listen-transcript').hidden = false;
    button.textContent = 'Spanish phrase shown below';
    session.usedHint = true;
  }
});
$('#check-answer').addEventListener('click', checkAnswer);
$('#exit-lesson').addEventListener('click', () => { showPage('learn'); session = null; });
$('#hint-button').addEventListener('click', () => {
  if (!session || session.answered) return;
  session.usedHint = true;
  showFeedback('A little nudge', question().hint);
});
$('#exercise').addEventListener('input', (event) => {
  if (event.target.id === 'typed-answer') {
    event.target.removeAttribute('aria-invalid');
    $('#check-answer').disabled = !event.target.value.trim();
  }
});
document.addEventListener('keydown', (event) => {
  if ($('#settings-dialog').open || currentPage !== 'lesson' || !session) return;
  if (event.key === 'Enter' && event.target.id === 'typed-answer' && !$('#check-answer').disabled) { event.preventDefault(); checkAnswer(); }
  if (/^[1-4]$/.test(event.key) && !['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target.tagName) && !session.answered) {
    const choice = $$('.choice')[Number(event.key) - 1];
    if (choice) { event.preventDefault(); choice.click(); choice.focus(); }
  }
});
const syncSettings = () => {
  $('#sound-toggle').setAttribute('aria-pressed', String(saved.effects));
  $('#effects-setting').checked = saved.effects;
  $('#auto-speak').checked = saved.autoSpeak;
  $('#speech-rate').value = saved.rate;
};
$('#sound-toggle').addEventListener('click', () => { saved.effects = !saved.effects; syncSettings(); persist(); if (saved.effects) chime(); });
$('#settings-open').addEventListener('click', () => { stopListening(); stopSpeech(); $('#settings-dialog').showModal(); });
$('#settings-close').addEventListener('click', () => { $('#settings-dialog').close(); });
$('#settings-dialog').addEventListener('close', () => { stopSpeech(); $('#settings-open').focus(); });
$('#effects-setting').addEventListener('change', (event) => { saved.effects = event.target.checked; syncSettings(); persist(); });
$('#auto-speak').addEventListener('change', (event) => { saved.autoSpeak = event.target.checked; if (!saved.autoSpeak) stopSpeech(); persist(); });
$('#speech-rate').addEventListener('change', (event) => { saved.rate = Number(event.target.value); persist(); });
$('#test-voice').addEventListener('click', () => { speak('¡Hola! Yo soy estudiante. Tú eres increíble.'); $('#settings-status').textContent = 'Playing a little Spanish. Voice availability depends on your browser and installed voices.'; });
document.addEventListener('visibilitychange', () => { if (document.hidden) { stopListening(); stopSpeech(); } });
window.addEventListener('pagehide', () => { stopListening(); stopSpeech(); });
window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY) announce('Progress changed in another tab. Finish here, then reload to use the other tab’s progress.');
});

const runtimeTimers = new Map();
const applyRuntimeState = (detail) => {
  if (!detail?.id) return;
  const supported = {
    'microphone-permission-denied': ['Microphone access is off', 'Allow microphone access in browser settings, or type your answer.'],
    'speech-network-failure': ['Voice input couldn’t connect', 'Your typed answer is safe. Check your connection, then try the microphone again.'],
    'speech-timeout': ['The voice took a little too long', 'Try again, or keep practicing by typing.'],
    'progress-save-failure': ['Your progress couldn’t be saved', 'You can keep playing. Keep this tab open and check that browser storage is enabled.']
  };
  if (!supported[detail.id]) return;
  clearTimeout(runtimeTimers.get(detail.id));
  const panel = $('#runtime-state');
  if (detail.phase === 'inactive') {
    if (panel.dataset.state === detail.id) { panel.hidden = true; panel.innerHTML = ''; }
    return;
  }
  panel.hidden = false;
  panel.dataset.state = detail.id;
  if (detail.phase === 'pending') {
    panel.innerHTML = '<strong>One little moment…</strong><p>Getting things ready. Your answer is safe.</p>';
    if (detail.timingMode === 'prototype') runtimeTimers.set(detail.id, setTimeout(() => applyRuntimeState({ ...detail, phase: 'active' }), Math.max(0, Number(detail.delayMs) || 0)));
    return;
  }
  const [title, message] = supported[detail.id];
  panel.innerHTML = `<strong>${title}</strong><p>${message}</p><button class="button button-soft" id="runtime-recover">Keep practicing</button>`;
  $('#runtime-recover').addEventListener('click', () => { panel.hidden = true; $('#typed-answer')?.focus(); });
};
window.addEventListener('vibe:error-state', (event) => applyRuntimeState(event.detail));
const runtime = window.__vibeErrorStateRuntime;
if (runtime) {
  const asArray = (states) => !states ? [] : Array.isArray(states) ? states : typeof states.id === 'string' ? [states] : Object.values(states);
  asArray(runtime.getPending?.()).forEach((state) => applyRuntimeState({ ...state, phase: 'pending' }));
  asArray(runtime.getActive?.()).forEach((state) => applyRuntimeState({ ...state, phase: 'active' }));
}
syncSettings();
refreshStats();
if (!storageAvailable) announce('Saved progress isn’t available in this browser. You can still enjoy every activity in this tab.');
