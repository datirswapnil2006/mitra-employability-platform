const nodemailer = require('nodemailer');

let cachedTransporter = null;

/**
 * Creates or returns cached Nodemailer transporter with connection pooling.
 * Keeps SMTP connections open to reduce latency from ~4-5s to under ~300ms.
 * Environment variables: MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASSWORD
 */
const getTransporter = () => {
  const host = (process.env.MAIL_HOST || '').trim();
  const port = process.env.MAIL_PORT ? parseInt(process.env.MAIL_PORT, 10) : 2525;
  const user = (process.env.MAIL_USER || '').trim();
  const pass = (process.env.MAIL_PASSWORD || '').trim();
  const from = (process.env.EMAIL_FROM || '').trim();

  if (!host || !user || !pass || !from) {
    const missing = [];
    if (!host) missing.push('MAIL_HOST');
    if (!user) missing.push('MAIL_USER');
    if (!pass) missing.push('MAIL_PASSWORD');
    if (!from) missing.push('EMAIL_FROM');
    throw new Error(`Missing required Mailtrap SMTP environment variables: ${missing.join(', ')}`);
  }

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      pool: true,
      maxConnections: 3,
      maxMessages: 100,
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass
      },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 12000
    });
  }

  return cachedTransporter;
};

/**
 * Returns sender address strictly from process.env.EMAIL_FROM
 */
const getSender = () => {
  const from = (process.env.EMAIL_FROM || '').trim();
  if (!from) {
    throw new Error('EMAIL_FROM environment variable is not configured in process.env');
  }
  return from;
};

/**
 * Returns dynamic login URL using process.env.FRONTEND_URL
 */
const getLoginUrl = () => {
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').trim().replace(/\/+$/, '');
  return `${frontendUrl}/login`;
};

/**
 * HTML Template for Student Registration Credentials
 */
const getRegistrationHtmlTemplate = ({ studentName, toEmail, erpNumber, password }) => {
  const loginUrl = getLoginUrl();

  return `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9;">
        <h2 style="color: #1e3a8a; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">MITRA Employability Portal</h2>
        <p style="color: #64748b; font-size: 13px; margin-top: 4px; font-weight: 600;">Official Student Access Credentials</p>
      </div>
      
      <div style="padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
        <p style="font-size: 15px; color: #1e293b; margin-top: 0;">Dear <strong>${studentName}</strong>,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
          Welcome to the MITRA Employability Platform. Your student account has been successfully provisioned. Below are your official sign-in credentials:
        </p>
        
        <table style="width: 100%; font-size: 14px; margin-top: 16px; border-collapse: separate; border-spacing: 0; background: #ffffff; border-radius: 8px; border: 1px solid #cbd5e1; overflow: hidden;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 14px; color: #64748b; width: 40%; font-weight: 600; background: #f1f5f9;">Student Name</td>
            <td style="padding: 10px 14px; color: #0f172a; font-weight: 700;">${studentName}</td>
          </tr>
          ${erpNumber ? `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 14px; color: #64748b; font-weight: 600; background: #f1f5f9;">Student ID / ERP</td>
            <td style="padding: 10px 14px; color: #0f172a; font-family: monospace; font-weight: 700;">${erpNumber}</td>
          </tr>` : ''}
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 14px; color: #64748b; font-weight: 600; background: #f1f5f9;">Registered Email</td>
            <td style="padding: 10px 14px; color: #0f172a; font-family: monospace; font-weight: 700;">${toEmail}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; color: #64748b; font-weight: 600; background: #f1f5f9;">Temporary Password</td>
            <td style="padding: 10px 14px; color: #2563eb; font-weight: 800; font-family: monospace; font-size: 16px; letter-spacing: 0.5px;">${password}</td>
          </tr>
        </table>
      </div>

      <div style="margin-top: 24px; text-align: center;">
        <a href="${loginUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
          Sign In to MITRA Portal &rarr;
        </a>
      </div>

      <div style="margin-top: 24px; padding: 14px; background: #eff6ff; border-radius: 8px; border: 1px solid #bfdbfe; font-size: 13px; color: #1e40af; line-height: 1.5;">
        <strong>Important Next Step:</strong> Please log in and <strong>complete your student profile to 100%</strong> (including your academic scores, verified skills, and resume) to unlock eligibility for training modules, mock assessments, and campus recruitment drives.
      </div>

      <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px;">
        © MITRA Employability Platform • Training & Placement Cell
      </p>
    </div>
  `;
};

/**
 * HTML Template for Password Reset Notification
 */
const getResetHtmlTemplate = ({ studentName, toEmail, password }) => {
  const loginUrl = getLoginUrl();

  return `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9;">
        <h2 style="color: #1e3a8a; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">MITRA Employability Portal</h2>
        <p style="color: #64748b; font-size: 13px; margin-top: 4px; font-weight: 600;">Password Reset Notification</p>
      </div>
      
      <div style="padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
        <p style="font-size: 15px; color: #1e293b; margin-top: 0;">Hello <strong>${studentName}</strong>,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
          Your account password has been reset by the Training & Placement Administrator. Below is your new temporary sign-in password:
        </p>
        
        <table style="width: 100%; font-size: 14px; margin-top: 16px; border-collapse: separate; border-spacing: 0; background: #ffffff; border-radius: 8px; border: 1px solid #cbd5e1; overflow: hidden;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 14px; color: #64748b; width: 40%; font-weight: 600; background: #f1f5f9;">Account Email</td>
            <td style="padding: 10px 14px; color: #0f172a; font-family: monospace; font-weight: 700;">${toEmail}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; color: #64748b; font-weight: 600; background: #f1f5f9;">New Temporary Password</td>
            <td style="padding: 10px 14px; color: #2563eb; font-weight: 800; font-family: monospace; font-size: 16px; letter-spacing: 0.5px;">${password}</td>
          </tr>
        </table>
      </div>

      <div style="margin-top: 24px; text-align: center;">
        <a href="${loginUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
          Sign In to MITRA Portal &rarr;
        </a>
      </div>

      <div style="margin-top: 24px; padding: 14px; background: #fef2f2; border-radius: 8px; border: 1px solid #fecaca; font-size: 13px; color: #991b1b;">
        <strong>Security Notice:</strong> Please sign in using this temporary password and update your password immediately from your profile settings. If you did not request this change, please report to the T&P Department immediately.
      </div>

      <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px;">
        © MITRA Employability Platform • Training & Placement Cell
      </p>
    </div>
  `;
};

/**
 * Dispatches student registration credential email through Mailtrap SMTP
 */
exports.sendCredentialEmail = async ({ toEmail, studentName, password, erpNumber }) => {
  const recipient = (toEmail || '').trim();
  const subject = 'MITRA Portal - Your Student Account Credentials';
  const html = getRegistrationHtmlTemplate({ studentName, toEmail: recipient, erpNumber, password });
  const from = getSender();

  console.log('[Email Service]: Dispatching credentials email...');

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from,
      to: recipient,
      subject,
      html
    });

    console.log(`[Email Service]: Email Sent Successfully - Recipient: ${recipient}, MessageId: ${info.messageId}`);
    return { success: true, status: 'Email Sent', method: 'mailtrap', messageId: info.messageId, recipient };
  } catch (err) {
    cachedTransporter = null; // reset pooled transporter if connection broke
    console.error(`[Email Service]: Email Sending Failed - Recipient: ${recipient}, Error: ${err.message}`);
    return { success: false, status: 'Email Failed', method: 'mailtrap', error: err.message, recipient };
  }
};

/**
 * Dispatches password reset notification email through Mailtrap SMTP
 */
exports.sendPasswordResetEmail = async ({ toEmail, studentName, password }) => {
  const recipient = (toEmail || '').trim();
  const subject = 'MITRA Portal - Password Reset Notification';
  const html = getResetHtmlTemplate({ studentName, toEmail: recipient, password });
  const from = getSender();

  console.log('[Email Service]: Dispatching password reset email...');

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from,
      to: recipient,
      subject,
      html
    });

    console.log(`[Email Service]: Email Sent Successfully - Recipient: ${recipient}, MessageId: ${info.messageId}`);
    return { success: true, status: 'Email Sent', method: 'mailtrap', messageId: info.messageId, recipient };
  } catch (err) {
    cachedTransporter = null;
    console.error(`[Email Service]: Email Sending Failed - Recipient: ${recipient}, Error: ${err.message}`);
    return { success: false, status: 'Email Failed', method: 'mailtrap', error: err.message, recipient };
  }
};

/**
 * Diagnostic helper to safely inspect Mailtrap SMTP configuration status
 */
exports.getEmailDiagnostics = () => {
  const host = (process.env.MAIL_HOST || '').trim();
  const port = process.env.MAIL_PORT || '2525';
  const user = (process.env.MAIL_USER || '').trim();
  const pass = (process.env.MAIL_PASSWORD || '').trim();
  const from = (process.env.EMAIL_FROM || '').trim();
  const frontendUrl = getLoginUrl();

  const isConfigured = Boolean(host && user && pass && from);

  return {
    provider: 'Mailtrap SMTP + Nodemailer (Connection Pooled)',
    configured: isConfigured,
    status: isConfigured ? 'Ready' : 'Incomplete Configuration',
    config: {
      host: host || 'NOT_SET',
      port,
      userSet: Boolean(user),
      passwordSet: Boolean(pass),
      emailFrom: from || 'NOT_SET',
      loginUrl: frontendUrl
    }
  };
};

/**
 * Live test email dispatcher for Mailtrap SMTP
 */
exports.sendTestEmail = async (targetEmail) => {
  const recipient = (targetEmail || '').trim();
  if (!recipient) {
    return {
      success: false,
      status: 'Email Failed',
      error: 'Target recipient email is required (e.g. ?to=your_email@domain.com).'
    };
  }

  const subject = 'MITRA Portal - Mailtrap SMTP Delivery Test';
  const loginUrl = getLoginUrl();
  const html = `
    <div style="font-family: sans-serif; padding: 24px; border: 1px solid #2563eb; border-radius: 12px; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #1e3a8a; margin-top: 0;">MITRA Portal - Mailtrap Test</h2>
      <p>This is a test verification email sent from the MITRA backend via <strong>Mailtrap SMTP + Nodemailer (Connection Pooled)</strong>.</p>
      <p><strong>Configured Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
      <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      <p style="color: #16a34a; font-weight: bold; margin-bottom: 0;">✓ If you see this in Mailtrap Inbox, your email service is fully operational.</p>
    </div>
  `;

  console.log('[Email Service]: Dispatching test email...');

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: getSender(),
      to: recipient,
      subject,
      html
    });

    console.log(`[Email Service]: Email Sent Successfully - Recipient: ${recipient}, MessageId: ${info.messageId}`);
    return {
      success: true,
      status: 'Email Sent',
      provider: 'Mailtrap SMTP',
      messageId: info.messageId,
      to: recipient
    };
  } catch (err) {
    cachedTransporter = null;
    console.error(`[Email Service]: Email Sending Failed - Recipient: ${recipient}, Error: ${err.message}`);
    return {
      success: false,
      status: 'Email Failed',
      provider: 'Mailtrap SMTP',
      error: err.message,
      to: recipient
    };
  }
};
