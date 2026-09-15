/**
 * Example configuration for the Gmail ↔ Jira integration.
 *
 * This file contains placeholders only.
 * Never add real credentials, API tokens, email addresses,
 * or private infrastructure details to this file.
 */

const EXAMPLE_CONFIG = {

  // Jira Cloud base URL.
  JIRA_URL: 'https://YOUR-DOMAIN.atlassian.net',

  // Jira project key.
  JIRA_PROJECT: 'YOUR_PROJECT',

  // Jira issue type created from incoming emails.
  JIRA_ISSUE_TYPE: 'Task',

  // Gmail account used by the integration.
  GMAIL_FROM: 'your-email@example.com',

  // Jira account used for API authentication.
  JIRA_EMAIL: 'your-email@example.com',

  // Optional email signature to remove from incoming messages.
  // Leave empty if no signature should be removed.
  EMAIL_SIGNATURE_TO_REMOVE: '',

  // Prefix used for comments created from email replies.
  INBOUND_COMMENT_PREFIX: 'Inbound email reply:',

  // Prefix used for Jira replies sent by email.
  JIRA_REPLY_PREFIX: 'Reply from Jira',

  // Footer added to Jira email replies.
  JIRA_REPLY_FOOTER: 'This message was sent from Jira.',

  // Fallback subject for Jira replies.
  FALLBACK_REPLY_SUBJECT: 'Jira reply'
};
