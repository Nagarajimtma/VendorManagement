import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '../../utils/icons';
import { 
  faHome, 
  faFileAlt, 
  faBell, 
  faUsers, 
  faChartBar, 
  faCog, 
  faSignOutAlt,
  faBars,
  faTimes,
  faUser,
  faDownload,
  faClipboardList,
  faHistory,
  faBuilding,
  faUserTie,
  faTrash,
  faCheckCircle,
  faSearch,
  faListAlt
} from '@fortawesome/free-solid-svg-icons';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Navigation items based on user role
  let navigationItems = [];
  
  if (user?.role === 'vendor') {
    navigationItems = [
      { name: 'Dashboard', path: '/dashboard', icon: <FontAwesomeIcon icon={faHome} /> },
      { name: 'Upload Documents', path: '/documents/submit', icon: <FontAwesomeIcon icon={faFileAlt} /> },
      { name: 'View Documents', path: '/documents', icon: <FontAwesomeIcon icon={faFileAlt} /> },
      { name: 'Edit Documents', path: '/documents/edit', icon: <FontAwesomeIcon icon={faFileAlt} /> },
      //{ name: 'Rejected Documents', path: '/documents/rejected', icon: <FontAwesomeIcon icon={faTrash} /> },
      { name: 'Status', path: '/documents/status', icon: <FontAwesomeIcon icon={faBell} /> },
      { name: 'Profile', path: '/profile', icon: <FontAwesomeIcon icon={faUser} /> },
      { name: 'Notifications', path: '/notifications', icon: <FontAwesomeIcon icon={faBell} /> },
    ];
  } else if (user?.role === 'consultant') {
    // Consultant-specific navigation items
    navigationItems = [
      { name: 'Dashboard', path: '/dashboard', icon: <FontAwesomeIcon icon={faHome} /> },
      { name: 'Vendors List', path: '/vendors-list', icon: <FontAwesomeIcon icon={faBuilding} /> },
      { name: 'Approved Documents', path: '/approved-documents', icon: <FontAwesomeIcon icon={faCheckCircle} /> },
      { name: 'Compliance', path: '/compliance-verification', icon: <FontAwesomeIcon icon={faSearch} /> },
      { name: 'Status ', path: '/vendor-status', icon: <FontAwesomeIcon icon={faChartBar} /> },
      { name: 'Profile', path: '/profile', icon: <FontAwesomeIcon icon={faUser} /> },
      { name: 'Notifications', path: '/notifications', icon: <FontAwesomeIcon icon={faBell} /> },
    ];
  } else if (user?.role === 'admin') {
    // Admin-specific navigation items
    navigationItems = [
      { name: 'Dashboard', path: '/dashboard', icon: <FontAwesomeIcon icon={faHome} /> },
      { name: 'Vendors', path: '/admin/vendors', icon: <FontAwesomeIcon icon={faBuilding} /> },
      { name: 'Consultants', path: '/admin/consultants', icon: <FontAwesomeIcon icon={faUserTie} /> },
      { name: 'Activity Logs', path: '/admin/activity-logs', icon: <FontAwesomeIcon icon={faHistory} /> },
      { name: 'MIS Reports', path: '/admin/reports', icon: <FontAwesomeIcon icon={faChartBar} /> },
      { name: 'Status', path: '/admin/status', icon: <FontAwesomeIcon icon={faClipboardList} /> },
      { name: 'Downloads', path: '/admin/downloads', icon: <FontAwesomeIcon icon={faDownload} /> },
      { name: 'Notifications', path: '/notifications', icon: <FontAwesomeIcon icon={faBell} /> },
      { name: 'Settings', path: '/admin/settings', icon: <FontAwesomeIcon icon={faCog} /> }
    ];
  } else {
    // Default navigation items for other roles
    navigationItems = [
      { name: 'Dashboard', path: '/dashboard', icon: <FontAwesomeIcon icon={faHome} /> },
      { name: 'Documents', path: '/documents', icon: <FontAwesomeIcon icon={faFileAlt} /> },
      { name: 'Notifications', path: '/notifications', icon: <FontAwesomeIcon icon={faBell} /> },
      { name: 'Reports', path: '/reports', icon: <FontAwesomeIcon icon={faChartBar} /> },
      { name: 'Settings', path: '/settings', icon: <FontAwesomeIcon icon={faCog} /> }
    ];
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar for mobile */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} fixed inset-0 z-40 lg:hidden`} role="dialog" aria-modal="true">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" aria-hidden="true" onClick={() => setSidebarOpen(false)}></div>
        
        <div className="relative flex flex-col flex-1 w-full max-w-xs bg-white">
          <div className="absolute top-0 right-0 pt-2 -mr-12">
            <button
              type="button"
              className="flex items-center justify-center w-10 h-10 ml-1 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <FontAwesomeIcon icon={faTimes} className="w-6 h-6 text-white" />
            </button>
          </div>
          
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <span className="text-xl font-bold text-gray-800">Vendor Management</span>
            </div>
            <nav className="px-2 mt-5 space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                    location.pathname === item.path
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className={`mr-4 h-6 w-6 ${
                    location.pathname === item.path ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                  }`}>
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex flex-shrink-0 p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white">
                  {user?.name?.charAt(0) || <FontAwesomeIcon icon={faUser} />}
                </div>
              </div>
              <div className="ml-3">
                <p className="text-base font-medium text-gray-700">{user?.name}</p>
                <p className="text-sm font-medium text-gray-500">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white border-r border-gray-200">
            <div className="flex items-center flex-shrink-0 px-4">
              <span className="text-xl font-bold text-gray-800">Vendor Management</span>
            </div>
            <div className="flex flex-col flex-grow mt-5">
              <nav className="flex-1 px-2 space-y-1 bg-white">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      location.pathname === item.path
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className={`mr-3 flex-shrink-0 h-5 w-5 ${
                      location.pathname === item.path ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`}>
                      {item.icon}
                    </span>
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex flex-shrink-0 p-4 border-t border-gray-200">
              <div className="flex items-center w-full">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-9 w-9 rounded-full bg-blue-600 text-white">
                    {user?.name?.charAt(0) || <FontAwesomeIcon icon={faUser} />}
                  </div>
                </div>
                <div className="ml-3 flex-grow">
                  <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                  <p className="text-xs font-medium text-gray-500">{user?.role}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-1 rounded-full text-gray-400 hover:text-red-500 focus:outline-none"
                >
                  <span className="sr-only">Logout</span>
                  <FontAwesomeIcon icon={faSignOutAlt} className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top header */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <FontAwesomeIcon icon={faBars} className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center">
              {/* Search bar can be added here */}
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              {/* Notification dropdown can be added here */}
              
              {/* Profile dropdown */}
              <div className="ml-3 relative flex items-center">
                <div className="flex items-center">
                  <button 
                    onClick={handleLogout}
                    className="inline-flex items-center p-2 border border-transparent rounded-md text-sm font-medium text-gray-700 hover:text-red-500 hover:bg-gray-100 focus:outline-none"
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} className="h-4 w-4 mr-2" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout; 