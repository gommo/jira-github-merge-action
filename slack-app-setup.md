# Setting Up the JIRA Merge Notifier Slack Webhook

This guide will help you set up a Slack webhook for the JIRA Merge Action.

## Steps to Create a Slack Webhook

1. Go to your Slack workspace
2. Create a new Slack app at [https://api.slack.com/apps](https://api.slack.com/apps) (or use an existing one)
3. Click on "Create New App" and choose "From scratch"
4. Give your app a name and select your workspace
5. In the left sidebar, click on "Incoming Webhooks"
6. Toggle "Activate Incoming Webhooks" to On
7. Click "Add New Webhook to Workspace"
8. Select the channel where you want notifications to be posted
9. Click "Allow" to authorize the webhook
10. Copy the Webhook URL that appears (it will start with https://hooks.slack.com/services/)

## Configuring the JIRA Merge Action

Update your configuration with the following Slack-related settings:

```javascript
{
  "slackEnabled": true,
  "slackWebhookUrl": "https://hooks.slack.com/services/YOUR_WEBHOOK_URL_HERE",
  "slackChannel": "#your-channel-name"
}
```

Or in your .env file:

```
SLACK_ENABLED=true
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR_WEBHOOK_URL_HERE
SLACK_CHANNEL=#your-channel-name
```

## Webhook vs Bot Token

Using a webhook is simpler than using a bot token:
- No need to install a bot to your workspace
- No need to manage bot permissions
- Webhook URLs are specific to a channel, so you don't need to specify the channel in the code
- Simpler implementation with just an HTTP POST request

## Troubleshooting

- If notifications aren't appearing, verify that the webhook URL is correct
- Make sure the webhook URL is kept secret, as anyone with the URL can post to your channel
- Webhook URLs cannot be used to read data from Slack, only to post messages 