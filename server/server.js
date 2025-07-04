const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const socketService = require('./utils/socketService');
const errorHandler = require('./middlewares/error.middleware');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const authRoutes = require('./routes/auth.routes');
const roleAuthRoutes = require('./routes/roleAuth.routes');
const userRoutes = require('./routes/user.routes');
const documentRoutes = require('./routes/document.routes');
const reportRoutes = require('./routes/report.routes');
const notificationRoutes = require('./routes/notification.routes');
const loginApprovalRoutes = require('./routes/loginApproval.routes');
const workflowRoutes = require('./routes/workflow.routes');
const documentSubmissionRoutes = require('./routes/documentSubmission.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const activityLogRoutes = require('./routes/activityLog.routes');
const complianceReportRoutes = require('./routes/complianceReport.routes');


// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', roleAuthRoutes); // Role-based authentication routes
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/login-approvals', loginApprovalRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/document-submissions', documentSubmissionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/compliance-reports', complianceReportRoutes);


// Home route
app.get('/', (req, res) => {
  res.send('Vendor Management System API is running');
});

// Error handling middleware
app.use(errorHandler);

// Connect to MongoDB
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/vendor-management';

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
socketService.initialize(server);

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`WebSocket server initialized`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
  });
