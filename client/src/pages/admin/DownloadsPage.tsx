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
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import { FontAwesomeIcon } from '../../utils/icons';
import { 
  faSearch, 
  faFilter,
  faEye,
  faDownload,
  faPrint,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import MainLayout from '../../components/layout/MainLayout';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Types
interface ComplianceReportAttachment {
  _id?: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  uploadDate: string;
}

interface ComplianceReport {
  _id: string;
  vendorId?: {
    company?: string;
    name?: string;
  };
  auditorName?: string;
  attachments?: ComplianceReportAttachment[];
  month: string;
  year: number;
  createdAt: string;
}

interface DownloadItem {
  id: string;
  vendorName?: string;
  consultantName?: string;
  documentType?: string;
  fileName?: string;
  submittedDate?: string;
  approvedDate?: string;
  fileSize?: string;
  fileType?: string;
  filePath?: string;
  reportType?: string;
  month?: string;
  year?: number;
  reportId?: string;
  attachmentId?: string;
}

// Mock data for downloads
const mockDownloads = [
  { 
    id: '1', 
    vendorName: 'ABC Supplies', 
    documentType: 'Compliance Certificate',
    submittedDate: '2023-06-15',
    approvedDate: '2023-06-16',
    fileSize: '2.4 MB',
    fileType: 'PDF'
  },
  { 
    id: '2', 
    vendorName: 'XYZ Manufacturing', 
    documentType: 'Compliance Certificate',
    submittedDate: '2023-06-10',
    approvedDate: '2023-06-12',
    fileSize: '1.8 MB',
    fileType: 'PDF'
  },
  { 
    id: '3', 
    vendorName: 'Global Logistics', 
    documentType: 'Compliance Certificate',
    submittedDate: '2023-05-28',
    approvedDate: '2023-05-30',
    fileSize: '3.2 MB',
    fileType: 'PDF'
  },
  { 
    id: '4', 
    vendorName: 'Tech Solutions', 
    documentType: 'Compliance Certificate',
    submittedDate: '2023-05-15',
    approvedDate: '2023-05-17',
    fileSize: '1.5 MB',
    fileType: 'PDF'
  },
  { 
    id: '5', 
    vendorName: 'Industrial Parts', 
    documentType: 'Compliance Certificate',
    submittedDate: '2023-05-05',
    approvedDate: '2023-05-08',
    fileSize: '2.1 MB',
    fileType: 'PDF'
  },
  { 
    id: '6', 
    vendorName: 'ABC Supplies', 
    documentType: 'Compliance Certificate',
    submittedDate: '2023-04-20',
    approvedDate: '2023-04-22',
    fileSize: '1.9 MB',
    fileType: 'PDF'
  },
  { 
    id: '7', 
    vendorName: 'XYZ Manufacturing', 
    documentType: 'Compliance Certificate',
    submittedDate: '2023-04-10',
    approvedDate: '2023-04-12',
    fileSize: '2.7 MB',
    fileType: 'PDF'
  },
  { 
    id: '8', 
    vendorName: 'Global Logistics', 
    documentType: 'Compliance Certificate',
    submittedDate: '2023-03-25',
    approvedDate: '2023-03-28',
    fileSize: '2.3 MB',
    fileType: 'PDF'
  },
];

const DownloadsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('2023');
  const [monthFilter, setMonthFilter] = useState('all');

  useEffect(() => {
    const fetchDownloads = async () => {
      try {
        setLoading(true);
        
        // Fetch both regular documents and compliance report attachments
        const [documentsResponse, complianceReportsResponse] = await Promise.allSettled([
          // Regular documents
          axios.get('/api/documents', { 
            params: {
              status: 'approved',
              year: yearFilter !== 'all' ? yearFilter : undefined,
              month: monthFilter !== 'all' ? monthFilter : undefined
            }
          }),
          // Compliance reports with attachments - get all without pagination
          axios.get('/api/compliance-reports', {
            params: {
              year: yearFilter !== 'all' ? yearFilter : undefined,
              month: monthFilter !== 'all' ? monthFilter : undefined,
              limit: 1000 // Get a large number to include all reports
            }
          })
        ]);

        let combinedDownloads: DownloadItem[] = [];

        // Process regular documents
        if (documentsResponse.status === 'fulfilled' && documentsResponse.value.data.data) {
          combinedDownloads = [...documentsResponse.value.data.data];
        }

        // Process compliance report attachments
        if (complianceReportsResponse.status === 'fulfilled' && complianceReportsResponse.value.data.data) {
          const complianceReports: ComplianceReport[] = complianceReportsResponse.value.data.data;
          console.log('Compliance Reports:', complianceReports);
          
          complianceReports.forEach((report: ComplianceReport) => {
            console.log('Processing report:', report._id, 'Attachments:', report.attachments);
            if (report.attachments && report.attachments.length > 0) {
              report.attachments.forEach((attachment: ComplianceReportAttachment) => {
                console.log('Processing attachment:', attachment);
                combinedDownloads.push({
                  id: `compliance-${report._id}-${attachment._id || Date.now()}`,
                  vendorName: report.vendorId?.company || 'Unknown Vendor',
                  consultantName: report.auditorName || 'Unknown Consultant',
                  documentType: attachment.fileType || 'Compliance Attachment', // This should be "Completion Report" or "Document Verification Report"
                  fileName: attachment.fileName,
                  submittedDate: attachment.uploadDate || report.createdAt,
                  approvedDate: attachment.uploadDate || report.createdAt,
                  fileSize: formatFileSize(attachment.fileSize || 0),
                  fileType: getFileTypeFromPath(attachment.fileName || ''),
                  filePath: attachment.filePath,
                  reportType: 'Compliance Report',
                  month: report.month,
                  year: report.year,
                  reportId: report._id,
                  attachmentId: attachment._id
                });
              });
            }
          });
        }

        setDownloads(combinedDownloads);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching downloads:', error);
        setLoading(false);
        // If API fails, fall back to mock data for development
        if (process.env.NODE_ENV === 'development') {
          setDownloads(mockDownloads);
        }
      }
    };

    fetchDownloads();
  }, [yearFilter, monthFilter]);

  // Helper function to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper function to get file type from file path
  const getFileTypeFromPath = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toUpperCase();
    return extension || 'Unknown';
  };

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

  const handleYearFilterChange = (event: SelectChangeEvent) => {
    setYearFilter(event.target.value);
    setPage(0);
  };

  const handleMonthFilterChange = (event: SelectChangeEvent) => {
    setMonthFilter(event.target.value);
    setPage(0);
  };

  const filteredDownloads = downloads.filter(doc => {
    // Search term filter - include consultant name in search
    const matchesSearch = 
      ((doc.vendorName?.toLowerCase() || '').includes(searchTerm.toLowerCase())) ||
      ((doc.consultantName?.toLowerCase() || '').includes(searchTerm.toLowerCase())) ||
      ((doc.documentType?.toLowerCase() || '').includes(searchTerm.toLowerCase()));
    
    // Year filter
    let matchesYear = yearFilter === 'all';
    if (!matchesYear && doc.approvedDate) {
      try {
        const docYear = new Date(doc.approvedDate).getFullYear().toString();
        matchesYear = docYear === yearFilter;
      } catch (error) {
        console.error('Error parsing year:', error);
      }
    }
    
    // Month filter
    let matchesMonth = monthFilter === 'all';
    if (!matchesMonth && doc.approvedDate) {
      try {
        const docMonth = (new Date(doc.approvedDate).getMonth() + 1).toString();
        matchesMonth = docMonth === monthFilter;
      } catch (error) {
        console.error('Error parsing month:', error);
      }
    }
    
    return matchesSearch && matchesYear && matchesMonth;
  });

  const handleDownload = async (docId: string) => {
    try {
      const doc = downloads.find(d => d.id === docId);
      if (!doc) {
        console.error('Document not found');
        alert('Document not found');
        return;
      }

      // Check if this is a compliance report attachment
      if (docId.startsWith('compliance-') && doc.reportId && doc.attachmentId) {
        try {
          // Download from compliance report attachment endpoint
          const response = await axios.get(`/api/compliance-reports/${doc.reportId}/attachments/${doc.attachmentId}/download`, {
            responseType: 'blob'
          });
          
          // Create download link
          const blob = new Blob([response.data]);
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = doc.fileName || 'download';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Error downloading compliance report attachment:', error);
          alert('Failed to download file. Please try again.');
        }
      } else {
        // Regular document download
        console.log(`Downloading regular document ${docId}`);
        alert('Regular document download not implemented yet');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    }
  };

  const handleView = async (docId: string) => {
    try {
      const doc = downloads.find(d => d.id === docId);
      if (!doc) {
        console.error('Document not found');
        alert('Document not found');
        return;
      }

      // Check if this is a compliance report attachment
      if (docId.startsWith('compliance-') && doc.reportId && doc.attachmentId) {
        try {
          // Open in new tab for viewing
          const url = `/api/compliance-reports/${doc.reportId}/attachments/${doc.attachmentId}/view`;
          window.open(url, '_blank');
        } catch (error) {
          console.error('Error viewing compliance report attachment:', error);
          alert('Failed to view file. Please try again.');
        }
      } else {
        // Regular document view
        navigate(`/admin/documents/${docId}`);
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      alert('Failed to view document');
    }
  };

  const handlePrint = (docId: string) => {
    // In a real app, this would open a print dialog
    console.log(`Printing document ${docId}`);
  };

  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Downloads
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<FontAwesomeIcon icon={faDownload} />}
          >
            Download All
          </Button>
        </Box>

        <Paper sx={{ width: '100%', mb: 2, p: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ width: { xs: '100%', md: '32%' } }}>
              <TextField
                label="Search by Vendor, Consultant, or Document Type"
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
            <Box sx={{ width: { xs: '48%', md: '22%' } }}>
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
            <Box sx={{ width: { xs: '48%', md: '22%' } }}>
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
            <Box sx={{ width: { xs: '100%', md: '18%' } }}>
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
                      <TableCell>Consultant Name</TableCell>
                      <TableCell>Document Type</TableCell>
                      <TableCell>Submitted Date</TableCell>
                      <TableCell>Approved Date</TableCell>
                      <TableCell>File Size</TableCell>
                      <TableCell>File Type</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredDownloads
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((doc) => (
                        <TableRow
                          hover
                          key={doc.id}
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell>{doc.vendorName || 'N/A'}</TableCell>
                          <TableCell>
                            {doc.consultantName || 'N/A'}
                            {doc.reportType && (
                              <Chip 
                                label={doc.reportType} 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                                sx={{ ml: 1, fontSize: '0.7rem' }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {doc.documentType || 'N/A'}
                            {doc.month && doc.year && (
                              <Typography variant="caption" display="block" color="text.secondary">
                                {doc.month} {doc.year}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {doc.submittedDate ? new Date(doc.submittedDate).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {doc.approvedDate ? new Date(doc.approvedDate).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>{doc.fileSize || 'N/A'}</TableCell>
                          <TableCell>{doc.fileType || 'N/A'}</TableCell>
                          <TableCell align="right">
                            <IconButton 
                              size="small" 
                              onClick={() => handleView(doc.id)}
                              title="View Document"
                            >
                              <FontAwesomeIcon icon={faEye} />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => handleDownload(doc.id)}
                              title="Download Document"
                            >
                              <FontAwesomeIcon icon={faDownload} />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => handlePrint(doc.id)}
                              title="Print Document"
                            >
                              <FontAwesomeIcon icon={faPrint} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    {filteredDownloads.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
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
                count={filteredDownloads.length}
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

export default DownloadsPage;