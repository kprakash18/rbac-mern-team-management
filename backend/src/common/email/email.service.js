import nodemailer from "nodemailer";
import { getInvitationEmailHtml } from "./templates/invitation.template.js";

let transporter = null;

/**
 * Initialize or retrieve the Nodemailer transporter
 */
function getTransporter() {
  if (transporter) return transporter;

  const hasSmtpConfig = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (hasSmtpConfig) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development fallback transporter (logs preview URL / prints to console)
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: "unix",
      buffer: true,
    });
  }

  return transporter;
}

/**
 * Send a Team Invitation Email
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.inviterName - Name of the person who sent the invite
 * @param {string} options.teamName - Name of the team
 * @param {string} options.inviteUrl - Link with token to accept the invitation
 * @param {Date} [options.expiresAt] - Expiration date of the invitation
 */
export async function sendInvitationEmail({ to, inviterName, teamName, inviteUrl, expiresAt }) {
  const mailClient = getTransporter();
  const fromAddress = process.env.EMAIL_FROM || '"Team Management System" <no-reply@teammanager.local>';

  const htmlContent = getInvitationEmailHtml({
    inviterName,
    teamName,
    inviteUrl,
    expiresAt,
  });

  try {
    const info = await mailClient.sendMail({
      from: fromAddress,
      to,
      subject: `You've been invited to join team "${teamName}"`,
      text: `${inviterName} has invited you to join ${teamName}. Accept your invitation here: ${inviteUrl}`,
      html: htmlContent,
    });

    console.log(`✉️ [Email Service] Invitation email sent to ${to} for team "${teamName}"`);
    return info;
  } catch (error) {
    console.error(`❌ [Email Service] Failed to send email to ${to}:`, error.message);
    return null;
  }
}

