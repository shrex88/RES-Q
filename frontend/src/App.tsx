import React from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ShieldAlert, Activity, Map as MapIcon, Users, Home, LayoutDashboard, Menu, X } from 'lucide-react';
import CommandCenter from './components/CommandCenter';
import LiveMap from './components/LiveMap';
import CitizenPortal from './components/CitizenPortal';
import CitizenDashboard from './components/CitizenDashboard';
import LandingPage from './components/LandingPage';
import AdminDashboard from './components/AdminDashboard';
import LoginPage from './components/LoginPage';

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = React.useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const location = useLocation();

  // Close sidebar on route change (mobile)
  React.useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navLinks = [
    { to: '/', label: 'Home Landing', icon: <Home className="w-5 h-5 text-slate-400" />, activeCheck: (p: string) => p === '/', activeClass: 'text-slate-100' },
    { to: '/admin', label: 'Admin Dashboard', icon: <LayoutDashboard className="w-5 h-5 text-blue-400" />, activeCheck: (p: string) => p === '/admin', activeClass: 'text-blue-400' },
    { to: '/dashboard', label: 'Command Center', icon: <Activity className="w-5 h-5 text-red-500" />, activeCheck: (p: string) => p === '/dashboard' || p === '/command-center', activeClass: 'text-red-400' },
    { to: '/map', label: 'Live Weather Map', icon: <MapIcon className="w-5 h-5 text-emerald-400" />, activeCheck: (p: string) => p === '/map', activeClass: 'text-emerald-400' },
    { to: '/report', label: 'Citizen Portal', icon: <Users className="w-5 h-5 text-amber-400" />, activeCheck: (p: string) => p === '/report', activeClass: 'text-amber-400' },
  ];

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-50 overflow-hidden max-w-full">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — desktop: static, mobile: overlay drawer */}
      <aside className={`
        fixed md:static top-0 left-0 h-full z-50
        w-64 bg-slate-900 border-r border-slate-800 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <ShieldAlert className="w-8 h-8 text-red-500" />
            <div>
              <h1 className="text-xl font-bold tracking-wider">ResQAI</h1>
              <p className="text-[10px] text-slate-400 font-mono">CRISIS SYSTEM</p>
            </div>
          </Link>
          {/* Close button — mobile only */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                link.activeCheck(location.pathname) ? `bg-slate-800 ${link.activeClass} shadow-md` : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative min-w-0">
        <header className="resq-header h-14 md:h-16 border-b border-slate-800 flex items-center px-3 md:px-6 justify-between bg-slate-900/50 backdrop-blur-md flex-shrink-0">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors mr-2 flex-shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h2 className="text-sm md:text-lg font-medium text-slate-200 truncate min-w-0">
            {location.pathname === '/admin' ? 'Admin Control Dashboard' : location.pathname === '/map' ? 'Subcontinent Live Weather Map' : 'Command Centre Console'}
          </h2>
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            {isOnline ? (
              <div className="flex items-center gap-1.5 md:gap-2 text-green-400 border border-green-500/30 bg-green-500/10 px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-semibold">
                <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                <span className="hidden sm:inline">🟢 Online</span>
                <span className="sm:hidden">🟢</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 md:gap-2 text-amber-400 border border-amber-500/30 bg-amber-500/10 px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-semibold">
                <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-amber-500 animate-pulse"></div>
                <span className="hidden sm:inline">🟠 Offline — Emergency mode</span>
                <span className="sm:hidden">🟠 Offline</span>
              </div>
            )}
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-3 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin" element={<DashboardLayout><AdminDashboard /></DashboardLayout>} />
        <Route path="/dashboard" element={<DashboardLayout><CommandCenter /></DashboardLayout>} />
        <Route path="/command-center" element={<DashboardLayout><CommandCenter /></DashboardLayout>} />
        <Route path="/map" element={<DashboardLayout><LiveMap /></DashboardLayout>} />
        <Route path="/report" element={<CitizenPortal />} />
        <Route path="/citizen/dashboard" element={<CitizenDashboard />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </Router>
  );
}

export default App;
