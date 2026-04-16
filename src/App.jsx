import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BotSettings from './pages/BotSettings';
import KnowledgeBase from './pages/KnowledgeBase';
import Conversations from './pages/Conversations';
import Handoff from './pages/Handoff';
import Subscription from './pages/Subscription';
import Profile from './pages/Profile';
import Onboarding from './pages/Onboarding';
import Referral from './pages/Referral';
import Broadcast from './pages/Broadcast';
import Analytics from './pages/Analytics';
import LineSetupGuide from './pages/LineSetupGuide';
import CRM from './pages/CRM';
import Marketing from './pages/Marketing';
import Settings from './pages/Settings';
import FAQ from './pages/FAQ';
import Catalog from './pages/Catalog';
import Orders from './pages/Orders';
import Bookings from './pages/Bookings';

function MerchantLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0A0A0F]">
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      <main className="flex-1 min-w-0 h-screen overflow-y-auto overflow-x-hidden">
        {/* Pass setSidebarOpen to each page so mobile header can open the drawer */}
        {children(setSidebarOpen)}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Protected layout */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <MerchantLayout>
                  {(setSidebarOpen) => (
                    <Routes>
                      <Route path="/" element={<Dashboard setSidebarOpen={setSidebarOpen} />} />
                      <Route path="/bot" element={<BotSettings setSidebarOpen={setSidebarOpen} />} />
                      <Route path="/knowledge" element={<KnowledgeBase setSidebarOpen={setSidebarOpen} />} />
                      <Route path="/conversations" element={<Conversations setSidebarOpen={setSidebarOpen} />} />
                      <Route path="/handoff" element={<Handoff setSidebarOpen={setSidebarOpen} />} />
                      <Route path="/subscription" element={<Subscription setSidebarOpen={setSidebarOpen} />} />
                      <Route path="/referral" element={<Referral setSidebarOpen={setSidebarOpen} />} />
                      <Route path="/analytics" element={<Analytics setSidebarOpen={setSidebarOpen} />} />
                      <Route path="/broadcast" element={<Broadcast setSidebarOpen={setSidebarOpen} />} />
                      <Route path="/profile" element={<Navigate to="/settings" replace />} />
                      <Route path="/settings" element={<Settings setSidebarOpen={setSidebarOpen} />} />
                      <Route path="/line-guide" element={<LineSetupGuide setSidebarOpen={setSidebarOpen} />} />
                      <Route path="/crm" element={<CRM setSidebarOpen={setSidebarOpen} />} />
                      <Route path="/automation" element={<Marketing setSidebarOpen={setSidebarOpen} />} />
                      <Route path="/faq" element={<FAQ setSidebarOpen={setSidebarOpen} />} />
                      <Route path="/catalog" element={<Catalog setSidebarOpen={setSidebarOpen} />} />
                      <Route path="/orders" element={<Orders setSidebarOpen={setSidebarOpen} />} />
                      <Route path="/bookings" element={<Bookings setSidebarOpen={setSidebarOpen} />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  )}
                </MerchantLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
