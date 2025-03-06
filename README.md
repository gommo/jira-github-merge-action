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

### Basic Usage

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
          source_branch: ${{ github.event.inputs.source_branch }}
          target_branch: ${{ github.event.inputs.target_branch }}
          jira_project_keys: 'PROJ,TEST'
          jira_url: ${{ secrets.JIRA_URL }}
          jira_username: ${{ secrets.JIRA_USERNAME }}
          jira_api_token: ${{ secrets.JIRA_API_TOKEN }}
```

### Complete Example with All Options

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