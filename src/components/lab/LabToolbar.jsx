import { Play, RotateCcw, Lightbulb, Eye, Copy, Check } from 'lucide-react'

export function LabToolbar({
  onExecute,
  onReset,
  onToggleHint,
  onToggleSolution,
  onCopyCode,
  showHint,
  showSolution,
  hasHint,
  hasSolution,
  executed,
}) {
  return (
    <div className="lab-toolbar">
      <div className="lab-toolbar-left">
        <button className="lab-btn lab-btn-primary" onClick={onExecute}>
          <Play size={14} />
          Executar
        </button>
        <button className="lab-btn lab-btn-secondary" onClick={onReset}>
          <RotateCcw size={14} />
          Resetar
        </button>
        <div className="lab-toolbar-divider" />
        {hasHint && (
          <button
            className={`lab-btn lab-btn-ghost ${showHint ? 'lab-btn-active' : ''}`}
            onClick={onToggleHint}
          >
            <Lightbulb size={14} />
            Dica
          </button>
        )}
        {hasSolution && (
          <button
            className={`lab-btn lab-btn-ghost ${showSolution ? 'lab-btn-active' : ''}`}
            onClick={onToggleSolution}
          >
            <Eye size={14} />
            Solução
          </button>
        )}
      </div>
      <div className="lab-toolbar-right">
        <button className="lab-btn lab-btn-ghost" onClick={onCopyCode}>
          <Copy size={14} />
          Copiar
        </button>
        {executed && (
          <span className="lab-toolbar-status">
            <Check size={14} className="text-green-400" />
            Código executado
          </span>
        )}
      </div>
    </div>
  )
}
