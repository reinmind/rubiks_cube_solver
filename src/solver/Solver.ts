// Worker loader that creates an inline worker with cube.js
// This avoids CORS and strict mode issues

import { Move, FaceName, CubeState, Solution, CubeColor } from '../types/cube';

// 颜色到面的映射
const COLOR_TO_FACE: Record<CubeColor, string> = {
  yellow: 'U', white: 'D', orange: 'L', red: 'R', blue: 'F', green: 'B',
};

// 将魔方状态转换为 cubejs 格式字符串
function stateToCubeString(state: CubeState): string {
  const faceOrder: FaceName[] = ['U', 'R', 'F', 'D', 'L', 'B'];
  let result = '';
  for (const face of faceOrder) {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const color = state[face][row][col];
        result += COLOR_TO_FACE[color];
      }
    }
  }
  return result;
}

// Worker 代码
const workerCode = `
console.log('[Worker] Worker started');

// 变量必须先声明
let solverInitialized = false;
let Cube = null;

self.onmessage = async (e) => {
  console.log('[Worker] Received message:', e.data.type);
  const { type, data } = e.data;

  if (type === 'init') {
    if (solverInitialized) {
      self.postMessage({ type: 'ready' });
      return;
    }

    try {
      const { cubeCode } = data;
      console.log('[Worker] Received cube.js code, length:', cubeCode?.length);

      self.postMessage({ type: 'status', message: '初始化求解器...' });

      // Execute code in worker context using Function constructor
      // This avoids strict mode issues with the cube.js code
      const fn = new Function(cubeCode);
      fn.call(self);

      Cube = self.Cube;
      console.log('[Worker] Cube:', typeof Cube);
      if (!Cube) {
        throw new Error('Cube 库加载失败');
      }

      self.postMessage({ type: 'status', message: '计算求解表...' });

      Cube.initSolver();
      solverInitialized = true;
      console.log('[Worker] initSolver done');

      self.postMessage({ type: 'ready' });

    } catch (err) {
      console.error('[Worker] Error:', err);
      self.postMessage({
        type: 'error',
        message: '初始化失败: ' + (err.message || String(err))
      });
    }
  }

  if (type === 'solve') {
    if (!solverInitialized || !Cube) {
      self.postMessage({ type: 'error', message: '求解器未初始化' });
      return;
    }

    try {
      const { stateString } = data;
      const cube = Cube.fromString(stateString);
      const solution = cube.solve();
      self.postMessage({ type: 'solution', solution });
    } catch (err) {
      self.postMessage({
        type: 'error',
        message: '求解失败: ' + (err.message || String(err))
      });
    }
  }
};

console.log('[Worker] Worker code loaded');
`;

// 创建 Blob Worker
let worker: Worker | null = null;
let solverInitialized = false;
let initPromise: Promise<void> | null = null;
let statusCallbacks: ((status: string) => void)[] = [];

function getWorker(): Worker {
  if (!worker) {
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    worker = new Worker(url);
    URL.revokeObjectURL(url);

    worker.onmessage = (e) => {
      const { type, message } = e.data;

      if (type === 'status') {
        console.log('[Worker]', message);
        statusCallbacks.forEach(cb => cb(message));
      }

      if (type === 'ready') {
        solverInitialized = true;
        console.log('[Worker] 求解器初始化完成');
      }

      if (type === 'error') {
        console.error('[Worker]', message);
      }
    };

    worker.onerror = (e) => {
      console.error('[Worker Error]', e.message);
    };
  }
  return worker;
}

// 预加载的 cube.js 代码
let cubeJsCode: string | null = null;

// 预加载 cube.js
async function preloadCubeJs(): Promise<string> {
  if (cubeJsCode) return cubeJsCode;

  const response = await fetch('/cube.js');
  cubeJsCode = await response.text();
  console.log('[Main] Loaded cube.js, length:', cubeJsCode.length);
  return cubeJsCode;
}

// 初始化求解器
export async function initSolver(): Promise<void> {
  if (solverInitialized) return;
  if (initPromise) return initPromise;

  // 先加载 cube.js 代码
  const cubeCode = await preloadCubeJs();

  const w = getWorker();

  initPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('求解器初始化超时'));
    }, 60000);

    const handleMessage = (e: MessageEvent) => {
      const { type, message } = e.data;

      if (type === 'status') {
        console.log('[Worker]', message);
        statusCallbacks.forEach(cb => cb(message));
      }

      if (type === 'ready') {
        clearTimeout(timeout);
        worker?.removeEventListener('message', handleMessage);
        solverInitialized = true;
        resolve();
      }

      if (type === 'error') {
        clearTimeout(timeout);
        worker?.removeEventListener('message', handleMessage);
        initPromise = null;
        reject(new Error(message));
      }
    };

    worker?.addEventListener('message', handleMessage);
    // 传入 cube.js 代码
    w.postMessage({ type: 'init', data: { cubeCode } });
  });

  return initPromise;
}

// 后台预初始化
export function preloadSolver(): void {
  setTimeout(() => {
    initSolver().catch(err => {
      console.warn('后台初始化求解器失败:', err);
    });
  }, 500);
}

// 检查求解器是否已初始化
export function isSolverInitialized(): boolean {
  return solverInitialized;
}

// 设置状态回调
export function onSolverStatus(callback: (status: string) => void): () => void {
  statusCallbacks.push(callback);
  return () => {
    statusCallbacks = statusCallbacks.filter(cb => cb !== callback);
  };
}

// 求解魔方
export async function solve(state: CubeState): Promise<Solution> {
  if (isSolved(state)) {
    return { moves: [], notation: '魔方已还原', isValid: true };
  }

  if (!solverInitialized) {
    await initSolver();
  }

  const w = getWorker();

  return new Promise((resolve) => {
    const stateString = stateToCubeString(state);
    console.log('状态字符串:', stateString);

    // 设置5秒超时
    const timeout = setTimeout(() => {
      worker?.removeEventListener('message', handleMessage);
      console.error('求解超时');
      resolve({ moves: [], notation: '求解超时，可能是不可解的魔方状态', isValid: false });
    }, 5000);

    const handleMessage = (e: MessageEvent) => {
      const { type, solution, message } = e.data;

      if (type === 'solution') {
        clearTimeout(timeout);
        worker?.removeEventListener('message', handleMessage);
        console.log('解法:', solution);
        resolve({ moves: parseSolution(solution), notation: solution, isValid: true });
      }

      if (type === 'error') {
        clearTimeout(timeout);
        worker?.removeEventListener('message', handleMessage);
        resolve({ moves: [], notation: message, isValid: false });
      }
    };

    worker?.addEventListener('message', handleMessage);
    w.postMessage({ type: 'solve', data: { stateString } });
  });
}

// 解析解法字符串
function parseSolution(solution: string): Move[] {
  const moves: Move[] = [];
  const tokens = solution.split(/\s+/).filter(t => t.length > 0);

  for (const token of tokens) {
    const match = token.match(/^([UDLFBR])(['2])?$/);
    if (match) {
      const face = match[1] as FaceName;
      const modifier = match[2];
      moves.push({
        face,
        clockwise: modifier !== "'",
        double: modifier === '2',
      });
    }
  }
  return moves;
}

// 检查是否已还原
function isSolved(state: CubeState): boolean {
  const faces: FaceName[] = ['U', 'D', 'F', 'B', 'L', 'R'];
  for (const face of faces) {
    const centerColor = state[face][1][1];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (state[face][row][col] !== centerColor) return false;
      }
    }
  }
  return true;
}

// 打乱魔方 - 生成合法的打乱移动序列
export function scramble(moves: number = 20): Move[] {
  const faces: FaceName[] = ['U', 'D', 'F', 'B', 'L', 'R'];
  const result: Move[] = [];
  let lastFace: FaceName | null = null;

  for (let i = 0; i < moves; i++) {
    let face: FaceName;
    do {
      face = faces[Math.floor(Math.random() * faces.length)];
    } while (face === lastFace);

    result.push({
      face,
      clockwise: Math.random() > 0.5,
      double: Math.random() > 0.7,
    });
    lastFace = face;
  }
  return result;
}

// 别名导出，语义更清晰
export const generateScrambleMoves = scramble;

// 生成打乱字符串
export function generateScrambleString(moves: number = 20): string {
  return scramble(moves).map(m => {
    if (m.double) return m.face + '2';
    return m.clockwise ? m.face : m.face + "'";
  }).join(' ');
}