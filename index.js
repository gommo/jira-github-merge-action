#!/usr/bin/env node

// Load environment variables from .env file
require('dotenv').config();

const { execSync } = require('child_process');
const axios = require('axios');
const { sendNotifications } = require('./notifier');

// Configuration loaded from environment variables with defaults
const config = {
  // Git configuration
  defaultMergeStrategy: process.env.GIT_MERGE_STRATEGY || 'merge', // 'merge' or 'squash'
  dryRun: process.env.DRY_RUN === 'true' || false,
  repoPath: process.env.REPO_PATH || process.cwd(), // Path to the git repository
  
  // Jira configuration
  jiraProjectKeys: (process.env.JIRA_PROJECT_KEYS || 'PROJ,TEST').split(',').map(key => key.trim()),
  jiraUrl: process.env.JIRA_URL || 'https://your-domain.atlassian.net',
  jiraApiToken: process.env.JIRA_API_TOKEN,
  jiraUsername: process.env.JIRA_USERNAME,
  jiraIssueTypeOrder: (process.env.JIRA_ISSUE_TYPE_ORDER || '').split(',').map(type => type.trim()).filter(Boolean),
  
  // Email configuration
  emailEnabled: process.env.EMAIL_ENABLED === 'true' || false,
  emailFrom: process.env.EMAIL_FROM || 'build@yourcompany.com',
  emailTo: (process.env.EMAIL_TO || 'team@yourcompany.com').split(',').map(email => email.trim()),
  smtpHost: process.env.SMTP_HOST || 'smtp.yourcompany.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  
  // Slack configuration
  slackEnabled: process.env.SLACK_ENABLED === 'true' || false,
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
  slackChannel: process.env.SLACK_CHANNEL || '#builds'
};

// Variables for branch names
let sourceBranch, targetBranch;

// Check if running as a GitHub Action
if (process.env.GITHUB_ACTIONS === 'true') {
  try {
    // Import @actions/core for GitHub Actions
    const core = require('@actions/core');
    
    // Git configuration
    config.defaultMergeStrategy = core.getInput('merge_strategy') || config.defaultMergeStrategy;
    config.dryRun = core.getInput('dry_run') === 'true' || config.dryRun;
    config.repoPath = core.getInput('repository_path') || config.repoPath;
    
    // Jira configuration
    const jiraProjectKeys = core.getInput('jira_project_keys');
    if (jiraProjectKeys) {
      config.jiraProjectKeys = jiraProjectKeys.split(',').map(key => key.trim());
    }
    config.jiraUrl = core.getInput('jira_url') || config.jiraUrl;
    config.jiraUsername = core.getInput('jira_username') || config.jiraUsername;
    config.jiraApiToken = core.getInput('jira_api_token') || config.jiraApiToken;
    
    // Email configuration
    config.emailEnabled = core.getInput('email_enabled') === 'true' || config.emailEnabled;
    config.emailFrom = core.getInput('email_from') || config.emailFrom;
    const emailTo = core.getInput('email_to');
    if (emailTo) {
      config.emailTo = emailTo.split(',').map(email => email.trim());
    }
    config.smtpHost = core.getInput('smtp_host') || config.smtpHost;
    config.smtpPort = parseInt(core.getInput('smtp_port') || config.smtpPort.toString(), 10);
    config.smtpUser = core.getInput('smtp_user') || config.smtpUser;
    config.smtpPass = core.getInput('smtp_pass') || config.smtpPass;
    
    // Slack configuration
    config.slackEnabled = core.getInput('slack_enabled') === 'true' || config.slackEnabled;
    config.slackWebhookUrl = core.getInput('slack_token') || config.slackWebhookUrl;
    config.slackChannel = core.getInput('slack_channel') || config.slackChannel;
    
    // Get source and target branches from inputs
    sourceBranch = core.getInput('source_branch', { required: true });
    targetBranch = core.getInput('target_branch', { required: true });
    
    console.log('Running as GitHub Action');
    console.log(`Source branch: ${sourceBranch}`);
    console.log(`Target branch: ${targetBranch}`);
  } catch (error) {
    console.error('Error parsing GitHub Action inputs:', error.message);
    process.exit(1);
  }
}

/**
 * Main function to perform the merge with enhanced commit message
 */
async function performMerge(sourceBranch, targetBranch) {
  try {
    console.log(`Starting merge from ${sourceBranch} to ${targetBranch}`);
    console.log(`Using repository at: ${config.repoPath}`);
    
    // 1. Get commits between branches to extract Jira keys
    const commits = getCommitsBetweenBranches(sourceBranch, targetBranch);
    const jiraIssues = await extractAndEnrichJiraIssues(commits, sourceBranch);
    
    // 2. Generate a structured commit message for Git
    const commitMessage = generateCommitMessage(jiraIssues, sourceBranch, targetBranch);
    
    // 3. Perform the merge
    executeMerge(sourceBranch, targetBranch, commitMessage);
    
    // 4. Generate a Slack-specific message with links
    const slackMessage = generateCommitMessage(jiraIssues, sourceBranch, targetBranch, true);
    
    // 5. Send notifications
    await sendNotifications(config, slackMessage, sourceBranch, targetBranch, true);
    
    // 6. Set GitHub Actions outputs if running as a GitHub Action
    if (process.env.GITHUB_ACTIONS === 'true') {
      const core = require('@actions/core');
      core.setOutput('success', 'true');
      core.setOutput('jira_issues', JSON.stringify(jiraIssues.map(issue => issue.key)));
      core.setOutput('commit_message', commitMessage);
    }
    
    console.log('Merge completed successfully!');
    return true;
  } catch (error) {
    console.error('Error during merge process:', error.message);
    
    // Set GitHub Actions outputs for failure if running as a GitHub Action
    if (process.env.GITHUB_ACTIONS === 'true') {
      const core = require('@actions/core');
      core.setOutput('success', 'false');
      core.setOutput('error_message', error.message);
    }
    
    await sendNotifications(
      config,
      `Failed to merge ${sourceBranch} into ${targetBranch}: ${error.message}`,
      sourceBranch, 
      targetBranch, 
      false
    );
    return false;
  }
}

/**
 * Get all commits between source and target branches
 */
function getCommitsBetweenBranches(sourceBranch, targetBranch) {
  try {
    // Build git command with repository path
    const gitCmd = (cmd) => execSync(cmd, { 
      cwd: config.repoPath,
      encoding: 'utf8' 
    });
    
    // Get common ancestor commit
    const baseCommit = gitCmd(`git merge-base ${targetBranch} ${sourceBranch}`).trim();
    
    // Get all commits from source branch that are not in target branch
    const commitsOutput = gitCmd(`git log ${baseCommit}..${sourceBranch} --pretty=format:"%H|%s|%b"`);
    
    return commitsOutput.split('\n').filter(Boolean).map(commit => {
      const parts = commit.split('|');
      const hash = parts[0] || '';
      const subject = parts[1] || '';
      const body = parts.slice(2).join('|') || ''; // Join remaining parts as body
      return { hash, subject, body };
    });
  } catch (error) {
    console.error('Error getting commits between branches:', error.message);
    throw error;
  }
}

/**
 * Extract Jira issue keys from commits, branch name, and PR description
 * Then fetch additional info from Jira API to enrich the data
 */
async function extractAndEnrichJiraIssues(commits, branchName) {
  // Regular expression to match Jira issue keys based on configured project keys
  const projectKeysPattern = config.jiraProjectKeys.join('|');
  const jiraKeyRegex = new RegExp(`(${projectKeysPattern})-\\d+`, 'gi');
  
  // Collect unique Jira keys from various sources
  const jiraKeys = new Set();
  
  // Extract from branch name
  const branchMatches = branchName ? branchName.match(jiraKeyRegex) : null;
  if (branchMatches) {
    branchMatches.forEach(key => jiraKeys.add(key.toUpperCase()));
  }
  
  // Extract from commit messages
  commits.forEach(commit => {
    const subjectMatches = commit.subject ? commit.subject.match(jiraKeyRegex) : null;
    const bodyMatches = commit.body ? commit.body.match(jiraKeyRegex) : null;
    
    if (subjectMatches) {
      subjectMatches.forEach(key => jiraKeys.add(key.toUpperCase()));
    }
    
    if (bodyMatches) {
      bodyMatches.forEach(key => jiraKeys.add(key.toUpperCase()));
    }
  });
  
  // Fetch additional info from Jira API
  let jiraIssues = [];
  
  if (config.jiraApiToken && config.jiraUsername && jiraKeys.size > 0) {
    try {
      jiraIssues = await fetchJiraIssues([...jiraKeys]);
    } catch (error) {
      console.warn(`Error fetching Jira issues: ${error.message}`);
      // If API call fails, still include the keys without enrichment
      jiraIssues = [...jiraKeys].map(key => ({ 
        key, 
        summary: 'Unknown', 
        issueType: 'Unknown',
        status: 'Unknown',
        url: `${config.jiraUrl}/browse/${key}`
      }));
    }
  } else {
    // If no Jira API credentials or no keys found, just use the keys without enrichment
    jiraIssues = [...jiraKeys].map(key => ({ 
      key, 
      summary: 'Unknown', 
      issueType: 'Unknown',
      status: 'Unknown',
      url: `${config.jiraUrl}/browse/${key}`
    }));
  }
  
  return jiraIssues;
}

/**
 * Fetch multiple issue details from Jira API using JQL
 */
async function fetchJiraIssues(issueKeys) {
  if (issueKeys.length === 0) {
    return [];
  }

  try {
    // Create JQL query with issue keys in format: key in (PROJ-123, TEST-456)
    const jql = `key in (${issueKeys.join(',')})`;
    
    const response = await axios.get(`${config.jiraUrl}/rest/api/2/search`, {
      params: {
        jql: jql,
        fields: 'summary,issuetype,status'
      },
      auth: {
        username: config.jiraUsername,
        password: config.jiraApiToken
      }
    });
    
    return response.data.issues.map(issue => ({
      key: issue.key,
      summary: issue.fields.summary,
      issueType: issue.fields.issuetype.name,
      status: issue.fields.status.name,
      url: `${config.jiraUrl}/browse/${issue.key}`
    }));
  } catch (error) {
    console.error(`Error fetching Jira issues:`, error.message);
    throw error;
  }
}

/**
 * Fetch a single issue detail from Jira API (kept for backward compatibility)
 */
async function fetchJiraIssue(issueKey) {
  try {
    const issues = await fetchJiraIssues([issueKey]);
    return issues[0] || {
      key: issueKey,
      summary: 'Unknown',
      issueType: 'Unknown',
      status: 'Unknown',
      url: `${config.jiraUrl}/browse/${issueKey}`
    };
  } catch (error) {
    console.error(`Error fetching Jira issue ${issueKey}:`, error.message);
    throw error;
  }
}

/**
 * Generate a structured commit message grouped by issue type
 * 
 * @param {Array} jiraIssues - Array of Jira issues
 * @param {string} sourceBranch - Source branch name
 * @param {string} targetBranch - Target branch name
 * @param {boolean} forSlack - Whether to format the message for Slack (with links)
 * @returns {string} - Formatted message
 */
function generateCommitMessage(jiraIssues, sourceBranch, targetBranch, forSlack = false) {
  // Group issues by type
  const issuesByType = jiraIssues.reduce((acc, issue) => {
    const type = issue.issueType || 'Other';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(issue);
    return acc;
  }, {});
  
  // Build commit message
  let message = `Release ${sourceBranch} into ${targetBranch}\n\n`;
  
  // Get all issue types
  let issueTypes = Object.keys(issuesByType);
  
  // Sort issue types based on the configured order
  if (config.jiraIssueTypeOrder && config.jiraIssueTypeOrder.length > 0) {
    // Create a map for quick lookup of order index
    const orderMap = new Map();
    config.jiraIssueTypeOrder.forEach((type, index) => {
      orderMap.set(type, index);
    });
    
    // Sort issue types: first the ones in the configured order, then the rest alphabetically
    issueTypes.sort((a, b) => {
      const aIndex = orderMap.has(a) ? orderMap.get(a) : Number.MAX_SAFE_INTEGER;
      const bIndex = orderMap.has(b) ? orderMap.get(b) : Number.MAX_SAFE_INTEGER;
      
      if (aIndex !== bIndex) {
        return aIndex - bIndex; // Sort by configured order
      }
      
      // If both are not in the configured order or have the same order, sort alphabetically
      return a.localeCompare(b);
    });
  }
  
  // Add issues by type
  issueTypes.forEach(type => {
    // For Slack, use bold formatting for headers
    message += forSlack ? `*${type}*\n` : `## ${type}\n`;
    
    issuesByType[type].forEach(issue => {
      if (forSlack) {
        // For Slack, create a link using the URL from the Jira issue
        const issueLink = `<${issue.url}|${issue.key}>`;
        if (issue.summary !== 'Unknown') {
          message += `- ${issueLink}: ${issue.summary}\n`;
        } else {
          message += `- ${issueLink}\n`;
        }
      } else {
        // For Git commit message, use plain text
        if (issue.summary !== 'Unknown') {
          message += `- ${issue.key}: ${issue.summary}\n`;
        } else {
          message += `- ${issue.key}\n`;
        }
      }
    });
    
    message += '\n';
  });
  
  return message;
}

/**
 * Execute the actual git merge command
 */
function executeMerge(sourceBranch, targetBranch, commitMessage) {
  try {
    // Create a temporary file for the commit message
    const fs = require('fs');
    const path = require('path');
    const tempFile = path.join(config.repoPath, 'MERGE_MSG');
    fs.writeFileSync(tempFile, commitMessage);
    
    // Build git command with repository path
    const gitCmd = (cmd) => execSync(cmd, { 
      cwd: config.repoPath,
      encoding: 'utf8' 
    });
    
    if (config.dryRun) {
      console.log('--- DRY RUN MODE ---');
      console.log(`Would merge ${sourceBranch} into ${targetBranch} with message:`);
      console.log(commitMessage);
      console.log('--- END DRY RUN ---');
    } else {
      // Make sure we're on the target branch
      gitCmd(`git checkout ${targetBranch}`);
      
      // Perform the merge with the specified strategy
      if (config.defaultMergeStrategy === 'merge') {
        gitCmd(`git merge --no-ff ${sourceBranch} -F ${tempFile}`);
      } else {
        // For squash merge
        gitCmd(`git merge --squash ${sourceBranch}`);
        gitCmd(`git commit -F ${tempFile}`);
      }
    }
    
    // Clean up the temporary file
    fs.unlinkSync(tempFile);
  } catch (error) {
    console.error('Error executing merge:', error.message);
    throw error;
  }
}

// Command line parsing
const args = process.argv.slice(2);
let dryRun = false;
let repoPath = null;

// Skip command line parsing if running as a GitHub Action
if (process.env.GITHUB_ACTIONS !== 'true') {
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run' || args[i] === '-d') {
      dryRun = true;
    } else if (args[i] === '--repo-path' || args[i] === '-r') {
      if (i + 1 < args.length) {
        repoPath = args[i + 1];
        i++; // Skip the next argument as it's the path
      }
    } else if (!sourceBranch) {
      sourceBranch = args[i];
    } else if (!targetBranch) {
      targetBranch = args[i];
    }
  }

  // Override dry run config if specified via command line
  if (dryRun) {
    config.dryRun = true;
    console.log('Dry run mode enabled');
  }
  
  // Set repository path if specified
  if (repoPath) {
    config.repoPath = repoPath;
    console.log(`Using repository at: ${repoPath}`);
  }
}

// Proceed with merge if we have source and target branches
if (sourceBranch && targetBranch) {
  // Verify the repo path exists and is a git repository
  const fs = require('fs');
  const path = require('path');
  
  if (!fs.existsSync(path.join(config.repoPath, '.git'))) {
    console.error(`Error: ${config.repoPath} is not a git repository or the path doesn't exist.`);
    process.exit(1);
  }
  
  performMerge(sourceBranch, targetBranch)
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
} else if (process.env.GITHUB_ACTIONS !== 'true') {
  // Only show usage if not running as a GitHub Action
  console.log('Usage: node index.js [options] <source-branch> <target-branch>');
  console.log('Options:');
  console.log('  --dry-run, -d       Run without performing any actual merges');
  console.log('  --repo-path, -r     Path to the git repository (default: current directory)');
  process.exit(1);
} else {
  console.error('Error: Source branch and target branch are required');
  process.exit(1);
}