import { CubeState, CubeColor, FACE_COLORS } from '../types/cube';

// 统计每种颜色的数量
function countColors(state: CubeState): Record<CubeColor, number> {
  const counts: Record<CubeColor, number> = {
    white: 0,
    yellow: 0,
    red: 0,
    orange: 0,
    blue: 0,
    green: 0,
  };

  const faces = ['U', 'D', 'F', 'B', 'L', 'R'] as const;
  for (const face of faces) {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        counts[state[face][row][col]]++;
      }
    }
  }

  return counts;
}

// 检查每种颜色是否恰好9个
function validateColorCounts(state: CubeState): { valid: boolean; message: string } {
  const counts = countColors(state);
  const errors: string[] = [];

  for (const [color, count] of Object.entries(counts)) {
    if (count !== 9) {
      errors.push(`${color}: ${count}个 (应为9个)`);
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      message: `颜色数量错误: ${errors.join(', ')}`,
    };
  }

  return { valid: true, message: '' };
}

// 检查中心块颜色是否正确
function validateCenters(state: CubeState): { valid: boolean; message: string } {
  const errors: string[] = [];

  for (const [face, expectedColor] of Object.entries(FACE_COLORS)) {
    const actualColor = state[face as keyof CubeState][1][1];
    if (actualColor !== expectedColor) {
      errors.push(`${face}面中心应为${expectedColor}，实际为${actualColor}`);
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      message: `中心块错误: ${errors.join('; ')}`,
    };
  }

  return { valid: true, message: '' };
}

// 验证魔方状态
export interface ValidationResult {
  valid: boolean;
  messages: string[];
}

export function validateCubeState(state: CubeState): ValidationResult {
  const messages: string[] = [];

  // 检查颜色数量
  const countResult = validateColorCounts(state);
  if (!countResult.valid) {
    messages.push(countResult.message);
  }

  // 检查中心块
  const centerResult = validateCenters(state);
  if (!centerResult.valid) {
    messages.push(centerResult.message);
  }

  return {
    valid: messages.length === 0,
    messages,
  };
}

// 简化的可解性检查
export function isSolvable(state: CubeState): boolean {
  const validation = validateCubeState(state);
  return validation.valid;
}