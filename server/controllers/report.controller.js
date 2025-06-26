const Report = require('../models/report.model');
const Document = require('../models/document.model');
const User = require('../models/user.model');
const Workflow = require('../models/workflow.model');

const path = require('path');
const fs = require('fs');

// Get all reports (with filtering)
exports.getReports = async (req, res) => {
  try {
    let query = {};

    // Filter by type if provided
    if (req.query.type) {
      query.type = req.query.type;
    }

    // Filter by creator if provided
    if (req.query.createdBy) {
      query.createdBy = req.query.createdBy;
    }

    // Filter for public or own reports
    if (req.user.role !== 'admin') {
      query.$or = [
        { isPublic: true },
        { createdBy: req.user.id }
      ];
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Report.countDocuments(query);

    // Get reports
    const reports = await Report.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    // Pagination result
    const pagination = {};
    if (endIndex < total) {
      pagination.next = { page: page + 1, limit };
    }
    if (startIndex > 0) {
      pagination.prev = { page: page - 1, limit };
    }

    res.status(200).json({
      success: true,
      count: reports.length,
      pagination,
      data: reports,
      total
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch reports',
      error: error.message
    });
  }
};

// Get a single report
exports.getReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('schedule.recipients', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check if user has access to this report
    if (req.user.role !== 'admin' && 
        report.createdBy.toString() !== req.user.id && 
        !report.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this report'
      });
    }

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not fetch report',
      error: error.message
    });
  }
};

// Create a report
exports.createReport = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      type, 
      parameters,
      schedule,
      filters,
      isPublic
    } = req.body;

    // Create report
    const report = await Report.create({
      name,
      description,
      type,
      parameters: parameters || {},
      createdBy: req.user.id,
      schedule: schedule || { isScheduled: false },
      filters: filters || {},
      isPublic: isPublic || false
    });

    res.status(201).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not create report',
      error: error.message
    });
  }
};

// Update a report
exports.updateReport = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      type, 
      parameters,
      schedule,
      filters,
      isPublic
    } = req.body;

    let report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && report.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this report'
      });
    }

    // Update fields
    if (name) report.name = name;
    if (description) report.description = description;
    if (type) report.type = type;
    if (parameters) report.parameters = parameters;
    if (schedule) report.schedule = schedule;
    if (filters) report.filters = filters;
    if (isPublic !== undefined) report.isPublic = isPublic;

    await report.save();

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not update report',
      error: error.message
    });
  }
};

// Delete a report
exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && report.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this report'
      });
    }

    await report.remove();

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not delete report',
      error: error.message
    });
  }
};

// Generate document status report
exports.generateDocumentStatusReport = async (req, res) => {
  try {
    const { startDate, endDate, vendors, documentTypes, statuses } = req.body;

    // Build query
    let query = {};
    
    // Date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    // Filter by vendors
    if (vendors && vendors.length > 0) {
      query.vendor = { $in: vendors };
    }
    
    // Filter by document types
    if (documentTypes && documentTypes.length > 0) {
      query.documentType = { $in: documentTypes };
    }
    
    // Filter by statuses
    if (statuses && statuses.length > 0) {
      query.status = { $in: statuses };
    }

    // Get documents
    const documents = await Document.find(query)
      .populate('vendor', 'name email company')
      .populate('reviewer', 'name email')
      .sort({ createdAt: -1 });

    // Group by status for summary
    const statusSummary = {};
    documents.forEach(doc => {
      if (!statusSummary[doc.status]) {
        statusSummary[doc.status] = 0;
      }
      statusSummary[doc.status]++;
    });

    // Group by document type
    const typeSummary = {};
    documents.forEach(doc => {
      if (!typeSummary[doc.documentType]) {
        typeSummary[doc.documentType] = 0;
      }
      typeSummary[doc.documentType]++;
    });

    // Create a summary of vendors
    const vendorSummary = {};
    documents.forEach(doc => {
      const vendorId = doc.vendor._id.toString();
      if (!vendorSummary[vendorId]) {
        vendorSummary[vendorId] = {
          name: doc.vendor.name,
          company: doc.vendor.company,
          email: doc.vendor.email,
          totalDocuments: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          under_review: 0
        };
      }
      
      vendorSummary[vendorId].totalDocuments++;
      vendorSummary[vendorId][doc.status]++;
    });

    // Create report data
    const reportData = {
      generatedAt: new Date(),
      filters: {
        startDate,
        endDate,
        vendors,
        documentTypes,
        statuses
      },
      summary: {
        totalDocuments: documents.length,
        byStatus: statusSummary,
        byType: typeSummary,
        byVendor: Object.values(vendorSummary)
      },
      documents: documents.map(doc => ({
        id: doc._id,
        title: doc.title,
        status: doc.status,
        documentType: doc.documentType,
        vendor: {
          id: doc.vendor._id,
          name: doc.vendor.name,
          company: doc.vendor.company
        },
        reviewer: doc.reviewer ? {
          id: doc.reviewer._id,
          name: doc.reviewer.name
        } : null,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        reviewDate: doc.reviewDate
      }))
    };

    // Save report if requested
    if (req.body.saveReport) {
      const report = await Report.create({
        name: req.body.reportName || `Document Status Report - ${new Date().toISOString().split('T')[0]}`,
        description: req.body.description || 'Generated document status report',
        type: 'document_status',
        parameters: reportData.filters,
        createdBy: req.user.id,
        filters: reportData.filters,
        isPublic: req.body.isPublic || false
      });

      reportData.reportId = report._id;
    }

    res.status(200).json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('Generate document status report error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not generate document status report',
      error: error.message
    });
  }
};

// Send monthly reminder to vendors with pending documents
exports.sendMonthlyVendorReminders = async (req, res) => {
  try {
    // Get all vendors
    const vendors = await User.find({ role: 'vendor', isActive: true });
    
    // Track successful and failed emails
    const results = {
      success: [],
      failed: []
    };
    
    // Process each vendor
    for (const vendor of vendors) {
      try {
        // Find pending or partially completed documents for this vendor
        const pendingDocs = await Document.find({
          vendor: vendor._id,
          status: { $in: ['pending', 'under_review', 'rejected'] }
        });
        // If vendor has pending documents, send reminder
        if (pendingDocs.length > 0) {
          // Group documents by status
          const documentsByStatus = {
            pending: [],
            under_review: [],
            rejected: []
          };
          pendingDocs.forEach(doc => {
            documentsByStatus[doc.status].push({
              title: doc.title,
              documentType: doc.documentType,
              status: doc.status,
              updatedAt: doc.updatedAt,
              reviewNotes: doc.reviewNotes
            });
          });
          // Implement WebSocket notification instead of email
          const notification = {
            type: 'document_reminder',
            userId: vendor._id,
            message: `You have ${pendingDocs.length} pending document(s) that require your attention`,
            data: {
              pendingCount: documentsByStatus.pending.length,
              underReviewCount: documentsByStatus.under_review.length,
              rejectedCount: documentsByStatus.rejected.length,
              documents: pendingDocs.map(doc => ({
                id: doc._id,
                title: doc.title,
                documentType: doc.documentType,
                status: doc.status,
                updatedAt: doc.updatedAt,
                reviewNotes: doc.reviewNotes
              }))
            },
            timestamp: new Date()
          };
          req.io.to(vendor._id.toString()).emit('notification', notification);
          results.success.push({
            vendor: {
              id: vendor._id,
              name: vendor.name,
              email: vendor.email
            },
            documentsCount: pendingDocs.length
          });
        } else {
          results.failed.push({
            vendor: {
              id: vendor._id,
              name: vendor.name,
              email: vendor.email
            },
            error: 'No pending documents found'
          });
        }
      } catch (vendorError) {
        console.error(`Error processing vendor ${vendor.email}:`, vendorError);
        results.failed.push({
          vendor: {
            id: vendor._id,
            name: vendor.name,
            email: vendor.email
          },
          error: vendorError.message
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: {
        totalVendors: vendors.length,
        emailsSent: results.success.length,
        emailsFailed: results.failed.length,
        details: results
      }
    });
  } catch (error) {
    console.error('Send monthly vendor reminders error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not send monthly vendor reminders',
      error: error.message
    });
  }
};

// Generate aging report
exports.generateAgingReport = async (req, res) => {
  try {
    // Define aging groups in days
    const agingGroups = {
      'less_than_7_days': { min: 0, max: 7 },
      '7_to_14_days': { min: 7, max: 14 },
      '15_to_30_days': { min: 15, max: 30 },
      'more_than_30_days': { min: 30, max: Infinity }
    };

    // Get all documents
    const allDocuments = await Document.find()
      .populate('vendor', 'name company email')
      .populate('reviewer', 'name email');

    // Calculate aging for each document
    const now = new Date();
    const documentsByAging = {};
    const vendorsByAging = {};
    const totalByStatus = {
      pending: 0,
      under_review: 0,
      approved: 0,
      rejected: 0
    };

    // Initialize aging groups
    Object.keys(agingGroups).forEach(group => {
      documentsByAging[group] = {
        pending: [],
        under_review: [],
        approved: [],
        rejected: []
      };
      vendorsByAging[group] = {};
    });

    // Categorize documents by aging and status
    allDocuments.forEach(doc => {
      // Calculate age in days
      const ageInDays = Math.floor((now - doc.createdAt) / (1000 * 60 * 60 * 24));
      
      // Find appropriate aging group
      let agingGroup = '';
      for (const [group, range] of Object.entries(agingGroups)) {
        if (ageInDays >= range.min && ageInDays < range.max) {
          agingGroup = group;
          break;
        }
      }
      
      // Add to documents by aging
      documentsByAging[agingGroup][doc.status].push(doc);
      
      // Track by vendor
      const vendorId = doc.vendor._id.toString();
      if (!vendorsByAging[agingGroup][vendorId]) {
        vendorsByAging[agingGroup][vendorId] = {
          vendor: {
            id: vendorId,
            name: doc.vendor.name,
            company: doc.vendor.company,
            email: doc.vendor.email
          },
          counts: {
            pending: 0,
            under_review: 0,
            approved: 0,
            rejected: 0,
            total: 0
          }
        };
      }
      
      vendorsByAging[agingGroup][vendorId].counts[doc.status]++;
      vendorsByAging[agingGroup][vendorId].counts.total++;
      
      // Update total by status
      totalByStatus[doc.status]++;
    });

    // Convert vendor objects to arrays
    Object.keys(vendorsByAging).forEach(group => {
      vendorsByAging[group] = Object.values(vendorsByAging[group]);
    });

    // Prepare summary data
    const summary = {
      totalDocuments: allDocuments.length,
      byStatus: totalByStatus,
      byAging: {}
    };

    // Calculate totals for each aging group
    Object.keys(agingGroups).forEach(group => {
      summary.byAging[group] = {
        pending: documentsByAging[group].pending.length,
        under_review: documentsByAging[group].under_review.length,
        approved: documentsByAging[group].approved.length,
        rejected: documentsByAging[group].rejected.length,
        total: documentsByAging[group].pending.length + 
               documentsByAging[group].under_review.length + 
               documentsByAging[group].approved.length + 
               documentsByAging[group].rejected.length
      };
    });

    res.status(200).json({
      success: true,
      data: {
        generatedAt: now,
        summary,
        documentsByAging,
        vendorsByAging
      }
    });
  } catch (error) {
    console.error('Generate aging report error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not generate aging report',
      error: error.message
    });
  }
};