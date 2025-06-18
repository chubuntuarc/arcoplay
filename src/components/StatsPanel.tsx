
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Calendar, TrendingUp } from "lucide-react";

interface StatsPanelProps {
  userRole: 'admin' | 'participant';
}

export const StatsPanel = ({ userRole }: StatsPanelProps) => {
  const stats = [
    {
      title: "Quinielas Activas",
      value: userRole === 'admin' ? "3" : "2",
      icon: Trophy,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Total Participantes",
      value: userRole === 'admin' ? "44" : "12",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                {stat.title}
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
