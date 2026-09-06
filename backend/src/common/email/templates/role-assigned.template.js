export function getRoleAssignedEmailHtml({ recipientName, teamName, roleName = "Team Member", workspaceUrl }) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>New Role Assigned</title></head>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#334155;">
  <div style="max-width:540px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
    <div style="background:#0f172a;padding:28px 24px;text-align:center;color:#fff;">
      <h1 style="margin:0;font-size:20px;font-weight:700;">Workspace Access Update</h1>
      <p style="margin:6px 0 0;color:#94a3b8;font-size:13px;">Team Management System</p>
    </div>
    <div style="padding:28px 24px;">
      <p style="margin:0 0 16px;">Hello <strong>${recipientName}</strong>,</p>
      <p style="margin:0 0 16px;">You have been assigned the <strong>${roleName}</strong> role in <strong>${teamName}</strong>.</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${workspaceUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;">Open Workspace</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}
