import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  TextField,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Switch,
  FormControlLabel,
  CircularProgress
} from '@mui/material';
import axios from 'axios';
import { FontAwesomeIcon } from '../../utils/icons';
import { 
  faSave, 
  faKey,
  faUserCog,
  faEnvelope,
  faLock,
  faEdit
} from '@fortawesome/free-solid-svg-icons';
import MainLayout from '../../components/layout/MainLayout';

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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
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

// Mock data for users
const mockVendors = [
  { id: '1', name: 'ABC Supplies', email: 'contact@abcsupplies.com', lastLogin: '2023-06-15 14:30:22' },
  { id: '2', name: 'XYZ Manufacturing', email: 'info@xyzmanufacturing.com', lastLogin: '2023-06-14 10:15:45' },
  { id: '3', name: 'Global Logistics', email: 'support@globallogistics.com', lastLogin: '2023-06-12 09:20:18' },
  { id: '4', name: 'Tech Solutions', email: 'help@techsolutions.com', lastLogin: '2023-06-10 16:40:33' },
  { id: '5', name: 'Industrial Parts', email: 'sales@industrialparts.com', lastLogin: '2023-06-08 11:25:50' },
];

const mockConsultants = [
  { id: '1', name: 'John Smith', email: 'john.smith@example.com', lastLogin: '2023-06-15 15:45:10' },
  { id: '2', name: 'Sarah Johnson', email: 'sarah.johnson@example.com', lastLogin: '2023-06-14 12:30:22' },
  { id: '3', name: 'Michael Brown', email: 'michael.brown@example.com', lastLogin: '2023-06-13 09:15:40' },
  { id: '4', name: 'Emily Davis', email: 'emily.davis@example.com', lastLogin: '2023-06-11 14:20:55' },
  { id: '5', name: 'Robert Wilson', email: 'robert.wilson@example.com', lastLogin: '2023-06-09 10:35:18' },
];

const SettingsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [userType, setUserType] = useState('vendor');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [vendors, setVendors] = useState<any[]>([]);
  const [consultants, setConsultants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // System settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [documentExpiryDays, setDocumentExpiryDays] = useState('30');
  const [autoArchiveDays, setAutoArchiveDays] = useState('90');
  
  // Admin settings
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleUserTypeChange = (event: SelectChangeEvent) => {
    setUserType(event.target.value);
  };
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        if (userType === 'vendor') {
          const response = await axios.get('/api/users/vendors');
          setVendors(response.data.data || []);
        } else {
          const response = await axios.get('/api/users/consultants');
          setConsultants(response.data.data || []);
        }
        setLoading(false);
      } catch (error) {
        console.error(`Error fetching ${userType}s:`, error);
        setLoading(false);
        // If API fails, fall back to mock data for development
        if (process.env.NODE_ENV === 'development') {
          if (userType === 'vendor') {
            setVendors(mockVendors);
          } else {
            setConsultants(mockConsultants);
          }
        }
      }
    };

    fetchUsers();
  }, [userType]);

  const handleResetPassword = (user: any) => {
    setSelectedUser(user);
    setResetPasswordDialogOpen(true);
  };

  const handleResetPasswordConfirm = () => {
    // In a real app, this would call an API to reset the password
    console.log(`Resetting password for ${selectedUser.name} (${selectedUser.email})`);
    setResetPasswordDialogOpen(false);
    setSelectedUser(null);
  };

  const handleResetPasswordCancel = () => {
    setResetPasswordDialogOpen(false);
    setSelectedUser(null);
  };

  const handleSaveSystemSettings = () => {
    // In a real app, this would save the settings to the server
    console.log('Saving system settings');
  };

  const handleSaveAdminPassword = () => {
    // In a real app, this would update the admin password
    console.log('Updating admin password');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>

        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="settings tabs">
              <Tab label="User Management" />
              <Tab label="System Settings" />
              <Tab label="Admin Account" />
            </Tabs>
          </Box>
          
          {/* User Management Tab */}
          <TabPanel value={tabValue} index={0}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ mb: 3 }}>
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel id="user-type-label">User Type</InputLabel>
                  <Select
                    labelId="user-type-label"
                    value={userType}
                    label="User Type"
                    onChange={handleUserTypeChange}
                  >
                    <MenuItem value="vendor">Vendors</MenuItem>
                    <MenuItem value="consultant">Consultants</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <List>
                  {(userType === 'vendor' ? vendors : consultants).map((user) => (
                    <React.Fragment key={user.id}>
                      <ListItem>
                        <ListItemText
                          primary={user.name}
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.primary">
                                {user.email}
                              </Typography>
                              {` — Last login: ${user.lastLogin || 'Never'}`}
                            </>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton 
                            edge="end" 
                            aria-label="reset password"
                            onClick={() => handleResetPassword(user)}
                          >
                            <FontAwesomeIcon icon={faKey} />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                  {(userType === 'vendor' ? vendors : consultants).length === 0 && (
                    <ListItem>
                      <ListItemText
                        primary={`No ${userType}s found`}
                        secondary="Try refreshing the page or check your connection"
                      />
                    </ListItem>
                  )}
                </List>
              )}
            </Paper>
          </TabPanel>
          
          {/* System Settings Tab */}
          <TabPanel value={tabValue} index={1}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                System Configuration
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={emailNotifications} 
                        onChange={(e) => setEmailNotifications(e.target.checked)} 
                      />
                    }
                    label="Enable Email Notifications"
                  />
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
                    <TextField
                      label="Document Expiry Warning (Days)"
                      fullWidth
                      value={documentExpiryDays}
                      onChange={(e) => setDocumentExpiryDays(e.target.value)}
                      type="number"
                      InputProps={{ inputProps: { min: 1, max: 90 } }}
                      helperText="Number of days before expiry to send notifications"
                    />
                  </Box>
                  <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
                    <TextField
                      label="Auto-Archive Documents (Days)"
                      fullWidth
                      value={autoArchiveDays}
                      onChange={(e) => setAutoArchiveDays(e.target.value)}
                      type="number"
                      InputProps={{ inputProps: { min: 30, max: 365 } }}
                      helperText="Number of days after which documents are archived"
                    />
                  </Box>
                </Box>
                <Box>
                  <Divider sx={{ my: 2 }} />
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<FontAwesomeIcon icon={faSave} />}
                    onClick={handleSaveSystemSettings}
                  >
                    Save Settings
                  </Button>
                </Box>
              </Box>
            </Paper>
          </TabPanel>
          
          {/* Admin Account Tab */}
          <TabPanel value={tabValue} index={2}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Change Admin Password
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <TextField
                    label="Current Password"
                    fullWidth
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 1, color: 'text.secondary' }}>
                          <FontAwesomeIcon icon={faLock} />
                        </Box>
                      ),
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
                    <TextField
                      label="New Password"
                      fullWidth
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <Box sx={{ mr: 1, color: 'text.secondary' }}>
                            <FontAwesomeIcon icon={faLock} />
                          </Box>
                        ),
                      }}
                    />
                  </Box>
                  <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
                    <TextField
                      label="Confirm New Password"
                      fullWidth
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      error={newPassword !== confirmPassword && confirmPassword !== ''}
                      helperText={
                        newPassword !== confirmPassword && confirmPassword !== ''
                          ? 'Passwords do not match'
                          : ''
                      }
                      InputProps={{
                        startAdornment: (
                          <Box sx={{ mr: 1, color: 'text.secondary' }}>
                            <FontAwesomeIcon icon={faLock} />
                          </Box>
                        ),
                      }}
                    />
                  </Box>
                </Box>
                <Box>
                  <Divider sx={{ my: 2 }} />
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<FontAwesomeIcon icon={faSave} />}
                    onClick={handleSaveAdminPassword}
                    disabled={
                      !currentPassword || 
                      !newPassword || 
                      !confirmPassword || 
                      newPassword !== confirmPassword
                    }
                  >
                    Update Password
                  </Button>
                </Box>
              </Box>
            </Paper>
          </TabPanel>
        </Box>
      </Box>

      {/* Reset Password Dialog */}
      <Dialog
        open={resetPasswordDialogOpen}
        onClose={handleResetPasswordCancel}
        aria-labelledby="reset-password-dialog-title"
      >
        <DialogTitle id="reset-password-dialog-title">
          Reset User Password
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to reset the password for {selectedUser?.name}? 
            A new temporary password will be generated and sent to {selectedUser?.email}.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResetPasswordCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleResetPasswordConfirm} color="primary" variant="contained">
            Reset Password
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
};

export default SettingsPage;