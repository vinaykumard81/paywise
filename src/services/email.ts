
'use server';

/**
 * Represents the data required to send an email.
 */
export interface Email {
  /**
   * The recipient's email address.
   */
  to: string;
  /**
   * The subject line of the email.
   */
  subject: string;
  /**
   * The body of the email (HTML content).
   */
  body: string;
  /**
   * The name of the sender.
   */
  fromName?: string;
}

const elasticEmailApiKey = process.env.ELASTIC_EMAIL_API_KEY;
const elasticEmailFromEmail = process.env.ELASTIC_EMAIL_FROM_EMAIL; // This should be a verified sender in Elastic Email

let isElasticEmailConfigured = false;

if (elasticEmailApiKey && elasticEmailFromEmail) {
  isElasticEmailConfigured = true;
  console.log("Elastic Email client configured successfully. Email functionality is LIVE.");
} else {
  let missingVars = [];
  if (!elasticEmailApiKey) missingVars.push('ELASTIC_EMAIL_API_KEY');
  if (!elasticEmailFromEmail) missingVars.push('ELASTIC_EMAIL_FROM_EMAIL');
  console.warn(
    `Elastic Email credentials (${missingVars.join(', ')}) are not fully configured in .env. Email functionality will be MOCKED.`
  );
}

/**
 * Asynchronously sends an email using the provided Email object via Elastic Email.
 *
 * @param email An Email object containing recipient, subject, body, and optionally fromName.
 * @returns A promise that resolves when the email is successfully sent or mocked.
 * @throws Will throw an error if sending fails and not in mock mode.
 */
export async function sendEmail(email: Email): Promise<void> {
  const fromAddress = email.fromName 
    ? `${email.fromName} <${elasticEmailFromEmail}>` 
    : elasticEmailFromEmail;

  if (!isElasticEmailConfigured || !elasticEmailFromEmail) {
    console.warn(`%cMOCK EMAIL (Elastic Email not configured):%c 
    From: ${fromAddress}
    To: ${email.to}
    Subject: "${email.subject}"
    Body: ${email.body}`,
    "color: orange; font-weight: bold;", 
    "color: orange;");
    
    let logMessage = 'REAL EMAIL NOT SENT. Elastic Email client not fully configured. ';
    let missingVars = [];
    if (!elasticEmailApiKey) missingVars.push('ELASTIC_EMAIL_API_KEY');
    if (!elasticEmailFromEmail) missingVars.push('ELASTIC_EMAIL_FROM_EMAIL');
    if (missingVars.length > 0) {
        logMessage += `Missing: ${missingVars.join(', ')}. `;
    }
    logMessage += 'Please ensure these are correctly set in your .env file.';
    console.warn(logMessage);
    // In mock mode, we resolve to not break the flow, but in a real app, you might throw.
    return Promise.resolve(); 
  }

  const emailPayload = {
    Recipients: {
      To: [email.to]
    },
    Content: {
      Body: [
        {
          ContentType: "HTML",
          Content: email.body,
          Charset: "utf-8"
        },
        {
            ContentType: "PlainText",
            Content: email.body.replace(/<[^>]*>?/gm, ''), // Basic HTML to plain text stripping
            Charset: "utf-8"
        }
      ],
      From: fromAddress,
      Subject: email.subject
    },
    Options: {
        IsTransactional: true // Important for deliverability of transactional emails
    }
  };

  try {
    console.log(`Attempting to send REAL EMAIL via Elastic Email from ${fromAddress} to ${email.to}...`);
    const response = await fetch('https://api.elasticemail.com/v4/emails/transactional', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ElasticEmail-ApiKey': elasticEmailApiKey,
      },
      body: JSON.stringify(emailPayload),
    });

    if (response.ok) {
      const responseData = await response.json(); // Elastic Email v4 usually returns transaction ID or message ID
      console.log(`Email successfully sent to ${email.to} via Elastic Email. Response:`, responseData);
    } else {
      const errorData = await response.text(); // Read as text first for more detailed error
      console.error(`Error sending email via Elastic Email to ${email.to}. Status: ${response.status}. Details: ${errorData}`);
      // Fallback to mock behavior log if sending fails, but also throw to indicate failure
      console.warn(`%cMOCK EMAIL (due to Elastic Email API error):%c 
      From: ${fromAddress}
      To: ${email.to}
      Subject: "${email.subject}"
      Body: ${email.body}`,
      "color: red; font-weight: bold;", 
      "color: red;");
      throw new Error(`Failed to send email via Elastic Email: ${errorData || response.statusText}`);
    }
  } catch (error: any) {
    console.error(`Network or unexpected error sending email via Elastic Email to ${email.to}:`, error.message || error);
     // Fallback to mock behavior log if sending fails, but also throw to indicate failure
    console.warn(`%cMOCK EMAIL (due to Elastic Email system error):%c 
    From: ${fromAddress}
    To: ${email.to}
    Subject: "${email.subject}"
    Body: ${email.body}`,
    "color: red; font-weight: bold;", 
    "color: red;");
    throw new Error(`Failed to send email via Elastic Email: ${error.message || 'System error'}`);
  }
}

