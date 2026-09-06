export function getInvitationEmailHtml({ teamName, inviteUrl, expiresAt }) {
  const expiryText = expiresAt
    ? `This invitation expires on ${new Date(expiresAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
    : "This invitation link is valid for 1 hour.";

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Team Invitation</title></head>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#334155;">
  <div style="max-width:540px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
    <div style="background:#0f172a;padding:28px 24px;text-align:center;color:#fff;">
      <h1 style="margin:0;font-size:20px;font-weight:700;">Workspace Team Invitation</h1>
      <p style="margin:6px 0 0;color:#94a3b8;font-size:13px;">Team Management System</p>
    </div>
    <div style="padding:28px 24px;">
      <p style="margin:0 0 16px;">Hello,</p>
      <p style="margin:0 0 16px;">You have been invited to join <strong>${teamName}</strong>.</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${inviteUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;">Accept Invitation & Join Team</a>
      </div>
      <p style="text-align:center;font-size:12px;color:#64748b;margin:0 0 20px;">⏳ ${expiryText}</p>
      <hr style="border:0;border-top:1px solid #e2e8f0;margin:20px 0;">
      <p style="font-size:11px;color:#94a3b8;word-break:break-all;margin:0;">Link: <a href="${inviteUrl}" style="color:#2563eb;">${inviteUrl}</a></p>
    </div>
  </div>
</body>
</html>`;
}
