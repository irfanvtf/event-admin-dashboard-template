import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  MapPin,
  ClipboardList,
  QrCode,
  Table,
  Gift
} from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCollapse: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onCollapse }) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const isActiveRoute = (path: string) => {
    // For the dashboard index route
    if (path === '/dashboard' && (location.pathname === '/dashboard' || location.pathname === '/dashboard/')) {
      return true;
    }
    
    // Special case for Check-in submenu items
    if (path === '/dashboard/check-in' && location.pathname === '/dashboard/check-in') {
      return true;
    }
    
    if (path === '/dashboard/check-in/table' && location.pathname === '/dashboard/check-in/table') {
      return true;
    }
    
    // Special case for Gift Redemption submenu items
    if (path === '/dashboard/gift-redemption' && location.pathname === '/dashboard/gift-redemption') {
      return true;
    }
    
    if (path === '/dashboard/gift-redemption/table' && location.pathname === '/dashboard/gift-redemption/table') {
      return true;
    }
    
    // For parent items with submenus, they should be active if any of their children are active
    // but not for the specific submenu items themselves
    if (path === '/dashboard/check-in' && location.pathname.startsWith('/dashboard/check-in/')) {
      return false;
    }
    
    // Same for Gift Redemption parent item
    if (path === '/dashboard/gift-redemption' && location.pathname.startsWith('/dashboard/gift-redemption/')) {
      return false;
    }
    
    // For other routes, check if the pathname exactly matches or starts with the path and has a trailing slash
    return location.pathname === path || location.pathname === `${path}/` || 
           (path !== '/dashboard' && location.pathname.startsWith(path));
  };
  
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (name: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const navItems = [
    { 
      name: 'Dashboard', 
      path: '/dashboard', 
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    { 
      name: 'Event Locations', 
      path: '/dashboard/event-locations', 
      icon: <MapPin className="h-5 w-5" /> 
    },
    { 
      name: 'Survey Responses', 
      path: '/dashboard/survey-responses', 
      icon: <ClipboardList className="h-5 w-5" /> 
    },
    { 
      name: 'Check-In', 
      path: '/dashboard/check-in', 
      icon: <QrCode className="h-5 w-5" />,
      hasSubmenu: true,
      submenuItems: [
        {
          name: 'Scanner',
          path: '/dashboard/check-in',
          icon: <QrCode className="h-4 w-4" />
        },
        {
          name: 'Records',
          path: '/dashboard/check-in/table',
          icon: <Table className="h-4 w-4" />
        }
      ]
    },
    { 
      name: 'Gift Redemption', 
      path: '/dashboard/gift-redemption', 
      icon: <Gift className="h-5 w-5" />,
      hasSubmenu: true,
      submenuItems: [
        {
          name: 'Scanner',
          path: '/dashboard/gift-redemption',
          icon: <Gift className="h-4 w-4" />
        },
        {
          name: 'Records',
          path: '/dashboard/gift-redemption/table',
          icon: <Table className="h-4 w-4" />
        }
      ]
    }
  ];

  const toggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapse(newCollapsed);
  };

  useEffect(() => {
    onCollapse(isCollapsed);
  }, [isCollapsed, onCollapse]);
  
  // Auto-expand submenu when a submenu item is active
  useEffect(() => {
    navItems.forEach(item => {
      if (item.hasSubmenu && item.submenuItems) {
        const hasActiveChild = item.submenuItems.some(subItem => 
          location.pathname === subItem.path || location.pathname === `${subItem.path}/`
        );
        
        if (hasActiveChild) {
          setExpandedItems(prev => ({
            ...prev,
            [item.name]: true
          }));
        }
      }
    });
  }, [location.pathname]);
  
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-45"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={clsx(
          "fixed top-0 left-0 h-full bg-white border-r border-secondary-200 z-50 transition-all duration-300 ease-in-out",
          {
            'translate-x-0': isOpen,
            '-translate-x-full': !isOpen,
            'w-64': !isCollapsed,
            'w-16': isCollapsed,
            'md:translate-x-0': true
          }
        )}
      >
        <div className={clsx(
          "flex items-center h-16 px-4 border-b border-secondary-200",
          { "justify-center": isCollapsed }
        )}>
          {!isCollapsed && (
            <Link to="/dashboard" className="flex items-center">
              <div className="h-8 w-8 rounded bg-primary-500 flex items-center justify-center">
                <span className="text-white font-bold">CM</span>
              </div>
              <span className="ml-2 font-semibold text-secondary-900">VTF Event System</span>
            </Link>
          )}
          
          <button 
            onClick={onClose} 
            className="md:hidden p-2 rounded-md text-secondary-500 hover:text-secondary-900 hover:bg-secondary-100 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <nav className="py-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                {item.hasSubmenu ? (
                  <div>
                    <button
                      onClick={() => toggleExpand(item.name)}
                      className={clsx(
                        "w-full flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                        {
                          "bg-primary-50 text-primary-700": isActiveRoute(item.path),
                          "text-secondary-700 hover:bg-secondary-50 hover:text-secondary-900": !isActiveRoute(item.path),
                          "justify-center": isCollapsed
                        }
                      )}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <span className={clsx(
                        { "text-primary-500": isActiveRoute(item.path) }
                      )}>
                        {item.icon}
                      </span>
                      {!isCollapsed && (
                        <>
                          <span className="ml-3 flex-1">{item.name}</span>
                          <ChevronDown className={clsx(
                            "h-4 w-4 transition-transform",
                            { "transform rotate-180": expandedItems[item.name] }
                          )} />
                        </>
                      )}
                    </button>
                    
                    {!isCollapsed && expandedItems[item.name] && item.submenuItems && (
                      <ul className="mt-1 pl-8 space-y-1">
                        {item.submenuItems.map((subItem) => (
                          <li key={subItem.path}>
                            <Link
                              to={subItem.path}
                              className={clsx(
                                "flex items-center px-3 py-2 text-xs font-medium rounded-md transition-colors",
                                {
                                  "bg-primary-50 text-primary-700": isActiveRoute(subItem.path),
                                  "text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900": !isActiveRoute(subItem.path)
                                }
                              )}
                            >
                              <span className={clsx(
                                "text-secondary-400",
                                { "text-primary-500": isActiveRoute(subItem.path) }
                              )}>
                                {subItem.icon}
                              </span>
                              <span className="ml-2">{subItem.name}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.path}
                    className={clsx(
                      "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                      {
                        "bg-primary-50 text-primary-700": isActiveRoute(item.path),
                        "text-secondary-700 hover:bg-secondary-50 hover:text-secondary-900": !isActiveRoute(item.path),
                        "justify-center": isCollapsed
                      }
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <span className={clsx(
                      { "text-primary-500": isActiveRoute(item.path) }
                    )}>
                      {item.icon}
                    </span>
                    {!isCollapsed && <span className="ml-3">{item.name}</span>}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Collapse button */}
        <button
          onClick={toggleCollapse}
          className="hidden md:flex absolute -right-3 top-20 bg-white border border-secondary-200 rounded-full p-1 shadow-sm hover:bg-secondary-50"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-secondary-600" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-secondary-600" />
          )}
        </button>
      </aside>
    </>
  );
};

export default Sidebar