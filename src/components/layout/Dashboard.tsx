import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const Dashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
  };
  
  return (
    <div className="min-h-screen bg-secondary-50">
      <Header toggleSidebar={toggleSidebar} isCollapsed={isCollapsed} />
      
      <div className="flex">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={closeSidebar} 
          onCollapse={handleCollapse}
        />
        
        <main className={`flex-1 p-4 md:p-6 lg:p-8 pt-20 transition-all duration-300 ${
          isCollapsed ? 'md:ml-16' : 'md:ml-64'
        }`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;