
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";

export const LeaderBoard = () => {
  const leaders = [
    { name: "Carlos Mendoza", points: 145, position: 1, avatar: "CM" },
    { name: "Ana García", points: 142, position: 2, avatar: "AG" },
    { name: "Luis Rodríguez", points: 138, position: 3, avatar: "LR" },
    { name: "María López", points: 135, position: 4, avatar: "ML" },
    { name: "José Martínez", points: 132, position: 5, avatar: "JM" }
  ];

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Award className="w-5 h-5 text-orange-500" />;
      default: return <span className="text-gray-500 font-bold">{position}</span>;
    }
  };

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1: return "bg-gradient-to-r from-yellow-400 to-yellow-500";
      case 2: return "bg-gradient-to-r from-gray-300 to-gray-400";
      case 3: return "bg-gradient-to-r from-orange-400 to-orange-500";
      default: return "bg-gradient-to-r from-gray-500 to-gray-600";
    }
  };

  return (
    <Card className="sticky top-8">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
          <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
          Tabla de Líderes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {leaders.map((leader, index) => (
          <div
            key={index}
            className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 hover:shadow-md ${
              leader.position <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            {/* Position */}
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
              {getPositionIcon(leader.position)}
            </div>

            {/* Avatar */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${getPositionColor(leader.position)}`}>
              {leader.avatar}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {leader.name}
              </p>
              <p className="text-xs text-gray-500">
                {leader.points} puntos
              </p>
            </div>

            {/* Badge */}
            {leader.position <= 3 && (
              <Badge className={`text-xs font-bold ${
                leader.position === 1 ? 'bg-yellow-100 text-yellow-800' :
                leader.position === 2 ? 'bg-gray-100 text-gray-800' :
                'bg-orange-100 text-orange-800'
              }`}>
                Top {leader.position}
              </Badge>
            )}
          </div>
        ))}

        {/* Rules Section */}
        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="text-sm font-semibold text-green-800 mb-2">
            Sistema de Puntuación
          </h4>
          <ul className="text-xs text-green-700 space-y-1">
            <li>• Resultado exacto: 3 puntos</li>
            <li>• Resultado (G/P/E): 1 punto</li>
            <li>• Resultado incorrecto: 0 puntos</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
