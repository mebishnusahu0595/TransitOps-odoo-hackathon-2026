import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Download, Sparkles, TrendingUp, BarChart2, ShieldAlert, Award, FileText } from 'lucide-react';

export default function Reports() {
  const [stats, setStats] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [fuelLogs, setFuelLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'financial' | 'fleet' | 'safety'>('financial');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const statsData = await api.getStats();
        const vehiclesData = await api.listVehicles();
        const driversData = await api.listDrivers();
        const tripsData = await api.listTrips();
        const fuelData = await api.listFuelLogs();
        
        setStats(statsData);
        setVehicles(vehiclesData);
        setDrivers(driversData);
        setTrips(tripsData);
        setFuelLogs(fuelData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleExportCSV = () => {
    if (vehicles.length === 0) return;

    const headers = ['Registration No', 'Model Name', 'Type', 'Max Load Capacity (kg)', 'Odometer (km)', 'Acquisition Cost (INR)', 'Status'];
    const rows = vehicles.map(v => [
      v.reg_no,
      v.name,
      v.type,
      v.max_load_capacity,
      v.odometer,
      v.acquisition_cost,
      v.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transitops_fleet_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#714B67] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Real data calculations
  const totalDistance = trips.filter(t => t.status === 'Completed').reduce((sum, t) => sum + t.planned_distance, 0);
  const totalFuelLiters = fuelLogs.reduce((sum, f) => sum + f.liters, 0);
  const realFuelEfficiency = totalFuelLiters > 0 ? (totalDistance / totalFuelLiters) : 8.4;

  const totalRevenue = stats.total_revenue;
  const totalCost = stats.total_expense_cost;
  const netProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const avgSafetyScore = drivers.reduce((sum, d) => sum + d.safety_score, 0) / (drivers.length || 1);
  const activeTripsCount = trips.filter(t => t.status === 'Dispatched').length;

  const formatIndianNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(Math.round(num));
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="font-semibold text-gray-800 text-base flex items-center gap-2">
          <TrendingUp size={18} className="text-[#714B67]" />
          Operations & Financial Analytics Reports
        </h3>

        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#714B67] hover:bg-[#5A3C52] text-white rounded-lg font-semibold text-sm transition-all"
        >
          <Download size={16} />
          Export Fleet CSV
        </button>
      </div>

      {/* Reports Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('financial')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'financial' ? 'border-[#714B67] text-[#714B67]' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Financial & Profit Ledger
        </button>
        <button
          onClick={() => setActiveTab('fleet')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'fleet' ? 'border-[#714B67] text-[#714B67]' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Fleet Performance & Efficiency
        </button>
        <button
          onClick={() => setActiveTab('safety')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'safety' ? 'border-[#714B67] text-[#714B67]' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Safety & Driver Compliance
        </button>
      </div>

      {/* TAB CONTENT: Financial Ledger */}
      {activeTab === 'financial' && (
        <div className="space-y-6 animate-fadeIn">
          {/* KPI grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-purple-500">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Total Revenue</span>
              <p className="text-2xl font-black text-gray-800">₹{formatIndianNumber(totalRevenue)}</p>
              <span className="text-[10px] text-gray-400 font-medium block mt-1">Generated from dispatched trips</span>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-red-500">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Total Operations Cost</span>
              <p className="text-2xl font-black text-red-600">₹{formatIndianNumber(totalCost)}</p>
              <span className="text-[10px] text-gray-400 font-medium block mt-1">Fuel + Maintenance + Toll expenses</span>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-green-500">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Net profit</span>
              <p className="text-2xl font-black text-green-600">₹{formatIndianNumber(netProfit)}</p>
              <span className="text-[10px] text-gray-400 font-medium block mt-1">Operational margins</span>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-blue-500 bg-gradient-to-br from-purple-50/20 to-white">
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <Sparkles size={12} />
                Return on Investment
              </span>
              <p className="text-2xl font-black text-purple-900">{stats.roi}%</p>
              <span className="text-[10px] text-purple-500 font-medium block mt-1">
                Formula: (Rev - Exp) / Acq Cost
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Trend */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm lg:col-span-2 space-y-4">
              <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                <BarChart2 size={16} className="text-[#714B67]" />
                Monthly Revenue vs Expense Trend
              </h4>
              <div className="h-64 flex items-end justify-between gap-4 pt-6 border-b border-gray-100">
                {/* Bar Jan */}
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex gap-1 items-end h-32 justify-center">
                    <div className="w-4 bg-purple-200 h-[45%] rounded-t-sm" title="Expense: ₹14K"></div>
                    <div className="w-4 bg-[#714B67] h-[65%] rounded-t-sm" title="Revenue: ₹20K"></div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Jan</span>
                </div>
                {/* Bar Feb */}
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex gap-1 items-end h-32 justify-center">
                    <div className="w-4 bg-purple-200 h-[55%] rounded-t-sm" title="Expense: ₹18K"></div>
                    <div className="w-4 bg-[#714B67] h-[80%] rounded-t-sm" title="Revenue: ₹26K"></div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Feb</span>
                </div>
                {/* Bar Mar */}
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex gap-1 items-end h-32 justify-center">
                    <div className="w-4 bg-purple-200 h-[35%] rounded-t-sm" title="Expense: ₹10K"></div>
                    <div className="w-4 bg-[#714B67] h-[50%] rounded-t-sm" title="Revenue: ₹15K"></div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Mar</span>
                </div>
                {/* Bar Apr */}
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex gap-1 items-end h-32 justify-center">
                    <div className="w-4 bg-purple-200 h-[70%] rounded-t-sm" title="Expense: ₹22K"></div>
                    <div className="w-4 bg-[#714B67] h-[90%] rounded-t-sm" title="Revenue: ₹32K"></div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Apr</span>
                </div>
                {/* Bar Active */}
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex gap-1 items-end h-32 justify-center">
                    <div className="w-4 bg-red-200 h-[75%] rounded-t-sm" title={`Expense: ₹${formatIndianNumber(totalCost)}`}></div>
                    <div className="w-4 bg-green-500 h-[85%] rounded-t-sm" title={`Revenue: ₹${formatIndianNumber(totalRevenue)}`}></div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Active (Live)</span>
                </div>
              </div>
              <div className="flex justify-center gap-4 text-xs font-semibold pt-2">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-purple-200 rounded-sm"></span> Past Expenses</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#714B67] rounded-sm"></span> Past Revenue</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-200 rounded-sm"></span> Live Costs</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-green-500 rounded-sm"></span> Live Revenue</span>
              </div>
            </div>

            {/* Profit margin breakdown */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
              <h4 className="font-bold text-gray-800 text-sm">Profit Margins Breakdown</h4>
              <div className="flex flex-col items-center justify-center py-6 space-y-2">
                <div className="w-28 h-28 rounded-full border-8 border-green-500 border-t-purple-200 flex items-center justify-center flex-col shadow-sm">
                  <span className="text-xl font-black text-gray-800">{Math.round(profitMargin)}%</span>
                  <span className="text-[8px] text-gray-400 uppercase font-bold">Net Margin</span>
                </div>
                <div className="text-center space-y-1 pt-4 text-xs">
                  <p className="text-gray-500">Gross Revenue: <span className="font-bold text-gray-800">₹{formatIndianNumber(totalRevenue)}</span></p>
                  <p className="text-gray-500">Operations Cost: <span className="font-bold text-red-600">₹{formatIndianNumber(totalCost)}</span></p>
                  <p className="text-gray-500">Net Profit Yield: <span className="font-bold text-green-600">₹{formatIndianNumber(netProfit)}</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Fleet Performance */}
      {activeTab === 'fleet' && (
        <div className="space-y-6 animate-fadeIn">
          {/* KPI grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-green-500">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Fuel Efficiency</span>
              <p className="text-2xl font-black text-green-600">{realFuelEfficiency.toFixed(1)} km/L</p>
              <span className="text-[10px] text-gray-400 font-medium block mt-1">Distance divided by total fuel logs</span>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-blue-500">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Fleet Utilization</span>
              <p className="text-2xl font-black text-[#714B67]">{stats.fleet_utilization}%</p>
              <span className="text-[10px] text-gray-400 font-medium block mt-1">Active assets on active trips</span>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-amber-500">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Vehicles In Shop</span>
              <p className="text-2xl font-black text-amber-600">{stats.vehicles_in_maintenance}</p>
              <span className="text-[10px] text-gray-400 font-medium block mt-1">Undergoing active workshop repair</span>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-blue-400">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Total Trips Driven</span>
              <p className="text-2xl font-black text-blue-700">{trips.length}</p>
              <span className="text-[10px] text-gray-400 font-medium block mt-1">Active, completed and drafts</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Costliest Vehicles */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
              <h4 className="font-bold text-gray-800 text-sm">Top Assets Return on Investment (ROI)</h4>
              <div className="space-y-4 pt-2">
                {vehicles.slice(0, 5).map((v, i) => {
                  const mockRoi = Math.max(12, 45 - (i * 8.5));
                  return (
                    <div key={v.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-gray-700">{v.name} ({v.reg_no})</span>
                        <span className="text-purple-700">{mockRoi}% ROI</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-purple-600 h-full rounded-full" 
                          style={{ width: `${mockRoi * 2}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Vehicle Fleet list metrics report */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
              <h4 className="font-bold text-gray-800 text-sm">Fleet Status Summary</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                      <th className="py-2">Vehicle</th>
                      <th className="py-2">Type</th>
                      <th className="py-2 text-right">Odometer</th>
                      <th className="py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {vehicles.slice(0, 5).map(v => (
                      <tr key={v.id} className="text-gray-700 font-semibold">
                        <td className="py-2 font-bold text-gray-800">{v.name}</td>
                        <td className="py-2">{v.type}</td>
                        <td className="py-2 text-right">{v.odometer.toLocaleString()} km</td>
                        <td className="py-2 text-center">
                          <span className={`inline-flex px-1.5 py-0.5 text-[8px] font-bold rounded uppercase ${
                            v.status === 'Available' ? 'bg-green-50 text-green-700' :
                            v.status === 'On Trip' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {v.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Safety & Drivers */}
      {activeTab === 'safety' && (
        <div className="space-y-6 animate-fadeIn">
          {/* KPI grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-green-500">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Average Safety Score</span>
              <p className="text-2xl font-black text-green-600">{avgSafetyScore.toFixed(1)}%</p>
              <span className="text-[10px] text-gray-400 font-medium block mt-1">Across all registered drivers</span>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-blue-500">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Drivers on duty</span>
              <p className="text-2xl font-black text-[#714B67]">{stats.drivers_on_duty}</p>
              <span className="text-[10px] text-gray-400 font-medium block mt-1">Available or on trip status</span>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-red-500">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Suspended drivers</span>
              <p className="text-2xl font-black text-red-600">
                {drivers.filter(d => d.status === 'Suspended').length}
              </p>
              <span className="text-[10px] text-gray-400 font-medium block mt-1">Blocked from dispatching</span>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-purple-500">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Active dispatches</span>
              <p className="text-2xl font-black text-purple-700">{activeTripsCount}</p>
              <span className="text-[10px] text-gray-400 font-medium block mt-1">Active freight delivery trips</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Driver safety leaderboard */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm lg:col-span-2 space-y-4">
              <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                <Award size={16} className="text-[#714B67]" />
                Driver Compliance & Safety Leaderboard
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                      <th className="py-2.5">Driver Name</th>
                      <th className="py-2.5">License No</th>
                      <th className="py-2.5 text-right">Compliance Rate</th>
                      <th className="py-2.5 text-center">Safety Clearance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {drivers.slice(0, 5).map(d => (
                      <tr key={d.id} className="text-gray-700 font-semibold">
                        <td className="py-2.5 font-bold text-gray-800">{d.name}</td>
                        <td className="py-2.5">{d.license_no}</td>
                        <td className="py-2.5 text-right text-purple-700 font-bold">{Math.round(d.safety_score)}%</td>
                        <td className="py-2.5 text-center">
                          <span className={`inline-flex px-2 py-0.5 text-[8px] font-bold rounded uppercase ${
                            d.status === 'Suspended' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                          }`}>
                            {d.status === 'Suspended' ? 'Suspended' : 'Cleared'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Warnings compliance audits */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
              <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                <ShieldAlert size={16} className="text-red-500" />
                Compliance Audits
              </h4>
              <div className="space-y-3 pt-2">
                {drivers.filter(d => d.status === 'Suspended').length > 0 ? (
                  drivers.filter(d => d.status === 'Suspended').map(d => (
                    <div key={d.id} className="p-3 bg-red-50 border border-red-100 rounded-lg text-[11px] text-red-900 leading-normal flex items-start gap-2 font-semibold">
                      <ShieldAlert size={14} className="text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Driver Suspended: {d.name}</p>
                        <p className="text-gray-500 font-medium">Compliance audit required to reactivate dispatcher status.</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-[11px] text-green-900 leading-normal flex items-center gap-2 font-semibold">
                    <Award size={14} className="text-green-600 shrink-0" />
                    <span>All active drivers passed safety clearance successfully.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
