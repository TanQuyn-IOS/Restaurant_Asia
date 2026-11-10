/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { RestaurantProvider, useRestaurant } from './context/RestaurantContext';
import { Navbar, TabType } from './components/Navbar';
import { FloorPlanView } from './components/FloorPlan/FloorPlanView';
import { MenuView } from './components/Menu/MenuView';
import { POSView } from './components/POS/POSView';
import { KitchenView } from './components/Kitchen/KitchenView';
import { StaffView } from './components/Staff/StaffView';
import { AnalyticsView } from './components/Analytics/AnalyticsView';
import { CustomerPortalView } from './components/Customer/CustomerPortalView';
import { AccountManagementView } from './components/AccountManagement/AccountManagementView';
import { WaiterView } from './components/Waiter/WaiterView';
import { LoginView } from './components/Auth/LoginView';
import { ToastContainer } from './components/Common/ToastContainer';

function MainAppContent() {
  const { currentRole, currentUser, isLoginModalOpen, closeLoginModal } = useRestaurant();
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (currentRole === 'customer' || !currentUser) return 'customer';
    if (currentRole === 'waiter') return 'waiter';
    if (currentRole === 'kitchen') return 'kitchen';
    if (currentRole === 'cashier') return 'pos';
    if (currentRole === 'hr_manager') return 'staff';
    return 'accounts';
  });
  const [selectedTableForPOS, setSelectedTableForPOS] = useState<string | undefined>(undefined);

  // Synchronize activeTab when role changes
  useEffect(() => {
    if (currentRole === 'customer') {
      setActiveTab('customer');
    } else if (currentRole === 'waiter' && activeTab !== 'waiter' && activeTab !== 'floor' && activeTab !== 'pos') {
      setActiveTab('waiter');
    } else if (currentRole === 'hr_manager' && activeTab !== 'staff' && activeTab !== 'analytics') {
      setActiveTab('staff');
    } else if (currentRole === 'kitchen' && activeTab !== 'kitchen' && activeTab !== 'menu') {
      setActiveTab('kitchen');
    } else if (currentRole === 'cashier' && activeTab !== 'floor' && activeTab !== 'pos') {
      setActiveTab('pos');
    } else if (currentRole === 'admin' && activeTab === 'customer') {
      setActiveTab('accounts');
    }
  }, [currentRole]);

  const handleOpenPOSForTable = (tableId: string) => {
    setSelectedTableForPOS(tableId);
    setActiveTab('pos');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col selection:bg-amber-500 selection:text-slate-950 font-sans antialiased">
      {/* Navigation & Header with Role Switcher & Login/Logout */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeTab === 'accounts' && <AccountManagementView />}

        {activeTab === 'customer' && <CustomerPortalView />}

        {activeTab === 'waiter' && (
          <WaiterView onOpenPOSForTable={handleOpenPOSForTable} />
        )}

        {activeTab === 'floor' && (
          <FloorPlanView onOpenPOSForTable={handleOpenPOSForTable} />
        )}

        {activeTab === 'menu' && <MenuView />}

        {activeTab === 'pos' && (
          <POSView initialTableId={selectedTableForPOS} />
        )}

        {activeTab === 'kitchen' && <KitchenView />}

        {activeTab === 'staff' && <StaffView />}

        {activeTab === 'analytics' && <AnalyticsView />}
      </main>

      {/* Login & Account Switching Modal */}
      {isLoginModalOpen && (
        <LoginView isOpen={isLoginModalOpen} onClose={closeLoginModal} />
      )}

      {/* Floating Notification System */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <RestaurantProvider>
      <MainAppContent />
    </RestaurantProvider>
  );
}
