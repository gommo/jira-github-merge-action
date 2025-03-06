/**
 * email-notifier.js
 * Handles email notifications for the JIRA merge action
 */

const nodemailer = require('nodemailer');

/**
 * Send email notification
 * 
 * @param {Object} config - Configuration object with email settings
 * @param {string} subject - Subject line for the email
 * @param {string} message - Message body in markdown format
 * @returns {Promise<void>}
 */
async function sendEmailNotification(config, subject, message) {
  try {
    if (!config.emailEnabled) {
      console.log('Email notifications are disabled');
      return;
    }

    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass
      }
    });
    
    await transporter.sendMail({
      from: config.emailFrom,
      to: config.emailTo.join(', '),
      subject,
      text: message,
      html: message.replace(/\n/g, '<br>').replace(/## (.+)/g, '<h2>$1</h2>')
    });
    
    console.log('Email notification sent successfully');
  } catch (error) {
    console.error('Error sending email notification:', error.message);
  }
}

module.exports = {
  sendEmailNotification
}; 