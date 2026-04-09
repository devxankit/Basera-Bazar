const axios = require('axios');
require('dotenv').config();

/**
 * Sends an OTP to a target phone number using the SMSIndiaHub API.
 * 
 * Uses the SMSIndiaHub REST API endpoint: /api/mt/SendSMS
 * with APIKey-based authentication + DLT Template ID.
 *
 * @param {string} phone - The 10-digit Indian mobile number
 * @param {string} otp - The 6-digit verification code to send
 * @returns {boolean} - Returns true if successful, false otherwise.
 */
const sendOTP = async (phone, otp) => {
  try {
    // 1. Pull credentials from environment variables
    const apiKey = process.env.SMS_API_KEY; // The API Key from SMSIndiaHub dashboard
    const senderId = process.env.SMS_SENDER_ID;
    const templateId = process.env.SMS_DLT_TEMPLATE_ID;
    const entityId = process.env.SMS_ENTITY_ID;

    // 2. Guard clause: if credentials are not set, run in development mock mode
    if (!apiKey || apiKey === 'your_smsindiahub_api_key') {
      console.log(`\n[DEVELOPMENT MODE - MOCK SMS]`);
      console.log(`>> OTP: ${otp} would have been sent to +91${phone}`);
      console.log(`>> To enable real SMS, set SMS_PASSWORD (API key) in .env\n`);
      return true; // Pretend success in dev mode
    }
    const appName = "Basera Bazar";

    // 3. The SMS message text — must exactly match your DLT registered template!
    const message = `Welcome to the ${appName} powered by SMSINDIAHUB. Your OTP for registration is ${otp}`;

    // 4. URL-encode the message so special characters don't break the URL
    const encodedMessage = encodeURIComponent(message);

    // 5. Build the correct SMSIndiaHub API URL
    // Endpoint: /api/mt/SendSMS  (APIKey-based — confirmed working)
    // Parameters:
    //   APIKey       = your API key from the dashboard
    //   senderid     = your registered Sender ID (e.g., SMSHUB)
    //   channel      = 2 (Transactional)
    //   DCS          = 0 (Plain text encoding)
    //   flashsms     = 0 (Not a flash message)
    //   number       = recipient phone with country code (91XXXXXXXXXX)
    //   text         = the OTP message
    //   route        = 2 (Transactional route)
    //   dlttemplateid = your approved DLT Template ID (mandatory in India)
    const url = `http://cloud.smsindiahub.in/api/mt/SendSMS`
      + `?APIKey=${encodeURIComponent(apiKey)}`
      + `&senderid=${encodeURIComponent(senderId)}`
      + `&channel=2`
      + `&DCS=0`
      + `&flashsms=0`
      + `&number=91${phone}`
      + `&text=${encodedMessage}`
      + `&route=2`
      + (templateId ? `&dlttemplateid=${templateId}` : '')
      + (entityId ? `&entityid=${entityId}` : '');

    console.log(`[SMS] Sending OTP to +91${phone} via SMSIndiaHub...`);
    const startTime = Date.now();

    // 6. Fire the HTTP GET request to the SMSIndiaHub REST API
    const response = await axios.get(url, { timeout: 10000 });
    const endTime = Date.now();
    console.log(`[SMS] Provider responded in ${endTime - startTime}ms`);

    // 7. Log the full response for debugging
    console.log(`[SMS] Provider Response:`, JSON.stringify(response.data));

    // 8. Check for success — SMSIndiaHub returns ErrorCode "000" for success
    if (response.data && response.data.ErrorCode === '000') {
      console.log(`[SMS] ✅ OTP sent successfully to +91${phone}`);
      console.log(`[SMS] Total execution time: ${Date.now() - startTime}ms`);
      return true;
    } else {
      console.error(`[SMS] ❌ Provider rejected:`, response.data?.ErrorMessage || response.data);
      return false;
    }

  } catch (error) {
    // Network failure or timeout
    console.error(`[SMS] ❌ Network error sending SMS:`, error.message);
    return false;
  }
};

module.exports = {
  sendOTP
};
