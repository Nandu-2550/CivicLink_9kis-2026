const https = require("https");
require("dotenv").config();

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = "nandunusgavai@gmail.com";
const SMS_SENDER = process.env.SMS_SENDER_NAME || "CivicLink";

/**
 * Core function to send emails via Brevo API
 */
async function sendEmail(toEmail, subject, htmlContent) {
  if (!BREVO_API_KEY) throw new Error("BREVO_API_KEY missing");

  const data = JSON.stringify({
    sender: { name: "CivicLink Support", email: SENDER_EMAIL },
    to: [{ email: toEmail }],
    subject: subject,
    htmlContent: htmlContent
  });

  const options = {
    hostname: 'api.brevo.com',
    port: 443,
    path: '/v3/smtp/email',
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(JSON.parse(body));
        else reject(new Error(`Brevo Email API Error: ${body}`));
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * Core function to send SMS via Brevo API
 */
async function sendSMS(toPhone, content) {
  if (!BREVO_API_KEY) throw new Error("BREVO_API_KEY missing");

  const data = JSON.stringify({
    sender: SMS_SENDER,
    recipient: toPhone,
    content: content,
    type: "transactional"
  });

  const options = {
    hostname: 'api.brevo.com',
    port: 443,
    path: '/v3/transactionalSMS/sms',
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(JSON.parse(body));
        else reject(new Error(`Brevo SMS API Error: ${body}`));
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * Universal notification function
 * Sends both Email and SMS if available
 */
async function sendNotification(user, type, data) {
  const promises = [];

  if (user.email) {
    console.log(`[NotificationService] Queueing Email for ${user.email} (Type: ${type})`);
    promises.push(sendEmailByType(user.email, user.name, type, data));
  }

  if (user.phone) {
    console.log(`[NotificationService] Queueing SMS for ${user.phone} (Type: ${type})`);
    promises.push(sendSMSByType(user.phone, type, data));
  }

  if (promises.length === 0) {
    console.warn(`[NotificationService] No contact info for user ${user._id}. Skipping.`);
    return [];
  }

  const results = await Promise.allSettled(promises);
  results.forEach((res, idx) => {
    if (res.status === 'rejected') {
      console.error(`[NotificationService] Delivery Failed:`, res.reason);
    }
  });
  return results;
}

async function sendEmailByType(email, name, type, data) {
  let subject, html;
  
  switch (type) {
    case 'WELCOME':
      subject = "Welcome to CivicLink!";
      html = `
        <div style="font-family: sans-serif; color: #333;">
          <h2 style="color: #2563eb;">Welcome, ${name}!</h2>
          <p>Thank you for joining <strong>CivicLink</strong>. We're dedicated to making your city better, one report at a time.</p>
          <p>You can now file complaints, track their status, and receive updates in real-time.</p>
          <br/>
          <p>Best Regards,<br/>The CivicLink Team</p>
        </div>
      `;
      break;
    case 'OTP':
      subject = `${data.otp} is your CivicLink code`;
      html = `
        <div style="font-family: sans-serif; color: #333; text-align: center;">
          <h2>Verification Code</h2>
          <p>Use the code below to complete your action. It is valid for 10 minutes.</p>
          <div style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 5px; margin: 20px 0;">
            ${data.otp}
          </div>
          <p style="color: #666; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      `;
      break;
    case 'COMPLAINT_FILED':
      subject = `Complaint Received: ${data.title}`;
      html = `
        <div style="font-family: sans-serif; color: #333;">
          <h2 style="color: #2563eb;">Complaint Filed Successfully</h2>
          <p>Your complaint "<strong>${data.title}</strong>" has been registered.</p>
          <p><strong>Tracking ID:</strong> ${data.id || 'N/A'}</p>
          <p>Our authorities will review it shortly. You will be notified of any progress.</p>
        </div>
      `;
      break;
    case 'STATUS_UPDATE':
      subject = `Update on your complaint: ${data.title}`;
      html = `
        <div style="font-family: sans-serif; color: #333;">
          <h2 style="color: #2563eb;">Status Update</h2>
          <p>There has been progress on your complaint: "<strong>${data.title}</strong>"</p>
          <p>New Status: <span style="background: #e0f2fe; color: #0369a1; padding: 2px 8px; rounded: 4px; font-weight: bold;">${data.newStatus}</span></p>
          ${data.note ? `<p><strong>Note from Authority:</strong> ${data.note}</p>` : ''}
          <p>Log in to your dashboard for more details.</p>
        </div>
      `;
      break;
    default:
      return;
  }

  return sendEmail(email, subject, html);
}

async function sendSMSByType(phone, type, data) {
  let content;

  switch (type) {
    case 'WELCOME':
      content = `Welcome to CivicLink! Thank you for joining us. Let's build a better city together.`;
      break;
    case 'OTP':
      content = `Your CivicLink verification code is: ${data.otp}. Valid for 10 mins.`;
      break;
    case 'COMPLAINT_FILED':
      content = `CivicLink: Your complaint "${data.title}" has been received. ID: ${data.id || 'N/A'}`;
      break;
    case 'STATUS_UPDATE':
      content = `CivicLink: Update on "${data.title}". Status: ${data.newStatus}. Check dashboard for details.`;
      break;
    default:
      return;
  }

  return sendSMS(phone, content);
}

module.exports = {
  sendNotification,
  sendEmail,
  sendSMS
};
