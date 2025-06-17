
import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { QuinielaDashboard } from "@/components/QuinielaDashboard";
import { StatsPanel } from "@/components/StatsPanel";
import { CreateQuinielaModal } from "@/components/CreateQuinielaModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Index = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [userRole] = useState<'admin' | 'participant'>('admin'); // Simulado por ahora

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-red-50">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Mis Quinielas
            </h1>
            <p className="text-gray-600 text-lg">
              Liga MX - Torneo Clausura 2025
            </p>
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
        <StatsPanel userRole={userRole} />

        {/* Dashboard */}
        <QuinielaDashboard userRole={userRole} />

        {/* Create Quiniela Modal */}
        <CreateQuinielaModal 
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </main>
    </div>
  );
};

export default Index;
