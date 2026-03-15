// 魔方面的标准命名
export type FaceName = 'U' | 'D' | 'F' | 'B' | 'L' | 'R';

// 颜色定义
export type CubeColor = 'white' | 'yellow' | 'red' | 'orange' | 'blue' | 'green';

// 单个面的状态 (3x3)
export type FaceState = CubeColor[][];

// 完整魔方状态
export interface CubeState {
  U: FaceState; // 上 - 黄
  D: FaceState; // 下 - 白
  F: FaceState; // 前 - 蓝
  B: FaceState; // 后 - 绿
  L: FaceState; // 左 - 橙
  R: FaceState; // 右 - 红
}

// 旋转操作
export interface Move {
  face: FaceName;
  clockwise: boolean;
  double?: boolean;
}

// 解法步骤
export type SolutionStep = Move;

// 面颜色映射（标准配色：上黄下白，左橙右红，前蓝后绿）
export const FACE_COLORS: Record<FaceName, CubeColor> = {
  U: 'yellow',   // 上 - 黄
  D: 'white',    // 下 - 白
  F: 'blue',     // 前 - 蓝
  B: 'green',    // 后 - 绿
  L: 'orange',   // 左 - 橙
  R: 'red',      // 右 - 红
};

// 颜色的十六进制值
export const COLOR_HEX: Record<CubeColor, string> = {
  white: '#FFFFFF',
  yellow: '#FFFF00',
  red: '#FF0000',
  orange: '#FFA500',
  blue: '#0000FF',
  green: '#00FF00',
};

// 面的中文命名
export const FACE_NAMES_CN: Record<FaceName, string> = {
  U: '上',
  D: '下',
  F: '前',
  B: '后',
  L: '左',
  R: '右',
};

// 面的英文命名
export const FACE_NAMES_EN: Record<FaceName, string> = {
  U: 'Up',
  D: 'Down',
  F: 'Front',
  B: 'Back',
  L: 'Left',
  R: 'Right',
};

// 操作记号
export type MoveNotation = string;

// 解法结果
export interface Solution {
  moves: Move[];
  notation: string;
  isValid: boolean;
}