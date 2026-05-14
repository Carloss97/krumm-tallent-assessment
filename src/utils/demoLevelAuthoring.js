const DEFAULT_TARGET_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export const pointKey = (point) => `${point.x},${point.y}`;

const parsePointKey = (key, label) => {
  const [xRaw, yRaw] = String(key).split(',');
  const x = Number(xRaw);
  const y = Number(yRaw);
  if (!Number.isInteger(x) || !Number.isInteger(y)) {
    throw new Error(`${label} must be a coordinate pair`);
  }
  return { x, y };
};

const normalizePoint = (value, label) => {
  if (typeof value === 'string') return parsePointKey(value, label);
  if (Array.isArray(value) && value.length >= 2) {
    const [x, y] = value.map(Number);
    if (Number.isInteger(x) && Number.isInteger(y)) return { x, y };
  }
  if (value && Number.isInteger(Number(value.x)) && Number.isInteger(Number(value.y))) {
    return { x: Number(value.x), y: Number(value.y) };
  }
  throw new Error(`${label} must be a coordinate pair`);
};

const assertPositiveGrid = (cols, rows) => {
  if (!Number.isInteger(cols) || cols <= 0) throw new Error('cols must be a positive integer');
  if (!Number.isInteger(rows) || rows <= 0) throw new Error('rows must be a positive integer');
};

const assertInBounds = (point, cols, rows, label) => {
  if (point.x < 0 || point.y < 0 || point.x >= cols || point.y >= rows) {
    throw new Error(`${label} outside level bounds (${cols}x${rows})`);
  }
};

const sortPointKeys = (a, b) => {
  const [ax, ay] = a.split(',').map(Number);
  const [bx, by] = b.split(',').map(Number);
  return ay - by || ax - bx;
};

const normalizeRect = (rect, label) => {
  if (!Array.isArray(rect) || rect.length < 4) {
    throw new Error(`${label} must be [x1, y1, x2, y2]`);
  }
  const [x1, y1, x2, y2] = rect.map(Number);
  if (![x1, y1, x2, y2].every(Number.isInteger)) {
    throw new Error(`${label} must contain integer coordinates`);
  }
  return {
    x1: Math.min(x1, x2),
    y1: Math.min(y1, y2),
    x2: Math.max(x1, x2),
    y2: Math.max(y1, y2),
  };
};

const addPointToSet = (set, point, cols, rows, label) => {
  assertInBounds(point, cols, rows, label);
  set.add(pointKey(point));
};

export const expandWallSpec = (wallSpec = {}, cols, rows, reservedPoints = []) => {
  assertPositiveGrid(cols, rows);
  const walls = new Set();
  const reserved = new Set(reservedPoints.map((point, index) => {
    const normalized = normalizePoint(point, `reserved ${index + 1}`);
    assertInBounds(normalized, cols, rows, `reserved ${index + 1}`);
    return pointKey(normalized);
  }));

  const spec = Array.isArray(wallSpec) ? { cells: wallSpec } : (wallSpec || {});
  const rects = spec.rects || spec.rectangles || spec.wallRects || [];
  const cells = spec.cells || spec.points || spec.wallCells || [];

  rects.forEach((rect, index) => {
    const { x1, y1, x2, y2 } = normalizeRect(rect, `wall rect ${index + 1}`);
    assertInBounds({ x: x1, y: y1 }, cols, rows, `wall rect ${index + 1}`);
    assertInBounds({ x: x2, y: y2 }, cols, rows, `wall rect ${index + 1}`);
    for (let y = y1; y <= y2; y += 1) {
      for (let x = x1; x <= x2; x += 1) {
        const key = `${x},${y}`;
        if (!reserved.has(key)) walls.add(key);
      }
    }
  });

  cells.forEach((cell, index) => {
    const point = normalizePoint(cell, `wall cell ${index + 1}`);
    addPointToSet(walls, point, cols, rows, `wall cell ${index + 1}`);
  });

  reserved.forEach((key) => walls.delete(key));
  return [...walls].sort(sortPointKeys);
};

const normalizeGridTarget = (target, index, cols, rows) => {
  const pickup = normalizePoint(target.pickup || target.at || { x: target.x, y: target.y }, `target ${index + 1} pickup`);
  const dropZone = normalizePoint(target.drop || target.dropZone || target.destination, `target ${index + 1} drop`);
  assertInBounds(pickup, cols, rows, `target ${index + 1} pickup`);
  assertInBounds(dropZone, cols, rows, `target ${index + 1} drop`);

  return {
    id: target.id ?? index + 1,
    x: pickup.x,
    y: pickup.y,
    color: target.color || DEFAULT_TARGET_COLORS[index % DEFAULT_TARGET_COLORS.length],
    points: Number.isFinite(Number(target.points)) ? Number(target.points) : 100,
    dropZone,
  };
};

export const createGridFlowLevel = (spec = {}) => {
  const cols = Number(spec.cols ?? spec.width);
  const rows = Number(spec.rows ?? spec.height);
  assertPositiveGrid(cols, rows);

  const startPos = normalizePoint(spec.start || spec.startPos || [0, 0], 'start');
  assertInBounds(startPos, cols, rows, 'start');

  const stations = (spec.stations || []).map((station, index) => {
    const point = normalizePoint(station, `station ${index + 1}`);
    assertInBounds(point, cols, rows, `station ${index + 1}`);
    return point;
  });

  const targets = (spec.targets || []).map((target, index) => normalizeGridTarget(target, index, cols, rows));
  const reserved = [
    startPos,
    ...stations,
    ...targets.flatMap((target) => [{ x: target.x, y: target.y }, target.dropZone]),
    ...(spec.reserved || []),
  ];
  const walls = expandWallSpec(spec.walls || { rects: spec.wallRects, cells: spec.wallCells }, cols, rows, reserved);

  return {
    ...(spec.name ? { name: spec.name } : {}),
    difficulty: spec.difficulty || 'easy',
    cols,
    rows,
    targets,
    stations,
    energyDrain: Number.isFinite(Number(spec.energyDrain)) ? Number(spec.energyDrain) : 0,
    timeLimit: Number.isFinite(Number(spec.timeLimit)) ? Number(spec.timeLimit) : 60,
    startPos,
    walls,
    ...(spec.randomizeTargets ? { randomizeTargets: true } : {}),
  };
};

const normalizeLaserObject = (object, index, cols, rows) => {
  const point = normalizePoint(object.at || { x: object.x, y: object.y }, `object ${index + 1}`);
  assertInBounds(point, cols, rows, `object ${index + 1}`);
  const { at, x, y, ...rest } = object;
  void at;
  void x;
  void y;
  return { x: point.x, y: point.y, ...rest };
};

const normalizePlacement = (placement, index, cols, rows) => {
  let from;
  let to;
  if (Array.isArray(placement)) {
    [from, to] = placement;
  } else {
    from = placement?.from;
    to = placement?.to;
  }
  const fromPoint = normalizePoint(from, `solution ${index + 1} from`);
  const toPoint = normalizePoint(to, `solution ${index + 1} to`);
  assertInBounds(fromPoint, cols, rows, `solution ${index + 1} from`);
  assertInBounds(toPoint, cols, rows, `solution ${index + 1} to`);
  return [pointKey(fromPoint), pointKey(toPoint)];
};

const assertNoDuplicateObjects = (objects) => {
  const seen = new Set();
  objects.forEach((object, index) => {
    const key = pointKey(object);
    if (seen.has(key)) throw new Error(`object ${index + 1} overlaps another object at ${key}`);
    seen.add(key);
  });
};

export const createLaserPuzzleLevel = (spec = {}) => {
  const cols = Number(spec.cols ?? spec.width);
  const rows = Number(spec.rows ?? spec.height);
  assertPositiveGrid(cols, rows);

  const objects = (spec.objects || spec.cells || [])
    .filter((cell) => cell?.type !== 'wall')
    .map((object, index) => normalizeLaserObject(object, index, cols, rows));
  assertNoDuplicateObjects(objects);

  const solutionPlacements = (spec.solution || spec.solutionPlacements || [])
    .map((placement, index) => normalizePlacement(placement, index, cols, rows));
  const solutionPoints = solutionPlacements.flatMap(([from, to]) => [from, to]);
  const reserved = [
    ...objects,
    ...solutionPoints,
    ...(spec.reserved || []),
  ];
  const wallKeys = expandWallSpec(spec.walls || { rects: spec.wallRects, cells: spec.wallCells }, cols, rows, reserved);
  const wallCells = wallKeys.map((key) => ({ ...parsePointKey(key, 'wall'), type: 'wall' }));
  const movableCount = objects.filter((object) => object.movable).length;

  return {
    ...(spec.name ? { name: spec.name } : {}),
    difficulty: spec.difficulty || 'easy',
    cols,
    rows,
    par: Number.isFinite(Number(spec.par)) ? Number(spec.par) : Math.max(1, solutionPlacements.length || movableCount || 1),
    timeLimit: Number.isFinite(Number(spec.timeLimit)) ? Number(spec.timeLimit) : 90,
    ...(spec.hint ? { hint: spec.hint } : {}),
    solutionPlacements,
    cells: [...wallCells, ...objects],
    quiz: spec.quiz || [],
  };
};

export const createDemoLevels = (kind, specs) => {
  if (!Array.isArray(specs)) throw new Error('level specs must be an array');
  if (kind === 'grid-flow') return specs.map(createGridFlowLevel);
  if (kind === 'laser-puzzle') return specs.map(createLaserPuzzleLevel);
  throw new Error(`Unsupported demo level kind: ${kind}`);
};

const parseCatalogInput = (catalogInput) => {
  if (typeof catalogInput === 'string') {
    try {
      return JSON.parse(catalogInput);
    } catch (error) {
      throw new Error(`level catalog JSON could not be parsed: ${error.message}`);
    }
  }

  if (!catalogInput || typeof catalogInput !== 'object' || Array.isArray(catalogInput)) {
    throw new Error('level catalog must be an object or JSON string');
  }

  return catalogInput;
};

const resolvePackSpecs = (packs, camelKey, kebabKey) => packs?.[camelKey] || packs?.[kebabKey] || [];

export const createDemoLevelPacks = (catalogInput = {}) => {
  const catalog = parseCatalogInput(catalogInput);
  const packs = catalog.levelPacks || catalog.packs || catalog;

  return {
    schemaVersion: Number(catalog.schemaVersion || catalog.version || 1),
    gridFlow: createDemoLevels('grid-flow', resolvePackSpecs(packs, 'gridFlow', 'grid-flow')),
    laserPuzzle: createDemoLevels('laser-puzzle', resolvePackSpecs(packs, 'laserPuzzle', 'laser-puzzle')),
  };
};
