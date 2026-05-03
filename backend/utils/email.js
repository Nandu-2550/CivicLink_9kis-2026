const nodemailer = require("nodemailer");
require("dotenv").config();

/**
 * Sends a status update email to the citizen.
 * @param {string} toEmail - The citizen's email address
 * @param {object} complaint - The complaint object
 * @param {string} newStatus - The new status of the complaint
 */
async function sendStatusUpdateEmail(toEmail, complaint, newStatus) {
  // Input validation
  if (!toEmail || !toEmail.includes("@")) {
    console.error("[EmailService] Invalid recipient email address:", toEmail);
    return;
  }
  if (!complaint || !complaint.title) {
    console.error("[EmailService] Missing complaint details for email dispatch.");
    return;
  }

  console.log(`[EmailService] Preparing to send status update email to: ${toEmail} for complaint: ${complaint._id || "N/A"}`);
  
  try {
    const loginLink = process.env.FRONTEND_URL || "https://civic-link-9kis-2026.vercel.app/";
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      throw new Error("Email credentials (EMAIL_USER or EMAIL_PASS) are missing in environment variables.");
    }

    // Configure the transporter
    // Using the 'service' option for Gmail is the recommended and most optimized approach
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      // Timeouts are important for serverless environments to avoid hanging functions
      connectionTimeout: 10000, 
      greetingTimeout: 10000,
      socketTimeout: 15000
    });

    const mailOptions = {
      from: `"CivicLink Support" <${emailUser}>`,
      to: toEmail,
      subject: `CivicLink: Update on your complaint - ${complaint.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #eaeaea; border-radius: 10px; color: #374151;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://civic-link-9kis-2026.vercel.app/logo.png" alt="CivicLink Logo" style="max-width: 150px; height: auto;" />
          </div>
          <h2 style="color: #0ea5e9; text-align: center;">Complaint Update</h2>
          <p>Hello,</p>
          <p>There has been a change in the status of your complaint: <strong>${complaint.title}</strong>.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
            <p style="margin: 0; font-size: 16px;">New Status: <strong>${newStatus}</strong></p>
          </div>
          <p>You can view the full history, location details, and authority notes on your dashboard.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginLink}" style="background-color: #0ea5e9; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Complaint Dashboard</a>
          </div>
          <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
          <p style="color: #6b7280; font-size: 12px; text-align: center;">This is an automated notification from CivicLink. Please do not reply directly to this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("[EmailService] Email sent successfully. Message ID:", info.messageId);
    return info;
  } catch (error) {
    console.error("[EmailService] Error occurred while sending email:", error.message);
    if (error.stack) console.error(error.stack);
    // Return null or rethrow based on whether you want the parent process to handle the error
    return null;
  }
}

/**
 * Sends a confirmation email when a new complaint is filed.
 * @param {string} toEmail - The citizen's email address
 * @param {object} complaint - The complaint object
 */
async function sendComplaintFiledEmail(toEmail, complaint) {
  if (!toEmail || !toEmail.includes("@")) return;
  
  try {
    const loginLink = process.env.FRONTEND_URL || "https://civic-link-9kis-2026.vercel.app/";
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"CivicLink Support" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `CivicLink: Complaint Received - ${complaint.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #eaeaea; border-radius: 10px; color: #374151;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://civic-link-9kis-2026.vercel.app/logo.png" alt="CivicLink Logo" style="max-width: 150px; height: auto;" />
          </div>
          <h2 style="color: #0ea5e9; text-align: center;">Complaint Received</h2>
          <p>Hello,</p>
          <p>Your complaint has been successfully submitted and is now being processed.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Complaint ID:</strong> ${complaint._id}</p>
            <p style="margin: 5px 0 0 0;"><strong>Title:</strong> ${complaint.title}</p>
            <p style="margin: 5px 0 0 0;"><strong>Category:</strong> ${complaint.category}</p>
          </div>
          <p>You will receive email notifications as soon as an authority updates the status of your complaint.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginLink}" style="background-color: #0ea5e9; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Track Complaint Status</a>
          </div>
          <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
          <p style="color: #6b7280; font-size: 12px; text-align: center;">Thank you for contributing to a better community.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("[EmailService] Complaint filing confirmation sent to:", toEmail);
  } catch (error) {
    console.error("[EmailService] Error sending filing confirmation:", error.message);
  }
}

module.exports = { sendStatusUpdateEmail, sendComplaintFiledEmail };
