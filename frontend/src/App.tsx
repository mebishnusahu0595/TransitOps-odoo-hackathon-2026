import { useAppStore } from './app/store';
import Login from './features/Login';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './features/Dashboard';
import Vehicles from './features/Vehicles';
import Drivers from './features/Drivers';
import Trips from './features/Trips';
import Maintenance from './features/Maintenance';
import Expenses from './features/Expenses';
import Reports from './features/Reports';
import Settings from './features/Settings';

export default function App() {
  const { token, activeView } = useAppStore();

  if (!token) {
    return <Login />;
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'fleet':
        return <Vehicles />;
      case 'drivers':
        return <Drivers />;
      case 'trips':
        return <Trips />;
      case 'maintenance':
        return <Maintenance />;
      case 'expenses':
        return <Expenses />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <DashboardLayout>
      {renderActiveView()}
    </DashboardLayout>
  );
}
