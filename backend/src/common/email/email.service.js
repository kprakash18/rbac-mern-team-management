import "dotenv/config";
import nodemailer from "nodemailer";
import { getInvitationEmailHtml } from "./templates/invitation.template.js";
import { getRoleAssignedEmailHtml } from "./templates/role-assigned.template.js";

/**
 * Initialize or retrieve the Nodemailer transporter
 */
function getTransporter() {
  const hasSmtpConfig = (process.env.SMTP_HOST || process.env.SMTP_USER) && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (hasSmtpConfig) {
    const isGmail = process.env.SMTP_HOST?.includes('gmail') || process.env.SMTP_USER?.includes('@gmail.com');
    if (isGmail) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS?.trim(),
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  // Development fallback transporter (logs preview URL / prints to console)
  return nodemailer.createTransport({
    streamTransport: true,
    newline: "unix",
    buffer: true,
  });
}

/**
 * Send a Team Invitation Email (for new or suspended users)
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.inviterName - Name of the person who sent the invite
 * @param {string} options.teamName - Name of the team
 * @param {string} options.inviteUrl - Link with token to accept the invitation
 * @param {Date} [options.expiresAt] - Expiration date of the invitation
 */
export async function sendInvitationEmail({ to, teamName, inviteUrl, expiresAt }) {
  const mailClient = getTransporter();
  const fromAddress = process.env.EMAIL_FROM || (process.env.SMTP_USER ? `"Team Management System" <${process.env.SMTP_USER}>` : '"Team Management System" <no-reply@teammanager.local>');

  const htmlContent = getInvitationEmailHtml({
    teamName,
    inviteUrl,
    expiresAt,
  });

  try {
    const info = await mailClient.sendMail({
      from: fromAddress,
      to,
      subject: `You've been invited to join team "${teamName}"`,
      text: `You have been invited to join ${teamName}. Accept your invitation here: ${inviteUrl}`,
      html: htmlContent,
    });

    console.log(`✉️ [Email Service] Invitation email sent to ${to} for team "${teamName}"`);
    return info;
  } catch (error) {
    console.error(`❌ [Email Service] Failed to send email to ${to}:`, error.message);
    return null;
  }
}

/**
 * Send a Role Assignment Email (for active existing users)
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} [options.recipientName] - Recipient name
 * @param {string} options.teamName - Name of the team
 * @param {string} [options.roleName] - Assigned role name
 * @param {string} options.workspaceUrl - Link to open the workspace
 */
export async function sendRoleAssignedEmail({ to, recipientName, teamName, roleName, workspaceUrl }) {
  const mailClient = getTransporter();
  const fromAddress = process.env.EMAIL_FROM || (process.env.SMTP_USER ? `"Team Management System" <${process.env.SMTP_USER}>` : '"Team Management System" <no-reply@teammanager.local>');

  const htmlContent = getRoleAssignedEmailHtml({
    recipientName,
    teamName,
    roleName,
    workspaceUrl,
  });

  try {
    const info = await mailClient.sendMail({
      from: fromAddress,
      to,
      subject: `You've been onboarded to team "${teamName}"`,
      text: `You have been onboarded to team "${teamName}" with the role "${roleName || "Team Member"}". Open workspace: ${workspaceUrl}`,
      html: htmlContent,
    });

    console.log(`✉️ [Email Service] Role assigned email sent to ${to} for team "${teamName}"`);
    return info;
  } catch (error) {
    console.error(`❌ [Email Service] Failed to send role assigned email to ${to}:`, error.message);
    return null;
  }
}


