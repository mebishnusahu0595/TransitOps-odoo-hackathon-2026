import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Plus, Search, Table, Grid, X, AlertTriangle } from 'lucide-react';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const formatCapacity = (kg: number) => {
    if (kg >= 1000) {
      const tons = kg / 1000;
      return `${tons} ${tons === 1 ? 'Ton' : 'Tons'}`;
    }
    return `${kg} kg`;
  };

  const formatIndianNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  
  // Form state
  const [regNo, setRegNo] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('Van');
  const [capacity, setCapacity] = useState('');
  const [odometer, setOdometer] = useState('');
  const [cost, setCost] = useState('');
  const [statusValue, setStatusValue] = useState('Available');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const data = await api.listVehicles({ 
        type: typeFilter, 
        status: statusFilter, 
        q: search 
      });
      setVehicles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [search, typeFilter, statusFilter]);

  const openAddDrawer = () => {
    setSelectedVehicle(null);
    setRegNo('');
    setName('');
    setType('Van');
    setCapacity('');
    setOdometer('');
    setCost('');
    setStatusValue('Available');
    setError(null);
    setDrawerOpen(true);
  };

  const openEditDrawer = (v: any) => {
    setSelectedVehicle(v);
    setRegNo(v.reg_no);
    setName(v.name);
    setType(v.type);
    setCapacity(String(v.max_load_capacity));
    setOdometer(String(v.odometer));
    setCost(String(v.acquisition_cost));
    setStatusValue(v.status);
    setError(null);
    setDrawerOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload = {
      reg_no: regNo,
      name,
      type,
      max_load_capacity: parseFloat(capacity),
      odometer: parseFloat(odometer || '0'),
      acquisition_cost: parseFloat(cost),
    };

    try {
      if (selectedVehicle) {
        // Edit mode
        await api.updateVehicle(selectedVehicle.id, {
          name,
          type,
          max_load_capacity: parseFloat(capacity),
          odometer: parseFloat(odometer),
          status: statusValue
        });
      } else {
        // Add mode
        await api.createVehicle(payload);
      }
      setDrawerOpen(false);
      fetchVehicles();
    } catch (err: any) {
      setError(err.message || 'Saving vehicle failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Panel Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex items-center gap-4 flex-1 min-w-[300px]">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search reg no..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:bg-white focus:border-[#714B67] w-full"
            />
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#714B67]"
          >
            <option value="All">All Types</option>
            <option value="Van">Van</option>
            <option value="Truck">Truck</option>
            <option value="Mini">Mini</option>
            <option value="Sedan">Sedan</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#714B67]"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="In Shop">In Shop</option>
            <option value="Retired">Retired</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button 
              onClick={() => setViewMode('table')} 
              className={`p-2 transition-colors ${viewMode === 'table' ? 'bg-gray-100 text-[#714B67]' : 'text-gray-400 hover:text-gray-600 bg-white'}`}
            >
              <Table size={18} />
            </button>
            <button 
              onClick={() => setViewMode('kanban')} 
              className={`p-2 transition-colors ${viewMode === 'kanban' ? 'bg-gray-100 text-[#714B67]' : 'text-gray-400 hover:text-gray-600 bg-white'}`}
            >
              <Grid size={18} />
            </button>
          </div>

          <button 
            onClick={openAddDrawer}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#714B67] hover:bg-[#5A3C52] text-white rounded-lg font-semibold text-sm transition-all"
          >
            <Plus size={16} />
            Add Vehicle
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-[#714B67] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {viewMode === 'table' ? (
            /* Tabular List View */
            <>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse odoo-table">
                  <thead>
                    <tr>
                      <th className="py-3 px-6">REG. NO. (UNIQUE)</th>
                      <th className="py-3 px-6">NAME/MODEL</th>
                      <th className="py-3 px-6">TYPE</th>
                      <th className="py-3 px-6 text-right">CAPACITY</th>
                      <th className="py-3 px-6 text-right">ODOMETER</th>
                      <th className="py-3 px-6 text-right">ACQ. COST</th>
                      <th className="py-3 px-6">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {vehicles.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-400 text-sm">
                          No vehicles found matching filters.
                        </td>
                      </tr>
                    ) : (
                      vehicles.map((v) => (
                        <tr 
                          key={v.id} 
                          onClick={() => openEditDrawer(v)}
                          className="cursor-pointer"
                        >
                          <td className="py-3.5 px-6 font-semibold text-gray-800">{v.reg_no}</td>
                          <td className="py-3.5 px-6 font-medium text-gray-700">{v.name}</td>
                          <td className="py-3.5 px-6 text-gray-600">{v.type}</td>
                          <td className="py-3.5 px-6 text-right font-medium text-gray-700">{formatCapacity(v.max_load_capacity)}</td>
                          <td className="py-3.5 px-6 text-right text-gray-600">{formatIndianNumber(v.odometer)}</td>
                          <td className="py-3.5 px-6 text-right text-gray-600">₹{formatIndianNumber(v.acquisition_cost)}</td>
                          <td className="py-3.5 px-6">
                            <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase rounded-md tracking-wider ${
                              v.status === 'Available' ? 'badge-available' :
                              v.status === 'On Trip' ? 'badge-ontrip' :
                              v.status === 'In Shop' ? 'badge-inshop' :
                              'badge-retired'
                            }`}>
                              {v.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-[#B45309] font-semibold mt-3">
                Rule: Registration No. must be unique - Retired/In Shop vehicles are hidden from Trip Dispatcher
              </p>
            </>
          ) : (
            /* Kanban View */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {vehicles.length === 0 ? (
                <div className="col-span-full bg-white p-8 text-center text-gray-400 text-sm rounded-xl border">
                  No vehicles found matching filters.
                </div>
              ) : (
                vehicles.map((v) => (
                  <div 
                    key={v.id} 
                    onClick={() => openEditDrawer(v)}
                    className="odoo-kanban-card cursor-pointer flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-gray-400 uppercase tracking-wider">{v.type}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase rounded-md tracking-wider ${
                          v.status === 'Available' ? 'badge-available' :
                          v.status === 'On Trip' ? 'badge-ontrip' :
                          v.status === 'In Shop' ? 'badge-inshop' :
                          'badge-retired'
                        }`}>
                          {v.status}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-gray-800">{v.name}</h4>
                      <p className="text-xs font-semibold text-[#714B67]">{v.reg_no}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100 mt-4 text-[11px] text-gray-500 text-center font-medium">
                      <div>
                        <span className="block text-gray-400 uppercase font-semibold text-[9px] mb-0.5">Capacity</span>
                        {v.max_load_capacity} kg
                      </div>
                      <div>
                        <span className="block text-gray-400 uppercase font-semibold text-[9px] mb-0.5">Odometer</span>
                        {v.odometer.toLocaleString()} km
                      </div>
                      <div>
                        <span className="block text-gray-400 uppercase font-semibold text-[9px] mb-0.5">Acq Cost</span>
                        ₹{v.acquisition_cost.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Right Drawer slider for form entry */}
      {drawerOpen && (
        <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="h-16 border-b border-gray-200 px-6 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-lg">
                {selectedVehicle ? `Edit Vehicle details: ${selectedVehicle.reg_no}` : 'Add New Vehicle'}
              </h3>
              <button onClick={() => setDrawerOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Registration No (Unique)</label>
                <input 
                  type="text" 
                  required
                  disabled={!!selectedVehicle}
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  placeholder="e.g. GJ01AB4521"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#714B67]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Model Name</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. VAN-05"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#714B67]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Vehicle Type</label>
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#714B67]"
                  >
                    <option value="Van">Van</option>
                    <option value="Truck">Truck</option>
                    <option value="Mini">Mini</option>
                    <option value="Sedan">Sedan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Max Load Capacity (kg)</label>
                  <input 
                    type="number" 
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#714B67]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Odometer (km)</label>
                  <input 
                    type="number" 
                    required
                    value={odometer}
                    onChange={(e) => setOdometer(e.target.value)}
                    placeholder="e.g. 74000"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#714B67]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Acquisition Cost (₹)</label>
                  <input 
                    type="number" 
                    required
                    disabled={!!selectedVehicle}
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="e.g. 620000"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#714B67]"
                  />
                </div>
              </div>

              {selectedVehicle && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Status</label>
                  <select 
                    value={statusValue}
                    onChange={(e) => setStatusValue(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#714B67]"
                  >
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="In Shop">In Shop</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>
              )}

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
                  {saving ? 'Saving...' : 'Save details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
