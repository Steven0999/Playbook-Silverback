// --- Constant Definitions ---
const SCALE = 10;
const COURT_LENGTH_FT = 94;
const COURT_WIDTH_FT = 50;
const RIM_FROM_BASELINE_FT = 4;
const THREE_PT_RADIUS_FT = 23.75;
const THREE_POINT_SIDE_FT = 22;
const playerBaseSize = 38;
const ballBaseSize = 32;
const ANIMATION_DELAY = 600; // Time in ms for player movement (matches CSS transition)

// --- State Variables ---
let isFullCourt = true;
let currentPlay = null; 
let currentStepIndex = 0;
let isPlaying = false; // Animation state
let animationTimeout = null; // Stores the setTimeout ID

// Stores { id: {x: number, y: number} } map of the previous step in SVG coordinates
let lastStepPositions = {}; 

// --- DOM Elements ---
const courtInner = document.getElementById('courtInner');
const playDescription = document.getElementById('play-description');
const toggleButton = document.getElementById('toggle');
const prevButton = document.getElementById('prev-step');
const nextButton = document.getElementById('next-step');
const playPauseButton = document.getElementById('play-pause-button');
const actionLinesGroup = document.getElementById('actionLines');
const toastNotification = document.getElementById('toast-notification');

// --- Playbook Data (Updated for P4/P5 swap in Motion Step 3) ---
// All coordinates are stored as a percentage of the FULL 94-foot court (0-100%).
const PLAYBOOK = {
    Motion: [
        { // Step 0: Starting Position (Point Guard past the arc)
            description: "Initial Setup: Point Guard (1) at the high top, past the 3-point arc. Wings (2, 3) outside the arc. Bigs (4, 5) on the low blocks.",
            positions: [
                { id: 1, label: '1', color: '#ef4444', x: 35, y: 50, isBall: false },
                { id: 2, label: '2', color: '#f59e0b', x: 25, y: 15, isBall: false }, 
                { id: 3, label: '3', color: '#10b981', x: 25, y: 85, isBall: false }, 
                { id: 4, label: '4', color: '#3b82f6', x: 7.5, y: 35, isBall: false },
                { id: 5, label: '5', color: '#8b5cf6', x: 7.5, y: 65, isBall: false },
                { id: 6, label: '🏀', color: 'none', x: 35.5, y: 50, isBall: true }
            ],
            highlight: [1, 6],
            actions: []
        },
        { // Step 1: Pass to Wing and Initial Cut
            description: "1 passes to the Wing (2). 1 cuts to the weak side wing. Bigs (4, 5) maintain low post positions in preparation for the screen.",
            positions: [
                { id: 1, label: '1', color: '#ef4444', x: 10, y: 70, isBall: false },
                { id: 2, label: '2', color: '#f59e0b', x: 25, y: 15, isBall: false }, 
                { id: 3, label: '3', color: '#10b981', x: 7.5, y: 85, isBall: false }, 
                { id: 4, label: '4', color: '#3b82f6', x: 7.5, y: 35, isBall: false },
                { id: 5, label: '5', color: '#8b5cf6', x: 7.5, y: 65, isBall: false },
                { id: 6, label: '🏀', color: 'none', x: 25.5, y: 15, isBall: true }
            ],
            highlight: [1, 2, 6],
            actions: [
                { type: 'pass', fromId: 1, toId: 2 }, 
            ]
        },
        { // Step 2: Screen Action
            description: "Screen Action: 1 screens for 3 (Weak Side Wing Swap). Big (4) sets a **screen** for Big (5). Both 4 and 5 remain locked in their low post positions.",
            positions: [
                { id: 1, label: '1', color: '#ef4444', x: 10, y: 80, isBall: false },
                { id: 2, label: '2', color: '#f59e0b', x: 25, y: 15, isBall: false }, 
                { id: 3, label: '3', color: '#10b981', x: 7.5, y: 85, isBall: false },
                { id: 4, label: '4', color: '#3b82f6', x: 7.5, y: 60, isBall: false },
                { id: 5, label: '5', color: '#8b5cf6', x: 7.5, y: 65, isBall: false },
                { id: 6, label: '🏀', color: 'none', x: 25.5, y: 15, isBall: true } 
            ],
            highlight: [1, 3, 4, 5],
            actions: [
                { type: 'screen', fromId: 1, toId: 3 }, 
                { type: 'screen', fromId: 4, toId: 5 }
            ]
        },
        { // Step 3: Reset and Bigs Swap (4/5 NOW SWAP)
            description: "**Position Swap (4 & 5):** Wing (3) runs to the top of the key. **Position 4** pops out to the high weak side, and **Position 5** cuts across to the strong-side low block, completing the requested post swap.",
            positions: [
                { id: 1, label: '1', color: '#ef4444', x: 25, y: 85, isBall: false },
                { id: 2, label: '2', color: '#f59e0b', x: 25, y: 15, isBall: false },
                { id: 3, label: '3', color: '#10b981', x: 35, y: 50, isBall: false },
                { id: 4, label: '4', color: '#3b82f6', x: 10, y: 65, isBall: false }, // P4 (was low) stays low weak side (SWAP)
                { id: 5, label: '5', color: '#8b5cf6', x: 10, y: 35, isBall: false }, // P5 (was low) cuts to strong low block (SWAP)
                { id: 6, label: '🏀', color: 'none', x: 35.5, y: 50, isBall: true }
            ],
            highlight: [2, 4, 5, 6],
            actions: [] 
        }
    ],
    Stack: [
        { // Step 0: Starting Position (Inbounds)
            description: "Initial Setup for Stack: Big (4), Guard (3), Big (5), Guard (2) stacked from the block. Inbounder (1) under the basket.",
            positions: [
                { id: 1, label: '1', color: '#ef4444', x: 1, y: 50, isBall: false }, 
                { id: 2, label: '2', color: '#f59e0b', x: 7.5, y: 75, isBall: false }, 
                { id: 3, label: '3', color: '#10b981', x: 7.5, y: 65, isBall: false }, 
                { id: 4, label: '4', color: '#3b82f6', x: 7.5, y: 55, isBall: false }, 
                { id: 5, label: '5', color: '#8b5cf6', x: 7.5, y: 45, isBall: false }, 
                { id: 6, label: '🏀', color: 'none', x: 1, y: 50, isBall: true }     
            ],
            highlight: [5, 6],
            actions: []
        },
        { // Step 1: First Big Cuts
            description: "First Big (5) cuts across the key to the opposite low block (= Option 1).",
            positions: [
                { id: 1, label: '1', color: '#ef4444', x: 1, y: 50, isBall: false }, 
                { id: 2, label: '2', color: '#f59e0b', x: 7.5, y: 75, isBall: false }, 
                { id: 3, label: '3', color: '#10b981', x: 7.5, y: 65, isBall: false }, 
                { id: 4, label: '4', color: '#3b82f6', x: 7.5, y: 55, isBall: false }, 
                { id: 5, label: '5', color: '#8b5cf6', x: 7.5, y: 35, isBall: false }, 
                { id: 6, label: '🏀', color: 'none', x: 1, y: 50, isBall: true }
            ],
            highlight: [5],
            actions: [
                { type: 'pass', fromId: 1, toId: 5 }
            ]
        },
        { // Step 2: First Guard Cuts
            description: "First Guard (4) cuts to the corner (= Option 2 shot).",
            positions: [
                { id: 1, label: '1', color: '#ef4444', x: 1, y: 50, isBall: false }, 
                { id: 2, label: '2', color: '#f59e0b', x: 7.5, y: 75, isBall: false }, 
                { id: 3, label: '3', color: '#10b981', x: 7.5, y: 65, isBall: false }, 
                { id: 4, label: '4', color: '#3b82f6', x: 23, y: 15, isBall: false }, 
                { id: 5, label: '5', color: '#8b5cf6', x: 7.5, y: 35, isBall: false }, 
                { id: 6, label: '🏀', color: 'none', x: 1, y: 50, isBall: true }
            ],
            highlight: [4],
            actions: [
                { type: 'pass', fromId: 1, toId: 4 }
            ]
        },
        { // Step 3: Second Big/Guard Cuts and Safety
            description: "Second Big (3) cuts to the basket (= Option 3). Second Guard (2) cuts to the 3-point line as the safety.",
            positions: [
                { id: 1, label: '1', color: '#ef4444', x: 1, y: 50, isBall: false }, 
                { id: 2, label: '2', color: '#f59e0b', x: 40, y: 75, isBall: false }, 
                { id: 3, label: '3', color: '#10b981', x: 7.5, y: 50, isBall: false }, 
                { id: 4, label: '4', color: '#3b82f6', x: 23, y: 15, isBall: false }, 
                { id: 5, label: '5', color: '#8b5cf6', x: 7.5, y: 35, isBall: false }, 
                { id: 6, label: '🏀', color: 'none', x: 1, y: 50, isBall: true }
            ],
            highlight: [2, 3],
            actions: [
                { type: 'pass', fromId: 1, toId: 2 }
            ]
        },
        { // Step 4: Final Options (Ball passed to 2) - 2 now has ball
            description: "Ball is passed to the safety Guard (2). Big (5) sets a **screen** for Big (4) to cut to the basket.",
            positions: [
                { id: 1, label: '1', color: '#ef4444', x: 40, y: 50, isBall: false }, 
                { id: 2, label: '2', color: '#f59e0b', x: 40, y: 75, isBall: false }, 
                { id: 3, label: '3', color: '#10b981', x: 7.5, y: 50, isBall: false }, 
                { id: 4, label: '4', color: '#3b82f6', x: 7.5, y: 45, isBall: false }, 
                { id: 5, label: '5', color: '#8b5cf6', x: 23, y: 15, isBall: false }, 
                { id: 6, label: '🏀', color: 'none', x: 40.5, y: 75, isBall: true }
            ],
            highlight: [1, 2, 4, 5, 6],
            actions: [
                { type: 'screen', fromId: 5, toId: 4 } 
            ]
        }
    ],
    HighLow: [
         { // Step 0: Starting Position (Point Guard past the arc)
            description: "Initial Setup: Point Guard (1) at the high top, past the 3-point arc. Bigs (4 - High Post, 5 - Low Post).",
            positions: [
                { id: 1, label: '1', color: '#ef4444', x: 35, y: 50, isBall: false },
                { id: 2, label: '2', color: '#f59e0b', x: 25, y: 15, isBall: false }, 
                { id: 3, label: '3', color: '#10b981', x: 40, y: 85, isBall: false }, 
                { id: 4, label: '4', color: '#3b82f6', x: 20, y: 35, isBall: false }, 
                { id: 5, label: '5', color: '#8b5cf6', x: 7.5, y: 35, isBall: false }, 
                { id: 6, label: '🏀', color: 'none', x: 35.5, y: 50, isBall: true }
            ],
            highlight: [1, 6],
            actions: []
        },
        { // Step 1: Pass to High Post
            description: "1 passes to the High Post (4). 1 cuts to the corner. Low Post (5) sets up for the pass.",
            positions: [
                { id: 1, label: '1', color: '#ef4444', x: 23, y: 15, isBall: false }, 
                { id: 2, label: '2', color: '#f59e0b', x: 25, y: 15, isBall: false }, 
                { id: 3, label: '3', color: '#10b981', x: 40, y: 85, isBall: false }, 
                { id: 4, label: '4', color: '#3b82f6', x: 20, y: 35, isBall: false }, 
                { id: 5, label: '5', color: '#8b5cf6', x: 7.5, y: 35, isBall: false }, 
                { id: 6, label: '🏀', color: 'none', x: 20.5, y: 35, isBall: true }
            ],
            highlight: [1, 4, 6],
            actions: [
                { type: 'pass', fromId: 1, toId: 4 } 
            ]
        },
        { // Step 2: High/Low Action
            description: "High Post (4) passes (dumps) to the Low Post (5) for a quick finish.",
            positions: [
                { id: 1, label: '1', color: '#ef4444', x: 23, y: 15, isBall: false }, 
                { id: 2, label: '2', color: '#f59e0b', x: 25, y: 15, isBall: false }, 
                { id: 3, label: '3', color: '#10b981', x: 40, y: 85, isBall: false }, 
                { id: 4, label: '4', color: '#3b82f6', x: 20, y: 35, isBall: false }, 
                { id: 5, label: '5', color: '#8b5cf6', x: 7.5, y: 35, isBall: false }, 
                { id: 6, label: '🏀', color: 'none', x: 8, y: 35, isBall: true }
            ],
            highlight: [5, 6],
            actions: [
                { type: 'pass', fromId: 4, toId: 5 } 
            ]
        },
    ]
};

// --- Utility Functions ---

/**
 * Custom toast notification function (replaces alert()).
 */
function showToast(message, duration = 3000) {
    toastNotification.textContent = message;
    toastNotification.classList.add('opacity-100', 'visible');
    setTimeout(() => {
        toastNotification.classList.remove('opacity-100', 'visible');
    }, duration);
}

/**
 * Draws the 3-point lines based on NBA specifications.
 */
function refresh3pt() {
  const leftRimX = RIM_FROM_BASELINE_FT * SCALE;
  const rightRimX = (COURT_LENGTH_FT - RIM_FROM_BASELINE_FT) * SCALE;
  const cy = (COURT_WIDTH_FT / 2) * SCALE; // 250

  const sideLineLength = THREE_POINT_SIDE_FT * SCALE;
  const r = THREE_PT_RADIUS_FT * SCALE;
  const halfW = (COURT_WIDTH_FT * SCALE) / 2;

  // Left 3pt line
  const leftX_ArcStart = leftRimX + Math.sqrt(Math.max(0, r * r - sideLineLength * sideLineLength));
  const leftY_StraightEnd = halfW - sideLineLength;
  document.getElementById('left3pt').setAttribute('d', 
    `M 0 ${leftY_StraightEnd} L ${leftX_ArcStart} ${leftY_StraightEnd} A ${r} ${r} 0 0 1 ${leftX_ArcStart} ${halfW + sideLineLength} L 0 ${halfW + sideLineLength}`
  );
  
  // Right 3pt line
  const rightX_ArcStart = rightRimX - Math.sqrt(Math.max(0, r * r - sideLineLength * sideLineLength));
  const rightY_StraightEnd = halfW - sideLineLength;
  document.getElementById('right3pt').setAttribute('d', 
    `M 940 ${rightY_StraightEnd} L ${rightX_ArcStart} ${rightY_StraightEnd} A ${r} ${r} 0 0 0 ${rightX_ArcStart} ${halfW + sideLineLength} L 940 ${halfW + sideLineLength}`
  );
}

/**
 * Converts a player's ID and step data to its center coordinates in the 940x500 SVG ViewBox.
 * @param {object} player - The player's position object {id, x, y}.
 * @returns {{x: number, y: number}} SVG coordinates.
 */
function getSvgCoordinates(player) {
    // Player X is based on 0-100% of the 94ft court (940 units)
    const svgX = player.x * 9.4; 
    // Player Y is based on 0-100% of the 50ft court (500 units)
    const svgY = player.y * 5; 
    
    return { x: svgX, y: svgY }; 
}

/**
 * Initializes the lastStepPositions state based on the current step data.
 */
function initializePositions(stepData) {
    const initialPositions = {};
    stepData.positions.forEach(p => {
        initialPositions[p.id] = getSvgCoordinates(p);
    });
    lastStepPositions = initialPositions;
}

/**
 * Renders the current step, including token positions, movement lines, and explicit actions.
 */
function renderStep() {
    if (!currentPlay) return;

    const playData = PLAYBOOK[currentPlay];
    const stepData = playData[currentStepIndex];
    const currentPositions = {}; 
    
    // Remove old lines instantly
    actionLinesGroup.innerHTML = ''; 
    
    const tokens = courtInner.querySelectorAll('.token');
    const tokenMap = {};
    tokens.forEach(t => {
        const id = Number(t.dataset.id);
        tokenMap[id] = t;
        // Remove highlight class for tokens not involved in this step
        t.classList.remove('highlighted');
    });

    // 1. Calculate positions, draw movement/dribble lines, and update HTML positions
    stepData.positions.forEach(p => {
        const el = tokenMap[p.id];
        if (el) {
            const size = p.isBall ? ballBaseSize : playerBaseSize;
            const halfSize = size / 2;
            
            // Set the display position relative to the court size
            const displayX = isFullCourt ? p.x : p.x * 2;
            
            // Current SVG Coordinates
            const currentSvgCoords = getSvgCoordinates(p);
            
            // Check for movement from the LAST step
            const lastCoords = lastStepPositions[p.id];

            if (lastCoords && (lastCoords.x !== currentSvgCoords.x || lastCoords.y !== currentSvgCoords.y)) {
                
                const line = document.createElementNS("http://www.w3.org/2000/svg", 'line');
                line.classList.add('play-action-line', 'movement-line');
                line.setAttribute('x1', lastCoords.x);
                line.setAttribute('y1', lastCoords.y);
                line.setAttribute('x2', currentSvgCoords.x);
                line.setAttribute('y2', currentSvgCoords.y);

                if (p.id === 6) { 
                    // Dribble Line (Orange/Thick Dashed) - only for the Ball Token (ID 6)
                    line.setAttribute('stroke', '#f97316'); 
                    line.setAttribute('stroke-width', '4');
                    line.setAttribute('stroke-dasharray', '10, 5'); 
                } else {
                    // Cut/Movement Line (Grey/Dotted)
                    line.setAttribute('stroke', '#6b7280'); 
                    line.setAttribute('stroke-width', '3');
                    line.setAttribute('stroke-dasharray', '4, 4'); 
                }
                
                actionLinesGroup.appendChild(line);
            }

            // Set visual position (HTML Div)
            el.style.left = `calc(${displayX}% - ${halfSize}px)`;
            el.style.top = `calc(${p.y}% - ${halfSize}px)`;

            // Apply highlight
            if (stepData.highlight.includes(p.id)) {
                el.classList.add('highlighted');
            }
            
            // Store current position for the next step's calculation
            currentPositions[p.id] = currentSvgCoords;
        }
    });

    // 2. Explicit Action Generation (Passes and Screens)
    if (stepData.actions && stepData.actions.length > 0) {
        stepData.actions.forEach((action) => {
            const line = document.createElementNS("http://www.w3.org/2000/svg", 'line');
            line.classList.add('play-action-line', 'explicit-action');

            // Get SVG center coordinates for the source and target from current positions
            const fromPlayer = stepData.positions.find(p => p.id === action.fromId);
            const toPlayer = stepData.positions.find(p => p.id === action.toId);
            
            if (!fromPlayer || !toPlayer) return;

            const startCoords = getSvgCoordinates(fromPlayer);
            const endCoords = getSvgCoordinates(toPlayer);

            line.setAttribute('x1', startCoords.x);
            line.setAttribute('y1', startCoords.y);
            line.setAttribute('x2', endCoords.x);
            line.setAttribute('y2', endCoords.y);

            if (action.type === 'pass') {
                line.setAttribute('stroke', '#ef4444'); // Red for passes
                line.setAttribute('stroke-width', '4');
                line.setAttribute('stroke-dasharray', '12, 8'); 
            } else if (action.type === 'screen') {
                line.setAttribute('stroke', '#3b82f6'); // Blue for screens
                line.setAttribute('stroke-width', '6'); 
                line.setAttribute('stroke-dasharray', '0');
            }
            
            actionLinesGroup.appendChild(line);
        });
    }

    // 3. Update global state for next iteration
    lastStepPositions = currentPositions;

    // 4. Update instructions and button state
    playDescription.innerHTML = `<span class="font-bold text-indigo-700">Step ${currentStepIndex + 1} of ${playData.length}:</span> ${stepData.description}`;
    
    // Ensure buttons are only enabled once a play is loaded
    const playLoaded = !!currentPlay;
    playPauseButton.disabled = !playLoaded;
    nextButton.disabled = !playLoaded || currentStepIndex === playData.length - 1;
    prevButton.disabled = !playLoaded || currentStepIndex === 0;

    // If at the end of the play while animating, pause it
    if (currentStepIndex === playData.length - 1 && isPlaying) {
        togglePlayPause();
        showToast(`Play **${currentPlay}** complete! Reset to run again.`, 5000);
    }
}

/**
 * Toggles the play/pause state and controls the animation loop.
 */
function togglePlayPause() {
    if (!currentPlay) return;

    isPlaying = !isPlaying;
    
    if (isPlaying) {
        playPauseButton.classList.remove('pause-state');
        playPauseButton.classList.add('play-state');
        runAnimation();
    } else {
        playPauseButton.classList.remove('play-state');
        playPauseButton.classList.add('pause-state');
        clearTimeout(animationTimeout);
    }
}

/**
 * Recursive function to run the play automatically.
 */
function runAnimation() {
    if (!isPlaying) return;

    if (currentStepIndex < PLAYBOOK[currentPlay].length - 1) {
        // Move to next step after the duration of the current movement animation
        animationTimeout = setTimeout(() => {
            currentStepIndex++;
            renderStep();
            runAnimation(); 
        }, ANIMATION_DELAY); // Wait for the CSS transition to complete
    } else {
        // End of the play
        togglePlayPause();
    }
}


/**
 * Renders the player tokens onto the court DOM based on the current step's positions.
 */
function createTokens() {
  // Clear existing tokens
  courtInner.querySelectorAll('.token').forEach(t => t.remove());
  actionLinesGroup.innerHTML = ''; // Clear lines when resetting
  
  const initialPositions = currentPlay ? PLAYBOOK[currentPlay][0].positions : [];
  
  initialPositions.forEach(p => {
    const d = document.createElement('div');
    d.className = 'token' + (p.isBall ? ' ball' : '');
    d.textContent = p.label;
    d.dataset.id = p.id;
    if (!p.isBall) d.style.background = p.color;
    courtInner.appendChild(d);
  });
  
  // Initialize state for movement tracking before first render
  initializePositions(PLAYBOOK[currentPlay][0]);
  
  // Set initial positions for the loaded play (will redraw based on step 0)
  renderStep();
}

/**
 * Initializes a new play and resets to Step 0.
 */
function loadPlay(playName) {
    // Pause any running animation
    if (isPlaying) togglePlayPause();

    currentPlay = playName;
    currentStepIndex = 0;
    
    // Update tab styling
    document.querySelectorAll('.play-tab').forEach(tab => {
        if (tab.dataset.play === playName) {
            tab.classList.add('border-indigo-600', 'text-indigo-600');
            tab.classList.remove('border-transparent', 'text-gray-500');
        } else {
            tab.classList.remove('border-indigo-600', 'text-indigo-600');
            tab.classList.add('border-transparent', 'text-gray-500');
        }
    });

    // Set up initial state and render
    createTokens();
    showToast(`Play **${playName}** loaded.`);
}

// --- Event Listeners ---

// Play/Pause Button
playPauseButton.addEventListener('click', togglePlayPause);

// Toggle Button (Full/Half Court)
toggleButton.addEventListener('click', () => {
  // Pause animation if running
  if (isPlaying) togglePlayPause();

  const btn = document.getElementById('toggle');
  const svg = document.getElementById('courtSVG');
  
  if (isFullCourt) {
    // Full Court -> Half Court
    svg.setAttribute('viewBox','0 0 470 500'); // Crop to left half (0-470)
    document.getElementById('midLine').style.display = 'none';
    document.getElementById('midCircle').style.display = 'none';
    document.getElementById('rightEnd').style.display = 'none'; 
    btn.textContent = 'Toggle: Half Court → Full Court';
    isFullCourt = false;
  } else {
    // Half Court -> Full Court
    svg.setAttribute('viewBox','0 0 940 500'); // Full view (0-940)
    document.getElementById('midLine').style.display = '';
    document.getElementById('midCircle').style.display = '';
    document.getElementById('rightEnd').style.display = ''; 
    btn.textContent = 'Toggle: Full Court → Half Court';
    isFullCourt = true;
  }
  
  // Reset positions state to force correct rendering on new court size
  if (currentPlay) {
      initializePositions(PLAYBOOK[currentPlay][currentStepIndex]);
      renderStep();
  }
});

// Reset Play Button
document.getElementById('reset-play').addEventListener('click', () => {
    if (!currentPlay) {
        showToast("Please select a play first.");
        return;
    }
    if (isPlaying) togglePlayPause(); // Pause if running
    currentStepIndex = 0;
    initializePositions(PLAYBOOK[currentPlay][0]); // Reset starting point for movement
    renderStep();
    showToast(`Play **${currentPlay}** reset to Step 1.`);
});

// Previous Step Button
prevButton.addEventListener('click', () => {
    if (currentPlay && currentStepIndex > 0) {
        if (isPlaying) togglePlayPause(); // Pause if running
        currentStepIndex--;
        // To ensure smooth visual transition when moving backward, 
        // we must set the lastStepPositions to the step BEFORE the target step.
        const prevStepData = PLAYBOOK[currentPlay][currentStepIndex === 0 ? 0 : currentStepIndex - 1];
        initializePositions(prevStepData);
        renderStep();
    }
});

// Next Step Button
nextButton.addEventListener('click', () => {
    if (currentPlay && currentStepIndex < PLAYBOOK[currentPlay].length - 1) {
        if (isPlaying) togglePlayPause(); // Pause if running
        currentStepIndex++;
        renderStep();
    } else if (currentPlay) {
        showToast(`Play **${currentPlay}** complete! Reset to run again.`);
    } else {
        showToast("Please select a play first.");
    }
});

// Tab Handlers
document.querySelectorAll('.play-tab').forEach(tab => {
    tab.addEventListener('click', (e) => loadPlay(e.target.dataset.play));
});

// --- Initialization ---
window.onload = function() {
    refresh3pt();
    // Automatically load the first play (Motion) on start
    loadPlay('Motion');
};

window.addEventListener('resize', refresh3pt);

