import { useState, useEffect, useCallback, useRef } from 'react';
import { useCubeStore } from '../hooks/useCubeStore';
import { Move } from '../types/cube';
import { solve, isSolverInitialized, onSolverStatus, generateScrambleMoves } from '../solver/Solver';
import { applyMove, createSolvedCube } from '../core/Cube';
import { validateCubeState } from '../core/CubeValidator';
import { useLang } from '../i18n';

// 合并的求解与动画控制面板
export function SolutionPanel() {
  const solution = useCubeStore((state) => state.solution);
  const currentMoveIndex = useCubeStore((state) => state.currentMoveIndex);
  const setCurrentMoveIndex = useCubeStore((state) => state.setCurrentMoveIndex);
  const setSolution = useCubeStore((state) => state.setSolution);
  const cubeState = useCubeStore((state) => state.cubeState);
  const setCubeState = useCubeStore((state) => state.setCubeState);
  const scrambleString = useCubeStore((state) => state.scrambleString);
  const setScrambleString = useCubeStore((state) => state.setScrambleString);
  const isAnimating = useCubeStore((state) => state.isAnimating);
  const setIsAnimating = useCubeStore((state) => state.setIsAnimating);
  const animationSpeed = useCubeStore((state) => state.animationSpeed);
  const setAnimationSpeed = useCubeStore((state) => state.setAnimationSpeed);
  const animatingMove = useCubeStore((state) => state.animatingMove);
  const setAnimatingMove = useCubeStore((state) => state.setAnimatingMove);
  const { t } = useLang();

  const [manualInput, setManualInput] = useState('');
  const [isSolving, setIsSolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [solverReady, setSolverReady] = useState(isSolverInitialized());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const initialStateRef = useRef(cubeState);

  // 检查求解器状态
  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (isSolverInitialized()) {
        setSolverReady(true);
        setStatusMessage(null);
        clearInterval(checkInterval);
      }
    }, 500);

    const unsubscribe = onSolverStatus((msg) => {
      setStatusMessage(msg);
    });

    return () => {
      clearInterval(checkInterval);
      unsubscribe();
    };
  }, []);

  // 保存初始状态
  useEffect(() => {
    if (currentMoveIndex === 0 && solution) {
      initialStateRef.current = cubeState;
    }
  }, [currentMoveIndex, cubeState, solution]);

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
    setAnimatingMove({
      face: move.face,
      clockwise: move.clockwise,
      double: move.double,
      progress: 0,
      rotationCount: 0,
    });
    setCurrentMoveIndex(currentMoveIndex + 1);
  }, [solution, currentMoveIndex, setAnimatingMove, setCurrentMoveIndex, setIsAnimating]);

  // 监听动画完成
  useEffect(() => {
    if (animatingMove === null && isAnimating && solution && currentMoveIndex < solution.moves.length) {
      const timer = setTimeout(() => {
        playNextMove();
      }, 100);
      return () => clearTimeout(timer);
    } else if (animatingMove === null && isAnimating && currentMoveIndex >= (solution?.moves.length || 0)) {
      setIsAnimating(false);
    }
  }, [animatingMove, isAnimating, currentMoveIndex, solution, playNextMove, setIsAnimating]);

  // 自动求解
  const handleSolve = async () => {
    setIsSolving(true);
    setError(null);
    setIsAnimating(false);
    setCurrentMoveIndex(0);

    const validation = validateCubeState(cubeState);
    if (!validation.valid) {
      setError(validation.messages[0]);
      setIsSolving(false);
      return;
    }

    try {
      const result = await solve(cubeState);
      setSolution(result);
      initialStateRef.current = cubeState;

      if (!result.isValid && result.notation) {
        setError(result.notation);
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setIsSolving(false);
    }
  };

  // 打乱魔方
  const handleScramble = () => {
    setIsAnimating(false);
    setError(null);

    const moves = generateScrambleMoves(20);
    let newState = createSolvedCube();
    for (const move of moves) {
      newState = applyMove(newState, move);
    }

    const scrambleStr = moves.map(m => {
      if (m.double) return `${m.face}2`;
      return m.clockwise ? m.face : `${m.face}'`;
    }).join(' ');

    setCubeState(newState);
    setScrambleString(scrambleStr);
    setSolution({ moves: [], notation: '', isValid: false });
    setCurrentMoveIndex(0);
  };

  // 播放/暂停
  const handlePlayPause = () => {
    if (isAnimating) {
      setIsAnimating(false);
      setAnimatingMove(null);
    } else {
      if (solution && currentMoveIndex < solution.moves.length) {
        setIsAnimating(true);
      }
    }
  };

  // 停止
  const handleStop = () => {
    setIsAnimating(false);
    setAnimatingMove(null);
    setCurrentMoveIndex(0);
    setCubeState(initialStateRef.current);
  };

  // 单步前进
  const handleStepForward = () => {
    if (solution && currentMoveIndex < solution.moves.length && !animatingMove) {
      const move = solution.moves[currentMoveIndex];
      setAnimatingMove({
        face: move.face,
        clockwise: move.clockwise,
        double: move.double,
        progress: 0,
        rotationCount: 0,
      });
      setCurrentMoveIndex(currentMoveIndex + 1);
    }
  };

  // 单步后退
  const handleStepBackward = () => {
    if (currentMoveIndex > 0 && solution && !animatingMove) {
      setIsAnimating(false);
      setAnimatingMove(null);
      const newIndex = currentMoveIndex - 1;
      setCurrentMoveIndex(newIndex);
      applyMovesFromStart(newIndex);
    }
  };

  // 速度调节
  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnimationSpeed(1000 - parseInt(e.target.value) * 10);
  };

  // 手动输入解法
  const handleApplySolution = () => {
    if (manualInput.trim()) {
      const moves = parseManualInput(manualInput);
      if (moves.length > 0) {
        setSolution({
          moves,
          notation: manualInput,
          isValid: true,
        });
        initialStateRef.current = cubeState;
        setError(null);
      }
    }
  };

  // 解析用户输入
  const parseManualInput = (input: string): Move[] => {
    const moveList: Move[] = [];
    const tokens = input.toUpperCase().split(/\s+/).filter(t => t.length > 0);

    for (const token of tokens) {
      const match = token.match(/^([UDFBLR])(['2])?$/);
      if (match) {
        const face = match[1] as Move['face'];
        const modifier = match[2];
        moveList.push({
          face,
          clockwise: modifier !== "'",
          double: modifier === '2',
        });
      }
    }
    return moveList;
  };

  // 点击步骤跳转
  const handleMoveClick = (index: number) => {
    setIsAnimating(false);
    setCurrentMoveIndex(index);
    applyMovesFromStart(index);
  };

  // 格式化步骤
  const formatMove = (move: Move): string => {
    if (move.double) return `${move.face}2`;
    return move.clockwise ? move.face : `${move.face}'`;
  };

  return (
    <div style={{ padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
      {/* 求解器状态 */}
      <div style={{
        marginBottom: '8px',
        padding: '6px 10px',
        borderRadius: '4px',
        fontSize: '12px',
        backgroundColor: solverReady ? '#d4edda' : '#fff3cd',
        color: solverReady ? '#155724' : '#856404',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: solverReady ? '#28a745' : '#ffc107',
        }}></span>
        {solverReady ? t('solverReady') : statusMessage || t('solverInit')}
      </div>

      {/* 操作按钮 */}
      <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
        <button
          onClick={handleSolve}
          disabled={isSolving || !solverReady}
          style={{
            flex: 1,
            padding: '10px 16px',
            backgroundColor: isSolving || !solverReady ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isSolving || !solverReady ? 'not-allowed' : 'pointer',
            fontSize: '14px',
          }}
        >
          {isSolving ? t('solving') : t('solve')}
        </button>
        <button
          onClick={handleScramble}
          style={{
            flex: 1,
            padding: '10px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          {t('scramble')}
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div style={{
          marginBottom: '12px',
          padding: '8px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          fontSize: '13px',
        }}>
          {error}
        </div>
      )}

      {/* 打乱公式 */}
      {scrambleString && (
        <div style={{ marginBottom: '12px' }}>
          <strong style={{ fontSize: '13px' }}>{t('scrambleFormula')}</strong>
          <div style={{ fontFamily: 'monospace', marginTop: '4px', fontSize: '12px', wordBreak: 'break-all' }}>
            {scrambleString}
          </div>
        </div>
      )}

      {/* 解法步骤 */}
      {solution && solution.moves.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ marginBottom: '8px' }}>
            <strong style={{ fontSize: '13px' }}>{t('solution')} ({solution.moves.length} {t('steps')}):</strong>
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            padding: '8px',
            backgroundColor: 'white',
            borderRadius: '4px',
          }}>
            {solution.moves.map((move, index) => (
              <button
                key={index}
                onClick={() => handleMoveClick(index + 1)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: index < currentMoveIndex ? '#28a745' : index === currentMoveIndex ? '#007bff' : '#e9ecef',
                  color: index <= currentMoveIndex ? 'white' : '#333',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  fontSize: '12px',
                }}
              >
                {formatMove(move)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 动画控制 */}
      {solution && solution.moves.length > 0 && (
        <div style={{ marginBottom: '12px', padding: '12px', backgroundColor: 'white', borderRadius: '4px' }}>
          <div style={{ marginBottom: '8px', fontSize: '13px' }}>
            {t('progress')} {currentMoveIndex} / {solution.moves.length}
          </div>

          {/* 进度条 */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{
              height: '6px',
              backgroundColor: '#e9ecef',
              borderRadius: '3px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${(currentMoveIndex / solution.moves.length) * 100}%`,
                height: '100%',
                backgroundColor: '#007bff',
                transition: 'width 0.1s',
              }} />
            </div>
          </div>

          {/* 控制按钮 */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
            <button
              onClick={handleStepBackward}
              disabled={currentMoveIndex === 0}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: currentMoveIndex === 0 ? '#ccc' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: currentMoveIndex === 0 ? 'not-allowed' : 'pointer',
                fontSize: '13px',
              }}
            >
              ⏮
            </button>
            <button
              onClick={handlePlayPause}
              disabled={currentMoveIndex >= solution.moves.length}
              style={{
                flex: 2,
                padding: '8px',
                backgroundColor: currentMoveIndex >= solution.moves.length ? '#ccc' : (isAnimating ? '#dc3545' : '#28a745'),
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: currentMoveIndex >= solution.moves.length ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 'bold',
              }}
            >
              {isAnimating ? t('pause') : t('play')}
            </button>
            <button
              onClick={handleStepForward}
              disabled={currentMoveIndex >= solution.moves.length}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: currentMoveIndex >= solution.moves.length ? '#ccc' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: currentMoveIndex >= solution.moves.length ? 'not-allowed' : 'pointer',
                fontSize: '13px',
              }}
            >
              ⏭
            </button>
            <button
              onClick={handleStop}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              ⏹
            </button>
          </div>

          {/* 速度控制 */}
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
              Speed: {Math.round((1000 - animationSpeed) / 10)}%
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
        </div>
      )}

      {/* 手动输入 */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
          {t('manualSolution')}
        </label>
        <div style={{ display: 'flex', gap: '4px' }}>
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="R U R' U'"
            style={{
              flex: 1,
              padding: '6px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '13px',
            }}
          />
          <button
            onClick={handleApplySolution}
            style={{
              padding: '6px 12px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            {t('apply')}
          </button>
        </div>
      </div>

      {/* 提示 */}
      {(!solution || solution.moves.length === 0) && !error && (
        <div style={{ color: '#666', fontSize: '13px' }}>
          {t('noSolution')}
        </div>
      )}
    </div>
  );
}

export default SolutionPanel;