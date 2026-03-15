import { useEffect, useCallback, useRef } from 'react';
import { useCubeStore } from '../hooks/useCubeStore';
import { applyMove } from '../core/Cube';

// 动画控制面板
export function AnimationControls() {
  const solution = useCubeStore((state) => state.solution);
  const currentMoveIndex = useCubeStore((state) => state.currentMoveIndex);
  const setCurrentMoveIndex = useCubeStore((state) => state.setCurrentMoveIndex);
  const cubeState = useCubeStore((state) => state.cubeState);
  const setCubeState = useCubeStore((state) => state.setCubeState);
  const isAnimating = useCubeStore((state) => state.isAnimating);
  const setIsAnimating = useCubeStore((state) => state.setIsAnimating);
  const animationSpeed = useCubeStore((state) => state.animationSpeed);
  const setAnimationSpeed = useCubeStore((state) => state.setAnimationSpeed);
  const doScramble = useCubeStore((state) => state.doScramble);

  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialStateRef = useRef(cubeState);

  // 保存初始状态
  useEffect(() => {
    if (currentMoveIndex === 0) {
      initialStateRef.current = cubeState;
    }
  }, [currentMoveIndex, cubeState]);

  // 从初始状态应用到指定步骤
  const applyMovesFromStart = useCallback((targetIndex: number) => {
    if (!solution) return;
    let state = initialStateRef.current;
    for (let i = 0; i < targetIndex; i++) {
      state = applyMove(state, solution.moves[i]);
    }
    setCubeState(state);
  }, [solution, setCubeState]);

  // 播放下一步
  const playNextMove = useCallback(() => {
    if (!solution || currentMoveIndex >= solution.moves.length) {
      setIsAnimating(false);
      return;
    }

    const move = solution.moves[currentMoveIndex];
    const newState = applyMove(cubeState, move);
    setCubeState(newState);
    setCurrentMoveIndex(currentMoveIndex + 1);
  }, [solution, currentMoveIndex, cubeState, setCubeState, setCurrentMoveIndex, setIsAnimating]);

  // 自动播放动画
  useEffect(() => {
    if (isAnimating && solution && currentMoveIndex < solution.moves.length) {
      animationRef.current = setTimeout(playNextMove, animationSpeed);
    } else if (currentMoveIndex >= (solution?.moves.length || 0)) {
      setIsAnimating(false);
    }

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [isAnimating, currentMoveIndex, animationSpeed, playNextMove, solution, setIsAnimating]);

  // 播放/暂停
  const handlePlayPause = () => {
    if (isAnimating) {
      setIsAnimating(false);
    } else {
      if (solution && currentMoveIndex < solution.moves.length) {
        setIsAnimating(true);
      }
    }
  };

  // 停止并重置到初始状态
  const handleStop = () => {
    setIsAnimating(false);
    setCurrentMoveIndex(0);
    setCubeState(initialStateRef.current);
  };

  // 单步前进
  const handleStepForward = () => {
    if (solution && currentMoveIndex < solution.moves.length) {
      playNextMove();
    }
  };

  // 单步后退 - 从初始状态重新应用
  const handleStepBackward = () => {
    if (currentMoveIndex > 0 && solution) {
      const newIndex = currentMoveIndex - 1;
      setCurrentMoveIndex(newIndex);
      applyMovesFromStart(newIndex);
    }
  };

  // 速度调节
  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnimationSpeed(1000 - parseInt(e.target.value) * 10);
  };

  // 打乱
  const handleScramble = () => {
    setIsAnimating(false);
    doScramble();
  };

  if (!solution || solution.moves.length === 0) {
    return (
      <div style={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3 style={{ marginTop: 0 }}>动画控制</h3>
        <button
          onClick={handleScramble}
          style={{
            padding: '12px 24px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          打乱魔方
        </button>
        <p style={{ color: '#666', marginTop: '12px' }}>
          请先输入解法步骤以启用动画播放
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
      <h3 style={{ marginTop: 0 }}>动画控制</h3>

      {/* 进度显示 */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>进度:</span>
          <div
            style={{
              flex: 1,
              height: '8px',
              backgroundColor: '#e9ecef',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(currentMoveIndex / solution.moves.length) * 100}%`,
                height: '100%',
                backgroundColor: '#007bff',
                transition: 'width 0.1s',
              }}
            />
          </div>
          <span>
            {currentMoveIndex} / {solution.moves.length}
          </span>
        </div>
      </div>

      {/* 控制按钮 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          onClick={handleStepBackward}
          disabled={currentMoveIndex === 0}
          style={{
            padding: '8px 16px',
            backgroundColor: currentMoveIndex === 0 ? '#ccc' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: currentMoveIndex === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          ⏮ 后退
        </button>
        <button
          onClick={handlePlayPause}
          disabled={currentMoveIndex >= solution.moves.length}
          style={{
            padding: '8px 24px',
            backgroundColor: currentMoveIndex >= solution.moves.length ? '#ccc' : isAnimating ? '#dc3545' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: currentMoveIndex >= solution.moves.length ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
          }}
        >
          {isAnimating ? '⏸ 暂停' : '▶ 播放'}
        </button>
        <button
          onClick={handleStepForward}
          disabled={currentMoveIndex >= solution.moves.length}
          style={{
            padding: '8px 16px',
            backgroundColor: currentMoveIndex >= solution.moves.length ? '#ccc' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: currentMoveIndex >= solution.moves.length ? 'not-allowed' : 'pointer',
          }}
        >
          前进 ⏭
        </button>
        <button
          onClick={handleStop}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          ⏹ 停止
        </button>
      </div>

      {/* 速度控制 */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px' }}>
          动画速度: {Math.round((1000 - animationSpeed) / 10)}%
        </label>
        <input
          type="range"
          min="10"
          max="90"
          value={(1000 - animationSpeed) / 10}
          onChange={handleSpeedChange}
          style={{ width: '100%' }}
        />
      </div>

      {/* 打乱按钮 */}
      <button
        onClick={handleScramble}
        style={{
          padding: '12px 24px',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          width: '100%',
        }}
      >
        打乱魔方
      </button>
    </div>
  );
}

export default AnimationControls;