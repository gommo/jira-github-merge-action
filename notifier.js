/**
 * notifier.js
 * Combines email and Slack notification functionality
 */

const { sendEmailNotification } = require('./email-notifier');
const { sendSlackNotification } = require('./slack-notifier');

/**
 * Send notifications via email and Slack
 * 
 * @param {Object} config - Configuration object
 * @param {string} message - Message body in markdown format
 * @param {string} sourceBranch - Source branch name
 * @param {string} targetBranch - Target branch name
 * @param {boolean} success - Whether the operation was successful
 * @returns {Promise<void>}
 */
async function sendNotifications(config, message, sourceBranch, targetBranch, success) {
  const subject = success
    ? `Release Deployed: ${sourceBranch} → ${targetBranch}`
    : `Release Failed: ${sourceBranch} → ${targetBranch}`;
  
  // Send email notification
  if (config.emailEnabled) {
    await sendEmailNotification(config, subject, message);
  }
  
  // Send Slack notification
  if (config.slackEnabled && config.slackWebhookUrl) {
    await sendSlackNotification(config, subject, message, success);
  }
}

module.exports = {
  sendNotifications,
  sendEmailNotification,
  sendSlackNotification
}; 