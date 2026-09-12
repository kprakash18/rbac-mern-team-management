import "dotenv/config";
import nodemailer from "nodemailer";
import { getInvitationEmailHtml } from "./templates/invitation.template.js";
import { getRoleAssignedEmailHtml } from "./templates/role-assigned.template.js";

const clean = (val) => (typeof val === "string" ? val.replace(/^["']|["']$/g, "").trim() : val);

function getFromAddress() {
  const emailFrom = clean(process.env.EMAIL_FROM);
  if (emailFrom) return emailFrom;
  const smtpUser = clean(process.env.SMTP_USER);
  if (smtpUser) return `"Team Management System" <${smtpUser}>`;
  return '"Team Management System" <no-reply@teammanager.local>';
}

function getTransporter() {
  const smtpHost = clean(process.env.SMTP_HOST);
  const smtpUser = clean(process.env.SMTP_USER);
  const smtpPass = clean(process.env.SMTP_PASS)?.replace(/\s+/g, "");
  const smtpSecure = clean(process.env.SMTP_SECURE) === "true";
  const smtpPort = Number(clean(process.env.SMTP_PORT)) || (smtpSecure ? 465 : 587);

  const hasSmtpConfig = Boolean((smtpHost || smtpUser) && smtpUser && smtpPass);

  if (hasSmtpConfig) {
    const isGmail = smtpHost?.includes("gmail") || smtpUser?.includes("@gmail.com");
    if (isGmail) {
      return nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    }

    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure || smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  console.warn("[Email Service] No valid SMTP credentials configured in environment. Operating in mock streamTransport mode.");
  return nodemailer.createTransport({
    streamTransport: true,
    newline: "unix",
    buffer: true,
  });
}

export async function sendInvitationEmail({ to, teamName, inviteUrl, expiresAt }) {
  const mailClient = getTransporter();
  const fromAddress = getFromAddress();

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

    console.log(`[Email Service] Invitation email successfully sent to ${to} for team "${teamName}"`);
    return info;
  } catch (error) {
    console.error(`[Email Service] Failed to send email to ${to}:`, error.message);
    return null;
  }
}

export async function sendRoleAssignedEmail({ to, recipientName, teamName, roleName, workspaceUrl }) {
  const mailClient = getTransporter();
  const fromAddress = getFromAddress();

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

    console.log(`[Email Service] Role assigned email sent to ${to} for team "${teamName}"`);
    return info;
  } catch (error) {
    console.error(`[Email Service] Failed to send role assigned email to ${to}:`, error.message);
    return null;
  }
}
