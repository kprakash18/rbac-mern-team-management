/**
 * Generates a modern, responsive HTML email template for existing active users who have been assigned a new role/team.
 * 
 * @param {Object} options
 * @param {string} options.recipientName - Name of the user
 * @param {string} options.inviterName - Name of the admin who assigned the role
 * @param {string} options.teamName - Name of the team
 * @param {string} [options.roleName] - Assigned role name
 * @param {string} options.workspaceUrl - Link to open the workspace app / login
 * @returns {string} Fully formatted HTML string
 */
export function getRoleAssignedEmailHtml({ recipientName, teamName, roleName = "Team Member", workspaceUrl }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Role Assigned</title>
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
    .team-box {
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
    .role-badge {
      display: inline-block;
      background-color: #f3e8ff;
      color: #6b21a8;
      font-weight: 700;
      font-size: 14px;
      padding: 4px 12px;
      border-radius: 6px;
      margin-top: 6px;
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
      font-weight: 600;
      font-size: 15px;
      padding: 14px 32px;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.25);
    }
    .note {
      font-size: 13px;
      color: #64748b;
      margin-top: 24px;
      border-top: 1px solid #f1f5f9;
      padding-top: 16px;
    }
    .footer {
      background-color: #f8fafc;
      padding: 20px 32px;
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
        <h1>Enterprise Team Management</h1>
        <p>Team Onboarding & Role Assignment</p>
      </div>
      <div class="content">
        <p>Hello <strong>${recipientName || "there"}</strong>,</p>
        <p>You have been onboarded to <strong>${teamName}</strong> and assigned a workspace role.</p>
        
        <div class="team-box">
          <div style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Team</div>
          <div class="team-badge">${teamName}</div>
          <div style="margin-top: 10px; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Assigned Role</div>
          <div class="role-badge">${roleName}</div>
        </div>

        <p>Since your account is already active, no password setup is required. The new team is now available in your workspace switcher.</p>

        <div class="cta-container">
          <a href="${workspaceUrl}" class="cta-button" target="_blank">Open Workspace</a>
        </div>

        <div class="note">
          <p>If you're already logged in, simply refresh or use the Workspace Switcher in the top bar to jump directly into <strong>${teamName}</strong>.</p>
        </div>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} Enterprise Team Management. All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
