import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Cube3D } from './components/Cube3D';
import { CubeEditor } from './components/CubeEditor';
import { SolutionPanel } from './components/SolutionPanel';
import { HelpPanel } from './components/HelpPanel';
import { preloadSolver } from './solver/Solver';
import { useLang } from './i18n';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<'editor' | 'solution' | 'help'>('editor');
  const { lang, setLang, t } = useLang();

  // 页面加载时预初始化求解器
  useEffect(() => {
    preloadSolver();
  }, []);

  return (
    <div className="app">
      <header className="header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>{t('title')}</h1>
            <p>{t('subtitle')}</p>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setLang('zh')}
              style={{
                padding: '6px 12px',
                backgroundColor: lang === 'zh' ? '#007bff' : '#e9ecef',
                color: lang === 'zh' ? 'white' : '#333',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              {t('langZh')}
            </button>
            <button
              onClick={() => setLang('en')}
              style={{
                padding: '6px 12px',
                backgroundColor: lang === 'en' ? '#007bff' : '#e9ecef',
                color: lang === 'en' ? 'white' : '#333',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              {t('langEn')}
            </button>
          </div>
        </div>
      </header>

      <div className="main-content">
        {/* 3D魔方视图 */}
        <div className="cube-view">
          <Suspense fallback={<div className="loading">Loading...</div>}>
            <Canvas
              gl={{ antialias: true }}
              camera={{ position: [5, 5, 5], fov: 50 }}
            >
              <ambientLight intensity={0.6} />
              <directionalLight
                position={[10, 10, 10]}
                intensity={1}
              />
              <directionalLight
                position={[-10, -10, -10]}
                intensity={0.5}
              />
              <Cube3D />
              <OrbitControls
                enablePan={false}
                enableZoom={true}
                minDistance={5}
                maxDistance={15}
              />
            </Canvas>
          </Suspense>
        </div>

        {/* 控制面板 */}
        <div className="control-panel">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'editor' ? 'active' : ''}`}
              onClick={() => setActiveTab('editor')}
            >
              {t('tabEditor')}
            </button>
            <button
              className={`tab ${activeTab === 'solution' ? 'active' : ''}`}
              onClick={() => setActiveTab('solution')}
            >
              {t('tabSolution')}
            </button>
            <button
              className={`tab ${activeTab === 'help' ? 'active' : ''}`}
              onClick={() => setActiveTab('help')}
            >
              {t('tabHelp')}
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'editor' && <CubeEditor />}
            {activeTab === 'solution' && <SolutionPanel />}
            {activeTab === 'help' && <HelpPanel />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;