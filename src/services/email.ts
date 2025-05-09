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
}

const elasticEmailApiKey = process.env.ELASTIC_EMAIL_API_KEY;
const elasticEmailFromEmail = process.env.ELASTIC_EMAIL_FROM_EMAIL;

let isElasticEmailConfigured = false;

if (elasticEmailApiKey && elasticEmailFromEmail) {
  isElasticEmailConfigured = true;
  console.log("Elastic Email client configured successfully.");
} else {
  console.warn(
    'Elastic Email credentials (ELASTIC_EMAIL_API_KEY, ELASTIC_EMAIL_FROM_EMAIL) are not fully configured in .env. Email functionality will be mocked.'
  );
}

/**
 * Asynchronously sends an email using the provided Email object via Elastic Email.
 *
 * @param email An Email object containing recipient, subject, and body.
 * @returns A promise that resolves when the email is successfully sent or mocked.
 */
export async function sendEmail(email: Email): Promise<void> {
  if (!isElasticEmailConfigured || !elasticEmailFromEmail) {
    console.log(`Mock Email to ${email.to} with subject "${email.subject}": ${email.body}`);
    console.warn('Email not sent. Elastic Email client not configured or from email missing. Ensure ELASTIC_EMAIL_API_KEY and ELASTIC_EMAIL_FROM_EMAIL are set in .env.');
    return Promise.resolve();
  }

  const emailData = new URLSearchParams();
  emailData.append('apikey', elasticEmailApiKey);
  emailData.append('subject', email.subject);
  emailData.append('from', elasticEmailFromEmail);
  emailData.append('to', email.to);
  emailData.append('bodyHtml', email.body);
  emailData.append('isTransactional', 'true');


  try {
    const response = await fetch('https://api.elasticemail.com/v2/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: emailData.toString(),
    });

    const responseData = await response.json();

    if (response.ok && responseData.success) {
      console.log(`Email sent to ${email.to} via Elastic Email.`);
    } else {
      console.error(`Error sending email via Elastic Email to ${email.to}:`, responseData.error || response.statusText);
      // Fallback to mock behavior if sending fails
      console.log(`Mock Email (due to Elastic Email error) to ${email.to} with subject "${email.subject}": ${email.body}`);
      // Optionally, re-throw the error or handle it in a way that informs the user
      // For this application, we'll resolve to avoid breaking the flow.
      // throw new Error(`Failed to send email via Elastic Email: ${responseData.error || response.statusText}`);
    }
  } catch (error) {
    console.error(`Error sending email via Elastic Email to ${email.to}:`, error);
    // Fallback to mock behavior if sending fails
    console.log(`Mock Email (due to Elastic Email error) to ${email.to} with subject "${email.subject}": ${email.body}`);
    // throw new Error('Failed to send email via Elastic Email.');
  }
}
