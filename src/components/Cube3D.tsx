import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box } from '@react-three/drei';
import { CubeState, CubeColor, COLOR_HEX, FaceName } from '../types/cube';
import { useCubeStore } from '../hooks/useCubeStore';
import { applyMove } from '../core/Cube';
import * as THREE from 'three';

// 魔方的单个小块
interface CubieProps {
  colors: {
    right?: CubeColor;
    left?: CubeColor;
    top?: CubeColor;
    bottom?: CubeColor;
    front?: CubeColor;
    back?: CubeColor;
  };
}

function Cubie({ colors }: CubieProps) {
  const size = 0.95;
  const stickerSize = 0.85;
  const stickerOffset = 0.48;

  return (
    <group>
      {/* 黑色基础块 */}
      <Box args={[size, size, size]}>
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
      </Box>

      {/* 贴纸 */}
      {colors.right && (
        <Box
          args={[stickerSize, stickerSize, 0.02]}
          position={[stickerOffset, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <meshStandardMaterial color={COLOR_HEX[colors.right]} roughness={0.3} />
        </Box>
      )}
      {colors.left && (
        <Box
          args={[stickerSize, stickerSize, 0.02]}
          position={[-stickerOffset, 0, 0]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          <meshStandardMaterial color={COLOR_HEX[colors.left]} roughness={0.3} />
        </Box>
      )}
      {colors.top && (
        <Box
          args={[stickerSize, stickerSize, 0.02]}
          position={[0, stickerOffset, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <meshStandardMaterial color={COLOR_HEX[colors.top]} roughness={0.3} />
        </Box>
      )}
      {colors.bottom && (
        <Box
          args={[stickerSize, stickerSize, 0.02]}
          position={[0, -stickerOffset, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <meshStandardMaterial color={COLOR_HEX[colors.bottom]} roughness={0.3} />
        </Box>
      )}
      {colors.front && (
        <Box
          args={[stickerSize, stickerSize, 0.02]}
          position={[0, 0, stickerOffset]}
        >
          <meshStandardMaterial color={COLOR_HEX[colors.front]} roughness={0.3} />
        </Box>
      )}
      {colors.back && (
        <Box
          args={[stickerSize, stickerSize, 0.02]}
          position={[0, 0, -stickerOffset]}
          rotation={[0, Math.PI, 0]}
        >
          <meshStandardMaterial color={COLOR_HEX[colors.back]} roughness={0.3} />
        </Box>
      )}
    </group>
  );
}

// 将魔方状态转换为每个小块的颜色
function getCubieColors(state: CubeState, x: number, y: number, z: number) {
  const colors: {
    right?: CubeColor;
    left?: CubeColor;
    top?: CubeColor;
    bottom?: CubeColor;
    front?: CubeColor;
    back?: CubeColor;
  } = {};

  if (x === 1) {
    const row = 1 - y;
    const col = 1 - z;
    colors.right = state.R[row][col];
  }

  if (x === -1) {
    const row = 1 - y;
    const col = z + 1;
    colors.left = state.L[row][col];
  }

  if (y === 1) {
    const row = z + 1;
    const col = x + 1;
    colors.top = state.U[row][col];
  }

  if (y === -1) {
    const row = 1 - z;
    const col = x + 1;
    colors.bottom = state.D[row][col];
  }

  if (z === 1) {
    const row = 1 - y;
    const col = x + 1;
    colors.front = state.F[row][col];
  }

  if (z === -1) {
    const row = 1 - y;
    const col = 1 - x;
    colors.back = state.B[row][col];
  }

  return colors;
}

// 判断方块是否在指定面上
function isOnFace(face: FaceName, x: number, y: number, z: number): boolean {
  switch (face) {
    case 'U': return y === 1;
    case 'D': return y === -1;
    case 'F': return z === 1;
    case 'B': return z === -1;
    case 'L': return x === -1;
    case 'R': return x === 1;
  }
}

// 获取旋转轴和基础角度方向
function getRotationAxisAndDirection(face: FaceName, clockwise: boolean): { axis: THREE.Vector3; angleSign: number } {
  // 返回旋转轴和角度符号
  // Three.js 正角度 = 从轴正方向看逆时针
  // 魔方顺时针 = 从外部看该面是顺时针

  switch (face) {
    case 'U':
      // U面从上往下看顺时针 = Three.js 负角度（因为从Y+看，顺时针是负角度）
      return {
        axis: new THREE.Vector3(0, 1, 0),
        angleSign: clockwise ? -1 : 1
      };
    case 'D':
      // D面从下往上看顺时针 = 绕Y轴，从Y-看顺时针 = Three.js 正角度
      return {
        axis: new THREE.Vector3(0, 1, 0),
        angleSign: clockwise ? 1 : -1
      };
    case 'F':
      // F面从前往后看顺时针 = 从Z+看顺时针 = Three.js 负角度
      return {
        axis: new THREE.Vector3(0, 0, 1),
        angleSign: clockwise ? -1 : 1
      };
    case 'B':
      // B面从后往前看顺时针 = 从Z-看顺时针 = 绕Z轴正角度
      return {
        axis: new THREE.Vector3(0, 0, 1),
        angleSign: clockwise ? 1 : -1
      };
    case 'R':
      // R面从右往左看顺时针 = 从X+看顺时针 = Three.js 负角度
      return {
        axis: new THREE.Vector3(1, 0, 0),
        angleSign: clockwise ? -1 : 1
      };
    case 'L':
      // L面从左往右看顺时针 = 从X-看顺时针 = 绕X轴正角度
      return {
        axis: new THREE.Vector3(1, 0, 0),
        angleSign: clockwise ? 1 : -1
      };
  }
}

// 主魔方组件
export function Cube3D() {
  const cubeState = useCubeStore((state) => state.cubeState);
  const animatingMove = useCubeStore((state) => state.animatingMove);
  const setAnimatingMove = useCubeStore((state) => state.setAnimatingMove);
  const setCubeState = useCubeStore((state) => state.setCubeState);
  const animationSpeed = useCubeStore((state) => state.animationSpeed);

  const animationRef = useRef({
    progress: 0,
    startTime: 0,
    duration: 300, // 默认动画时长(ms)
  });

  // 当 animatingMove 改变时，重置动画
  useEffect(() => {
    if (animatingMove) {
      animationRef.current.progress = 0;
      animationRef.current.startTime = performance.now();
      // 每次旋转都是 90 度，时长相同
      animationRef.current.duration = Math.max(150, animationSpeed * 0.8);
    }
  }, [animatingMove?.face, animatingMove?.clockwise, animatingMove?.rotationCount, animationSpeed]);

  // 使用 useFrame 进行动画
  useFrame(() => {
    if (!animatingMove) return;

    const now = performance.now();
    const elapsed = now - animationRef.current.startTime;
    const progress = Math.min(1, elapsed / animationRef.current.duration);

    if (progress >= 1) {
      // 动画完成，更新状态（单次旋转）
      const newState = applyMove(cubeState, {
        face: animatingMove.face,
        clockwise: animatingMove.clockwise,
        double: false, // 每次动画只执行一次旋转
      });

      // 检查是否需要第二次旋转
      const isDouble = animatingMove.double;
      const currentCount = animatingMove.rotationCount || 0;

      if (isDouble && currentCount < 1) {
        // 需要第二次旋转，更新状态并启动第二次动画
        setCubeState(newState);
        setAnimatingMove({
          ...animatingMove,
          progress: 0,
          rotationCount: currentCount + 1,
        });
      } else {
        // 动画完全完成
        setCubeState(newState);
        setAnimatingMove(null);
      }
    } else {
      // 使用缓动函数使动画更平滑
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setAnimatingMove({
        ...animatingMove,
        progress: easedProgress * Math.PI / 2,
      });
    }
  });

  // 获取所有方块位置
  const allPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && y === 0 && z === 0) continue;
          positions.push([x, y, z]);
        }
      }
    }
    return positions;
  }, []);

  // 静态方块（不在旋转面上的）
  const staticCubies = useMemo(() => {
    if (!animatingMove) return null;

    return allPositions
      .filter(([x, y, z]) => !isOnFace(animatingMove.face, x, y, z))
      .map(([x, y, z]) => (
        <group key={`${x}-${y}-${z}`} position={[x, y, z]}>
          <Cubie colors={getCubieColors(cubeState, x, y, z)} />
        </group>
      ));
  }, [cubeState, animatingMove?.face, allPositions]);

  // 动画方块（在旋转面上的）
  const animatingCubies = useMemo(() => {
    if (!animatingMove) return null;

    return allPositions
      .filter(([x, y, z]) => isOnFace(animatingMove.face, x, y, z))
      .map(([x, y, z]) => (
        <group key={`anim-${x}-${y}-${z}`} position={[x, y, z]}>
          <Cubie colors={getCubieColors(cubeState, x, y, z)} />
        </group>
      ));
  }, [cubeState, animatingMove?.face, allPositions]);

  // 无动画时的所有方块
  const allCubies = useMemo(() => {
    if (animatingMove) return null;

    return allPositions.map(([x, y, z]) => (
      <group key={`${x}-${y}-${z}`} position={[x, y, z]}>
        <Cubie colors={getCubieColors(cubeState, x, y, z)} />
      </group>
    ));
  }, [cubeState, animatingMove, allPositions]);

  // 计算动画旋转
  const rotationGroup = useMemo(() => {
    if (!animatingMove) return null;

    const { axis, angleSign } = getRotationAxisAndDirection(
      animatingMove.face,
      animatingMove.clockwise
    );
    const angle = animatingMove.progress * angleSign;

    const quaternion = new THREE.Quaternion();
    quaternion.setFromAxisAngle(axis, angle);

    return quaternion;
  }, [animatingMove]);

  if (animatingMove && rotationGroup) {
    return (
      <group>
        {/* 静态方块 */}
        {staticCubies}

        {/* 动画方块 */}
        <group quaternion={rotationGroup}>
          {animatingCubies}
        </group>
      </group>
    );
  }

  return <group>{allCubies}</group>;
}

export default Cube3D;