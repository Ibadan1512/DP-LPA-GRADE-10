const API_URL = "https://script.google.com/macros/s/AKfycbySYQ5IirmOlgJrxViNmfMlCcjdIuzAS1vJ7JOHUMcCLLRbqzoZAxGTFp96YnD7TeE-/exec";

/* =====================================================
   STUDENT INFO & SESSION SETUP (VERY IMPORTANT)
===================================================== */
const studentName = localStorage.name;
const studentClass = localStorage.class;

if (!studentName || !studentClass) {
  alert("No student info found. Redirecting...");
  window.location.href = "index.html";
}

// 🔐 Unique session keys per student
const sessionKey   = `${studentName}_${studentClass}`;
const timeKey      = `${sessionKey}_examTime`;
const answersKey   = `${sessionKey}_examAnswers`;
const violationKey = `${sessionKey}_violations`;

document.getElementById("studentInfo").textContent =
  `Name: ${studentName} | Class: ${studentClass}`;

/* =====================================================
   VIOLATION & RELOAD DETECTION (FIXED)
===================================================== */
let violations = parseInt(localStorage.getItem(violationKey) || "0");

// Detect REAL reload only
const nav = performance.getEntriesByType("navigation")[0];
if (nav && nav.type === "reload") {
  violations++;
  localStorage.setItem(violationKey, violations);

  alert(`🚫 Refresh detected!\nViolations: ${violations}/3`);
}

if (violations >= 3) {
  alert("❌ Too many violations. Exam will be submitted.");
  submitExam();
}

/* =====================================================
   TIMER (PER-STUDENT, PERSISTS ON RELOAD)
===================================================== */
let timeLeft = localStorage.getItem(timeKey)
  ? parseInt(localStorage.getItem(timeKey))
  : 30 * 60; // 30 minutes

const timerDiv = document.getElementById("timer");

const timer = setInterval(() => {
  const min = Math.floor(timeLeft / 60);
  const sec = timeLeft % 60;
  timerDiv.textContent = `⏱ ${min}:${sec < 10 ? "0" : ""}${sec}`;

  localStorage.setItem(timeKey, timeLeft);
  timeLeft--;

  if (timeLeft < 0) {
    clearInterval(timer);
    alert("⏰ Time up! Exam submitted.");
    submitExam();
  }
}, 1000);

/* =====================================================
   SHUFFLE FUNCTION
===================================================== */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/* =====================================================
   LOAD QUESTIONS
===================================================== */
let correctAnswers = {};

fetch(API_URL)
  .then(res => res.json())
  .then(questions => {
    const form = document.getElementById("examForm");
    form.innerHTML = "";

    questions = shuffle(questions);

    questions.forEach(q => {
      correctAnswers[`q${q.id}`] = q.correct;

      const options = shuffle([
        { key: "A", text: q.A },
        { key: "B", text: q.B },
        { key: "C", text: q.C },
        { key: "D", text: q.D }
      ]);

      let optionsHTML = "";
      options.forEach(opt => {
        optionsHTML += `
          <label class="option">
            <span class="opt-text">${opt.text}</span>
            <input type="radio" name="q${q.id}" value="${opt.key}">
          </label>
        `;
      });

      form.innerHTML += `
        <div class="question">
          <p class="question-text">${q.question}</p>
          <div class="options-grid">
            ${optionsHTML}
          </div>
        </div>
      `;
    });

    // ✅ RESTORE ANSWERS AFTER QUESTIONS LOAD
    const savedAnswers = JSON.parse(localStorage.getItem(answersKey) || "{}");
    for (let q in savedAnswers) {
      const input = document.querySelector(
        `input[name="${q}"][value="${savedAnswers[q]}"]`
      );
      if (input) input.checked = true;
    }
  })
  .catch(() => {
    document.getElementById("examForm").innerHTML =
      "<p>Error loading questions.</p>";
  });

/* =====================================================
   SAVE ANSWERS LIVE
===================================================== */
document.addEventListener("change", e => {
  if (e.target.type === "radio") {
    let answers = JSON.parse(localStorage.getItem(answersKey) || "{}");
    answers[e.target.name] = e.target.value;
    localStorage.setItem(answersKey, JSON.stringify(answers));
  }
});

/* =====================================================
   SUBMIT EXAM
===================================================== */
function submitExam() {
  clearInterval(timer);

  let score = 0;
  let answers = {};

  for (let q in correctAnswers) {
    const selected = document.querySelector(`input[name="${q}"]:checked`);
    if (selected) {
      answers[q] = selected.value;
      if (selected.value === correctAnswers[q]) score++;
    }
  }

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      type: "Responses",
      name: studentName,
      class: studentClass,
      score: score,
      answers: answers
    })
  })
  .then(res => res.text())
  .then(() => {
    // 🧹 CLEANUP — PER STUDENT ONLY
    localStorage.removeItem(timeKey);
    localStorage.removeItem(answersKey);
    localStorage.removeItem(violationKey);

    alert(`✅ Exam submitted successfully!\nScore: ${score}`);
    window.location.href = "index.html";
  });
}
