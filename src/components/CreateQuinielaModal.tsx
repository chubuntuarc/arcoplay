
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Users, Calendar } from "lucide-react";

interface CreateQuinielaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateQuinielaModal = ({ isOpen, onClose }: CreateQuinielaModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    entryFee: "",
    maxParticipants: "",
    tournament: "ligamx-clausura-2025"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Creating quiniela:", formData);
    // Aquí iría la lógica para crear la quiniela
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center">
            <Trophy className="w-6 h-6 text-green-600 mr-2" />
            Crear Nueva Quiniela
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nombre */}
          <div className="space-y-2">
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
            />
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              Descripción (Opcional)
            </Label>
            <Textarea
              id="description"
              placeholder="Describe tu quiniela..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full h-20 resize-none"
            />
          </div>

          {/* Cuota de entrada */}
          <div className="space-y-2">
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
            />
          </div>

          {/* Máximo de participantes */}
          <div className="space-y-2">
            <Label htmlFor="maxParticipants" className="text-sm font-medium text-gray-700 flex items-center">
              <Users className="w-4 h-4 text-blue-500 mr-1" />
              Máximo de Participantes
            </Label>
            <Input
              id="maxParticipants"
              type="number"
              placeholder="Ej. 20"
              value={formData.maxParticipants}
              onChange={(e) => setFormData({...formData, maxParticipants: e.target.value})}
              className="w-full"
              min="2"
              max="100"
            />
          </div>

          {/* Torneo */}
          <div className="space-y-2">
            <Label htmlFor="tournament" className="text-sm font-medium text-gray-700 flex items-center">
              <Calendar className="w-4 h-4 text-green-500 mr-1" />
              Torneo
            </Label>
            <Select value={formData.tournament} onValueChange={(value) => setFormData({...formData, tournament: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un torneo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ligamx-clausura-2025">Liga MX - Clausura 2025</SelectItem>
                <SelectItem value="ligamx-apertura-2025" disabled>Liga MX - Apertura 2025 (Próximamente)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sistema de puntuación */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
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
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              Crear Quiniela
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
