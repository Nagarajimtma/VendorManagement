import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../utils/api';
import { getMimeTypeFromFileName, canPreviewInBrowser } from '../../utils/mimeTypes';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// Define years and months for dropdown
const YEARS = Array.from({ length: 16 }, (_, i) => 2035 - i);
const MONTHS = [
  { value: 'All', label: 'All Months' },
  { value: 'Jan', label: 'January' },
  { value: 'Feb', label: 'February' },
  { value: 'Mar', label: 'March' },
  { value: 'Apr', label: 'April' },
  { value: 'May', label: 'May' },
  { value: 'Jun', label: 'June' },
  { value: 'Jul', label: 'July' },
  { value: 'Aug', label: 'August' },
  { value: 'Sep', label: 'September' },
  { value: 'Oct', label: 'October' },
  { value: 'Nov', label: 'November' },
  { value: 'Dec', label: 'December' }
];

// Types for Document Submission
interface Document {
  id?: string;
  type: string;
  name: string;
  status: string;
  uploadDate?: string;
  reviewDate?: string;
  consultantStatus?: string;
  consultantRemarks?: string;
  remarks?: string;  // Add this field to handle different field names
  reviewNotes?: string;  // Add this field to handle different field names
  filePath?: string;
}

interface Consultant {
  name: string;
  email: string;
}

interface DocumentSubmission {
  id: string;
  submissionId: string;
  period: string;
  status: string;
  submissionDate?: string;
  lastModified?: string;
  documentCount: number;
  consultant: Consultant;
  documents: Document[];
}

interface DocumentStatusTrackerProps {
  showRejectedOnly?: boolean;
}

const DocumentStatusTracker: React.FC<DocumentStatusTrackerProps> = ({ showRejectedOnly = false }) => {
  // Filter state
  const [selectedYear, setSelectedYear] = useState<number>(2025); // Default to 2025 for testing
  const [selectedMonth, setSelectedMonth] = useState<string>('All'); // Show all months by default
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Data state
  const [submissions, setSubmissions] = useState<DocumentSubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);
  
  // Fetch submissions based on filters
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Prepare query parameters
        const params: Record<string, any> = {
          year: selectedYear
        };
        
        if (selectedMonth !== 'All') {
          params.month = selectedMonth;
        }
        
        console.log('Fetching submissions with filters:', params);
        
        if (showRejectedOnly) {
          params.status = 'rejected,requires_resubmission';
        }
        
        try {
          // Fetch submissions
          const response = await apiService.documents.getVendorSubmissions(params);
          
          console.log('API Response:', response.data);
          
          if (response.data.success) {
            // Ensure submissions is always an array
            let submissionsData = Array.isArray(response.data.data) 
              ? response.data.data 
              : [];
            
            // Process and normalize submission data
            submissionsData = submissionsData.map((submission: any) => {
              // Normalize submission status
              let normalizedSubmission = { ...submission };
              if (normalizedSubmission.status === 'draft') {
                normalizedSubmission.status = 'in_progress';
              }
              
              // Ensure submission has all required fields
              normalizedSubmission.submissionId = normalizedSubmission.submissionId || normalizedSubmission._id || normalizedSubmission.id;
              normalizedSubmission.id = normalizedSubmission._id || normalizedSubmission.id || normalizedSubmission.submissionId;
              
              // Handle period - could be in different formats
              if (!normalizedSubmission.period && normalizedSubmission.month && normalizedSubmission.year) {
                normalizedSubmission.period = `${normalizedSubmission.month} ${normalizedSubmission.year}`;
              } else if (!normalizedSubmission.period && normalizedSubmission.submissionPeriod) {
                normalizedSubmission.period = normalizedSubmission.submissionPeriod;
              } else if (!normalizedSubmission.period) {
                // Try to extract from submissionDate if available
                const date = normalizedSubmission.submissionDate || normalizedSubmission.createdAt;
                if (date) {
                  const dateObj = new Date(date);
                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  normalizedSubmission.period = `${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
                }
              }
              
              // Handle submission date - try multiple field names
              if (!normalizedSubmission.submissionDate) {
                normalizedSubmission.submissionDate = 
                  normalizedSubmission.submissionDate || 
                  normalizedSubmission.createdAt || 
                  normalizedSubmission.updatedAt ||
                  normalizedSubmission.lastModified;
              }
              
              // Handle consultant information
              if (!normalizedSubmission.consultant && normalizedSubmission.assignedConsultant) {
                normalizedSubmission.consultant = normalizedSubmission.assignedConsultant;
              }
              
              // Process documents array
              if (normalizedSubmission.documents && Array.isArray(normalizedSubmission.documents)) {
                normalizedSubmission.documents = normalizedSubmission.documents.map((doc: Document) => {
                  // Normalize document status
                  if (doc.status === 'draft') {
                    doc = { ...doc, status: 'in_progress' };
                  }
                  
                  // Set consultantStatus if not present but status is rejected
                  if (!doc.consultantStatus && (doc.status === 'rejected' || doc.status === 'requires_resubmission')) {
                    doc.consultantStatus = 'rejected';
                  }
                  
                  // Copy remarks to consultantRemarks if needed
                  if (!doc.consultantRemarks && (doc.remarks || doc.reviewNotes)) {
                    doc.consultantRemarks = doc.remarks || doc.reviewNotes;
                  }
                  
                  return doc;
                });
              }
              
              return normalizedSubmission;
            });
            
            console.log('Processed submissions data:', submissionsData);
            console.log('Sample submission data:', submissionsData[0]);
            setSubmissions(submissionsData);
          } else {
            setError(response.data.message || 'Failed to fetch document submissions');
            // Set empty array to prevent filter errors
            setSubmissions([]);
          }
        } catch (apiError) {
          console.error('API Error fetching submissions:', apiError);
          setError('Failed to connect to the server. Please try again later.');
          
          // Set empty array to prevent filter errors
          setSubmissions([]);
        }
      } catch (err: any) {
        console.error('Error in submission fetching process:', err);
        setError(err.message || 'An unexpected error occurred');
        // Set empty array to prevent filter errors
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubmissions();
  }, [selectedYear, selectedMonth, showRejectedOnly]);
  
  // Toggle expanded submission
  const toggleExpand = (submissionId: string) => {
    if (expandedSubmission === submissionId) {
      setExpandedSubmission(null);
    } else {
      setExpandedSubmission(submissionId);
    }
  };
  
  // Download verification document
  const handleDownloadVerification = async (submissionId: string) => {
    try {
      const response = await apiService.documents.downloadVerificationDocument(submissionId);
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `verification_${submissionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading verification document:', err);
      setError('Failed to download verification document');
    }
  };
  
  // Handle resubmission
  const handleResubmit = (submissionId: string) => {
    // Navigate to resubmission page with the submission ID
    window.location.href = `/documents/resubmit/${submissionId}`;
  };
  
  // Handle document viewing
  const handleViewDocument = async (filePath: string) => {
    if (!filePath) {
      setError('Document file path is missing');
      return;
    }
    
    try {
      const response = await apiService.documents.viewFile(filePath);
      
      // Use utility function to get MIME type
      const mimeType = getMimeTypeFromFileName(filePath);
      
      // Create a blob URL with the correct MIME type
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      
      // Check if file can be previewed in browser
      if (canPreviewInBrowser(filePath)) {
        // Open PDF and images in a new tab for preview
        window.open(url, '_blank');
      } else {
        // For Word, Excel, and other files, trigger download
        const fileName = filePath.split('/').pop() || 'document';
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error viewing document:', err);
      setError('Failed to view document. Please try again later.');
    }
  };
  
  // Filter submissions by search query and date (as backup to API filtering)
  const filteredSubmissions = Array.isArray(submissions) ? submissions.filter(submission => {
    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (
        submission.submissionId?.toLowerCase().includes(query) ||
        (submission.consultant?.name && submission.consultant.name.toLowerCase().includes(query)) ||
        (submission.consultant?.email && submission.consultant.email.toLowerCase().includes(query)) ||
        (submission.period && submission.period.toLowerCase().includes(query)) ||
        (Array.isArray(submission.documents) && submission.documents.some(doc => 
          (doc.name && doc.name.toLowerCase().includes(query)) ||
          (doc.type && doc.type.toLowerCase().includes(query))
        ))
      );
      
      if (!matchesSearch) return false;
    }
    
    // Apply date filtering as backup (in case API filtering doesn't work properly)
    if (selectedYear && submission.submissionDate) {
      const submissionDate = new Date(submission.submissionDate);
      const submissionYear = submissionDate.getFullYear();
      
      if (submissionYear !== selectedYear) return false;
      
      if (selectedMonth && selectedMonth !== 'All') {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const submissionMonth = monthNames[submissionDate.getMonth()];
        
        if (submissionMonth !== selectedMonth) return false;
      }
    }
    
    return true;
  }) : [];
  
  // Get status icon
  const getStatusIcon = (status: string | undefined | null) => {
    if (!status) {
      return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
    
    switch (status) {
      case 'approved':
      case 'fully_approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'rejected':
      case 'requires_resubmission':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'partially_approved':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'in_progress':
      case 'under_review':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
    }
  };
  
  // Get status badge variant
  const getStatusBadgeVariant = (status: string | undefined | null): 'success' | 'danger' | 'warning' | 'info' | 'default' => {
    if (!status) {
      return 'default';
    }
    
    switch (status) {
      case 'approved':
      case 'fully_approved':
        return 'success';
      case 'rejected':
      case 'requires_resubmission':
        return 'danger';
      case 'partially_approved':
        return 'warning';
      case 'under_review':
      case 'in_progress':
        return 'info';
      default:
        return 'default';
    }
  };
  
  // Format status text
  const formatStatus = (status: string | undefined | null) => {
    if (!status) {
      return 'Unknown';
    }
    return status
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {showRejectedOnly ? 'Rejected Documents' : 'Document Status Tracker'}
        </h2>
        
        {/* Filters */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 space-y-1">
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Year
            </label>
            <select
              id="year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              {YEARS.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 space-y-1">
            <label htmlFor="month" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Month
            </label>
            <select
              id="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              {MONTHS.map((month) => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 space-y-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Search
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="Search submissions..."
              />
            </div>
          </div>
          
          <div className="flex-none">
            <Button
              variant="outline"
              leftIcon={<FunnelIcon className="h-5 w-5" />}
              onClick={() => {
                setSelectedYear(2025); // Reset to 2025 for testing
                setSelectedMonth('All'); // Show all months
                setSearchQuery('');
              }}
            >
              Reset Filters
            </Button>
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-md">
            <div className="flex">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-3" />
              <span className="text-red-700 dark:text-red-400">{error}</span>
            </div>
          </div>
        )}
        
        {/* Loading state */}
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="animate-pulse flex space-x-4 items-center">
              <div className="h-8 w-8 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
              <div className="text-gray-600 dark:text-gray-400">Loading submissions...</div>
            </div>
          </div>
        ) : filteredSubmissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submission ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Consultant
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submission Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {filteredSubmissions.map((submission) => (
                  <React.Fragment key={submission.id}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {submission.submissionId}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {submission.period || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {submission.consultant?.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {submission.consultant?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {submission.submissionDate ? 
                          new Date(submission.submissionDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : 
                          'Not submitted'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(submission.status)}
                          <Badge
                            variant={getStatusBadgeVariant(submission.status)}
                            className="ml-2"
                          >
                            {formatStatus(submission.status)}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleExpand(submission.id)}
                            title={expandedSubmission === submission.id ? 'Hide Details' : 'Show Details'}
                          >
                            {expandedSubmission === submission.id ? (
                              <ChevronUpIcon className="h-5 w-5" />
                            ) : (
                              <ChevronDownIcon className="h-5 w-5" />
                            )}
                          </Button>
                          
                          {submission.status === 'fully_approved' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownloadVerification(submission.submissionId)}
                              title="Download Verification"
                            >
                              <ArrowDownTrayIcon className="h-5 w-5 text-green-500" />
                            </Button>
                          )}
                          
                          {(submission.status === 'rejected' || submission.status === 'requires_resubmission') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResubmit(submission.id)}
                            >
                              Resubmit
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded details */}
                    {expandedSubmission === submission.id && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
                          <div className="space-y-4">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              Document Details
                            </h4>
                            
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                <thead className="bg-gray-100 dark:bg-gray-800">
                                  <tr>
                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Document Name
                                    </th>
                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Status
                                    </th>
                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Consultant Remarks
                                    </th>
                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Actions
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                  {(submission.documents || []).map((doc, index) => (
                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                        {doc.name || 'Unknown Document'}
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap">
                                        <Badge variant={getStatusBadgeVariant(doc.status)}>
                                          {formatStatus(doc.status)}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                                        {doc.consultantRemarks || doc.remarks || doc.reviewNotes || '-'}
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap">
                                        <div className="flex space-x-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleViewDocument(doc.filePath || '')}
                                            disabled={!doc.filePath}
                                            title={doc.filePath ? 'View Document' : 'Document not available for viewing'}
                                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                          >
                                            <MagnifyingGlassIcon className="h-4 w-4 mr-1" />
                                            View
                                          </Button>
                                          
                                          {(doc.status === 'rejected' || doc.status === 'requires_resubmission' || 
                                            doc.consultantStatus === 'rejected') && submission.id && (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handleResubmit(submission.id)}
                                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                            >
                                              Resubmit
                                            </Button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <DocumentTextIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No document submissions found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {showRejectedOnly 
                ? `No rejected documents found for ${selectedMonth === 'All' ? selectedYear : `${selectedMonth} ${selectedYear}`}.`
                : `No document submissions found for ${selectedMonth === 'All' ? selectedYear : `${selectedMonth} ${selectedYear}`}.`}
            </p>
            <div className="text-sm text-gray-400 dark:text-gray-500 mb-4">
              <p>Try adjusting your filters:</p>
              <ul className="list-disc list-inside mt-2 text-left max-w-md mx-auto">
                <li>Select a different year or month</li>
                <li>Clear the search query</li>
                <li>Check if documents were submitted under a different period</li>
              </ul>
            </div>
            {!showRejectedOnly && (
              <Link to="/documents/upload">
                <Button>
                  Upload Documents
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default DocumentStatusTracker;