const axios = require('axios');
const nodemailer = require('nodemailer');

const getHtmlTemplate = ({ studentName, toEmail, erpNumber, password }) => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9;">
        <h2 style="color: #1e3a8a; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">MITRA Employability Portal</h2>
        <p style="color: #64748b; font-size: 13px; margin-top: 4px; font-weight: 600;">Institutional Student Credentials & Access Pass</p>
      </div>
      
      <div style="padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
        <p style="font-size: 15px; color: #1e293b; margin-top: 0;">Dear <strong>${studentName}</strong>,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
          Welcome to the MITRA Employability Platform. Your student account has been successfully provisioned. Below are your official sign-in credentials:
        </p>
        
        <table style="width: 100%; font-size: 14px; margin-top: 16px; border-collapse: separate; border-spacing: 0; background: #ffffff; border-radius: 8px; border: 1px solid #cbd5e1; overflow: hidden;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 14px; color: #64748b; width: 40%; font-weight: 600; background: #f1f5f9;">Institutional Email</td>
            <td style="padding: 10px 14px; color: #0f172a; font-family: monospace; font-weight: 700;">${toEmail}</td>
          </tr>
          ${erpNumber ? `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 14px; color: #64748b; font-weight: 600; background: #f1f5f9;">ERP / Roll Number</td>
            <td style="padding: 10px 14px; color: #0f172a; font-family: monospace; font-weight: 700;">${erpNumber}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 10px 14px; color: #64748b; font-weight: 600; background: #f1f5f9;">Temporary Password</td>
            <td style="padding: 10px 14px; color: #2563eb; font-weight: 800; font-family: monospace; font-size: 16px; letter-spacing: 0.5px;">${password}</td>
          </tr>
        </table>
      </div>

      <div style="margin-top: 20px; padding: 14px; background: #eff6ff; border-radius: 8px; border: 1px solid #bfdbfe; font-size: 13px; color: #1e40af;">
        <strong>Quick Tip:</strong> Please keep these credentials confidential. You can change your password anytime after signing in from your profile settings.
      </div>

      <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px;">
        © 2026 MITRA Portal • Institutional Placement & Employability Suite
      </p>
    </div>
  `;
};

exports.sendCredentialEmail = async ({ toEmail, studentName, password, erpNumber }) => {
  const emailHtml = getHtmlTemplate({ studentName, toEmail, erpNumber, password });
  const subject = 'MITRA Portal - Your Student Account Credentials';

  // 1. Check if SMTP configuration is present (Gmail or custom SMTP)
  const smtpUser = (process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.EMAIL_PASS || process.env.SMTP_PASS || '').replace(/\s+/g, '');

  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      const info = await transporter.sendMail({
        from: `"MITRA Portal" <${smtpUser}>`,
        to: toEmail.trim(),
        subject,
        html: emailHtml
      });

      console.log(`[Email Service - SMTP]: Credentials email successfully delivered to ${toEmail}. MessageId: ${info.messageId}`);
      return { success: true, method: 'smtp', messageId: info.messageId };
    } catch (smtpErr) {
      console.error('[Email Service - SMTP Error]:', smtpErr.message);
    }
  }

  // 2. Try Resend API if RESEND_API_KEY is available
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  if (resendApiKey) {
    try {
      const res = await axios.post(
        'https://api.resend.com/emails',
        {
          from: resendFrom,
          to: toEmail,
          subject,
          html: emailHtml
        },
        {
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`[Email Service - Resend]: Credentials email dispatched to ${toEmail}. Id: ${res.data?.id}`);
      return { success: true, method: 'resend', id: res.data?.id };
    } catch (resendErr) {
      const errDetail = resendErr?.response?.data;
      console.warn('[Email Service - Resend Warning]: Failed to send via Resend API:');
      if (errDetail?.statusCode === 403) {
        console.warn(`[Email Service Notice]: Resend test sandbox only permits sending to account owner email (${errDetail.message}). For arbitrary student emails, configure Gmail SMTP (EMAIL_USER & EMAIL_PASS) in server/.env or verify your custom domain on Resend.`);
      } else {
        console.warn(errDetail || resendErr.message);
      }
    }
  }

  // 3. Fallback Log
  console.log(`[Email Service - Local Passcode]: Credentials generated for [${toEmail}]: Password = ${password}`);
  return { success: false, method: 'local', message: 'Credentials generated and retained.' };
};

const getResetHtmlTemplate = ({ studentName, toEmail, password }) => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9;">
        <h2 style="color: #1e3a8a; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">MITRA Employability Portal</h2>
        <p style="color: #64748b; font-size: 13px; margin-top: 4px; font-weight: 600;">Password Reset Notification</p>
      </div>
      
      <div style="padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
        <p style="font-size: 15px; color: #1e293b; margin-top: 0;">Hello <strong>${studentName}</strong>,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
          A password reset request was received for your account. Below is your new temporary sign-in password:
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

      <div style="margin-top: 20px; padding: 14px; background: #fef2f2; border-radius: 8px; border: 1px solid #fecaca; font-size: 13px; color: #991b1b;">
        <strong>Security Notice:</strong> If you did not request this password reset, please contact the T&P Department immediately.
      </div>

      <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px;">
        © 2026 MITRA Portal • Institutional Placement & Employability Suite
      </p>
    </div>
  `;
};

exports.sendPasswordResetEmail = async ({ toEmail, studentName, password }) => {
  const emailHtml = getResetHtmlTemplate({ studentName, toEmail, password });
  const subject = 'MITRA Portal - Your New Password';

  const smtpUser = (process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.EMAIL_PASS || process.env.SMTP_PASS || '').replace(/\s+/g, '');

  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      const info = await transporter.sendMail({
        from: `"MITRA Portal" <${smtpUser}>`,
        to: toEmail.trim(),
        subject,
        html: emailHtml
      });

      console.log(`[Email Service - Reset SMTP]: Password reset email delivered to ${toEmail}. MessageId: ${info.messageId}`);
      return { success: true, method: 'smtp', messageId: info.messageId };
    } catch (smtpErr) {
      console.error('[Email Service - Reset SMTP Error]:', smtpErr.message);
    }
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  if (resendApiKey) {
    try {
      const res = await axios.post(
        'https://api.resend.com/emails',
        {
          from: resendFrom,
          to: toEmail,
          subject,
          html: emailHtml
        },
        {
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return { success: true, method: 'resend', id: res.data?.id };
    } catch (resendErr) {
      console.warn('[Email Service - Reset Resend Error]:', resendErr?.response?.data || resendErr.message);
    }
  }

  console.log(`[Email Service - Reset Local Passcode]: Reset password for [${toEmail}]: Password = ${password}`);
  return { success: false, method: 'local', message: 'Reset password generated.' };
};


