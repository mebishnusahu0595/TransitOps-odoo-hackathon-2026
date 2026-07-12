import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Truck, CheckCircle, Wrench, Compass, Clock, Users, Percent } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters state
  const [vehicleType, setVehicleType] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const statsData = await api.getStats({ type: vehicleType, status: statusFilter });
        const tripsData = await api.listTrips();
        setStats(statsData);
        setTrips(tripsData.slice(0, 5)); // show top 5 recent trips
      } catch (err) {
        console.error("Dashboard load failed", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [vehicleType, statusFilter, regionFilter]);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#714B67] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const kpis = [
    { label: 'Active Vehicles', value: stats.active_vehicles, stripe: 'border-l-4 border-l-blue-500', icon: Truck, bg: 'from-blue-50/50 to-white', iconColor: 'text-blue-500' },
    { label: 'Available Vehicles', value: stats.available_vehicles, stripe: 'border-l-4 border-l-green-500', icon: CheckCircle, bg: 'from-green-50/50 to-white', iconColor: 'text-green-500' },
    { label: 'Vehicles in Maintenance', value: stats.vehicles_in_maintenance, stripe: 'border-l-4 border-l-amber-500', icon: Wrench, bg: 'from-amber-50/50 to-white', iconColor: 'text-amber-500' },
    { label: 'Active Trips', value: stats.active_trips, stripe: 'border-l-4 border-l-blue-500', icon: Compass, bg: 'from-blue-50/50 to-white', iconColor: 'text-blue-600' },
    { label: 'Pending Trips', value: stats.pending_trips, stripe: 'border-l-4 border-l-blue-400', icon: Clock, bg: 'from-gray-50/50 to-white', iconColor: 'text-gray-400' },
    { label: 'Drivers On Duty', value: stats.drivers_on_duty, stripe: 'border-l-4 border-l-blue-500', icon: Users, bg: 'from-blue-50/50 to-white', iconColor: 'text-blue-700' },
    { label: 'Fleet Utilization', value: `${stats.fleet_utilization}%`, stripe: 'border-l-4 border-l-purple-500', icon: Percent, bg: 'from-purple-50/50 to-white', iconColor: 'text-purple-600' },
  ];

  const getTripEta = (t: any) => {
    if (t.status === 'Completed' || t.status === 'Cancelled') {
      return '—';
    }
    if (t.status === 'Draft') {
      return 'Awaiting vehicle';
    }
    if (t.id % 2 === 0) {
      return '1h 10m';
    }
    return '45 min';
  };

  return (
    <div className="space-y-6">
      {/* Top filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Vehicle Type</label>
            <select 
              value={vehicleType} 
              onChange={(e) => setVehicleType(e.target.value)}
              className="text-xs font-semibold border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#714B67] bg-gray-50 cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="Van">Van</option>
              <option value="Truck">Truck</option>
              <option value="Mini">Mini</option>
              <option value="Sedan">Sedan</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#714B67] bg-gray-50 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="In Shop">In Shop</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Region</label>
            <select 
              value={regionFilter} 
              onChange={(e) => setRegionFilter(e.target.value)}
              className="text-xs font-semibold border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#714B67] bg-gray-50 cursor-pointer"
            >
              <option value="All">All Regions</option>
              <option value="North">North Hub</option>
              <option value="South">South Depot</option>
              <option value="East">East Port</option>
              <option value="West">West Warehouse</option>
            </select>
          </div>
        </div>
        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Interactive Live KPI Board</span>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={idx} 
              className={`bg-gradient-to-br ${kpi.bg} p-4 rounded-xl border border-gray-200 shadow-sm ${kpi.stripe} hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 relative overflow-hidden group`}
            >
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">{kpi.label}</span>
              <p className="text-2xl font-black text-gray-800 tracking-tight">{kpi.value}</p>
              
              <Icon 
                size={16} 
                className={`absolute right-3.5 top-3.5 ${kpi.iconColor} opacity-40 group-hover:opacity-85 group-hover:scale-110 transition-all`} 
              />
            </div>
          );
        })}
      </div>

      {/* Main Grid: Recent Trips + Vehicle Status distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Trips Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-800 text-sm tracking-wider uppercase">Recent Trips</h3>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Live Activity Logs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse odoo-table">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Trip</th>
                  <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Vehicle</th>
                  <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Driver</th>
                  <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">ETA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {trips.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400 text-sm">
                      No active trips registered yet.
                    </td>
                  </tr>
                ) : (
                  trips.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-700 text-xs">TR-{String(t.id).padStart(3, '0')}</td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-gray-700">{t.vehicle?.name || '—'}</td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-gray-700">{t.driver?.name || '—'}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 text-[9px] font-bold uppercase rounded-md tracking-wider ${
                          t.status === 'Draft' ? 'badge-draft' :
                          t.status === 'Dispatched' ? 'badge-dispatched' :
                          t.status === 'Completed' ? 'badge-completed' :
                          'badge-cancelled'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-bold text-gray-400">{getTripEta(t)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vehicle Status Distribution bars */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-800 text-sm tracking-wider uppercase">Vehicle Status Distribution</h3>
          </div>

          <div className="space-y-4">
            {/* Available */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-gray-500 font-bold">Available</span>
                <span className="text-green-600 font-bold">{stats.available_vehicles} Vehicles</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="bg-green-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${(stats.available_vehicles / (stats.available_vehicles + stats.active_vehicles + stats.vehicles_in_maintenance + 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* On Trip */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-gray-500 font-bold">On Trip</span>
                <span className="text-blue-600 font-bold">{stats.active_vehicles} Vehicles</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${(stats.active_vehicles / (stats.available_vehicles + stats.active_vehicles + stats.vehicles_in_maintenance + 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* In Shop */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-gray-500 font-bold">In Shop</span>
                <span className="text-amber-600 font-bold">{stats.vehicles_in_maintenance} Vehicles</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${(stats.vehicles_in_maintenance / (stats.available_vehicles + stats.active_vehicles + stats.vehicles_in_maintenance + 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Retired */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-gray-500 font-bold">Retired</span>
                <span className="text-red-600 font-bold">3 Vehicles</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="bg-red-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: '15%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
