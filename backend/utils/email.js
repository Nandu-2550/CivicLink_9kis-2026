const nodemailer = require("nodemailer");



/**
 * Sends a status update email to the citizen.
 * @param {string} toEmail - The citizen's email address
 * @param {object} complaint - The complaint object
 * @param {string} newStatus - The new status of the complaint
 */
async function sendStatusUpdateEmail(toEmail, complaint, newStatus) {
  try {
    const loginLink = process.env.FRONTEND_URL || "https://civic-link-9kis-2026.vercel.app/";

    // Configure the transporter fresh on every request (crucial for Vercel serverless)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // upgrade later with STARTTLS
      auth: {
        user: "nandunusgavai@gmail.com",
        pass: "ljuu gnae dkis csth",
      },
      connectionTimeout: 5000, // 5 seconds to prevent hanging
      socketTimeout: 5000,
    });

    const mailOptions = {
      from: '"CivicLink Support" <nandunusgavai@gmail.com>',
      to: toEmail,
      subject: `CivicLink: Update on your complaint - ${complaint.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #eaeaea; border-radius: 10px;">
          <h2 style="color: #0ea5e9;">CivicLink Complaint Update</h2>
          <p>Hello,</p>
          <p>There has been progress on your complaint: <strong>${complaint.title}</strong>.</p>
          <p>The current status is now: <span style="background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-weight: bold; color: #374151;">${newStatus}</span></p>
          <br/>
          <p>You can check the full details, timeline, and view any resolution proofs provided by the authority by logging into your dashboard.</p>
          <div style="margin-top: 30px; margin-bottom: 30px;">
            <a href="${loginLink}" style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Login to CivicLink Dashboard</a>
          </div>
          <p style="color: #6b7280; font-size: 12px;">If you did not submit this complaint, please ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Status update email sent successfully:", info.messageId);
  } catch (error) {
    console.error("Failed to send status update email:", error.message);
    // We intentionally don't throw the error so it doesn't crash the main status update flow.
  }
}

module.exports = { sendStatusUpdateEmail };
