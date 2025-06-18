import { useEffect, useState } from "react";
import { QuinielaCard } from "./QuinielaCard";
import { LeaderBoard } from "./LeaderBoard";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { MatchCard } from "./MatchCard";
import { Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface QuinielaDashboardProps {
  userRole: 'admin' | 'participant';
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const QuinielaDashboard = ({ userRole }: QuinielaDashboardProps) => {
  // Datos de ejemplo
  const adminQuinielas = [
    {
      id: '1',
      name: 'Quiniela Oficina 2025',
      participants: 24,
      status: 'active' as const,
      currentJornada: 5,
      totalJornadas: 17,
      prize: '$5,000 MXN'
    },
    {
      id: '2',
      name: 'Liga Amigos',
      participants: 8,
      status: 'active' as const,
      currentJornada: 5,
      totalJornadas: 17,
      prize: '$2,000 MXN'
    }
  ];

  const participatingQuinielas = [
    {
      id: '3',
      name: 'Quiniela Familiar',
      participants: 12,
      status: 'active' as const,
      currentJornada: 5,
      totalJornadas: 17,
      prize: '$3,000 MXN'
    },
    {
      id: '4',
      name: 'Champions League',
      participants: 30,
      status: 'finished' as const,
      currentJornada: 17,
      totalJornadas: 17,
      prize: '$10,000 MXN'
    }
  ];

  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    const fetchMatches = async () => {
      const { data, error } = await supabase.from("matches").select("*");
      // Filter matches for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayMatches = (data || []).filter(match => {
        const matchDate = new Date(match.date);
        matchDate.setHours(0, 0, 0, 0);
        return matchDate.getTime() === today.getTime();
      });
      setMatches(todayMatches);
    };
    fetchMatches();
  }, []);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
      {/* Quinielas Section */}
      <div className="xl:col-span-3 space-y-8">
        {userRole === "admin" && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-1 h-8 bg-green-600 rounded-full mr-3"></div>
              Quinielas que Administro ({adminQuinielas.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {adminQuinielas.map((quiniela) => (
                <QuinielaCard
                  key={quiniela.id}
                  quiniela={quiniela}
                  isAdmin={true}
                />
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <div className="w-1 h-8 bg-red-600 rounded-full mr-3"></div>
            Quinielas en las que Participo ({participatingQuinielas.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {participatingQuinielas.map((quiniela) => (
              <QuinielaCard
                key={quiniela.id}
                quiniela={quiniela}
                isAdmin={false}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Sidebar */}
      <div className="xl:col-span-1">
        <LeaderBoard />
      </div>

      {/* Today Matches */}
      <div className="xl:col-span-1">
        <div className="space-y-6">
          {matches.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-green-700">
                  {formatDate(matches[0].date)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {matches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      layout="horizontal"
                      hideStatus={true}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay partidos programados
                  </h3>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
