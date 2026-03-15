import { create } from 'zustand';
import {
  CubeState,
  Move,
  Solution,
  FaceName,
  CubeColor,
} from '../types/cube';
import {
  createSolvedCube,
  applyMove,
  cloneCube,
  parseMoves,
} from '../core/Cube';
import { validateCubeState } from '../core/CubeValidator';
import { scramble, generateScrambleString } from '../solver/Solver';

// localStorage 键名
const STORAGE_KEY = 'rubiks-cube-state';

// 需要持久化的状态
interface PersistedState {
  cubeState: CubeState;
  scrambleString: string;
  solution: Solution | null;
  currentMoveIndex: number;
  animationSpeed: number;
}

// 从 localStorage 加载状态
function loadFromStorage(): PersistedState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as PersistedState;
      // 验证加载的状态是否有效
      if (parsed.cubeState && parsed.cubeState.U && parsed.cubeState.D) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load cube state from localStorage:', e);
  }
  return null;
}

// 保存状态到 localStorage
function saveToStorage(state: Partial<PersistedState>): void {
  try {
    const current = loadFromStorage() || {
      cubeState: createSolvedCube(),
      scrambleString: '',
      solution: null,
      currentMoveIndex: 0,
      animationSpeed: 500,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...state }));
  } catch (e) {
    console.error('Failed to save cube state to localStorage:', e);
  }
}

// 初始化状态
const savedState = loadFromStorage();

interface CubeStore {
  // 魔方状态
  cubeState: CubeState;

  // 当前选择的编辑模式
  editMode: boolean;
  selectedFace: FaceName | null;
  selectedColor: CubeColor;

  // 解法
  solution: Solution | null;
  currentMoveIndex: number;

  // 动画控制
  isAnimating: boolean;
  animationSpeed: number;
  animatingMove: { face: FaceName; clockwise: boolean; double?: boolean; progress: number; rotationCount?: number } | null;

  // 打乱
  scrambleString: string;

  // 验证结果
  validationResult: { valid: boolean; messages: string[] } | null;

  // Actions
  setCubeState: (state: CubeState) => void;
  setCellColor: (face: FaceName, row: number, col: number, color: CubeColor) => void;
  setSelectedFace: (face: FaceName | null) => void;
  setSelectedColor: (color: CubeColor) => void;
  setEditMode: (mode: boolean) => void;

  // 旋转操作
  rotate: (move: Move) => void;
  rotateByNotation: (notation: string) => void;

  // 解法操作
  setCurrentMoveIndex: (index: number) => void;
  setSolution: (solution: Solution) => void;

  // 动画控制
  setIsAnimating: (animating: boolean) => void;
  setAnimationSpeed: (speed: number) => void;
  setAnimatingMove: (move: { face: FaceName; clockwise: boolean; double?: boolean; progress: number; rotationCount?: number } | null) => void;

  // 打乱
  doScramble: () => void;
  setScrambleString: (str: string) => void;

  // 重置
  reset: () => void;

  // 验证
  validate: () => void;

  // 清除存储
  clearStorage: () => void;
}

export const useCubeStore = create<CubeStore>((set, get) => ({
  // 从 localStorage 恢复状态，否则使用默认值
  cubeState: savedState?.cubeState || createSolvedCube(),
  editMode: false,
  selectedFace: null,
  selectedColor: 'white',

  solution: savedState?.solution || null,
  currentMoveIndex: savedState?.currentMoveIndex || 0,

  isAnimating: false,
  animationSpeed: savedState?.animationSpeed || 500,
  animatingMove: null,

  scrambleString: savedState?.scrambleString || '',

  validationResult: null,

  setCubeState: (cubeState) => {
    set({ cubeState, validationResult: null });
    saveToStorage({ cubeState });
  },

  setCellColor: (face, row, col, color) => {
    set((state) => {
      const cubeState = cloneCube(state.cubeState);
      cubeState[face][row][col] = color;
      return { cubeState, validationResult: null };
    });
    saveToStorage({ cubeState: get().cubeState });
  },

  setSelectedFace: (face) => set({ selectedFace: face }),
  setSelectedColor: (color) => set({ selectedColor: color }),
  setEditMode: (mode) => set({ editMode: mode }),

  rotate: (move) => {
    set((state) => ({
      cubeState: applyMove(state.cubeState, move),
      validationResult: null,
    }));
    saveToStorage({ cubeState: get().cubeState });
  },

  rotateByNotation: (notation) => {
    const moves = parseMoves(notation);
    let cubeState = get().cubeState;
    for (const move of moves) {
      cubeState = applyMove(cubeState, move);
    }
    set({ cubeState, validationResult: null });
    saveToStorage({ cubeState });
  },

  setCurrentMoveIndex: (currentMoveIndex) => {
    set({ currentMoveIndex });
    saveToStorage({ currentMoveIndex });
  },

  setSolution: (solution) => {
    set({ solution, currentMoveIndex: 0 });
    saveToStorage({ solution, currentMoveIndex: 0 });
  },

  setIsAnimating: (animating) => set({ isAnimating: animating }),

  setAnimationSpeed: (animationSpeed) => {
    set({ animationSpeed });
    saveToStorage({ animationSpeed });
  },

  setAnimatingMove: (animatingMove) => set({ animatingMove }),

  doScramble: () => {
    const moves = scramble(20);
    const scrambleString = generateScrambleString(20);
    let cubeState = createSolvedCube();
    for (const move of moves) {
      cubeState = applyMove(cubeState, move);
    }
    set({
      cubeState,
      scrambleString,
      solution: null,
      validationResult: null,
    });
    saveToStorage({ cubeState, scrambleString, solution: null });
  },

  setScrambleString: (scrambleString) => {
    set({ scrambleString });
    saveToStorage({ scrambleString });
  },

  reset: () => {
    const cubeState = createSolvedCube();
    set({
      cubeState,
      solution: null,
      currentMoveIndex: 0,
      scrambleString: '',
      validationResult: null,
      isAnimating: false,
    });
    saveToStorage({ cubeState, solution: null, currentMoveIndex: 0, scrambleString: '' });
  },

  validate: () => {
    const { cubeState } = get();
    const result = validateCubeState(cubeState);
    set({ validationResult: result });
  },

  clearStorage: () => {
    localStorage.removeItem(STORAGE_KEY);
  },
}));