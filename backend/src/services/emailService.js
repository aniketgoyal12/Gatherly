import nodemailer from 'nodemailer';
import { generateQrDataUrl } from './qrService.js';

/**
 * Gatherly Email Service (Nodemailer)
 * 
 * Features:
 * - SMTP configuration with environment variable support
 * - Automatic ethereal / console fallback in local development (zero crashing)
 * - Beautiful branded HTML email templates adhering to 60:30:10 (Navy / Cream / Coral)
 * - Inline QR code rendering for ticket confirmation
 */

let transporter = null;

const createTransporter = async () => {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
    console.log(`[Email Service] Configured live SMTP transport with host: ${SMTP_HOST}`);
    return transporter;
  }

  // Development fallback: Log email or use mock transport
  console.log('[Email Service] No SMTP credentials in environment. Using in-memory / console email logger.');
  transporter = {
    sendMail: async (mailOptions) => {
      console.log('\n================== [EMAIL DISPATCHED (MOCK)] ==================');
      console.log(`To:      ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`Preview: ${mailOptions.text || '(HTML Body Rendered)'}`);
      console.log('=================================================================\n');
      return { messageId: `mock_${Date.now()}`, response: 'Mock email accepted' };
    },
  };

  return transporter;
};

/**
 * Base Email Sender
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transport = await createTransporter();
    const from = process.env.EMAIL_FROM || '"Gatherly Events" <notifications@gatherly.events>';
    const info = await transport.sendMail({
      from,
      to,
      subject,
      text: text || subject,
      html,
    });
    return info;
  } catch (error) {
    console.error(`[Email Service] Error sending email to ${to}:`, error.message);
    // Don't throw fatal error on email failure so API flow remains robust
    return { error: error.message };
  }
};

/**
 * 1. Ticket Confirmation Email with Embedded QR Code
 */
export const sendTicketConfirmationEmail = async ({
  to,
  attendeeName = 'Attendee',
  eventTitle,
  eventDate,
  venueName = 'Gatherly Venue',
  ticketId,
  ticketType = 'Standard',
  rawQrToken,
}) => {
  let qrDataUrl = '';
  if (rawQrToken) {
    try {
      qrDataUrl = await generateQrDataUrl(rawQrToken);
    } catch (err) {
      console.warn('[Email Service] QR rendering failed for email:', err.message);
    }
  }

  const formattedDate = eventDate ? new Date(eventDate).toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) : 'Scheduled Event';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ticket Confirmation - Gatherly</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0; }
        .header { background-color: #0f172a; padding: 28px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
        .header p { margin: 6px 0 0 0; color: #94a3b8; font-size: 14px; }
        .content { padding: 32px 28px; }
        .greeting { font-size: 18px; font-weight: 600; margin-bottom: 12px; }
        .ticket-card { background: #f1f5f9; border-radius: 10px; padding: 24px; text-align: center; margin: 24px 0; border: 1px dashed #cbd5e1; }
        .ticket-title { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
        .ticket-meta { font-size: 14px; color: #475569; margin: 4px 0; }
        .qr-wrapper { margin: 20px auto; background: #ffffff; display: inline-block; padding: 12px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .qr-img { width: 180px; height: 180px; display: block; }
        .badge { display: inline-block; background-color: #f97316; color: #ffffff; font-weight: 600; font-size: 12px; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 12px; }
        .ticket-id { font-family: monospace; font-size: 12px; color: #64748b; margin-top: 8px; }
        .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Gatherly Events</h1>
          <p>Your Official Event Pass</p>
        </div>
        <div class="content">
          <div class="greeting">Hi ${attendeeName},</div>
          <p>You're confirmed! Your registration has been verified. Present the QR code below at the venue entrance for gate check-in.</p>
          
          <div class="ticket-card">
            <span class="badge">${ticketType} Pass</span>
            <div class="ticket-title">${eventTitle}</div>
            <div class="ticket-meta">📅 ${formattedDate}</div>
            <div class="ticket-meta">📍 ${venueName}</div>
            
            ${qrDataUrl ? `
            <div class="qr-wrapper">
              <img src="${qrDataUrl}" alt="Check-in QR Code" class="qr-img" />
            </div>
            ` : ''}
            <div class="ticket-id">Ticket Reference: #${ticketId}</div>
          </div>
          
          <p style="font-size: 13px; color: #64748b; text-align: center;">Tip: You can take a screenshot or access this pass offline anytime under <strong>My Tickets</strong> in the Gatherly app.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Gatherly Technologies Inc. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to,
    subject: `🎟️ Ticket Confirmed: ${eventTitle}`,
    text: `Hi ${attendeeName}, your ticket for "${eventTitle}" is confirmed! Ticket ID: ${ticketId}. Present your QR code at check-in.`,
    html,
  });
};

/**
 * 2. Waitlist Promotion Notification Email
 */
export const sendWaitlistPromotionEmail = async ({
  to,
  attendeeName = 'Attendee',
  eventTitle,
  claimDeadlineMinutes = 15,
  claimUrl = 'http://localhost:5173/my-tickets',
}) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Seat Available - Claim Your Ticket</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
        .header { background-color: #0f172a; padding: 24px; text-align: center; color: #ffffff; }
        .content { padding: 32px 24px; text-align: center; }
        .alert-pill { display: inline-block; background-color: #fef3c7; color: #b45309; font-weight: 700; font-size: 13px; padding: 6px 14px; border-radius: 9999px; margin-bottom: 16px; }
        .title { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
        .btn { display: inline-block; background-color: #f97316; color: #ffffff; text-decoration: none; font-weight: 600; padding: 12px 28px; border-radius: 8px; margin: 20px 0; font-size: 16px; }
        .deadline { font-size: 14px; color: #ef4444; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin:0;">Gatherly Waitlist Alert</h2>
        </div>
        <div class="content">
          <div class="alert-pill">🎉 You're Next in Line!</div>
          <div class="title">A Seat Opened Up for "${eventTitle}"</div>
          <p style="color: #475569; font-size: 15px;">Hi ${attendeeName}, a reserved spot has just been released and offered to you because you're at the top of the waitlist.</p>
          
          <a href="${claimUrl}" class="btn">Claim Ticket Now</a>
          
          <p class="deadline">⏰ Action required: You have ${claimDeadlineMinutes} minutes to complete registration before this spot is passed to the next attendee.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to,
    subject: `⚡ Good news! Seat opened up for: ${eventTitle}`,
    text: `Hi ${attendeeName}, a seat opened up for "${eventTitle}"! Claim it within ${claimDeadlineMinutes} minutes at ${claimUrl}`,
    html,
  });
};

/**
 * 3. 24-Hour Event Reminder Email
 */
export const sendEventReminderEmail = async ({
  to,
  attendeeName = 'Attendee',
  eventTitle,
  eventDate,
  venueName = 'Event Venue',
  ticketId,
}) => {
  const formattedDate = eventDate ? new Date(eventDate).toLocaleString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) : 'Tomorrow';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Event Reminder - Gatherly</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
        .header { background-color: #0f172a; padding: 24px; text-align: center; color: #ffffff; }
        .content { padding: 30px 24px; }
        .badge { background: #3b82f6; color: #fff; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin:0;">Gatherly Reminder</h2>
        </div>
        <div class="content">
          <span class="badge">Starting in 24 Hours</span>
          <h2 style="color: #0f172a; margin-top: 14px;">"${eventTitle}" is tomorrow!</h2>
          <p style="color: #475569;">Hi ${attendeeName}, this is a friendly reminder that your upcoming event takes place tomorrow.</p>
          <div style="background:#f1f5f9; padding: 16px; border-radius: 8px; margin: 18px 0;">
            <p style="margin: 4px 0;"><strong>Date & Time:</strong> ${formattedDate}</p>
            <p style="margin: 4px 0;"><strong>Location:</strong> ${venueName}</p>
            <p style="margin: 4px 0;"><strong>Ticket ID:</strong> #${ticketId}</p>
          </div>
          <p style="color: #64748b; font-size: 13px;">Don't forget to have your QR code ready on your phone when arriving at the venue.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to,
    subject: `⏰ Reminder: "${eventTitle}" starts in 24 hours!`,
    text: `Hi ${attendeeName}, "${eventTitle}" starts in 24 hours at ${venueName}. Have your QR ticket ready!`,
    html,
  });
};

/**
 * 4. Password Reset Email
 */
export const sendPasswordResetEmail = async ({ to, name = 'User', resetUrl }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: sans-serif; padding: 20px; background: #f8fafc;">
      <div style="max-width: 500px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 10px; border: 1px solid #e2e8f0;">
        <h2 style="color: #0f172a; margin-top: 0;">Reset Your Gatherly Password</h2>
        <p>Hi ${name},</p>
        <p>We received a request to reset your password. Click the link below to choose a new password:</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #0f172a; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </p>
        <p style="font-size: 12px; color: #64748b;">This link is valid for 15 minutes. If you did not request this, you can safely ignore this email.</p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to,
    subject: '🔒 Reset Your Gatherly Password',
    text: `Hi ${name}, reset your password here: ${resetUrl} (Valid for 15 minutes)`,
    html,
  });
};

export default {
  sendEmail,
  sendTicketConfirmationEmail,
  sendWaitlistPromotionEmail,
  sendEventReminderEmail,
  sendPasswordResetEmail,
};
