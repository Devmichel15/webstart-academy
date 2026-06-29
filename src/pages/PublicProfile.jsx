import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { PlayerCard } from '../components/gamification/PlayerCard'
import { ShareButtons } from '../components/share/ShareButtons'
import { Card } from '../components/ui/Card'
import { getGlobalRanking, getPublicProfileByUsername, getUserRankPercentile } from '../services/publicProfileService'

export default function PublicProfile() {
  const { username } = useParams()
  const [profile, setProfile] = useState(null)
  const [rank, setRank] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      if (!username) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setLoading(true)
      const data = await getPublicProfileByUsername(username)
      if (!data) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setProfile(data)

      const ranking = await getGlobalRanking(100)
      const userRank = ranking.find((item) => item.username === username)
      if (userRank) setRank(userRank.rank)

      setLoading(false)
    }

    load()
  }, [username])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <Loader2 className="animate-spin text-brand-500" size={32} />
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-canvas p-6 text-center">
        <h1 className="text-2xl font-black">Perfil não encontrado</h1>
        <p className="mt-2 text-secondary">Este jogador não existe ou o perfil é privado.</p>
        <Link to="/login" className="mt-6 font-bold text-brand-600 underline">
          Entrar na WebStart
        </Link>
      </div>
    )
  }

  const rankPercentile = rank ? getUserRankPercentile(rank, 100) : null

  return (
    <div className="min-h-screen bg-canvas px-4 py-8">
      <div className="mx-auto max-w-lg">
        <Link to="/login" className="mb-6 inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:underline">
          <ArrowLeft size={16} />
          Entrar na WebStart
        </Link>

        <PlayerCard
          user={profile}
          rank={rank}
          rankPercentile={rankPercentile}
        />

        <Card className="mt-6">
          <h3 className="mb-3 font-black">Partilhar perfil</h3>
          <ShareButtons
            shareData={{
              name: profile.name,
              title: `Perfil WebStart — Nível ${profile.level}`,
              streak: profile.streak,
              level: profile.level,
              badge: profile.latestBadge,
              tagline: 'Dev em construção na WebStart Academy',
            }}
          />
        </Card>

        <div className="mt-8 text-center">
          <Link
            to="/registro"
            className="inline-block rounded-xl border-3 border-brand-800 bg-brand-500 px-6 py-3 font-black text-white shadow-[4px_4px_0_0_#064e3b] transition hover:bg-brand-600 dark:border-brand-400"
          >
            Começar a aprender grátis
          </Link>
        </div>
      </div>
    </div>
  )
}
