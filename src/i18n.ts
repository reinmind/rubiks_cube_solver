import { create } from 'zustand';

export type Lang = 'zh' | 'en';

type TranslationValue = string | string[];

interface Translations {
  [key: string]: TranslationValue;
}

export const i18n: { zh: Translations; en: Translations } = {
  zh: {
    // 标题
    title: '魔方求解器',
    subtitle: '3阶魔方状态编辑、求解与动画演示工具',

    // Tab
    tabEditor: '状态编辑',
    tabSolution: '求解与动画',
    tabHelp: '使用说明',

    // 编辑器
    editorTitle: '魔方状态编辑器',
    editOn: '编辑: 开',
    editOff: '编辑: 关',
    reset: '重置',
    validate: '校验',
    rotateOps: '旋转操作:',
    stateString: '状态字符串 (54字符):',
    apply: '应用',
    copy: '复制',
    copied: '已复制!',
    formatError: '格式错误：需要54个字符（仅含URFDLB）',

    // 验证结果
    validState: '状态合法',
    invalidState: '状态不合法:',

    // 求解面板
    solverReady: '求解器已就绪',
    solverInit: '求解器初始化中...',
    solve: '自动求解',
    solving: '求解中...',
    scramble: '打乱魔方',
    scrambleFormula: '打乱公式:',
    solution: '解法',
    steps: '步',
    progress: '进度:',
    play: '▶ 播放',
    pause: '⏸ 暂停',
    manualSolution: '手动输入解法:',
    noSolution: '点击"打乱魔方"生成随机状态，然后点击"自动求解"获取解法',
    timeoutError: '求解超时，可能是不可解的魔方状态',

    // 帮助面板
    helpTitle: '使用说明',
    help3dView: '3D 视图操作',
    help3dViewContent: ['拖动 3D 视图旋转魔方视角', '滚轮缩放视图'],
    helpEditor: '状态编辑',
    helpEditorContent: [
      '点击"编辑: 关"按钮开启编辑模式',
      '选择颜色后，点击 2D 视图中的格子修改颜色',
      '使用旋转按钮 (U/U\'/D/D\' 等) 执行旋转操作',
      '输入状态字符串可直接设置魔方状态',
      '点击"校验"检查魔方状态是否合法',
    ],
    helpSolution: '求解与动画',
    helpSolutionContent: [
      '点击"打乱魔方"生成随机打乱状态',
      '点击"自动求解"获取解法',
      '使用播放/暂停/单步按钮控制动画',
      '拖动速度滑块调整动画速度',
      '点击解法步骤可直接跳转到该步',
    ],
    helpStringFormat: '状态字符串格式',
    helpStringFormatContent: '54个字符，顺序：U面(9) + R面(9) + F面(9) + D面(9) + L面(9) + B面(9)',
    helpStringMeaning: '字符含义：U=黄, R=红, F=蓝, D=白, L=橙, B=绿',
    helpColors: '魔方配色',
    helpColorsContent: ['U面-黄色', 'D面-白色', 'F面-蓝色', 'B面-绿色', 'L面-橙色', 'R面-红色'],

    // 语言
    langZh: '中文',
    langEn: 'English',
  },
  en: {
    // Title
    title: 'Rubik\'s Cube Solver',
    subtitle: '3x3 Cube State Editor, Solver & Animation Tool',

    // Tab
    tabEditor: 'State Editor',
    tabSolution: 'Solve & Animate',
    tabHelp: 'Help',

    // Editor
    editorTitle: 'Cube State Editor',
    editOn: 'Edit: ON',
    editOff: 'Edit: OFF',
    reset: 'Reset',
    validate: 'Validate',
    rotateOps: 'Rotation:',
    stateString: 'State String (54 chars):',
    apply: 'Apply',
    copy: 'Copy',
    copied: 'Copied!',
    formatError: 'Format error: need 54 chars (URFDLB only)',

    // Validation
    validState: 'Valid state',
    invalidState: 'Invalid state:',

    // Solution Panel
    solverReady: 'Solver ready',
    solverInit: 'Initializing solver...',
    solve: 'Solve',
    solving: 'Solving...',
    scramble: 'Scramble',
    scrambleFormula: 'Scramble:',
    solution: 'Solution',
    steps: 'steps',
    progress: 'Progress:',
    play: '▶ Play',
    pause: '⏸ Pause',
    manualSolution: 'Manual solution:',
    noSolution: 'Click "Scramble" to generate a random state, then click "Solve"',
    timeoutError: 'Solve timeout - possibly unsolvable cube state',

    // Help Panel
    helpTitle: 'Instructions',
    help3dView: '3D View Controls',
    help3dViewContent: ['Drag to rotate cube view', 'Scroll to zoom'],
    helpEditor: 'State Editor',
    helpEditorContent: [
      'Click "Edit: OFF" to enable edit mode',
      'Select a color, then click cells in 2D view to change colors',
      'Use rotation buttons (U/U\'/D/D\' etc.) to perform rotations',
      'Enter state string to set cube state directly',
      'Click "Validate" to check if state is valid',
    ],
    helpSolution: 'Solve & Animate',
    helpSolutionContent: [
      'Click "Scramble" to generate a random state',
      'Click "Solve" to get the solution',
      'Use play/pause/step buttons to control animation',
      'Drag speed slider to adjust animation speed',
      'Click solution steps to jump to that step',
    ],
    helpStringFormat: 'State String Format',
    helpStringFormatContent: '54 chars: U(9) + R(9) + F(9) + D(9) + L(9) + B(9)',
    helpStringMeaning: 'Chars: U=Yellow, R=Red, F=Blue, D=White, L=Orange, B=Green',
    helpColors: 'Cube Colors',
    helpColorsContent: ['U-Yellow', 'D-White', 'F-Blue', 'B-Green', 'L-Orange', 'R-Red'],

    // Language
    langZh: '中文',
    langEn: 'English',
  },
};

export type TranslationKey = keyof typeof i18n.zh;

// 语言状态管理
interface LangStore {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => TranslationValue;
}

export const useLang = create<LangStore>((set, get) => ({
  lang: 'en',
  setLang: (lang) => set({ lang }),
  t: (key) => i18n[get().lang][key],
}));