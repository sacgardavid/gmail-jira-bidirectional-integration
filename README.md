# Gmail ↔ Jira Bidirectional Integration

A bidirectional integration between Gmail and Jira built with Google Apps Script.

The project automates the synchronization between email conversations and Jira issues, allowing email-based workflows to be managed directly from Jira while preserving the original Gmail conversation.

## Features

* 📧 Automatically creates Jira issues from incoming emails.
* 💬 Converts subsequent email replies into Jira comments.
* 🔄 Sends Jira comments back to the original email sender.
* 🧵 Preserves the original Gmail conversation thread.
* 📎 Transfers email attachments to Jira.
* ⚙️ Runs automatically using Google Apps Script time-based triggers.
* 🛡️ Prevents duplicate processing.
* 🔁 Prevents synchronization loops.
* 💾 Stores Gmail/Jira relationship data using Google Apps Script Properties.
* 🔐 Keeps the Jira API token outside the source code.

## Architecture

```text
             Incoming email
                    │
                    ▼
              ┌──────────┐
              │  Gmail   │
              └────┬─────┘
                   │
                   ▼
        ┌─────────────────────┐
        │   Google Apps       │
        │       Script        │
        └──────────┬──────────┘
                   │
                   ▼
              ┌──────────┐
              │   Jira   │
              └────┬─────┘
                   │
             Jira comment
                   │
                   ▼
        ┌─────────────────────┐
        │   Google Apps       │
        │       Script        │
        └──────────┬──────────┘
                   │
                   ▼
              ┌──────────┐
              │  Gmail   │
              │ same     │
              │ thread   │
              └──────────┘
```

## How it works

### 1. Email → Jira

When a new email is detected, the integration:

1. Identifies the Gmail conversation.
2. Creates a Jira issue if the conversation has not been processed.
3. Stores the relationship between the Gmail thread and Jira issue.
4. Processes email attachments.
5. Stores the original sender and email `Message-ID`.

### 2. Email reply → Jira comment

Subsequent messages belonging to the same Gmail conversation are synchronized with the associated Jira issue as comments.

Messages are tracked individually to prevent duplicate processing.

### 3. Jira comment → Email

Comments created directly in Jira are sent back to the original email sender.

The outgoing message uses:

* Gmail `threadId`
* `Message-ID`
* `In-Reply-To`
* `References`

This allows the response to remain associated with the original Gmail conversation.

### 4. Loop prevention

Comments generated from incoming email are marked internally so they are not sent back to the sender as new email messages.

This prevents an infinite synchronization loop between Gmail and Jira.

## Technologies

* Google Apps Script
* Gmail API
* Gmail threads and messages
* Jira REST API
* JavaScript
* Google Apps Script Properties
* Jira API tokens

## Configuration

Before using the integration, configure the environment-specific values:

```javascript
const CONFIG = {
  JIRA_URL: 'https://YOUR-DOMAIN.atlassian.net',
  JIRA_PROJECT: 'YOUR_PROJECT',
  JIRA_ISSUE_TYPE: 'Task',
  GMAIL_FROM: 'your-email@example.com',
  JIRA_EMAIL: 'your-email@example.com'
};
```

The Jira API token should **not** be stored in the source code.

It should be stored using Google Apps Script Script Properties.

Example property:

```text
JIRA_API_TOKEN = YOUR_JIRA_API_TOKEN
```

## Automation

The integration can be configured to run automatically using Google Apps Script time-based triggers.

The recommended setup runs:

* Email processing every 5 minutes.
* Jira comment processing every 5 minutes.

This allows the integration to operate continuously without manual execution.

## Security

Do not commit any of the following to GitHub:

* Jira API tokens
* Passwords
* Personal email addresses
* Private Jira URLs
* Private customer information
* Real message contents
* Production configuration

Use placeholder values in the public repository.

## Project structure

```text
gmail-jira-bidirectional-integration/
│
├── README.md
├── Code.gs
├── appsscript.json
├── configuration.example.js
│
└── docs/
    └── architecture.md
```

## Use cases

This type of integration can be useful for:

* Email-based support workflows
* Incident management
* Internal service desks
* Customer communication
* Help desk automation
* IT operations
* Jira-based ticket management

## License

This project is provided as an example of an automation and API integration using Google Apps Script.

Choose an appropriate open-source license before publishing a production-ready version.
