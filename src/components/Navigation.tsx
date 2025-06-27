import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  User, 
  Settings,
  Calendar,
  Menu,
  X,
  Shield,
  Clock
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { PremiumBadge } from "./PremiumBadge";
import { AdminBadge } from "@/components/AdminBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const Navigation = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth()
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [newName, setNewName] = useState(user?.name || "");
  const [newEmail, setNewEmail] = useState(user?.email || "");
  const [newPhone, setNewPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);

  const navItems = [
    { id: '', label: 'Dashboard', icon: Trophy },
    { id: 'calendar', label: 'Calendario', icon: Calendar },
    { id: 'plans', label: 'Ver planes', icon: Trophy },
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
        { id: 'plans', label: 'Ver planes', icon: Trophy },
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

  const handleEditProfile = () => {
    setNewName(user?.name || "");
    setNewEmail(user?.email || "");
    setNewPhone(user?.phone || "");
    setEditOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updateData: { name?: string; email?: string; phone?: string } = {};
      
      if (newName.trim() !== user.name) {
        updateData.name = newName.trim();
      }
      
      if (newEmail.trim() !== user.email) {
        updateData.email = newEmail.trim();
      }
      
      if (newPhone.trim() !== user.phone) {
        updateData.phone = newPhone.trim();
      }

      if (Object.keys(updateData).length === 0) {
        toast.info('No hay cambios para guardar');
        setEditOpen(false);
        return;
      }

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;
      
      toast.success('Perfil actualizado correctamente');
      
      // Actualiza el contexto local
      Object.assign(user, updateData);
      
      setEditOpen(false);
    } catch (e) {
      console.error('Error updating profile:', e);
      toast.error('No se pudo actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const getBorderClass = (role?: string) => {
    switch (role) {
      case 'user': return 'border-green-600';
      case 'player': return 'border-neutral-900';
      case 'pro': return 'border-purple-500';
      case 'premium': return 'border-yellow-400';
      case 'admin': return 'border-neutral-900';
      default: return 'border-green-600';
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 bg-white shadow-lg border-b-4 z-50 ${getBorderClass(user?.role)}`}>
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
            <button
              className="flex items-center space-x-2 group"
              onClick={() => navigate('/')}
              aria-label="Ir al inicio"
              style={{ background: 'none', border: 'none', padding: 0 }}
            >
              {/* <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                <img src="/arcoplay_logo.png" alt="ArcoPlay" className="w-10 h-10" />
              </div> */}
              <div className="text-left">
                <h1 className="text-xl font-bold text-gray-900 group-hover:text-green-700 transition">ArcoPlay</h1>
                <p className="text-sm text-gray-500">Beta 1.0</p>
              </div>
            </button>
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
            <button
              className="w-8 h-8 bg-gradient-to-br from-green-500 to-red-500 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-green-400"
              onClick={handleEditProfile}
              aria-label="Editar perfil de usuario"
            >
              <User className="w-4 h-4 text-white" />
            </button>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
              {user?.phone && <p className="text-xs text-gray-500">{user?.phone}</p>}
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
                {user?.phone && <p className="text-xs text-gray-500">{user?.phone}</p>}
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar perfil de usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Tu nombre completo"
                disabled={saving}
              />
            </div>
            <div>
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="tu@email.com"
                disabled={saving}
              />
            </div>
            <div>
              <Label htmlFor="phone">Teléfono (WhatsApp)</Label>
              <Input
                id="phone"
                type="tel"
                value={newPhone}
                onChange={e => {
                  let value = e.target.value;
                  // Remover todos los caracteres no numéricos
                  value = value.replace(/\D/g, '');
                  // Si no empieza con 52, agregarlo
                  if (value && !value.startsWith('52')) {
                    value = '52' + value;
                  }
                  // Limitar a 12 dígitos (52 + 10 dígitos del teléfono)
                  if (value.length > 12) {
                    value = value.substring(0, 12);
                  }
                  setNewPhone(value);
                }}
                onBlur={e => {
                  let value = e.target.value;
                  // Si hay un número pero no empieza con 52, agregarlo
                  if (value && !value.startsWith('52')) {
                    value = '52' + value;
                    setNewPhone(value);
                  }
                }}
                placeholder="614 123 4567"
                disabled={saving}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleSaveProfile} 
              disabled={saving || (!newName.trim() && !newEmail.trim() && !newPhone.trim())} 
              className="w-full"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </nav>
  );
};
