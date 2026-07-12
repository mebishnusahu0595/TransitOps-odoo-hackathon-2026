import { Shield, Check, X } from 'lucide-react';

export default function Settings() {
  const roles = [
    { name: 'Fleet Manager', fleet: true, drivers: false, trips: false, maintenance: true, expenses: false, reports: false },
    { name: 'Dispatcher', fleet: false, drivers: false, trips: true, maintenance: false, expenses: false, reports: false },
    { name: 'Safety Officer', fleet: false, drivers: true, trips: false, maintenance: false, expenses: false, reports: false },
    { name: 'Financial Analyst', fleet: false, drivers: false, trips: false, maintenance: false, expenses: true, reports: true },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="font-semibold text-gray-800 text-base flex items-center gap-2">
          <Shield size={18} className="text-[#714B67]" />
          Role-Based Access Control (RBAC) Permission Matrix
        </h3>
        <p className="text-xs text-gray-500 max-w-2xl leading-normal">
          Enforces module-level visibility and endpoint execution rights. Roles are assigned to profiles. 
          Unauthorised views are hidden from navigation and blocked at server endpoints with HTTP 403 Forbidden.
        </p>

        <div className="overflow-x-auto pt-4">
          <table className="w-full text-left border-collapse odoo-table">
            <thead>
              <tr>
                <th className="py-3 px-6">System Role</th>
                <th className="py-3 px-6 text-center">Fleet Registry</th>
                <th className="py-3 px-6 text-center">Drivers & Safety</th>
                <th className="py-3 px-6 text-center">Trip Dispatcher</th>
                <th className="py-3 px-6 text-center">Maintenance logs</th>
                <th className="py-3 px-6 text-center">Fuel & Expenses</th>
                <th className="py-3 px-6 text-center">Analytics & ROI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {roles.map((r) => (
                <tr key={r.name}>
                  <td className="py-4 px-6 font-bold text-gray-800 text-sm">{r.name}</td>
                  
                  <td className="py-4 px-6 text-center">
                    {r.fleet ? <Check size={18} className="text-green-500 mx-auto" /> : <X size={18} className="text-gray-300 mx-auto" />}
                  </td>
                  
                  <td className="py-4 px-6 text-center">
                    {r.drivers ? <Check size={18} className="text-green-500 mx-auto" /> : <X size={18} className="text-gray-300 mx-auto" />}
                  </td>

                  <td className="py-4 px-6 text-center">
                    {r.trips ? <Check size={18} className="text-green-500 mx-auto" /> : <X size={18} className="text-gray-300 mx-auto" />}
                  </td>

                  <td className="py-4 px-6 text-center">
                    {r.maintenance ? <Check size={18} className="text-green-500 mx-auto" /> : <X size={18} className="text-gray-300 mx-auto" />}
                  </td>

                  <td className="py-4 px-6 text-center">
                    {r.expenses ? <Check size={18} className="text-green-500 mx-auto" /> : <X size={18} className="text-gray-300 mx-auto" />}
                  </td>

                  <td className="py-4 px-6 text-center">
                    {r.reports ? <Check size={18} className="text-green-500 mx-auto" /> : <X size={18} className="text-gray-300 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
