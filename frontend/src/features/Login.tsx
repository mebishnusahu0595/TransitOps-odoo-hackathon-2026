import { useState } from 'react';
import { useAppStore } from '../app/store';
import { api } from '../services/api';
import { XCircle, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const setAuth = useAppStore((state) => state.setAuth);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('Dispatcher');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Quick fill logins for the Odoo hackathon reviewers
  const quickLogins = [
    { label: 'Fleet Manager', email: 'manager@transitops.in', role: 'Fleet Manager' },
    { label: 'Dispatcher', email: 'dispatcher@transitops.in', role: 'Dispatcher' },
    { label: 'Safety Officer', email: 'safety@transitops.in', role: 'Safety Officer' },
    { label: 'Financial Analyst', email: 'analyst@transitops.in', role: 'Financial Analyst' },
  ];

  const handleQuickLogin = (ql: typeof quickLogins[0]) => {
    setEmail(ql.email);
    setPassword('password123');
    setRole(ql.role);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const data = await api.login({ email, password, role });
      localStorage.setItem('token', data.access_token);
      const user = await api.getMe();
      setAuth(data.access_token, user);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F0F5FA]">
      {/* Left Panel - Corporate Logistics Style */}
      <div className="w-full md:w-[40%] bg-[#EBF4FF] flex flex-col justify-between p-12 border-r border-[#D2E4F9]">
        <div className="flex items-center gap-3">
          <img src="/logo.png" className="w-12 h-12 object-contain" alt="TransitOps Logo" />
          <div>
            <h1 className="text-2xl font-bold text-[#714B67] tracking-tight">TransitOps</h1>
            <p className="text-xs text-gray-500 font-semibold">Smart Transport Operations Platform</p>
          </div>
        </div>

        <div className="my-auto space-y-6 flex flex-col items-center">
          <img src="/login_doodle.png" className="w-full max-w-[340px] h-auto object-contain rounded-xl shadow-md border border-[#D2E4F9] bg-white" alt="TransitOps Operations" />
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-800">Smart Transport Operations</h2>
            <p className="text-xs text-gray-500 font-semibold max-w-[280px] mx-auto mt-1">Digitize dispatcher workflow, maintain vehicles, log fuel transactions, and track operational metrics.</p>
          </div>
        </div>

        <div className="text-[11px] text-gray-400 font-bold tracking-wider">
          TRANSITOPS © 2026 • RBAC ENABLED
        </div>
      </div>

      {/* Right Panel - Clean Light Mode Form */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16 bg-white relative">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">Sign in to your account</h2>
            <p className="text-sm font-semibold text-gray-400">Enter your credentials to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border-2 border-dashed border-red-400 rounded-xl text-red-600 font-semibold text-xs space-y-1 shadow-sm">
                <span className="text-red-700 font-bold uppercase tracking-wider block">Error state</span>
                <p className="flex items-start gap-2">
                  <XCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@transitops.in"
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#714B67] focus:ring-1 focus:ring-[#714B67] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-4 pr-10 py-3 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#714B67] focus:ring-1 focus:ring-[#714B67] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Role (RBAC)
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:bg-white focus:border-[#714B67] focus:ring-1 focus:ring-[#714B67] transition-all cursor-pointer"
              >
                <option value="Fleet Manager">Fleet Manager</option>
                <option value="Dispatcher">Dispatcher</option>
                <option value="Safety Officer">Safety Officer</option>
                <option value="Financial Analyst">Financial Analyst</option>
              </select>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold text-gray-400">
              <label className="flex items-center gap-2 cursor-pointer text-gray-500 hover:text-gray-700">
                <input type="checkbox" className="rounded bg-gray-50 border-gray-200 text-[#714B67] focus:ring-0 focus:ring-offset-0" />
                Remember me
              </label>
              <a href="#" className="text-[#714B67]/90 hover:underline hover:text-[#714B67]">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#B45309] hover:bg-[#9A4007] text-white font-bold text-sm rounded-lg transition-colors shadow-md disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Logins Mock Helper */}
          <div className="pt-6 border-t border-gray-100 space-y-3">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">
              Quick Sandbox Logins
            </p>
            <div className="grid grid-cols-2 gap-2">
              {quickLogins.map((ql) => (
                <button
                  key={ql.label}
                  onClick={() => handleQuickLogin(ql)}
                  className="px-3 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-xs text-gray-600 hover:text-gray-900 rounded-lg transition-all font-semibold shadow-sm cursor-pointer"
                >
                  {ql.label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-center text-[10px] text-gray-400 font-semibold leading-normal">
            Access is scoped by role after login:<br />
            • Fleet Manager → Fleet, Maintenance<br />
            • Dispatcher → Dashboard, Trips<br />
            • Safety Officer → Drivers, Compliance<br />
            • Financial Analyst → Fuel & Expenses, Analytics
          </div>
        </div>
      </div>
    </div>
  );
}
