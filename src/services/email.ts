
import sgMail from '@sendgrid/mail';

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

const sendgridApiKey = process.env.SENDGRID_API_KEY;
const sendgridFromEmail = process.env.SENDGRID_FROM_EMAIL;

let isSendGridConfigured = false;

if (sendgridApiKey && sendgridFromEmail) {
  try {
    sgMail.setApiKey(sendgridApiKey);
    isSendGridConfigured = true;
    console.log("SendGrid client configured successfully.");
  } catch (error) {
    console.error("Failed to configure SendGrid client:", error);
    isSendGridConfigured = false;
  }
} else {
  console.warn(
    'SendGrid credentials (SENDGRID_API_KEY, SENDGRID_FROM_EMAIL) are not fully configured in .env. Email functionality will be mocked.'
  );
}

/**
 * Asynchronously sends an email using the provided Email object.
 *
 * @param email An Email object containing recipient, subject, and body.
 * @returns A promise that resolves when the email is successfully sent or mocked.
 */
export async function sendEmail(email: Email): Promise<void> {
  if (!isSendGridConfigured || !sendgridFromEmail) {
    console.log(`Mock Email to ${email.to} with subject "${email.subject}": ${email.body}`);
    console.warn('Email not sent. SendGrid client not configured or from email missing. Ensure SENDGRID_API_KEY and SENDGRID_FROM_EMAIL (a verified sender) are set in .env.');
    return Promise.resolve();
  }

  const msg = {
    to: email.to,
    from: sendgridFromEmail, // This must be a verified sender in your SendGrid account
    subject: email.subject,
    html: email.body,
  };

  try {
    await sgMail.send(msg);
    console.log(`Email sent to ${email.to} via SendGrid.`);
  } catch (error) {
    console.error(`Error sending email via SendGrid to ${email.to}:`, error);
    // Fallback to mock behavior if sending fails
    console.log(`Mock Email (due to SendGrid error) to ${email.to} with subject "${email.subject}": ${email.body}`);
    // Optionally, re-throw the error or handle it in a way that informs the user
    // For this application, we'll resolve to avoid breaking the flow.
    // throw new Error('Failed to send email via SendGrid.');
  }
}
