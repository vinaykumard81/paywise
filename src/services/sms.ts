
'use server';

import { Twilio } from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let client: Twilio | null = null;
let isTwilioConfigured = false;

if (accountSid && authToken && twilioPhoneNumber) {
  try {
    client = new Twilio(accountSid, authToken);
    isTwilioConfigured = true;
    console.log("Twilio client initialized successfully. SMS functionality is LIVE.");
  } catch (error) {
    console.error("Failed to initialize Twilio client:", error);
    client = null;
    isTwilioConfigured = false;
    console.warn('Twilio client initialization FAILED. SMS functionality will be MOCKED.');
  }
} else {
  isTwilioConfigured = false;
  let missingVars = [];
  if (!accountSid) missingVars.push('TWILIO_ACCOUNT_SID');
  if (!authToken) missingVars.push('TWILIO_AUTH_TOKEN');
  if (!twilioPhoneNumber) missingVars.push('TWILIO_PHONE_NUMBER');
  console.warn(
    `Twilio credentials (${missingVars.join(', ')}) are not configured in .env. SMS functionality will be MOCKED.`
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
  if (!isTwilioConfigured || !client || !twilioPhoneNumber) {
    console.log(`%cMOCK SMS (Twilio not configured):%c 
    To: ${phoneNumber}
    Message: "${message}"`, 
    "color: orange; font-weight: bold;", 
    "color: orange;");
    console.warn(
      'REAL SMS NOT SENT. Twilio client not fully initialized or Twilio phone number missing. ' +
      'Please ensure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER are correctly set in your .env file.'
    );
    return Promise.resolve();
  }

  try {
    console.log(`Attempting to send REAL SMS via Twilio to ${phoneNumber}...`);
    const twilioResponse = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: phoneNumber, // Ensure this is a E.164 formatted number e.g. +1234567890
    });
    if (twilioResponse.sid) {
        console.log(`SMS successfully sent to ${phoneNumber} via Twilio. SID: ${twilioResponse.sid}`);
    } else {
        console.warn(`SMS to ${phoneNumber} submitted to Twilio, but no SID returned immediately. Status: ${twilioResponse.status}, Error: ${twilioResponse.errorMessage}`);
    }
  } catch (error: any) {
    console.error(`Error sending SMS via Twilio to ${phoneNumber}:`, error.message || error);
    // Fallback to mock behavior log if sending fails
    console.log(`%cMOCK SMS (due to Twilio API error):%c 
    To: ${phoneNumber}
    Message: "${message}"`,
    "color: red; font-weight: bold;", 
    "color: red;");
    // For this application, we'll resolve to avoid breaking the flow.
    // You might want to throw error in a production scenario depending on requirements.
    // throw new Error('Failed to send SMS via Twilio.');
  }
}

