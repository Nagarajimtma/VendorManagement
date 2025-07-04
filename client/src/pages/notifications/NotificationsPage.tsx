import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import apiService from '../../utils/api';
import soundService from '../../utils/soundService';
import MainLayout from '../../components/layout/MainLayout';
import { FontAwesomeIcon } from '../../utils/icons';
import { 
  faBell, 
  faCheck, 
  faTrash, 
  faSpinner, 
  faExclamationTriangle, 
  faInfoCircle, 
  faCheckCircle,
  faVolumeUp,
  faVolumeXmark,
  faCog
} from '@fortawesome/free-solid-svg-icons';
import { format, parseISO } from 'date-fns';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'document_submission' | 'document_resubmitted' | 'document_review' | 'document_approved' | 'document_rejected' | 'user_registration' | 'workflow_update' | 'system' | 'login_request' | 'login_approved' | 'login_rejected';
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
  recipient: string;
  sender?: {
    _id: string;
    name: string;
    email: string;
  };
  relatedDocument?: {
    _id: string;
    title: string;
    status: string;
    vendorName?: string;
    consultantName?: string;
    documentType?: string;
    remarks?: string;
  };
  relatedWorkflow?: string;
  relatedLoginApproval?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
}

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useWebSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAsRead, setMarkingAsRead] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(soundService.isEnabledForUser());
  const [showSettings, setShowSettings] = useState(false);
  const [pagination, setPagination] = useState<any>({});
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching notifications for user:', user?.id);
      const response = await apiService.notifications.getAll();
      
      if (response.data.success) {
        console.log('Notifications fetched successfully:', response.data);
        setNotifications(response.data.data);
        setPagination(response.data.pagination || {});
        setTotalNotifications(response.data.total || 0);
        setUnreadCount(response.data.unread || 0);
      } else {
        throw new Error(response.data.message || 'Failed to fetch notifications');
      }
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load notifications');
      
      // Fallback to empty array instead of mock data
      setNotifications([]);
      setTotalNotifications(0);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  // Handle real-time notifications via WebSocket
  useEffect(() => {
    if (socket && isConnected) {
      const handleNotification = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'notification') {
            console.log('Received real-time notification:', message.data);
            
            // Add new notification to the list
            setNotifications(prev => [message.data, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Play notification sound based on type
            const soundType = getNotificationSoundType(message.data.type);
            soundService.playNotificationSound({ 
              type: soundType, 
              volume: 0.3 
            });
            
            // Show browser notification if permitted
            showBrowserNotification(message.data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      socket.addEventListener('message', handleNotification);
      
      return () => {
        socket.removeEventListener('message', handleNotification);
      };
    }
  }, [socket, isConnected]);

  const handleMarkAsRead = async (id: string) => {
    try {
      setMarkingAsRead(true);
      
      const response = await apiService.notifications.markAsRead(id);
      
      if (response.data.success) {
        // Update the local state
        setNotifications(prevNotifications =>
          prevNotifications.map(notification =>
            notification._id === id
              ? { ...notification, isRead: true }
              : notification
          )
        );
        
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        throw new Error(response.data.message || 'Failed to mark notification as read');
      }
      
      setMarkingAsRead(false);
    } catch (err: any) {
      console.error('Failed to mark notification as read:', err);
      setError(err.response?.data?.message || err.message || 'Failed to mark notification as read');
      setMarkingAsRead(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAsRead(true);
      
      const response = await apiService.notifications.markAllAsRead();
      
      if (response.data.success) {
        // Update the local state
        setNotifications(prevNotifications =>
          prevNotifications.map(notification => ({ ...notification, isRead: true }))
        );
        
        // Reset unread count
        setUnreadCount(0);
      } else {
        throw new Error(response.data.message || 'Failed to mark all notifications as read');
      }
      
      setMarkingAsRead(false);
    } catch (err: any) {
      console.error('Failed to mark all notifications as read:', err);
      setError(err.response?.data?.message || err.message || 'Failed to mark all notifications as read');
      setMarkingAsRead(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      const response = await apiService.notifications.delete(id);
      
      if (response.data.success) {
        // Update the local state
        setNotifications(prevNotifications =>
          prevNotifications.filter(notification => notification._id !== id)
        );
        setTotalNotifications(prev => prev - 1);
      } else {
        throw new Error(response.data.message || 'Failed to delete notification');
      }
    } catch (err: any) {
      console.error('Failed to delete notification:', err);
      setError(err.response?.data?.message || err.message || 'Failed to delete notification');
    }
  };

  // Helper function to get notification sound type
  const getNotificationSoundType = (notificationType: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (notificationType) {
      case 'document_approved':
      case 'login_approved':
        return 'success';
      case 'document_rejected':
      case 'login_rejected':
        return 'error';
      case 'document_review':
      case 'workflow_update':
        return 'warning';
      case 'document_submission':
      case 'document_resubmitted':
      case 'user_registration':
      case 'login_request':
        return 'info';
      default:
        return 'default';
    }
  };

  // Helper function to show browser notification
  const showBrowserNotification = (notification: Notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification._id
      });
    }
  };

  // Helper function to request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  // Toggle sound settings
  const toggleSound = () => {
    const newSoundEnabled = !soundEnabled;
    setSoundEnabled(newSoundEnabled);
    soundService.setEnabled(newSoundEnabled);
    
    if (newSoundEnabled) {
      soundService.testSound();
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'document_approved':
      case 'login_approved':
        return <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />;
      case 'document_rejected':
      case 'login_rejected':
        return <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500" />;
      case 'document_review':
      case 'workflow_update':
        return <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-500" />;
      case 'document_submission':
      case 'user_registration':
      case 'login_request':
      case 'system':
        return <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500" />;
      default:
        return <FontAwesomeIcon icon={faBell} className="text-gray-500" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'document_approved':
        return 'Document Approved';
      case 'document_rejected':
        return 'Document Rejected';
      case 'document_review':
        return 'Document Under Review';
      case 'document_submission':
        return 'Document Submitted';
      case 'user_registration':
        return 'User Registration';
      case 'workflow_update':
        return 'Workflow Update';
      case 'login_request':
        return 'Login Request';
      case 'login_approved':
        return 'Login Approved';
      case 'login_rejected':
        return 'Login Rejected';
      case 'system':
        return 'System Notification';
      default:
        return 'Notification';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Sound Settings */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
                title="Notification Settings"
              >
                <FontAwesomeIcon icon={faCog} />
              </button>
              
              {showSettings && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-10 p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Notification Settings</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">Sound Notifications</label>
                      <button
                        onClick={toggleSound}
                        className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm ${
                          soundEnabled 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <FontAwesomeIcon 
                          icon={soundEnabled ? faVolumeUp : faVolumeXmark} 
                          className="w-4 h-4" 
                        />
                        <span>{soundEnabled ? 'On' : 'Off'}</span>
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">Browser Notifications</label>
                      <button
                        onClick={requestNotificationPermission}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm hover:bg-blue-200"
                      >
                        Enable
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowSettings(false)}
                    className="mt-3 w-full text-center text-sm text-gray-500 hover:text-gray-700"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
            
            {/* Mark All as Read Button */}
            {notifications.some(notification => !notification.isRead) && (
              <button
                onClick={handleMarkAllAsRead}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded flex items-center"
                disabled={markingAsRead}
              >
                {markingAsRead ? (
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                ) : (
                  <FontAwesomeIcon icon={faCheck} className="mr-2" />
                )}
                Mark All as Read
              </button>
            )}
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <FontAwesomeIcon icon={faBell} className="text-gray-400 h-12 w-12 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No notifications</h3>
            <p className="text-gray-500 mt-1">You don't have any notifications at this time.</p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-medium">All Notifications</h2>
              <p className="text-sm text-gray-500">Your recent notifications and alerts</p>
            </div>
            
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div 
                  key={notification._id} 
                  className={`p-4 ${!notification.isRead ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-medium ${!notification.isRead ? 'text-blue-900' : 'text-gray-900'}`}>
                          {notification.title}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        <p>{notification.message}</p>
                        {notification.relatedDocument && (
                          <p className="mt-1 text-sm">
                            <span className="font-medium">Related Document:</span> {notification.relatedDocument.title}
                          </p>
                        )}
                      </div>
                      <div className="mt-2 flex space-x-3">
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification._id)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center"
                          >
                            <FontAwesomeIcon icon={faCheck} className="mr-1" />
                            Mark as Read
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(notification._id)}
                          className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center"
                        >
                          <FontAwesomeIcon icon={faTrash} className="mr-1" />
                          Delete
                        </button>
                        {notification.relatedDocument && (
                          <a
                            href={`/documents/${notification.relatedDocument._id}`}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Document
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default NotificationsPage;