import { useEffect, useState } from "react";
import { Flame, Medal, RefreshCw, Trophy } from "lucide-react";
import { Header } from "../components/layout/Header.jsx";
import { Card } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { SEO } from "../components/seo/SEO.jsx";
import { getWeeklyRanking } from "../services/rankingService.js";
import { toUserMessage } from "../utils/errors.js";

const rankStyles = {
  1: "border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30",
  2: "border-slate-400 bg-slate-50 dark:bg-slate-900/30",
  3: "border-orange-400 bg-orange-50 dark:bg-orange-950/30",
};

function formatWeek() {
  const monday = new Date();
  const day = monday.getDay() || 7;
  monday.setDate(monday.getDate() - day + 1);
  return `Semana de ${monday.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })}`;
}

export default function Ranking() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRanking = async () => {
    setLoading(true);
    setError("");
    try {
      setEntries(await getWeeklyRanking());
    } catch (loadError) {
      setError(
        toUserMessage(loadError, "Não foi possível carregar a classificação."),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    getWeeklyRanking()
      .then((data) => {
        if (!cancelled) setEntries(data);
      })
      .catch((loadError) => {
        if (!cancelled)
          setError(
            toUserMessage(loadError, "Não foi possível carregar a classificação."),
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const currentUser = entries.find((entry) => entry.is_current_user);
  const topEntries = entries.filter((entry) => entry.rank <= 10);

  return (
    <>
      <SEO
        title="Classificação semanal"
        description="Veja os alunos com maior pontuação nesta semana na WebStart Academy."
        url="/ranking"
        keywords="ranking, classificação, alunos, streak"
      />
      <div>
        <Header
          title="Classificação semanal"
          subtitle={`${formatWeek()} · aulas concluídas + streak`}
        />

        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border-3 border-brand-800 bg-brand-500 text-white shadow-brutal-sm">
              <Trophy size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-secondary">
                Top 10 da semana
              </p>
              <p className="text-xs text-muted">
                10 pontos por aula · 2 por dia de streak
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={loadRanking}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Atualizar
          </Button>
        </div>

        {currentUser && currentUser.rank > 10 && (
          <Card className="mb-6 border-brand-500 bg-brand-50 dark:bg-brand-950/30">
            <p className="text-sm font-bold text-primary">
              Você está em{" "}
              <span className="text-lg font-black">
                {currentUser.rank}º lugar
              </span>{" "}
              com {currentUser.points} pontos.
            </p>
          </Card>
        )}

        {error && (
          <p className="mb-6 rounded-lg border-2 border-red-500 p-4 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}

        <Card className="overflow-hidden p-0!">
          {loading ? (
            <div className="flex justify-center py-16">
              <RefreshCw className="animate-spin text-brand-500" />
            </div>
          ) : topEntries.length === 0 ? (
            <p className="py-16 text-center text-sm font-semibold text-muted">
              Ainda não há dados para esta semana.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {topEntries.map((entry) => (
                <div
                  key={`${entry.rank}-${entry.name}`}
                  className={`flex items-center gap-3 p-4 ${entry.is_current_user ? "bg-brand-50 dark:bg-brand-950/30" : ""} ${rankStyles[entry.rank] || ""}`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-strong font-black">
                    {entry.rank <= 3 ? <Medal size={18} /> : entry.rank}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black text-primary">
                      {entry.name || "Aluno WebStart"}
                      {entry.is_current_user ? " (você)" : ""}
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs font-semibold text-secondary">
                      <span>{entry.lessons_completed} aulas</span>
                      <span className="inline-flex items-center gap-1">
                        <Flame size={13} /> {entry.streak} dias
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-primary">
                      {entry.points}
                    </p>
                    <p className="text-[10px] font-bold uppercase text-muted">
                      pontos
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
