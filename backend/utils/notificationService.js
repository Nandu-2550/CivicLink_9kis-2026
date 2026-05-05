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
    promises.push(sendEmailByType(user.email, user.name, type, data));
  }

  if (user.phone) {
    promises.push(sendSMSByType(user.phone, type, data));
  }

  return Promise.allSettled(promises);
}

async function sendEmailByType(email, name, type, data) {
  let subject, html;
  
  switch (type) {
    case 'WELCOME':
      subject = "Welcome to CivicLink";
      html = `<h2>Welcome, ${name}!</h2><p>Thank you for joining CivicLink. Start filing your complaints today.</p>`;
      break;
    case 'OTP':
      subject = "Your Verification Code";
      html = `<h2>Verification Code</h2><p>Your code is: <strong>${data.otp}</strong></p>`;
      console.log(`[NotificationService] OTP for ${email}: ${data.otp}`);
      break;
    case 'COMPLAINT_FILED':
      subject = `Complaint Filed: ${data.title}`;
      html = `<h2>Complaint Received</h2><p>Your complaint "${data.title}" has been filed successfully.</p>`;
      break;
    case 'STATUS_UPDATE':
      subject = `Update: ${data.title}`;
      html = `<h2>Status Update</h2><p>Your complaint "${data.title}" is now: <strong>${data.newStatus}</strong></p>`;
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
      content = `Welcome to CivicLink! We're glad to have you on board.`;
      break;
    case 'OTP':
      content = `Your CivicLink verification code is: ${data.otp}. Valid for 10 mins.`;
      console.log(`[NotificationService] OTP for ${phone}: ${data.otp}`);
      break;
    case 'COMPLAINT_FILED':
      content = `CivicLink: Your complaint "${data.title}" has been received. ID: ${data.id}`;
      break;
    case 'STATUS_UPDATE':
      content = `CivicLink: Update on "${data.title}". New status: ${data.newStatus}.`;
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
