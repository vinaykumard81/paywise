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

/**
 * Asynchronously sends an email using the provided Email object.
 *
 * @param email An Email object containing recipient, subject, and body.
 * @returns A promise that resolves when the email is successfully sent.
 */
export async function sendEmail(email: Email): Promise<void> {
  // TODO: Implement this by calling an Email API.
  console.log(`Sending email to ${email.to} with subject ${email.subject}`);
  return Promise.resolve();
}
