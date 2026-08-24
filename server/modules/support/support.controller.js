const ExcelJS = require('exceljs');
const SupportFeedback = require('./support.model');
const User = require('../auth/user.model');
const { StudentProfile } = require('../students/student.model');
const { OFFICIAL_DEPARTMENTS } = require('../../config/constants');

/**
 * Submit Feedback (Student)
 * Automatically fetches student profile details (ERP, Dept, Batch) from DB.
 */
exports.submitFeedback = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { category, subject, description, attachment } = req.body;

    if (!category || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Category, subject, and description are required.'
      });
    }

    // Retrieve authentic student user and profile from database
    const studentUser = await User.findById(studentId);
    if (!studentUser) {
      return res.status(404).json({ success: false, message: 'Student account not found.' });
    }

    const studentProfile = await StudentProfile.findOne({ user: studentId });

    const studentName = studentUser.name || 'Student';
    const erpNumber = studentProfile?.erpNumber || studentProfile?.rollNo || 'N/A';
    const department = studentProfile?.department || studentUser.department || 'CSE';
    const batch = studentProfile?.batch || '2026';

    const feedbackId = await SupportFeedback.generateNextFeedbackId();

    const newFeedback = await SupportFeedback.create({
      feedbackId,
      studentId,
      studentName,
      erpNumber,
      department,
      batch,
      category,
      subject: subject.trim(),
      description: description.trim(),
      attachment: attachment || '',
      status: 'New'
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully. Your support ticket is now under review.',
      feedback: newFeedback
    });
  } catch (err) {
    console.error('Submit feedback error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to submit feedback.'
    });
  }
};

/**
 * Get Student's Submitted Feedback History
 */
exports.getMyFeedback = async (req, res) => {
  try {
    const studentId = req.user.id;
    const feedbackList = await SupportFeedback.find({ studentId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: feedbackList.length,
      feedback: feedbackList
    });
  } catch (err) {
    console.error('Get my feedback error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch your support history.'
    });
  }
};

/**
 * Get Feedback by ID
 * Accessible by student (if owned) or admin
 */
exports.getFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await SupportFeedback.findById(id);

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found.' });
    }

    if (req.user.role !== 'admin' && feedback.studentId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied to this feedback record.' });
    }

    res.json({
      success: true,
      feedback
    });
  } catch (err) {
    console.error('Get feedback by ID error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch feedback details.'
    });
  }
};

/**
 * Helper to build Mongo filter query from query parameters
 */
const buildFeedbackFilter = (query) => {
  const {
    department,
    batch,
    category,
    status,
    search,
    fromDate,
    toDate
  } = query;

  const filter = {};

  if (department && department !== 'All' && department !== 'All Departments') {
    filter.department = { $regex: new RegExp(`^${department.trim()}$`, 'i') };
  }

  if (batch && batch !== 'All' && batch !== 'All Batches') {
    filter.batch = { $regex: new RegExp(`^${batch.trim()}$`, 'i') };
  }

  if (category && category !== 'All') {
    filter.category = category;
  }

  if (status && status !== 'All') {
    filter.status = status;
  }

  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      filter.createdAt.$gte = start;
    }
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  if (search && search.trim()) {
    const q = search.trim();
    filter.$or = [
      { feedbackId: { $regex: q, $options: 'i' } },
      { studentName: { $regex: q, $options: 'i' } },
      { erpNumber: { $regex: q, $options: 'i' } },
      { subject: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } }
    ];
  }

  return filter;
};

/**
 * Get All Feedback for Admin with Filters & Pagination
 */
exports.getAllFeedbackAdmin = async (req, res) => {
  try {
    const filter = buildFeedbackFilter(req.query);
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const total = await SupportFeedback.countDocuments(filter);
    const feedbackList = await SupportFeedback.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      count: feedbackList.length,
      feedback: feedbackList
    });
  } catch (err) {
    console.error('Get all feedback admin error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch feedback.'
    });
  }
};

/**
 * Get Support Metrics & Statistics for Admin Dashboard
 */
exports.getSupportStats = async (req, res) => {
  try {
    const total = await SupportFeedback.countDocuments();
    const newCount = await SupportFeedback.countDocuments({ status: 'New' });
    const inReviewCount = await SupportFeedback.countDocuments({ status: 'In Review' });
    const resolvedCount = await SupportFeedback.countDocuments({ status: 'Resolved' });

    // Category breakdown
    const suggestionsCount = await SupportFeedback.countDocuments({
      category: { $in: ['Suggestion / Improvement', 'Feature Request'] }
    });
    const problemsCount = await SupportFeedback.countDocuments({
      category: { $in: ['Technical Problem', 'Test/Assessment Issue', 'Other'] }
    });

    // Department breakdown
    const deptAgg = await SupportFeedback.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);
    const deptBreakdown = {};
    deptAgg.forEach((item) => {
      if (item._id) deptBreakdown[item._id] = item.count;
    });

    res.json({
      success: true,
      stats: {
        total,
        new: newCount,
        inReview: inReviewCount,
        resolved: resolvedCount,
        suggestions: suggestionsCount,
        problems: problemsCount,
        deptBreakdown
      }
    });
  } catch (err) {
    console.error('Get support stats error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch support statistics.'
    });
  }
};

/**
 * Update Feedback Status & Admin Response (Admin)
 */
exports.updateFeedbackAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminResponse } = req.body;

    const feedback = await SupportFeedback.findById(id);
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found.' });
    }

    if (status) {
      if (!['New', 'In Review', 'Resolved'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status value.' });
      }
      feedback.status = status;
      if (status === 'Resolved') {
        feedback.resolvedAt = feedback.resolvedAt || new Date();
      } else {
        feedback.resolvedAt = null;
      }
    }

    if (adminResponse !== undefined) {
      feedback.adminResponse = adminResponse.trim();
    }

    await feedback.save();

    res.json({
      success: true,
      message: 'Feedback updated successfully.',
      feedback
    });
  } catch (err) {
    console.error('Update feedback admin error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to update feedback.'
    });
  }
};

/**
 * Delete Feedback (Admin)
 */
exports.deleteFeedbackAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await SupportFeedback.findByIdAndDelete(id);

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found.' });
    }

    res.json({
      success: true,
      message: 'Feedback deleted successfully.'
    });
  } catch (err) {
    console.error('Delete feedback admin error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to delete feedback.'
    });
  }
};

/**
 * Department-Wise and Batch-Wise Excel Export
 */
exports.exportSupportExcel = async (req, res) => {
  try {
    const { department = 'All', batch = 'All' } = req.query;
    const filter = buildFeedbackFilter(req.query);

    const records = await SupportFeedback.find(filter).sort({ createdAt: -1 });

    // Determine filename per specification:
    // Default: Support_Feedback_Report.xlsx
    // If department & batch: Support_Feedback_<Dept>_<Batch>.xlsx
    // If only department: Support_Feedback_<Dept>_All_Batches.xlsx
    // If all data: Support_Feedback_All_Departments_All_Batches.xlsx
    let filename = 'Support_Feedback_Report.xlsx';
    const isDeptAll = department === 'All' || department === 'All Departments' || !department;
    const isBatchAll = batch === 'All' || batch === 'All Batches' || !batch;

    const sanitize = (str) => String(str).replace(/[\s/\\?%*:|"<>]+/g, '_');

    if (isDeptAll && isBatchAll) {
      filename = 'Support_Feedback_All_Departments_All_Batches.xlsx';
    } else if (!isDeptAll && !isBatchAll) {
      filename = `Support_Feedback_${sanitize(department)}_${sanitize(batch)}.xlsx`;
    } else if (!isDeptAll && isBatchAll) {
      filename = `Support_Feedback_${sanitize(department)}_All_Batches.xlsx`;
    } else if (isDeptAll && !isBatchAll) {
      filename = `Support_Feedback_All_Departments_${sanitize(batch)}.xlsx`;
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'MITRA Employability Portal';
    workbook.lastModifiedBy = 'Admin Support Console';
    workbook.created = new Date();

    // Helper for formatting header row
    const applyHeaderStyle = (row, bgHex = '1E293B', fontColor = 'FFFFFF') => {
      row.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: fontColor }, size: 11 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgHex }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'CBD5E1' } },
          left: { style: 'thin', color: { argb: 'CBD5E1' } },
          bottom: { style: 'medium', color: { argb: '94A3B8' } },
          right: { style: 'thin', color: { argb: 'CBD5E1' } }
        };
      });
      row.height = 28;
    };

    // Columns specification
    const feedbackColumns = [
      { header: 'Feedback ID', key: 'feedbackId', width: 22 },
      { header: 'Student Name', key: 'studentName', width: 26 },
      { header: 'ERP Number', key: 'erpNumber', width: 18 },
      { header: 'Department', key: 'department', width: 16 },
      { header: 'Batch', key: 'batch', width: 16 },
      { header: 'Category', key: 'category', width: 26 },
      { header: 'Subject', key: 'subject', width: 32 },
      { header: 'Description', key: 'description', width: 45 },
      { header: 'Submitted Date', key: 'createdAt', width: 22 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Admin Response', key: 'adminResponse', width: 38 },
      { header: 'Resolved Date', key: 'resolvedAt', width: 22 }
    ];

    const mapRowData = (item) => ({
      feedbackId: item.feedbackId || '',
      studentName: item.studentName || '',
      erpNumber: item.erpNumber || '',
      department: item.department || '',
      batch: item.batch || '',
      category: item.category || '',
      subject: item.subject || '',
      description: item.description || '',
      createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '',
      status: item.status || 'New',
      adminResponse: item.adminResponse || '',
      resolvedAt: item.resolvedAt ? new Date(item.resolvedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : (item.status === 'Resolved' ? 'Resolved' : 'Pending')
    });

    // 1. SHEET 1: Summary KPI Metrics
    const summarySheet = workbook.addWorksheet('Summary', {
      views: [{ showGridLines: true }]
    });

    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 35 },
      { header: 'Value / Count', key: 'value', width: 25 }
    ];

    const summaryHeader = summarySheet.getRow(1);
    applyHeaderStyle(summaryHeader, '1E3A8A', 'FFFFFF'); // Navy Blue

    const totalCount = records.length;
    const newItems = records.filter(r => r.status === 'New').length;
    const inReviewItems = records.filter(r => r.status === 'In Review').length;
    const resolvedItems = records.filter(r => r.status === 'Resolved').length;
    const suggestionItems = records.filter(r => ['Suggestion / Improvement', 'Feature Request'].includes(r.category)).length;
    const problemItems = records.filter(r => ['Technical Problem', 'Test/Assessment Issue', 'Other'].includes(r.category)).length;

    const summaryRows = [
      { metric: 'Report Title', value: `Support & Feedback Report (${department} - ${batch})` },
      { metric: 'Generated On', value: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) },
      { metric: 'Department Filter', value: department },
      { metric: 'Batch Filter', value: batch },
      { metric: 'Total Feedback Submitted', value: totalCount },
      { metric: 'Status: New', value: newItems },
      { metric: 'Status: In Review', value: inReviewItems },
      { metric: 'Status: Resolved', value: resolvedItems },
      { metric: 'Category: Suggestions & Improvements', value: suggestionItems },
      { metric: 'Category: Problems & Issues', value: problemItems }
    ];

    summaryRows.forEach((r, idx) => {
      const addedRow = summarySheet.addRow(r);
      addedRow.height = 22;
      addedRow.eachCell((cell, colNum) => {
        cell.font = { size: 10, bold: colNum === 1 || idx < 4 };
        cell.alignment = { vertical: 'middle', horizontal: colNum === 2 ? 'center' : 'left' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'E2E8F0' } },
          left: { style: 'thin', color: { argb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
          right: { style: 'thin', color: { argb: 'E2E8F0' } }
        };
        if (idx % 2 === 1) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
        }
      });
    });

    // 2. SHEET 2: All Feedback Records
    const allSheet = workbook.addWorksheet('All Feedback', {
      views: [{ showGridLines: true }]
    });

    allSheet.columns = feedbackColumns;
    const allHeader = allSheet.getRow(1);
    applyHeaderStyle(allHeader, '2563EB', 'FFFFFF'); // Blue

    records.forEach((item, idx) => {
      const row = allSheet.addRow(mapRowData(item));
      row.height = 24;
      row.eachCell((cell, colNum) => {
        cell.font = { size: 10 };
        cell.alignment = {
          vertical: 'middle',
          horizontal: [1, 3, 4, 5, 9, 10, 12].includes(colNum) ? 'center' : 'left',
          wrapText: [7, 8, 11].includes(colNum)
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'E2E8F0' } },
          left: { style: 'thin', color: { argb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
          right: { style: 'thin', color: { argb: 'E2E8F0' } }
        };
        if (idx % 2 === 1) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
        }
      });
    });

    // 3. OPTIONAL DEPARTMENTAL SHEETS
    // When exporting for all departments, create dedicated department sheets for active departments
    if (isDeptAll) {
      const deptsInRecords = [...new Set(records.map(r => r.department).filter(Boolean))];
      
      // If we have distinct departments present
      if (deptsInRecords.length > 1) {
        deptsInRecords.forEach(deptName => {
          const deptRecords = records.filter(r => r.department === deptName);
          if (deptRecords.length === 0) return;

          const sheetTitle = deptName.slice(0, 30); // Excel sheet name limit is 31 chars
          const deptSheet = workbook.addWorksheet(sheetTitle, {
            views: [{ showGridLines: true }]
          });

          deptSheet.columns = feedbackColumns;
          const deptHeader = deptSheet.getRow(1);
          applyHeaderStyle(deptHeader, '334155', 'FFFFFF'); // Slate

          deptRecords.forEach((item, idx) => {
            const row = deptSheet.addRow(mapRowData(item));
            row.height = 24;
            row.eachCell((cell, colNum) => {
              cell.font = { size: 10 };
              cell.alignment = {
                vertical: 'middle',
                horizontal: [1, 3, 4, 5, 9, 10, 12].includes(colNum) ? 'center' : 'left',
                wrapText: [7, 8, 11].includes(colNum)
              };
              cell.border = {
                top: { style: 'thin', color: { argb: 'E2E8F0' } },
                left: { style: 'thin', color: { argb: 'E2E8F0' } },
                bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
                right: { style: 'thin', color: { argb: 'E2E8F0' } }
              };
              if (idx % 2 === 1) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
              }
            });
          });
        });
      }
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Export support excel error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to export support feedback report.'
    });
  }
};
