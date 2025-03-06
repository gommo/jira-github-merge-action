// config.js
module.exports = {
    // Git configuration
    defaultMergeStrategy: 'merge', // 'merge' or 'squash'
    dryRun: false, // Set to true to skip actual merge operations
    repoPath: process.cwd(), // Path to the git repository
    
    // Jira configuration
    jiraProjectKeys: ['PROJ', 'TEST'], // Array of Jira project keys to look for
    jiraUrl: 'https://your-domain.atlassian.net',
    jiraApiToken: process.env.JIRA_API_TOKEN,
    jiraUsername: process.env.JIRA_USERNAME,
    
    // Email configuration
    emailEnabled: false,
    emailFrom: 'build@yourcompany.com',
    emailTo: ['team@yourcompany.com'],
    smtpHost: 'smtp.yourcompany.com',
    smtpPort: 587,
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    
    // Slack configuration
    slackEnabled: false,
    slackToken: process.env.SLACK_TOKEN,
    slackChannel: '#builds'
  };