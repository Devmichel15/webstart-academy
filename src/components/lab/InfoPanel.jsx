import { useState } from 'react'
import { Target, List, Lightbulb, Trophy, ChevronDown, ChevronRight } from 'lucide-react'

export function InfoPanel({ lab }) {
  const [expandedSections, setExpandedSections] = useState({
    objective: true,
    checklist: false,
    hint: false,
    criteria: false,
  })

  if (!lab) return null

  const toggle = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  return (
    <div className="lab-info">
      {/* Objective */}
      <div className="lab-info-section">
        <button className="lab-info-header" onClick={() => toggle('objective')}>
          <Target size={16} className="text-blue-400" />
          <span>Objetivo</span>
          {expandedSections.objective ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {expandedSections.objective && (
          <p className="lab-info-content">{lab.description || lab.context}</p>
        )}
      </div>

      {/* Checklist */}
      {lab.checklist && lab.checklist.length > 0 && (
        <div className="lab-info-section">
          <button className="lab-info-header" onClick={() => toggle('checklist')}>
            <List size={16} className="text-green-400" />
            <span>Checklist</span>
            {expandedSections.checklist ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {expandedSections.checklist && (
            <ul className="lab-info-checklist">
              {lab.checklist.map((item, i) => (
                <li key={i} className="lab-info-checklist-item">
                  <label className="lab-info-checkbox">
                    <input type="checkbox" />
                    <span>{item}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Hint */}
      {lab.hint && (
        <div className="lab-info-section">
          <button className="lab-info-header" onClick={() => toggle('hint')}>
            <Lightbulb size={16} className="text-amber-400" />
            <span>Dica</span>
            {expandedSections.hint ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {expandedSections.hint && (
            <div className="lab-info-hint">
              <p>{lab.hint}</p>
            </div>
          )}
        </div>
      )}

      {/* Criteria / Rubric */}
      {lab.rubric && lab.rubric.length > 0 && (
        <div className="lab-info-section">
          <button className="lab-info-header" onClick={() => toggle('criteria')}>
            <Trophy size={16} className="text-purple-400" />
            <span>Critérios de Avaliação</span>
            {expandedSections.criteria ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {expandedSections.criteria && (
            <ul className="lab-info-criteria">
              {lab.rubric.map((item, i) => (
                <li key={i} className="lab-info-criteria-item">{item}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
