/**
 * Generates a modern, responsive HTML email template for team invitations.
 * 
 * @param {Object} options
 * @param {string} options.inviterName - Name of the inviter
 * @param {string} options.teamName - Name of the team
 * @param {string} options.inviteUrl - Link with token to accept the invitation
 * @param {Date} [options.expiresAt] - Invitation expiration date
 * @returns {string} Fully formatted HTML string
 */
export function getInvitationEmailHtml({ inviterName, teamName, inviteUrl, expiresAt }) {
  const expiryText = expiresAt
    ? `This invitation expires on ${new Date(expiresAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : "This invitation link is valid for 1 hour.";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Invitation</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 40px 16px;
      box-sizing: border-box;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      font-size: 22px;
      margin: 0;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .header p {
      color: #94a3b8;
      font-size: 14px;
      margin: 6px 0 0 0;
    }
    .content {
      padding: 36px 32px;
      color: #334155;
      font-size: 15px;
      line-height: 1.65;
    }
    .invite-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
      text-align: center;
    }
    .team-badge {
      display: inline-block;
      background-color: #e0e7ff;
      color: #3730a3;
      font-weight: 700;
      font-size: 16px;
      padding: 6px 14px;
      border-radius: 6px;
      margin-top: 4px;
    }
    .cta-container {
      text-align: center;
      margin: 32px 0 24px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.25);
    }
    .cta-button:hover {
      background: #1d4ed8;
    }
    .expiry-note {
      text-align: center;
      font-size: 13px;
      color: #64748b;
      margin: 0;
    }
    .divider {
      height: 1px;
      background-color: #e2e8f0;
      margin: 28px 0;
    }
    .raw-link {
      font-size: 12px;
      color: #64748b;
      word-break: break-all;
    }
    .raw-link a {
      color: #2563eb;
      text-decoration: underline;
    }
    .footer {
      background-color: #f8fafc;
      padding: 20px 24px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>Workspace Team Invitation</h1>
        <p>Real-Time RBAC & Collaborative Management</p>
      </div>

      <div class="content">
        <p>Hello,</p>
        <p><strong>${inviterName}</strong> has invited you to collaborate and join the team:</p>
        
        <div class="invite-box">
          <div style="font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px;">Team</div>
          <div class="team-badge">${teamName}</div>
        </div>

        <p>Click the button below to accept your invitation, set up your account credentials, and access the workspace dashboard:</p>

        <div class="cta-container">
          <a href="${inviteUrl}" class="cta-button" target="_blank">Accept Invitation & Join Team</a>
        </div>

        <p class="expiry-note">⏳ ${expiryText}</p>

        <div class="divider"></div>

        <p class="raw-link">
          If the button above does not work, copy and paste this link into your web browser:<br>
          <a href="${inviteUrl}">${inviteUrl}</a>
        </p>

        <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">
          If you were not expecting this invitation, you can safely disregard this email.
        </p>
      </div>

      <div class="footer">
        &copy; ${new Date().getFullYear()} Team Management System. Secure, Multi-Tenant RBAC Platform.
      </div>
    </div>
  </div>
</body>
</html>
`;
}
