const nodemailer = require("nodemailer");
require("dotenv").config();

function createTransporter() {
  const emailUser = process.env.EMAIL_USER?.trim();
  const emailPass = process.env.EMAIL_PASS?.trim();

  if (!emailUser || !emailPass) {
    console.error("[EmailService] CRITICAL: Email credentials missing.");
    return null;
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Must be false for 587
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    tls: {
      rejectUnauthorized: false,
      minVersion: "TLSv1.2"
    },
    connectionTimeout: 10000, // Stop waiting after 10 seconds
    greetingTimeout: 10000,
    family: 4 // Force IPv4
  });
}

/**
 * Sends a welcome email to a new user.
 */
async function sendWelcomeEmail(toEmail, name) {
  const transporter = createTransporter();
  if (!transporter) throw new Error("Failed to create email transporter");

  const mailOptions = {
    from: `"CivicLink" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Welcome to CivicLink",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #2563eb;">Welcome to CivicLink, ${name}!</h2>
        <p>Thank you for joining our community. We are excited to have you on board.</p>
        <p>With CivicLink, you can easily file complaints, track their status, and contribute to a better community.</p>
        <div style="margin-top: 30px; padding: 20px; background: #f3f4f6; border-radius: 8px;">
          <p style="margin: 0;"><strong>Get Started:</strong> Log in to your dashboard to file your first complaint.</p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("[EmailService] Welcome email sent to:", toEmail);
    return info;
  } catch (error) {
    console.error("[EmailService] Error sending welcome email:", error.message);
    throw error;
  }
}

/**
 * Sends an OTP for password reset.
 */
async function sendOTPEmail(toEmail, otp) {
  const transporter = createTransporter();
  if (!transporter) throw new Error("Failed to create email transporter");

  const mailOptions = {
    from: `"CivicLink Support" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your Password Reset OTP",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #2563eb;">Password Reset Request</h2>
        <p>You requested a password reset. Use the following OTP to proceed:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; text-align: center; padding: 20px; background: #f3f4f6; border-radius: 8px; color: #2563eb; margin: 20px 0;">
          ${otp}
        </div>
        <p>This OTP is valid for 10 minutes. If you didn't request this, please ignore this email.</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("OTP Status:", info.response);
    return info;
  } catch (error) {
    console.error("[EmailService] Error sending OTP email:", error.message);
    throw error; // Ensure the backend returns 500 if email fails
  }
}

/**
 * Sends a confirmation email when a new complaint is filed.
 */
async function sendComplaintFiledEmail(toEmail, complaint) {
  const transporter = createTransporter();
  if (!transporter) throw new Error("Failed to create email transporter");

  const mailOptions = {
    from: `"CivicLink Support" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `CivicLink: Complaint Received - ${complaint.title}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #2563eb;">Complaint Received</h2>
        <p>Your complaint has been successfully submitted and is now being processed.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Complaint ID:</strong> ${complaint._id}</p>
          <p style="margin: 5px 0 0 0;"><strong>Title:</strong> ${complaint.title}</p>
        </div>
        <p>You will receive email notifications as soon as an authority updates the status.</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("[EmailService] Complaint filing confirmation sent to:", toEmail);
    return info;
  } catch (error) {
    console.error("[EmailService] Error sending filing confirmation:", error.message);
    throw error;
  }
}

/**
 * Sends a status update email.
 */
async function sendStatusUpdateEmail(toEmail, complaint, newStatus) {
  const transporter = createTransporter();
  if (!transporter) throw new Error("Failed to create email transporter");

  const loginLink = "https://civic-link-9kis-2026-peeh.vercel.app/login";

  const mailOptions = {
    from: `"CivicLink Support" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `CivicLink: Update on your complaint - ${complaint.title}`,
    html: `
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
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("[EmailService] Status update email sent to:", toEmail);
    return info;
  } catch (error) {
    console.error("[EmailService] Error sending status update email:", error.message);
    throw error;
  }
}

module.exports = { 
  sendWelcomeEmail, 
  sendOTPEmail, 
  sendComplaintFiledEmail, 
  sendStatusUpdateEmail 
};
