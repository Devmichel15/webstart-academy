import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { CodeEditor } from './CodeEditor.jsx'
import { PreviewFrame } from './PreviewFrame.jsx'
import { LabConsole } from './LabConsole.jsx'
import { LabToolbar } from './LabToolbar.jsx'
import { InfoPanel } from './InfoPanel.jsx'
import { highlightCode } from './SyntaxHighlighter.js'

export function CodeLab({
  initialHtml = '<h1>WebStart Lab</h1>\n<p>Edite aqui!</p>',
  initialCss = 'body { font-family: sans-serif; padding: 1rem; }\nh1 { color: #059669; }',
  lab = null,
  compact = false,
}) {
  const [html, setHtml] = useState(initialHtml)
  const [css, setCss] = useState(initialCss)
  const [logs, setLogs] = useState([])
  const [showHint, setShowHint] = useState(false)
  const [showSolution, setShowSolution] = useState(false)
  const [executed, setExecuted] = useState(false)
  const [previewExpanded, setPreviewExpanded] = useState(false)
  const [activeEditor, setActiveEditor] = useState('html')
  const [fullscreen, setFullscreen] = useState(false)
  const labRef = useRef(null)

  const addLog = useCallback((type, message, detail) => {
    setLogs((prev) => [...prev, { type, message, detail }])
  }, [])

  const handleExecute = useCallback(() => {
    setExecuted(true)
    addLog('success', 'HTML compilado com sucesso', `${html.length} caracteres`)
    addLog('success', 'CSS atualizado', `${css.length} caracteres`)
  }, [html, css, addLog])

  const handleReset = useCallback(() => {
    setHtml(initialHtml)
    setCss(initialCss)
    setLogs([])
    setExecuted(false)
    setShowHint(false)
    setShowSolution(false)
    addLog('info', 'Código restaurado ao estado inicial')
  }, [initialHtml, initialCss, addLog])

  const handleCopy = useCallback(async () => {
    const code = `<!-- HTML -->\n${html}\n\n/* CSS */\n${css}`
    await navigator.clipboard.writeText(code)
    addLog('success', 'Código copiado para a área de transferência')
  }, [html, css, addLog])

  const handleToggleHint = useCallback(() => {
    setShowHint((v) => !v)
  }, [])

  const handleToggleSolution = useCallback(() => {
    setShowSolution((v) => !v)
  }, [])

  const handleToggleExpand = useCallback(() => {
    setPreviewExpanded((v) => !v)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      labRef.current?.requestFullscreen()
      setFullscreen(true)
    } else {
      document.exitFullscreen()
      setFullscreen(false)
    }
  }, [])

  useEffect(() => {
    const handleFsChange = () => {
      setFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  // Auto-execute on mount
  useEffect(() => {
    handleExecute()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const previewKey = useMemo(() => html + css, [html, css])

  return (
    <div className={`lab-container ${fullscreen ? 'lab-fullscreen' : ''}`} ref={labRef}>
      {/* Toolbar */}
      <LabToolbar
        onExecute={handleExecute}
        onReset={handleReset}
        onToggleHint={handleToggleHint}
        onToggleSolution={handleToggleSolution}
        onCopyCode={handleCopy}
        showHint={showHint}
        showSolution={showSolution}
        hasHint={!!lab?.hint}
        hasSolution={!!lab?.solutionHtml || !!lab?.solutionCss}
        executed={executed}
      />

      {/* Main Content */}
      <div className="lab-main">
        {/* Editor Panel */}
        <div className={`lab-editor-panel ${previewExpanded ? 'lab-editor-panel-collapsed' : ''}`}>
          {/* Editor Tabs */}
          <div className="lab-editor-tabs">
            <button
              className={`lab-editor-tab ${activeEditor === 'html' ? 'lab-editor-tab-active' : ''}`}
              onClick={() => setActiveEditor('html')}
            >
              <span className="lab-editor-tab-icon lab-editor-tab-html">&lt;/&gt;</span>
              index.html
            </button>
            <button
              className={`lab-editor-tab ${activeEditor === 'css' ? 'lab-editor-tab-active' : ''}`}
              onClick={() => setActiveEditor('css')}
            >
              <span className="lab-editor-tab-icon lab-editor-tab-css">#</span>
              styles.css
            </button>
          </div>

          {/* Editor Content */}
          <div className="lab-editor-area">
            <div style={{ display: activeEditor === 'html' ? 'block' : 'none' }}>
              <CodeEditor
                value={html}
                onChange={setHtml}
                language="html"
                placeholder="<!-- Escreva seu HTML aqui -->"
              />
            </div>
            <div style={{ display: activeEditor === 'css' ? 'block' : 'none' }}>
              <CodeEditor
                value={css}
                onChange={setCss}
                language="css"
                placeholder="/* Escreva seu CSS aqui */"
              />
            </div>
          </div>

          {/* Solution Overlay */}
          {showSolution && (lab?.solutionHtml || lab?.solutionCss) && (
            <div className="lab-solution">
              <h4 className="lab-solution-title">Solução</h4>
              {lab.solutionHtml && (
                <div className="lab-solution-block">
                  <span className="lab-solution-label">HTML</span>
                  <pre className="lab-solution-code">
                    <code dangerouslySetInnerHTML={{ __html: highlightCode(lab.solutionHtml, 'html') }} />
                  </pre>
                </div>
              )}
              {lab.solutionCss && (
                <div className="lab-solution-block">
                  <span className="lab-solution-label">CSS</span>
                  <pre className="lab-solution-code">
                    <code dangerouslySetInnerHTML={{ __html: highlightCode(lab.solutionCss, 'css') }} />
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Preview Panel */}
        <div className={`lab-preview-panel ${previewExpanded ? 'lab-preview-panel-expanded' : ''}`}>
          <PreviewFrame
            html={html}
            css={css}
            key={previewKey}
            expanded={previewExpanded}
            onToggleExpand={handleToggleExpand}
          />
        </div>
      </div>

      {/* Console */}
      <LabConsole logs={logs} />

      {/* Info Panel (sidebar style) */}
      {lab && <InfoPanel lab={lab} />}
    </div>
  )
}
