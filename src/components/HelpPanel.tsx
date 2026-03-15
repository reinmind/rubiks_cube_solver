import { useLang } from '../i18n';

// 使用说明面板
export function HelpPanel() {
  const { t } = useLang();

  // Helper to render array content
  const renderList = (key: string) => {
    const value = t(key as any);
    if (Array.isArray(value)) {
      return value.map((item, i) => <li key={i}>{item}</li>);
    }
    return null;
  };

  return (
    <div style={{ padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
      <h3 style={{ marginTop: 0, fontSize: '16px' }}>{t('helpTitle') as string}</h3>

      <section style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#333' }}>{t('help3dView') as string}</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#555' }}>
          {renderList('help3dViewContent')}
        </ul>
      </section>

      <section style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#333' }}>{t('helpEditor') as string}</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#555' }}>
          {renderList('helpEditorContent')}
        </ul>
      </section>

      <section style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#333' }}>{t('helpSolution') as string}</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#555' }}>
          {renderList('helpSolutionContent')}
        </ul>
      </section>

      <section style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#333' }}>{t('helpStringFormat') as string}</h4>
        <p style={{ margin: 0, fontSize: '13px', color: '#555' }}>
          {t('helpStringFormatContent') as string}
        </p>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#555' }}>
          {t('helpStringMeaning') as string}
        </p>
      </section>

      <section>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#333' }}>{t('helpColors') as string}</h4>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '13px' }}>
          {Array.isArray(t('helpColorsContent')) && (t('helpColorsContent') as string[]).map((item, i) => (
            <span key={i}>{item}</span>
          ))}
        </div>
      </section>
    </div>
  );
}

export default HelpPanel;