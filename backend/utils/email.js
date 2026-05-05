const https = require("https");
require("dotenv").config();

/**
 * Core function to send emails via Brevo API (HTTPS)
 * This avoids SMTP port blocking on Render.
 */
async function sendEmailViaBrevo(toEmail, subject, htmlContent) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = "nandunusgavai@gmail.com"; // Verified email in Brevo

  if (!apiKey) {
    console.error("[EmailService] ERROR: BREVO_API_KEY is missing in .env");
    throw new Error("Email service configuration missing");
  }

  const data = JSON.stringify({
    sender: { name: "CivicLink Support", email: senderEmail },
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
      'api-key': apiKey,
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          console.error("[EmailService] Brevo API Error:", body);
          reject(new Error(`Brevo API returned status ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error("[EmailService] HTTPS Request Error:", error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Sends a welcome email to a new user.
 */
async function sendWelcomeEmail(toEmail, name) {
  const subject = "Welcome to CivicLink";
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #2563eb;">Welcome to CivicLink, ${name}!</h2>
      <p>Thank you for joining our community. We are excited to have you on board.</p>
      <p>With CivicLink, you can easily file complaints, track their status, and contribute to a better community.</p>
      <div style="margin-top: 30px; padding: 20px; background: #f3f4f6; border-radius: 8px;">
        <p style="margin: 0;"><strong>Get Started:</strong> Log in to your dashboard to file your first complaint.</p>
      </div>
    </div>
  `;

  try {
    await sendEmailViaBrevo(toEmail, subject, htmlContent);
    console.log("[EmailService] Welcome email sent via Brevo to:", toEmail);
  } catch (error) {
    console.error("[EmailService] Error sending welcome email:", error);
    throw error;
  }
}

/**
 * Sends an OTP for password reset.
 */
async function sendOTPEmail(toEmail, otp) {
  const subject = "Your Password Reset OTP";
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #2563eb;">Password Reset Request</h2>
      <p>You requested a password reset. Use the following OTP to proceed:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; text-align: center; padding: 20px; background: #f3f4f6; border-radius: 8px; color: #2563eb; margin: 20px 0;">
        ${otp}
      </div>
      <p>This OTP is valid for 10 minutes. If you didn't request this, please ignore this email.</p>
    </div>
  `;

  // Always log OTP for verification
  console.log(`[EmailService] Generated OTP for ${toEmail}: ${otp}`);

  try {
    await sendEmailViaBrevo(toEmail, subject, htmlContent);
    console.log("[EmailService] OTP email sent via Brevo to:", toEmail);
  } catch (error) {
    console.error("[EmailService] Error sending OTP email:", error);
    throw error;
  }
}

/**
 * Sends a confirmation email when a new complaint is filed.
 */
async function sendComplaintFiledEmail(toEmail, complaint) {
  const subject = `CivicLink: Complaint Received - ${complaint.title}`;
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #2563eb;">Complaint Received</h2>
      <p>Your complaint has been successfully submitted and is now being processed.</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Complaint ID:</strong> ${complaint._id}</p>
        <p style="margin: 5px 0 0 0;"><strong>Title:</strong> ${complaint.title}</p>
      </div>
      <p>You will receive email notifications as soon as an authority updates the status.</p>
    </div>
  `;

  try {
    await sendEmailViaBrevo(toEmail, subject, htmlContent);
    console.log("[EmailService] Complaint filing confirmation sent via Brevo to:", toEmail);
  } catch (error) {
    console.error("[EmailService] Error sending filing confirmation:", error);
    throw error;
  }
}

/**
 * Sends a status update email.
 */
async function sendStatusUpdateEmail(toEmail, complaint, newStatus) {
  const subject = `CivicLink: Update on your complaint - ${complaint.title}`;
  const loginLink = "https://civic-link-9kis-2026.vercel.app/login";
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #2563eb;">Status Updated</h2>
      <p>There has been a change in the status of your complaint: <strong>${complaint.title}</strong>.</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
        <p style="margin: 0; font-size: 16px;">New Status: <strong>${newStatus}</strong></p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginLink}" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Complaint Dashboard</a>
      </div>
    </div>
  `;

  try {
    await sendEmailViaBrevo(toEmail, subject, htmlContent);
    console.log("[EmailService] Status update email sent via Brevo to:", toEmail);
  } catch (error) {
    console.error("[EmailService] Error sending status update email:", error);
    throw error;
  }
}

module.exports = { 
  sendWelcomeEmail, 
  sendOTPEmail, 
  sendComplaintFiledEmail, 
  sendStatusUpdateEmail 
};
