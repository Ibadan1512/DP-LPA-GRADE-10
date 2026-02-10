document.addEventListener("DOMContentLoaded", () => {

  let violations = 0;
  const MAX_VIOLATIONS = 3;
  const warningBox = document.getElementById("warning");

  function logViolation(type) {
    violations++;

    warningBox.style.display = "block";
    warningBox.innerHTML = `
      🚨 <strong>EXAM VIOLATION</strong> 🚨<br>
      ${type}<br>
      Attempt ${violations} of ${MAX_VIOLATIONS}
    `;

    fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        type: "Violations",
        name: localStorage.name,
        class: localStorage.class,
        violation: type,
        device: /Mobi/i.test(navigator.userAgent) ? "Mobile" : "Computer"
      })
    });

    if (violations >= MAX_VIOLATIONS) {
      alert("❌ Too many violations. Exam will be submitted.");
      submitExam();
    }
  }


  

  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) {
      logViolation("Exited Fullscreen Mode");
    }
  });

  // ---------- TAB / APP SWITCH ----------
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      logViolation("Tab/App Switch");
    }
  });

  // ---------- REFRESH ----------
  window.addEventListener("keydown", e => {
    if (e.key === "F5" || (e.ctrlKey && e.key.toLowerCase() === "r")) {
      e.preventDefault();
      logViolation("Attempted Page Refresh");
    }
  });

  // ---------- BACK BUTTON ----------
  history.pushState(null, null, location.href);
  window.onpopstate = () => {
    history.pushState(null, null, location.href);
    logViolation("Attempted Back Navigation");
  };

  // ---------- COPY / PASTE ----------
  document.addEventListener("contextmenu", e => e.preventDefault());

  document.addEventListener("keydown", e => {
    if (e.ctrlKey && ["c", "v", "x", "a"].includes(e.key.toLowerCase())) {
      e.preventDefault();
      logViolation("Copy/Paste Attempt");
    }
  });

  // ---------- LEAVE PAGE ----------
  window.addEventListener("beforeunload", e => {
    e.preventDefault();
    e.returnValue = "Leaving will submit your exam.";
  });

});
