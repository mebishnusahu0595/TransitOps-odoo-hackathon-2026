import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Plus, Search, Table, Grid, X, AlertTriangle } from 'lucide-react';

export default function Drivers() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [licenseCategory, setLicenseCategory] = useState('Light');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [safetyScore, setSafetyScore] = useState('100');
  const [statusValue, setStatusValue] = useState('Available');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const data = await api.listDrivers({ 
        status: statusFilter, 
        q: search 
      });
      setDrivers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [search, statusFilter]);

  const openAddDrawer = () => {
    setSelectedDriver(null);
    setName('');
    setLicenseNo('');
    setLicenseCategory('Light');
    setLicenseExpiry('');
    setContactNo('');
    setSafetyScore('100');
    setStatusValue('Available');
    setError(null);
    setDrawerOpen(true);
  };

  const openEditDrawer = (d: any) => {
    setSelectedDriver(d);
    setName(d.name);
    setLicenseNo(d.license_no);
    setLicenseCategory(d.license_category);
    setLicenseExpiry(d.license_expiry);
    setContactNo(d.contact_no);
    setSafetyScore(String(d.safety_score));
    setStatusValue(d.status);
    setError(null);
    setDrawerOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload = {
      name,
      license_no: licenseNo,
      license_category: licenseCategory,
      license_expiry: licenseExpiry,
      contact_no: contactNo,
      safety_score: parseFloat(safetyScore),
    };

    try {
      if (selectedDriver) {
        await api.updateDriver(selectedDriver.id, {
          name,
          license_category: licenseCategory,
          license_expiry: licenseExpiry,
          contact_no: contactNo,
          safety_score: parseFloat(safetyScore),
          status: statusValue
        });
      } else {
        await api.createDriver(payload);
      }
      setDrawerOpen(false);
      fetchDrivers();
    } catch (err: any) {
      setError(err.message || 'Saving driver failed');
    } finally {
      setSaving(false);
    }
  };

  const formatExpiry = (expiryStr: string) => {
    const date = new Date(expiryStr);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expired = date.getTime() < today.getTime();
    return { text: `${month}/${year}`, expired };
  };

  const formatContact = (num: string) => {
    const clean = num.replace(/\D/g, '');
    if (clean.length >= 5) {
      return `${clean.substring(0, 5)}xxxxx`;
    }
    return num;
  };

  return (
    <div className="space-y-6">
      {/* Action panel bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex items-center gap-4 flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search driver name, license no..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:bg-white focus:border-[#714B67] w-full"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
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
            Add Driver
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
            <>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse odoo-table">
                  <thead>
                    <tr>
                      <th className="py-3 px-6">DRIVER</th>
                      <th className="py-3 px-6">LICENSE NO.</th>
                      <th className="py-3 px-6">CATEGOR</th>
                      <th className="py-3 px-6">EXPIRY</th>
                      <th className="py-3 px-6">CONTACT</th>
                      <th className="py-3 px-6 text-right">TRIP COMPL.</th>
                      <th className="py-3 px-6 text-center">SAFETY</th>
                      <th className="py-3 px-6">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {drivers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-gray-400 text-sm">
                          No drivers found matching filters.
                        </td>
                      </tr>
                    ) : (
                      drivers.map((d) => {
                        const expInfo = formatExpiry(d.license_expiry);
                        const isSuspended = d.status === 'Suspended';
                        const isOnTrip = d.status === 'On Trip';
                        return (
                          <tr 
                            key={d.id} 
                            onClick={() => openEditDrawer(d)}
                            className="cursor-pointer"
                          >
                            <td className="py-3.5 px-6 font-semibold text-gray-800">{d.name}</td>
                            <td className="py-3.5 px-6 font-medium text-gray-700">{d.license_no}</td>
                            <td className="py-3.5 px-6 text-gray-600">
                              {d.license_category === 'Light' ? 'LMV' : (d.license_category === 'Heavy' ? 'HMV' : 'MMV')}
                            </td>
                            <td className="py-3.5 px-6 text-gray-600 font-medium">
                              <span>{expInfo.text}</span>
                              {expInfo.expired && (
                                <span className="ml-1 text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded uppercase">EXPIRED</span>
                              )}
                            </td>
                            <td className="py-3.5 px-6 text-gray-600">{formatContact(d.contact_no)}</td>
                            <td className="py-3.5 px-6 text-right font-semibold text-gray-800">{Math.round(d.safety_score)}%</td>
                            <td className="py-3.5 px-6 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase rounded-md tracking-wider border ${
                                isSuspended ? 'badge-suspended' : (isOnTrip ? 'badge-ontrip' : 'badge-available')
                              }`}>
                                {isSuspended ? 'Suspended' : (isOnTrip ? 'On Trip' : 'Available')}
                              </span>
                            </td>
                            <td className="py-3.5 px-6">
                              <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase rounded-md tracking-wider ${
                                d.status === 'Available' ? 'badge-available' :
                                d.status === 'On Trip' ? 'badge-ontrip' :
                                d.status === 'Off Duty' ? 'badge-offduty' :
                                'badge-suspended'
                              }`}>
                                {d.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Toggle Stat Bar */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 mt-6 space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Toggle Stat</h4>
                <div className="flex flex-wrap gap-2">
                  {['All', 'Available', 'On Trip', 'Off Duty', 'Suspended'].map((stat) => (
                    <button
                      key={stat}
                      onClick={() => setStatusFilter(stat)}
                      className={`px-4 py-2 text-xs font-bold rounded-lg border uppercase tracking-wider transition-all ${
                        statusFilter === stat
                          ? stat === 'Available' ? 'bg-[#DCFCE7] text-[#166534] border-[#166534]' :
                            stat === 'On Trip' ? 'bg-[#DBEAFE] text-[#1E40AF] border-[#1E40AF]' :
                            stat === 'Off Duty' ? 'bg-gray-100 text-gray-700 border-gray-400' :
                            stat === 'Suspended' ? 'bg-[#FFEDD5] text-[#9A3412] border-[#9A3412]' :
                            'bg-purple-100 text-purple-800 border-purple-800'
                          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {stat}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-[#B45309] font-semibold mt-3">
                Rule: Expired license or Suspended status → blocked from trip assignment
              </p>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {drivers.length === 0 ? (
                <div className="col-span-full bg-white p-8 text-center text-gray-400 text-sm rounded-xl border">
                  No drivers found matching filters.
                </div>
              ) : (
                drivers.map((d) => {
                  const expInfo = formatExpiry(d.license_expiry);
                  return (
                    <div 
                      key={d.id} 
                      onClick={() => openEditDrawer(d)}
                      className="odoo-kanban-card cursor-pointer flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-gray-400 uppercase tracking-wider">
                            {d.license_category === 'Light' ? 'LMV' : (d.license_category === 'Heavy' ? 'HMV' : 'MMV')} Category
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 text-[9px] font-bold uppercase rounded-md tracking-wider ${
                            d.status === 'Available' ? 'badge-available' :
                            d.status === 'On Trip' ? 'badge-ontrip' :
                            d.status === 'Off Duty' ? 'badge-offduty' :
                            'badge-suspended'
                          }`}>
                            {d.status}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-gray-800">{d.name}</h4>
                        <div className="space-y-1 text-xs text-gray-500 font-medium">
                          <p>License: <span className="text-gray-700 font-semibold">{d.license_no}</span></p>
                          <p>Contact: <span className="text-gray-700">{formatContact(d.contact_no)}</span></p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100 mt-4 flex items-center justify-between text-xs font-semibold">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] rounded-full border ${expInfo.expired ? 'bg-red-100 text-red-700 border-red-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                          {expInfo.text} {expInfo.expired && 'EXPIRED'}
                        </span>
                        <span className="text-gray-500">Compliance: <span className="text-[#714B67] font-bold">{Math.round(d.safety_score)}%</span></span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* Right Drawer form */}
      {drawerOpen && (
        <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="h-16 border-b border-gray-200 px-6 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-lg">
                {selectedDriver ? `Edit Driver details: ${selectedDriver.name}` : 'Add New Driver'}
              </h3>
              <button onClick={() => setDrawerOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Driver Name</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#714B67]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">License Number</label>
                  <input 
                     type="text" 
                     required
                     disabled={!!selectedDriver}
                     value={licenseNo}
                     onChange={(e) => setLicenseNo(e.target.value)}
                     placeholder="e.g. DL-88213"
                     className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#714B67]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">License Category</label>
                  <select 
                    value={licenseCategory}
                    onChange={(e) => setLicenseCategory(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#714B67]"
                  >
                    <option value="Light">Light (LMV)</option>
                    <option value="Heavy">Heavy (HMV)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">License Expiry Date</label>
                  <input 
                    type="date" 
                    required
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#714B67]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Safety Score (%)</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    max="100"
                    step="0.1"
                    value={safetyScore}
                    onChange={(e) => setSafetyScore(e.target.value)}
                    placeholder="e.g. 95"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#714B67]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Contact Number</label>
                <input 
                  type="text" 
                  required
                  value={contactNo}
                  onChange={(e) => setContactNo(e.target.value)}
                  placeholder="e.g. 98765xxxxx"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#714B67]"
                />
              </div>

              {selectedDriver && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Status</label>
                  <select 
                    value={statusValue}
                    onChange={(e) => setStatusValue(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#714B67]"
                  >
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="Off Duty">Off Duty</option>
                    <option value="Suspended">Suspended</option>
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
