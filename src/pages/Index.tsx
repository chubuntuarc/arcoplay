import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { QuinielaDashboard } from "@/components/QuinielaDashboard";
import { StatsPanel } from "@/components/StatsPanel";
import { CreateQuinielaModal } from "@/components/CreateQuinielaModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [userRole] = useState<'admin' | 'participant'>('admin'); // Simulado por ahora
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-red-50">
      <Navigation />

      <main className="container mx-auto px-4 py-8 mt-16">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Mis Quinielas
            </h1>
          </div>

          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all duration-200 hover:shadow-xl"
          >
            <Plus className="w-5 h-5 mr-2" />
            Crear Quiniela
          </Button>
        </div>

        {/* Stats Panel */}
        {/* <StatsPanel userRole={userRole} /> */}

        {/* Dashboard */}
        <QuinielaDashboard userRole={userRole} />

        {/* Create Quiniela Modal */}
        <CreateQuinielaModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />

        {user?.role === "user" && (
          <div className="mt-8 border-2 border-dashed border-blue-400 rounded-lg p-6 bg-blue-50 flex flex-col items-center text-center">
            <span className="text-3xl mb-2">📢</span>
            <h3 className="text-lg font-bold text-blue-800 mb-1">
              Anúnciate aquí
            </h3>
            <p className="text-sm text-blue-700 mb-4">
              ¿Quieres promocionar tu negocio, tienda o servicio? ¡Llega a miles
              de usuarios de ArcoPlay!
            </p>
          </div>
        )}
        <Footer />
      </main>
    </div>
  );
};

export default Index;
