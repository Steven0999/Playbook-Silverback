// script.js — Full play runner with animations and dropdown integration

// --- Court / animation constants ---
const SCALE = 10;
const COURT_LENGTH_FT = 94;
const COURT_WIDTH_FT = 50;
const RIM_FROM_BASELINE_FT = 4;
const THREE_PT_RADIUS_FT = 23.75;
const THREE_POINT_SIDE_FT = 22;
const playerBaseSize = 38;
const ballBaseSize = 32;
const ANIMATION_DELAY = 700; // ms for each step animation

// --- State ---
let isFullCourt = true;
let currentPlay = null;
let currentStepIndex = 0;
let isPlaying = false;
let animationTimeout = null;
let lastStepPositions = {}; // { id: {x,y} } in SVG coords

// --- DOM elements ---
const courtInner = document.getElementById('courtInner');
const courtSVG = document.getElementById('courtSVG');
const playDescription = document.getElementById('play-description');
const toggleButton = document.getElementById('toggle');
const resetButton = document.getElementById('reset-play');
const prevButton = document.getElementById('prev-step');
const nextButton = document.getElementById('next-step');
const playPauseButton = document.getElementById('play-pause-button');
const actionLinesGroup = document.getElementById('actionLines');
const toastNotification = document.getElementById('toast-notification');
const dropdownButton = document.getElementById('dropdownButton');
const dropdownMenu = document.getElementById('dropdownMenu');

// --- Utilities ---
function showToast(message, duration = 2200) {
  toastNotification.textContent = message;
  toastNotification.classList.add('visible', 'opacity-100');
  setTimeout(() => {
    toastNotification.classList.remove('visible','opacity-100');
  }, duration);
}

function getSvgCoordinates(p) {
  // p.x and p.y are percentages of court (0-100)
  // SVG viewBox is 0..940 (x) and 0..500 (y)
  return { x: p.x * 9.4, y: p.y * 5 };
}

// compute and draw 3pt arcs (keeps them accurate on resize)
function refresh3pt() {
  const leftRimX = RIM_FROM_BASELINE_FT * SCALE;
  const rightRimX = (COURT_LENGTH_FT - RIM_FROM_BASELINE_FT) * SCALE;
  const cy = (COURT_WIDTH_FT / 2) * SCALE; // 250

  const sideLineLength = THREE_POINT_SIDE_FT * SCALE;
  const r = THREE_PT_RADIUS_FT * SCALE;
  const halfW = (COURT_WIDTH_FT * SCALE) / 2;

  // left
  const leftX_ArcStart = leftRimX + Math.sqrt(Math.max(0, r * r - sideLineLength * sideLineLength));
  const leftY_StraightEnd = halfW - sideLineLength;
  const left3 = document.getElementById('left3pt');
  if (left3) {
    left3.setAttribute('d', `M 0 ${leftY_StraightEnd} L ${leftX_ArcStart} ${leftY_StraightEnd} A ${r} ${r} 0 0 1 ${leftX_ArcStart} ${halfW + sideLineLength} L 0 ${halfW + sideLineLength}`);
  }

  // right
  const rightX_ArcStart = rightRimX - Math.sqrt(Math.max(0, r * r - sideLineLength * sideLineLength));
  const rightY_StraightEnd = halfW - sideLineLength;
  const right3 = document.getElementById('right3pt');
  if (right3) {
    right3.setAttribute('d', `M 940 ${rightY_StraightEnd} L ${rightX_ArcStart} ${rightY_StraightEnd} A ${r} ${r} 0 0 0 ${rightX_ArcStart} ${halfW + sideLineLength} L 940 ${halfW + sideLineLength}`);
  }
}

// --- PLAYBOOK ---
// Each play is an array of step objects: { description, positions: [ {id,label,color,x,y,isBall} ... ], highlight: [ids], actions: [{type:'pass'|'screen', fromId, toId}] }
const PLAYBOOK = {
  // Motion (4 steps example)
  Motion: [
    {
      description: "Motion Step 1 — initial spacing.",
      positions: [
        { id:1,label:'1',color:'#ef4444',x:35,y:50,isBall:false },
        { id:2,label:'2',color:'#f59e0b',x:25,y:20,isBall:false },
        { id:3,label:'3',color:'#10b981',x:25,y:80,isBall:false },
        { id:4,label:'4',color:'#3b82f6',x:55,y:35,isBall:false },
        { id:5,label:'5',color:'#8b5cf6',x:65,y:65,isBall:false },
        { id:6,label:'🏀',color:'none',x:35.5,y:50,isBall:true }
      ],
      highlight:[1,6], actions:[]
    },
    {
      description: "Motion Step 2 — 1 passes to 2; 1 cuts to weak-side corner.",
      positions: [
        { id:1,label:'1',color:'#ef4444',x:10,y:75,isBall:false },
        { id:2,label:'2',color:'#f59e0b',x:30,y:20,isBall:false },
        { id:3,label:'3',color:'#10b981',x:25,y:80,isBall:false },
        { id:4,label:'4',color:'#3b82f6',x:55,y:35,isBall:false },
        { id:5,label:'5',color:'#8b5cf6',x:65,y:65,isBall:false },
        { id:6,label:'🏀',color:'none',x:30.5,y:20,isBall:true }
      ],
      highlight:[2,6], actions:[{type:'pass',fromId:1,toId:2}]
    },
    {
      description: "Motion Step 3 — Screen and roll; 4 sets screen for 5.",
      positions: [
        { id:1,label:'1',color:'#ef4444',x:12,y:70,isBall:false },
        { id:2,label:'2',color:'#f59e0b',x:30,y:20,isBall:false },
        { id:3,label:'3',color:'#10b981',x:45,y:50,isBall:false },
        { id:4,label:'4',color:'#3b82f6',x:7.5,y:35,isBall:false },
        { id:5,label:'5',color:'#8b5cf6',x:10,y:60,isBall:false },
        { id:6,label:'🏀',color:'none',x:30.5,y:20,isBall:true }
      ],
      highlight:[3,4], actions:[{type:'screen',fromId:4,toId:5}]
    },
    {
      description: "Motion Step 4 — reset and look for shot or drive.",
      positions: [
        { id:1,label:'1',color:'#ef4444',x:25,y:85,isBall:false },
        { id:2,label:'2',color:'#f59e0b',x:25,y:20,isBall:false },
        { id:3,label:'3',color:'#10b981',x:35,y:50,isBall:false },
        { id:4,label:'4',color:'#3b82f6',x:10,y:65,isBall:false },
        { id:5,label:'5',color:'#8b5cf6',x:10,y:35,isBall:false },
        { id:6,label:'🏀',color:'none',x:25.5,y:85,isBall:true }
      ],
      highlight:[2,4,6], actions:[]
    }
  ],

  // Stack (5 steps example)
  Stack: [
    {
      description: "Stack Step 1 — inbounds stack.",
      positions:[
        { id:1,label:'1',color:'#ef4444',x:1,y:35,isBall:false },
        { id:2,label:'2',color:'#f59e0b',x:7.5,y:75,isBall:false },
        { id:3,label:'3',color:'#10b981',x:7.5,y:65,isBall:false },
        { id:4,label:'4',color:'#3b82f6',x:7.5,y:55,isBall:false },
        { id:5,label:'5',color:'#8b5cf6',x:7.5,y:45,isBall:false },
        { id:6,label:'🏀',color:'none',x:1,y:35,isBall:true }
      ],
      highlight:[5,6], actions:[]
    },
    {
      description: "Stack Step 2 — first cutter clears to opposite block.",
      positions:[
        { id:1,label:'1',color:'#ef4444',x:1,y:35,isBall:false },
        { id:2,label:'2',color:'#f59e0b',x:7.5,y:75,isBall:false },
        { id:3,label:'3',color:'#10b981',x:7.5,y:65,isBall:false },
        { id:4,label:'4',color:'#3b82f6',x:7.5,y:55,isBall:false },
        { id:5,label:'5',color:'#8b5cf6',x:7.5,y:35,isBall:false },
        { id:6,label:'🏀',color:'none',x:1,y:35,isBall:true }
      ],
      highlight:[5], actions:[{type:'pass',fromId:1,toId:5}]
    },
    {
      description:"Stack Step 3 — wing pops to corner.",
      positions:[
        { id:1,label:'1',color:'#ef4444',x:1,y:35,isBall:false },
        { id:2,label:'2',color:'#f59e0b',x:7.5,y:75,isBall:false },
        { id:3,label:'3',color:'#10b981',x:7.5,y:65,isBall:false },
        { id:4,label:'4',color:'#3b82f6',x:23,y:15,isBall:false },
        { id:5,label:'5',color:'#8b5cf6',x:7.5,y:35,isBall:false },
        { id:6,label:'🏀',color:'none',x:23,y:15,isBall:true }
      ],
      highlight:[4], actions:[{type:'pass',fromId:1,toId:4}]
    },
    {
      description:"Stack Step 4 — second cutter dives to rim.",
      positions:[
        { id:1,label:'1',color:'#ef4444',x:40,y:50,isBall:false },
        { id:2,label:'2',color:'#f59e0b',x:40,y:75,isBall:false },
        { id:3,label:'3',color:'#10b981',x:7.5,y:50,isBall:false },
        { id:4,label:'4',color:'#3b82f6',x:23,y:15,isBall:false },
        { id:5,label:'5',color:'#8b5cf6',x:7.5,y:35,isBall:false },
        { id:6,label:'🏀',color:'none',x:40.5,y:75,isBall:true }
      ],
      highlight:[2,3], actions:[{type:'pass',fromId:1,toId:2}]
    },
    {
      description:"Stack Step 5 — options and reset.",
      positions:[
        { id:1,label:'1',color:'#ef4444',x:1,y:35,isBall:false },
        { id:2,label:'2',color:'#f59e0b',x:10,y:75,isBall:false },
        { id:3,label:'3',color:'#10b981',x:15,y:35,isBall:false },
        { id:4,label:'4',color:'#3b82f6',x:7.5,y:55,isBall:false },
        { id:5,label:'5',color:'#8b5cf6',x:7.5,y:45,isBall:false },
        { id:6,label:'🏀',color:'none',x:1,y:35,isBall:true }
      ],
      highlight:[5], actions:[]
    }
  ],

  // HighLow (4 steps)
  HighLow: [
    {
      description: "High/Low Step 1 — initial high/low spacing.",
      positions:[
        { id:1,label:'1',color:'#ef4444',x:35,y:50,isBall:false },
        { id:2,label:'2',color:'#f59e0b',x:25,y:15,isBall:false },
        { id:3,label:'3',color:'#10b981',x:40,y:85,isBall:false },
        { id:4,label:'4',color:'#3b82f6',x:20,y:35,isBall:false },
        { id:5,label:'5',color:'#8b5cf6',x:7.5,y:35,isBall:false },
        { id:6,label:'🏀',color:'none',x:35.5,y:50,isBall:true }
      ],
      highlight:[1,6], actions:[]
    },
    {
      description:"High/Low Step 2 — pass into high post.",
      positions:[
        { id:1,label:'1',color:'#ef4444',x:23,y:15,isBall:false },
        { id:2,label:'2',color:'#f59e0b',x:25,y:15,isBall:false },
        { id:3,label:'3',color:'#10b981',x:40,y:85,isBall:false },
        { id:4,label:'4',color:'#3b82f6',x:20,y:35,isBall:false },
        { id:5,label:'5',color:'#8b5cf6',x:7.5,y:35,isBall:false },
        { id:6,label:'🏀',color:'none',x:20.5,y:35,isBall:true }
      ],
      highlight:[1,4,6], actions:[{type:'pass',fromId:1,toId:4}]
    },
    {
      description:"High/Low Step 3 — dump to low post.",
      positions:[
        { id:1,label:'1',color:'#ef4444',x:23,y:15,isBall:false },
        { id:2,label:'2',color:'#f59e0b',x:25,y:15,isBall:false },
        { id:3,label:'3',color:'#10b981',x:40,y:85,isBall:false },
        { id:4,label:'4',color:'#3b82f6',x:20,y:35,isBall:false },
        { id:5,label:'5',color:'#8b5cf6',x:7.5,y:35,isBall:false },
        { id:6,label:'🏀',color:'none',x:8,y:35,isBall:true }
      ],
      highlight:[5,6], actions:[{type:'pass',fromId:4,toId:5}]
    },
    {
      description:"High/Low Step 4 — finish/read options.",
      positions:[
        { id:1,label:'1',color:'#ef4444',x:23,y:15,isBall:false },
        { id:2,label:'2',color:'#f59e0b',x:25,y:15,isBall:false },
        { id:3,label:'3',color:'#10b981',x:40,y:85,isBall:false },
        { id:4,label:'4',color:'#3b82f6',x:20,y:35,isBall:false },
        { id:5,label:'5',color:'#8b5cf6',x:8,y:35,isBall:false },
        { id:6,label:'🏀',color:'none',x:8,y:35,isBall:true }
      ],
      highlight:[5], actions:[]
    }
  ],

  // --- NEW PLAYS (each 4-5 steps of realistic movement animation) ---

  Dallas: [
    {
      description: "Dallas Step 1 — PG at top, wings spaced.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:12,y:50,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:30,y:25,isBall:false},
        {id:3,label:'3',color:'#10b981',x:30,y:75,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:60,y:30,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:70,y:70,isBall:false},
        {id:6,label:'🏀',color:'none',x:12.5,y:50,isBall:true}
      ], highlight:[1,6], actions:[]
    },
    {
      description: "Dallas Step 2 — PG uses screen; 4 sets ball-screen.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:20,y:45,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:30,y:25,isBall:false},
        {id:3,label:'3',color:'#10b981',x:30,y:75,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:58,y:40,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:70,y:70,isBall:false},
        {id:6,label:'🏀',color:'none',x:20.5,y:45,isBall:true}
      ], highlight:[1,4], actions:[{type:'screen',fromId:4,toId:1}]
    },
    {
      description: "Dallas Step 3 — roll to rim; PG kicks to corner.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:30,y:50,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:25,y:20,isBall:false},
        {id:3,label:'3',color:'#10b981',x:30,y:75,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:70,y:55,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:80,y:70,isBall:false},
        {id:6,label:'🏀',color:'none',x:30,y:50,isBall:true}
      ], highlight:[4,5], actions:[{type:'pass',fromId:1,toId:5}]
    },
    {
      description: "Dallas Step 4 — weak-side lift; look for layup or kickout.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:40,y:55,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:20,y:20,isBall:false},
        {id:3,label:'3',color:'#10b981',x:25,y:75,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:70,y:60,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:80,y:70,isBall:false},
        {id:6,label:'🏀',color:'none',x:40,y:55,isBall:true}
      ], highlight:[1,6], actions:[]
    }
  ],

  Michigan: [
    {
      description:"Michigan Step 1 — two-guard front, wings in corners.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:15,y:30,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:35,y:30,isBall:false},
        {id:3,label:'3',color:'#10b981',x:10,y:75,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:80,y:75,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:55,y:45,isBall:false},
        {id:6,label:'🏀',color:'none',x:30,y:30,isBall:true}
      ], highlight:[1,6], actions:[]
    },
    {
      description:"Michigan Step 2 — high screen; guard flares to corner.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:22,y:32,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:45,y:28,isBall:false},
        {id:3,label:'3',color:'#10b981',x:10,y:70,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:80,y:65,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:58,y:45,isBall:false},
        {id:6,label:'🏀',color:'none',x:45,y:28,isBall:true}
      ], highlight:[2,5], actions:[{type:'screen',fromId:5,toId:2}]
    },
    {
      description:"Michigan Step 3 — ball reversed & skip for open look.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:25,y:35,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:65,y:25,isBall:false},
        {id:3,label:'3',color:'#10b981',x:10,y:70,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:80,y:65,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:55,y:45,isBall:false},
        {id:6,label:'🏀',color:'none',x:65,y:25,isBall:true}
      ], highlight:[2], actions:[{type:'pass',fromId:1,toId:2}]
    },
    {
      description:"Michigan Step 4 — drive/skip read.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:30,y:45,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:70,y:30,isBall:false},
        {id:3,label:'3',color:'#10b981',x:10,y:70,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:80,y:65,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:55,y:45,isBall:false},
        {id:6,label:'🏀',color:'none',x:30,y:45,isBall:true}
      ], highlight:[1,2], actions:[]
    }
  ],

  Shallow: [
    {
      description:"Shallow Step 1 — ball with guard; weak-side spacing.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:20,y:25,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:40,y:25,isBall:false},
        {id:3,label:'3',color:'#10b981',x:15,y:60,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:70,y:60,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:50,y:50,isBall:false},
        {id:6,label:'🏀',color:'none',x:20,y:25,isBall:true}
      ], highlight:[1,6], actions:[]
    },
    {
      description:"Shallow Step 2 — guard shallow cuts; ball reversed.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:45,y:25,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:20,y:25,isBall:false},
        {id:3,label:'3',color:'#10b981',x:15,y:60,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:70,y:60,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:55,y:50,isBall:false},
        {id:6,label:'🏀',color:'none',x:40,y:25,isBall:true}
      ], highlight:[1,2], actions:[{type:'pass',fromId:2,toId:1}]
    },
    {
      description:"Shallow Step 3 — weak-side cutter to rim.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:45,y:25,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:20,y:25,isBall:false},
        {id:3,label:'3',color:'#10b981',x:25,y:50,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:70,y:60,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:55,y:50,isBall:false},
        {id:6,label:'🏀',color:'none',x:45,y:25,isBall:true}
      ], highlight:[3], actions:[]
    },
    {
      description:"Shallow Step 4 — kick for shot or finish.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:50,y:30,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:20,y:25,isBall:false},
        {id:3,label:'3',color:'#10b981',x:25,y:50,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:70,y:60,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:55,y:50,isBall:false},
        {id:6,label:'🏀',color:'none',x:50,y:30,isBall:true}
      ], highlight:[1,5], actions:[]
    }
  ],

  Sparks: [
    {
      description:"Sparks Step 1 — stagger screens set for shooter.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:15,y:45,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:30,y:45,isBall:false},
        {id:3,label:'3',color:'#10b981',x:60,y:30,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:75,y:50,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:50,y:60,isBall:false},
        {id:6,label:'🏀',color:'none',x:15.5,y:45,isBall:true}
      ], highlight:[3], actions:[]
    },
    {
      description:"Sparks Step 2 — shooter comes off screens; ball swings.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:20,y:35,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:35,y:40,isBall:false},
        {id:3,label:'3',color:'#10b981',x:65,y:30,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:80,y:55,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:55,y:60,isBall:false},
        {id:6,label:'🏀',color:'none',x:60,y:40,isBall:true}
      ], highlight:[3,6], actions:[{type:'pass',fromId:1,toId:6}]
    },
    {
      description:"Sparks Step 3 — quick shot or drive.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:25,y:30,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:35,y:40,isBall:false},
        {id:3,label:'3',color:'#10b981',x:68,y:28,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:82,y:52,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:58,y:60,isBall:false},
        {id:6,label:'🏀',color:'none',x:68,y:28,isBall:true}
      ], highlight:[3], actions:[]
    },
    {
      description:"Sparks Step 4 — reset or secondary action.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:20,y:35,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:35,y:40,isBall:false},
        {id:3,label:'3',color:'#10b981',x:60,y:30,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:75,y:50,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:50,y:60,isBall:false},
        {id:6,label:'🏀',color:'none',x:50,y:50,isBall:true}
      ], highlight:[2,5], actions:[]
    }
  ],

  Triangle: [
    {
      description:"Triangle Step 1 — strong side triangle forms.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:15,y:40,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:25,y:25,isBall:false},
        {id:3,label:'3',color:'#10b981',x:40,y:60,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:70,y:30,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:75,y:55,isBall:false},
        {id:6,label:'🏀',color:'none',x:20,y:35,isBall:true}
      ], highlight:[1,4], actions:[]
    },
    {
      description:"Triangle Step 2 — post entry and corner cut.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:25,y:45,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:25,y:30,isBall:false},
        {id:3,label:'3',color:'#10b981',x:45,y:60,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:65,y:35,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:80,y:50,isBall:false},
        {id:6,label:'🏀',color:'none',x:25,y:45,isBall:true}
      ], highlight:[4,5], actions:[{type:'pass',fromId:1,toId:4}]
    },
    {
      description:"Triangle Step 3 — kickout to corner or quick interior finish.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:30,y:48,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:25,y:30,isBall:false},
        {id:3,label:'3',color:'#10b981',x:45,y:60,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:60,y:38,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:82,y:48,isBall:false},
        {id:6,label:'🏀',color:'none',x:60,y:38,isBall:true}
      ], highlight:[5], actions:[{type:'pass',fromId:4,toId:5}]
    },
    {
      description:"Triangle Step 4 — reset to triangle spacing.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:20,y:40,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:25,y:25,isBall:false},
        {id:3,label:'3',color:'#10b981',x:40,y:60,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:70,y:30,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:75,y:55,isBall:false},
        {id:6,label:'🏀',color:'none',x:20,y:40,isBall:true}
      ], highlight:[1,2], actions:[]
    }
  ],

  FiveOut: [
    {
      description:"5-Out Step 1 — perimeter spacing.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:10,y:20,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:30,y:20,isBall:false},
        {id:3,label:'3',color:'#10b981',x:50,y:20,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:70,y:20,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:90,y:20,isBall:false},
        {id:6,label:'🏀',color:'none',x:15,y:25,isBall:true}
      ], highlight:[1,6], actions:[]
    },
    {
      description:"5-Out Step 2 — continuous cuts and fills.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:15,y:25,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:35,y:25,isBall:false},
        {id:3,label:'3',color:'#10b981',x:55,y:25,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:75,y:25,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:95,y:25,isBall:false},
        {id:6,label:'🏀',color:'none',x:25,y:30,isBall:true}
      ], highlight:[3], actions:[]
    },
    {
      description:"5-Out Step 3 — drive and kick options.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:20,y:30,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:40,y:25,isBall:false},
        {id:3,label:'3',color:'#10b981',x:60,y:25,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:80,y:25,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:95,y:30,isBall:false},
        {id:6,label:'🏀',color:'none',x:30,y:35,isBall:true}
      ], highlight:[1,6], actions:[]
    },
    {
      description:"5-Out Step 4 — reset spacing.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:10,y:20,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:30,y:20,isBall:false},
        {id:3,label:'3',color:'#10b981',x:50,y:20,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:70,y:20,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:90,y:20,isBall:false},
        {id:6,label:'🏀',color:'none',x:15,y:25,isBall:true}
      ], highlight:[], actions:[]
    }
  ],

  Box: [
    {
      description:"Box Step 1 — box set at blocks.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:20,y:40,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:20,y:60,isBall:false},
        {id:3,label:'3',color:'#10b981',x:40,y:40,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:40,y:60,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:60,y:50,isBall:false},
        {id:6,label:'🏀',color:'none',x:15,y:50,isBall:true}
      ], highlight:[5], actions:[]
    },
    {
      description:"Box Step 2 — baseline screen and cut.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:25,y:45,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:25,y:55,isBall:false},
        {id:3,label:'3',color:'#10b981',x:45,y:45,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:45,y:55,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:65,y:50,isBall:false},
        {id:6,label:'🏀',color:'none',x:20,y:50,isBall:true}
      ], highlight:[3], actions:[{type:'screen',fromId:5,toId:3}]
    },
    {
      description:"Box Step 3 — dive to rim read.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:30,y:45,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:25,y:55,isBall:false},
        {id:3,label:'3',color:'#10b981',x:45,y:35,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:45,y:65,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:70,y:50,isBall:false},
        {id:6,label:'🏀',color:'none',x:30,y:45,isBall:true}
      ], highlight:[3,5], actions:[{type:'pass',fromId:1,toId:3}]
    },
    {
      description:"Box Step 4 — recover and reset.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:20,y:40,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:20,y:60,isBall:false},
        {id:3,label:'3',color:'#10b981',x:40,y:40,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:40,y:60,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:60,y:50,isBall:false},
        {id:6,label:'🏀',color:'none',x:15,y:50,isBall:true}
      ], highlight:[], actions:[]
    }
  ],

  Palm: [
    {
      description:"Palm Step 1 — entry to wing, post seals.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:20,y:40,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:30,y:25,isBall:false},
        {id:3,label:'3',color:'#10b981',x:70,y:25,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:60,y:60,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:50,y:60,isBall:false},
        {id:6,label:'🏀',color:'none',x:30,y:40,isBall:true}
      ], highlight:[4], actions:[]
    },
    {
      description:"Palm Step 2 — skip pass and repost option.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:25,y:35,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:35,y:30,isBall:false},
        {id:3,label:'3',color:'#10b981',x:75,y:30,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:55,y:55,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:45,y:60,isBall:false},
        {id:6,label:'🏀',color:'none',x:35,y:30,isBall:true}
      ], highlight:[2], actions:[{type:'pass',fromId:1,toId:2}]
    },
    {
      description:"Palm Step 3 — post flashes for touch.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:25,y:35,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:35,y:30,isBall:false},
        {id:3,label:'3',color:'#10b981',x:75,y:30,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:50,y:50,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:45,y:60,isBall:false},
        {id:6,label:'🏀',color:'none',x:50,y:50,isBall:true}
      ], highlight:[4,5], actions:[]
    },
    {
      description:"Palm Step 4 — finish or recycle.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:20,y:40,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:30,y:25,isBall:false},
        {id:3,label:'3',color:'#10b981',x:70,y:25,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:60,y:60,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:50,y:60,isBall:false},
        {id:6,label:'🏀',color:'none',x:30,y:40,isBall:true}
      ], highlight:[], actions:[]
    }
  ],

  Duke: [
    {
      description:"Duke Step 1 — horns setup, guards top.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:15,y:25,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:35,y:25,isBall:false},
        {id:3,label:'3',color:'#10b981',x:45,y:60,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:60,y:25,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:80,y:25,isBall:false},
        {id:6,label:'🏀',color:'none',x:35,y:30,isBall:true}
      ], highlight:[1,6], actions:[]
    },
    {
      description:"Duke Step 2 — ball screen and roll.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:20,y:25,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:40,y:30,isBall:false},
        {id:3,label:'3',color:'#10b981',x:50,y:60,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:65,y:30,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:85,y:25,isBall:false},
        {id:6,label:'🏀',color:'none',x:40,y:35,isBall:true}
      ], highlight:[4], actions:[{type:'screen',fromId:4,toId:1}]
    },
    {
      description:"Duke Step 3 — roll finishes or pop for shot.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:30,y:30,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:45,y:35,isBall:false},
        {id:3,label:'3',color:'#10b981',x:50,y:60,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:70,y:35,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:85,y:25,isBall:false},
        {id:6,label:'🏀',color:'none',x:30,y:30,isBall:true}
      ], highlight:[4,1], actions:[]
    }
  ],

  Scorchers: [
    {
      description:"Scorchers Step 1 — wings set up for stagger.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:20,y:30,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:40,y:25,isBall:false},
        {id:3,label:'3',color:'#10b981',x:60,y:25,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:80,y:30,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:50,y:50,isBall:false},
        {id:6,label:'🏀',color:'none',x:25,y:35,isBall:true}
      ], highlight:[2,3], actions:[]
    },
    {
      description:"Scorchers Step 2 — stagger screens; shooter pops out.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:30,y:25,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:45,y:25,isBall:false},
        {id:3,label:'3',color:'#10b981',x:65,y:25,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:85,y:30,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:55,y:50,isBall:false},
        {id:6,label:'🏀',color:'none',x:65,y:25,isBall:true}
      ], highlight:[3], actions:[]
    },
    {
      description:"Scorchers Step 3 — corner shot or reset.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:33,y:25,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:48,y:25,isBall:false},
        {id:3,label:'3',color:'#10b981',x:68,y:25,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:88,y:30,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:58,y:50,isBall:false},
        {id:6,label:'🏀',color:'none',x:88,y:30,isBall:true}
      ], highlight:[4], actions:[]
    },
    {
      description:"Scorchers Step 4 — secondary options.",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:25,y:30,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:45,y:25,isBall:false},
        {id:3,label:'3',color:'#10b981',x:65,y:25,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:85,y:35,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:55,y:50,isBall:false},
        {id:6,label:'🏀',color:'none',x:55,y:35,isBall:true}
      ], highlight:[2,5], actions:[]
    }
  ],

  Christmas: [
    {
      description:"Christmas Step 1 — misdirection cuts",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:20,y:25,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:40,y:25,isBall:false},
        {id:3,label:'3',color:'#10b981',x:10,y:70,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:80,y:70,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:50,y:50,isBall:false},
        {id:6,label:'🏀',color:'none',x:25,y:30,isBall:true}
      ], highlight:[1,6], actions:[]
    },
    {
      description:"Christmas Step 2 — cross and flare",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:30,y:30,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:45,y:25,isBall:false},
        {id:3,label:'3',color:'#10b981',x:15,y:70,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:80,y:65,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:55,y:50,isBall:false},
        {id:6,label:'🏀',color:'none',x:45,y:25,isBall:true}
      ], highlight:[2], actions:[]
    },
    {
      description:"Christmas Step 3 — finish or reset",
      positions:[
        {id:1,label:'1',color:'#ef4444',x:20,y:25,isBall:false},
        {id:2,label:'2',color:'#f59e0b',x:40,y:25,isBall:false},
        {id:3,label:'3',color:'#10b981',x:10,y:70,isBall:false},
        {id:4,label:'4',color:'#3b82f6',x:80,y:70,isBall:false},
        {id:5,label:'5',color:'#8b5cf6',x:50,y:50,isBall:false},
        {id:6,label:'🏀',color:'none',x:25,y:30,isBall:true}
      ], highlight:[], actions:[]
    }
  ]
};

// --- Rendering / tokens logic ---

// create token elements for current play initial step
function createTokens() {
  // remove existing tokens
  courtInner.querySelectorAll('.token').forEach(t => t.remove());
  actionLinesGroup.innerHTML = '';

  if (!currentPlay) return;

  const step0 = PLAYBOOK[currentPlay][0];
  if (!step0) return;

  step0.positions.forEach(p => {
    const d = document.createElement('div');
    d.className = 'token' + (p.isBall ? ' ball' : '');
    d.textContent = p.label;
    d.dataset.id = p.id;
    d.style.position = 'absolute';
    // initial left/top computed from percent
    const size = p.isBall ? ballBaseSize : playerBaseSize;
    d.style.left = `calc(${p.x}% - ${size/2}px)`;
    d.style.top = `calc(${p.y}% - ${size/2}px)`;
    if (!p.isBall) d.style.background = p.color;
    courtInner.appendChild(d);
  });

  // initialize lastStepPositions from step0
  initializePositions(step0);
  renderStep(); // draw initial step (and clear lines)
}

// build lastStepPositions map from a step object
function initializePositions(stepData) {
  const map = {};
  stepData.positions.forEach(p => {
    map[p.id] = getSvgCoordinates(p);
  });
  lastStepPositions = map;
}

// render the current step: move tokens, draw movement lines and explicit action lines
function renderStep() {
  if (!currentPlay) return;
  const play = PLAYBOOK[currentPlay];
  const step = play[currentStepIndex];
  if (!step) return;

  // clear lines
  actionLinesGroup.innerHTML = '';

  // build map of existing token elements
  const tokens = Array.from(courtInner.querySelectorAll('.token'));
  const tokenMap = {};
  tokens.forEach(t => { tokenMap[Number(t.dataset.id)] = t; t.classList.remove('highlighted'); });

  const currentPositions = {}; // SVG coords for this step

  // 1) for each position, compute moves and update token positions
  step.positions.forEach(p => {
    const el = tokenMap[p.id];
    const size = p.isBall ? ballBaseSize : playerBaseSize;
    const half = size/2;
    const displayX = isFullCourt ? p.x : p.x * 2; // in percent of displayed container

    // current svg coords
    const svgCoords = getSvgCoordinates(p);

    // draw movement line if moved since lastStepPositions
    const last = lastStepPositions[p.id];
    if (last && (last.x !== svgCoords.x || last.y !== svgCoords.y)) {
      const mvLine = document.createElementNS('http://www.w3.org/2000/svg','line');
      mvLine.setAttribute('x1', last.x);
      mvLine.setAttribute('y1', last.y);
      mvLine.setAttribute('x2', svgCoords.x);
      mvLine.setAttribute('y2', svgCoords.y);
      mvLine.classList.add('play-action-line','movement-line');
      if (p.isBall) {
        mvLine.setAttribute('stroke','#f97316');
        mvLine.setAttribute('stroke-width','4');
        mvLine.setAttribute('stroke-dasharray','10,5');
      } else {
        mvLine.setAttribute('stroke','#6b7280');
        mvLine.setAttribute('stroke-width','3');
        mvLine.setAttribute('stroke-dasharray','4,4');
      }
      actionLinesGroup.appendChild(mvLine);
    }

    // set element position (smooth via CSS transitions)
    if (el) {
      el.style.left = `calc(${displayX}% - ${half}px)`;
      el.style.top = `calc(${p.y}% - ${half}px)`;
      // highlight if present
      if (step.highlight && step.highlight.includes(p.id)) el.classList.add('highlighted');
      // if ball emoji, ensure text is emoji
      if (p.isBall) el.textContent = '🏀';
      else el.textContent = p.label;
    }

    currentPositions[p.id] = svgCoords;
  });

  // 2) explicit actions: passes/screens drawn as separate lines
  if (Array.isArray(step.actions)) {
    step.actions.forEach(action => {
      const from = step.positions.find(x => x.id === action.fromId);
      const to = step.positions.find(x => x.id === action.toId);
      if (!from || !to) return;
      const start = getSvgCoordinates(from);
      const end = getSvgCoordinates(to);
      const actLine = document.createElementNS('http://www.w3.org/2000/svg','line');
      actLine.setAttribute('x1', start.x);
      actLine.setAttribute('y1', start.y);
      actLine.setAttribute('x2', end.x);
      actLine.setAttribute('y2', end.y);
      actLine.classList.add('play-action-line','explicit-action');
      if (action.type === 'pass') {
        actLine.setAttribute('stroke','#ef4444');
        actLine.setAttribute('stroke-width','4');
        actLine.setAttribute('stroke-dasharray','12,8');
      } else if (action.type === 'screen') {
        actLine.setAttribute('stroke','#3b82f6');
        actLine.setAttribute('stroke-width','6');
        actLine.setAttribute('stroke-dasharray','0');
      }
      actionLinesGroup.appendChild(actLine);
    });
  }

  // update lastStepPositions for next comparison
  lastStepPositions = currentPositions;

  // update description and buttons
  playDescription.innerHTML = `<strong>Step ${currentStepIndex+1} of ${play.length}:</strong> ${step.description}`;
  playPauseButton.disabled = false;
  nextButton.disabled = currentStepIndex >= play.length - 1;
  prevButton.disabled = currentStepIndex <= 0;

  // if finished and playing, stop
  if (currentStepIndex === play.length - 1 && isPlaying) {
    togglePlayPause();
    showToast(`Play "${currentPlay}" complete — reset to run again.`, 3000);
  }
}

// --- Animation loop ---
function togglePlayPause() {
  if (!currentPlay) return;
  isPlaying = !isPlaying;
  if (isPlaying) {
    playPauseButton.classList.add('play-state');
    // start running
    runAnimation();
  } else {
    playPauseButton.classList.remove('play-state');
    clearTimeout(animationTimeout);
  }
}

function runAnimation() {
  if (!isPlaying) return;
  const play = PLAYBOOK[currentPlay];
  if (currentStepIndex < play.length - 1) {
    animationTimeout = setTimeout(() => {
      currentStepIndex++;
      renderStep();
      runAnimation();
    }, ANIMATION_DELAY);
  } else {
    // end reached
    togglePlayPause();
  }
}

// --- Token creation & play control ---
function loadPlay(playName) {
  if (!PLAYBOOK[playName]) {
    showToast(`Play "${playName}" not found.`);
    return;
  }

  // stop any running animation
  if (isPlaying) togglePlayPause();

  currentPlay = playName;
  currentStepIndex = 0;

  // mark active tab UI
  document.querySelectorAll('.play-tab').forEach(t => t.classList.toggle('active', t.dataset.play === playName));
  // close dropdown
  if (dropdownMenu) dropdownMenu.classList.add('hidden');

  createTokens();
  showToast(`Loaded play: ${playName}`);
}

function nextStep() {
  const play = PLAYBOOK[currentPlay];
  if (!play) return;
  if (currentStepIndex < play.length - 1) {
    currentStepIndex++;
    renderStep();
  } else {
    showToast('Already at last step.');
  }
}

function prevStep() {
  if (currentStepIndex > 0) {
    currentStepIndex--;
    // to make backward look natural, set lastStepPositions to previous step positions
    const prev = PLAYBOOK[currentPlay][currentStepIndex === 0 ? 0 : currentStepIndex - 1];
    initializePositions(prev);
    renderStep();
  } else {
    showToast('Already at first step.');
  }
}

function resetPlay() {
  if (!currentPlay) { showToast('Select a play first.'); return; }
  if (isPlaying) togglePlayPause();
  currentStepIndex = 0;
  initializePositions(PLAYBOOK[currentPlay][0]);
  renderStep();
  showToast(`Play "${currentPlay}" reset.`);
}

// --- createTokens uses currentPlay step 0 to spawn token divs ---
function createTokens() {
  courtInner.querySelectorAll('.token').forEach(t => t.remove());
  actionLinesGroup.innerHTML = '';

  if (!currentPlay) return;
  const step0 = PLAYBOOK[currentPlay][0];
  if (!step0) return;

  step0.positions.forEach(p => {
    const el = document.createElement('div');
    el.className = 'token' + (p.isBall ? ' ball' : '');
    el.dataset.id = p.id;
    el.textContent = p.isBall ? '🏀' : p.label;
    el.style.position = 'absolute';
    const size = p.isBall ? ballBaseSize : playerBaseSize;
    el.style.left = `calc(${p.x}% - ${size/2}px)`;
    el.style.top = `calc(${p.y}% - ${size/2}px)`;
    if (!p.isBall) el.style.background = p.color;
    courtInner.appendChild(el);
  });

  initializePositions(step0);
  renderStep();
}

// --- UI bindings ---
playPauseButton.addEventListener('click', () => {
  if (!currentPlay) { showToast('Select a play first.'); return; }
  togglePlayPause();
});

nextButton.addEventListener('click', nextStep);
prevButton.addEventListener('click', prevStep);
resetButton.addEventListener('click', resetPlay);

// toggle full/half court
toggleButton.addEventListener('click', () => {
  // pause if playing
  if (isPlaying) togglePlayPause();

  const svgEl = document.getElementById('courtSVG');
  if (isFullCourt) {
    svgEl.setAttribute('viewBox','0 0 470 500');
    document.getElementById('midLine').style.display = 'none';
    document.getElementById('midCircle').style.display = 'none';
    const rightEnd = document.getElementById('rightEnd');
    if (rightEnd) rightEnd.style.display = 'none';
    toggleButton.textContent = 'Toggle: Half Court → Full Court';
    isFullCourt = false;
  } else {
    svgEl.setAttribute('viewBox','0 0 940 500');
    document.getElementById('midLine').style.display = '';
    document.getElementById('midCircle').style.display = '';
    const rightEnd = document.getElementById('rightEnd');
    if (rightEnd) rightEnd.style.display = '';
    toggleButton.textContent = 'Toggle: Full Court → Half Court';
    isFullCourt = true;
  }

  // re-init positions so percent -> display matches new view
  if (currentPlay) {
    initializePositions(PLAYBOOK[currentPlay][currentStepIndex]);
    renderStep();
  }
});

// Tabs and dropdown hookup
document.querySelectorAll('.play-tab').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const p = btn.dataset.play;
    loadPlay(p);
  });
});

// dropdown toggle and outside click to close
if (dropdownButton && dropdownMenu) {
  dropdownButton.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle('hidden');
  });
  document.addEventListener('click', (e) => {
    if (!dropdownMenu.classList.contains('hidden')) {
      dropdownMenu.classList.add('hidden');
    }
  });
  // dropdown items
  dropdownMenu.querySelectorAll('button[data-play]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const p = btn.dataset.play;
      loadPlay(p);
    });
  });
}

// respond to window resize for 3pt arcs
window.addEventListener('resize', refresh3pt);

// --- Initialization on load ---
window.onload = () => {
  refresh3pt();
  // default load Motion
  loadPlay('Motion');
};
