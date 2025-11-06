// === PLAYBOOK DATA (All Plays) ===
const PLAYBOOK = {
  Motion: {
    description: "A flowing continuous motion offense designed to keep defenders off balance.",
    steps: [
      {
        text: "Players start spaced in 5-out formation.",
        positions: [
          { id: 1, x: 10, y: 20 },
          { id: 2, x: 30, y: 20 },
          { id: 3, x: 50, y: 20 },
          { id: 4, x: 40, y: 50 },
          { id: 5, x: 60, y: 50 },
          { id: 6, label: "🏀", x: 50, y: 40, isBall: true }
        ]
      },
      {
        text: "Players rotate through motion cuts.",
        positions: [
          { id: 1, x: 15, y: 25 },
          { id: 2, x: 35, y: 25 },
          { id: 3, x: 55, y: 30 },
          { id: 4, x: 45, y: 50 },
          { id: 5, x: 65, y: 45 },
          { id: 6, label: "🏀", x: 55, y: 42, isBall: true }
        ]
      }
    ]
  },

  Stack: {
    description: "Baseline out-of-bounds play using stacked screens to create open looks.",
    steps: [
      {
        text: "Stack formation under the basket.",
        positions: [
          { id: 1, x: 15, y: 50 },
          { id: 2, x: 15, y: 55 },
          { id: 3, x: 15, y: 60 },
          { id: 4, x: 10, y: 70 },
          { id: 5, x: 5, y: 80 },
          { id: 6, label: "🏀", x: 5, y: 70, isBall: true }
        ]
      },
      {
        text: "Players pop out from stack to wings and corners.",
        positions: [
          { id: 1, x: 25, y: 50 },
          { id: 2, x: 20, y: 60 },
          { id: 3, x: 10, y: 30 },
          { id: 4, x: 5, y: 40 },
          { id: 5, x: 30, y: 70 },
          { id: 6, label: "🏀", x: 20, y: 55, isBall: true }
        ]
      }
    ]
  },

  HighLow: {
    description: "A high-low post offense focusing on interior spacing.",
    steps: [
      {
        text: "Two bigs positioned high and low post.",
        positions: [
          { id: 1, x: 10, y: 40 },
          { id: 2, x: 25, y: 20 },
          { id: 3, x: 40, y: 50 },
          { id: 4, x: 60, y: 30 },
          { id: 5, x: 80, y: 45 },
          { id: 6, label: "🏀", x: 30, y: 35, isBall: true }
        ]
      },
      {
        text: "Entry pass to high post and look inside.",
        positions: [
          { id: 1, x: 12, y: 42 },
          { id: 2, x: 35, y: 25 },
          { id: 3, x: 45, y: 55 },
          { id: 4, x: 65, y: 40 },
          { id: 5, x: 75, y: 45 },
          { id: 6, label: "🏀", x: 35, y: 30, isBall: true }
        ]
      }
    ]
  },

  // === NEW PLAYS (with placeholder coordinates) ===
  Dallas: {
    description: "Spread pick and roll set with strong side spacing.",
    steps: [
      { text: "PG dribbles left using screen; wings spread.", positions: [
        { id: 1, x: 10, y: 40 }, { id: 2, x: 25, y: 20 },
        { id: 3, x: 70, y: 20 }, { id: 4, x: 60, y: 60 },
        { id: 5, x: 40, y: 60 }, { id: 6, label: "🏀", x: 15, y: 40, isBall: true }
      ]},
      { text: "Roll man cuts; weak side drifts.", positions: [
        { id: 1, x: 20, y: 35 }, { id: 2, x: 30, y: 25 },
        { id: 3, x: 75, y: 25 }, { id: 4, x: 55, y: 50 },
        { id: 5, x: 45, y: 65 }, { id: 6, label: "🏀", x: 25, y: 38, isBall: true }
      ]}
    ]
  },

  Michigan: {
    description: "A two-guard front with high screen action leading to flare options.",
    steps: [
      { text: "Two guards up top, wings in corners.", positions: [
        { id: 1, x: 15, y: 25 }, { id: 2, x: 35, y: 25 },
        { id: 3, x: 10, y: 70 }, { id: 4, x: 80, y: 70 },
        { id: 5, x: 50, y: 40 }, { id: 6, label: "🏀", x: 30, y: 25, isBall: true }
      ]},
      { text: "High screen and flare for opposite guard.", positions: [
        { id: 1, x: 20, y: 30 }, { id: 2, x: 40, y: 28 },
        { id: 3, x: 10, y: 65 }, { id: 4, x: 80, y: 65 },
        { id: 5, x: 55, y: 45 }, { id: 6, label: "🏀", x: 40, y: 30, isBall: true }
      ]}
    ]
  },

  Shallow: {
    description: "A guard-to-guard shallow cut creating motion and spacing.",
    steps: [
      { text: "Ball reversed between guards.", positions: [
        { id: 1, x: 20, y: 25 }, { id: 2, x: 40, y: 25 },
        { id: 3, x: 15, y: 60 }, { id: 4, x: 70, y: 60 },
        { id: 5, x: 50, y: 50 }, { id: 6, label: "🏀", x: 20, y: 25, isBall: true }
      ]},
      { text: "Guard shallow cuts to opposite side.", positions: [
        { id: 1, x: 45, y: 25 }, { id: 2, x: 20, y: 25 },
        { id: 3, x: 15, y: 60 }, { id: 4, x: 70, y: 60 },
        { id: 5, x: 55, y: 50 }, { id: 6, label: "🏀", x: 40, y: 25, isBall: true }
      ]}
    ]
  },

  Sparks: {
    description: "Quick sideline action using stagger screens for shooter.",
    steps: [
      { text: "Shooter moves off staggered screens.", positions: [
        { id: 1, x: 10, y: 40 }, { id: 2, x: 30, y: 45 },
        { id: 3, x: 60, y: 30 }, { id: 4, x: 75, y: 50 },
        { id: 5, x: 50, y: 60 }, { id: 6, label: "🏀", x: 15, y: 45, isBall: true }
      ]},
      { text: "Ball swings to shooter on weak side.", positions: [
        { id: 1, x: 20, y: 35 }, { id: 2, x: 35, y: 40 },
        { id: 3, x: 65, y: 30 }, { id: 4, x: 80, y: 55 },
        { id: 5, x: 55, y: 60 }, { id: 6, label: "🏀", x: 60, y: 40, isBall: true }
      ]}
    ]
  },

  Triangle: {
    description: "Classic triangle setup with post entry and corner options.",
    steps: [
      { text: "Players form triangle strong side.", positions: [
        { id: 1, x: 15, y: 40 }, { id: 2, x: 25, y: 25 },
        { id: 3, x: 40, y: 60 }, { id: 4, x: 70, y: 30 },
        { id: 5, x: 75, y: 55 }, { id: 6, label: "🏀", x: 20, y: 35, isBall: true }
      ]},
      { text: "Post entry; corner cut and replace.", positions: [
        { id: 1, x: 25, y: 45 }, { id: 2, x: 25, y: 30 },
        { id: 3, x: 45, y: 60 }, { id: 4, x: 65, y: 35 },
        { id: 5, x: 80, y: 50 }, { id: 6, label: "🏀", x: 25, y: 45, isBall: true }
      ]}
    ]
  },

  FiveOut: {
    description: "Five players spaced out around perimeter, constant motion.",
    steps: [
      { text: "Spacing around perimeter.", positions: [
        { id: 1, x: 10, y: 20 }, { id: 2, x: 30, y: 20 },
        { id: 3, x: 50, y: 20 }, { id: 4, x: 70, y: 20 },
        { id: 5, x: 90, y: 20 }, { id: 6, label: "🏀", x: 15, y: 25, isBall: true }
      ]},
      { text: "Players cut and fill continuously.", positions: [
        { id: 1, x: 15, y: 25 }, { id: 2, x: 35, y: 25 },
        { id: 3, x: 55, y: 25 }, { id: 4, x: 75, y: 25 },
        { id: 5, x: 95, y: 25 }, { id: 6, label: "🏀", x: 25, y: 30, isBall: true }
      ]}
    ]
  },

  Box: {
    description: "Box set for baseline screens and interior cuts.",
    steps: [
      { text: "Players set in box formation.", positions: [
        { id: 1, x: 20, y: 40 }, { id: 2, x: 20, y: 60 },
        { id: 3, x: 40, y: 40 }, { id: 4, x: 40, y: 60 },
        { id: 5, x: 60, y: 50 }, { id: 6, label: "🏀", x: 15, y: 50, isBall: true }
      ]},
      { text: "Screen and dive actions.", positions: [
        { id: 1, x: 25, y: 45 }, { id: 2, x: 25, y: 55 },
        { id: 3, x: 45, y: 45 }, { id: 4, x: 45, y: 55 },
        { id: 5, x: 65, y: 50 }, { id: 6, label: "🏀", x: 20, y: 50, isBall: true }
      ]}
    ]
  },

  Palm: {
    description: "Post isolation play with perimeter reversal.",
    steps: [
      { text: "Entry to wing; post sets seal.", positions: [
        { id: 1, x: 20, y: 40 }, { id: 2, x: 30, y: 25 },
        { id: 3, x: 70, y: 25 }, { id: 4, x: 60, y: 60 },
        { id: 5, x: 50, y: 60 }, { id: 6, label: "🏀", x: 30, y: 40, isBall: true }
      ]},
      { text: "Skip pass and repost option.", positions: [
        { id: 1, x: 25, y: 35 }, { id: 2, x: 35, y: 30 },
        { id: 3, x: 75, y: 30 }, { id: 4, x: 55, y: 55 },
        { id: 5, x: 45, y: 60 }, { id: 6, label: "🏀", x: 35, y: 38, isBall: true }
      ]}
    ]
  },

  Duke: {
    description: "Horns action with ball reversal into pick and roll.",
    steps: [
      { text: "Horns setup; PG initiates at top.", positions: [
        { id: 1, x: 15, y: 25 }, { id: 2, x: 35, y: 25 },
        { id: 3, x: 45, y: 60 }, { id: 4, x: 60, y: 25 },
        { id: 5, x: 80, y: 25 }, { id: 6, label: "🏀", x: 35, y: 30, isBall: true }
      ]},
      { text: "Ball screen and roll to rim.", positions: [
        { id: 1, x: 20, y: 25 }, { id: 2, x: 40, y: 30 },
        { id: 3, x: 50, y: 60 }, { id: 4, x: 65, y: 30 },
        { id: 5, x: 85, y: 25 }, { id: 6, label: "🏀", x: 40, y: 35, isBall: true }
      ]}
    ]
  },

  Scorchers: {
    description: "Multiple screens leading to open 3-point opportunities.",
    steps: [
      { text: "Set screens on both wings.", positions: [
        { id: 1, x: 20, y: 30 }, { id: 2, x: 40, y: 25 },
        { id: 3, x: 60, y: 25 }, { id: 4, x: 80, y: 30 },
        { id: 5, x: 50, y: 50 }, { id: 6, label: "🏀", x: 25, y: 35, isBall: true }
      ]},
      { text: "Shooter pops out to corner for shot.", positions: [
        { id: 1, x: 30, y: 25 }, { id: 2, x: 45, y: 25 },
        { id: 3, x: 65, y: 25 }, { id: 4, x: 85, y: 30 },
        { id: 5, x: 55, y: 50 }, { id: 6, label: "🏀", x: 60, y: 35, isBall: true }
      ]}
    ]
  }
};

// Optional “Christmas” play
PLAYBOOK.Christmas = {
  description: "Festive motion set with misdirection cuts.",
  steps: [
    { text: "Guards cross high, wings lift.", positions: [
      { id: 1, x: 20, y: 25 }, { id: 2, x: 40, y: 25 },
      { id: 3, x: 10, y: 70 }, { id: 4, x: 80, y: 70 },
      { id: 5, x: 50, y: 50 }, { id: 6, label: "🏀", x: 25, y: 30, isBall: true }
    ]}
  ]
};

// === PLAY ANIMATION LOGIC (simplified placeholder for demo) ===
let currentPlay = "Motion";
let currentStep = 0;

// DOM elements
const courtInner = document.getElementById("courtInner");
const playDescription = document.getElementById("play-description");
const prevButton = document.getElementById("prev-step");
const nextButton = document.getElementById("next-step");
const playPauseButton = document.getElementById("play-pause-button");
const toastNotification = document.getElementById("toast-notification");

// === Helper functions ===
function showToast(msg, duration = 2500) {
  toastNotification.textContent = msg;
  toastNotification.classList.add("visible");
  setTimeout(() => toastNotification.classList.remove("visible"), duration);
}

function getPlayData() {
  return PLAYBOOK[currentPlay]?.steps || [];
}

function renderTokens(stepIndex = 0) {
  courtInner.querySelectorAll(".token").forEach((t) => t.remove());
  const step = getPlayData()[stepIndex];
  if (!step) return;
  step.positions.forEach((p) => {
    const el = document.createElement("div");
    el.className = "token" + (p.isBall ? " ball" : "");
    el.textContent = p.label || p.id;
    el.style.left = `calc(${p.x}% - 19px)`;
    el.style.top = `calc(${p.y}% - 19px)`;
    if (!p.isBall) el.style.background = "#4f46e5";
    courtInner.appendChild(el);
  });
  playDescription.textContent = step.text;
}

function loadPlay(name) {
  currentPlay = name;
  currentStep = 0;
  renderTokens(0);
  showToast(`Loaded play: ${name}`);
}

function nextStep() {
  const play = getPlayData();
  if (currentStep < play.length - 1) {
    currentStep++;
    renderTokens(currentStep);
  } else {
    showToast("End of play.");
  }
}

function prevStep() {
  if (currentStep > 0) {
    currentStep--;
    renderTokens(currentStep);
  }
}

playPauseButton.addEventListener("click", () => {
  const play = getPlayData();
  let isPlaying = playPauseButton.classList.toggle("play-state");
  if (isPlaying) {
    let interval = setInterval(() => {
      if (currentStep < play.length - 1) {
        currentStep++;
        renderTokens(currentStep);
      } else {
        clearInterval(interval);
        playPauseButton.classList.remove("play-state");
      }
    }, 1500);
  }
});

nextButton.addEventListener("click", nextStep);
prevButton.addEventListener("click", prevStep);

// === Dropdown Menu Logic ===
const dropdownButton = document.getElementById("dropdownButton");
const dropdownMenu = document.getElementById("dropdownMenu");
dropdownButton.addEventListener("click", () => {
  dropdownMenu.classList.toggle("hidden");
});

// Menu click load play
dropdownMenu.querySelectorAll("button").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    loadPlay(e.target.dataset.play);
    dropdownMenu.classList.add("hidden");
  });
});

// === Initial load ===
window.onload = () => {
  renderTokens(0);
  showToast("Select a play to begin!");
};
