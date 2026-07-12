import { useState, useEffect } from 'react';
import { useAppStore, type AppView } from '../app/store';
import { api } from '../services/api';
import { 
  LayoutDashboard, 
  Truck, 
  UserCheck, 
  Compass, 
  Wrench, 
  Flame, 
  FileSpreadsheet, 
  Settings, 
  LogOut, 
  Bell, 
  Search,
  Menu,
  X
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, activeView, setView, logout, sidebarOpen, setSidebarOpen } = useAppStore();
  const [unreadNotifications, setUnreadNotifications] = useState<any[]>([]);
  const [showNotesMenu, setShowNotesMenu] = useState(false);

  // Search Everywhere State
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const fetchAlerts = async () => {
    try {
      const data = await api.listNotifications();
      setUnreadNotifications(data.filter((n: any) => !n.read));
    } catch {
      // Ignored
    }
  };

  const loadSearchData = async () => {
    try {
      const v = await api.listVehicles();
      const d = await api.listDrivers();
      const t = await api.listTrips();
      setVehicles(v);
      setDrivers(d);
      setTrips(t);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadSearchData();
  }, [activeView]);

  // Keyboard shortcut Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) {
          searchInput.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close search dropdown
  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      const el = document.getElementById('global-search-wrapper');
      if (el && !el.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      for (const n of unreadNotifications) {
        await api.markNotificationRead(n.id);
      }
      setUnreadNotifications([]);
    } catch {
      // Ignored
    }
  };

  const navItems = [
    { id: 'dashboard' as AppView, label: 'Dashboard', icon: LayoutDashboard, roles: ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'] },
    { id: 'fleet' as AppView, label: 'Fleet Registry', icon: Truck, roles: ['Fleet Manager'] },
    { id: 'drivers' as AppView, label: 'Drivers & Safety', icon: UserCheck, roles: ['Safety Officer'] },
    { id: 'trips' as AppView, label: 'Trip Dispatcher', icon: Compass, roles: ['Dispatcher'] },
    { id: 'maintenance' as AppView, label: 'Maintenance Logs', icon: Wrench, roles: ['Fleet Manager'] },
    { id: 'expenses' as AppView, label: 'Fuel & Expenses', icon: Flame, roles: ['Financial Analyst'] },
    { id: 'reports' as AppView, label: 'Reports & ROI', icon: FileSpreadsheet, roles: ['Financial Analyst'] },
    { id: 'settings' as AppView, label: 'Settings & RBAC', icon: Settings, roles: ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'] },
  ];

  const allowedItems = navItems.filter(item => user && item.roles.includes(user.role));

  // Compute matched records
  const filteredResults: any[] = [];
  if (searchQuery.trim().length >= 2) {
    const query = searchQuery.toLowerCase();
    
    // Filter vehicles
    vehicles.forEach(v => {
      if (v.name.toLowerCase().includes(query) || v.reg_no.toLowerCase().includes(query)) {
        filteredResults.push({
          type: 'Vehicle',
          label: `${v.name} (${v.reg_no})`,
          view: 'fleet' as AppView
        });
      }
    });

    // Filter drivers
    drivers.forEach(d => {
      if (d.name.toLowerCase().includes(query) || d.license_no.toLowerCase().includes(query)) {
        filteredResults.push({
          type: 'Driver',
          label: `${d.name} (${d.license_no})`,
          view: 'drivers' as AppView
        });
      }
    });

    // Filter trips
    trips.forEach(t => {
      if (t.source.toLowerCase().includes(query) || t.destination.toLowerCase().includes(query)) {
        filteredResults.push({
          type: 'Trip',
          label: `Trip TR-${String(t.id).padStart(3, '0')}: ${t.source} -> ${t.destination}`,
          view: 'trips' as AppView
        });
      }
    });
  }

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-800">
      {/* Left Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#714B67] text-white transform transition-transform duration-200 ease-in-out flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-0 md:-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#5A3C52]">
          <div className="flex items-center gap-2">
            <img src="/logo.png" className="w-8 h-8 object-contain bg-white rounded-lg p-0.5" alt="TransitOps Logo" />
            <span className="font-semibold text-lg tracking-wider">TransitOps</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 hover:bg-white/10 rounded">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {allowedItems.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-150 ${active ? 'bg-white/15 text-white font-semibold' : 'text-purple-100 hover:bg-white/5 hover:text-white'}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-[#5A3C52] bg-[#5A3C52]/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold">
              {user?.name ? user.name.split(' ').map((n: string)=>n[0]).join('') : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-purple-200 truncate">{user?.role || 'Guest'}</p>
            </div>
            <button onClick={logout} className="p-2 text-purple-200 hover:text-white hover:bg-white/10 rounded-lg" title="Log Out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className={`flex-1 flex flex-col min-w-0 ${sidebarOpen ? 'md:pl-64' : ''} transition-all duration-200`}>
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
              <span className="font-medium text-gray-800">TransitOps ERP</span>
              <span>/</span>
              <span className="capitalize">{activeView === 'fleet' ? 'Fleet Registry' : activeView}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Active Global Search Bar */}
            <div id="global-search-wrapper" className="relative hidden md:block">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input 
                id="global-search-input"
                type="text" 
                placeholder="Search everywhere... (Ctrl + K)" 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:bg-white focus:border-[#714B67] w-64 transition-all duration-150"
              />

              {showSearchResults && searchQuery.trim().length >= 2 && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-gray-100">
                  <div className="px-4 py-2 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase">
                    Matched Records
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {filteredResults.length === 0 ? (
                      <div className="p-4 text-center text-xs text-gray-400">
                        No matches found.
                      </div>
                    ) : (
                      filteredResults.map((res, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            const isAllowed = allowedItems.some(item => item.id === res.view);
                            if (isAllowed) {
                              setView(res.view);
                              setSearchQuery('');
                              setShowSearchResults(false);
                            } else {
                              alert(`Access Denied: Your role (${user?.role}) does not have permission to access the ${res.type} module.`);
                            }
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center justify-between text-xs font-semibold text-gray-700"
                        >
                          <span className="truncate pr-2">{res.label}</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded shrink-0">
                            {res.type}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Notification Menu */}
            <div className="relative">
              <button 
                onClick={() => setShowNotesMenu(!showNotesMenu)}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 relative"
              >
                <Bell size={20} />
                {unreadNotifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center">
                    {unreadNotifications.length}
                  </span>
                )}
              </button>

              {showNotesMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <span className="font-semibold text-sm">System Alerts</span>
                    {unreadNotifications.length > 0 && (
                      <button onClick={markAllRead} className="text-xs text-[#714B67] hover:underline font-semibold">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                    {unreadNotifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-gray-400">
                        No active system alerts.
                      </div>
                    ) : (
                      unreadNotifications.map((note) => (
                        <div key={note.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <p className="text-xs text-gray-700 leading-normal">{note.message}</p>
                          <span className="text-[10px] text-gray-400 mt-1 block">
                            {new Date(note.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Initials Badge */}
            <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-[#714B67] font-bold flex items-center justify-center text-sm">
                {user?.name ? user.name.split(' ').map((n: string)=>n[0]).join('') : 'U'}
              </div>
              <span className="text-sm font-medium hidden sm:inline-block text-gray-700">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* View Workspace */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
