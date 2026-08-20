const dns = require('dns');
const nodemailer = require('nodemailer');
const axios = require('axios');

// Force IPv4 resolution first to prevent ENETUNREACH IPv6 errors on cloud environments
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

let cachedTransporter = null;

/**
 * Sends email via HTTP REST API (Resend or Brevo) if API keys are configured.
 * This completely avoids Render's firewall blocks on raw SMTP ports (25, 465, 587).
 */
const sendViaHttpApi = async ({ from, to, subject, html }) => {
  const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
  const brevoApiKey = (process.env.BREVO_API_KEY || '').trim();

  // 1. Try Resend HTTP API (Port 443 - 100% reliable on Render/Vercel)
  if (resendApiKey) {
    // Default demo sender for Resend if custom domain not yet verified
    const sender = from.includes('@') ? from : 'MITRA Portal <onboarding@resend.dev>';
    const response = await axios.post(
      'https://api.resend.com/emails',
      {
        from: sender,
        to: Array.isArray(to) ? to : [to],
        subject,
        html
      },
      {
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    return {
      method: 'resend_http_api',
      messageId: response.data.id || 'resend-delivered'
    };
  }

  // 2. Try Brevo HTTP API (Port 443 - 300 free emails/day)
  if (brevoApiKey) {
    let senderName = 'MITRA Employability Portal';
    let senderEmail = 'no-reply@mitra-portal.com';
    const match = from.match(/^(?:(.*)<)?([^>]+)>?$/);
    if (match) {
      if (match[1]) senderName = match[1].trim().replace(/['"]/g, '');
      if (match[2]) senderEmail = match[2].trim();
    }

    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html
      },
      {
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    return {
      method: 'brevo_http_api',
      messageId: response.data.messageId || 'brevo-delivered'
    };
  }

  return null;
};

/**
 * Creates or returns cached Nodemailer transporter with connection pooling.
 * Used for local development or servers where SMTP ports are open.
 */
const getTransporter = () => {
  const host = (process.env.MAIL_HOST || '').trim();
  const port = process.env.MAIL_PORT ? parseInt(process.env.MAIL_PORT, 10) : 465;
  const user = (process.env.MAIL_USER || '').trim();
  const pass = (process.env.MAIL_PASSWORD || '').trim();
  const from = (process.env.EMAIL_FROM || '').trim();

  if (!host || !user || !pass || !from) {
    const missing = [];
    if (!host) missing.push('MAIL_HOST');
    if (!user) missing.push('MAIL_USER');
    if (!pass) missing.push('MAIL_PASSWORD');
    if (!from) missing.push('EMAIL_FROM');
    throw new Error(`Missing required SMTP environment variables: ${missing.join(', ')}`);
  }

  if (!cachedTransporter) {
    const isGmail = host.toLowerCase().includes('gmail');
    const isSecure = port === 465;

    const transportOptions = {
      host: isGmail ? 'smtp.gmail.com' : host,
      port: isGmail ? 465 : port,
      secure: isGmail ? true : isSecure,
      family: 4,
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000
    };

    cachedTransporter = nodemailer.createTransport(transportOptions);
  }

  return cachedTransporter;
};

/**
 * Unified dispatch helper: uses HTTP API (Resend/Brevo) if available, otherwise SMTP
 */
const dispatchEmail = async ({ to, subject, html }) => {
  const from = getSender();

  // Try HTTP REST API first (bypasses Render SMTP port blocks)
  const apiResult = await sendViaHttpApi({ from, to, subject, html });
  if (apiResult) {
    return apiResult;
  }

  // Fallback to Nodemailer SMTP
  const transporter = getTransporter();
  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html
  });

  return {
    method: 'smtp',
    messageId: info.messageId
  };
};

/**
 * Returns sender address strictly from process.env.EMAIL_FROM
 */
const getSender = () => {
  let from = (process.env.EMAIL_FROM || '').trim();
  // Strip accidental surrounding quotes if copied with quotes
  if ((from.startsWith('"') && from.endsWith('"')) || (from.startsWith("'") && from.endsWith("'"))) {
    from = from.slice(1, -1).trim();
  }
  if (!from) {
    if (process.env.RESEND_API_KEY) {
      return 'MITRA Portal <onboarding@resend.dev>';
    }
    if (process.env.MAIL_USER) {
      return `MITRA Portal <${process.env.MAIL_USER}>`;
    }
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
        <p style="color: #64748b; font-size: 13px; margin-top: 4px; font-weight: 600;">Student Account Onboarding</p>
      </div>
      
      <div style="padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
        <p style="font-size: 15px; color: #1e293b; margin-top: 0;">Dear <strong>${studentName}</strong>,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
          Your student profile has been registered on the MITRA Employability Platform. You can now access placement drives, career assessments, and skill development modules using the credentials below:
        </p>
        
        <table style="width: 100%; font-size: 14px; margin-top: 16px; border-collapse: separate; border-spacing: 0; background: #ffffff; border-radius: 8px; border: 1px solid #cbd5e1; overflow: hidden;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 14px; color: #64748b; width: 40%; font-weight: 600; background: #f1f5f9;">ERP / Roll Number</td>
            <td style="padding: 10px 14px; color: #0f172a; font-family: monospace; font-weight: 700;">${erpNumber || 'N/A'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 14px; color: #64748b; font-weight: 600; background: #f1f5f9;">Login Email</td>
            <td style="padding: 10px 14px; color: #0f172a; font-family: monospace; font-weight: 700;">${toEmail}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; color: #64748b; font-weight: 600; background: #f1f5f9;">Initial Password</td>
            <td style="padding: 10px 14px; color: #2563eb; font-weight: 800; font-family: monospace; font-size: 16px; letter-spacing: 0.5px;">${password}</td>
          </tr>
        </table>
      </div>

      <div style="margin-top: 24px; text-align: center;">
        <a href="${loginUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
          Sign In to Your Account &rarr;
        </a>
      </div>

      <div style="margin-top: 24px; padding: 14px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">
        <strong>Important:</strong> For security purposes, please change your password after your first successful login.
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
 * Dispatches student registration credential email
 */
exports.sendCredentialEmail = async ({ toEmail, studentName, password, erpNumber }) => {
  const recipient = (toEmail || '').trim();
  const subject = 'MITRA Portal - Your Student Account Credentials';
  const html = getRegistrationHtmlTemplate({ studentName, toEmail: recipient, erpNumber, password });

  console.log('[Email Service]: Dispatching credentials email...');

  try {
    const result = await dispatchEmail({ to: recipient, subject, html });
    console.log(`[Email Service]: Email Sent Successfully - Recipient: ${recipient}, Method: ${result.method}, MessageId: ${result.messageId}`);
    return { success: true, status: 'Email Sent', method: result.method, messageId: result.messageId, recipient };
  } catch (err) {
    cachedTransporter = null;
    const errMsg = err.response?.data?.message || err.response?.data?.error || err.message;
    console.error(`[Email Service]: Email Sending Failed - Recipient: ${recipient}, Error: ${errMsg}`);
    return { success: false, status: 'Email Failed', error: errMsg, recipient };
  }
};

/**
 * Dispatches password reset notification email
 */
exports.sendPasswordResetEmail = async ({ toEmail, studentName, password }) => {
  const recipient = (toEmail || '').trim();
  const subject = 'MITRA Portal - Password Reset Notification';
  const html = getResetHtmlTemplate({ studentName, toEmail: recipient, password });

  console.log('[Email Service]: Dispatching password reset email...');

  try {
    const result = await dispatchEmail({ to: recipient, subject, html });
    console.log(`[Email Service]: Email Sent Successfully - Recipient: ${recipient}, Method: ${result.method}, MessageId: ${result.messageId}`);
    return { success: true, status: 'Email Sent', method: result.method, messageId: result.messageId, recipient };
  } catch (err) {
    cachedTransporter = null;
    const errMsg = err.response?.data?.message || err.response?.data?.error || err.message;
    console.error(`[Email Service]: Email Sending Failed - Recipient: ${recipient}, Error: ${errMsg}`);
    return { success: false, status: 'Email Failed', error: errMsg, recipient };
  }
};

/**
 * Diagnostic helper to inspect email configuration status
 */
exports.getEmailDiagnostics = () => {
  const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
  const brevoApiKey = (process.env.BREVO_API_KEY || '').trim();
  const host = (process.env.MAIL_HOST || '').trim();
  const port = process.env.MAIL_PORT || '465';
  const user = (process.env.MAIL_USER || '').trim();
  const pass = (process.env.MAIL_PASSWORD || '').trim();
  const from = (process.env.EMAIL_FROM || '').trim();
  const frontendUrl = getLoginUrl();

  const provider = resendApiKey
    ? 'Resend HTTP REST API (Port 443 - Cloud Optimized)'
    : brevoApiKey
    ? 'Brevo HTTP REST API (Port 443 - Cloud Optimized)'
    : 'Nodemailer SMTP';

  const isConfigured = Boolean(resendApiKey || brevoApiKey || (host && user && pass));

  return {
    provider,
    configured: isConfigured,
    status: isConfigured ? 'Ready' : 'Incomplete Configuration',
    config: {
      usingHttpApi: Boolean(resendApiKey || brevoApiKey),
      resendKeySet: Boolean(resendApiKey),
      brevoKeySet: Boolean(brevoApiKey),
      smtpHost: host || 'NOT_SET',
      smtpPort: port,
      emailFrom: from || (resendApiKey ? 'onboarding@resend.dev' : 'NOT_SET'),
      loginUrl: frontendUrl
    }
  };
};

/**
 * Live test email dispatcher
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

  const subject = 'MITRA Portal - Email Delivery Test';
  const loginUrl = getLoginUrl();
  const html = `
    <div style="font-family: sans-serif; padding: 24px; border: 1px solid #2563eb; border-radius: 12px; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #1e3a8a; margin-top: 0;">MITRA Portal - Delivery Test</h2>
      <p>This is a test verification email sent from the MITRA backend.</p>
      <p><strong>Configured Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
      <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      <p style="color: #16a34a; font-weight: bold; margin-bottom: 0;">✓ If you see this in your inbox, your email service is fully operational.</p>
    </div>
  `;

  console.log('[Email Service]: Dispatching test email...');

  try {
    const result = await dispatchEmail({ to: recipient, subject, html });
    console.log(`[Email Service]: Email Sent Successfully - Recipient: ${recipient}, Method: ${result.method}, MessageId: ${result.messageId}`);
    return {
      success: true,
      status: 'Email Sent',
      provider: result.method,
      messageId: result.messageId,
      to: recipient
    };
  } catch (err) {
    cachedTransporter = null;
    const errMsg = err.response?.data?.message || err.response?.data?.error || err.message;
    console.error(`[Email Service]: Email Sending Failed - Recipient: ${recipient}, Error: ${errMsg}`);
    return {
      success: false,
      status: 'Email Failed',
      error: errMsg,
      to: recipient
    };
  }
};
