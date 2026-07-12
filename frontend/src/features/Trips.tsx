import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { X, AlertTriangle, XCircle } from 'lucide-react';

export default function Trips() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Available vehicles and drivers for trip assignment
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);

  // Dialog state
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [activeTrip, setActiveTrip] = useState<any | null>(null);

  // Form state (Create Trip)
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  const [distance, setDistance] = useState('');
  
  // Form state (Complete Trip)
  const [endOdometer, setEndOdometer] = useState('');
  const [fuelConsumed, setFuelConsumed] = useState('');
  const [revenue, setRevenue] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const data = await api.listTrips({ q: search });
      setTrips(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableAssets = async () => {
    try {
      const allVehicles = await api.listVehicles({ status: 'Available' });
      const allDrivers = await api.listDrivers({ status: 'Available' });
      
      setVehicles(allVehicles);
      setDrivers(allDrivers);
    } catch (err) {
      console.error("Asset fetch failed", err);
    }
  };

  useEffect(() => {
    fetchTrips();
    fetchAvailableAssets();
  }, [search]);

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload = {
      source,
      destination,
      vehicle_id: parseInt(selectedVehicleId),
      driver_id: parseInt(selectedDriverId),
      cargo_weight: parseFloat(cargoWeight),
      planned_distance: parseFloat(distance),
    };

    try {
      await api.createTrip(payload);
      
      // Clear forms
      setSource('');
      setDestination('');
      setSelectedVehicleId('');
      setSelectedDriverId('');
      setCargoWeight('');
      setDistance('');
      
      fetchTrips();
      fetchAvailableAssets();
    } catch (err: any) {
      setError(err.message || 'Creating trip failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDispatch = async (tripId: number) => {
    try {
      await api.dispatchTrip(tripId);
      fetchTrips();
    } catch (err: any) {
      alert(err.message || 'Dispatch failed');
    }
  };

  const openCompleteDialog = (trip: any) => {
    setActiveTrip(trip);
    setEndOdometer(String((trip.vehicle?.odometer || 0) + trip.planned_distance));
    setFuelConsumed(String(Math.round(trip.planned_distance / 10))); // mock fuel
    setRevenue(String(Math.round(trip.planned_distance * 20))); // mock revenue
    setError(null);
    setCompleteDialogOpen(true);
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip) return;
    setError(null);
    setSaving(true);

    try {
      await api.completeTrip(activeTrip.id, {
        end_odometer: parseFloat(endOdometer),
        fuel_consumed: parseFloat(fuelConsumed),
        revenue: parseFloat(revenue || '0')
      });
      setCompleteDialogOpen(false);
      setActiveTrip(null);
      fetchTrips();
      fetchAvailableAssets();
    } catch (err: any) {
      setError(err.message || 'Completing trip failed');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (tripId: number) => {
    if (!confirm('Are you sure you want to cancel this trip?')) return;
    try {
      await api.cancelTrip(tripId);
      fetchTrips();
      fetchAvailableAssets();
    } catch (err: any) {
      alert(err.message || 'Cancellation failed');
    }
  };

  const handleResetForm = () => {
    setSource('');
    setDestination('');
    setSelectedVehicleId('');
    setSelectedDriverId('');
    setCargoWeight('');
    setDistance('');
    setError(null);
  };

  // Exceeded capacity calculation
  const selectedVehicleObj = vehicles.find(v => v.id === parseInt(selectedVehicleId));
  const vehicleCapacity = selectedVehicleObj?.max_load_capacity || 0;
  const inputCargo = parseFloat(cargoWeight) || 0;
  const isCapacityExceeded = inputCargo > vehicleCapacity && vehicleCapacity > 0;
  const exceededAmt = inputCargo - vehicleCapacity;

  return (
    <div className="space-y-6">
      {/* Search Header Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <input 
            type="text" 
            placeholder="Search dispatch routes..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-4 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:bg-white focus:border-[#714B67] w-full"
          />
        </div>
        <span className="text-xs text-gray-400 font-semibold">Active Operations</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Create Form */}
        <div className="lg:col-span-5 space-y-6">
          {/* Trip Lifecycle step display */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3 shadow-sm">
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Trip Lifecycle</h4>
            <div className="flex items-center justify-between px-4 py-2 relative">
              <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-gray-100 -translate-y-1/2 z-0"></div>
              
              <div className="flex flex-col items-center z-10 space-y-1 bg-white px-2">
                <span className="w-5 h-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center shadow-sm"></span>
                <span className="text-[9px] font-bold text-green-600">Draft</span>
              </div>
              
              <div className="flex flex-col items-center z-10 space-y-1 bg-white px-2">
                <span className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center shadow-sm"></span>
                <span className="text-[9px] font-bold text-blue-600">Dispatched</span>
              </div>
              
              <div className="flex flex-col items-center z-10 space-y-1 bg-white px-2">
                <span className="w-5 h-5 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center shadow-sm"></span>
                <span className="text-[9px] font-bold text-gray-400">Completed</span>
              </div>
              
              <div className="flex flex-col items-center z-10 space-y-1 bg-white px-2">
                <span className="w-5 h-5 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center shadow-sm"></span>
                <span className="text-[9px] font-bold text-gray-400">Cancelled</span>
              </div>
            </div>
          </div>

          {/* Creation card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 text-sm tracking-wider uppercase border-b border-gray-100 pb-2">Create Trip</h3>
            
            <form onSubmit={handleCreateTrip} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Source</label>
                <input 
                  type="text" 
                  required
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g. Gandhinagar Depot"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#714B67]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Destination</label>
                <input 
                  type="text" 
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Ahmedabad Hub"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#714B67]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Vehicle (Available Only)</label>
                <select 
                  required
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#714B67]"
                >
                  <option value="">-- Select available vehicle --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.reg_no}) - Max {v.max_load_capacity} kg capacity
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Driver (Available Only)</label>
                <select 
                  required
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#714B67]"
                >
                  <option value="">-- Select available driver --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} (Safety Score: {d.safety_score}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cargo Weight (kg)</label>
                  <input 
                    type="number" 
                    required
                    value={cargoWeight}
                    onChange={(e) => setCargoWeight(e.target.value)}
                    placeholder="e.g. 450"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#714B67]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Planned Distance (km)</label>
                  <input 
                    type="number" 
                    required
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    placeholder="e.g. 150"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#714B67]"
                  />
                </div>
              </div>

              {/* Dynamic Error State box */}
              {isCapacityExceeded && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 font-semibold text-xs space-y-1 shadow-sm">
                  <p>Vehicle Capacity: {vehicleCapacity} kg</p>
                  <p>Cargo Weight: {inputCargo} kg</p>
                  <p className="flex items-center gap-1 mt-1 text-red-700">
                    <XCircle size={14} className="shrink-0 text-red-500" />
                    <span>Capacity exceeded by {exceededAmt} kg → dispatch blocked</span>
                  </p>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-600 rounded-lg font-medium flex items-center gap-2">
                  <AlertTriangle size={14} className="text-red-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="pt-2 border-t border-gray-100 flex items-center gap-3">
                <button 
                  type="submit"
                  disabled={saving || isCapacityExceeded}
                  className="flex-1 py-2.5 bg-[#B45309] hover:bg-[#9A4007] text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                >
                  {saving ? 'Creating...' : isCapacityExceeded ? 'Dispatch (disabled)' : 'Dispatch'}
                </button>
                <button 
                  type="button" 
                  onClick={handleResetForm}
                  className="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Live Board */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 text-sm tracking-wider uppercase border-b border-gray-100 pb-2">Live Board</h3>

            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-6 h-6 border-3 border-[#714B67] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : trips.length === 0 ? (
              <p className="text-center py-12 text-sm text-gray-400">No trips logged on the live board.</p>
            ) : (
              <div className="space-y-4">
                {trips.map((t) => (
                  <div 
                    key={t.id} 
                    className="p-4 rounded-xl border border-dashed border-gray-200 space-y-3 relative hover:border-gray-400 transition-all bg-gray-50/50"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-700 text-xs">TR-{String(t.id).padStart(3, '0')}</span>
                      <span className="font-semibold text-gray-500">
                        {t.vehicle || t.driver ? `${t.vehicle?.name || '—'} / ${t.driver?.name || '—'}` : 'Unassigned'}
                      </span>
                    </div>
                    
                    <p className="text-sm font-bold text-gray-800">
                      {t.source} → {t.destination}
                    </p>
                    
                    <div className="flex items-center justify-between pt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase rounded-md tracking-wider ${
                        t.status === 'Draft' ? 'badge-draft' :
                        t.status === 'Dispatched' ? 'badge-dispatched' :
                        t.status === 'Completed' ? 'badge-completed' :
                        'badge-cancelled'
                      }`}>
                        {t.status}
                      </span>
                      
                      <span className="text-xs text-gray-400 font-semibold">
                        {t.status === 'Completed' || t.status === 'Cancelled' ? '—' :
                         t.status === 'Draft' ? 'Awaiting driver' : '45 min'}
                      </span>
                    </div>

                    {/* Action button rows inside the Live Board cards */}
                    {t.status === 'Draft' && (
                      <div className="flex gap-2 pt-2 border-t border-gray-200/60 mt-2">
                        <button
                          onClick={() => handleDispatch(t.id)}
                          className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-md border border-blue-200 transition-colors"
                        >
                          Dispatch
                        </button>
                        <button
                          onClick={() => handleCancel(t.id)}
                          className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-md border border-red-200/60 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    
                    {t.status === 'Dispatched' && (
                      <div className="flex gap-2 pt-2 border-t border-gray-200/60 mt-2">
                        <button
                          onClick={() => openCompleteDialog(t)}
                          className="px-3 py-1 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold rounded-md border border-green-200 transition-colors"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleCancel(t.id)}
                          className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-md border border-red-200/60 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <p className="text-[10px] text-gray-400 font-semibold italic text-center pt-2">
              On Complete: odometer → fuel log → expenses → Vehicle & Driver Available
            </p>
          </div>
        </div>
      </div>

      {/* Complete Trip Dialog Modal */}
      {completeDialogOpen && activeTrip && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-gray-200 w-full max-w-md shadow-2xl overflow-hidden">
            <div className="h-14 border-b border-gray-100 px-6 flex items-center justify-between bg-gray-50">
              <span className="font-bold text-gray-800 text-sm">
                Complete Trip: TR-{String(activeTrip.id).padStart(3, '0')}
              </span>
              <button 
                onClick={() => setCompleteDialogOpen(false)} 
                className="p-1 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleComplete} className="p-6 space-y-4">
              <div className="bg-purple-50 border border-purple-100 p-3 rounded-lg text-xs text-purple-900 leading-normal">
                Vehicle starting odometer is <strong>{activeTrip.vehicle?.odometer} km</strong>. The planned distance was <strong>{activeTrip.planned_distance} km</strong>.
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Final Odometer Reading (km)</label>
                <input 
                  type="number" 
                  required
                  value={endOdometer}
                  onChange={(e) => setEndOdometer(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#714B67]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Fuel Consumed (Liters)</label>
                  <input 
                    type="number" 
                    required
                    value={fuelConsumed}
                    onChange={(e) => setFuelConsumed(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#714B67]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Trip Revenue (₹)</label>
                  <input 
                    type="number" 
                    required
                    value={revenue}
                    onChange={(e) => setRevenue(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#714B67]"
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
                  onClick={() => setCompleteDialogOpen(false)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {saving ? 'Completing...' : 'Submit & Close'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
