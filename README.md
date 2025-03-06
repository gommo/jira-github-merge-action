# Jira-Enhanced Merge Action

A GitHub Action that merges branches with enhanced commit messages generated from Jira issues.

## Features

- Automatically extracts Jira issue keys from branch names and commit messages
- Fetches issue details from Jira API to enrich commit messages
- Groups issues by type in the commit message
- Supports both merge and squash merge strategies
- Optional email and Slack notifications
- Dry run mode for testing

## Usage

This action is designed to facilitate a structured release process, particularly for workflows that involve merging from develop to staging and from staging to main branches. The action enforces merge commits (not squashed) and provides detailed notifications about what's included in each release.

See the [Setting Up Your Release Workflow](#setting-up-your-release-workflow) section below for example workflows.

### Example with All Options

```yaml
name: Merge with Jira Integration

on:
  workflow_dispatch:
    inputs:
      source_branch:
        description: 'Source branch to merge from'
        required: true
      target_branch:
        description: 'Target branch to merge into'
        required: true

jobs:
  merge:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Important: Fetch all history for all branches

      - name: Set Git identity
        run: |
          git config --global user.name 'GitHub Actions'
          git config --global user.email 'actions@github.com'

      - name: Merge with Jira integration
        uses: gommo/jira-merge-action@v1
        with:
          # Required inputs
          source_branch: ${{ github.event.inputs.source_branch }}
          target_branch: ${{ github.event.inputs.target_branch }}
          jira_project_keys: 'PROJ,TEST'
          jira_url: ${{ secrets.JIRA_URL }}
          jira_username: ${{ secrets.JIRA_USERNAME }}
          jira_api_token: ${{ secrets.JIRA_API_TOKEN }}
          
          # Optional inputs
          repository_path: '.'
          merge_strategy: 'merge'  # 'merge' or 'squash'
          dry_run: 'false'
          
          # Email notification options
          email_enabled: 'true'
          email_from: ${{ secrets.EMAIL_FROM }}
          email_to: 'team@example.com,manager@example.com'
          smtp_host: ${{ secrets.SMTP_HOST }}
          smtp_port: '587'
          smtp_user: ${{ secrets.SMTP_USER }}
          smtp_pass: ${{ secrets.SMTP_PASS }}
          
          # Slack notification options
          slack_enabled: 'true'
          slack_token: ${{ secrets.SLACK_TOKEN }}
          slack_channel: '#builds'
```

## Inputs

### Required Inputs

| Input | Description |
|-------|-------------|
| `source_branch` | Source branch to merge from |
| `target_branch` | Target branch to merge into |
| `jira_project_keys` | Comma-separated list of Jira project keys to look for |
| `jira_url` | URL of your Jira instance |
| `jira_username` | Jira username or email |
| `jira_api_token` | Jira API token |

### Optional Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `repository_path` | Path to the git repository | `.` |
| `merge_strategy` | Merge strategy (merge or squash) | `merge` |
| `dry_run` | Run without performing any actual merges | `false` |

### Email Notification Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `email_enabled` | Enable email notifications | `false` |
| `email_from` | Email sender address | |
| `email_to` | Comma-separated list of email recipients | |
| `smtp_host` | SMTP server hostname | |
| `smtp_port` | SMTP server port | `587` |
| `smtp_user` | SMTP username | |
| `smtp_pass` | SMTP password | |

### Slack Notification Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `slack_enabled` | Enable Slack notifications | `false` |
| `slack_token` | Slack API token | |
| `slack_channel` | Slack channel for notifications | |

## Publishing

To publish a new version of this action:

1. Make your changes
2. Update the version in `package.json`
3. Create a new tag following semantic versioning:
   ```
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

## License

MIT

## Setting Up Your Release Workflow

For your develop->staging and staging->main release workflow, you'll need to set up two separate workflow files:

### 1. Develop to Staging Workflow

Here's how you can set up a workflow for merging from develop to staging:

```yaml
name: Develop to Staging Release

on:
  workflow_dispatch:  # Manual trigger
    inputs:
      source_branch:
        description: 'Source branch to merge from'
        default: 'develop'
        required: true
      target_branch:
        description: 'Target branch to merge into'
        default: 'staging'
        required: true

jobs:
  merge:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Important: Fetch all history for all branches

      - name: Set Git identity
        run: |
          git config --global user.name 'GitHub Actions'
          git config --global user.email 'actions@github.com'

      - name: Merge develop to staging with Jira integration
        uses: gommo/jira-merge-action@v1
        with:
          source_branch: ${{ github.event.inputs.source_branch }}
          target_branch: ${{ github.event.inputs.target_branch }}
          jira_project_keys: 'YOUR_JIRA_PROJECT_KEYS'  # Replace with your project keys
          jira_url: ${{ secrets.JIRA_URL }}
          jira_username: ${{ secrets.JIRA_USERNAME }}
          jira_api_token: ${{ secrets.JIRA_API_TOKEN }}
          merge_strategy: 'merge'  # Enforcing merge commit (not squash)
          
          # Optional notification settings
          slack_enabled: 'true'
          slack_token: ${{ secrets.SLACK_TOKEN }}
          slack_channel: '#releases'  # Replace with your channel
          
          email_enabled: 'true'
          email_from: ${{ secrets.EMAIL_FROM }}
          email_to: 'team@example.com,stakeholders@example.com'
          smtp_host: ${{ secrets.SMTP_HOST }}
          smtp_port: '587'
          smtp_user: ${{ secrets.SMTP_USER }}
          smtp_pass: ${{ secrets.SMTP_PASS }}
```

### 2. Staging to Main (Production) Workflow

Similarly, set up a workflow for merging from staging to main:

```yaml
name: Staging to Production Release

on:
  workflow_dispatch:  # Manual trigger
    inputs:
      source_branch:
        description: 'Source branch to merge from'
        default: 'staging'
        required: true
      target_branch:
        description: 'Target branch to merge into'
        default: 'main'
        required: true

jobs:
  merge:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Important: Fetch all history for all branches

      - name: Set Git identity
        run: |
          git config --global user.name 'GitHub Actions'
          git config --global user.email 'actions@github.com'

      - name: Merge staging to main with Jira integration
        uses: gommo/jira-merge-action@v1
        with:
          source_branch: ${{ github.event.inputs.source_branch }}
          target_branch: ${{ github.event.inputs.target_branch }}
          jira_project_keys: 'YOUR_JIRA_PROJECT_KEYS'  # Replace with your project keys
          jira_url: ${{ secrets.JIRA_URL }}
          jira_username: ${{ secrets.JIRA_USERNAME }}
          jira_api_token: ${{ secrets.JIRA_API_TOKEN }}
          merge_strategy: 'merge'  # Enforcing merge commit (not squash)
          
          # Optional notification settings - you might want more notifications for production releases
          slack_enabled: 'true'
          slack_token: ${{ secrets.SLACK_TOKEN }}
          slack_channel: '#releases'  # Replace with your channel
          
          email_enabled: 'true'
          email_from: ${{ secrets.EMAIL_FROM }}
          email_to: 'team@example.com,stakeholders@example.com'
          smtp_host: ${{ secrets.SMTP_HOST }}
          smtp_port: '587'
          smtp_user: ${{ secrets.SMTP_USER }}
          smtp_pass: ${{ secrets.SMTP_PASS }}
```

## Key Benefits for Your Workflow

1. **Enforced Merge Commits**: By setting `merge_strategy: 'merge'`, you ensure that a merge commit is created (not squashed), preserving the commit history.

2. **Detailed Release Notes**: The action automatically generates structured commit messages that group Jira issues by type, making it easy to see what's included in each release.

3. **Notifications**: Team members are automatically notified about releases via Slack and/or email, with links to the relevant Jira issues.

4. **Traceability**: The action extracts Jira issue keys from branch names and commit messages, providing traceability between code changes and Jira issues.

## Required Secrets

You'll need to set up the following secrets in your GitHub repository:

- `JIRA_URL`: URL of your Jira instance
- `JIRA_USERNAME`: Jira username or email
- `JIRA_API_TOKEN`: Jira API token
- `SLACK_TOKEN`: Slack API token (if using Slack notifications)
- `EMAIL_FROM`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` (if using email notifications)

## Customization Options

1. **Issue Type Ordering**: You can customize the order of issue types in the commit message by setting the `JIRA_ISSUE_TYPE_ORDER` environment variable.

2. **Dry Run Mode**: For testing, you can set `dry_run: 'true'` to see what would happen without actually performing the merge.

3. **Notification Templates**: The action generates formatted messages for both Git commit messages and Slack notifications, with Slack messages including clickable links to Jira issues.

This setup will help you maintain a clean and traceable release process from develop to staging and from staging to main, with detailed release notes and notifications to keep your team informed.