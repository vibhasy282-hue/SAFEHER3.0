const logger = require('../utils/logger');
const { encrypt } = require('../utils/encryption');

// SMS Service using Twilio (configured if credentials available)
const sendSMS = async (to, message) => {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      logger.warn('Twilio not configured, SMS not sent');
      return { success: false, message: 'SMS service not configured' };
    }

    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });

    return { success: true, sid: result.sid };
  } catch (error) {
    logger.error('SMS send error:', error);
    return { success: false, message: error.message };
  }
};

// Email Service using Nodemailer
const sendEmail = async (to, subject, html) => {
  try {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      logger.warn('SMTP not configured, email not sent');
      return { success: false, message: 'Email service not configured' };
    }

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const result = await transporter.sendMail({
      from: `"SafeHer Emergency" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html
    });

    return { success: true, messageId: result.messageId };
  } catch (error) {
    logger.error('Email send error:', error);
    return { success: false, message: error.message };
  }
};

const sendEmergencyAlert = async (contact, emergencyLog, user) => {
  try {
    const location = emergencyLog.location;
    const mapsUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    const timestamp = new Date(emergencyLog.createdAt).toLocaleString();

    const message = `\u{1F6A8} SAFEHER EMERGENCY ALERT\u{1F6A8}\n\n${user.name} has triggered an emergency!\n\nType: ${emergencyLog.type}\nSeverity: ${emergencyLog.severity}\nTime: ${timestamp}\n\nLocation: ${location.address || 'Unknown'}\nMaps: ${mapsUrl}\n\nPlease respond immediately!`;

    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #1a1a2e; color: white;">
        <h1 style="color: #e94560;">\u{1F6A8} SafeHer Emergency Alert</h1>
        <p><strong>${user.name}</strong> has triggered an emergency!</p>
        <p><strong>Type:</strong> ${emergencyLog.type}</p>
        <p><strong>Severity:</strong> ${emergencyLog.severity}</p>
        <p><strong>Time:</strong> ${timestamp}</p>
        <p><strong>Location:</strong> ${location.address || 'Unknown'}</p>
        <a href="${mapsUrl}" style="display: inline-block; padding: 12px 24px; background: #e94560; color: white; text-decoration: none; border-radius: 6px;">View on Map</a>
      </div>
    `;

    const results = [];

    if (contact.notifyMethods?.sms && contact.phone) {
      results.push(await sendSMS(contact.phone, message));
    }

    if (contact.notifyMethods?.email && contact.email) {
      results.push(await sendEmail(contact.email, `Emergency Alert - ${user.name}`, htmlMessage));
    }

    if (contact.notifyMethods?.call && contact.phone) {
      // Placeholder for call functionality
      logger.info(`Call alert queued for ${contact.phone}`);
    }

    logger.info(`Emergency alerts sent to ${contact.name}:`, results);
    return results;
  } catch (error) {
    logger.error('Send emergency alert error:', error);
    return [{ success: false, message: error.message }];
  }
};

module.exports = { sendEmergencyAlert, sendSMS, sendEmail };
