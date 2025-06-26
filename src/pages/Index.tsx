import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { QuinielaDashboard } from "@/components/QuinielaDashboard";
import { StatsPanel } from "@/components/StatsPanel";
import { CreateQuinielaModal } from "@/components/CreateQuinielaModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { joinQuiniela, isUserParticipant } from "@/lib/quiniela";
import { toast } from "sonner";

const Index = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [userRole] = useState<'admin' | 'participant'>('admin'); // Simulado por ahora
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const waInvite = searchParams.get("wa-invite");
    if (!user && waInvite) {
      // Guardar invitación pendiente en localStorage
      localStorage.setItem("pending_wa_invite", waInvite);
    }
    if (user) {
      // Revisar si hay invitación pendiente
      const pending = localStorage.getItem("pending_wa_invite");
      const inviteId = pending || waInvite;
      if (inviteId) {
        isUserParticipant(inviteId, user.id).then(async (already) => {
          if (!already) {
            try {
              await joinQuiniela(inviteId, user.id);
              toast.success("¡Te has unido a la quiniela por invitación de WhatsApp!");
              localStorage.removeItem("pending_wa_invite");
              searchParams.delete("wa-invite");
              setSearchParams(searchParams, { replace: true });
              navigate(`/quiniela/${inviteId}`);
            } catch (e) {
              toast.error("No se pudo unir a la quiniela (quizá está llena o cerrada)");
              localStorage.removeItem("pending_wa_invite");
            }
          } else {
            localStorage.removeItem("pending_wa_invite");
          }
        });
      }
    }
  }, [user, searchParams, setSearchParams, navigate]);

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
        <Footer />
      </main>
    </div>
  );
};

export default Index;
