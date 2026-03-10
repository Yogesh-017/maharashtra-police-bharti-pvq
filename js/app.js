// ============================================================
// Maharashtra Police Bharti PVQ Platform — App Module
// ============================================================

const App = (() => {
  // --- State ---
  let state = {
    user: null,
    examType: null,
    district: null,
    year: null,
    selectedSections: [],
    timerMode: 'auto', // 'auto' | 'custom' | 'none'
    customTimers: {},
    quiz: {
      currentSection: null,
      currentQuestion: 0,
      answers: {},
      flagged: new Set(),
      timeRemaining: 0,
      timerInterval: null,
      sectionTimers: {}
    }
  };

  // --- Helpers ---
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function showScreen(id) {
    $$('.screen').forEach(s => s.classList.remove('active'));
    const screen = $(`#${id}`);
    if (screen) screen.classList.add('active');
    // Show/hide nav
    const nav = $('.top-nav');
    if (nav) nav.style.display = ['landing-screen', 'auth-screen'].includes(id) ? 'none' : 'flex';
    // Update body padding for nav
    document.body.style.paddingTop = ['landing-screen', 'auth-screen'].includes(id) ? '0' : '56px';
  }

  function toast(msg, type = 'info') {
    const container = $('.toast-container');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    container.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
  }

  function saveToStorage(key, data) { localStorage.setItem(`pvq_${key}`, JSON.stringify(data)); }
  function loadFromStorage(key) { try { return JSON.parse(localStorage.getItem(`pvq_${key}`)); } catch { return null; } }

  // --- Landing Screen ---
  function initLanding() {
    const landing = $('#landing-screen');
    landing.addEventListener('click', () => {
      // Let Firebase auth state handle navigation
      if (state.user) {
        showScreen('examtype-screen');
        updateNav();
      } else {
        showScreen('auth-screen');
      }
    });

    // Listen for Firebase Auth State Changes (auto-login returning users)
    auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        state.user = {
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          email: firebaseUser.email,
          uid: firebaseUser.uid
        };
        saveToStorage('user', state.user);
        updateNav();

        // Show admin button for admin user
        const adminBtn = $('#nav-admin');
        if (adminBtn) {
          adminBtn.style.display = firebaseUser.email === 'admin@pvqplatform.com' ? 'inline-flex' : 'none';
        }

        // If still on landing or auth screen, navigate forward
        if (landing.classList.contains('active') || $('#auth-screen').classList.contains('active')) {
          showScreen('examtype-screen');
          renderHistory();
        }
      }
    });

    // Auto transition after 4 seconds
    setTimeout(() => {
      if (landing.classList.contains('active')) {
        if (state.user) {
          showScreen('examtype-screen');
          updateNav();
        } else {
          showScreen('auth-screen');
        }
      }
    }, 4000);
  }

  // --- Auth ---
  function initAuth() {
    const form = $('#auth-form');
    const toggleLink = $('#auth-toggle-link');
    let isSignUp = false;

    toggleLink.addEventListener('click', (e) => {
      e.preventDefault();
      isSignUp = !isSignUp;
      $('#auth-title').textContent = isSignUp ? 'नवीन खाते तयार करा' : 'साइन इन करा';
      $('#auth-subtitle').textContent = isSignUp ? 'Create your account' : 'Welcome back, officer!';
      $('#auth-name-group').style.display = isSignUp ? 'block' : 'none';
      $('#auth-submit').textContent = isSignUp ? 'Sign Up' : 'Sign In';
      toggleLink.textContent = isSignUp ? 'Sign In' : 'Sign Up';
      $('#auth-toggle-text').textContent = isSignUp ? 'Already have an account? ' : "Don't have an account? ";
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = $('#auth-name')?.value || '';
      const email = $('#auth-email').value;
      const password = $('#auth-password').value;

      if (!email || !password) { toast('Please fill all fields', 'error'); return; }
      if (isSignUp && !name) { toast('Please enter your name', 'error'); return; }

      try {
        if (isSignUp) {
          // Firebase Sign Up
          const cred = await auth.createUserWithEmailAndPassword(email, password);
          await cred.user.updateProfile({ displayName: name });

          // Save user profile to Firestore
          await db.collection('users').doc(cred.user.uid).set({
            name: name,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });

          state.user = { name, email, uid: cred.user.uid };
          saveToStorage('user', state.user);
          updateNav();
          showScreen('examtype-screen');
          renderHistory();
          toast(`स्वागत आहे, ${name}! खाते तयार झाले 🙏`, 'success');
        } else {
          // Firebase Sign In
          const cred = await auth.signInWithEmailAndPassword(email, password);
          const userName = cred.user.displayName || email.split('@')[0];
          state.user = { name: userName, email, uid: cred.user.uid };
          saveToStorage('user', state.user);
          updateNav();
          showScreen('examtype-screen');
          renderHistory();
          toast(`स्वागत आहे, ${userName}! 🙏`, 'success');

          // Show admin button only for admin user
          const adminBtn = $('#nav-admin');
          if (adminBtn) {
            adminBtn.style.display = email === 'admin@pvqplatform.com' ? 'inline-flex' : 'none';
          }
        }
      } catch (err) {
        // Firebase error messages
        let msg = 'Authentication failed';
        if (err.code === 'auth/email-already-in-use') msg = 'हा ईमेल आधीच वापरला आहे (Email already exists)';
        else if (err.code === 'auth/wrong-password') msg = 'चुकीचा पासवर्ड (Wrong password)';
        else if (err.code === 'auth/user-not-found') msg = 'खाते सापडले नाही (Account not found)';
        else if (err.code === 'auth/weak-password') msg = 'पासवर्ड कमीत कमी 6 अक्षरे असावा (Min 6 characters)';
        else if (err.code === 'auth/invalid-email') msg = 'अवैध ईमेल (Invalid email)';
        else if (err.code === 'auth/invalid-credential') msg = 'चुकीचा ईमेल किंवा पासवर्ड (Invalid email or password)';
        toast(msg, 'error');
      }
    });

    // Google Sign-In
    $('#google-signin-btn')?.addEventListener('click', async () => {
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        const user = result.user;

        // Save user profile to Firestore (merge to not overwrite existing data)
        await db.collection('users').doc(user.uid).set({
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL || '',
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        state.user = { name: user.displayName, email: user.email, uid: user.uid };
        saveToStorage('user', state.user);
        updateNav();
        showScreen('examtype-screen');
        renderHistory();
        toast(`स्वागत आहे, ${user.displayName}! 🙏`, 'success');
      } catch (err) {
        if (err.code !== 'auth/popup-closed-by-user') {
          toast('Google Sign-In failed: ' + err.message, 'error');
        }
      }
    });
  }

  function updateNav() {
    const userInfo = $('#nav-user-info');
    if (userInfo && state.user) userInfo.textContent = `👤 ${state.user.name}`;
  }

  // --- Exam Type ---
  function initExamType() {
    $$('.exam-type-card').forEach(card => {
      card.addEventListener('click', () => {
        state.examType = card.dataset.type;
        const examInfo = EXAM_TYPES.find(e => e.id === state.examType);
        if (examInfo && examInfo.hasDistricts) {
          renderDistricts();
          showScreen('district-screen');
        } else {
          renderYears();
          showScreen('year-screen');
        }
      });
    });
  }

  // --- Districts ---
  function getDistrictPopularity() {
    const history = loadFromStorage('history') || [];
    const counts = {};
    history.forEach(h => { counts[h.district] = (counts[h.district] || 0) + 1; });
    return counts;
  }

  function renderDistricts(filter = 'all', search = '') {
    const grid = $('.districts-grid');
    grid.innerHTML = '';
    const popularity = getDistrictPopularity();
    const filtered = DISTRICTS.filter(d => {
      const matchDiv = filter === 'all' || d.division === filter;
      const matchSearch = !search || d.name.includes(search) || d.nameEn.toLowerCase().includes(search.toLowerCase());
      return matchDiv && matchSearch;
    });
    // Sort: most-used districts first, then alphabetical
    filtered.sort((a, b) => (popularity[b.id] || 0) - (popularity[a.id] || 0));

    filtered.forEach(d => {
      const div = DIVISIONS[d.division];
      const btn = document.createElement('button');
      btn.className = 'district-btn';
      btn.style.borderLeft = `4px solid ${div.color}`;
      btn.style.background = `${d.bgPattern}, var(--bg-card)`;
      btn.innerHTML = `
        <span class="division-dot" style="background:${div.color}"></span>
        <span class="district-emoji">${d.emoji}</span>
        <span class="district-name">${d.name}</span>
        <span class="district-name-en">${d.nameEn}</span>
        <span class="district-khasiyat">${d.khasiyat}</span>
      `;
      btn.addEventListener('click', () => {
        state.district = d.id;
        renderYears();
        showScreen('year-screen');
      });
      // Hover effect with division color
      btn.addEventListener('mouseenter', () => { btn.style.borderColor = div.color; btn.style.boxShadow = `0 8px 30px ${div.color}22`; });
      btn.addEventListener('mouseleave', () => { btn.style.borderLeftColor = div.color; btn.style.boxShadow = ''; });
      grid.appendChild(btn);
    });

    if (filtered.length === 0) {
      grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--text-secondary);padding:40px;">कोणताही जिल्हा सापडला नाही</p>';
    }
  }

  function initDistricts() {
    // Division tabs
    const tabContainer = $('.division-tabs');
    const allTab = document.createElement('button');
    allTab.className = 'division-tab active';
    allTab.textContent = 'सर्व';
    allTab.dataset.div = 'all';
    tabContainer.appendChild(allTab);

    Object.entries(DIVISIONS).forEach(([key, val]) => {
      const tab = document.createElement('button');
      tab.className = 'division-tab';
      tab.textContent = val.name;
      tab.dataset.div = key;
      tab.addEventListener('mouseenter', () => { if (!tab.classList.contains('active')) tab.style.background = val.gradient; });
      tab.addEventListener('mouseleave', () => { if (!tab.classList.contains('active')) tab.style.background = ''; });
      tabContainer.appendChild(tab);
    });

    tabContainer.addEventListener('click', (e) => {
      if (!e.target.classList.contains('division-tab')) return;
      $$('.division-tab').forEach(t => { t.classList.remove('active'); t.style.background = ''; });
      e.target.classList.add('active');
      const div = e.target.dataset.div;
      if (div !== 'all') {
        e.target.style.background = DIVISIONS[div].gradient;
      }
      renderDistricts(div, $('#district-search-input').value);
    });

    // Search
    $('#district-search-input').addEventListener('input', (e) => {
      const activeTab = $('.division-tab.active');
      renderDistricts(activeTab.dataset.div, e.target.value);
    });
  }

  // --- Year Selection ---
  function renderYears() {
    const grid = $('.years-grid');
    grid.innerHTML = '';
    const papers = loadFromStorage('papers') || {};
    const header = $('#year-screen-header');
    const districtInfo = DISTRICTS.find(d => d.id === state.district);
    if (header) {
      const backTarget = state.examType === 'srpf' ? 'examtype' : 'district';
      header.innerHTML = `<button class="back-btn" data-back="${backTarget}" onclick="document.querySelector('.back-btn[data-back=${backTarget}]')?.click()">← मागे जा</button><h2>📅 वर्ष निवडा</h2><p>${districtInfo ? districtInfo.emoji + ' ' + districtInfo.name + ' — ' : ''}${state.examType === 'srpf' ? 'SRPF' : 'पोलीस भरती'}</p>`;
      // Attach back handler to the new button
      const backBtn = header.querySelector('.back-btn');
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          if (backTarget === 'examtype') showScreen('examtype-screen');
          else { renderDistricts(); showScreen('district-screen'); }
        });
      }
    }

    AVAILABLE_YEARS.forEach(year => {
      const key = `${state.examType}_${state.district || 'srpf'}_${year}`;
      const hasPaper = !!papers[key];
      const card = document.createElement('button');
      card.className = `year-card${hasPaper ? '' : ' disabled'}`;
      card.innerHTML = `
        <div class="year-num">${year}</div>
        <div class="year-info">${hasPaper ? '✅ प्रश्नपत्रिका उपलब्ध' : '❌ उपलब्ध नाही'}</div>
      `;
      if (hasPaper) {
        card.addEventListener('click', () => {
          state.year = year;
          renderSections();
          showScreen('section-screen');
        });
      }
      grid.appendChild(card);
    });
  }

  // --- Section & Timer ---
  function renderSections() {
    const container = $('#sections-list');
    container.innerHTML = '';
    state.selectedSections = [];

    // Load the paper to check how many questions are actually available
    const papers = loadFromStorage('papers') || {};
    const key = `${state.examType}_${state.district || 'srpf'}_${state.year}`;
    const paper = papers[key];

    EXAM_CONFIG.sections.forEach(sec => {
      const qCount = paper && paper.sections && paper.sections[sec.id] ? paper.sections[sec.id].length : 0;

      const card = document.createElement('div');
      card.className = `section-card${qCount === 0 ? ' disabled' : ''}`;
      if (qCount === 0) card.style.opacity = '0.5';
      card.innerHTML = `
        <span class="sec-icon">${sec.icon}</span>
        <div class="sec-info">
          <div class="sec-name">${sec.name}</div>
          <div class="sec-desc">${qCount > 0 ? qCount : '0'} प्रश्न उपलब्ध</div>
        </div>
        <div class="sec-check">✓</div>
      `;

      if (qCount > 0) {
        card.addEventListener('click', () => {
          card.classList.toggle('selected');
          if (card.classList.contains('selected')) {
            state.selectedSections.push(sec.id);
          } else {
            state.selectedSections = state.selectedSections.filter(s => s !== sec.id);
          }
          updateCustomTimerInputs();
        });
      }
      container.appendChild(card);
    });

    // Timer options
    $$('input[name="timer-mode"]').forEach(radio => {
      radio.addEventListener('change', () => {
        state.timerMode = radio.value;
        const customInputs = $('.custom-timer-inputs');
        customInputs.classList.toggle('visible', radio.value === 'custom');
      });
    });
  }

  function updateCustomTimerInputs() {
    const container = $('#custom-timer-list');
    container.innerHTML = '';
    state.selectedSections.forEach(secId => {
      const sec = EXAM_CONFIG.sections.find(s => s.id === secId);
      const row = document.createElement('div');
      row.className = 'custom-timer-row';
      row.innerHTML = `
        <label>${sec.icon} ${sec.nameEn}</label>
        <input type="number" min="1" max="90" value="${Math.round(EXAM_CONFIG.totalTime / state.selectedSections.length)}" data-section="${secId}"> min
      `;
      container.appendChild(row);
    });
  }

  function initSections() {
    $('#start-quiz-btn').addEventListener('click', () => {
      if (state.selectedSections.length === 0) { toast('Please select at least one section', 'error'); return; }

      // Calculate timers
      const sectionTimers = {};
      if (state.timerMode === 'auto') {
        const perSection = Math.floor(EXAM_CONFIG.totalTime / state.selectedSections.length);
        state.selectedSections.forEach(s => { sectionTimers[s] = perSection * 60; });
      } else if (state.timerMode === 'custom') {
        $$('#custom-timer-list input[type="number"]').forEach(inp => {
          sectionTimers[inp.dataset.section] = parseInt(inp.value) * 60;
        });
      } else {
        state.selectedSections.forEach(s => { sectionTimers[s] = 0; }); // No timer
      }

      state.quiz = {
        currentSection: state.selectedSections[0],
        currentQuestion: 0,
        answers: {},
        flagged: new Set(),
        timeTaken: {}, // Tracks time consumed per question (in seconds)
        lastQuestionStartTime: Date.now(),
        sectionTimers,
        timeRemaining: sectionTimers[state.selectedSections[0]] || 0,
        timerInterval: null
      };

      startQuiz();
    });
  }

  // --- Quiz ---
  function startQuiz() {
    state.quiz.lastQuestionStartTime = Date.now(); // Reset time when quiz actually starts rendering
    showScreen('quiz-screen');
    renderQuestion();
    startTimer();
  }

  function getPaper() {
    const papers = loadFromStorage('papers') || {};
    const key = `${state.examType}_${state.district || 'srpf'}_${state.year}`;
    return papers[key];
  }

  function getCurrentQuestions() {
    const paper = getPaper();
    if (!paper) return [];
    return paper.sections[state.quiz.currentSection] || [];
  }

  function renderQuestion() {
    const questions = getCurrentQuestions();
    const q = questions[state.quiz.currentQuestion];
    const sec = EXAM_CONFIG.sections.find(s => s.id === state.quiz.currentSection);

    if (!q) {
      $('.quiz-content').innerHTML = `<div style="text-align:center;padding:60px;"><p style="font-size:1.2rem;color:var(--text-secondary);">या विभागात प्रश्न नाहीत</p></div>`;
      return;
    }

    const ansKey = `${state.quiz.currentSection}_${state.quiz.currentQuestion}`;
    const selectedAnswer = state.quiz.answers[ansKey];
    const letters = ['A', 'B', 'C', 'D'];

    // Quick format for time taken
    const timeTakenSecs = state.quiz.timeTaken[ansKey] || 0;
    const timeStr = timeTakenSecs > 0 ? ` <span style="color:var(--text-secondary);font-size:0.8rem;margin-left:8px;">(⌚ ${timeTakenSecs}s spent)</span>` : '';

    $('.quiz-content').innerHTML = `
      <div class="question-card">
        <div class="question-number">${sec.icon} ${sec.nameEn} — प्रश्न ${state.quiz.currentQuestion + 1} / ${questions.length}${timeStr}</div>
        <div class="question-text">${q.q}</div>
        <div class="options-list">
          ${q.options.map((opt, i) => `
            <button class="option-btn${selectedAnswer === i ? ' selected' : ''}" data-idx="${i}">
              <span class="option-letter">${letters[i]}</span>
              <span>${opt}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    // Record time when entering question
    state.quiz.lastQuestionStartTime = Date.now();

    // Option click
    $$('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.quiz.answers[ansKey] = parseInt(btn.dataset.idx);
        renderQuestion();
      });
    });

    // Update Header
    $('#quiz-subject-header').textContent = `${sec.nameEn} — ${state.quiz.currentQuestion + 1} / ${questions.length}`;

    // Update Attempt Tracker
    updateAttemptTracker();

    // Update Timeline Grid
    renderTimeline();
  }

  function renderTimeline() {
    const timeline = $('#quiz-timeline');
    if (!timeline) return;

    const questions = getCurrentQuestions();
    const secId = state.quiz.currentSection;

    timeline.innerHTML = questions.map((_, i) => {
      const key = `${secId}_${i}`;
      let classes = ['timeline-btn'];
      if (i === state.quiz.currentQuestion) classes.push('active');
      if (state.quiz.answers[key] !== undefined) classes.push('attempted');
      if (state.quiz.flagged.has(key)) classes.push('flagged');

      return `<div class="${classes.join(' ')}" data-idx="${i}">${i + 1}</div>`;
    }).join('');

    // Attach click handlers to jump to question
    $$('.timeline-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        saveQuestionTime();
        state.quiz.currentQuestion = parseInt(btn.dataset.idx);
        renderQuestion();
      });
    });

    // Auto-scroll timeline to active question
    const activeBtn = timeline.querySelector('.timeline-btn.active');
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  function updateAttemptTracker() {
    const paper = getPaper();
    if (!paper) return;
    let totalQ = 0;
    let attemptedQ = 0;

    state.selectedSections.forEach(secId => {
      const qs = paper.sections[secId] || [];
      totalQ += qs.length;
      qs.forEach((q, i) => {
        if (state.quiz.answers[`${secId}_${i}`] !== undefined) {
          attemptedQ++;
        }
      });
    });

    const tracker = $('#quiz-attempted-tracker');
    if (tracker) {
      tracker.textContent = `Attempted: ${attemptedQ} / ${totalQ}`;
    }
  }

  function startTimer() {
    if (state.timerMode === 'none') {
      $('.quiz-timer').textContent = '⏱️ Practice Mode';
      return;
    }
    state.quiz.timerInterval = setInterval(() => {
      state.quiz.timeRemaining--;
      updateTimerDisplay();
      if (state.quiz.timeRemaining <= 0) {
        clearInterval(state.quiz.timerInterval);
        toast('Time is up for this section!', 'warning');
        autoSubmitSection();
      }
    }, 1000);
    updateTimerDisplay();
  }

  function restartTimer() {
    if (state.quiz.timerInterval) clearInterval(state.quiz.timerInterval);
    startTimer();
  }

  function updateTimerDisplay() {
    const timer = $('.quiz-timer');
    const mins = Math.floor(state.quiz.timeRemaining / 60);
    const secs = state.quiz.timeRemaining % 60;
    timer.textContent = `⏱️ ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    timer.className = 'quiz-timer';
    if (state.quiz.timeRemaining <= 60) timer.classList.add('danger');
    else if (state.quiz.timeRemaining <= 300) timer.classList.add('warning');
  }

  function autoSubmitSection() {
    const idx = state.selectedSections.indexOf(state.quiz.currentSection);
    if (idx < state.selectedSections.length - 1) {
      switchSection(state.selectedSections[idx + 1]);
    } else {
      finishQuiz();
    }
  }

  function saveQuestionTime() {
    if (!state.quiz.lastQuestionStartTime) return;
    const ansKey = `${state.quiz.currentSection}_${state.quiz.currentQuestion}`;
    const now = Date.now();
    const spentSecs = Math.floor((now - state.quiz.lastQuestionStartTime) / 1000);
    state.quiz.timeTaken[ansKey] = (state.quiz.timeTaken[ansKey] || 0) + spentSecs;
    state.quiz.lastQuestionStartTime = now;
  }

  function initQuizControls() {
    $('#quiz-prev').addEventListener('click', () => {
      saveQuestionTime();
      if (state.quiz.currentQuestion > 0) {
        state.quiz.currentQuestion--;
        renderQuestion();
      } else {
        // We are at the first question of the current section.
        // If there's a previous section, go to the last question of that section.
        const currentSecIndex = state.selectedSections.indexOf(state.quiz.currentSection);
        if (currentSecIndex > 0) {
          const prevSecId = state.selectedSections[currentSecIndex - 1];
          // Pause timer logic for the current section
          if (state.timerMode !== 'none') {
            state.quiz.sectionTimers[state.quiz.currentSection] = state.quiz.timeRemaining;
          }
          state.quiz.currentSection = prevSecId;
          const questions = getCurrentQuestions();
          state.quiz.currentQuestion = questions.length > 0 ? questions.length - 1 : 0;
          state.quiz.timeRemaining = state.quiz.sectionTimers[prevSecId] || 0;
          renderQuestion();
          if (state.timerMode !== 'none') restartTimer();
        }
      }
    });
    $('#quiz-next').addEventListener('click', () => {
      saveQuestionTime();
      const questions = getCurrentQuestions();
      if (state.quiz.currentQuestion < questions.length - 1) {
        state.quiz.currentQuestion++;
        renderQuestion();
      } else {
        // We are at the last question of the current section.
        // If there is a next section, go to the first question of that section.
        const currentSecIndex = state.selectedSections.indexOf(state.quiz.currentSection);
        if (currentSecIndex < state.selectedSections.length - 1) {
          const nextSecId = state.selectedSections[currentSecIndex + 1];
          // Pause timer logic for the current section
          if (state.timerMode !== 'none') {
            state.quiz.sectionTimers[state.quiz.currentSection] = state.quiz.timeRemaining;
          }
          state.quiz.currentSection = nextSecId;
          state.quiz.currentQuestion = 0;
          state.quiz.timeRemaining = state.quiz.sectionTimers[nextSecId] || 0;
          renderQuestion();
          if (state.timerMode !== 'none') restartTimer();
        } else {
          // If it's the very last question of the whole exam, prompt submit
          if (confirm('You have reached the end of the test. Submit now? सबमिट करायचे आहे का?')) {
            finishQuiz();
          }
        }
      }
    });
    $('#quiz-flag').addEventListener('click', () => {
      const key = `${state.quiz.currentSection}_${state.quiz.currentQuestion}`;
      if (state.quiz.flagged.has(key)) state.quiz.flagged.delete(key);
      else state.quiz.flagged.add(key);
      const isFlagged = state.quiz.flagged.has(key);
      toast(isFlagged ? 'प्रश्न फ्लॅग केला (Question flagged)' : 'फ्लॅग काढला (Flag removed)', 'info');

      // Update the button icon itself on click for feedback
      const flagBtn = $('#quiz-flag');
      if (isFlagged) {
        flagBtn.style.backgroundColor = 'var(--warning)';
        flagBtn.style.color = 'white';
      } else {
        flagBtn.style.backgroundColor = '';
        flagBtn.style.color = '';
      }

      // Update timeline grid to reflect new flag status
      renderTimeline();
    });
    $('#quiz-submit').addEventListener('click', () => {
      const modal = $('#submit-confirm-modal');
      if (modal) modal.style.display = 'flex';
    });

    $('#submit-cancel-btn')?.addEventListener('click', () => {
      $('#submit-confirm-modal').style.display = 'none';
    });

    $('#submit-confirm-btn')?.addEventListener('click', () => {
      $('#submit-confirm-modal').style.display = 'none';
      saveQuestionTime();
      finishQuiz();
    });
  }

  function finishQuiz() {
    if (state.quiz.timerInterval) clearInterval(state.quiz.timerInterval);
    const paper = getPaper();
    let totalCorrect = 0;
    let totalAttempted = 0;
    const sectionResults = {};

    state.selectedSections.forEach(secId => {
      const questions = paper.sections[secId] || [];
      let correct = 0;
      let attempted = 0;
      questions.forEach((q, i) => {
        const ansKey = `${secId}_${i}`;
        if (state.quiz.answers[ansKey] !== undefined) {
          attempted++;
          if (state.quiz.answers[ansKey] === q.answer) correct++;
        }
      });
      sectionResults[secId] = { correct, attempted, total: questions.length };
      totalCorrect += correct;
      totalAttempted += attempted;
    });

    const totalQuestions = state.selectedSections.reduce((sum, secId) => sum + (paper.sections[secId]?.length || 0), 0);
    const percentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    const passed = percentage >= EXAM_CONFIG.passingPercent;

    // Save to history
    const historyEntry = {
      id: Date.now(),
      examType: state.examType,
      district: state.district,
      year: state.year,
      score: totalCorrect,
      total: totalQuestions,
      percentage,
      passed,
      target: state.targetScore || 50,
      targetMet: percentage >= (state.targetScore || 50),
      date: new Date().toLocaleDateString('mr-IN'),
      sections: state.selectedSections.map(s => s)
    };
    const history = loadFromStorage('history') || [];
    history.unshift(historyEntry);
    saveToStorage('history', history);

    renderResults(totalCorrect, totalQuestions, totalAttempted, percentage, passed, sectionResults, historyEntry.targetMet);
    showScreen('results-screen');

    if (historyEntry.targetMet) triggerFireworks();
  }

  // --- Fireworks Celebration ---
  function triggerFireworks() {
    const canvas = $('#fireworks-canvas');
    if (!canvas) return;
    canvas.style.display = 'block';

    // Very simple fallback particle effect inline
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#FF1744', '#2979FF', '#FFD700', '#4CAF50', '#FFFFFF'];

    for (let i = 0; i < 150; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2 + 100,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 1) * 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
        decay: Math.random() * 0.02 + 0.01
      });
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      particles.forEach(p => {
        if (p.life > 0) {
          alive = true;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(1, p.life * 4), 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life;
          ctx.fill();

          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.5; // gravity
          p.life -= p.decay;
        }
      });

      if (alive) {
        requestAnimationFrame(animate);
      } else {
        canvas.style.display = 'none';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    animate();
  }

  function renderResults(correct, total, attempted, percentage, passed, sectionResults, targetMet) {
    const card = $('.results-card');
    const paper = getPaper();
    const letters = ['A', 'B', 'C', 'D'];

    // Add congratulations banner for 90%+
    const congratsBanner = percentage >= 90
      ? `<div style="background: linear-gradient(135deg, #FFD700, #FFA000); color: #000; padding: 12px; border-radius: 8px; font-weight: 800; font-size: 1.2rem; margin-bottom: 20px; text-align: center; box-shadow: 0 4px 15px rgba(255,215,0,0.4); animation: pulseGlow 2s infinite;">🎇 अभिनंदन! Congratulations! (Topper Score) 🎇</div>`
      : '';

    card.innerHTML = `
      ${congratsBanner}
      <div class="results-score">
        <div class="score-circle" style="border-color:${passed ? 'var(--success)' : 'var(--danger)'}">
          <span class="score-num">${correct}</span>
          <span class="score-total">/ ${total}</span>
        </div>
        <div class="results-status ${passed ? 'pass' : 'fail'}">${passed ? '🎉 उत्तीर्ण (PASS)' : '❌ अनुत्तीर्ण (FAIL)'}</div>
        <p style="color:var(--text-secondary);margin-top:8px;">${percentage}% — ${attempted} attempted</p>
        <p style="color:${targetMet ? 'var(--gold)' : 'var(--text-secondary)'};font-size:0.9rem;margin-top:4px;">
          🎯 Target: ${state.targetScore}% ${targetMet ? '— Target Met! 🎇' : '— Keep practicing!'}
        </p>
      </div>
      <div class="results-breakdown" style="max-height: none; overflow-y:visible; padding-right:0;">
        ${state.selectedSections.map((secId, secIdx) => {
      const sec = EXAM_CONFIG.sections.find(s => s.id === secId);
      const res = sectionResults[secId];
      const pct = res.total > 0 ? Math.round((res.correct / res.total) * 100) : 0;
      const wrongCount = res.attempted - res.correct;
      const skippedCount = res.total - res.attempted;

      // Calculate section time taken
      let secTimeSecs = 0;
      for (const key in state.quiz.timeTaken) {
        if (key.startsWith(secId + '_')) secTimeSecs += state.quiz.timeTaken[key];
      }
      const mins = Math.floor(secTimeSecs / 60);
      const secs = secTimeSecs % 60;
      const timeStr = secTimeSecs > 0 ? '⌚ ' + mins + 'm ' + secs + 's' : '';

      // Build per-question drawer rows
      const qList = paper?.sections[secId] || [];
      const drawerRows = qList.map((q, qIdx) => {
        const key = secId + '_' + qIdx;
        const userAns = state.quiz.answers[key];
        const correctAns = q.answer;
        const timeTaken = state.quiz.timeTaken[key] || 0;

        let status, statusIcon, rowBg;
        if (userAns === undefined) {
          status = 'skipped';
          statusIcon = '⏭️';
          rowBg = 'rgba(255,255,255,0.03)';
        } else if (userAns === correctAns) {
          status = 'correct';
          statusIcon = '✅';
          rowBg = 'rgba(76,175,80,0.1)';
        } else {
          status = 'wrong';
          statusIcon = '❌';
          rowBg = 'rgba(255,23,68,0.1)';
        }

        let answerDetail = '';
        if (status === 'wrong') {
          answerDetail = '<div style="font-size:0.78rem; margin-top:6px; color:var(--text-secondary); line-height:1.5;">' +
            '<span style="color:#FF5252;">तुमचे: <b>' + letters[userAns] + '</b> — ' + (q.options[userAns] || '') + '</span><br>' +
            '<span style="color:#4CAF50;">बरोबर: <b>' + letters[correctAns] + '</b> — ' + (q.options[correctAns] || '') + '</span>' +
            '</div>';
        } else if (status === 'correct') {
          answerDetail = '<div style="font-size:0.78rem; margin-top:4px; color:#4CAF50;">' +
            'उत्तर: <b>' + letters[correctAns] + '</b> — ' + (q.options[correctAns] || '') +
            '</div>';
        } else {
          answerDetail = '<div style="font-size:0.78rem; margin-top:4px; color:var(--text-secondary); opacity:0.6;">' +
            'बरोबर उत्तर: <b>' + letters[correctAns] + '</b> — ' + (q.options[correctAns] || '') +
            '</div>';
        }

        return '<div style="background:' + rowBg + '; border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:10px 12px; margin-bottom:6px;">' +
          '<div style="display:flex; justify-content:space-between; align-items:center;">' +
          '<span style="font-weight:700; font-size:0.85rem;">' + statusIcon + ' Q' + (qIdx + 1) + '</span>' +
          '<span style="font-size:0.78rem; color:var(--text-secondary);">⏱️ ' + timeTaken + 's</span>' +
          '</div>' +
          '<div style="font-size:0.85rem; color:var(--text); margin-top:6px; line-height:1.4; opacity:0.9;">' + q.q + '</div>' +
          answerDetail +
          '</div>';
      }).join('');

      return '<div class="result-row" style="flex-direction:column; align-items:stretch; gap:8px;">' +
        '<div style="display:flex; justify-content:space-between; align-items:center;">' +
        '<span class="sec-label">' + sec.icon + ' ' + sec.nameEn + ' <span style="font-size:0.75rem;opacity:0.6;">' + timeStr + '</span></span>' +
        '<span class="sec-score" style="color:' + sec.color + '">' + res.correct + '/' + res.total + '</span>' +
        '</div>' +
        '<div class="result-bar"><div class="result-bar-fill" style="width:' + pct + '%;background:' + sec.color + '"></div></div>' +
        '<div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:4px; font-size:0.78rem;">' +
        '<span style="color:#4CAF50;">✅ ' + res.correct + ' correct</span>' +
        '<span style="color:#FF5252;">❌ ' + wrongCount + ' wrong</span>' +
        '<span style="color:var(--text-secondary);">⏭️ ' + skippedCount + ' skipped</span>' +
        '</div>' +
        '<button class="section-drawer-toggle" data-sec="' + secIdx + '" style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); color:var(--khaki-light); padding:8px 14px; border-radius:6px; cursor:pointer; font-size:0.85rem; font-weight:600; text-align:center; margin-top:4px; width:100%;">📋 प्रश्न तपशील पहा (View Question Details) ▼</button>' +
        '<div class="section-drawer" id="drawer-' + secIdx + '" style="display:none; margin-top:8px;">' +
        drawerRows +
        '</div>' +
        '</div>';
    }).join('')}
      </div>
      <div class="results-actions">
        <button class="btn-primary" onclick="App.goHome()">🏠 मुख्यपृष्ठ</button>
        <button class="quiz-btn" onclick="App.retryQuiz()">🔄 पुन्हा प्रयत्न</button>
      </div>
    `;

    // Attach drawer toggle handlers
    $$('.section-drawer-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const drawer = $(`#drawer-${btn.dataset.sec}`);
        if (drawer.style.display === 'none') {
          drawer.style.display = 'block';
          btn.textContent = '📋 तपशील लपवा (Hide Details) ▲';
        } else {
          drawer.style.display = 'none';
          btn.textContent = '📋 प्रश्न तपशील पहा (View Question Details) ▼';
        }
      });
    });

    // Show donation modal after a slight delay
    setTimeout(() => {
      const dModal = document.getElementById('donation-modal');
      if (dModal) dModal.style.display = 'flex';
    }, 1500);
  }

  // --- Admin ---
  function initAdmin() {
    // Tab switching
    $$('.admin-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        $$('.admin-tab').forEach(t => t.classList.remove('active'));
        $$('.admin-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        $(`#${tab.dataset.panel}`).classList.add('active');
        if (tab.dataset.panel === 'manage-panel') renderPaperList();
      });
    });

    // JSON Upload
    const uploadZone = $('.upload-zone');
    const fileInput = $('#json-file-input');

    uploadZone.addEventListener('click', () => fileInput.click());
    uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.style.borderColor = 'var(--khaki)'; });
    uploadZone.addEventListener('dragleave', () => { uploadZone.style.borderColor = ''; });
    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.style.borderColor = '';
      handleFileUpload(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', () => { if (fileInput.files[0]) handleFileUpload(fileInput.files[0]); });

    // Manual form
    $('#admin-manual-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const district = $('#admin-district').value;
      const year = parseInt($('#admin-year').value);
      const examType = $('#admin-exam-type').value;
      const section = $('#admin-section').value;
      const qText = $('#admin-q-text').value;
      const opts = [
        $('#admin-opt-a').value,
        $('#admin-opt-b').value,
        $('#admin-opt-c').value,
        $('#admin-opt-d').value
      ];
      const answer = parseInt($('#admin-answer').value);

      if (!district || !year || !qText || opts.some(o => !o)) { toast('Please fill all fields', 'error'); return; }

      const papers = loadFromStorage('papers') || {};
      const key = `${examType}_${district}_${year}`;
      if (!papers[key]) {
        papers[key] = { district, year, examType, sections: { math: [], gk: [], reasoning: [], marathi: [] } };
      }
      papers[key].sections[section].push({ q: qText, options: opts, answer });
      saveToStorage('papers', papers);
      toast('Question added!', 'success');
      e.target.reset();
    });
  }

  function parseCSVLine(text) {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        if (inQuotes && text[i + 1] === '"') { cur += '"'; i++; }
        else { inQuotes = !inQuotes; }
      } else if (c === ',' && !inQuotes) { result.push(cur); cur = ''; }
      else { cur += c; }
    }
    result.push(cur);
    return result.map(s => s.trim());
  }

  function handleFileUpload(file) {
    if (!file || (!file.name.endsWith('.json') && !file.name.endsWith('.csv'))) { toast('Please upload a JSON or CSV file', 'error'); return; }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (file.name.endsWith('.json')) {
        try {
          const data = JSON.parse(e.target.result);
          if (!data.district || !data.year || !data.sections) { toast('Invalid format. Need: district, year, sections', 'error'); return; }
          const papers = loadFromStorage('papers') || {};
          const key = `${data.examType || 'police_bharti'}_${data.district}_${data.year}`;
          papers[key] = data;
          saveToStorage('papers', papers);
          const totalQ = Object.values(data.sections).reduce((sum, arr) => sum + arr.length, 0);
          toast(`Paper uploaded: ${data.district} ${data.year} (${totalQ} questions)`, 'success');
        } catch (err) { toast('Error parsing JSON: ' + err.message, 'error'); }
      } else if (file.name.endsWith('.csv')) {
        try {
          const lines = e.target.result.split('\n').filter(l => l.trim());
          if (lines.length < 2) { toast('CSV is empty or invalid format', 'error'); return; }

          const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z]/g, ''));
          const reqHeaders = ['district', 'year', 'examtype', 'section', 'q', 'opta', 'optb', 'optc', 'optd', 'answer'];
          const hIdx = reqHeaders.map(rh => headers.indexOf(rh));

          if (hIdx.includes(-1)) {
            const missing = reqHeaders.filter((_, i) => hIdx[i] === -1).join(', ');
            toast(`CSV missing columns: ${missing}`, 'error'); return;
          }

          const papers = loadFromStorage('papers') || {};
          let added = 0;
          let currentKey = '';

          for (let i = 1; i < lines.length; i++) {
            const row = parseCSVLine(lines[i]);
            if (row.length < headers.length) continue;

            const district = row[hIdx[0]];
            const year = row[hIdx[1]];
            const examType = row[hIdx[2]] || 'police_bharti';
            const section = row[hIdx[3]];
            const qText = row[hIdx[4]];
            const opts = [row[hIdx[5]], row[hIdx[6]], row[hIdx[7]], row[hIdx[8]]];
            const answer = parseInt(row[hIdx[9]]);

            if (!district || !year || !section || !qText || isNaN(answer)) continue;

            const key = `${examType}_${district}_${year}`;
            currentKey = key;
            if (!papers[key]) papers[key] = { district, year: parseInt(year), examType, sections: { math: [], gk: [], reasoning: [], marathi: [] } };
            if (!papers[key].sections[section]) papers[key].sections[section] = [];

            papers[key].sections[section].push({ q: qText, options: opts, answer });
            added++;
          }

          if (added > 0) {
            saveToStorage('papers', papers);
            toast(`CSV Uploaded: Added ${added} questions processing ${currentKey}`, 'success');
          } else {
            toast('No valid questions found in CSV rows', 'error');
          }
        } catch (err) { toast('Error parsing CSV: ' + err.message, 'error'); }
      }
    };
    reader.readAsText(file);
  }

  function renderPaperList() {
    const list = $('#paper-list');
    const papers = loadFromStorage('papers') || {};
    const keys = Object.keys(papers);

    if (keys.length === 0) {
      list.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:40px;">No papers uploaded yet</p>';
      return;
    }

    list.innerHTML = keys.map(key => {
      const p = papers[key];
      const totalQ = Object.values(p.sections).reduce((sum, arr) => sum + arr.length, 0);
      const dist = DISTRICTS.find(d => d.id === p.district);
      return `
        <div class="paper-item">
          <div class="paper-info">
            <h4>${dist ? dist.emoji + ' ' + dist.name : p.district} — ${p.year}</h4>
            <p>${p.examType === 'srpf' ? 'SRPF' : 'Police Bharti'} • ${totalQ} Questions</p>
          </div>
          <div class="paper-actions">
            <button class="delete" onclick="App.deletePaper('${key}')">🗑️ Delete</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Populate admin dropdowns
  function populateAdminDropdowns() {
    const distSelect = $('#admin-district');
    if (!distSelect) return;
    distSelect.innerHTML = '<option value="">-- Select District --</option>';
    DISTRICTS.forEach(d => {
      distSelect.innerHTML += `<option value="${d.id}">${d.emoji} ${d.name} (${d.nameEn})</option>`;
    });
  }

  // --- Navigation ---
  function initNavigation() {
    $('#nav-home')?.addEventListener('click', goHome);
    $('#nav-admin')?.addEventListener('click', () => {
      populateAdminDropdowns();
      renderPaperList();
      showScreen('admin-screen');
    });
    $('#nav-logout')?.addEventListener('click', () => {
      auth.signOut().then(() => {
        state.user = null;
        localStorage.removeItem('pvq_user');
        showScreen('auth-screen');
        toast('Logged out successfully', 'info');
      });
    });

    // Back buttons
    $$('.back-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.back;
        if (target === 'examtype') showScreen('examtype-screen');
        else if (target === 'district') { renderDistricts(); showScreen('district-screen'); }
        else if (target === 'year') { renderYears(); showScreen('year-screen'); }
        else if (target === 'section') { renderSections(); showScreen('section-screen'); }
        else goHome();
      });
    });
  }

  function goHome() {
    if (state.quiz.timerInterval) clearInterval(state.quiz.timerInterval);
    showScreen('examtype-screen');
    renderHistory();
  }

  function retryQuiz() {
    state.quiz.answers = {};
    state.quiz.flagged = new Set();
    state.quiz.currentQuestion = 0;
    state.quiz.currentSection = state.selectedSections[0];
    state.selectedSections.forEach(s => {
      state.quiz.sectionTimers[s] = state.timerMode === 'auto'
        ? Math.floor(EXAM_CONFIG.totalTime / state.selectedSections.length) * 60
        : state.quiz.sectionTimers[s];
    });
    state.quiz.timeRemaining = state.quiz.sectionTimers[state.quiz.currentSection] || 0;
    startQuiz();
  }

  // --- Init ---
  function init() {
    showScreen('landing-screen');
    initLanding();
    initAuth();
    initExamType();
    initDistricts();
    initSections();
    initQuizControls();
    initAdmin();
    initNavigation();
  }

  // --- History ---
  function renderHistory() {
    const section = $('#history-section');
    if (!section) return;
    const history = loadFromStorage('history') || [];
    if (history.length === 0) {
      section.innerHTML = '';
      return;
    }
    const recent = history.slice(0, 8);
    section.innerHTML = `
      <h3>📜 तुमचा सराव इतिहास (Your Practice History)</h3>
      <div class="history-list">
        ${recent.map(h => {
      const dist = DISTRICTS.find(d => d.id === h.district);
      return `
            <div class="history-item">
              <div class="h-info">
                <div class="h-title">${dist ? dist.emoji + ' ' + dist.name : (h.examType === 'srpf' ? 'SRPF' : h.district)} — ${h.year}</div>
                <div class="h-meta">${h.date} • ${h.sections?.length || 4} sections</div>
              </div>
              <span class="h-score ${h.passed ? 'pass' : 'fail'}">${h.percentage}%</span>
              <button class="h-delete" onclick="App.deleteHistory(${h.id})" title="Delete">✕</button>
            </div>
          `;
    }).join('')}
      </div>
      <button class="history-clear" onclick="App.clearHistory()">🗑️ Clear All History</button>
    `;
  }

  // --- Preload Test Data ---
  async function preloadTestPaper() {
    const papers = loadFromStorage('papers') || {};
    if (!papers['police_bharti_jalna_2018']) {
      try {
        const res = await fetch('jalna_2026.json');
        if (res.ok) {
          const testPaper = await res.json();
          testPaper.year = 2018; // Make it 2018 for testing as requested
          papers['police_bharti_jalna_2018'] = testPaper;
          saveToStorage('papers', papers);
          console.log('Test paper Jalna 2018 preloaded.');
        }
      } catch (e) {
        console.error('Failed to preload test paper', e);
      }
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    preloadTestPaper().then(() => {
      init();
      renderHistory();
    });
  });

  // Public API
  return {
    goHome,
    retryQuiz,
    deletePaper: (key) => {
      const papers = loadFromStorage('papers') || {};
      delete papers[key];
      saveToStorage('papers', papers);
      renderPaperList();
      toast('Paper deleted', 'info');
    },
    deleteHistory: (id) => {
      let history = loadFromStorage('history') || [];
      history = history.filter(h => h.id !== id);
      saveToStorage('history', history);
      renderHistory();
      toast('Entry deleted', 'info');
    },
    clearHistory: () => {
      if (confirm('सर्व इतिहास हटवायचा आहे? Clear all history?')) {
        saveToStorage('history', []);
        renderHistory();
        toast('History cleared', 'info');
      }
    }
  };
})();
