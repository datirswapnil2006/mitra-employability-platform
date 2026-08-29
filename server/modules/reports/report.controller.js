const ExcelJS = require('exceljs');
const User = require('../auth/user.model');
const { StudentProfile } = require('../students/student.model');
const StudentProgress = require('../progress/progress.model');
const { AssessmentAttempt, Assessment } = require('../assessments/assessment.models');
const PsychometricProfile = require('../ai/psychometric.model');
const { OFFICIAL_DEPARTMENTS } = require('../../config/constants');

// Helper to write CSV
const streamCsv = (res, filename, headers, rows) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(escapeCsv).join(',') + '\n';
  res.write(headerLine);

  rows.forEach((row) => {
    const rowLine = row.map(escapeCsv).join(',') + '\n';
    res.write(rowLine);
  });

  res.end();
};

exports.exportDepartmentReport = async (req, res) => {
  try {
    const {
      type = 'students',
      format = 'xlsx',
      department = 'All',
      batch = 'All',
      year = 'All',
      minTenth = '',
      minTwelfth = '',
      minCgpa = '',
      backlogStatus = 'All',
      gapStatus = 'All',
      status = 'All'
    } = req.query;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'MITRA Employability Portal';
    workbook.created = new Date();

    // 1. STUDENT MASTER REPORT
    if (type === 'students') {
      const headers = [
        'ERP Number',
        'Student Name',
        'Email',
        'Phone',
        'Aadhaar Number',
        'Hometown',
        'Gender',
        'Department',
        'Year',
        'Batch',
        'Education Gap',
        'Current Backlogs',
        '10th Marks (%)',
        '12th Marks (%)',
        'Diploma Marks (%)',
        'Current CGPA',
        'Profile Completion %',
        'Assessments Taken',
        'Tests Passed',
        'Avg Assessment %',
        'Employability Index %',
        'Account Status'
      ];

      const profileFilter = {};
      if (department && department !== 'All') profileFilter.department = department;
      if (batch && batch !== 'All') profileFilter.batch = batch;
      if (year && year !== 'All') profileFilter.year = year;

      if (backlogStatus && backlogStatus !== 'All') {
        if (backlogStatus === 'No' || backlogStatus === 'None') {
          profileFilter.hasBacklogs = 'No';
        } else if (backlogStatus === 'Yes') {
          profileFilter.hasBacklogs = { $ne: 'No' };
        }
      }

      if (gapStatus && gapStatus !== 'All') {
        if (gapStatus === 'No' || gapStatus === 'None') {
          profileFilter.educationGap = 'No';
        } else if (gapStatus === 'Yes') {
          profileFilter.educationGap = { $ne: 'No' };
        }
      }

      const andConditions = [];

      if (minTenth && !isNaN(parseFloat(minTenth))) {
        andConditions.push({ tenthPercentage: { $gte: parseFloat(minTenth) } });
      }

      if (minTwelfth && !isNaN(parseFloat(minTwelfth))) {
        andConditions.push({
          $or: [
            { twelfthPercentage: { $gte: parseFloat(minTwelfth) } },
            { diplomaPercentage: { $gte: parseFloat(minTwelfth) } }
          ]
        });
      }

      if (minCgpa && !isNaN(parseFloat(minCgpa))) {
        andConditions.push({ cgpa: { $gte: parseFloat(minCgpa) } });
      }

      if (andConditions.length > 0) {
        profileFilter.$and = andConditions;
      }

      const studentProfiles = await StudentProfile.find(profileFilter).populate('user').sort({ erpNumber: 1 });

      const rows = [];
      for (const profile of studentProfiles) {
        if (!profile.user) continue;
        if (status !== 'All' && profile.user.status !== status) continue;

        const attempts = await AssessmentAttempt.find({ user: profile.user._id });
        const totalAttempts = attempts.length;
        const passedCount = attempts.filter((a) => a.status === 'PASSED').length;
        const avgScore = totalAttempts > 0
          ? Math.round(attempts.reduce((acc, a) => acc + (a.percentage || 0), 0) / totalAttempts)
          : 0;

        const psycho = await PsychometricProfile.findOne({ user: profile.user._id }).sort({ evaluatedAt: -1 });
        const readinessIndex = psycho ? psycho.employabilityIndex : 0;

        rows.push([
          profile.erpNumber || profile.rollNo || 'N/A',
          profile.user.name,
          profile.user.email,
          profile.phone || profile.user.phone || 'N/A',
          profile.aadhaarNumber || 'N/A',
          profile.hometown || 'N/A',
          profile.gender || 'N/A',
          profile.department,
          profile.year || 'FE',
          profile.batch || '2026',
          profile.educationGap || 'No',
          profile.hasBacklogs || 'No',
          profile.tenthPercentage !== null && profile.tenthPercentage !== undefined ? `${profile.tenthPercentage}%` : 'N/A',
          profile.twelfthPercentage !== null && profile.twelfthPercentage !== undefined ? `${profile.twelfthPercentage}%` : 'N/A',
          profile.diplomaPercentage !== null && profile.diplomaPercentage !== undefined ? `${profile.diplomaPercentage}%` : 'N/A',
          profile.cgpa !== null && profile.cgpa !== undefined ? `${profile.cgpa}` : 'N/A',
          `${profile.profileCompletionPercentage}%`,
          totalAttempts,
          passedCount,
          `${avgScore}%`,
          `${readinessIndex}%`,
          profile.user.status?.toUpperCase() || 'ACTIVE'
        ]);
      }

      const sanitizedFilename = `MITRA_Students_${department}_Batch_${batch}_${Date.now()}`;

      if (format === 'csv') {
        return streamCsv(res, `${sanitizedFilename}.csv`, headers, rows);
      }

      const worksheet = workbook.addWorksheet(`Students_${department.substring(0, 20)}`);
      worksheet.mergeCells('A1:V2');
      const titleCell = worksheet.getCell('A1');
      
      const filterSummary = [
        `Dept: ${department}`,
        `Batch: ${batch}`,
        minTenth ? `10th >= ${minTenth}%` : null,
        minTwelfth ? `12th/Dip >= ${minTwelfth}%` : null,
        minCgpa ? `CGPA >= ${minCgpa}` : null
      ].filter(Boolean).join(' | ');

      titleCell.value = `MITRA EMPLOYABILITY PORTAL — STUDENT MASTER REPORT (${filterSummary})`;
      titleCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFF' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } };

      worksheet.getRow(4).values = headers;
      const headerRow = worksheet.getRow(4);
      headerRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
      headerRow.height = 25;
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E40AF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      rows.forEach((r, idx) => {
        const row = worksheet.getRow(5 + idx);
        row.values = r;
        row.height = 20;
        row.eachCell((cell, colNum) => {
          cell.alignment = { vertical: 'middle', horizontal: colNum === 2 || colNum === 3 ? 'left' : 'center' };
        });
      });

      worksheet.columns.forEach((col) => { col.width = 18; });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}.xlsx"`);
      await workbook.xlsx.write(res);
      return res.end();
    }

    // 2. ASSESSMENT ATTEMPTS REPORT
    if (type === 'assessments') {
      const headers = [
        'Attempt ID',
        'ERP Number',
        'Student Name',
        'Email',
        'Department',
        'Year',
        'Batch',
        'Assessment Title',
        'Mode',
        'Module',
        'Category',
        'Score',
        'Total Marks',
        'Percentage (%)',
        'Result Status',
        'Submission Reason',
        'Proctoring Strikes',
        'Tab Switch Count',
        'Second Person Count',
        'Voice/Speech Count',
        'Proctoring Audit Proof & Log Summary',
        'Time Spent (Sec)',
        'Attempt Date & Time'
      ];

      const attempts = await AssessmentAttempt.find()
        .populate('user', 'name email department year phone')
        .populate('assessmentId', 'title module category assessmentMode')
        .sort({ attemptedAt: -1 });

      const userIds = attempts.map((a) => a.user?._id).filter(Boolean);
      const studentProfiles = await StudentProfile.find({ user: { $in: userIds } });
      const profileMap = new Map(studentProfiles.map((p) => [p.user.toString(), p]));

      const filtered = attempts.filter((a) => {
        if (!a.user) return false;
        const prof = profileMap.get(a.user._id.toString());
        if (department !== 'All' && a.user.department !== department) return false;
        if (batch !== 'All' && prof?.batch !== batch) return false;
        if (status !== 'All' && a.status !== status) return false;
        return true;
      });

      const rows = filtered.map((a) => {
        const prof = profileMap.get(a.user._id.toString());
        const logs = a.proctoringLogs || [];

        const tabSwitchCount = logs.filter((l) => l.type === 'TAB_SWITCH' || l.type === 'WINDOW_BLUR').length;
        const secondPersonCount = logs.filter((l) => l.type === 'SECOND_PERSON_DETECTED').length;
        const voiceCount = logs.filter((l) => l.type === 'VOICE_DETECTED').length;

        let submissionReason = 'Submitted Normally by Candidate';
        if (a.isAbandoned) {
          if (a.violationsCount >= 3) {
            submissionReason = 'Auto-Terminated (3 Proctoring Strikes Exceeded)';
          } else {
            submissionReason = 'Abandoned / Left Window Before Submission';
          }
        }

        const logSummary = logs.length > 0
          ? logs.map((l, i) => `${i + 1}. [${new Date(l.timestamp).toLocaleTimeString()}] ${l.type}: ${l.details}${l.snapshot ? ' [Snapshot Evidence Stored]' : ''}`).join(' | ')
          : 'Clean Examination (Zero Violations)';

        return [
          a._id.toString(),
          prof?.erpNumber || prof?.rollNo || 'N/A',
          a.user?.name || 'N/A',
          a.user?.email || 'N/A',
          a.user?.department || 'N/A',
          prof?.year || a.user?.year || 'FE',
          prof?.batch || 'N/A',
          a.assessmentId?.title || 'Assessment',
          a.assessmentId?.assessmentMode || 'NORMAL',
          a.assessmentId?.module || 'General',
          a.assessmentId?.category || 'General',
          a.score,
          a.totalMarks,
          `${a.percentage}%`,
          a.status,
          submissionReason,
          a.violationsCount || 0,
          tabSwitchCount,
          secondPersonCount,
          voiceCount,
          logSummary,
          a.timeSpentSeconds || 0,
          a.attemptedAt ? new Date(a.attemptedAt).toLocaleString('en-IN') : 'N/A'
        ];
      });

      const sanitizedFilename = `MITRA_Assessment_Results_${department}_Batch_${batch}_${Date.now()}`;

      if (format === 'csv') {
        return streamCsv(res, `${sanitizedFilename}.csv`, headers, rows);
      }

      const worksheet = workbook.addWorksheet(`Assessments_${department.substring(0, 20)}`);
      worksheet.mergeCells('A1:W2');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = `MITRA EMPLOYABILITY PORTAL — ASSESSMENT ATTEMPTS & PROCTORING AUDIT (${department} | Batch: ${batch})`;
      titleCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFF' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } };

      worksheet.getRow(4).values = headers;
      const headerRow = worksheet.getRow(4);
      headerRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
      headerRow.height = 25;
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F46E5' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      rows.forEach((r, idx) => {
        const row = worksheet.getRow(5 + idx);
        row.values = r;
        row.height = 20;
        row.eachCell((cell, colNum) => {
          cell.alignment = {
            vertical: 'middle',
            horizontal: colNum === 2 || colNum === 3 || colNum === 8 || colNum === 21 ? 'left' : 'center'
          };
        });
      });

      worksheet.columns.forEach((col) => { col.width = 18; });
      worksheet.getColumn(2).width = 16; // ERP Number
      worksheet.getColumn(8).width = 24; // Title
      worksheet.getColumn(16).width = 30; // Submission Reason
      worksheet.getColumn(21).width = 45; // Proctoring Log Summary

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}.xlsx"`);
      await workbook.xlsx.write(res);
      return res.end();
    }

    // 3. DEPARTMENT SUMMARY REPORT
    const headers = [
      'Department',
      'Total Registered Candidates',
      'Total Test Attempts',
      'Tests Passed',
      'Average Test Score %',
      'Pass Rate %',
      'Avg Psychometric Readiness Index %'
    ];

    const departments = OFFICIAL_DEPARTMENTS || [
      'EXTC', 'CSE', 'IT', 'AIDS', 'CSE (IOT)', 'Civil', 'Mechanical', 'MCA', 'MBA'
    ];

    const allAttempts = await AssessmentAttempt.find().populate('user', 'department');
    const allPsycho = await PsychometricProfile.find().populate('user', 'department');

    const summaryRows = await Promise.all(
      departments.map(async (dept) => {
        const studentCount = await User.countDocuments({ role: 'student', department: dept });
        const deptAttempts = allAttempts.filter((a) => a.user && a.user.department === dept);
        const count = deptAttempts.length;
        const passed = deptAttempts.filter((a) => a.status === 'PASSED').length;
        const passRate = count > 0 ? Math.round((passed / count) * 100) : 0;
        const avgScore = count > 0 ? Math.round(deptAttempts.reduce((acc, a) => acc + (a.percentage || 0), 0) / count) : 0;

        const deptPsycho = allPsycho.filter((p) => p.user && p.user.department === dept);
        const avgReadiness = deptPsycho.length > 0
          ? Math.round(deptPsycho.reduce((acc, p) => acc + (p.employabilityIndex || 0), 0) / deptPsycho.length)
          : 0;

        return [
          dept,
          studentCount,
          count,
          passed,
          `${avgScore}%`,
          `${passRate}%`,
          `${avgReadiness}%`
        ];
      })
    );

    if (format === 'csv') {
      return streamCsv(res, `MITRA_Department_Summary.csv`, headers, summaryRows);
    }

    const worksheet = workbook.addWorksheet('Department_Summary');
    worksheet.mergeCells('A1:G2');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'MITRA EMPLOYABILITY PORTAL — DEPARTMENTAL COMPARATIVE TALENT SUMMARY';
    titleCell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } };

    worksheet.getRow(4).values = headers;
    const headerRow = worksheet.getRow(4);
    headerRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
    headerRow.height = 24;
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '059669' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    summaryRows.forEach((r, idx) => {
      const row = worksheet.getRow(5 + idx);
      row.values = r;
      row.height = 20;
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
    });

    worksheet.columns.forEach((col) => { col.width = 24; });
    const filename = `MITRA_Department_Summary.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    return res.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
