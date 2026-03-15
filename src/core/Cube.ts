import {
  CubeState,
  FaceState,
  FaceName,
  CubeColor,
  Move,
  FACE_COLORS,
} from '../types/cube';

// 创建一个已还原的3x3面
function createSolvedFace(color: CubeColor): FaceState {
  return [
    [color, color, color],
    [color, color, color],
    [color, color, color],
  ];
}

// 创建已还原的魔方状态
export function createSolvedCube(): CubeState {
  return {
    U: createSolvedFace(FACE_COLORS.U),
    D: createSolvedFace(FACE_COLORS.D),
    F: createSolvedFace(FACE_COLORS.F),
    B: createSolvedFace(FACE_COLORS.B),
    L: createSolvedFace(FACE_COLORS.L),
    R: createSolvedFace(FACE_COLORS.R),
  };
}

// 复制魔方状态
export function cloneCube(state: CubeState): CubeState {
  return {
    U: state.U.map(row => [...row]),
    D: state.D.map(row => [...row]),
    F: state.F.map(row => [...row]),
    B: state.B.map(row => [...row]),
    L: state.L.map(row => [...row]),
    R: state.R.map(row => [...row]),
  };
}

// 顺时针旋转一个面90度
function rotateFaceClockwise(face: FaceState): FaceState {
  return [
    [face[2][0], face[1][0], face[0][0]],
    [face[2][1], face[1][1], face[0][1]],
    [face[2][2], face[1][2], face[0][2]],
  ];
}

// 逆时针旋转一个面90度
function rotateFaceCounterClockwise(face: FaceState): FaceState {
  return [
    [face[0][2], face[1][2], face[2][2]],
    [face[0][1], face[1][1], face[2][1]],
    [face[0][0], face[1][0], face[2][0]],
  ];
}

// 执行一次旋转
export function applyMove(state: CubeState, move: Move): CubeState {
  const newState = cloneCube(state);
  const { face, clockwise, double } = move;

  if (double) {
    // 双重旋转等于两个单次旋转
    let temp = applyMoveInternal(newState, face, true);
    return applyMoveInternal(temp, face, true);
  }

  return applyMoveInternal(newState, face, clockwise);
}

function applyMoveInternal(state: CubeState, face: FaceName, clockwise: boolean): CubeState {
  // 旋转面本身
  state[face] = clockwise
    ? rotateFaceClockwise(state[face])
    : rotateFaceCounterClockwise(state[face]);

  // 旋转相邻面的边
  switch (face) {
    case 'U':
      if (clockwise) {
        const temp = [state.F[0][0], state.F[0][1], state.F[0][2]];
        state.F[0] = [...state.R[0]];
        state.R[0] = [...state.B[0]];
        state.B[0] = [...state.L[0]];
        state.L[0] = temp;
      } else {
        const temp = [state.F[0][0], state.F[0][1], state.F[0][2]];
        state.F[0] = [...state.L[0]];
        state.L[0] = [...state.B[0]];
        state.B[0] = [...state.R[0]];
        state.R[0] = temp;
      }
      break;

    case 'D':
      if (clockwise) {
        const temp = [state.F[2][0], state.F[2][1], state.F[2][2]];
        state.F[2] = [...state.L[2]];
        state.L[2] = [...state.B[2]];
        state.B[2] = [...state.R[2]];
        state.R[2] = temp;
      } else {
        const temp = [state.F[2][0], state.F[2][1], state.F[2][2]];
        state.F[2] = [...state.R[2]];
        state.R[2] = [...state.B[2]];
        state.B[2] = [...state.L[2]];
        state.L[2] = temp;
      }
      break;

    case 'F':
      if (clockwise) {
        const temp = [state.U[2][0], state.U[2][1], state.U[2][2]];
        state.U[2][0] = state.L[2][2];
        state.U[2][1] = state.L[1][2];
        state.U[2][2] = state.L[0][2];
        state.L[0][2] = state.D[0][0];
        state.L[1][2] = state.D[0][1];
        state.L[2][2] = state.D[0][2];
        state.D[0][0] = state.R[2][0];
        state.D[0][1] = state.R[1][0];
        state.D[0][2] = state.R[0][0];
        state.R[0][0] = temp[0];
        state.R[1][0] = temp[1];
        state.R[2][0] = temp[2];
      } else {
        const temp = [state.U[2][0], state.U[2][1], state.U[2][2]];
        state.U[2][0] = state.R[0][0];
        state.U[2][1] = state.R[1][0];
        state.U[2][2] = state.R[2][0];
        state.R[0][0] = state.D[0][2];
        state.R[1][0] = state.D[0][1];
        state.R[2][0] = state.D[0][0];
        state.D[0][0] = state.L[0][2];
        state.D[0][1] = state.L[1][2];
        state.D[0][2] = state.L[2][2];
        state.L[0][2] = temp[2];
        state.L[1][2] = temp[1];
        state.L[2][2] = temp[0];
      }
      break;

    case 'B':
      if (clockwise) {
        const temp = [state.U[0][0], state.U[0][1], state.U[0][2]];
        state.U[0][0] = state.R[0][2];
        state.U[0][1] = state.R[1][2];
        state.U[0][2] = state.R[2][2];
        state.R[0][2] = state.D[2][2];
        state.R[1][2] = state.D[2][1];
        state.R[2][2] = state.D[2][0];
        state.D[2][0] = state.L[0][0];
        state.D[2][1] = state.L[1][0];
        state.D[2][2] = state.L[2][0];
        state.L[0][0] = temp[2];
        state.L[1][0] = temp[1];
        state.L[2][0] = temp[0];
      } else {
        const temp = [state.U[0][0], state.U[0][1], state.U[0][2]];
        state.U[0][0] = state.L[2][0];
        state.U[0][1] = state.L[1][0];
        state.U[0][2] = state.L[0][0];
        state.L[0][0] = state.D[2][0];
        state.L[1][0] = state.D[2][1];
        state.L[2][0] = state.D[2][2];
        state.D[2][0] = state.R[2][2];
        state.D[2][1] = state.R[1][2];
        state.D[2][2] = state.R[0][2];
        state.R[0][2] = temp[0];
        state.R[1][2] = temp[1];
        state.R[2][2] = temp[2];
      }
      break;

    case 'L':
      if (clockwise) {
        const temp = [state.U[0][0], state.U[1][0], state.U[2][0]];
        state.U[0][0] = state.B[2][2];
        state.U[1][0] = state.B[1][2];
        state.U[2][0] = state.B[0][2];
        state.B[0][2] = state.D[2][0];
        state.B[1][2] = state.D[1][0];
        state.B[2][2] = state.D[0][0];
        state.D[0][0] = state.F[0][0];
        state.D[1][0] = state.F[1][0];
        state.D[2][0] = state.F[2][0];
        state.F[0][0] = temp[0];
        state.F[1][0] = temp[1];
        state.F[2][0] = temp[2];
      } else {
        const temp = [state.U[0][0], state.U[1][0], state.U[2][0]];
        state.U[0][0] = state.F[0][0];
        state.U[1][0] = state.F[1][0];
        state.U[2][0] = state.F[2][0];
        state.F[0][0] = state.D[0][0];
        state.F[1][0] = state.D[1][0];
        state.F[2][0] = state.D[2][0];
        state.D[0][0] = state.B[2][2];
        state.D[1][0] = state.B[1][2];
        state.D[2][0] = state.B[0][2];
        state.B[0][2] = temp[2];
        state.B[1][2] = temp[1];
        state.B[2][2] = temp[0];
      }
      break;

    case 'R':
      if (clockwise) {
        const temp = [state.U[0][2], state.U[1][2], state.U[2][2]];
        state.U[0][2] = state.F[0][2];
        state.U[1][2] = state.F[1][2];
        state.U[2][2] = state.F[2][2];
        state.F[0][2] = state.D[0][2];
        state.F[1][2] = state.D[1][2];
        state.F[2][2] = state.D[2][2];
        state.D[0][2] = state.B[2][0];
        state.D[1][2] = state.B[1][0];
        state.D[2][2] = state.B[0][0];
        state.B[0][0] = temp[2];
        state.B[1][0] = temp[1];
        state.B[2][0] = temp[0];
      } else {
        const temp = [state.U[0][2], state.U[1][2], state.U[2][2]];
        state.U[0][2] = state.B[2][0];
        state.U[1][2] = state.B[1][0];
        state.U[2][2] = state.B[0][0];
        state.B[0][0] = state.D[2][2];
        state.B[1][0] = state.D[1][2];
        state.B[2][0] = state.D[0][2];
        state.D[0][2] = state.F[0][2];
        state.D[1][2] = state.F[1][2];
        state.D[2][2] = state.F[2][2];
        state.F[0][2] = temp[0];
        state.F[1][2] = temp[1];
        state.F[2][2] = temp[2];
      }
      break;
  }

  return state;
}

// 执行一系列旋转
export function applyMoves(state: CubeState, moves: Move[]): CubeState {
  return moves.reduce((currentState, move) => applyMove(currentState, move), state);
}

// 将操作转换为字符串记号
export function moveToNotation(move: Move): string {
  const face = move.face;
  if (move.double) {
    return `${face}2`;
  }
  return move.clockwise ? face : `${face}'`;
}

// 从字符串记号解析操作
export function parseMove(notation: string): Move | null {
  const match = notation.toUpperCase().match(/^([UDFBLR])(['2])?$/);
  if (!match) return null;

  const face = match[1] as FaceName;
  const modifier = match[2];

  if (modifier === '2') {
    return { face, clockwise: true, double: true };
  }
  if (modifier === "'") {
    return { face, clockwise: false };
  }
  return { face, clockwise: true };
}

// 解析一系列操作
export function parseMoves(notation: string): Move[] {
  return notation
    .split(/\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(parseMove)
    .filter((m): m is Move => m !== null);
}

// 面字母到颜色的映射 (cubejs 格式)
const FACE_CHAR_TO_COLOR: Record<string, CubeColor> = {
  U: 'yellow',
  R: 'red',
  F: 'blue',
  D: 'white',
  L: 'orange',
  B: 'green',
};

// 颜色到面字母的映射
const COLOR_TO_FACE_CHAR: Record<CubeColor, string> = {
  yellow: 'U',
  red: 'R',
  blue: 'F',
  white: 'D',
  orange: 'L',
  green: 'B',
};

// 将魔方状态转换为字符串 (cubejs 格式: UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB)
export function stateToString(state: CubeState): string {
  const faceOrder: FaceName[] = ['U', 'R', 'F', 'D', 'L', 'B'];
  let result = '';
  for (const face of faceOrder) {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const color = state[face][row][col];
        result += COLOR_TO_FACE_CHAR[color];
      }
    }
  }
  return result;
}

// 从字符串解析魔方状态
export function stringToState(str: string): CubeState | null {
  // 移除空格
  const cleanStr = str.replace(/\s/g, '').toUpperCase();

  // 检查长度
  if (cleanStr.length !== 54) {
    return null;
  }

  // 检查是否只包含有效字符
  if (!/^[URFDLB]{54}$/.test(cleanStr)) {
    return null;
  }

  const faceOrder: FaceName[] = ['U', 'R', 'F', 'D', 'L', 'B'];
  const state: Partial<CubeState> = {};

  let index = 0;
  for (const face of faceOrder) {
    const faceState: FaceState = [
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
    ] as unknown as FaceState;

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const char = cleanStr[index++];
        const color = FACE_CHAR_TO_COLOR[char];
        if (!color) return null;
        faceState[row][col] = color;
      }
    }
    state[face] = faceState;
  }

  return state as CubeState;
}