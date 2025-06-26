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
  IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { FontAwesomeIcon } from '../../utils/icons';
import { 
  faSearch, 
  faFilter,
  faEye,
  faDownload,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import MainLayout from '../../components/layout/MainLayout';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Mock data for document status
const mockDocumentStatus = [
  { 
    id: '1', 
    vendorName: 'ABC Supplies', 
    documentType: 'Invoice',
    submittedDate: '2023-06-15',
    status: 'pending_consultant',
    consultant: 'John Smith',
    lastUpdated: '2023-06-15 14:30:22'
  },
  { 
    id: '2', 
    vendorName: 'XYZ Manufacturing', 
    documentType: 'Purchase Order',
    submittedDate: '2023-06-14',
    status: 'pending_vendor',
    consultant: 'Sarah Johnson',
    lastUpdated: '2023-06-14 16:45:10'
  },
  { 
    id: '3', 
    vendorName: 'Global Logistics', 
    documentType: 'Delivery Note',
    submittedDate: '2023-06-13',
    status: 'approved',
    consultant: 'Michael Brown',
    lastUpdated: '2023-06-13 11:20:05'
  },
  { 
    id: '4', 
    vendorName: 'Tech Solutions', 
    documentType: 'Quality Certificate',
    submittedDate: '2023-06-12',
    status: 'rejected',
    consultant: 'Emily Davis',
    lastUpdated: '2023-06-12 09:15:30'
  },
  { 
    id: '5', 
    vendorName: 'Industrial Parts', 
    documentType: 'Compliance Certificate',
    submittedDate: '2023-06-10',
    status: 'pending_consultant',
    consultant: 'Robert Wilson',
    lastUpdated: '2023-06-10 15:40:18'
  },
  { 
    id: '6', 
    vendorName: 'ABC Supplies', 
    documentType: 'Tax Document',
    submittedDate: '2023-06-08',
    status: 'pending_vendor',
    consultant: 'John Smith',
    lastUpdated: '2023-06-09 10:25:45'
  },
  { 
    id: '7', 
    vendorName: 'XYZ Manufacturing', 
    documentType: 'Insurance Certificate',
    submittedDate: '2023-06-05',
    status: 'approved',
    consultant: 'Sarah Johnson',
    lastUpdated: '2023-06-07 14:10:22'
  },
  { 
    id: '8', 
    vendorName: 'Global Logistics', 
    documentType: 'Contract',
    submittedDate: '2023-06-03',
    status: 'approved',
    consultant: 'Michael Brown',
    lastUpdated: '2023-06-05 09:30:15'
  },
];

// No need for any styled components, we'll use the regular Box components

const StatusPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('2023');
  const [monthFilter, setMonthFilter] = useState('all');

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        // Use the API service to fetch real document status data
        // We'll use the documents endpoint with status filtering
        const params = {
          year: yearFilter !== 'all' ? yearFilter : undefined,
          month: monthFilter !== 'all' ? monthFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined
        };
        const response = await axios.get('/api/documents', { params });
        setDocuments(response.data.data || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching document status:', error);
        setLoading(false);
        // If API fails, fall back to mock data for development
        if (process.env.NODE_ENV === 'development') {
          setDocuments(mockDocumentStatus);
        }
      }
    };

    fetchDocuments();
  }, [yearFilter, monthFilter, statusFilter]);

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

  const handleYearFilterChange = (event: SelectChangeEvent) => {
    setYearFilter(event.target.value);
    setPage(0);
  };

  const handleMonthFilterChange = (event: SelectChangeEvent) => {
    setMonthFilter(event.target.value);
    setPage(0);
  };

  const filteredDocuments = documents.filter(doc => {
    // Search term filter
    const matchesSearch = 
      ((doc.vendorName?.toLowerCase() || '').includes(searchTerm.toLowerCase())) ||
      ((doc.documentType?.toLowerCase() || '').includes(searchTerm.toLowerCase())) ||
      ((doc.consultant?.toLowerCase() || '').includes(searchTerm.toLowerCase()));
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    
    // Year filter
    let matchesYear = yearFilter === 'all';
    if (!matchesYear && doc.submittedDate) {
      try {
        const docYear = new Date(doc.submittedDate).getFullYear().toString();
        matchesYear = docYear === yearFilter;
      } catch (error) {
        console.error('Error parsing year:', error);
      }
    }
    
    // Month filter
    let matchesMonth = monthFilter === 'all';
    if (!matchesMonth && doc.submittedDate) {
      try {
        const docMonth = (new Date(doc.submittedDate).getMonth() + 1).toString();
        matchesMonth = docMonth === monthFilter;
      } catch (error) {
        console.error('Error parsing month:', error);
      }
    }
    
    return matchesSearch && matchesStatus && matchesYear && matchesMonth;
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

  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
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
            Document Status
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<FontAwesomeIcon icon={faDownload} />}
          >
            Export Report
          </Button>
        </Box>

        <Paper sx={{ width: '100%', mb: 2, p: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Box sx={{ width: { xs: '100%', md: '24%' } }}>
              <TextField
                label="Search Documents"
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
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ width: { xs: '48%', md: '15%' } }}>
              <FormControl fullWidth size="small">
                <InputLabel id="year-filter-label">Year</InputLabel>
                <Select
                  labelId="year-filter-label"
                  value={yearFilter}
                  label="Year"
                  onChange={handleYearFilterChange}
                >
                  <MenuItem value="all">All Years</MenuItem>
                  <MenuItem value="2023">2023</MenuItem>
                  <MenuItem value="2022">2022</MenuItem>
                  <MenuItem value="2021">2021</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ width: { xs: '48%', md: '15%' } }}>
              <FormControl fullWidth size="small">
                <InputLabel id="month-filter-label">Month</InputLabel>
                <Select
                  labelId="month-filter-label"
                  value={monthFilter}
                  label="Month"
                  onChange={handleMonthFilterChange}
                >
                  <MenuItem value="all">All Months</MenuItem>
                  <MenuItem value="1">January</MenuItem>
                  <MenuItem value="2">February</MenuItem>
                  <MenuItem value="3">March</MenuItem>
                  <MenuItem value="4">April</MenuItem>
                  <MenuItem value="5">May</MenuItem>
                  <MenuItem value="6">June</MenuItem>
                  <MenuItem value="7">July</MenuItem>
                  <MenuItem value="8">August</MenuItem>
                  <MenuItem value="9">September</MenuItem>
                  <MenuItem value="10">October</MenuItem>
                  <MenuItem value="11">November</MenuItem>
                  <MenuItem value="12">December</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ width: { xs: '100%', md: '24%' } }}>
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
                      <TableCell>Document Type</TableCell>
                      <TableCell>Submitted Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Consultant</TableCell>
                      <TableCell>Last Updated</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredDocuments
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((doc) => (
                        <TableRow
                          hover
                          key={doc.id}
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell>{doc.vendorName || 'N/A'}</TableCell>
                          <TableCell>{doc.documentType || 'N/A'}</TableCell>
                          <TableCell>{doc.submittedDate || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={getStatusLabel(doc.status)} 
                              color={getStatusColor(doc.status || 'unknown')}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{doc.consultant || 'N/A'}</TableCell>
                          <TableCell>{doc.lastUpdated || 'N/A'}</TableCell>
                          <TableCell align="right">
                            <IconButton 
                              size="small" 
                              onClick={() => navigate(`/admin/documents/${doc.id}`)}
                            >
                              <FontAwesomeIcon icon={faEye} />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => navigate(`/admin/documents/${doc.id}/download`)}
                            >
                              <FontAwesomeIcon icon={faDownload} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    {filteredDocuments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          No documents found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredDocuments.length}
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

export default StatusPage;