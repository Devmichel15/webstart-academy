import { useCallback, useEffect, useState } from 'react'
import { Flag, Loader2, RefreshCw, Trash2, X } from 'lucide-react'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx'
import { useToast } from '../../contexts/ToastContext.jsx'
import {
  getCommentById,
  getProjectById,
  hydrateAuthors,
  listReports,
  resolveReport,
} from '../../services/communityService.js'
import { formatDatePt } from '../../utils/formatDate.js'

export default function AdminReports() {
  const { showSuccess, showError } = useToast()
  const [reports, setReports] = useState([])
  const [details, setDetails] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [acting, setActing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const list = await listReports()
      setReports(list)

      const reporterIds = [...new Set(list.map((r) => r.reporter_id))]
      const authors = await hydrateAuthors([...reporterIds.map((id) => ({ authorId: id }))])

      const enriched = {}
      for (const report of list) {
        const item = { reporter: authors[report.reporter_id] || { name: '??', photoURL: '' } }
        if (report.project_id) {
          const project = await getProjectById(report.project_id)
          item.target = project
            ? { type: 'projeto', title: project.title, authorId: project.authorId }
            : { type: 'projeto', title: '(conteúdo já removido)' }
        } else if (report.comment_id) {
          const comment = await getCommentById(report.comment_id)
          if (comment) {
            const project = await getProjectById(comment.projectId)
            item.target = {
              type: 'comentário',
              title: comment.content,
              snippet: comment.content.slice(0, 120),
              authorId: comment.authorId,
              projectTitle: project?.title,
            }
          } else {
            item.target = { type: 'comentário', title: '(conteúdo já removido)' }
          }
        }
        enriched[report.id] = item
      }
      setDetails(enriched)
    } catch {
      setError(true)
      showError('Não foi possível carregar as denúncias.')
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    load()
  }, [load])

  const handleResolve = async () => {
    if (!pendingAction || acting) return
    setActing(true)
    try {
      await resolveReport(pendingAction.id, pendingAction.action)
      showSuccess(pendingAction.action === 'delete' ? 'Conteúdo excluído e denúncia resolvida.' : 'Denúncia descartada.')
      setPendingAction(null)
      await load()
    } catch (err) {
      showError(err.message || 'Não foi possível resolver a denúncia.')
    } finally {
      setActing(false)
    }
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-primary">Denúncias do Feed</h1>
          <p className="mt-1 text-sm text-secondary">
            Conteúdo reportado pelos alunos. Avaliar e agir.
          </p>
        </div>
        <Button variant="secondary" onClick={load} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Atualizar
        </Button>
      </div>

      {loading && (
        <Card className="flex items-center gap-3 p-8 text-secondary">
          <Loader2 size={20} className="animate-spin text-brand-500" /> A carregar denúncias...
        </Card>
      )}

      {!loading && error && (
        <Card className="p-8 text-center">
          <p className="mb-4 font-bold text-red-500">Não foi possível carregar as denúncias.</p>
          <Button variant="secondary" onClick={load}>Tentar novamente</Button>
        </Card>
      )}

      {!loading && !error && reports.length === 0 && (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <Flag size={40} className="text-brand-500" />
          <h2 className="text-lg font-black text-primary">Nenhuma denúncia pendente</h2>
          <p className="max-w-md text-sm text-secondary">
            Quando um aluno denunciar conteúdo do feed, aparece aqui para a equipa rever.
          </p>
        </Card>
      )}

      {!loading && !error && reports.length > 0 && (
        <div className="space-y-4">
          {reports.map((report) => {
            const detail = details[report.id] || {}
            const target = detail.target || {}
            return (
              <Card key={report.id} className="p-5">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-secondary">
                      Denunciado por <span className="font-bold text-primary">{detail.reporter?.name || '??'}</span>
                      {' · '}
                      {formatDatePt(report.created_at)}
                    </p>
                    <p className="mt-1 font-bold text-primary">
                      <span className="rounded-md bg-red-100 px-2 py-0.5 text-xs font-black uppercase tracking-wide text-red-700 dark:bg-red-950 dark:text-red-300">
                        {target.type || 'conteúdo'}
                      </span>{' '}
                      {target.type === 'comentário' ? (
                        <span className="italic">"{target.snippet || target.title}"</span>
                      ) : (
                        target.title
                      )}
                    </p>
                    {target.projectTitle && (
                      <p className="text-xs text-secondary">Projecto: {target.projectTitle}</p>
                    )}
                  </div>
                </div>

                <div className="mb-4 rounded-lg border-2 border-strong bg-surface-hover p-3 text-sm text-primary">
                  <span className="text-xs font-black uppercase tracking-wide text-secondary">Motivo: </span>
                  {report.reason}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPendingAction({ id: report.id, action: 'delete' })}
                    disabled={acting || !target.title || target.title.includes('já removido')}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-1.5 text-sm font-bold text-white cursor-pointer hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 size={14} /> Excluir conteúdo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingAction({ id: report.id, action: 'dismiss' })}
                    disabled={acting}
                    className="inline-flex items-center gap-2 rounded-lg border-2 border-strong px-3 py-1.5 text-sm font-bold text-primary hover:bg-surface-hover disabled:opacity-50"
                  >
                    <X size={14} /> Descartar denúncia
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingAction?.action === 'delete' ? 'Excluir conteúdo denunciado' : 'Descartar denúncia'}
        message={
          pendingAction?.action === 'delete'
            ? 'Excluir este conteúdo do feed? Comentários e likes associados também serão removidos. Esta ação não pode ser revertida.'
            : 'Marcar esta denúncia como resolvida sem excluir o conteúdo?'
        }
        confirmLabel={pendingAction?.action === 'delete' ? 'Excluir' : 'Descartar'}
        danger={pendingAction?.action === 'delete'}
        loading={acting}
        onConfirm={handleResolve}
        onCancel={() => !acting && setPendingAction(null)}
      />
    </>
  )
}