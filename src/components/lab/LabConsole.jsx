import { useState } from 'react'
import { CheckCircle2, AlertCircle, XCircle, Terminal } from 'lucide-react'

const LOG_ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: AlertCircle,
}

const LOG_COLORS = {
  success: 'text-green-400',
  error: 'text-red-400',
  info: 'text-blue-400',
}

export function LabConsole({ logs = [] }) {
  const [collapsed, setCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('console')

  return (
    <div className={`lab-console ${collapsed ? 'lab-console-collapsed' : ''}`}>
      {/* Console Header */}
      <div className="lab-console-header">
        <div className="lab-console-tabs">
          <button
            className={`lab-console-tab ${activeTab === 'console' ? 'lab-console-tab-active' : ''}`}
            onClick={() => setActiveTab('console')}
          >
            <Terminal size={14} />
            CONSOLE
            {logs.length > 0 && (
              <span className="lab-console-badge">{logs.length}</span>
            )}
          </button>
          <button
            className={`lab-console-tab ${activeTab === 'problems' ? 'lab-console-tab-active' : ''}`}
            onClick={() => setActiveTab('problems')}
          >
            <AlertCircle size={14} />
            PROBLEMAS
          </button>
        </div>
        <button
          className="lab-console-toggle"
          onClick={() => setCollapsed((v) => !v)}
        >
          {collapsed ? '▲' : '▼'}
        </button>
      </div>

      {/* Console Content */}
      {!collapsed && (
        <div className="lab-console-body">
          {activeTab === 'console' && (
            <div className="lab-console-logs">
              {logs.length === 0 ? (
                <p className="lab-console-empty">
                  Nenhuma mensagem ainda. Execute o código para ver resultados.
                </p>
              ) : (
                logs.map((log, i) => {
                  const Icon = LOG_ICONS[log.type] || AlertCircle
                  const colorClass = LOG_COLORS[log.type] || 'text-gray-400'
                  return (
                    <div key={i} className="lab-console-log">
                      <Icon size={14} className={`shrink-0 ${colorClass}`} />
                      <span className="lab-console-log-msg">{log.message}</span>
                      {log.detail && (
                        <span className="lab-console-log-detail">{log.detail}</span>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}
          {activeTab === 'problems' && (
            <div className="lab-console-logs">
              <p className="lab-console-empty">Nenhum problema detectado.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
