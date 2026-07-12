import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Flame, DollarSign, X, AlertTriangle } from 'lucide-react';

export default function Expenses() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [fuelLogs, setFuelLogs] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'fuel' | 'general'>('fuel');
  
  // Form states
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [liters, setLiters] = useState('');
  const [cost, setCost] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseType, setExpenseType] = useState('Toll');
  
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const expenseData = await api.listExpenses();
      const fuelData = await api.listFuelLogs();
      setExpenses(expenseData);
      setFuelLogs(fuelData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const data = await api.listVehicles();
      setVehicles(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (drawerOpen) {
      fetchVehicles();
    }
  }, [drawerOpen]);

  const openLogDrawer = (tab: 'fuel' | 'general') => {
    setDrawerTab(tab);
    setSelectedVehicleId('');
    setLiters('');
    setCost('');
    setExpenseType('Toll');
    setDate(new Date().toISOString().split('T')[0]);
    setError(null);
    setDrawerOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      if (drawerTab === 'fuel') {
        await api.createFuelLog({
          vehicle_id: parseInt(selectedVehicleId),
          liters: parseFloat(liters),
          cost: parseFloat(cost),
          date
        });
      } else {
        await api.createExpense({
          vehicle_id: parseInt(selectedVehicleId),
          type: expenseType,
          cost: parseFloat(cost),
          date
        });
      }
      setDrawerOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Saving log failed');
    } finally {
      setSaving(false);
    }
  };

  const formatDateLong = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const formatIndianNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  // Compute stats dynamically
  const fuelTotal = fuelLogs.reduce((acc, curr) => acc + curr.cost, 0);
  const maintenanceTotal = expenses.filter(e => e.type === 'Maintenance').reduce((acc, curr) => acc + curr.cost, 0);
  const totalOperationalCost = fuelTotal + maintenanceTotal;

  return (
    <div className="space-y-6">
      {/* Top action header bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between shadow-sm">
        <span className="text-sm font-bold text-gray-800">Fuel & Expense Management</span>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => openLogDrawer('fuel')}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#B45309] hover:bg-[#9A4007] text-white rounded-lg font-semibold text-xs transition-all cursor-pointer"
          >
            <Flame size={14} />
            + Log Fuel
          </button>
          <button 
            onClick={() => openLogDrawer('general')}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#B45309] hover:bg-[#9A4007] text-white rounded-lg font-semibold text-xs transition-all cursor-pointer"
          >
            <DollarSign size={14} />
            + Add Expense
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-[#714B67] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Table 1: Fuel Logs */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 text-sm tracking-wider uppercase border-b border-gray-100 pb-2">Fuel Logs</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse odoo-table">
                <thead>
                  <tr>
                    <th className="py-3 px-4">VEHICLE</th>
                    <th className="py-3 px-4">DATE</th>
                    <th className="py-3 px-4">LITERS</th>
                    <th className="py-3 px-4 text-right">FUEL COST</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fuelLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-400 text-sm">
                        No fuel logs recorded.
                      </td>
                    </tr>
                  ) : (
                    fuelLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="py-3.5 px-4 font-semibold text-gray-800 text-xs">
                          {log.vehicle?.name || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-gray-600">
                          {formatDateLong(log.date)}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-bold text-gray-700">
                          {log.liters} L
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-gray-800 text-xs">
                          {formatIndianNumber(log.cost)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Other Expenses */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 text-sm tracking-wider uppercase border-b border-gray-100 pb-2">
              Other Expenses (Toll / Misc)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse odoo-table">
                <thead>
                  <tr>
                    <th className="py-3 px-4">TRIP</th>
                    <th className="py-3 px-4">VEHICLE</th>
                    <th className="py-3 px-4 text-right">TOLL</th>
                    <th className="py-3 px-4 text-right">OTHER</th>
                    <th className="py-3 px-4 text-right">MAINT. (LINKED)</th>
                    <th className="py-3 px-4 text-center">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400 text-sm">
                        No miscellaneous expenses recorded.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp) => {
                      const isToll = exp.type === 'Toll';
                      const isMaint = exp.type === 'Maintenance';
                      const isOther = !isToll && !isMaint;
                      return (
                        <tr key={exp.id}>
                          <td className="py-3.5 px-4 font-semibold text-gray-800 text-xs">
                            {exp.trip_id ? `TR-${String(exp.trip_id).padStart(3, '0')}` : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-xs font-semibold text-gray-700">
                            {exp.vehicle?.name || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-gray-700 text-xs">
                            {isToll ? formatIndianNumber(exp.cost) : '0'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-gray-700 text-xs">
                            {isOther ? formatIndianNumber(exp.cost) : '0'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-amber-700 text-xs">
                            {isMaint ? formatIndianNumber(exp.cost) : '0'}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase rounded-md tracking-wider badge-completed">
                              Completed
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Total operational costs indicator row */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between font-bold text-xs">
              <span className="text-gray-500 uppercase tracking-wider">
                Total Operational Cost (Auto) = Fuel + Maint
              </span>
              <span className="text-sm text-[#B45309] font-black">
                {formatIndianNumber(totalOperationalCost)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Form Drawer Modal overlay */}
      {drawerOpen && (
        <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="h-16 border-b border-gray-200 px-6 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-lg">
                {drawerTab === 'fuel' ? 'Log Fuel Transaction' : 'Log Miscellaneous Expense'}
              </h3>
              <button onClick={() => setDrawerOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Select Vehicle</label>
                <select 
                  required
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#714B67]"
                >
                  <option value="">-- Choose vehicle --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.reg_no})
                    </option>
                  ))}
                </select>
              </div>

              {drawerTab === 'fuel' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Liters Refueled</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={liters}
                    onChange={(e) => setLiters(e.target.value)}
                    placeholder="e.g. 45.5"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#714B67]"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Expense Category</label>
                  <select 
                    value={expenseType}
                    onChange={(e) => setExpenseType(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#714B67]"
                  >
                    <option value="Toll">Toll charges</option>
                    <option value="Permit">State Permit fee</option>
                    <option value="Fine">Traffic Fine</option>
                    <option value="Insurance">Insurance premium</option>
                    <option value="Other">Other Miscellaneous</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Amount (₹)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="e.g. 3500"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#714B67]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Transaction Date</label>
                  <input 
                    type="date" 
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#714B67]"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-600 rounded-lg font-medium flex items-center gap-2">
                  <AlertTriangle size={14} className="text-red-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setDrawerOpen(false)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#714B67] hover:bg-[#5A3C52] text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Record Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
