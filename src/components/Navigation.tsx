import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  User, 
  Settings,
  Calendar,
  Menu,
  X,
  Shield
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { PremiumBadge } from "./PremiumBadge";
import { AdminBadge } from "@/components/AdminBadge";

export const Navigation = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth()
  const navigate = useNavigate();

  const navItems = [
    { id: '', label: 'Dashboard', icon: Trophy },
    { id: 'calendar', label: 'Calendario', icon: Calendar },
    // { id: 'profile', label: 'Perfil', icon: User },
    // { id: 'settings', label: 'Configuración', icon: Settings }
  ];

  const filteredNavItems = user?.role === 'admin'
    ? [
        { id: '', label: 'Dashboard', icon: Trophy },
        { id: 'calendar', label: 'Calendario', icon: Calendar },
        { id: 'control', label: 'Administrar', icon: Shield },
      ]
    : [
        { id: '', label: 'Dashboard', icon: Trophy },
        { id: 'calendar', label: 'Calendario', icon: Calendar },
      ];

  // Handler para logout con redirección
  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  }
  
  const handleNavigation = (id: string) => {  
    setActiveTab(id);
    navigate(`/${id}`);
  }
  
  useEffect(() => {
    if (user) {
      const path = window.location.pathname;
      if (path.includes('/calendar')) {
        setActiveTab('calendar');
      } else {
        setActiveTab('');
      }
    }
  }, [user]);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-lg border-b-4 border-green-600 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-green-600 hover:bg-green-50"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                <img src="/arcoplay_logo.png" alt="ArcoPlay" className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">ArcoPlay</h1>
              <p className="text-sm text-gray-500">Juega con tus amigos</p>
            </div>
          </div>

          {/* Navigation Items - Desktop */}
          <div className="hidden md:flex items-center space-x-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    activeTab === item.id 
                      ? "bg-green-600 text-white shadow-md" 
                      : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                  }`}
                  onClick={() => handleNavigation(item.id)}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-red-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
              {user?.role === "premium" && <div className="mt-1"><PremiumBadge /></div>}
              {user?.role === "admin" && <div className="mt-1"><AdminBadge /></div>}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-2 hidden md:inline-flex"
              onClick={handleLogout}
            >
              Cerrar sesión
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
          isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div
          className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-red-500 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
                {user?.role === "premium" && <div className="mt-1"><PremiumBadge /></div>}
                {user?.role === "admin" && <div className="mt-1"><AdminBadge /></div>}
              </div>
            </div>
            <button
              className="p-2 rounded-lg text-gray-600 hover:text-green-600 hover:bg-green-50"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-4">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  className={`w-full justify-start mb-2 ${
                    activeTab === item.id 
                      ? "bg-green-600 text-white" 
                      : "text-gray-600 hover:text-green-600 hover:bg-green-50"
                  }`}
                  onClick={() => handleNavigation(item.id)}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={handleLogout}
            >
              Cerrar sesión
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
