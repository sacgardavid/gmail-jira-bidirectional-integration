# Architecture

## Overview

This project provides a bidirectional integration between Gmail and Jira using Google Apps Script.

The integration allows email conversations to be managed as Jira issues while preserving the original Gmail conversation.

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


Main Components
Gmail

Gmail acts as the email interface.

The integration monitors configured Gmail threads and processes new messages automatically.

Gmail is also responsible for sending Jira comments back to the original sender.

Google Apps Script

Google Apps Script is the integration layer between Gmail and Jira.

It is responsible for:

Reading Gmail threads.
Creating Jira issues.
Adding Jira comments.
Sending Jira comments by email.
Processing attachments.
Preventing duplicate processing.
Preserving Gmail thread relationships.
Storing integration metadata.
Running scheduled automation.
Jira

Jira is used as the ticket and issue management system.

Incoming email conversations can create Jira issues, while subsequent email replies become Jira comments.

Jira comments created manually can be sent back to the original email sender.

Jira REST API

The Jira REST API provides communication between Google Apps Script and Jira.

The integration uses the API to:

Create issues.
Add comments.
Retrieve comments.
Upload attachments.
Data Flow
1. Incoming Email

An email arrives in the configured Gmail mailbox.

Google Apps Script detects the relevant Gmail thread.

If the thread is not associated with a Jira issue, a new Jira issue is created.

The Gmail thread and Jira issue are then associated using Script Properties.

2. Email Reply

When a new message is added to an existing Gmail thread:

The message is detected.
The associated Jira issue is retrieved.
The email body is cleaned.
The message is added as a Jira comment.
Any attachments are uploaded to Jira.
The message is marked as processed.
3. Jira Comment

When a new Jira comment is detected:

The integration identifies the associated Gmail thread.
The original sender is retrieved.
The Jira comment is converted into an email.
The original Gmail Message-ID is used for email threading.
The message is sent to the original sender.
The Gmail thread ID is preserved.
4. Loop Prevention

Comments created from incoming emails are marked with a configurable prefix:

Inbound email reply:

When Jira comments are processed, comments containing this prefix are not sent back by email.

This prevents the integration from creating an email/Jira feedback loop.

State Management

The integration uses Google Apps Script Script Properties to store lightweight state information.

Examples include:

JIRA_API_TOKEN
THREAD_<gmailThreadId>
THREAD_FROM_<gmailThreadId>
THREAD_MESSAGE_ID_<gmailThreadId>
MSG_<gmailMessageId>
JIRA_COMMENT_SENT_<jiraCommentId>

This allows the integration to remember which Gmail threads are associated with Jira issues and which messages or comments have already been processed.

Security

Sensitive credentials are not stored in the source code.

The Jira API token is stored in Google Apps Script Script Properties:

JIRA_API_TOKEN

The repository only contains placeholder configuration values.

Real credentials must never be committed to GitHub.

Automation

The integration uses Google Apps Script time-based triggers.

Two processes run periodically:

procesarCorreos()
        │
        └── Gmail → Jira

procesarComentariosJira()
        │
        └── Jira → Gmail

The default automation interval is five minutes.

The triggers can be installed using:

instalarAutomatizacion()
Design Considerations

The project intentionally uses Google Apps Script as the integration layer because it provides direct access to Gmail and can communicate with external REST APIs without requiring a dedicated server.

The architecture is intentionally lightweight and suitable for small automation workflows, internal processes, and proof-of-concept integrations.

For larger production environments, the architecture could be extended with additional components such as:

Persistent databases.
Centralized logging.
Retry queues.
Rate-limit handling.
Webhooks.
External secret management.
Automated testing and CI/CD.
        │
        ▼
External Email Sender
