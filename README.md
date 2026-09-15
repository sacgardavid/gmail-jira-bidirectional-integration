# Gmail ↔ Jira Bidirectional Integration

A Google Apps Script integration that connects Gmail and Jira to create a bidirectional email-to-ticket workflow.

Incoming emails can automatically create Jira issues, email replies can become Jira comments, and Jira comments can be sent back to the original email sender while preserving the Gmail conversation thread.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4)
![Jira](https://img.shields.io/badge/Jira-0052CC)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

- Automatic Jira issue creation from incoming Gmail messages.
- Email replies converted into Jira comments.
- Jira comments sent back to the original email sender.
- Gmail thread preservation.
- Jira attachment support.
- Duplicate message prevention.
- Email/Jira loop prevention.
- Configurable email processing.
- Automated execution using Google Apps Script time-based triggers.
- Secure Jira API token storage using Script Properties.
- Jira REST API integration.
- Lightweight architecture with no dedicated backend server.

---

## Architecture

The integration uses Google Apps Script as the communication layer between Gmail and Jira.


External Email Sender
        │
        ▼
      Gmail
        │
        ▼
 Google Apps Script
        │
        ├──────────────► Jira REST API
        │                    │
        │                    ▼
        │                Jira Issue
        │                    │
        │                    ▼
        │              Jira Comments
        │
        ◄────────────────────┘
        │
        ▼
      Gmail
        │
        ▼
External Email Sender

For a detailed technical description, see:

Architecture documentation

How It Works
1. Incoming Email → Jira

An incoming email is detected in Gmail.

If the Gmail thread is not already associated with a Jira issue, the integration creates a new Jira Task.

The integration stores the relationship between the Gmail thread and Jira issue using Google Apps Script Script Properties.

Example:

Gmail Thread
     │
     └──► Jira Issue S9S-123
2. Email Reply → Jira Comment

When a reply is added to an existing Gmail conversation:

The message is detected.
The associated Jira issue is identified.
The email body is cleaned.
The message is added as a Jira comment.
Attachments are uploaded to Jira.
The message is marked as processed.

This prevents the same email from being processed multiple times.

3. Jira Comment → Email

When a Jira comment is created manually:

The associated Gmail thread is identified.
The original sender is retrieved.
The Jira comment is converted into an email.
Gmail threading information is preserved.
The email is sent to the original sender.

The reply is inserted into the existing Gmail conversation rather than creating an unrelated email thread.

4. Loop Prevention

Comments created from incoming emails receive a configurable prefix:

Inbound email reply:

When Jira comments are processed, comments containing this prefix are not sent back by email.

This prevents an email → Jira → email → Jira feedback loop.

Technologies
Google Apps Script
Gmail API
GmailApp
Jira Cloud REST API
JavaScript
Script Properties
Time-based triggers
Configuration

The public repository does not contain real credentials.

Copy the example configuration and replace the placeholders with your own environment values:

configuration.example.gs

Example:

const CONFIG = {
  JIRA_URL: 'https://YOUR-DOMAIN.atlassian.net',
  JIRA_PROJECT: 'YOUR_PROJECT',
  JIRA_ISSUE_TYPE: 'Task',
  GMAIL_FROM: 'your-email@example.com',
  JIRA_EMAIL: 'your-email@example.com'
};
Jira API Token

The Jira API token must not be stored in the source code.

Store it in Google Apps Script Script Properties:

JIRA_API_TOKEN

The application retrieves the token at runtime.

Never commit real credentials, API tokens, passwords, or private configuration values to GitHub.

Gmail API

The project uses the Gmail Advanced Service.

The required service is configured in:

appsscript.json

The Gmail API is used to send replies while preserving the Gmail thread relationship.

Automation

The project uses Google Apps Script time-based triggers.

Two functions are executed automatically:

procesarCorreos()
        │
        └── Gmail → Jira

procesarComentariosJira()
        │
        └── Jira → Gmail

The default interval is five minutes.

To install the triggers, run:

instalarAutomatizacion()

This only needs to be executed once.

The function removes previous triggers before creating new ones to prevent duplicate scheduled executions.

State Management

The integration uses Script Properties to maintain lightweight processing state.

Examples:

THREAD_<gmailThreadId>
THREAD_FROM_<gmailThreadId>
THREAD_MESSAGE_ID_<gmailThreadId>
MSG_<gmailMessageId>
JIRA_COMMENT_SENT_<jiraCommentId>

This allows the integration to:

Associate Gmail threads with Jira issues.
Remember the original sender.
Preserve email threading information.
Prevent duplicate message processing.
Prevent duplicate Jira comment emails.
Attachments

Attachments received through Gmail are uploaded to the corresponding Jira issue.

This allows the Jira ticket to retain the relevant files from the original email conversation.

Project Structure
gmail-jira-bidirectional-integration/
│
├── README.md
├── LICENSE
├── CHANGELOG.md
├── .gitignore
│
├── src/
│   ├── Code.gs
│   ├── configuration.example.gs
│   └── appsscript.json
│
└── docs/
    └── architecture.md
Security

Security is an important part of the project design.

The following information must never be committed to GitHub:

Jira API tokens.
Passwords.
Personal access tokens.
Private email addresses.
Private infrastructure URLs.
Authentication credentials.

The repository contains placeholders only.

The Jira API token is stored using Google Apps Script Script Properties.

The .gitignore file also excludes common local credential and environment files.

Limitations

This project is intentionally lightweight and is designed as a Google Apps Script integration.

It currently uses scheduled processing rather than Jira webhooks or a dedicated backend.

The architecture is suitable for:

Personal automation.
Small teams.
Internal workflows.
Proof-of-concept integrations.
Portfolio demonstrations.

For larger production environments, additional components could be introduced, such as:

Persistent databases.
Webhooks.
Retry queues.
Centralized logging.
Rate-limit handling.
Automated testing.
External secret management.
CI/CD pipelines.
Future Improvements

Potential future versions could include:

Jira status synchronization.
Configurable Jira priorities and labels.
Multiple Jira projects.
Improved email parsing.
Rich HTML email support.
Webhook-based processing.
Retry and error handling.
Automated tests.
CI/CD integration.
More advanced configuration management.

These features are intentionally outside the scope of the initial 1.0.0 release.

Version

Current version:

1.0.0

The project follows Semantic Versioning.

See the CHANGELOG for the release history.

License

This project is licensed under the MIT License.

See the LICENSE file for details.
