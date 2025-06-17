
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, Settings, Calendar } from "lucide-react";

interface Quiniela {
  id: string;
  name: string;
  participants: number;
  status: 'active' | 'finished' | 'pending';
  currentJornada: number;
  totalJornadas: number;
  prize: string;
}

interface QuinielaCardProps {
  quiniela: Quiniela;
  isAdmin: boolean;
}

export const QuinielaCard = ({ quiniela, isAdmin }: QuinielaCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'finished': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activa';
      case 'finished': return 'Finalizada';
      case 'pending': return 'Pendiente';
      default: return 'Desconocido';
    }
  };

  return (
    <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-green-500">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold text-gray-900 line-clamp-1">
            {quiniela.name}
          </CardTitle>
          <Badge className={`${getStatusColor(quiniela.status)} font-medium`}>
            {getStatusText(quiniela.status)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="w-4 h-4 text-green-600" />
            <span>{quiniela.participants} participantes</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>J{quiniela.currentJornada}/{quiniela.totalJornadas}</span>
          </div>
        </div>

        {/* Prize */}
        <div className="flex items-center space-x-2 text-sm">
          <Trophy className="w-4 h-4 text-yellow-600" />
          <span className="font-semibold text-gray-700">Premio: {quiniela.prize}</span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Progreso del torneo</span>
            <span>{Math.round((quiniela.currentJornada / quiniela.totalJornadas) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(quiniela.currentJornada / quiniela.totalJornadas) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 pt-2">
          <Button 
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            size="sm"
          >
            Ver Quiniela
          </Button>
          {isAdmin && (
            <Button 
              variant="outline"
              size="sm"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
