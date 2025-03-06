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

    // Extract repository name from subject if present
    let repoInfo = '';
    const repoMatch = subject.match(/\[(.*?)\]/);
    if (repoMatch && repoMatch[1]) {
      repoInfo = `<p><strong>Repository:</strong> ${repoMatch[1]}</p>`;
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
    
    // Create HTML version with repository info
    const htmlMessage = `
      ${repoInfo}
      ${message.replace(/\n/g, '<br>').replace(/## (.+)/g, '<h2>$1</h2>')}
    `;
    
    await transporter.sendMail({
      from: config.emailFrom,
      to: config.emailTo.join(', '),
      subject,
      text: message,
      html: htmlMessage
    });
    
    console.log('Email notification sent successfully');
  } catch (error) {
    console.error('Error sending email notification:', error.message);
  }
}

module.exports = {
  sendEmailNotification
}; 