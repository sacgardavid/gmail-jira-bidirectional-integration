// ============================================================
// CONFIGURATION
// ============================================================

const CONFIG = {
  JIRA_URL: 'https://YOUR-DOMAIN.atlassian.net',
  JIRA_PROJECT: 'YOUR_PROJECT',
  JIRA_ISSUE_TYPE: 'Task',
  GMAIL_FROM: 'your-email@example.com',
  JIRA_EMAIL: 'your-email@example.com',

  // Optional email signature to remove from incoming messages.
  // Leave empty if no signature should be removed.
  EMAIL_SIGNATURE_TO_REMOVE: '',

  // Prefix added to Jira comments created from email replies.
  // It is also used to prevent those comments from being
  // sent back to the email sender.
  INBOUND_COMMENT_PREFIX: 'Inbound email reply:',

  // Text used when Jira sends a comment back by email.
  JIRA_REPLY_PREFIX: 'Reply from Jira',

  // Footer added to outgoing Jira email replies.
  JIRA_REPLY_FOOTER: 'This message was sent from Jira.',

  // Fallback subject when the original Gmail thread has no subject.
  FALLBACK_REPLY_SUBJECT: 'Jira reply'
};


// ============================================================
// PROCESS GMAIL → JIRA
// ============================================================

function procesarCorreos() {

  const threads = GmailApp.search(
    'from:' + CONFIG.GMAIL_FROM
  );

  Logger.log(
    'Threads found: ' + threads.length
  );

  threads.forEach(thread => {

    const messages = thread.getMessages();

    let issueKey =
      buscarIssueDelThread(thread);

    // Create a Jira issue if this Gmail thread
    // is not associated with one yet.
    if (!issueKey) {

      const firstMessage =
        messages.find(message =>
          message
            .getFrom()
            .toLowerCase()
            .includes(
              CONFIG.GMAIL_FROM.toLowerCase()
            )
        );

      if (!firstMessage) {
        return;
      }

      Logger.log(
        'Creating Jira issue for: ' +
        firstMessage.getSubject()
      );

      issueKey =
        crearIssue(
          firstMessage,
          thread
        );

      if (!issueKey) {
        return;
      }

      guardarIssueDelThread(
        thread,
        issueKey
      );

      Logger.log(
        'Jira issue created: ' +
        issueKey
      );
    }

    // Identify the original email message.
    const firstMessage =
      messages.find(message =>
        message
          .getFrom()
          .toLowerCase()
          .includes(
            CONFIG.GMAIL_FROM.toLowerCase()
          )
      );

    const firstMessageId =
      firstMessage
        ? firstMessage.getId()
        : null;

    // Process all messages in the Gmail thread.
    messages.forEach(message => {

      const messageId =
        message.getId();

      const procesado =
        PropertiesService
          .getScriptProperties()
          .getProperty(
            'MSG_' + messageId
          );

      // Skip messages that have already been processed.
      if (procesado) {
        return;
      }

      if (messageId === firstMessageId) {

        Logger.log(
          'Original message included in Jira description: ' +
          messageId
        );

      } else {

        Logger.log(
          'Adding email reply as Jira comment. ' +
          'Issue: ' +
          issueKey +
          ' | From: ' +
          message.getFrom()
        );

        agregarComentario(
          issueKey,
          message
        );
      }

      PropertiesService
        .getScriptProperties()
        .setProperty(
          'MSG_' + messageId,
          '1'
        );
    });
  });
}


// ============================================================
// PROCESS JIRA → EMAIL
// ============================================================

function procesarComentariosJira() {

  const properties =
    PropertiesService.getScriptProperties();

  const threads =
    GmailApp.search(
      'from:' + CONFIG.GMAIL_FROM
    );

  Logger.log(
    'Checking Jira comments.'
  );

  threads.forEach(thread => {

    const issueKey =
      buscarIssueDelThread(thread);

    if (!issueKey) {
      return;
    }

    const destinatario =
      buscarRemitenteThread(thread);

    const messageIdOriginal =
      buscarMessageIdThread(thread);

    if (!destinatario) {

      Logger.log(
        'Original sender not found for ' +
        issueKey
      );

      return;
    }

    Logger.log(
      'Jira ' +
      issueKey +
      ' -> original sender: ' +
      destinatario
    );

    const comentarios =
      obtenerComentariosJira(
        issueKey
      );

    if (
      !comentarios ||
      !comentarios.length
    ) {

      Logger.log(
        'No Jira comments found for ' +
        issueKey
      );

      return;
    }

    comentarios.forEach(comentario => {

      const commentId =
        String(comentario.id);

      const enviado =
        properties.getProperty(
          'JIRA_COMMENT_SENT_' +
          commentId
        );

      // Skip comments that have already been emailed.
      if (enviado) {
        return;
      }

      const texto =
        extraerTextoComentario(
          comentario.body
        );

      if (!texto) {

        properties.setProperty(
          'JIRA_COMMENT_SENT_' +
          commentId,
          '1'
        );

        return;
      }

      // Do not send comments that originally came
      // from an email reply back to the sender.
      if (
        texto.startsWith(
          CONFIG.INBOUND_COMMENT_PREFIX
        )
      ) {

        Logger.log(
          'Comment originated from email. ' +
          'Skipping outbound email: ' +
          commentId
        );

        properties.setProperty(
          'JIRA_COMMENT_SENT_' +
          commentId,
          '1'
        );

        return;
      }

      Logger.log(
        'Sending Jira comment ' +
        commentId +
        ' to ' +
        destinatario
      );

      enviarComentarioPorEmail(
        destinatario,
        buscarAsuntoOriginal(thread),
        issueKey,
        texto,
        messageIdOriginal,
        thread.getId()
      );

      properties.setProperty(
        'JIRA_COMMENT_SENT_' +
        commentId,
        '1'
      );
    });
  });
}


// ============================================================
// CREATE JIRA ISSUE
// ============================================================

function crearIssue(message, thread) {

  const subject =
    message.getSubject();

  const body =
    limpiarTextoInicial(
      message.getPlainBody()
    );

  const payload = {
    fields: {

      project: {
        key: CONFIG.JIRA_PROJECT
      },

      summary: subject,

      description: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text:
                  'Email received from: ' +
                  message.getFrom()
              }
            ]
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: body
              }
            ]
          }
        ]
      },

      issuetype: {
        name: CONFIG.JIRA_ISSUE_TYPE
      }
    }
  };

  const response =
    jiraRequest(
      '/rest/api/3/issue',
      'post',
      payload
    );

  if (
    response &&
    response.key
  ) {

    // Store the original sender and Message-ID
    // so Jira can reply to the correct email thread.
    guardarDatosOriginalesThread(
      thread,
      message
    );

    guardarIssueDelThread(
      thread,
      response.key
    );

    procesarAdjuntos(
      response.key,
      message
    );

    return response.key;
  }

  return null;
}


// ============================================================
// ADD EMAIL REPLY AS JIRA COMMENT
// ============================================================

function agregarComentario(issueKey, message) {

  let body =
    message.getPlainBody();

  body =
    limpiarTextoInicial(body);

  if (!body) {
    return;
  }

  const comentario =
    CONFIG.INBOUND_COMMENT_PREFIX +
    '\n\n' +
    body;

  agregarComentarioTexto(
    issueKey,
    comentario
  );

  procesarAdjuntos(
    issueKey,
    message
  );
}


// ============================================================
// ADD TEXT COMMENT TO JIRA
// ============================================================

function agregarComentarioTexto(
  issueKey,
  texto
) {

  const payload = {
    body: {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: texto
            }
          ]
        }
      ]
    }
  };

  jiraRequest(
    '/rest/api/3/issue/' +
    encodeURIComponent(issueKey) +
    '/comment',
    'post',
    payload
  );
}


// ============================================================
// GET JIRA COMMENTS
// ============================================================

function obtenerComentariosJira(issueKey) {

  const response =
    jiraRequest(
      '/rest/api/3/issue/' +
      encodeURIComponent(issueKey) +
      '/comment?orderBy=created',
      'get'
    );

  if (
    response &&
    response.comments
  ) {
    return response.comments;
  }

  return [];
}


// ============================================================
// EXTRACT TEXT FROM JIRA DOCUMENT
// ============================================================

function extraerTextoComentario(body) {

  if (!body) {
    return '';
  }

  let resultado = '';

  function recorrer(node) {

    if (!node) {
      return;
    }

    if (
      node.type === 'text' &&
      node.text
    ) {
      resultado += node.text;
    }

    if (
      node.content &&
      Array.isArray(node.content)
    ) {

      node.content.forEach(
        recorrer
      );

      if (
        node.type === 'paragraph'
      ) {
        resultado += '\n';
      }
    }
  }

  recorrer(body);

  return resultado.trim();
}


// ============================================================
// SEND JIRA COMMENT → ORIGINAL SENDER
// ============================================================

function enviarComentarioPorEmail(
  destinatario,
  asuntoOriginal,
  issueKey,
  texto,
  messageIdOriginal,
  gmailThreadId
) {

  const asunto =
    /^re:/i.test(asuntoOriginal)
      ? asuntoOriginal
      : 'Re: ' + asuntoOriginal;

  const cuerpo =
    CONFIG.JIRA_REPLY_PREFIX +
    ' (' +
    issueKey +
    '):\n\n' +
    texto +
    '\n\n---\n' +
    CONFIG.JIRA_REPLY_FOOTER;

  let rawMessage =
    'From: ' +
    CONFIG.GMAIL_FROM +
    '\r\n' +
    'To: ' +
    destinatario +
    '\r\n' +
    'Subject: ' +
    asunto +
    '\r\n';

  // Preserve the original email thread.
  if (messageIdOriginal) {

    rawMessage +=
      'In-Reply-To: ' +
      messageIdOriginal +
      '\r\n';

    rawMessage +=
      'References: ' +
      messageIdOriginal +
      '\r\n';
  }

  rawMessage +=
    'Content-Type: text/plain; charset="UTF-8"\r\n' +
    'MIME-Version: 1.0\r\n' +
    '\r\n' +
    cuerpo;

  const encodedMessage =
    Utilities.base64EncodeWebSafe(
      Utilities
        .newBlob(rawMessage)
        .getBytes()
    );

  Gmail.Users.Messages.send(
    {
      raw: encodedMessage,
      threadId: gmailThreadId
    },
    'me'
  );

  Logger.log(
    'Jira reply sent to: ' +
    destinatario +
    ' | Gmail thread: ' +
    gmailThreadId
  );
}


// ============================================================
// STORE ORIGINAL SENDER AND MESSAGE-ID
// ============================================================

function guardarDatosOriginalesThread(
  thread,
  message
) {

  const properties =
    PropertiesService
      .getScriptProperties();

  const from =
    message.getFrom();

  const match =
    from.match(
      /[\w.+-]+@[\w.-]+\.\w+/
    );

  if (match) {

    properties.setProperty(
      'THREAD_FROM_' +
      thread.getId(),
      match[0]
    );
  }

  const messageId =
    message.getHeader(
      'Message-ID'
    );

  if (messageId) {

    properties.setProperty(
      'THREAD_MESSAGE_ID_' +
      thread.getId(),
      messageId
    );
  }
}


// ============================================================
// GET ORIGINAL SENDER
// ============================================================

function buscarRemitenteThread(thread) {

  return PropertiesService
    .getScriptProperties()
    .getProperty(
      'THREAD_FROM_' +
      thread.getId()
    );
}


// ============================================================
// GET ORIGINAL MESSAGE-ID
// ============================================================

function buscarMessageIdThread(thread) {

  return PropertiesService
    .getScriptProperties()
    .getProperty(
      'THREAD_MESSAGE_ID_' +
      thread.getId()
    );
}


// ============================================================
// GET ORIGINAL SUBJECT
// ============================================================

function buscarAsuntoOriginal(thread) {

  const messages =
    thread.getMessages();

  if (!messages.length) {
    return CONFIG.FALLBACK_REPLY_SUBJECT;
  }

  return messages[0].getSubject();
}


// ============================================================
// PROCESS EMAIL ATTACHMENTS
// ============================================================

function procesarAdjuntos(
  issueKey,
  message
) {

  const attachments =
    message.getAttachments();

  attachments.forEach(file => {

    const blob =
      file.copyBlob();

    const token =
      PropertiesService
        .getScriptProperties()
        .getProperty(
          'JIRA_API_TOKEN'
        );

    const auth =
      Utilities.base64Encode(
        CONFIG.JIRA_EMAIL +
        ':' +
        token
      );

    const response =
      UrlFetchApp.fetch(
        CONFIG.JIRA_URL +
        '/rest/api/3/issue/' +
        encodeURIComponent(issueKey) +
        '/attachments',
        {
          method: 'post',

          headers: {
            'Authorization':
              'Basic ' + auth,

            'X-Atlassian-Token':
              'no-check'
          },

          payload: {
            file: blob
          },

          muteHttpExceptions: true
        }
      );

    Logger.log(
      'Attachment response: ' +
      response.getContentText()
    );
  });
}


// ============================================================
// JIRA API REQUEST
// ============================================================

function jiraRequest(
  endpoint,
  method,
  payload
) {

  const token =
    PropertiesService
      .getScriptProperties()
      .getProperty(
        'JIRA_API_TOKEN'
      );

  if (!token) {

    throw new Error(
      'JIRA_API_TOKEN is not configured in Script Properties.'
    );
  }

  const auth =
    Utilities.base64Encode(
      CONFIG.JIRA_EMAIL +
      ':' +
      token
    );

  const options = {

    method: method,

    headers: {
      'Authorization':
        'Basic ' + auth,

      'Accept':
        'application/json',

      'Content-Type':
        'application/json'
    },

    muteHttpExceptions: true
  };

  if (payload) {

    options.payload =
      JSON.stringify(payload);
  }

  const response =
    UrlFetchApp.fetch(
      CONFIG.JIRA_URL +
      endpoint,
      options
    );

  const code =
    response.getResponseCode();

  const text =
    response.getContentText();

  Logger.log(
    code + ' - ' + text
  );

  if (
    code >= 200 &&
    code < 300
  ) {

    return text
      ? JSON.parse(text)
      : {};
  }

  throw new Error(
    'Jira API error ' +
    code +
    ': ' +
    text
  );
}


// ============================================================
// GMAIL ↔ JIRA THREAD MAPPING
// ============================================================

function buscarIssueDelThread(thread) {

  return PropertiesService
    .getScriptProperties()
    .getProperty(
      'THREAD_' +
      thread.getId()
    );
}


function guardarIssueDelThread(
  thread,
  issueKey
) {

  PropertiesService
    .getScriptProperties()
    .setProperty(
      'THREAD_' +
      thread.getId(),
      issueKey
    );
}


// ============================================================
// CLEAN EMAIL BODY
// ============================================================

function limpiarTextoInicial(body) {

  // Remove quoted replies in Spanish.
  body =
    body.split(
      /El .* escribió:/
    )[0];

  // Remove quoted replies in English.
  body =
    body.split(
      /On .* wrote:/
    )[0];

  // Remove an optional configurable email signature.
  if (
    CONFIG.EMAIL_SIGNATURE_TO_REMOVE
  ) {

    body =
      body.split(
        CONFIG.EMAIL_SIGNATURE_TO_REMOVE
      )[0];
  }

  return body.trim();
}


// ============================================================
// INSTALL AUTOMATION
// ============================================================

function instalarAutomatizacion() {

  // Delete existing triggers to prevent duplicates.
  const triggers =
    ScriptApp.getProjectTriggers();

  triggers.forEach(trigger => {
    ScriptApp.deleteTrigger(trigger);
  });

  // Check incoming Gmail messages every 5 minutes.
  ScriptApp.newTrigger(
    'procesarCorreos'
  )
    .timeBased()
    .everyMinutes(5)
    .create();

  // Check Jira comments every 5 minutes.
  ScriptApp.newTrigger(
    'procesarComentariosJira'
  )
    .timeBased()
    .everyMinutes(5)
    .create();

  Logger.log(
    'Automation installed successfully.'
  );
}
