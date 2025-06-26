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
  Tabs,
  Tab
} from '@mui/material';
import { FontAwesomeIcon } from '../../utils/icons';
import { 
  faSearch, 
  faFilter,
  faDownload,
  faChartBar
} from '@fortawesome/free-solid-svg-icons';
import MainLayout from '../../components/layout/MainLayout';
import axios from 'axios';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Mock data for aging report
const mockAgingReport = [
  { 
    id: '1', 
    vendorName: 'ABC Supplies', 
    totalDocuments: 15,
    pendingDays: 5,
    status: 'pending_consultant',
    consultant: 'John Smith'
  },
  { 
    id: '2', 
    vendorName: 'XYZ Manufacturing', 
    totalDocuments: 12,
    pendingDays: 8,
    status: 'pending_vendor',
    consultant: 'Sarah Johnson'
  },
  { 
    id: '3', 
    vendorName: 'Global Logistics', 
    totalDocuments: 10,
    pendingDays: 3,
    status: 'pending_consultant',
    consultant: 'Michael Brown'
  },
  { 
    id: '4', 
    vendorName: 'Tech Solutions', 
    totalDocuments: 8,
    pendingDays: 10,
    status: 'pending_vendor',
    consultant: 'Emily Davis'
  },
  { 
    id: '5', 
    vendorName: 'Industrial Parts', 
    totalDocuments: 6,
    pendingDays: 15,
    status: 'pending_consultant',
    consultant: 'Robert Wilson'
  },
];

// Mock data for charts
const documentStatusData = [
  { name: 'Pending from Consultant', value: 25 },
  { name: 'Pending from Vendor', value: 18 },
  { name: 'Approved', value: 45 },
  { name: 'Rejected', value: 12 }
];

const monthlySubmissionsData = [
  { name: 'Jan', count: 12 },
  { name: 'Feb', count: 15 },
  { name: 'Mar', count: 18 },
  { name: 'Apr', count: 22 },
  { name: 'May', count: 25 },
  { name: 'Jun', count: 30 }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const ReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [agingReport, setAgingReport] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tabValue, setTabValue] = useState(0);
  const [documentStatusData, setDocumentStatusData] = useState([] as any[]);
  const [monthlySubmissionsData, setMonthlySubmissionsData] = useState([] as any[]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        
        // Fetch aging report data
        const agingResponse = await axios.get('/api/reports/aging-report');
        setAgingReport(agingResponse.data.data || []);
        
        // Fetch document status distribution data
        const statusResponse = await axios.get('/api/documents/reports/status-distribution');
        if (statusResponse.data.data) {
          setDocumentStatusData(statusResponse.data.data);
        } else {
          // Fallback to mock data if API doesn't return expected format
          setDocumentStatusData(documentStatusData);
        }
        
        // Fetch monthly submissions data
        const monthlyResponse = await axios.get('/api/documents/reports/monthly-submissions');
        if (monthlyResponse.data.data) {
          setMonthlySubmissionsData(monthlyResponse.data.data);
        } else {
          // Fallback to mock data if API doesn't return expected format
          setMonthlySubmissionsData(monthlySubmissionsData);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching reports:', error);
        setLoading(false);
        
        // If API fails, fall back to mock data for development
        if (process.env.NODE_ENV === 'development') {
          setAgingReport(mockAgingReport);
          setDocumentStatusData([
            { name: 'Pending from Consultant', value: 25 },
            { name: 'Pending from Vendor', value: 18 },
            { name: 'Approved', value: 45 },
            { name: 'Rejected', value: 12 }
          ]);
          setMonthlySubmissionsData([
            { name: 'Jan', count: 12 },
            { name: 'Feb', count: 15 },
            { name: 'Mar', count: 18 },
            { name: 'Apr', count: 22 },
            { name: 'May', count: 25 },
            { name: 'Jun', count: 30 }
          ]);
        }
      }
    };

    fetchReports();
  }, []);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const filteredReport = agingReport.filter(report => {
    // Search term filter
    const matchesSearch = 
      ((report.vendorName?.toLowerCase() || '').includes(searchTerm.toLowerCase())) ||
      ((report.consultant?.toLowerCase() || '').includes(searchTerm.toLowerCase()));
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusLabel = (status: string) => {
    if (!status) return 'Unknown';
    
    switch (status) {
      case 'pending_consultant':
        return 'Pending from Consultant';
      case 'pending_vendor':
        return 'Pending from Vendor';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        try {
          return status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1);
        } catch (error) {
          return 'Unknown';
        }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_consultant':
        return 'warning';
      case 'pending_vendor':
        return 'info';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            MIS Reports
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<FontAwesomeIcon icon={faDownload} />}
          >
            Export Report
          </Button>
        </Box>

        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="report tabs">
              <Tab label="Aging Report" />
              <Tab label="Document Status" />
              <Tab label="Monthly Submissions" />
            </Tabs>
          </Box>
          
          <TabPanel value={tabValue} index={0}>
            <Paper sx={{ width: '100%', mb: 2, p: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ width: { xs: '100%', md: '48%' } }}>
                  <TextField
                    label="Search Vendors or Consultants"
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
                <Box sx={{ width: { xs: '100%', md: '32%' } }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="status-filter-label">Status</InputLabel>
                    <Select
                      labelId="status-filter-label"
                      value={statusFilter}
                      label="Status"
                      onChange={handleStatusFilterChange}
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="pending_consultant">Pending from Consultant</MenuItem>
                      <MenuItem value="pending_vendor">Pending from Vendor</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ width: { xs: '100%', md: '15%' } }}>
                  <Button 
                    variant="outlined" 
                    fullWidth
                    startIcon={<FontAwesomeIcon icon={faFilter} />}
                  >
                    Apply Filters
                  </Button>
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
                          <TableCell>Vendor Name</TableCell>
                          <TableCell>Total Documents</TableCell>
                          <TableCell>Pending Days</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Consultant</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredReport
                          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                          .map((report) => (
                            <TableRow
                              hover
                              key={report.id}
                              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                              <TableCell>{report.vendorName || 'N/A'}</TableCell>
                              <TableCell>{report.totalDocuments || 0}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={`${report.pendingDays || 0} days`} 
                                  color={report.pendingDays > 7 ? 'error' : 'default'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={getStatusLabel(report.status)} 
                                  color={getStatusColor(report.status || 'unknown') as any}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{report.consultant || 'N/A'}</TableCell>
                            </TableRow>
                          ))}
                        {filteredReport.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} align="center">
                              No reports found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={filteredReport.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                  />
                </>
              )}
            </Paper>
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <Paper sx={{ width: '100%', p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Document Status Distribution
              </Typography>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    {documentStatusData.length > 0 ? (
                      <Pie
                        data={documentStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {documentStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    ) : (
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                        No data available
                      </text>
                    )}
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <Paper sx={{ width: '100%', p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Monthly Document Submissions (2023)
              </Typography>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlySubmissionsData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {monthlySubmissionsData.length > 0 ? (
                      <Bar dataKey="count" fill="#8884d8" name="Documents Submitted" />
                    ) : (
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                        No data available
                      </text>
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </TabPanel>
        </Box>
      </Box>
    </MainLayout>
  );
};

export default ReportsPage;