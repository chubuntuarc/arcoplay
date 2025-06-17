
import { QuinielaCard } from "./QuinielaCard";
import { LeaderBoard } from "./LeaderBoard";

interface QuinielaDashboardProps {
  userRole: 'admin' | 'participant';
}

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

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
      {/* Quinielas Section */}
      <div className="xl:col-span-3 space-y-8">
        {userRole === 'admin' && (
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
    </div>
  );
};
