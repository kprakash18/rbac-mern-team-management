import crypto from "crypto";

export const hashToken = (rawToken) => {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
};


export const generateInvitationToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  return { rawToken, tokenHash };

};
