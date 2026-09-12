import { env } from "../../config/env.js";
import { getInvitationEmailHtml } from "./templates/invitation.template.js";
import { getRoleAssignedEmailHtml } from "./templates/role-assigned.template.js";

const clean = (val) => (typeof val === "string" ? val.replace(/^["']|["']$/g, "").trim() : val);

function parseSender() {
  const from = clean(env.emailFrom || process.env.EMAIL_FROM || "Team Management System <kethavathprakash2004@gmail.com>");
  const match = from.match(/^(?:"?([^"]*)"?\s)?(?:<?(.+@[^>]+)>?)$/);
  if (match && match[2]) {
    return {
      name: match[1]?.trim() || "Team Management System",
      email: match[2]?.trim(),
    };
  }
  return {
    name: "Team Management System",
    email: clean(env.senderEmail || process.env.SENDER_EMAIL || "kethavathprakash2004@gmail.com"),
  };
}

async function sendViaBrevo({ to, subject, htmlContent, textContent }) {
  const apiKey = clean(env.brevoApiKey || process.env.BREVO_API_KEY);
  const sender = parseSender();

  if (!apiKey) {
    console.warn(`[Email Service - Simulated] Email to ${to} ("${subject}") - (No BREVO_API_KEY configured).`);
    return { messageId: "simulated-id", simulated: true };
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        "accept": "application/json",
      },
      body: JSON.stringify({
        sender,
        to: [{ email: to }],
        subject,
        htmlContent,
        textContent,
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error(`[Email Service - Brevo Error ${response.status}] Failed to send email to ${to}:`, result.message || JSON.stringify(result));
      return null;
    }

    console.log(`[Email Service] Email successfully delivered via Brevo to ${to} (Message ID: ${result.messageId})`);
    return result;
  } catch (error) {
    console.error(`[Email Service] Network error sending email to ${to}:`, error.message);
    return null;
  }
}

export async function sendInvitationEmail({ to, teamName, inviteUrl, expiresAt }) {
  const htmlContent = getInvitationEmailHtml({
    teamName,
    inviteUrl,
    expiresAt,
  });

  const subject = `You've been invited to join team "${teamName}"`;
  const textContent = `You have been invited to join ${teamName}. Accept your invitation here: ${inviteUrl}`;

  return sendViaBrevo({
    to,
    subject,
    htmlContent,
    textContent,
  });
}

export async function sendRoleAssignedEmail({ to, recipientName, teamName, roleName, workspaceUrl }) {
  const htmlContent = getRoleAssignedEmailHtml({
    recipientName,
    teamName,
    roleName,
    workspaceUrl,
  });

  const subject = `You've been onboarded to team "${teamName}"`;
  const textContent = `You have been onboarded to team "${teamName}" with the role "${roleName || "Team Member"}". Open workspace: ${workspaceUrl}`;

  return sendViaBrevo({
    to,
    subject,
    htmlContent,
    textContent,
  });
}
