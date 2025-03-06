# Jira-Enhanced Merge Action

A GitHub Action for merging branches with enhanced commit messages generated from Jira issues.

## Features

- Enforces merge commits (configurable to use squash if needed)
- Extracts Jira issue keys from:
  - Branch names
  - Commit messages
  - PR descriptions
- Groups Jira issues by type in the commit message
- Sends notifications via:
  - Email
  - Slack

## Usage as Node.js Script

During development, you can run this as a standalone Node.js script:

```bash
# Install dependencies
npm install

# Run the script
node index.js <source-branch> <target-branch>

# Example:
node index.js develop staging

# Run in dry run mode (no actual merging)
node index.js --dry-run develop staging
# or
node index.js -d develop staging
```

## Environment Variables

The script uses a `.env` file to manage environment variables. Create a `.env` file in the project root:

1. Copy the example file:
```bash
cp .env.example .env
```

2. Edit the `.env` file and fill in your values:
```
# Jira Authentication
JIRA_USERNAME=your-jira-email@company.com
JIRA_API_TOKEN=your-jira-api-token

# For Email Notifications (if enabled)
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password

# For Slack Notifications (if enabled)
SLACK_TOKEN=your-slack-api-token
```

Note: The `.env` file is included in `.gitignore` to prevent accidentally committing sensitive information.

## Configuration

Edit the `config.js` file to customize:

- Jira project keys to look for
- Jira URL
- Email notification settings
- Slack notification settings
- Default merge strategy

## Converting to GitHub Action

To convert this script to a GitHub Action:

1. Create an `action.yml` file (see below)
2. Modify the script to use GitHub Action inputs instead of command line arguments
3. Package everything into a Docker container or use Node.js action
4. Publish to the GitHub Marketplace

## Future Improvements

- Support for multiple target branches
- Custom templates for commit messages
- Support for other issue tracking systems