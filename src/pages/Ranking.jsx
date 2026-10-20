import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Crown, Medal, Trophy, User } from 'lucide-react'
import { Header } from '../components/layout/Header.jsx'
import { Card } from '../components/ui/Card.jsx'
import { SEO } from '../components/seo/SEO.jsx'
import { Skeleton } from '../components/ui/Skeleton.jsx'
import { getTop10Users } from '../services/rankingService.js'

const MEDALS = [Trophy, Medal, Medal, Crown]

export default function Ranking() {
  const [topUsers, setTopUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    getTop10Users()
      .then((users) => {
        if (active) {
          setTopUsers(users)
          setError(null)
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Não foi possível carregar o ranking.')
          setTopUsers([])
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <>
      <SEO title="Ranking" description="Top 10 dos alunos com mais XP na WebStart Academy." url="/ranking" keywords="ranking, top, xp, classificacao" />
      <Header title="Ranking" subtitle="Os 10 melhores jogadores da WebStart" />

      {loading && (
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {!loading && error && (
        <Card className="p-6 text-center">
          <p className="font-bold text-red-500">{error}</p>
        </Card>
      )}

      {!loading && !error && topUsers.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-secondary">Ainda não há dados suficientes para o ranking.</p>
        </Card>
      )}

      {!loading && !error && topUsers.length > 0 && (
        <div className="space-y-3">
          {topUsers.map((user, index) => {
            const position = index + 1
            const MedalIcon = MEDALS[index] || Medal
            const medalColor = index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-500' : 'text-brand-500'
            const name = user.name || user.username || 'Aluno'
            const username = user.username
            return (
              <Card key={user.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex w-10 items-center justify-center">
                    {position <= 3 ? (
                      <MedalIcon size={28} className={medalColor} />
                    ) : (
                      <span className="text-lg font-black text-secondary">#{position}</span>
                    )}
                  </div>
                  {user.photo_url ? (
                    <img
                      src={user.photo_url}
                      alt={name}
                      className="h-12 w-12 rounded-full border-2 border-strong object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-strong bg-accent-soft">
                      <User size={20} className="text-secondary" />
                    </div>
                  )}
                  <div>
                    {username ? (
                      <Link to={`/u/${username}`} className="font-bold text-primary hover:underline">
                        {name}
                      </Link>
                    ) : (
                      <p className="font-bold text-primary">{name}</p>
                    )}
                    {username && <p className="text-xs text-secondary">@{username}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-brand-600 dark:text-brand-300">{user.xp} XP</p>
                  <p className="text-xs text-secondary">Nível {user.level}</p>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
