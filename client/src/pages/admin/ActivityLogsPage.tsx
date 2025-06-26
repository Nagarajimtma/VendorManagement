import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Button,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { FontAwesomeIcon } from '../../utils/icons';
import { 
  faSearch, 
  faFilter,
  faDownload,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import MainLayout from '../../components/layout/MainLayout';
import axios from 'axios';

// Mock data for activity logs - comprehensive set covering both vendor and consultant activities
const mockActivityLogs = [
  // Today's activities
  { 
    id: '1', 
    action: 'Document Uploaded', 
    user: 'ABC Supplies (Vendor)', 
    documentType: 'Invoice',
    timestamp: new Date().toISOString().split('T')[0] + ' 14:30:22',
    userType: 'vendor'
  },
  { 
    id: '2', 
    action: 'Document Reviewed', 
    user: 'John Smith (Consultant)', 
    documentType: 'Purchase Order',
    timestamp: new Date().toISOString().split('T')[0] + ' 12:45:18',
    userType: 'consultant'
  },
  
  // Yesterday's activities
  { 
    id: '3', 
    action: 'Document Approved', 
    user: 'Sarah Johnson (Consultant)', 
    documentType: 'Delivery Note',
    timestamp: '2023-06-14 16:20:05',
    userType: 'consultant'
  },
  { 
    id: '4', 
    action: 'Document Rejected', 
    user: 'Michael Brown (Consultant)', 
    documentType: 'Quality Certificate',
    timestamp: '2023-06-14 11:10:45',
    userType: 'consultant'
  },
  
  // Vendor activities
  { 
    id: '5', 
    action: 'Document Updated', 
    user: 'XYZ Manufacturing (Vendor)', 
    documentType: 'Invoice',
    timestamp: '2023-06-13 09:55:30',
    userType: 'vendor'
  },
  { 
    id: '6', 
    action: 'User Login', 
    user: 'Global Logistics (Vendor)', 
    documentType: '-',
    timestamp: '2023-06-13 08:30:12',
    userType: 'vendor'
  },
  { 
    id: '7', 
    action: 'Password Reset', 
    user: 'Tech Solutions (Vendor)', 
    documentType: '-',
    timestamp: '2023-06-12 17:15:40',
    userType: 'vendor'
  },
  { 
    id: '8', 
    action: 'New Vendor Registered', 
    user: 'Industrial Parts', 
    documentType: '-',
    timestamp: '2023-06-12 10:05:22',
    userType: 'vendor'
  },
  
  // Consultant activities
  { 
    id: '9', 
    action: 'Document Downloaded', 
    user: 'Emily Davis (Consultant)', 
    documentType: 'Compliance Certificate',
    timestamp: '2023-06-11 14:50:18',
    userType: 'consultant'
  },
  { 
    id: '10', 
    action: 'Profile Updated', 
    user: 'Robert Wilson (Consultant)', 
    documentType: '-',
    timestamp: '2023-06-11 11:25:33',
    userType: 'consultant'
  },
  
  // Admin activities
  { 
    id: '11', 
    action: 'Settings Updated', 
    user: 'Admin', 
    documentType: '-',
    timestamp: '2023-06-10 11:25:33',
    userType: 'admin'
  },
  { 
    id: '12', 
    action: 'User Account Locked', 
    user: 'Admin', 
    documentType: '-',
    timestamp: '2023-06-10 10:15:20',
    userType: 'admin'
  },
  
  // More vendor activities
  { 
    id: '13', 
    action: 'Comment Added', 
    user: 'ABC Supplies (Vendor)', 
    documentType: 'Purchase Order',
    timestamp: '2023-06-09 16:40:12',
    userType: 'vendor'
  },
  { 
    id: '14', 
    action: 'Document Resubmitted', 
    user: 'XYZ Manufacturing (Vendor)', 
    documentType: 'Quality Certificate',
    timestamp: '2023-06-09 14:22:05',
    userType: 'vendor'
  },
  
  // More consultant activities
  { 
    id: '15', 
    action: 'Feedback Provided', 
    user: 'John Smith (Consultant)', 
    documentType: 'Invoice',
    timestamp: '2023-06-08 11:30:45',
    userType: 'consultant'
  },
  { 
    id: '16', 
    action: 'Document Flagged', 
    user: 'Sarah Johnson (Consultant)', 
    documentType: 'Delivery Note',
    timestamp: '2023-06-08 09:15:30',
    userType: 'consultant'
  },
  
  // System activities
  { 
    id: '17', 
    action: 'System Backup', 
    user: 'System', 
    documentType: '-',
    timestamp: '2023-06-07 02:00:00',
    userType: 'admin'
  },
  { 
    id: '18', 
    action: 'Scheduled Maintenance', 
    user: 'System', 
    documentType: '-',
    timestamp: '2023-06-06 01:00:00',
    userType: 'admin'
  },
  
  // Older activities
  { 
    id: '19', 
    action: 'Bulk Documents Uploaded', 
    user: 'Global Logistics (Vendor)', 
    documentType: 'Multiple',
    timestamp: '2023-06-05 15:45:22',
    userType: 'vendor'
  },
  { 
    id: '20', 
    action: 'Bulk Review Completed', 
    user: 'Michael Brown (Consultant)', 
    documentType: 'Multiple',
    timestamp: '2023-06-05 17:30:10',
    userType: 'consultant'
  }
];

// Activity Summary Component
const ActivitySummary: React.FC = () => {
  const [stats, setStats] = useState({
    vendor: 0,
    consultant: 0,
    admin: 0,
    system: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/activity-logs/stats');
        
        if (response.data && response.data.success && response.data.data) {
          const { userTypeCounts } = response.data.data;
          setStats({
            vendor: userTypeCounts.vendor || 0,
            consultant: userTypeCounts.consultant || 0,
            admin: userTypeCounts.admin || 0,
            system: userTypeCounts.system || 0
          });
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching activity stats:', error);
        setLoading(false);
        
        // Use mock stats in development
        if (process.env.NODE_ENV === 'development') {
          setStats({
            vendor: 8,
            consultant: 7,
            admin: 3,
            system: 2
          });
        }
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 1, borderRadius: 1, bgcolor: 'success.light' }}>
        <Typography variant="h6" color="white">
          {stats.vendor} Vendor Activities
        </Typography>
      </Box>
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 1, borderRadius: 1, bgcolor: 'info.light' }}>
        <Typography variant="h6" color="white">
          {stats.consultant} Consultant Activities
        </Typography>
      </Box>
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 1, borderRadius: 1, bgcolor: 'primary.light' }}>
        <Typography variant="h6" color="white">
          {stats.admin + stats.system} Admin Activities
        </Typography>
      </Box>
    </>
  );
};

const ActivityLogsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    const fetchActivityLogs = async () => {
      try {
        setLoading(true);
        
        // Build query parameters for filtering
        const queryParams = new URLSearchParams();
        if (userTypeFilter !== 'all') {
          queryParams.append('userType', userTypeFilter);
        }
        if (actionFilter !== 'all') {
          queryParams.append('action', actionFilter);
        }
        if (searchTerm) {
          queryParams.append('search', searchTerm);
        }
        if (dateRange.startDate) {
          queryParams.append('startDate', dateRange.startDate);
        }
        if (dateRange.endDate) {
          queryParams.append('endDate', dateRange.endDate);
        }
        
        // Set page and limit
        queryParams.append('page', (page + 1).toString());
        queryParams.append('limit', rowsPerPage.toString());
        
        // Use the new dedicated activity logs API endpoint
        const response = await axios.get(`/api/activity-logs?${queryParams.toString()}`);
        
        if (response.data && response.data.success && response.data.data) {
          // Transform the API response to match our expected format
          const formattedLogs = response.data.data.map((item: any) => ({
            id: item._id,
            action: item.action,
            user: item.userName,
            documentType: item.documentType || '-',
            timestamp: new Date(item.createdAt).toLocaleString(),
            userType: item.userType
          }));
          
          setActivityLogs(formattedLogs);
          console.log('Activity logs fetched successfully:', formattedLogs.length);
        } else {
          // If API returns empty or error, use mock data in development
          console.log('No activity logs found from API, using mock data');
          setActivityLogs(mockActivityLogs);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching activity logs:', error);
        setLoading(false);
        
        // Fallback to mock data in development
        if (process.env.NODE_ENV === 'development') {
          console.log('Using mock activity log data due to API error');
          setActivityLogs(mockActivityLogs);
        }
      }
    };

    fetchActivityLogs();
  }, [page, rowsPerPage, userTypeFilter, actionFilter, searchTerm, dateRange]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleExportLogs = () => {
    // Create CSV content
    const headers = ['Action', 'User', 'User Type', 'Document Type', 'Timestamp'];
    const csvContent = [
      headers.join(','),
      ...activityLogs.map(log => [
        `"${log.action || ''}"`,
        `"${log.user || ''}"`,
        `"${log.userType || ''}"`,
        `"${log.documentType || ''}"`,
        `"${log.timestamp || ''}"`,
      ].join(','))
    ].join('\n');
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `activity-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleUserTypeFilterChange = (event: SelectChangeEvent) => {
    setUserTypeFilter(event.target.value);
    setPage(0);
  };

  const handleActionFilterChange = (event: SelectChangeEvent) => {
    setActionFilter(event.target.value);
    setPage(0);
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(0);
  };

  const filteredLogs = activityLogs.filter(log => {
    // Search term filter
    const matchesSearch = 
      ((log.action?.toLowerCase() || '').includes(searchTerm.toLowerCase())) ||
      ((log.user?.toLowerCase() || '').includes(searchTerm.toLowerCase())) ||
      ((log.documentType?.toLowerCase() || '').includes(searchTerm.toLowerCase()));
    
    // User type filter
    const matchesUserType = userTypeFilter === 'all' || log.userType === userTypeFilter;
    
    // Action filter
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    
    // Date range filter
    let matchesDateRange = true;
    if (dateRange.startDate && log.timestamp) {
      try {
        const logDate = new Date(log.timestamp.split(' ')[0]);
        const startDate = new Date(dateRange.startDate);
        if (logDate < startDate) {
          matchesDateRange = false;
        }
      } catch (error) {
        console.error('Error parsing date:', error);
      }
    }
    if (dateRange.endDate && log.timestamp) {
      try {
        const logDate = new Date(log.timestamp.split(' ')[0]);
        const endDate = new Date(dateRange.endDate);
        if (logDate > endDate) {
          matchesDateRange = false;
        }
      } catch (error) {
        console.error('Error parsing date:', error);
      }
    }
    
    return matchesSearch && matchesUserType && matchesAction && matchesDateRange;
  });

  // Get unique actions for filter
  const uniqueActions = ['all', ...Array.from(new Set(activityLogs.filter(log => log && log.action).map(log => log.action)))];

  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1">
              Activity Logs
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Comprehensive activity tracking for vendors, consultants, and system events
            </Typography>
            {process.env.NODE_ENV === 'development' && (
              <Typography variant="caption" color="text.secondary">
                No logs? Use the "Create Test Data" button to generate sample logs.
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {process.env.NODE_ENV === 'development' && (
              <Button 
                variant="outlined" 
                color="secondary"
                startIcon={<FontAwesomeIcon icon="plus" />}
                onClick={() => {
                  axios.post('/api/activity-logs/test-data')
                    .then(response => {
                      console.log('Test data created:', response.data);
                      window.location.reload();
                    })
                    .catch(error => console.error('Error creating test data:', error));
                }}
              >
                Create Test Data
              </Button>
            )}
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<FontAwesomeIcon icon={faDownload} />}
              onClick={handleExportLogs}
            >
              Export Logs
            </Button>
          </Box>
        </Box>

        {/* Activity Summary */}
        <Paper sx={{ width: '100%', mb: 2, p: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <ActivitySummary />
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Box sx={{ width: { xs: '100%', md: '24%' } }}>
              <TextField
                label="Search Logs"
                variant="outlined"
                size="small"
                fullWidth
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FontAwesomeIcon icon={faSearch} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <Box sx={{ width: { xs: '100%', md: '15%' } }}>
              <FormControl fullWidth size="small">
                <InputLabel id="user-type-filter-label">User Type</InputLabel>
                <Select
                  labelId="user-type-filter-label"
                  value={userTypeFilter}
                  label="User Type"
                  onChange={handleUserTypeFilterChange}
                >
                  <MenuItem value="all">All Users</MenuItem>
                  <MenuItem value="vendor">Vendors</MenuItem>
                  <MenuItem value="consultant">Consultants</MenuItem>
                  <MenuItem value="admin">Admins</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ width: { xs: '100%', md: '24%' } }}>
              <FormControl fullWidth size="small">
                <InputLabel id="action-filter-label">Action</InputLabel>
                <Select
                  labelId="action-filter-label"
                  value={actionFilter}
                  label="Action"
                  onChange={handleActionFilterChange}
                >
                  {uniqueActions.map(action => (
                    <MenuItem key={action} value={action}>
                      {action === 'all' ? 'All Actions' : action}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ width: { xs: '48%', md: '15%' } }}>
              <TextField
                label="Start Date"
                type="date"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateChange}
                InputLabelProps={{ shrink: true }}
                size="small"
                fullWidth
              />
            </Box>
            <Box sx={{ width: { xs: '48%', md: '15%' } }}>
              <TextField
                label="End Date"
                type="date"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateChange}
                InputLabelProps={{ shrink: true }}
                size="small"
                fullWidth
              />
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer sx={{ mt: 3 }}>
                <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>User Type</TableCell>
                      <TableCell>Document Type</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredLogs
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((log) => (
                        <TableRow
                          hover
                          key={log.id}
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell>{log.timestamp || 'N/A'}</TableCell>
                          <TableCell>{log.action || 'N/A'}</TableCell>
                          <TableCell>{log.user || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={log.userType ? (log.userType.charAt(0).toUpperCase() + log.userType.slice(1)) : 'Unknown'} 
                              color={
                                log.userType === 'vendor' ? 'success' : 
                                log.userType === 'consultant' ? 'info' : 'primary'
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{log.documentType || '-'}</TableCell>
                        </TableRow>
                      ))}
                    {filteredLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                              No Activity Logs Found
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              There are no activity logs in the system yet.
                            </Typography>
                            {process.env.NODE_ENV === 'development' && (
                              <Button 
                                variant="outlined" 
                                color="primary"
                                sx={{ mt: 2 }}
                                onClick={() => {
                                  axios.post('/api/activity-logs/test-data')
                                    .then(response => {
                                      console.log('Test data created:', response.data);
                                      window.location.reload();
                                    })
                                    .catch(error => console.error('Error creating test data:', error));
                                }}
                              >
                                Create Test Data
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredLogs.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </Paper>
      </Box>
    </MainLayout>
  );
};

export default ActivityLogsPage;