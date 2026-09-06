const dns = require('dns');
const nodemailer = require('nodemailer');

// 1. Force IPv4 first in Node.js DNS
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

// 2. Disable IPv6 in Nodemailer's internal network interface detector to prevent ENETUNREACH on Render
try {
  const nodemailerShared = require('nodemailer/lib/shared');
  if (nodemailerShared && nodemailerShared.networkInterfaces) {
    nodemailerShared.networkInterfaces = Object.keys(nodemailerShared.networkInterfaces).reduce((acc, k) => {
      acc[k] = nodemailerShared.networkInterfaces[k].filter(i => i.family === 'IPv4' || i.family === 4);
      return acc;
    }, {});
  }
} catch {
  // Safe ignore if shared module structure differs
}

let cachedTransporter = null;
let cachedPort = null;

/**
 * Resolves a hostname strictly to its IPv4 address (e.g. smtp.hostinger.com -> 172.65.255.143)
 * Completely eliminates ENETUNREACH IPv6 routing errors on cloud hosts like Render.
 */
const resolveIPv4 = async (hostname) => {
  try {
    const res = await dns.promises.lookup(hostname, { family: 4 });
    if (res && res.address) {
      return res.address;
    }
  } catch (err) {
    console.warn(`[Email Service]: Direct IPv4 lookup for ${hostname} failed: ${err.message}. Using hostname.`);
  }
  return hostname;
};

/**
 * Returns clean, RFC 5322 formatted sender address from environment variables.
 * Formats: '"MITRA Employability Portal" <contact@mitraemployabilityportal.in>'
 */
const getSender = () => {
  let from = (process.env.EMAIL_FROM || '').trim();

  // Strip accidental outer quotes added in Render dashboard or .env files
  if ((from.startsWith('"') && from.endsWith('"')) || (from.startsWith("'") && from.endsWith("'"))) {
    from = from.slice(1, -1).trim();
  }

  const mailUser = (process.env.MAIL_USER || '').trim();

  if (!from && !mailUser) {
    throw new Error('Neither EMAIL_FROM nor MAIL_USER is configured in environment variables');
  }

  // If already formatted like: Name <email@domain.com>
  const match = from.match(/^(?:["']?(.*?)["']?\s*)?<([^>]+)>$/);
  if (match) {
    const displayName = (match[1] || 'MITRA Employability Portal').trim().replace(/['"]/g, '');
    const emailAddress = match[2].trim();
    return `"${displayName}" <${emailAddress}>`;
  }

  // If set to just an email address
  const targetEmail = from.includes('@') ? from : mailUser;
  return `"MITRA Employability Portal" <${targetEmail}>`;
};

/**
 * Creates a Nodemailer transporter locked strictly to IPv4.
 * Supports port 465 (SSL) and port 587 (STARTTLS).
 */
const createTransporterForPort = async (port) => {
  const host = (process.env.MAIL_HOST || 'smtp.hostinger.com').trim();
  const user = (process.env.MAIL_USER || '').trim();
  const pass = (process.env.MAIL_PASSWORD || '').trim();

  if (!host || !user || !pass) {
    const missing = [];
    if (!host) missing.push('MAIL_HOST');
    if (!user) missing.push('MAIL_USER');
    if (!pass) missing.push('MAIL_PASSWORD');
    throw new Error(`Missing required SMTP environment variables: ${missing.join(', ')}`);
  }

  const isSecure = port === 465;
  const ipv4Address = await resolveIPv4(host);

  const transportOptions = {
    host: ipv4Address, // Direct IPv4 connection (e.g. 172.65.255.143)
    port,
    secure: isSecure,  // true for 465 (SSL), false for 587 (STARTTLS)
    family: 4,         // Force IPv4 socket
    auth: {
      user,
      pass
    },
    requireTLS: port === 587,
    tls: {
      servername: host, // Crucial: sets TLS SNI to match the certificate for smtp.hostinger.com
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000
  };

  return nodemailer.createTransport(transportOptions);
};

/**
 * Returns or creates the cached transporter for a given port.
 */
const getTransporter = async (port = null) => {
  const targetPort = port || parseInt((process.env.MAIL_PORT || '465').trim(), 10) || 465;

  if (!cachedTransporter || cachedPort !== targetPort) {
    resetTransporter();
    cachedTransporter = await createTransporterForPort(targetPort);
    cachedPort = targetPort;
  }

  return cachedTransporter;
};

/**
 * Resets the transporter cache
 */
const resetTransporter = () => {
  if (cachedTransporter && typeof cachedTransporter.close === 'function') {
    try {
      cachedTransporter.close();
    } catch {
      // Ignore cleanup error
    }
  }
  cachedTransporter = null;
  cachedPort = null;
};

/**
 * Unified dispatch helper: uses IPv4-enforced SMTP with automatic fallback between Port 465 and Port 587.
 * If Port 465 is blocked or drops, it immediately retries via Port 587 (STARTTLS).
 */
const dispatchEmail = async ({ to, subject, html }) => {
  const from = getSender();
  const configuredPort = parseInt((process.env.MAIL_PORT || '465').trim(), 10) || 465;
  const fallbackPort = configuredPort === 465 ? 587 : 465;

  // 1. Primary Attempt: using configured port (strictly over IPv4)
  try {
    const transporter = await getTransporter(configuredPort);
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html
    });

    return {
      method: `smtp_port_${configuredPort}`,
      messageId: info.messageId,
      accepted: info.accepted,
      response: info.response
    };
  } catch (primaryErr) {
    console.warn(`[Email Service]: Primary port ${configuredPort} failed (${primaryErr.code || primaryErr.message}). Switching to fallback port ${fallbackPort}...`);
    resetTransporter();

    // 2. Secondary Attempt: fallback to alternate port (465 <-> 587)
    try {
      const fallbackTransporter = await createTransporterForPort(fallbackPort);
      const info = await fallbackTransporter.sendMail({
        from,
        to,
        subject,
        html
      });
      console.log(`[Email Service]: Fallback to port ${fallbackPort} succeeded! MessageId: ${info.messageId}`);
      cachedTransporter = fallbackTransporter;
      cachedPort = fallbackPort;

      return {
        method: `smtp_port_${fallbackPort}`,
        messageId: info.messageId,
        accepted: info.accepted,
        response: info.response
      };
    } catch (fallbackErr) {
      console.error(`[Email Service]: Both port ${configuredPort} and port ${fallbackPort} failed: ${fallbackErr.message}`);
      throw fallbackErr;
    }
  }
};

/**
 * Returns dynamic login URL using process.env.FRONTEND_URL
 */
const getLoginUrl = () => {
  const frontendUrl = (process.env.FRONTEND_URL || 'https://mitra-employability-platform.vercel.app').trim().replace(/\/+$/, '');
  return `${frontendUrl}/login`;
};

/**
 * Returns dynamic password reset URL using process.env.FRONTEND_URL and reset token
 */
const getResetPasswordUrl = (token) => {
  const frontendUrl = (process.env.FRONTEND_URL || 'https://mitra-employability-platform.vercel.app').trim().replace(/\/+$/, '');
  return `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
};

/**
 * HTML Template for Student / User Registration Credentials
 */
const getRegistrationHtmlTemplate = ({ studentName, toEmail, erpNumber, password }) => {
  const loginUrl = getLoginUrl();

  return `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9;">
        <h2 style="color: #1e3a8a; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">MITRA Employability Portal</h2>
        <p style="color: #64748b; font-size: 13px; margin-top: 4px; font-weight: 600;">Student Account Onboarding</p>
      </div>
      
      <!-- Content Box -->
      <div style="padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
        <p style="font-size: 15px; color: #1e293b; margin-top: 0;">Dear <strong>${studentName}</strong>,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
          Your student profile has been registered on the MITRA Employability Platform. You can now access placement drives, career assessments, and skill development modules using the credentials below:
        </p>
        
        <!-- Credentials Table -->
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

      <!-- Action Button -->
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
 * HTML Template for Password Reset Notification (Admin Approved Reset Link)
 */
const getResetHtmlTemplate = ({ studentName, resetLink }) => {
  return `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9;">
        <h2 style="color: #1e3a8a; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">MITRA Employability Portal</h2>
        <p style="color: #64748b; font-size: 13px; margin-top: 4px; font-weight: 600;">Training & Placement Department</p>
      </div>
      
      <!-- Content Box -->
      <div style="padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
        <p style="font-size: 15px; color: #1e293b; margin-top: 0;">Hello <strong>${studentName}</strong>,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
          Your password reset request has been approved by the Training & Placement department.
        </p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
          You can now create your own new password using the secure link below:
        </p>
      </div>

      <!-- Action Button -->
      <div style="margin-top: 24px; text-align: center;">
        <a href="${resetLink}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
          Reset Password &rarr;
        </a>
      </div>

      <div style="margin-top: 24px; padding: 14px; background: #fef3c7; border-radius: 8px; border: 1px solid #fde68a; font-size: 13px; color: #92400e;">
        <strong>Notice:</strong> This link is valid only for the configured reset period and can be used only once. If you did not request a password reset, please contact the Training & Placement department.
      </div>

      <div style="margin-top: 24px; font-size: 13px; color: #64748b; line-height: 1.5;">
        <p style="margin: 0;">Regards,<br><strong>MITRA Employability Portal</strong><br>Training & Placement Department</p>
      </div>

      <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px;">
        © MITRA Employability Platform • Training & Placement Cell
      </p>
    </div>
  `;
};

/**
 * HTML template for Delivery Verification Test Email
 */
const getTestEmailHtmlTemplate = ({ toEmail, senderEmail, providerName, isRender }) => {
  const loginUrl = getLoginUrl();
  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'long'
  });

  return `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9;">
        <h2 style="color: #1e3a8a; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">MITRA Employability Portal</h2>
        <p style="color: #16a34a; font-size: 13px; margin-top: 4px; font-weight: 700;">✓ Email Delivery Test Successful</p>
      </div>
      
      <div style="padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
        <p style="font-size: 15px; color: #1e293b; margin-top: 0;">Hello Administrator / Tester,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
          Your custom domain email delivery service is <strong>fully operational</strong> on the MITRA Employability Platform.
        </p>
        
        <table style="width: 100%; font-size: 13px; margin-top: 16px; border-collapse: separate; border-spacing: 0; background: #ffffff; border-radius: 8px; border: 1px solid #cbd5e1; overflow: hidden;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 14px; color: #64748b; width: 35%; font-weight: 600; background: #f1f5f9;">Sender Account</td>
            <td style="padding: 10px 14px; color: #0f172a; font-family: monospace; font-weight: 700;">${senderEmail}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 14px; color: #64748b; font-weight: 600; background: #f1f5f9;">Delivered To</td>
            <td style="padding: 10px 14px; color: #0f172a; font-family: monospace; font-weight: 700;">${toEmail}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 14px; color: #64748b; font-weight: 600; background: #f1f5f9;">Mail Provider</td>
            <td style="padding: 10px 14px; color: #2563eb; font-weight: 700;">${providerName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 14px; color: #64748b; font-weight: 600; background: #f1f5f9;">Server Environment</td>
            <td style="padding: 10px 14px; color: #0f172a; font-weight: 700;">${isRender ? 'Render Cloud (Production)' : 'Localhost / Development'}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; color: #64748b; font-weight: 600; background: #f1f5f9;">Timestamp (IST)</td>
            <td style="padding: 10px 14px; color: #475569;">${timestamp}</td>
          </tr>
        </table>
      </div>

      <div style="margin-top: 24px; text-align: center;">
        <a href="${loginUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
          Open MITRA Portal &rarr;
        </a>
      </div>

      <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px;">
        © MITRA Employability Platform • Automated Mailer System
      </p>
    </div>
  `;
};

/**
 * Dispatches student / user registration credential email
 */
exports.sendCredentialEmail = async ({ toEmail, studentName, password, erpNumber }) => {
  const recipient = (toEmail || '').trim();
  const subject = 'MITRA Portal - Your Student Account Credentials';
  const html = getRegistrationHtmlTemplate({ studentName, toEmail: recipient, erpNumber, password });

  console.log(`[Email Service]: Dispatching credentials email to ${recipient}...`);

  try {
    const result = await dispatchEmail({ to: recipient, subject, html });
    console.log(`[Email Service]: Credentials email delivered - Recipient: ${recipient}, MessageId: ${result.messageId}`);
    return {
      success: true,
      status: 'Email Sent',
      method: result.method,
      messageId: result.messageId,
      recipient
    };
  } catch (err) {
    resetTransporter();
    const errMsg = err.message || 'Failed to dispatch credentials email';
    console.error(`[Email Service]: Credentials email failed - Recipient: ${recipient}, Error: ${errMsg}`);
    return {
      success: false,
      status: 'Email Failed',
      error: errMsg,
      recipient
    };
  }
};

/**
 * Dispatches password reset notification email with secure link
 */
exports.sendPasswordResetEmail = async ({ toEmail, studentName, resetToken, resetLink }) => {
  const recipient = (toEmail || '').trim();
  const subject = 'MITRA Portal – Password Reset Enabled';
  const targetLink = resetLink || (resetToken ? getResetPasswordUrl(resetToken) : getLoginUrl());
  const html = getResetHtmlTemplate({ studentName, resetLink: targetLink });

  console.log(`[Email Service]: Dispatching password reset email to ${recipient}...`);

  try {
    const result = await dispatchEmail({ to: recipient, subject, html });
    console.log(`[Email Service]: Password reset email delivered - Recipient: ${recipient}, MessageId: ${result.messageId}`);
    return {
      success: true,
      status: 'Email Sent',
      method: result.method,
      messageId: result.messageId,
      recipient,
      resetLink: targetLink
    };
  } catch (err) {
    resetTransporter();
    const errMsg = err.message || 'Failed to dispatch password reset email';
    console.error(`[Email Service]: Password reset email failed - Recipient: ${recipient}, Error: ${errMsg}`);
    return {
      success: false,
      status: 'Email Failed',
      error: errMsg,
      recipient
    };
  }
};

/**
 * Live connection verifier for SMTP credentials.
 * Runs an active handshake with the mail server without sending an email.
 */
exports.verifyConnection = async () => {
  const startTime = Date.now();
  const host = (process.env.MAIL_HOST || 'smtp.hostinger.com').trim();
  const configuredPort = parseInt((process.env.MAIL_PORT || '465').trim(), 10) || 465;
  const user = (process.env.MAIL_USER || '').trim();
  const from = getSender();

  // Try configured port first
  try {
    const transporter = await getTransporter(configuredPort);
    await transporter.verify();

    return {
      success: true,
      provider: host.includes('hostinger') ? 'Hostinger Secure SMTP' : 'Custom SMTP',
      host,
      port: configuredPort,
      user,
      from,
      latencyMs: Date.now() - startTime,
      message: `Successfully authenticated and connected with ${host}:${configuredPort} (IPv4)`
    };
  } catch (primaryErr) {
    const fallbackPort = configuredPort === 465 ? 587 : 465;
    try {
      const fallbackTransporter = await createTransporterForPort(fallbackPort);
      await fallbackTransporter.verify();
      cachedTransporter = fallbackTransporter;
      cachedPort = fallbackPort;

      return {
        success: true,
        provider: host.includes('hostinger') ? 'Hostinger Secure SMTP (Fallback)' : 'Custom SMTP',
        host,
        port: fallbackPort,
        user,
        from,
        latencyMs: Date.now() - startTime,
        message: `Successfully authenticated and connected with ${host}:${fallbackPort} (Fallback IPv4)`
      };
    } catch (fallbackErr) {
      resetTransporter();
      let hint = 'Check your SMTP credentials and cloud network settings.';
      if (primaryErr.code === 'EAUTH') {
        hint = 'Authentication failed. Please verify MAIL_USER and MAIL_PASSWORD in Render.';
      } else if (primaryErr.code === 'ETIMEDOUT' || primaryErr.code === 'ENETUNREACH') {
        hint = 'Connection timed out or network unreachable on Render. Verify outbound networking or test port 587.';
      }

      return {
        success: false,
        provider: 'SMTP',
        code: primaryErr.code || 'UNKNOWN',
        error: primaryErr.message,
        hint,
        latencyMs: Date.now() - startTime
      };
    }
  }
};

/**
 * Diagnostic helper to inspect email configuration status
 */
exports.getEmailDiagnostics = async (verifyLive = false) => {
  const host = (process.env.MAIL_HOST || 'smtp.hostinger.com').trim();
  const port = (process.env.MAIL_PORT || '465').trim();
  const user = (process.env.MAIL_USER || '').trim();
  const pass = (process.env.MAIL_PASSWORD || '').trim();
  const frontendUrl = getLoginUrl();
  const isRender = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID || process.env.IS_PULL_REQUEST);

  let sender = 'NOT_SET';
  try {
    sender = getSender();
  } catch {
    sender = user ? `"MITRA Portal" <${user}>` : 'NOT_SET';
  }

  const isConfigured = Boolean(host && user && pass);

  let provider = `Custom SMTP (${host}:${port})`;
  if (host.toLowerCase().includes('hostinger')) {
    provider = `Hostinger Secure SMTP (${host}:${port})`;
  } else if (host.toLowerCase().includes('gmail')) {
    provider = `Gmail SMTP (${host}:${port})`;
  }

  const result = {
    provider,
    configured: isConfigured,
    environment: isRender ? 'Render Cloud (Production)' : (process.env.NODE_ENV || 'Development / Local'),
    isRender,
    status: isConfigured ? 'Ready' : 'Incomplete Configuration',
    config: {
      smtpHost: host || 'NOT_SET',
      smtpPort: port,
      smtpUser: user || 'NOT_SET',
      passwordConfigured: Boolean(pass),
      senderAddress: sender,
      loginUrl: frontendUrl
    }
  };

  if (verifyLive && isConfigured) {
    result.liveVerification = await exports.verifyConnection();
  }

  return result;
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

  const startTime = Date.now();
  const host = (process.env.MAIL_HOST || 'smtp.hostinger.com').trim();
  const port = (process.env.MAIL_PORT || '465').trim();
  const sender = getSender();
  const isRender = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID);

  const providerName = host.toLowerCase().includes('hostinger')
    ? `Hostinger Secure SMTP (${host}:${port})`
    : `SMTP (${host}:${port})`;

  const subject = 'MITRA Portal - Email Delivery Verification';
  const html = getTestEmailHtmlTemplate({
    toEmail: recipient,
    senderEmail: sender,
    providerName,
    isRender
  });

  console.log(`[Email Service]: Dispatching test email to ${recipient} via ${providerName}...`);

  try {
    const result = await dispatchEmail({ to: recipient, subject, html });
    const latencyMs = Date.now() - startTime;
    console.log(`[Email Service]: Test email sent successfully to ${recipient} (${latencyMs}ms, ID: ${result.messageId})`);

    return {
      success: true,
      status: 'Email Sent',
      provider: result.method,
      providerName,
      messageId: result.messageId,
      accepted: result.accepted || [recipient],
      response: result.response,
      sender,
      to: recipient,
      latencyMs
    };
  } catch (err) {
    resetTransporter();
    const latencyMs = Date.now() - startTime;
    const errMsg = err.message || 'Failed to dispatch test email';
    console.error(`[Email Service]: Test email failed to ${recipient}: ${errMsg} (${latencyMs}ms)`);

    let hint = 'Verify your email password and server port configuration in Render.';
    if (err.code === 'EAUTH') {
      hint = 'Authentication failed. Check your MAIL_USER and MAIL_PASSWORD in Render environment variables.';
    } else if (err.code === 'ETIMEDOUT') {
      hint = 'Connection timed out. On Render, verify whether port 465 (SSL) or port 587 (TLS) is open for your host.';
    }

    return {
      success: false,
      status: 'Email Failed',
      error: errMsg,
      code: err.code || null,
      hint,
      to: recipient,
      sender,
      latencyMs
    };
  }
};
