import { useState, useMemo } from 'react';
import { CubeState, FaceName, CubeColor, COLOR_HEX, FACE_NAMES_CN, FACE_NAMES_EN } from '../types/cube';
import { useCubeStore } from '../hooks/useCubeStore';
import { stateToString, stringToState } from '../core/Cube';
import { useLang } from '../i18n';

// 颜色选择器
function ColorPicker() {
  const selectedColor = useCubeStore((state) => state.selectedColor);
  const setSelectedColor = useCubeStore((state) => state.setSelectedColor);
  const colors: CubeColor[] = ['white', 'yellow', 'red', 'orange', 'blue', 'green'];

  return (
    <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
      {colors.map((color) => (
        <button
          key={color}
          onClick={() => setSelectedColor(color)}
          style={{
            width: '32px',
            height: '32px',
            backgroundColor: COLOR_HEX[color],
            border: selectedColor === color ? '3px solid #000' : '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
          title={color}
        />
      ))}
    </div>
  );
}

// 单个面的2D视图
interface FaceViewProps {
  face: FaceName;
  state: CubeState;
  onCellClick: (face: FaceName, row: number, col: number) => void;
  isSelected: boolean;
  lang: 'zh' | 'en';
}

function FaceView({ face, state, onCellClick, isSelected, lang }: FaceViewProps) {
  const faceState = state[face];
  const faceName = lang === 'zh' ? FACE_NAMES_CN[face] : FACE_NAMES_EN[face];

  return (
    <div
      style={{
        display: 'inline-block',
        margin: '2px',
        border: isSelected ? '2px solid #007bff' : '1px solid #ccc',
        borderRadius: '4px',
        padding: '4px',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '2px', fontWeight: 'bold', fontSize: '12px' }}>
        {faceName} ({face})
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px' }}>
        {faceState.map((row, rowIndex) =>
          row.map((color, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              onClick={() => onCellClick(face, rowIndex, colIndex)}
              style={{
                width: '24px',
                height: '24px',
                backgroundColor: COLOR_HEX[color],
                border: '1px solid #333',
                borderRadius: '2px',
                cursor: 'pointer',
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

// 完整的魔方编辑器
export function CubeEditor() {
  const cubeState = useCubeStore((state) => state.cubeState);
  const setCubeState = useCubeStore((state) => state.setCubeState);
  const setCellColor = useCubeStore((state) => state.setCellColor);
  const selectedColor = useCubeStore((state) => state.selectedColor);
  const selectedFace = useCubeStore((state) => state.selectedFace);
  const editMode = useCubeStore((state) => state.editMode);
  const setEditMode = useCubeStore((state) => state.setEditMode);
  const validate = useCubeStore((state) => state.validate);
  const validationResult = useCubeStore((state) => state.validationResult);
  const reset = useCubeStore((state) => state.reset);
  const animatingMove = useCubeStore((state) => state.animatingMove);
  const setAnimatingMove = useCubeStore((state) => state.setAnimatingMove);
  const { lang, t } = useLang();

  // 当前状态字符串（始终显示）
  const currentStateString = useMemo(() => stateToString(cubeState), [cubeState]);

  const [inputString, setInputString] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [stringError, setStringError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCellClick = (face: FaceName, row: number, col: number) => {
    if (editMode) {
      setCellColor(face, row, col, selectedColor);
    }
  };

  const handleValidate = () => {
    validate();
  };

  // 旋转操作（带动画）
  const handleRotate = (face: FaceName, clockwise: boolean) => {
    if (animatingMove) return;
    setAnimatingMove({
      face,
      clockwise,
      progress: 0,
      rotationCount: 0,
    });
  };

  // 应用状态字符串
  const handleApplyStateString = () => {
    const newState = stringToState(inputString);
    if (newState) {
      setCubeState(newState);
      setInputString('');
      setIsEditing(false);
      setStringError('');
    } else {
      setStringError(t('formatError') as string);
    }
  };

  // 复制当前状态字符串
  const handleCopyStateString = () => {
    navigator.clipboard.writeText(currentStateString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    });
  };

  // 输入框获得焦点时进入编辑模式
  const handleInputFocus = () => {
    if (!isEditing) {
      setInputString(currentStateString);
      setIsEditing(true);
    }
  };

  // 输入框失去焦点时退出编辑模式
  const handleInputBlur = () => {
    setTimeout(() => {
      setIsEditing(false);
      setInputString('');
      setStringError('');
    }, 200);
  };

  // 旋转按钮配置
  const rotateButtons: { face: FaceName; label: string }[] = [
    { face: 'U', label: 'U' },
    { face: 'D', label: 'D' },
    { face: 'L', label: 'L' },
    { face: 'R', label: 'R' },
    { face: 'F', label: 'F' },
    { face: 'B', label: 'B' },
  ];

  return (
    <div style={{ padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
      <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>{t('editorTitle')}</h3>
        <button
          onClick={() => setEditMode(!editMode)}
          style={{
            padding: '6px 12px',
            backgroundColor: editMode ? '#28a745' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          {editMode ? t('editOn') : t('editOff')}
        </button>
        <button
          onClick={reset}
          style={{
            padding: '6px 12px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          {t('reset')}
        </button>
        <button
          onClick={handleValidate}
          style={{
            padding: '6px 12px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          {t('validate')}
        </button>
      </div>

      {editMode && <ColorPicker />}

      {/* 旋转操作按钮 */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '13px', marginBottom: '6px', fontWeight: 'bold' }}>{t('rotateOps')}</div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {rotateButtons.map(({ face, label }) => (
            <div key={face} style={{ display: 'flex', gap: '2px' }}>
              <button
                onClick={() => handleRotate(face, true)}
                style={{
                  padding: '6px 10px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                }}
              >
                {label}
              </button>
              <button
                onClick={() => handleRotate(face, false)}
                style={{
                  padding: '6px 6px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                }}
              >
                {label}'
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 状态字符串输入 */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '13px', marginBottom: '6px', fontWeight: 'bold' }}>{t('stateString')}</div>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
          <input
            type="text"
            value={isEditing ? inputString : currentStateString}
            onChange={(e) => setInputString(e.target.value.toUpperCase())}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            style={{
              flex: 1,
              padding: '6px 8px',
              fontSize: '12px',
              fontFamily: 'monospace',
              border: stringError ? '1px solid #dc3545' : '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
          <button
            onClick={handleApplyStateString}
            style={{
              padding: '6px 12px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            {t('apply')}
          </button>
          <button
            onClick={handleCopyStateString}
            style={{
              padding: '6px 12px',
              backgroundColor: '#e9ecef',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            {copied ? t('copied') : t('copy')}
          </button>
        </div>
        {stringError && (
          <div style={{ color: '#dc3545', fontSize: '12px' }}>{stringError}</div>
        )}
      </div>

      {/* 展开的魔方视图 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
          <FaceView
            face="U"
            state={cubeState}
            onCellClick={handleCellClick}
            isSelected={selectedFace === 'U'}
            lang={lang}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {(['L', 'F', 'R', 'B'] as FaceName[]).map((face) => (
            <FaceView
              key={face}
              face={face}
              state={cubeState}
              onCellClick={handleCellClick}
              isSelected={selectedFace === face}
              lang={lang}
            />
          ))}
        </div>

        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
          <FaceView
            face="D"
            state={cubeState}
            onCellClick={handleCellClick}
            isSelected={selectedFace === 'D'}
            lang={lang}
          />
        </div>
      </div>

      {/* 验证结果 */}
      {validationResult && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: validationResult.valid ? '#d4edda' : '#f8d7da',
            borderRadius: '4px',
            color: validationResult.valid ? '#155724' : '#721c24',
          }}
        >
          {validationResult.valid ? (
            <strong>{t('validState')}</strong>
          ) : (
            <div>
              <strong>{t('invalidState')}</strong>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                {validationResult.messages.map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CubeEditor;