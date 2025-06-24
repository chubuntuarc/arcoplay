import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Users, Calendar, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createQuiniela, getAvailableTournaments, getUserQuinielas, getRoleLimits, Tournament, Quiniela, joinQuiniela } from "@/lib/quiniela";
import { toast } from "sonner";

interface CreateQuinielaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuinielaCreated?: () => void;
}

export const CreateQuinielaModal = ({ isOpen, onClose, onQuinielaCreated }: CreateQuinielaModalProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    entryFee: "",
    maxParticipants: "",
    tournament: ""
  });
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [userQuinielas, setUserQuinielas] = useState<Quiniela[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && user) {
      loadData();
    }
  }, [isOpen, user]);

  const loadData = async () => {
    try {
      const [availableTournaments, userQuinielasData] = await Promise.all([
        getAvailableTournaments(user?.role || 'user'),
        getUserQuinielas(user?.id || '')
      ]);
      
      setTournaments(availableTournaments);
      setUserQuinielas(userQuinielasData);
      
      // Set default tournament if available
      if (availableTournaments.length > 0 && !formData.tournament) {
        setFormData(prev => ({ ...prev, tournament: availableTournaments[0].id }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    }
  };

  const validateForm = (): string[] => {
    const newErrors: string[] = [];
    const roleLimits = getRoleLimits(user?.role || 'user');

    // Check quiniela limit
    if (roleLimits.quinielas !== -1 && userQuinielas.length >= roleLimits.quinielas) {
      newErrors.push(`Ya tienes el máximo de quinielas permitidas para tu rol (${roleLimits.quinielas})`);
    }

    // Check required fields
    if (!formData.name.trim()) {
      newErrors.push('El nombre de la quiniela es requerido');
    }

    if (!formData.tournament) {
      newErrors.push('Debes seleccionar un torneo');
    }

    if (!formData.maxParticipants || parseInt(formData.maxParticipants) < 2) {
      newErrors.push('El máximo de participantes debe ser al menos 2');
    }

    // Check participant limit based on role
    const maxParticipants = parseInt(formData.maxParticipants);
    if (roleLimits.participants !== -1 && maxParticipants > roleLimits.participants) {
      newErrors.push(`Tu rol permite máximo ${roleLimits.participants} participantes por quiniela`);
    }

    if (formData.entryFee && parseFloat(formData.entryFee) < 0) {
      newErrors.push('La cuota de entrada no puede ser negativa');
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors([]);

    try {
      const newQuiniela = await createQuiniela({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        tournament_id: formData.tournament,
        entry_fee: formData.entryFee ? parseFloat(formData.entryFee) : 0,
        max_participants: parseInt(formData.maxParticipants)
      }, user?.id || '');

      // Registrar al usuario como participante
      if (user && newQuiniela?.id) {
        await joinQuiniela(newQuiniela.id, user.id);
      }

      toast.success('Quiniela creada exitosamente');
      onQuinielaCreated?.();
      onClose();
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        entryFee: "",
        maxParticipants: "",
        tournament: ""
      });
    } catch (error: unknown) {
      console.error('Error creating quiniela:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al crear la quiniela';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const roleLimits = getRoleLimits(user?.role || 'user');
  const canCreate = roleLimits.quinielas === -1 || userQuinielas.length < roleLimits.quinielas;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto px-2 sm:px-6 py-4">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center">
            <Trophy className="w-6 h-6 text-green-600 mr-2" />
            Crear Nueva Quiniela
          </DialogTitle>
        </DialogHeader>

        {!canCreate && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-800 font-medium">
                Límite de quinielas alcanzado
              </span>
            </div>
            <p className="text-red-700 text-sm mt-1">
              Tu rol ({user?.role}) permite crear máximo {roleLimits.quinielas} quiniela{roleLimits.quinielas !== 1 ? 's' : ''}.
            </p>
          </div>
        )}

        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center mb-2">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-800 font-medium">Errores de validación:</span>
            </div>
            <ul className="text-red-700 text-sm space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 flex flex-col">
          {/* Nombre */}
          <div className="space-y-2 w-full">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Nombre de la Quiniela
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Ej. Quiniela Oficina 2025"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full"
              required
              disabled={!canCreate}
            />
          </div>

          {/* Descripción */}
          <div className="space-y-2 w-full">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              Descripción (Opcional)
            </Label>
            <Textarea
              id="description"
              placeholder="Describe tu quiniela..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full h-20 resize-none"
              disabled={!canCreate}
            />
          </div>

          {/* Cuota de entrada */}
          <div className="space-y-2 w-full">
            <Label htmlFor="entryFee" className="text-sm font-medium text-gray-700 flex items-center">
              <Trophy className="w-4 h-4 text-yellow-500 mr-1" />
              Cuota de Entrada (MXN)
            </Label>
            <Input
              id="entryFee"
              type="number"
              placeholder="Ej. 100"
              value={formData.entryFee}
              onChange={(e) => setFormData({...formData, entryFee: e.target.value})}
              className="w-full"
              min="0"
              step="0.01"
              disabled={!canCreate}
            />
          </div>

          {/* Máximo de participantes */}
          <div className="space-y-2 w-full">
            <Label htmlFor="maxParticipants" className="text-sm font-medium text-gray-700 flex items-center">
              <Users className="w-4 h-4 text-blue-500 mr-1" />
              Máximo de Participantes
              {roleLimits.participants !== -1 && (
                <span className="text-xs text-gray-500 ml-1">
                  (Máx: {roleLimits.participants})
                </span>
              )}
            </Label>
            <Input
              id="maxParticipants"
              type="number"
              placeholder="Ej. 20"
              value={formData.maxParticipants}
              onChange={(e) => setFormData({...formData, maxParticipants: e.target.value})}
              className="w-full"
              min="2"
              max={roleLimits.participants === -1 ? undefined : roleLimits.participants}
              required
              disabled={!canCreate}
            />
            {roleLimits.participants !== -1 && (
              <p className="text-xs text-gray-500">
                Tu rol permite máximo {roleLimits.participants} participantes por quiniela
              </p>
            )}
          </div>

          {/* Torneo */}
          <div className="space-y-2 w-full">
            <Label htmlFor="tournament" className="text-sm font-medium text-gray-700 flex items-center">
              <Calendar className="w-4 h-4 text-green-500 mr-1" />
              Torneo
            </Label>
            <Select 
              value={formData.tournament} 
              onValueChange={(value) => setFormData({...formData, tournament: value})}
              disabled={!canCreate}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un torneo" />
              </SelectTrigger>
              <SelectContent>
                {tournaments.map((tournament) => (
                  <SelectItem key={tournament.id} value={tournament.id}>
                    {tournament.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Información del rol */}
          <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200 w-full">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">
              Información de tu Rol: {user?.role?.toUpperCase()}
            </h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Quinielas que puedes crear: {roleLimits.quinielas === -1 ? 'Sin límite' : roleLimits.quinielas}</li>
              <li>• Participantes por torneo: {roleLimits.participants === -1 ? 'Sin límite' : roleLimits.participants}</li>
              <li>• Torneos disponibles: {roleLimits.tournaments === -1 ? 'Sin límite' : roleLimits.tournaments}</li>
            </ul>
          </div>

          {/* Sistema de puntuación */}
          <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200 w-full">
            <h4 className="text-sm font-semibold text-green-800 mb-2">
              Sistema de Puntuación Predeterminado
            </h4>
            <ul className="text-xs text-green-700 space-y-1">
              <li>• Resultado exacto: 3 puntos</li>
              <li>• Resultado (Ganó/Perdió/Empató): 1 punto</li>
              <li>• Resultado incorrecto: 0 puntos</li>
            </ul>
            <p className="text-xs text-green-600 mt-2">
              Podrás personalizar estas reglas después de crear la quiniela.
            </p>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
              disabled={!canCreate || isLoading}
            >
              {isLoading ? 'Creando...' : 'Crear Quiniela'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
