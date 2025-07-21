import React from 'react';
import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  toggleSidebar: () => void;
  isCollapsed: boolean;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, isCollapsed }) => {
  const { logout, user } = useAuth();

  return (
    <header className="bg-white border-b border-secondary-200 h-16 flex items-center fixed top-0 left-0 right-0 z-40">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className={`flex items-center transition-all duration-300 ${
          isCollapsed ? 'md:ml-16' : 'md:ml-64'
        }`}>
          <button
            type="button"
            className="md:hidden p-2 rounded-md text-secondary-500 hover:text-secondary-900 hover:bg-secondary-100 focus:outline-none"
            onClick={toggleSidebar}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
        
        <div className="flex items-center space-x-4">          
          <div className="flex items-center">
            <button onClick={logout} className="flex items-center text-sm text-secondary-700 hover:text-secondary-900 focus:outline-none">
              <span className="hidden md:block font-medium">Logout</span>
              <LogOut className="h-4 w-4 ml-1 text-secondary-400" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header