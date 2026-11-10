
const pages = document.querySelectorAll(".page");
const navItems = document.querySelectorAll(".nav-item");
const pageTitle = document.getElementById("page-title");

const titles = {
  overview: "Overview",
  password: "Password Lab",
  url: "URL Checker",
  encoder: "Text Encoder",
  hash: "Hash Generator",
  quiz: "Security Quiz",
  terminal: "Practice Terminal"
};

function openPage(name) {
  pages.forEach(page => page.classList.toggle("active", page.id === name));
  navItems.forEach(item => item.classList.toggle("active", item.dataset.section === name));
  pageTitle.textContent = titles[name] || "Overview";
}

navItems.forEach(item => {
  item.addEventListener("click", () => openPage(item.dataset.section));
});

document.querySelectorAll("[data-open]").forEach(button => {
  button.addEventListener("click", () => openPage(button.dataset.open));
});

// PASSWORD CHECKER
const passwordInput = document.getElementById("password-input");

passwordInput.addEventListener("input", () => {
  const password = passwordInput.value;
  const rules = [
    ["check-length", password.length >= 12],
    ["check-upper", /[A-Z]/.test(password)],
    ["check-lower", /[a-z]/.test(password)],
    ["check-number", /[0-9]/.test(password)],
    ["check-symbol", /[^A-Za-z0-9]/.test(password)]
  ];

  let score = 0;
  rules.forEach(([id, passed]) => {
    document.getElementById(id).classList.toggle("pass", passed);
    if (passed) score++;
  });

  const bar = document.getElementById("strength-bar");
  const label = document.getElementById("strength-label");

  bar.style.width = (score * 20) + "%";

  if (!password) {
    label.textContent = "Not checked";
    bar.style.width = "0";
  } else if (score <= 2) {
    label.textContent = "Weak";
    bar.style.background = "#ed7777";
  } else if (score <= 4) {
    label.textContent = "Moderate";
    bar.style.background = "#edbd76";
  } else {
    label.textContent = "Good rule coverage";
    bar.style.background = "#55c6a9";
  }
});

// URL STRUCTURE CHECKER
document.getElementById("check-url").addEventListener("click", () => {
  const input = document.getElementById("url-input").value.trim();
  const result = document.getElementById("url-result");

  if (!input) {
    result.textContent = "Please enter a URL.";
    return;
  }

  try {
    const url = new URL(input);
    const warnings = [];

    if (url.protocol !== "https:") {
      warnings.push("The URL does not use HTTPS.");
    }
    if (url.username || url.password) {
      warnings.push("The URL contains embedded login information.");
    }
    if (url.hostname.startsWith("xn--") || url.hostname.includes(".xn--")) {
      warnings.push("The domain uses internationalized characters.");
    }
    if (url.hostname.length > 60) {
      warnings.push("The hostname is unusually long.");
    }
    if (url.hostname.split(".").some(part => part.length > 30)) {
      warnings.push("A domain section is unusually long.");
    }

    result.innerHTML = `
      <strong>URL structure</strong><br>
      Host: ${escapeHTML(url.hostname)}<br>
      Protocol: ${escapeHTML(url.protocol)}<br>
      Port: ${escapeHTML(url.port || "Default")}<br>
      ${warnings.length
        ? '<p class="warning">' + warnings.map(escapeHTML).join("<br>") + '</p>'
        : '<p class="good">No basic structural warnings detected.</p>'}
      <p>This inspection cannot establish whether a site is safe.</p>
    `;
  } catch {
    result.textContent = "Invalid URL. Enter a complete address such as https://example.com";
  }
});

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

// BASE64 ENCODER / DECODER
const encodeInput = document.getElementById("encode-input");
const encodeOutput = document.getElementById("encode-output");

document.getElementById("encode-btn").addEventListener("click", () => {
  try {
    const bytes = new TextEncoder().encode(encodeInput.value);
    let binary = "";
    bytes.forEach(byte => binary += String.fromCharCode(byte));
    encodeOutput.value = btoa(binary);
  } catch {
    encodeOutput.value = "Could not encode this text.";
  }
});

document.getElementById("decode-btn").addEventListener("click", () => {
  try {
    const binary = atob(encodeInput.value.trim());
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    encodeOutput.value = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    encodeOutput.value = "Invalid Base64 input.";
  }
});

// SHA-256 HASH GENERATOR
document.getElementById("hash-btn").addEventListener("click", async () => {
  const input = document.getElementById("hash-input").value;
  const output = document.getElementById("hash-output");

  try {
    if (!window.crypto || !crypto.subtle) {
      throw new Error("Secure browser context required.");
    }

    const data = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest("SHA-256", data);
    output.value = Array.from(new Uint8Array(digest))
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join("");
  } catch (error) {
    output.value = "Hash generation failed. Try opening this app through localhost or HTTPS.";
  }
});

// COPY BUTTONS
async function copyText(elementId) {
  const value = document.getElementById(elementId).value;
  if (!value) return alert("Nothing to copy.");

  try {
    await navigator.clipboard.writeText(value);
    alert("Copied successfully.");
  } catch {
    alert("Clipboard access is unavailable in this browser context.");
  }
}

document.getElementById("copy-encoded").addEventListener("click", () => copyText("encode-output"));
document.getElementById("copy-hash").addEventListener("click", () => copyText("hash-output"));

// SECURITY QUIZ
const questions = [
  {
    question: "Which is the safest password practice?",
    answers: ["Use the same password everywhere", "Use unique long passwords", "Use your birthday"],
    correct: 1
  },
  {
    question: "What should you do with an unexpected suspicious link?",
    answers: ["Open it immediately", "Share it with friends", "Verify it before opening"],
    correct: 2
  },
  {
    question: "What does HTTPS help provide?",
    answers: ["An encrypted connection", "A virus-free website guarantee", "Free internet"],
    correct: 0
  }
];

let quizIndex = 0;
let quizScore = 0;
let quizFinished = false;

function renderQuiz() {
  const area = document.getElementById("quiz-area");

  if (quizFinished) {
    area.innerHTML = `
      <h3>Quiz completed</h3>
      <p class="muted">Your score: ${quizScore} / ${questions.length}</p>
      <button class="primary-btn" id="restart-quiz">Try again</button>
    `;
    document.getElementById("restart-quiz").addEventListener("click", () => {
      quizIndex = 0;
      quizScore = 0;
      quizFinished = false;
      renderQuiz();
    });
    return;
  }

  const question = questions[quizIndex];
  area.innerHTML = `
    <p class="muted">Question ${quizIndex + 1} of ${questions.length}</p>
    <h3>${escapeHTML(question.question)}</h3>
    <div id="quiz-answers" class="quiz-answers"></div>
    <p id="quiz-feedback" class="muted"></p>
  `;

  const answers = document.getElementById("quiz-answers");

  question.answers.forEach((answer, index) => {
    const button = document.createElement("button");
    button.className = "secondary-btn";
    button.textContent = answer;
    button.style.display = "block";
    button.style.width = "100%";
    button.style.textAlign = "left";

    button.addEventListener("click", () => {
      if (answers.dataset.answered) return;
      answers.dataset.answered = "yes";

      const correct = index === question.correct;
      if (correct) quizScore++;

      document.getElementById("quiz-feedback").textContent =
        correct ? "Correct answer!" : "Not quite. The correct answer is: " + question.answers[question.correct];

      const next = document.createElement("button");
      next.className = "primary-btn";
      next.textContent = quizIndex === questions.length - 1 ? "See score" : "Next question";
      next.addEventListener("click", () => {
        quizIndex++;
        if (quizIndex >= questions.length) quizFinished = true;
        renderQuiz();
      });
      answers.appendChild(next);
    });

    answers.appendChild(button);
  });
}

renderQuiz();

// SIMULATED TERMINAL
const terminalForm = document.getElementById("terminal-form");
const terminalInput = document.getElementById("terminal-input");
const terminalOutput = document.getElementById("terminal-output");

const commands = {
  help: "Available commands:\nhelp     - Show commands\nabout    - About this terminal\nclear    - Clear the screen\nwhoami   - Show demo user\n date    - Show current date",
  about: "Cyber Lab Practice Terminal\nThis is a safe command simulation. It does not execute operating system commands.",
  whoami: "student@cyberlab (demo account)",
  date: () => new Date().toString()
};

terminalForm.addEventListener("submit", event => {
  event.preventDefault();

  const command = terminalInput.value.trim().toLowerCase();
  if (!command) return;

  if (command === "clear") {
    terminalOutput.textContent = "";
  } else {
    const response = commands[command];

    terminalOutput.textContent +=
      "\n\nstudent@cyberlab:~$ " + command +
      "\n" + (typeof response === "function" ? response() :
      response || "Command not found. Type help to see available commands.");
  }

  terminalInput.value = "";
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
});
