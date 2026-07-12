import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AlertTriangle } from 'lucide-react';

export default function Maintenance() {
  const [logs, setLogs] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.listMaintenance();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const data = await api.listVehicles();
      // Allow putting any non-retired vehicle in maintenance
      setVehicles(data.filter((v: any) => v.status !== 'Retired'));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchVehicles();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      await api.createMaintenance({
        vehicle_id: parseInt(selectedVehicleId),
        description,
        cost: parseFloat(cost),
        date
      });
      setDescription('');
      setSelectedVehicleId('');
      setCost('');
      fetchLogs();
      fetchVehicles();
    } catch (err: any) {
      setError(err.message || 'Logging maintenance failed');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (logId: number) => {
    try {
      await api.completeMaintenance(logId);
      fetchLogs();
      fetchVehicles();
    } catch (err: any) {
      alert(err.message || 'Completing maintenance failed');
    }
  };

  const formatIndianNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  return (
    <div className="space-y-6">
      {/* Search Header Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between">
        <span className="text-sm font-bold text-gray-800">Maintenance Workshop</span>
        <span className="text-xs text-gray-400 font-semibold">Active Logs</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 text-sm tracking-wider uppercase border-b border-gray-100 pb-2">Log Service Record</h3>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Vehicle</label>
                <select 
                  required
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#714B67]"
                >
                  <option value="">-- Select vehicle --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.reg_no})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Service Type</label>
                <input 
                  type="text" 
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Oil Change"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#714B67]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cost</label>
                <input 
                  type="number" 
                  required
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="e.g. 2500"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#714B67]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                <input 
                  type="date" 
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#714B67]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                <select 
                  disabled
                  value="Active"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 focus:outline-none"
                >
                  <option value="Active">Active</option>
                </select>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-600 rounded-lg font-medium flex items-center gap-2">
                  <AlertTriangle size={14} className="text-red-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button 
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-[#B45309] hover:bg-[#9A4007] text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </form>

            {/* Bottom transition indicators */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold px-2">
                <span className="text-green-600">Available</span>
                <span className="text-gray-400 font-semibold">creating active record →</span>
                <span className="text-amber-600">In Shop</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold px-2">
                <span className="text-amber-600">In Shop</span>
                <span className="text-gray-400 font-semibold">closing record (not retired) →</span>
                <span className="text-green-600">Available</span>
              </div>
              <p className="text-[10px] text-[#B45309] font-bold text-center pt-2 leading-normal">
                Note: In Shop vehicles are removed from the dispatch pool.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Service Logs Table */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 text-sm tracking-wider uppercase border-b border-gray-100 pb-2">Service Log</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse odoo-table">
                <thead>
                  <tr>
                    <th className="py-3 px-4">Vehicle</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4 text-right">Cost</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-400 text-sm">
                        Loading workshop logs...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-400 text-sm">
                        No workshop records found.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => {
                      const isActive = log.status === 'Active';
                      return (
                        <tr key={log.id}>
                          <td className="py-3.5 px-4 font-semibold text-gray-800 text-xs">
                            {log.vehicle?.name || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-xs font-semibold text-gray-700">
                            {log.description}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-gray-800 text-xs">
                            {formatIndianNumber(log.cost)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {isActive ? (
                              <button 
                                onClick={() => handleComplete(log.id)}
                                className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-bold uppercase rounded-md border border-amber-200 transition-all cursor-pointer"
                                title="Click to Complete & Check-out Vehicle"
                              >
                                In Shop
                              </button>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase rounded-md tracking-wider badge-completed">
                                Completed
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
