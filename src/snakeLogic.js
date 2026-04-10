export const GRID_SIZE = 16;
export const INITIAL_DIRECTION = "right";
export const INITIAL_TICK_MS = 140;
export const MIN_TICK_MS = 70;
export const SCORE_SPEED_STEP_MS = 1.35;
export const POINTS_PER_LEVEL = 5;
export const LEVEL_SPEED_STEP_MS = 1.75;
export const LEVEL_CURVE_BOOST_MS = 2;
export const OBSTACLE_START_LEVEL = 4;
export const MAX_OBSTACLES = 4;
export const EARLY_FOOD_SAFE_MARGIN = 2;
export const MID_FOOD_SAFE_MARGIN = 1;

const DIRECTION_VECTORS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE_DIRECTIONS = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

export function createInitialState(random = Math.random) {
  const middle = Math.floor(GRID_SIZE / 2);
  const snake = [
    { x: middle, y: middle },
    { x: middle - 1, y: middle },
    { x: middle - 2, y: middle },
  ];

  return {
    gridSize: GRID_SIZE,
    snake,
    obstacles: [],
    direction: INITIAL_DIRECTION,
    pendingDirection: INITIAL_DIRECTION,
    food: placeFood(snake, GRID_SIZE, random, [], 1),
    score: 0,
    isStarted: false,
    isPaused: false,
    isGameOver: false,
  };
}

export function getLevel(score) {
  return Math.floor(score / POINTS_PER_LEVEL) + 1;
}

export function getTickInterval(score) {
  const level = getLevel(score);
  const scoreReduction = score * SCORE_SPEED_STEP_MS;
  const levelReduction =
    (level - 1) * LEVEL_SPEED_STEP_MS +
    Math.sqrt(Math.max(0, level - 1)) * LEVEL_CURVE_BOOST_MS;

  return Math.max(
    MIN_TICK_MS,
    Math.round(INITIAL_TICK_MS - scoreReduction - levelReduction),
  );
}

export function getObstacleTarget(level) {
  if (level < OBSTACLE_START_LEVEL) {
    return 0;
  }

  return Math.min(MAX_OBSTACLES, Math.floor((level - 2) / 2));
}

export function queueDirection(state, nextDirection) {
  if (!DIRECTION_VECTORS[nextDirection] || state.isGameOver) {
    return state;
  }

  const activeDirection = state.pendingDirection ?? state.direction;
  if (OPPOSITE_DIRECTIONS[activeDirection] === nextDirection) {
    return state;
  }

  return {
    ...state,
    isStarted: true,
    pendingDirection: nextDirection,
  };
}

export function togglePause(state) {
  if (!state.isStarted || state.isGameOver) {
    return state;
  }

  return {
    ...state,
    isPaused: !state.isPaused,
  };
}

export function stepGame(state, random = Math.random) {
  if (!state.isStarted || state.isPaused || state.isGameOver) {
    return state;
  }

  const direction = state.pendingDirection ?? state.direction;
  const movement = DIRECTION_VECTORS[direction];
  const nextHead = {
    x: state.snake[0].x + movement.x,
    y: state.snake[0].y + movement.y,
  };
  const ateFood =
    state.food !== null &&
    nextHead.x === state.food.x &&
    nextHead.y === state.food.y;
  const collisionBody = ateFood ? state.snake : state.snake.slice(0, -1);

  if (
    hitsBoundary(nextHead, state.gridSize) ||
    hitsSnake(nextHead, collisionBody) ||
    hitsObstacle(nextHead, state.obstacles)
  ) {
    return {
      ...state,
      direction,
      pendingDirection: direction,
      isGameOver: true,
    };
  }

  const nextSnake = [nextHead, ...state.snake];
  if (!ateFood) {
    nextSnake.pop();
  }
  const nextScore = ateFood ? state.score + 1 : state.score;
  const nextLevel = getLevel(nextScore);
  const nextObstacles = ateFood
    ? generateObstaclesForLevel(
      {
        ...state,
        snake: nextSnake,
        score: nextScore,
      },
      nextLevel,
      random,
    )
    : state.obstacles;
  const nextFood = ateFood
    ? placeFood(nextSnake, state.gridSize, random, nextObstacles, nextLevel)
    : state.food;

  return {
    ...state,
    snake: nextSnake,
    obstacles: nextObstacles,
    direction,
    pendingDirection: direction,
    food: nextFood,
    score: nextScore,
    isGameOver: ateFood && nextFood === null,
  };
}

export function generateObstaclesForLevel(state, level, random = Math.random) {
  const targetCount = getObstacleTarget(level);
  if (targetCount <= state.obstacles.length) {
    return state.obstacles;
  }

  const obstacles = [...state.obstacles];
  const head = state.snake[0];
  const middle = Math.floor(state.gridSize / 2);

  const candidates = [];
  for (let y = 0; y < state.gridSize; y += 1) {
    for (let x = 0; x < state.gridSize; x += 1) {
      if (
        state.snake.some((segment) => segment.x === x && segment.y === y) ||
        obstacles.some((obstacle) => obstacle.x === x && obstacle.y === y) ||
        (state.food && state.food.x === x && state.food.y === y)
      ) {
        continue;
      }

      if (
        Math.abs(x - head.x) + Math.abs(y - head.y) <= 2 ||
        (Math.abs(x - middle) <= 2 && Math.abs(y - middle) <= 2)
      ) {
        continue;
      }

      candidates.push({ x, y });
    }
  }

  shuffleInPlace(candidates, random);

  for (let index = 0; index < candidates.length; index += 1) {
    if (obstacles.length >= targetCount) {
      break;
    }

    const candidate = candidates[index];
    const nextObstacles = [...obstacles, candidate];
    if (
      !hasPathToTarget(
        state.gridSize,
        state.snake[0],
        state.food,
        state.snake,
        nextObstacles,
      )
    ) {
      continue;
    }

    obstacles.push(candidate);
  }

  return obstacles;
}

export function placeFood(
  snake,
  gridSize,
  random = Math.random,
  obstacles = [],
  level = 1,
) {
  const openCells = [];

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      if (
        !snake.some((segment) => segment.x === x && segment.y === y) &&
        !obstacles.some((obstacle) => obstacle.x === x && obstacle.y === y)
      ) {
        openCells.push({ x, y });
      }
    }
  }

  if (openCells.length === 0) {
    return null;
  }

  const reachableCells = openCells.filter((cell) =>
    hasPathToTarget(gridSize, snake[0], cell, snake, obstacles),
  );
  const candidates = reachableCells.length > 0 ? reachableCells : openCells;
  const preferredCandidates = getPreferredFoodCells(candidates, gridSize, level);
  const selectionPool = preferredCandidates.length > 0 ? preferredCandidates : candidates;
  const index = Math.floor(random() * selectionPool.length);
  return selectionPool[index];
}

export function getCellType(state, x, y) {
  if (state.food && state.food.x === x && state.food.y === y) {
    return "food";
  }

  if (state.obstacles.some((obstacle) => obstacle.x === x && obstacle.y === y)) {
    return "obstacle";
  }

  const segmentIndex = state.snake.findIndex(
    (segment) => segment.x === x && segment.y === y,
  );

  if (segmentIndex === 0) {
    return "head";
  }

  if (segmentIndex > 0) {
    return "snake";
  }

  return "empty";
}

function hitsBoundary(position, gridSize) {
  return (
    position.x < 0 ||
    position.y < 0 ||
    position.x >= gridSize ||
    position.y >= gridSize
  );
}

function hitsSnake(position, snake) {
  return snake.some((segment) => segment.x === position.x && segment.y === position.y);
}

function hitsObstacle(position, obstacles) {
  return obstacles.some((obstacle) => obstacle.x === position.x && obstacle.y === position.y);
}

function hasPathToTarget(gridSize, start, target, snake, obstacles) {
  if (target === null) {
    return true;
  }

  const blocked = new Set(
    snake.slice(1).map((segment) => `${segment.x},${segment.y}`),
  );
  obstacles.forEach((obstacle) => blocked.add(`${obstacle.x},${obstacle.y}`));

  const queue = [start];
  const visited = new Set([`${start.x},${start.y}`]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (current.x === target.x && current.y === target.y) {
      return true;
    }

    for (const movement of Object.values(DIRECTION_VECTORS)) {
      const nextPosition = {
        x: current.x + movement.x,
        y: current.y + movement.y,
      };
      const key = `${nextPosition.x},${nextPosition.y}`;

      if (
        hitsBoundary(nextPosition, gridSize) ||
        blocked.has(key) ||
        visited.has(key)
      ) {
        continue;
      }

      visited.add(key);
      queue.push(nextPosition);
    }
  }

  return false;
}

function shuffleInPlace(items, random) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = items[index];
    items[index] = items[swapIndex];
    items[swapIndex] = current;
  }
}

function getPreferredFoodCells(cells, gridSize, level) {
  if (level <= 3) {
    return cells.filter((cell) =>
      isWithinSafeMargin(cell, gridSize, EARLY_FOOD_SAFE_MARGIN),
    );
  }

  if (level <= 6) {
    return cells.filter((cell) =>
      isWithinSafeMargin(cell, gridSize, MID_FOOD_SAFE_MARGIN),
    );
  }

  return cells;
}

function isWithinSafeMargin(cell, gridSize, margin) {
  return (
    cell.x >= margin &&
    cell.y >= margin &&
    cell.x < gridSize - margin &&
    cell.y < gridSize - margin
  );
}
