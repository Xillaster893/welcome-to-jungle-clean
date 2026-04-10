import {
  GRID_SIZE,
  createInitialState,
  getCellType,
  getLevel,
  getTickInterval,
  queueDirection,
  stepGame,
  togglePause,
} from "./snakeLogic.js";
const biteSound = new Audio("/welcome-to-jungle-clean/assets/bite-crunch.wav");
const gameOverSound = new Audio("/welcome-to-jungle-clean/assets/gameover.wav");
let lastPlayedScore = 0;
let hasPlayedGameOver = false;

const boardElement = document.querySelector("#game-board");
const scoreElement = document.querySelector("#score");
const levelElement = document.querySelector("#level");
const highScoreElement = document.querySelector("#high-score");
const zoneNameElement = document.querySelector("#zone-name");
const statusElement = document.querySelector("#status");
const statusCardElement = document.querySelector(".status-card");
const shellElement = document.querySelector(".game-shell");
const soundButton = document.querySelector("#sound-button");
const pauseButton = document.querySelector("#pause-button");
const restartButton = document.querySelector("#restart-button");
const controlButtons = document.querySelectorAll("[data-direction]");
const leafLayerElement = document.querySelector("#leaf-layer");
const snakeLayerElement = document.querySelector("#snake-layer");
const trailLayerElement = document.querySelector("#trail-layer");
const atmosphereLayerElement = document.querySelector("#atmosphere-layer");
const celebrationElement = document.querySelector("#celebration");
const levelBannerElement = document.querySelector("#level-banner");
const startOverlayElement = document.querySelector("#start-overlay");
const overlayElement = document.querySelector("#game-overlay");
const overlayTitleElement = document.querySelector("#overlay-title");
const overlayMessageElement = document.querySelector("#overlay-message");

const DIRECTION_KEYS = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  W: "up",
  s: "down",
  S: "down",
  a: "left",
  A: "left",
  d: "right",
  D: "right",
};
const BOARD_PADDING = 8;
const CELL_GAP = 2;
const HIGH_SCORE_STORAGE_KEY = "snake-high-score";
const SOUND_STORAGE_KEY = "snake-sound-muted";
const LEAF_PARTICLE_COUNT = 10;
const THEME_LEVELS = [
  {
    minLevel: 1,
    zoneName: "Light Jungle",
    themeClass: "theme-light-jungle",
    variables: {
      "--bg-start": "#f7f3e7",
      "--bg-mid": "#ece5cf",
      "--bg-end": "#dfe7d2",
      "--panel": "rgba(244, 241, 222, 0.78)",
      "--panel-border": "rgba(88, 129, 87, 0.28)",
      "--text": "#243127",
      "--muted": "#647067",
      "--empty": "rgba(207, 200, 184, 0.7)",
      "--button": "#a3b18a",
      "--button-hover": "#afbc96",
      "--button-border": "rgba(58, 90, 64, 0.55)",
      "--snake": "#3a5a40",
      "--snake-head": "#5f8d4e",
      "--snake-fill-highlight": "#7ba16d",
      "--snake-fill-mid": "#4d7744",
      "--snake-head-highlight": "#8bb07d",
      "--trail-color": "rgba(95, 141, 78, 0.28)",
      "--snake-glow-soft": "rgba(95, 141, 78, 0.18)",
      "--snake-glow-mid": "rgba(95, 141, 78, 0.26)",
      "--snake-glow-strong": "rgba(95, 141, 78, 0.4)",
      "--food-glow": "rgba(216, 87, 79, 0.38)",
      "--board-tint": "rgba(88, 129, 87, 0.15)",
      "--atmosphere-opacity": "0.12",
      "--atmosphere-gradient": "radial-gradient(circle at top, rgba(255, 255, 255, 0.18), transparent 54%), linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(58, 90, 64, 0.02))",
      "--fog-secondary": "radial-gradient(circle at 25% 30%, rgba(255, 255, 255, 0.1), transparent 42%), radial-gradient(circle at 72% 68%, rgba(255, 255, 255, 0.06), transparent 36%)",
      "--leaf-opacity": "0.18",
      "--leaf-color": "rgba(88, 129, 87, 0.5)",
      "--leaf-highlight": "rgba(255, 255, 255, 0.26)",
      "--obstacle-highlight": "#9da18d",
      "--obstacle-fill": "#7c8070",
      "--obstacle-depth": "#626856",
      "--obstacle-shadow": "rgba(50, 66, 53, 0.18)",
    },
  },
  {
    minLevel: 3,
    zoneName: "Deep Jungle",
    themeClass: "theme-deep-jungle",
    variables: {
      "--bg-start": "#e9e5d6",
      "--bg-mid": "#d6d3bf",
      "--bg-end": "#c8d2c2",
      "--panel": "rgba(229, 226, 205, 0.8)",
      "--panel-border": "rgba(71, 101, 75, 0.34)",
      "--text": "#223027",
      "--muted": "#5d685f",
      "--empty": "rgba(177, 178, 160, 0.72)",
      "--button": "#96a786",
      "--button-hover": "#a5b594",
      "--button-border": "rgba(55, 82, 60, 0.58)",
      "--snake": "#314d38",
      "--snake-head": "#527d4c",
      "--snake-fill-highlight": "#73946b",
      "--snake-fill-mid": "#456b42",
      "--snake-head-highlight": "#88a67b",
      "--trail-color": "rgba(82, 125, 76, 0.28)",
      "--snake-glow-soft": "rgba(82, 125, 76, 0.2)",
      "--snake-glow-mid": "rgba(82, 125, 76, 0.3)",
      "--snake-glow-strong": "rgba(82, 125, 76, 0.44)",
      "--food-glow": "rgba(202, 96, 84, 0.36)",
      "--board-tint": "rgba(62, 93, 70, 0.22)",
      "--atmosphere-opacity": "0.22",
      "--atmosphere-gradient": "radial-gradient(circle at 50% 18%, rgba(255, 255, 255, 0.1), transparent 48%), linear-gradient(180deg, rgba(33, 52, 39, 0.02), rgba(33, 52, 39, 0.16))",
      "--fog-secondary": "radial-gradient(circle at 20% 30%, rgba(231, 236, 226, 0.1), transparent 36%), radial-gradient(circle at 78% 66%, rgba(231, 236, 226, 0.08), transparent 34%)",
      "--leaf-opacity": "0.22",
      "--leaf-color": "rgba(76, 108, 79, 0.52)",
      "--leaf-highlight": "rgba(255, 255, 255, 0.22)",
      "--obstacle-highlight": "#858d7a",
      "--obstacle-fill": "#69725f",
      "--obstacle-depth": "#535b4d",
      "--obstacle-shadow": "rgba(38, 53, 42, 0.22)",
    },
  },
  {
    minLevel: 5,
    zoneName: "Dense Jungle",
    themeClass: "theme-dense-jungle",
    variables: {
      "--bg-start": "#dde0d2",
      "--bg-mid": "#c6cbba",
      "--bg-end": "#aeb9af",
      "--panel": "rgba(208, 214, 196, 0.8)",
      "--panel-border": "rgba(55, 82, 60, 0.38)",
      "--text": "#1f2b24",
      "--muted": "#55615a",
      "--empty": "rgba(146, 156, 143, 0.74)",
      "--button": "#8ea183",
      "--button-hover": "#9eb090",
      "--button-border": "rgba(45, 69, 50, 0.62)",
      "--snake": "#294333",
      "--snake-head": "#4d7d4d",
      "--snake-fill-highlight": "#6c9967",
      "--snake-fill-mid": "#3d6541",
      "--snake-head-highlight": "#89b184",
      "--trail-color": "rgba(90, 145, 88, 0.32)",
      "--snake-glow-soft": "rgba(90, 145, 88, 0.24)",
      "--snake-glow-mid": "rgba(90, 145, 88, 0.36)",
      "--snake-glow-strong": "rgba(90, 145, 88, 0.52)",
      "--food-glow": "rgba(201, 103, 82, 0.4)",
      "--board-tint": "rgba(42, 66, 50, 0.28)",
      "--atmosphere-opacity": "0.3",
      "--atmosphere-gradient": "radial-gradient(circle at 50% 12%, rgba(214, 224, 210, 0.08), transparent 40%), linear-gradient(180deg, rgba(29, 44, 34, 0.08), rgba(29, 44, 34, 0.24))",
      "--fog-secondary": "radial-gradient(circle at 18% 24%, rgba(217, 227, 213, 0.1), transparent 34%), radial-gradient(circle at 76% 72%, rgba(217, 227, 213, 0.08), transparent 32%)",
      "--leaf-opacity": "0.24",
      "--leaf-color": "rgba(64, 97, 67, 0.54)",
      "--leaf-highlight": "rgba(255, 255, 255, 0.2)",
      "--obstacle-highlight": "#73806d",
      "--obstacle-fill": "#586452",
      "--obstacle-depth": "#434d3f",
      "--obstacle-shadow": "rgba(29, 43, 34, 0.26)",
    },
  },
  {
    minLevel: 7,
    zoneName: "Night Jungle",
    themeClass: "theme-night-jungle",
    variables: {
      "--bg-start": "#1f2b2b",
      "--bg-mid": "#172022",
      "--bg-end": "#101618",
      "--panel": "rgba(25, 37, 34, 0.82)",
      "--panel-border": "rgba(83, 123, 98, 0.3)",
      "--text": "#edf4ec",
      "--muted": "#9fb3a6",
      "--empty": "rgba(57, 72, 66, 0.8)",
      "--button": "#516a57",
      "--button-hover": "#627a68",
      "--button-border": "rgba(118, 166, 134, 0.42)",
      "--snake": "#4d815f",
      "--snake-head": "#89c07e",
      "--snake-fill-highlight": "#a7d39c",
      "--snake-fill-mid": "#6aa173",
      "--snake-head-highlight": "#c3ebb6",
      "--trail-color": "rgba(137, 192, 126, 0.34)",
      "--snake-glow-soft": "rgba(137, 192, 126, 0.28)",
      "--snake-glow-mid": "rgba(137, 192, 126, 0.42)",
      "--snake-glow-strong": "rgba(137, 192, 126, 0.64)",
      "--food-glow": "rgba(238, 121, 98, 0.46)",
      "--board-tint": "rgba(25, 42, 36, 0.44)",
      "--atmosphere-opacity": "0.44",
      "--atmosphere-gradient": "radial-gradient(circle at 50% 6%, rgba(121, 173, 134, 0.08), transparent 36%), linear-gradient(180deg, rgba(8, 12, 15, 0.16), rgba(8, 12, 15, 0.42))",
      "--fog-secondary": "radial-gradient(circle at 22% 22%, rgba(129, 168, 139, 0.1), transparent 30%), radial-gradient(circle at 74% 70%, rgba(129, 168, 139, 0.08), transparent 28%)",
      "--leaf-opacity": "0.2",
      "--leaf-color": "rgba(108, 149, 118, 0.46)",
      "--leaf-highlight": "rgba(214, 243, 208, 0.18)",
      "--obstacle-highlight": "#5d6a63",
      "--obstacle-fill": "#46534c",
      "--obstacle-depth": "#303a35",
      "--obstacle-shadow": "rgba(11, 18, 16, 0.32)",
    },
  },
];

let state = createInitialState();
let timerId = null;
let highScore = loadHighScore();
let activeTickMs = getTickInterval(state.score);
let lastStatusMessage = "";
let lastOverlayTitle = "";
let lastOverlayMessage = "";
let isMuted = loadSoundMuted();
let boardMetrics = measureBoard();
let visualFromSnake = cloneSnake(state.snake);
let visualToSnake = cloneSnake(state.snake);
let currentVisualSnake = cloneSnake(state.snake);
let visualTransitionStartedAt = performance.now();
let visualTransitionDuration = activeTickMs;
let visualFrameId = null;
let sessionBestTarget = highScore;
let hasCelebratedBestThisRun = false;
let lastLevelShown = getLevel(state.score);
let activeThemeClass = "";

createBoard();
createLeafParticles();
updateSoundButton();
applyThemeForLevel(getLevel(state.score));
render();
startLoop();
syncVisualState(state.snake);
requestVisualFrame();
window.addEventListener("resize", handleBoardResize);
window.requestAnimationFrame(handleBoardResize);

document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    state = togglePause(state);
    render();
    return;
  }

  const direction = DIRECTION_KEYS[event.key];
  if (!direction) {
    return;
  }

  event.preventDefault();
  state = queueDirection(state, direction);
  render();
});

soundButton.addEventListener("click", () => {
  isMuted = !isMuted;
  persistSoundMuted();
  updateSoundButton();
});

pauseButton.addEventListener("click", () => {
  state = togglePause(state);
  render();
});

restartButton.addEventListener("click", () => {
  state = createInitialState();
  syncHighScore();
  syncVisualState(state.snake);
  trailLayerElement.replaceChildren();
  celebrationElement.setAttribute("aria-hidden", "true");
  levelBannerElement.setAttribute("aria-hidden", "true");
  sessionBestTarget = highScore;
  hasCelebratedBestThisRun = false;
  lastLevelShown = getLevel(state.score);
  render();
  updateLoopSpeed();
});

controlButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state = queueDirection(state, button.dataset.direction);
    render();
  });
});

function createBoard() {
  const fragment = document.createDocumentFragment();

  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.x = String(x);
      cell.dataset.y = String(y);
      fragment.append(cell);
    }
  }

  boardElement.insertBefore(fragment, overlayElement);
}

function startLoop() {
  stopLoop();
  activeTickMs = getTickInterval(state.score);
  timerId = window.setInterval(() => {
    const previousState = state;
    const stepDuration = activeTickMs;

    state = stepGame(state);
    if (state === previousState) {
      return;
    }

    beginVisualTransition(previousState, state, stepDuration);
    emitTrail(previousState.snake);

    if (getLevel(state.score) > getLevel(previousState.score)) {
      showLevelBanner(getLevel(state.score));
    }

    syncHighScore();
    if (!hasCelebratedBestThisRun && state.score > sessionBestTarget) {
      hasCelebratedBestThisRun = true;
      celebrateHighScore();
    }

    updateLoopSpeed();
    render();
  }, activeTickMs);
}

function stopLoop() {
  if (timerId !== null) {
    window.clearInterval(timerId);
    timerId = null;
  }
}

function render() {
  const cells = boardElement.querySelectorAll(".cell");

  for (let index = 0; index < cells.length; index += 1) {
    const cell = cells[index];
    const x = Number(cell.dataset.x);
    const y = Number(cell.dataset.y);
    const type = getCellType(state, x, y);
    cell.className = `cell${
      type === "food" ? " food" : type === "obstacle" ? " obstacle" : ""
    }`;
  }

  if (state.score > lastPlayedScore) {
  biteSound.currentTime = 0;
  biteSound.play().catch(() => {});
  lastPlayedScore = state.score;
}

if (state.score === 0) {
  lastPlayedScore = 0;
  hasPlayedGameOver = false;
}

scoreElement.textContent = String(state.score);
  levelElement.textContent = String(getLevel(state.score));
  highScoreElement.textContent = String(highScore);
  zoneNameElement.textContent = getThemeForLevel(getLevel(state.score)).zoneName;
  soundButton.textContent = isMuted ? "Sound Off" : "Sound On";
  soundButton.setAttribute("aria-pressed", isMuted ? "true" : "false");
  pauseButton.textContent = state.isPaused ? "Resume" : "Pause";
  pauseButton.disabled = !state.isStarted || state.isGameOver;
  shellElement.classList.toggle("is-active", state.isStarted && !state.isPaused && !state.isGameOver);
  shellElement.classList.toggle("is-game-over", state.isGameOver);
  statusCardElement.classList.toggle("is-paused", state.isPaused);
  boardElement.classList.toggle("is-running", state.isStarted && !state.isPaused && !state.isGameOver);
  atmosphereLayerElement.classList.toggle("is-running", state.isStarted && !state.isPaused && !state.isGameOver);
  startOverlayElement.classList.toggle("is-visible", !state.isStarted && !state.isGameOver);
  startOverlayElement.setAttribute(
    "aria-hidden",
    !state.isStarted && !state.isGameOver ? "false" : "true",
  );
  overlayElement.classList.toggle("is-visible", state.isGameOver);
  overlayElement.setAttribute("aria-hidden", state.isGameOver ? "false" : "true");

  if (state.isGameOver) {
    if (!hasPlayedGameOver) {
      gameOverSound.currentTime = 0;
      gameOverSound.play().catch(() => {});
      hasPlayedGameOver = true;
    }

    const didClearBoard = state.food === null;
    const isNewHighScore = state.score === highScore && state.score > 0;
    setStatusMessage(didClearBoard
      ? "You filled the board. That round was spotless."
      : "Crash detected. Tap Restart and chase a bigger run.");
    setOverlayCopy(
      didClearBoard ? "Board Cleared" : "Run Over",
      isNewHighScore
      ? `New high score: ${highScore}. Press Restart to play again.`
      : `Score ${state.score}. High score ${highScore}. Press Restart to try again.`,
    );
  } else if (!state.isStarted) {
    setStatusMessage("Press any arrow key or WASD to launch the run.");
    setOverlayCopy("", "");
  } else if (state.isPaused) {
    setStatusMessage("Paused. Press Space or Resume when you are ready.");
    setOverlayCopy("", "");
  } else {
    setStatusMessage(`Level ${getLevel(state.score)}. Collect food and stay clear of walls.`);
    setOverlayCopy("", "");
  }

  applyThemeForLevel(getLevel(state.score));
}

function updateLoopSpeed() {
  const nextTickMs = getTickInterval(state.score);
  if (nextTickMs === activeTickMs || timerId === null) {
    return;
  }

  startLoop();
}

function syncHighScore() {
  if (state.score <= highScore) {
    return;
  }

  highScore = state.score;
  try {
    window.localStorage.setItem(HIGH_SCORE_STORAGE_KEY, String(highScore));
  } catch {
    // Ignore storage failures and keep the in-memory high score.
  }
}

function loadHighScore() {
  try {
    const storedValue = window.localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
    const parsedValue = Number.parseInt(storedValue ?? "", 10);
    return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : 0;
  } catch {
    return 0;
  }
}

function loadSoundMuted() {
  try {
    return window.localStorage.getItem(SOUND_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function persistSoundMuted() {
  try {
    window.localStorage.setItem(SOUND_STORAGE_KEY, String(isMuted));
  } catch {
    // Ignore storage failures and keep the in-memory setting.
  }
}

function showLevelBanner(level) {
  if (level <= lastLevelShown) {
    return;
  }

  lastLevelShown = level;
  levelBannerElement.textContent = `Level ${level}`;
  retriggerTransition(levelBannerElement, "is-active");
  levelBannerElement.setAttribute("aria-hidden", "false");
  window.setTimeout(() => {
    levelBannerElement.setAttribute("aria-hidden", "true");
  }, 1400);
}

function setStatusMessage(message) {
  if (message === lastStatusMessage) {
    return;
  }

  lastStatusMessage = message;
  statusElement.textContent = message;
  retriggerTransition(statusCardElement, "is-refreshing");
}

function setOverlayCopy(title, message) {
  if (title !== lastOverlayTitle) {
    lastOverlayTitle = title;
    overlayTitleElement.textContent = title;
  }

  if (message !== lastOverlayMessage) {
    lastOverlayMessage = message;
    overlayMessageElement.textContent = message;
  }
}

function retriggerTransition(element, className) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}

function updateSoundButton() {
  soundButton.classList.toggle("is-muted", isMuted);
  soundButton.textContent = isMuted ? "Sound Off" : "Sound On";
  soundButton.setAttribute("aria-pressed", isMuted ? "true" : "false");
}

function getThemeForLevel(level) {
  let activeTheme = THEME_LEVELS[0];

  for (let index = 0; index < THEME_LEVELS.length; index += 1) {
    if (level >= THEME_LEVELS[index].minLevel) {
      activeTheme = THEME_LEVELS[index];
    }
  }

  return activeTheme;
}

function applyThemeForLevel(level) {
  const theme = getThemeForLevel(level);
  const rootStyle = document.documentElement.style;

  if (activeThemeClass && activeThemeClass !== theme.themeClass) {
    shellElement.classList.remove(activeThemeClass);
    boardElement.classList.remove(activeThemeClass);
  }

  activeThemeClass = theme.themeClass;
  shellElement.classList.add(theme.themeClass);
  boardElement.classList.add(theme.themeClass);

  const variableEntries = Object.entries(theme.variables);
  for (let index = 0; index < variableEntries.length; index += 1) {
    const [name, value] = variableEntries[index];
    rootStyle.setProperty(name, value);
  }
}

function createLeafParticles() {
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < LEAF_PARTICLE_COUNT; index += 1) {
    const particle = document.createElement("div");
    particle.className = "leaf-particle";
    particle.style.left = `${8 + Math.random() * 82}%`;
    particle.style.top = `${6 + Math.random() * 82}%`;
    particle.style.setProperty("--leaf-scale", (0.65 + Math.random() * 0.7).toFixed(2));
    particle.style.setProperty("--leaf-duration", `${12 + Math.random() * 10}s`);
    particle.style.setProperty("--leaf-delay", `${Math.random() * -10}s`);
    particle.style.setProperty("--leaf-drift", `${8 + Math.random() * 16}px`);
    particle.style.setProperty("--leaf-rotate", `${-18 + Math.random() * 36}deg`);
    fragment.append(particle);
  }

  leafLayerElement.append(fragment);
}

function cloneSnake(snake) {
  return snake.map((segment) => ({ ...segment }));
}

function syncVisualState(snake) {
  const clone = cloneSnake(snake);
  visualFromSnake = clone;
  visualToSnake = cloneSnake(snake);
  currentVisualSnake = cloneSnake(snake);
  visualTransitionStartedAt = performance.now();
  visualTransitionDuration = activeTickMs;
  renderSnake(clone);
}

function beginVisualTransition(previousState, nextState, duration) {
  visualFromSnake = cloneSnake(previousState.snake);
  visualToSnake = cloneSnake(nextState.snake);
  currentVisualSnake = cloneSnake(previousState.snake);
  visualTransitionStartedAt = performance.now();
  visualTransitionDuration = duration;
  requestVisualFrame();
}

function requestVisualFrame() {
  if (visualFrameId !== null) {
    return;
  }

  visualFrameId = window.requestAnimationFrame(stepVisualFrame);
}

function stepVisualFrame(now) {
  visualFrameId = null;
  const duration = Math.max(80, visualTransitionDuration);
  const progress = Math.min((now - visualTransitionStartedAt) / duration, 1);
  const interpolatedSnake = visualToSnake.map((segment, index) => {
    const fromSegment = visualFromSnake[index] ?? visualFromSnake[visualFromSnake.length - 1] ?? segment;
    return {
      x: interpolate(fromSegment.x, segment.x, progress),
      y: interpolate(fromSegment.y, segment.y, progress),
    };
  });

  currentVisualSnake = interpolatedSnake;
  renderSnake(interpolatedSnake);

  if (progress < 1) {
    requestVisualFrame();
  }
}

function renderSnake(snake) {
  snakeLayerElement.replaceChildren();

  snake.forEach((segment, index) => {
    const segmentElement = document.createElement("div");
    const position = getPixelPosition(segment);

    segmentElement.className = index === 0 ? "snake-segment snake-segment-head" : "snake-segment";
    segmentElement.style.width = `${boardMetrics.cellSize}px`;
    segmentElement.style.height = `${boardMetrics.cellSize}px`;
    segmentElement.style.transform = `translate(${position.x}px, ${position.y}px) scale(${index === 0 ? 1.04 : Math.max(0.9, 0.99 - index * 0.01)})`;
    segmentElement.style.opacity = `${Math.max(0.38, 1 - index * 0.08)}`;
    snakeLayerElement.append(segmentElement);
  });
}

function emitTrail(previousSnake) {
  previousSnake.slice(0, 6).forEach((segment, index) => {
    const trailElement = document.createElement("div");
    const position = getPixelPosition(segment);

    trailElement.className = "trail-segment";
    trailElement.style.width = `${boardMetrics.cellSize}px`;
    trailElement.style.height = `${boardMetrics.cellSize}px`;
    trailElement.style.transform = `translate(${position.x}px, ${position.y}px) scale(${1 - index * 0.04})`;
    trailElement.style.opacity = `${Math.max(0.08, 0.22 - index * 0.025)}`;
    trailElement.addEventListener("animationend", () => {
      trailElement.remove();
    });
    trailLayerElement.append(trailElement);
  });
}

function getPixelPosition(segment) {
  return {
    x: BOARD_PADDING + segment.x * (boardMetrics.cellSize + CELL_GAP),
    y: BOARD_PADDING + segment.y * (boardMetrics.cellSize + CELL_GAP),
  };
}

function measureBoard() {
  const boardSize = boardElement.clientWidth || 0;
  const innerBoardSize = Math.max(0, boardSize - BOARD_PADDING * 2);
  const cellSize = (innerBoardSize - CELL_GAP * (GRID_SIZE - 1)) / GRID_SIZE;

  return {
    cellSize: Math.max(0, cellSize),
  };
}

function handleBoardResize() {
  boardMetrics = measureBoard();
  renderSnake(currentVisualSnake);
}

function interpolate(start, end, progress) {
  return start + (end - start) * progress;
}

function celebrateHighScore() {
  retriggerTransition(celebrationElement, "is-active");
  celebrationElement.setAttribute("aria-hidden", "false");
  window.setTimeout(() => {
    celebrationElement.setAttribute("aria-hidden", "true");
  }, 1500);
}

window.addEventListener("beforeunload", stopLoop);
