
import { Twilio } from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let client: Twilio | null = null;

if (accountSid && authToken && twilioPhoneNumber) {
  try {
    client = new Twilio(accountSid, authToken);
    console.log("Twilio client initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Twilio client:", error);
    client = null; 
  }
} else {
  console.warn(
    'Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER) are not fully configured in .env. SMS functionality will be mocked.'
  );
}

/**
 * Asynchronously sends an SMS message to the specified phone number.
 *
 * @param phoneNumber The recipient's phone number (must be E.164 formatted for Twilio).
 * @param message The text message to send.
 * @returns A promise that resolves when the SMS is successfully sent or mocked.
 */
export async function sendSMS(phoneNumber: string, message: string): Promise<void> {
  if (!client || !twilioPhoneNumber) {
    console.log(`Mock SMS to ${phoneNumber}: ${message}`);
    console.warn('SMS not sent. Twilio client not initialized or phone number missing. Ensure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER are set in .env.');
    return Promise.resolve();
  }

  try {
    await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: phoneNumber, // Ensure this is a E.164 formatted number e.g. +1234567890
    });
    console.log(`SMS sent to ${phoneNumber} via Twilio.`);
  } catch (error) {
    console.error(`Error sending SMS via Twilio to ${phoneNumber}:`, error);
    // Fallback to mock behavior if sending fails
    console.log(`Mock SMS (due to Twilio error) to ${phoneNumber}: ${message}`);
    // Optionally, re-throw the error or handle it in a way that informs the user
    // For this application, we'll resolve to avoid breaking the flow.
    // throw new Error('Failed to send SMS via Twilio.');
  }
}
