const User = require('../models/user.model');

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const DocModel = require('../models/document.model');

// Get all users (with filtering)
exports.getUsers = async (req, res) => {
  try {
    let query = {};

    // Filter by role if provided
    if (req.query.role) {
      query.role = req.query.role;
    }

    // Search by name or email
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { company: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await User.countDocuments(query);

    // Get users with pagination
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: users.length,
      pagination,
      data: users,
      total
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch users',
      error: error.message
    });
  }
};

// Get single user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check permissions - users can only access their own data
    // (except admins, consultants with assigned vendors, and vendors accessing their consultants)
    if (req.user.role !== 'admin') {
      if (req.user._id.toString() !== user._id.toString()) {
        // Consultants can access their assigned vendors
        if (req.user.role === 'consultant' && user.role === 'vendor') {
          const vendor = await User.findById(user._id);
          if (!vendor || vendor.assignedConsultant?.toString() !== req.user._id.toString()) {
            return res.status(403).json({
              success: false,
              message: 'Not authorized to access this user data'
            });
          }
        } 
        // Vendors can access their assigned consultant
        else if (req.user.role === 'vendor' && user.role === 'consultant') {
          const vendor = await User.findById(req.user._id);
          if (!vendor || vendor.assignedConsultant?.toString() !== user._id.toString()) {
            return res.status(403).json({
              success: false,
              message: 'Not authorized to access this user data'
            });
          }
        }
        else {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to access this user data'
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch user',
      error: error.message
    });
  }
};

// Create user (admin only)
exports.createUser = async (req, res) => {
  try {
    const { name, email, role, company, phone, address, password: providedPassword, requiresLoginApproval } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Generate a random password
    const password = providedPassword || crypto.randomBytes(8).toString('hex');

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      company,
      phone,
      address
    });

    // Send welcome email with generated password
    // Password will need to be communicated through another channel

    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not create user',
      error: error.message
    });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, company, phone, address, isActive } = req.body;

    // If updating email, check if it's already taken
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }
    }

    // Find the user
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin') {
      if (req.user._id.toString() !== user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this user'
        });
      }
      
      // Non-admin users can't change their own role
      if (role && role !== user.role) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to change user role'
        });
      }
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role && req.user.role === 'admin') user.role = role;
    if (company) user.company = company;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (isActive !== undefined && req.user.role === 'admin') user.isActive = isActive;

    await user.save();

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not update user',
      error: error.message
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not delete user',
      error: error.message
    });
  }
};

// Get all vendors
exports.getVendors = async (req, res) => {
  try {
    let query = { role: 'vendor' };
    
    // If the user is a consultant, only show vendors assigned to them
    if (req.user.role === 'consultant') {
      query.assignedConsultant = req.user._id;
    }
    
    // Check if assignedToMe parameter is provided
    if (req.query.assignedToMe === 'true' && req.user.role === 'consultant') {
      query.assignedConsultant = req.user._id;
    }
    
    // Check if consultantId parameter is provided
    if (req.query.consultantId && (req.user.role === 'admin' || req.user._id.toString() === req.query.consultantId)) {
      query.assignedConsultant = req.query.consultantId;
    }
    
    console.log('Vendor query:', query);
    
    const vendors = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    // If includeAnalytics is true, add analytics data for each vendor
    if (req.query.includeAnalytics === 'true') {
      // Get document counts for each vendor
      const vendorsWithAnalytics = await Promise.all(vendors.map(async (vendor) => {
        const vendorObj = vendor.toObject();
        
        try {
          // Get document counts from the Document model
          const DocModel = require('../models/document.model');
          
          const totalDocuments = await DocModel.countDocuments({ vendor: vendor._id });
          const approvedDocuments = await DocModel.countDocuments({ 
            vendor: vendor._id,
            status: 'approved'
          });
          const pendingDocuments = await DocModel.countDocuments({ 
            vendor: vendor._id,
            status: { $in: ['pending', 'under_review'] }
          });
          const rejectedDocuments = await DocModel.countDocuments({ 
            vendor: vendor._id,
            status: 'rejected'
          });
          
          // Calculate compliance rate
          const complianceRate = totalDocuments > 0 
            ? Math.round((approvedDocuments / totalDocuments) * 100) 
            : 0;
          
          // Get last activity date
          const latestDocument = await DocModel.findOne({ vendor: vendor._id })
            .sort({ updatedAt: -1 })
            .select('updatedAt');
          
          vendorObj.analytics = {
            totalDocuments,
            approvedDocuments,
            pendingDocuments,
            rejectedDocuments,
            complianceRate,
            lastActivity: latestDocument ? latestDocument.updatedAt : vendor.createdAt
          };
        } catch (err) {
          console.error(`Error getting analytics for vendor ${vendor._id}:`, err);
          vendorObj.analytics = {
            totalDocuments: 0,
            approvedDocuments: 0,
            pendingDocuments: 0,
            rejectedDocuments: 0,
            complianceRate: 0,
            lastActivity: vendor.createdAt
          };
        }
        
        return vendorObj;
      }));
      
      return res.status(200).json({
        success: true,
        count: vendorsWithAnalytics.length,
        data: vendorsWithAnalytics
      });
    }

    res.status(200).json({
      success: true,
      count: vendors.length,
      data: vendors
    });
  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch vendors',
      error: error.message
    });
  }
};

// Get all consultants
exports.getConsultants = async (req, res) => {
  try {
    const consultants = await User.find({ role: 'consultant' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: consultants.length,
      data: consultants
    });
  } catch (error) {
    console.error('Get consultants error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch consultants',
      error: error.message
    });
  }
};

// Activate user
exports.activateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not activate user',
      error: error.message
    });
  }
};

// Deactivate user
exports.deactivateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not deactivate user',
      error: error.message
    });
  }
};

// Update password
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.params.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && req.user._id.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user\'s password'
      });
    }

    // If not admin, verify current password
    if (req.user.role !== 'admin') {
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not update password',
      error: error.message
    });
  }
};

// Assign consultant to vendor
exports.assignConsultantToVendor = async (req, res) => {
  try {
    const { consultantId } = req.body;
    const vendorId = req.params.id;

    console.log(`Assigning consultant ${consultantId} to vendor ${vendorId}`);

    // Check if vendor exists
    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Check if consultant exists
    const consultant = await User.findById(consultantId);
    if (!consultant || consultant.role !== 'consultant') {
      return res.status(404).json({
        success: false,
        message: 'Consultant not found'
      });
    }

    console.log(`Found vendor ${vendor.name} and consultant ${consultant.name}`);

    // Update vendor with assigned consultant using updateOne to avoid validation issues
    await User.updateOne(
      { _id: vendorId },
      { $set: { assignedConsultant: consultantId } }
    );

    console.log(`Updated vendor's assignedConsultant field`);

    // Also update any existing document submissions for this vendor with the new consultant's information
    try {
      const DocumentSubmission = require('../models/documentSubmission.model');
      
      // Update the consultant field in all the vendor's document submissions
      const updateResult = await DocumentSubmission.updateMany(
        { vendor: vendorId },
        { 
          $set: { 
            'consultant.name': consultant.name,
            'consultant.email': consultant.email
          }
        }
      );
      
      console.log(`Updated ${updateResult.modifiedCount} document submissions with new consultant information`);
    } catch (updateError) {
      console.error('Error updating document submissions:', updateError);
      // Don't fail the whole operation if this part fails
    }

    // Get the updated vendor
    const updatedVendor = await User.findById(vendorId).populate('assignedConsultant');

    res.status(200).json({
      success: true,
      data: updatedVendor,
      message: `Successfully assigned consultant ${consultant.name} to vendor ${vendor.name}`
    });
  } catch (error) {
    console.error('Assign consultant error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not assign consultant to vendor',
      error: error.message
    });
  }
};

// Get vendors assigned to consultant
exports.getVendorsByConsultant = async (req, res) => {
  try {
    const consultantId = req.params.id;

    // Check permissions
    if (req.user.role !== 'admin' && req.user._id.toString() !== consultantId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these vendors'
      });
    }

    const vendors = await User.find({
      role: 'vendor',
      assignedConsultant: consultantId
    }).select('-password');

    res.status(200).json({
      success: true,
      count: vendors.length,
      data: vendors
    });
  } catch (error) {
    console.error('Get vendors by consultant error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch vendors',
      error: error.message
    });
  }
};

// Get consultant assigned to vendor
exports.getConsultantByVendor = async (req, res) => {
  try {
    const vendorId = req.params.id;
    const vendor = await User.findById(vendorId).populate('assignedConsultant', '-password');

    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && 
        req.user._id.toString() !== vendorId && 
        req.user._id.toString() !== vendor.assignedConsultant?._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this information'
      });
    }

    res.status(200).json({
      success: true,
      data: vendor.assignedConsultant
    });
  } catch (error) {
    console.error('Get consultant by vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch consultant',
      error: error.message
    });
  }
};

// Manage vendor login approval requirement
exports.manageVendorLoginApproval = async (req, res) => {
  try {
    const { requireLoginApproval } = req.body;
    const vendorId = req.params.id;

    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    vendor.requireLoginApproval = requireLoginApproval;
    await vendor.save();

    res.status(200).json({
      success: true,
      data: vendor
    });
  } catch (error) {
    console.error('Manage vendor login approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not update vendor login approval setting',
      error: error.message
    });
  }
};

// Send credentials to user
exports.sendCredentials = async (req, res) => {
  try {
    const { email, name, password, role, loginUrl } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Only admins can send credentials
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send credentials'
      });
    }

    // Create notification for the user
    const Notification = require('../models/notification.model');
    await Notification.create({
      recipient: user._id,
      type: 'credentials',
      title: 'Your Login Credentials',
      message: `Your account has been created. Use the following credentials to log in:
Email: ${email}
Password: ${password}
Login URL: ${loginUrl}`,
      priority: 'high'
    });

    // In a real-world scenario, you would send an email here
    // For this implementation, we'll just return success

    res.status(200).json({
      success: true,
      message: 'Credentials sent successfully'
    });
  } catch (error) {
    console.error('Send credentials error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not send credentials',
      error: error.message
    });
  }
};

// Get consultant analytics with performance metrics
exports.getConsultantAnalytics = async (req, res) => {
  try {
    // Get all consultants
    const consultants = await User.find({ role: 'consultant' })
      .select('-password')
      .sort({ name: 1 });
    // ... (rest of the code remains the same)
    
    // Get analytics for each consultant
    const consultantsWithAnalytics = await Promise.all(
      consultants.map(async (consultant) => {
        // Count assigned vendors
        const assignedVendors = await User.countDocuments({
          role: 'vendor',
          assignedConsultant: consultant._id
        });
        
        // Get document metrics
        const processedDocuments = await DocModel.countDocuments({
          reviewer: consultant._id
        });
        
        const approvedDocuments = await DocModel.countDocuments({
          reviewer: consultant._id,
          status: 'approved'
        });
        
        const rejectedDocuments = await DocModel.countDocuments({
          reviewer: consultant._id,
          status: 'rejected'
        });
        
        // Calculate approval rate
        const approvalRate = processedDocuments > 0 ? 
          Math.round((approvedDocuments / processedDocuments) * 100) : 0;
        
        // Calculate average response time (in hours)
        const documents = await DocModel.find({
          reviewer: consultant._id,
          reviewDate: { $exists: true }
        }).select('submissionDate reviewDate');
        
        let avgResponseTime = 0;
        
        if (documents.length > 0) {
          const totalResponseTime = documents.reduce((total, doc) => {
            const submissionDate = new Date(doc.submissionDate);
            const reviewDate = new Date(doc.reviewDate);
            return total + ((reviewDate - submissionDate) / (1000 * 60 * 60)); // Convert to hours
          }, 0);
          
          avgResponseTime = Math.round(totalResponseTime / documents.length);
        }
        
        // Return consultant with analytics
        return {
          ...consultant.toObject(),
          metrics: {
            assignedVendors,
            processedDocuments,
            approvedDocuments,
            rejectedDocuments,
            approvalRate,
            avgResponseTime
          }
        };
      })
    );
    
    res.status(200).json({
      success: true,
      count: consultantsWithAnalytics.length,
      data: consultantsWithAnalytics
    });
  } catch (error) {
    console.error('Get consultant analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch consultant analytics',
      error: error.message
    });
  }
};

// Get vendor analytics with document compliance status
exports.getVendorAnalytics = async (req, res) => {
  try {
    // Get all vendors
    const vendors = await User.find({ role: 'vendor' })
      .select('-password')
      .populate('assignedConsultant', 'name email')
      .sort({ name: 1 });
    
    // Get analytics for each vendor
    const vendorsWithAnalytics = await Promise.all(
      vendors.map(async (vendor) => {
        // Get document stats
        const totalDocuments = await DocModel.countDocuments({
          vendor: vendor._id
        });
        
        const approvedDocuments = await DocModel.countDocuments({
          vendor: vendor._id,
          status: 'approved'
        });
        
        const pendingDocuments = await DocModel.countDocuments({
          vendor: vendor._id,
          status: { $in: ['pending', 'under_review'] }
        });
        
        const rejectedDocuments = await DocModel.countDocuments({
          vendor: vendor._id,
          status: 'rejected'
        });
        
        // Calculate compliance rate
        const complianceRate = totalDocuments > 0 ? 
          Math.round((approvedDocuments / totalDocuments) * 100) : 0;
        
        // Get last activity (latest document submission or update)
        const latestDoc = await DocModel.findOne({
          vendor: vendor._id
        })
        .sort({ updatedAt: -1 })
        .select('updatedAt');
        
        const lastActivity = latestDoc ? latestDoc.updatedAt : vendor.updatedAt;
        
        // Return vendor with analytics
        return {
          ...vendor.toObject(),
          analytics: {
            totalDocuments,
            approvedDocuments,
            pendingDocuments,
            rejectedDocuments,
            complianceRate,
            lastActivity
          }
        };
      })
    );
    
    res.status(200).json({
      success: true,
      count: vendorsWithAnalytics.length,
      data: vendorsWithAnalytics
    });
  } catch (error) {
    console.error('Get vendor analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch vendor analytics',
      error: error.message
    });
  }
};

// Get dashboard analytics and overview
exports.getDashboardAnalytics = async (req, res) => {
  try {
    // Get counts
    const totalVendors = await User.countDocuments({ role: 'vendor' });
    const totalConsultants = await User.countDocuments({ role: 'consultant' });
    const totalDocuments = await DocModel.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const pendingApprovals = await User.countDocuments({ 
      role: 'vendor', 
      requiresLoginApproval: true 
    });
    
    // Get document stats by status
    const documentsByStatus = await DocModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id', 'pending'] }, then: 'Pending' },
                { case: { $eq: ['$_id', 'under_review'] }, then: 'Under Review' },
                { case: { $eq: ['$_id', 'approved'] }, then: 'Approved' },
                { case: { $eq: ['$_id', 'rejected'] }, then: 'Rejected' }
              ],
              default: 'Unknown'
            }
          },
          value: '$count'
        }
      }
    ]);
    
    // Get documents by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const documentsByMonth = await DocModel.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1
        }
      },
      {
        $project: {
          _id: 0,
          month: {
            $let: {
              vars: {
                monthsInString: [
                  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                ]
              },
              in: {
                $concat: [
                  { $arrayElemAt: ['$$monthsInString', '$_id.month'] },
                  ' ',
                  { $toString: '$_id.year' }
                ]
              }
            }
          },
          count: 1
        }
      }
    ]);
    
    // Get user activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const userActivityData = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            role: '$role'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          roles: {
            $push: {
              role: '$_id.role',
              count: '$count'
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Format user activity data
    const userActivity = userActivityData.map(day => {
      const activity = {
        date: day._id,
        vendors: 0,
        consultants: 0
      };
      
      day.roles.forEach(roleData => {
        if (roleData.role === 'vendor') {
          activity.vendors = roleData.count;
        } else if (roleData.role === 'consultant') {
          activity.consultants = roleData.count;
        }
      });
      
      return activity;
    });
    
    res.status(200).json({
      success: true,
      data: {
        totalVendors,
        totalConsultants,
        totalDocuments,
        activeUsers,
        pendingApprovals,
        documentsByStatus,
        documentsByMonth,
        userActivity
      }
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch dashboard analytics',
      error: error.message
    });
  }
};

// Bulk update users (for bulk actions)
exports.bulkUpdateUsers = async (req, res) => {
  try {
    const { userIds, action, data } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid array of user IDs'
      });
    }
    
    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Please specify an action to perform'
      });
    }
    
    let result;
    
    switch (action) {
      case 'activate':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { isActive: true }
        );
        break;
        
      case 'deactivate':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { isActive: false }
        );
        break;
        
      case 'delete':
        result = await User.deleteMany(
          { _id: { $in: userIds } }
        );
        break;
        
      case 'assignConsultant':
        if (!data || !data.consultantId) {
          return res.status(400).json({
            success: false,
            message: 'Please provide a consultant ID for assignment'
          });
        }
        
        result = await User.updateMany(
          { _id: { $in: userIds }, role: 'vendor' },
          { assignedConsultant: data.consultantId }
        );
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action specified'
        });
    }
    
    res.status(200).json({
      success: true,
      message: `Bulk update successful for ${action} action`,
      result
    });
  } catch (error) {
    console.error('Bulk update users error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not perform bulk update',
      error: error.message
    });
  }
};

// Export users data to CSV
exports.exportUsers = async (req, res) => {
  try {
    const { role, format } = req.query;
    
    // Validate role
    if (role && !['vendor', 'consultant'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }
    
    // Validate format
    if (!format || !['csv', 'excel'].includes(format)) {
      return res.status(400).json({
        success: false,
        message: 'Supported formats are csv and excel'
      });
    }
    
    // Build query
    const query = role ? { role } : {};
    
    // Get users
    const users = await User.find(query)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .lean();
    
    // Format data for export based on requested format
    if (format === 'csv') {
      // Implementation for CSV format
      // This would typically use a CSV library like fast-csv or json2csv
      
      res.status(200).send({
        success: true,
        message: 'CSV export successful',
        data: `data:text/csv;charset=utf-8,${encodeURIComponent(
          // Mock CSV content - in a real implementation, use a proper CSV library
          `ID,Name,Email,Role,Company,Active\n${
            users.map(user => 
              `${user._id},${user.name},${user.email},${user.role},${user.company || ''},${user.isActive}`
            ).join('\n')
          }`
        )}`
      });
    } else {
      // Implementation for Excel format
      // This would typically use an Excel library like exceljs or xlsx
      
      res.status(200).send({
        success: true,
        message: 'Excel export successful',
        data: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${
          // Mock Excel content - in a real implementation, use a proper Excel library
          Buffer.from(JSON.stringify(users)).toString('base64')
        }`
      });
    }
  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not export users data',
      error: error.message
    });
  }
};