import { useEffect, useState } from "react";
import { QuinielaCard } from "./QuinielaCard";
import { LeaderBoard } from "./LeaderBoard";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { MatchCard } from "./MatchCard";
import { Clock, Loader2, ChevronDown, ChevronUp, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { getUserQuinielas, Quiniela, canCreateQuiniela } from "@/lib/quiniela";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { CreateQuinielaModal } from "./CreateQuinielaModal";

interface QuinielaDashboardProps {
  userRole: 'admin' | 'participant';
}

// Match type based on Supabase schema
interface Match {
  id: number;
  api_id: number;
  tournament_id: string;
  date: string;
  home_team: string;
  away_team: string;
  status: string;
  score: { home: number; away: number } | null;
  created_at: string;
  updated_at: string;
  jornada_id: string | null;
  tournament?: Tournament;
  jornada?: Jornada;
}

interface Tournament {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
}

interface Jornada {
  id: string;
  torneo_id: string;
  nombre: string;
  tipo: string | null;
  numero: number | null;
}

interface GroupedMatches {
  tournament: Tournament;
  jornada: Jornada;
  matches: Match[];
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
  const { user } = useAuth();
  const [userQuinielas, setUserQuinielas] = useState<Quiniela[]>([]);
  const [participatingQuinielas, setParticipatingQuinielas] = useState<Quiniela[]>([]);
  const [groupedMatches, setGroupedMatches] = useState<GroupedMatches[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMatches, setShowMatches] = useState(true);
  const [showUserQuinielas, setShowUserQuinielas] = useState(true);
  const [showParticipatingQuinielas, setShowParticipatingQuinielas] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  // Calcular quinielas activas del usuario
  const activeQuinielasCount = userQuinielas.filter(q => q.is_active).length;
  const canCreate = user ? canCreateQuiniela(user.role, activeQuinielasCount) : false;

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Cargar quinielas creadas por el usuario
      const createdQuinielas = await getUserQuinielas(user?.id || '');
      setUserQuinielas(createdQuinielas);

      // Cargar quinielas en las que participa el usuario
      const { data: participantData, error: participantError } = await supabase
        .from('quiniela_participants')
        .select(`
          quiniela_id,
          quiniela:quinielas(
            *,
            tournament:tournaments(*),
            creator:users!creator_id(id, name, email)
          )
        `)
        .eq('user_id', user?.id)
        .eq('quiniela.is_active', true);

      if (participantError) throw participantError;

      const participating = (participantData || [])
        .map(p => p.quiniela)
        .filter(q => q && typeof q === 'object' && 'id' in q && !createdQuinielas.some(cq => cq.id === q.id)) as unknown as Quiniela[];
      
      setParticipatingQuinielas(participating);

      // Cargar partidos de hoy con información de torneo y jornada
      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select(`
          *,
          tournament:tournaments(*),
          jornada:jornadas(*)
        `);

      if (matchesError) throw matchesError;

      // Filter matches for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayMatches = (matchesData || []).filter(match => {
        const matchDate = new Date(match.date);
        matchDate.setHours(0, 0, 0, 0);
        return matchDate.getTime() === today.getTime();
      });

      // Agrupar partidos por torneo y jornada
      const grouped: GroupedMatches[] = [];
      const groups: Record<string, Record<string, Match[]>> = {};

      todayMatches.forEach(match => {
        const tournamentId = match.tournament_id;
        const jornadaId = match.jornada_id || 'sin-jornada';
        
        if (!groups[tournamentId]) {
          groups[tournamentId] = {};
        }
        if (!groups[tournamentId][jornadaId]) {
          groups[tournamentId][jornadaId] = [];
        }
        groups[tournamentId][jornadaId].push(match);
      });

      // Convertir grupos a array estructurado
      Object.entries(groups).forEach(([tournamentId, jornadas]) => {
        Object.entries(jornadas).forEach(([jornadaId, matches]) => {
          const tournament = matches[0]?.tournament;
          const jornada = matches[0]?.jornada;
          
          if (tournament) {
            grouped.push({
              tournament,
              jornada: jornada || { id: jornadaId, torneo_id: tournamentId, nombre: 'Sin jornada', tipo: null, numero: null },
              matches
            });
          }
        });
      });

      // Ordenar por nombre de torneo y número de jornada
      grouped.sort((a, b) => {
        if (a.tournament.name !== b.tournament.name) {
          return a.tournament.name.localeCompare(b.tournament.name);
        }
        const aNum = a.jornada.numero || 0;
        const bNum = b.jornada.numero || 0;
        return aNum - bNum;
      });

      // Ordenar quinielas: activas primero, luego por fecha de actualización descendente
      const sortedUserQuinielas = [...createdQuinielas].sort((a, b) => {
        if (a.is_active === b.is_active) {
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        }
        return a.is_active ? -1 : 1;
      });

      setUserQuinielas(sortedUserQuinielas);
      setGroupedMatches(grouped);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserRoleIfNeeded = async () => {
    const lastChecked = localStorage.getItem('lastRoleCheck');
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    if (!lastChecked || now - parseInt(lastChecked, 10) > oneDay) {
      if (user) {
        const previousRole = user.role;
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        if (userData) {
          if (userData.role !== previousRole) {
            toast.info(`Tu rol ha cambiado: ahora eres "${userData.role}"`);
          }
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        <span className="ml-2 text-gray-600">Cargando quinielas...</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
      <CreateQuinielaModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onQuinielaCreated={loadData}
      />
      {/* Quinielas Section */}
      <div className="xl:col-span-3 space-y-8">
        {userQuinielas.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <div className="w-1 h-8 bg-green-600 rounded-full mr-3"></div>
                Administradas ({userQuinielas.length})
              </h2>
              <button
                onClick={() => setShowUserQuinielas(!showUserQuinielas)}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <span>{showUserQuinielas ? "Ocultar" : "Mostrar"}</span>
                {showUserQuinielas ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
            {showUserQuinielas && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userQuinielas.map((quiniela) => (
                  <QuinielaCard
                    key={quiniela.id}
                    quiniela={{
                      id: quiniela.id,
                      name: quiniela.name,
                      participants: quiniela.current_participants,
                      status: quiniela.is_active ? "active" : "finished",
                      currentJornada: 5, // TODO: Calcular jornada actual
                      totalJornadas: 17, // TODO: Obtener del torneo
                      prize:
                        quiniela.entry_fee > 0
                          ? `$${quiniela.entry_fee} MXN`
                          : "Gratis",
                    }}
                    isAdmin={true}
                  />
                ))}
                {canCreate && (
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded transition mb-4"
                    onClick={() => setShowCreateModal(true)}
                  >
                    Crear nueva quiniela
                  </button>
                )}
              </div>
            )}
            {user?.role === "user" && (
              <div className="border-2 border-dashed border-green-400 rounded-lg p-6 flex flex-col items-center justify-center bg-green-50 mt-6">
                <span className="text-3xl mb-2">✨</span>
                <h3 className="text-lg font-bold text-green-800 mb-1">
                  ¿Quieres crear más quinielas?
                </h3>
                <p className="text-sm text-green-700 mb-4 text-center">
                  Mejora tu plan para crear quinielas ilimitadas y acceder a
                  funciones premium.
                </p>
                <button
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded transition"
                  onClick={() => {
                    navigate("/plans");
                  }}
                >
                  Ver planes premium
                </button>
              </div>
            )}
          </section>
        )}

        {participatingQuinielas.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <div className="w-1 h-8 bg-red-600 rounded-full mr-3"></div>
                Quinielas en las que Participo ({participatingQuinielas.length})
              </h2>
              <button
                onClick={() =>
                  setShowParticipatingQuinielas(!showParticipatingQuinielas)
                }
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <span>
                  {showParticipatingQuinielas ? "Ocultar" : "Mostrar"}
                </span>
                {showParticipatingQuinielas ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
            {showParticipatingQuinielas && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {participatingQuinielas.map((quiniela) => (
                  <QuinielaCard
                    key={quiniela.id}
                    quiniela={{
                      id: quiniela.id,
                      name: quiniela.name,
                      participants: quiniela.current_participants,
                      status: quiniela.is_active ? "active" : "finished",
                      currentJornada: 5, // TODO: Calcular jornada actual
                      totalJornadas: 17, // TODO: Obtener del torneo
                      prize:
                        quiniela.entry_fee > 0
                          ? `$${quiniela.entry_fee} MXN`
                          : "Gratis",
                    }}
                    isAdmin={false}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {user?.role === "user" && (
          <>
            <div className="mt-8 border-2 border-dashed border-blue-400 rounded-lg p-6 bg-blue-50 flex flex-col items-center text-center">
              <span className="text-3xl mb-2">📢</span>
              <h3 className="text-lg font-bold text-blue-800 mb-1">
                Anúnciate aquí
              </h3>
              <p className="text-sm text-blue-700 mb-4">
                ¿Quieres promocionar tu negocio, tienda o servicio? ¡Llega a
                miles de usuarios de ArcoPlay!
              </p>
            </div>
          </>
        )}

        {userQuinielas.length === 0 && participatingQuinielas.length === 0 && (
          <section>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No tienes quinielas aún
              </h3>
              <p className="text-gray-600 mb-6">
                Crea tu primera quiniela o únete a una existente para comenzar.
              </p>
            </div>
          </section>
        )}
      </div>

      {/* Sidebar */}
      {/* <div className="xl:col-span-1">
        <LeaderBoard />
      </div> */}

      {/* Today Matches */}
      <div className="xl:col-span-1">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Partidos de Hoy
            </h3>
            <button
              onClick={() => setShowMatches(!showMatches)}
              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <span>{showMatches ? "Ocultar" : "Mostrar"}</span>
              {showMatches ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          {showMatches &&
            (groupedMatches.length > 0 ? (
              <div className="space-y-4">
                {groupedMatches.map((group) => (
                  <Card
                    key={`${group.tournament.id}-${group.jornada.id}`}
                    className="border-l-4 border-l-green-500"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy className="w-4 h-4 text-green-600" />
                        <CardTitle className="text-sm font-semibold text-gray-900">
                          {group.tournament.name}
                        </CardTitle>
                      </div>
                      <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded inline-block">
                        {group.jornada.nombre}
                        {group.jornada.numero && ` (${group.jornada.numero})`}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {group.matches.map((match) => (
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
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No hay partidos programados
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(new Date().toISOString())}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
        {/* Web Development Ad Section */}
        {user?.role === "user" && (
          <div className="mt-8 border-2 border-dashed border-blue-400 rounded-lg p-6 bg-blue-50 flex flex-col items-center text-center">
            <span className="text-3xl mb-2">💻</span>
            <h3 className="text-lg font-bold text-blue-800 mb-1">
              ¿Necesitas una página web o software a la medida?
            </h3>
            <p className="text-sm text-blue-700 mb-4">
              Desarrollamos páginas, tiendas en línea y sistemas personalizados
              para tu negocio o proyecto. ¡Lleva tu idea al siguiente nivel!
            </p>
            <a
              href="https://wa.me/526141561723?text=Hola%2C%20quiero%20informes%20sobre%20desarrollo%20web%20a%20la%20medida"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded transition"
              target="_blank"
              rel="noopener noreferrer"
            >
              Solicita tu cotización por WhatsApp
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
