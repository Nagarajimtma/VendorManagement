import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '../../utils/icons';
import { faCheckCircle, faTimesCircle, faClock, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

const LoginApprovalWaitingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { checkLoginApprovalStatus, isAuthenticated, error } = useAuth();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<number>(0);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [message, setMessage] = useState<string>('');
  
  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  
  // Check login approval status
  const checkStatus = useCallback(async () => {
    if (!id) return;
    
    try {
      const approval = await checkLoginApprovalStatus(id);
      
      if (approval) {
        setStatus(approval.status);
        setExpiresAt(new Date(approval.expiresAt));
        
        if (approval.status === 'approved') {
          setMessage('Your login has been approved! Redirecting to dashboard...');
          // The auth context will handle the redirection once it sets isAuthenticated to true
        } else if (approval.status === 'rejected') {
          setMessage('Your login request was rejected. Please contact your administrator or try again.');
        }
      } else {
        setMessage('Login request not found or has expired. Please try logging in again.');
        setStatus('rejected');
      }
    } catch (err) {
      console.error('Failed to check login status:', err);
      setMessage('Failed to check login status. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id, checkLoginApprovalStatus]);
  
  // Initial check
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);
  
  // Set up polling for status updates every 10 seconds
  useEffect(() => {
    if (status === 'pending') {
      const interval = setInterval(() => {
        checkStatus();
      }, 10000); // 10 seconds
      
      return () => clearInterval(interval);
    }
  }, [status, checkStatus]);
  
  // Update countdown timer
  useEffect(() => {
    if (expiresAt && status === 'pending') {
      const timer = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
        
        if (diff <= 0) {
          setCountdown(0);
          setMessage('Login request has expired. Please try logging in again.');
          setStatus('rejected');
          clearInterval(timer);
        } else {
          setCountdown(diff);
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [expiresAt, status]);
  
  // Format the countdown time
  const formatCountdown = () => {
    if (countdown <= 0) return '00:00:00';
    
    const hours = Math.floor(countdown / 3600);
    const minutes = Math.floor((countdown % 3600) / 60);
    const seconds = countdown % 60;
    
    return [hours, minutes, seconds]
      .map(v => v < 10 ? `0${v}` : v)
      .join(':');
  };
  
  // Render different content based on status
  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Checking your login approval status...</p>
        </div>
      );
    }
    
    switch (status) {
      case 'approved':
        return (
          <div className="text-center">
            <FontAwesomeIcon icon={faCheckCircle} className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Login Approved!</h3>
            <p className="text-gray-600 mb-6">{message}</p>
          </div>
        );
      
      case 'rejected':
        return (
          <div className="text-center">
            <FontAwesomeIcon icon={faTimesCircle} className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Login Rejected</h3>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link 
              to="/login" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Return to Login
            </Link>
          </div>
        );
      
      case 'pending':
      default:
        return (
          <div className="text-center">
            <FontAwesomeIcon icon={faClock} className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Waiting for Approval</h3>
            <p className="text-gray-600 mb-2">
              Your login request is pending approval from an administrator or consultant.
            </p>
            <p className="text-gray-600 mb-6">
              You will be automatically redirected once your login is approved.
            </p>
            
            {expiresAt && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-500 mb-1">Request expires in:</p>
                <p className="text-2xl font-mono font-medium text-gray-800">{formatCountdown()}</p>
              </div>
            )}
            
            <button
              onClick={checkStatus}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Check Status
            </button>
          </div>
        );
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-6">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/d/d8/IMTMA.png" 
            alt="IMTMA Logo" 
            className="h-16 w-auto mx-auto mb-4"
          />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Login Approval
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faExclamationCircle} className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {renderContent()}
        </div>
        
        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
            Cancel and return to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginApprovalWaitingPage; 