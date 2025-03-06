/**
 * slack-notifier.js
 * Handles Slack notifications for the JIRA merge action
 */

const axios = require('axios');

/**
 * Send Slack notification
 * 
 * @param {Object} config - Configuration object with Slack settings
 * @param {string} subject - Subject line for the notification
 * @param {string} message - Message body already formatted for Slack
 * @param {boolean} success - Whether the operation was successful
 * @returns {Promise<void>}
 */
async function sendSlackNotification(config, subject, message, success) {
  try {
    if (!config.slackEnabled || !config.slackWebhookUrl) {
      console.log('Slack notifications are disabled or webhook URL is not configured');
      return;
    }

    console.log('Sending Slack notification with message:', message);

    // Extract repository name from subject if present
    let repoName = 'unknown-repo';
    const repoMatch = subject.match(/\[(.*?)\]/);
    if (repoMatch && repoMatch[1]) {
      repoName = repoMatch[1];
    }

    // Use axios to post to the Slack webhook URL
    await axios.post(config.slackWebhookUrl, {
      text: subject,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: subject
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Repository: *${repoName}* | Status: ${success ? '✅ Success' : '❌ Failed'}`
            }
          ]
        }
      ]
    });
    
    console.log('Slack notification sent successfully');
  } catch (error) {
    console.error('Error sending Slack notification:', error.message);
  }
}

module.exports = {
  sendSlackNotification
}; 