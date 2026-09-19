export const FALLBACK_GENERAL = {
  id: 'grp-general',
  name: 'general',
  topic: 'Workspace general chat channel',
  memberIds: [],
  isDefault: true,
};

export function normalizeTeamMember(member) {
  const user = member.user || member.userId || {};
  const name = user.name || member.name || 'Member';
  const userId = String(user._id || user.id || (typeof member.userId === 'string' ? member.userId : null) || member._id || member.id);
  const role = member.roles?.[0]?.name || member.role?.name || member.role || 'Member';

  return {
    id: userId,
    userId,
    membershipId: member._id || member.id,
    name,
    email: user.email || member.email || '',
    role,
    teamRole: role,
  };
}

export function normalizeChannel(channel) {
  return {
    ...channel,
    id: String(channel._id || channel.id),
    memberIds: (channel.memberIds || []).map(String),
  };
}

export function normalizeIncomingMessage(incoming, fallbackGroupId) {
  const id = incoming._id || incoming.id;
  const senderId = incoming.sender?.id || incoming.sender?._id || incoming.senderId;
  const text = incoming.content || incoming.text;

  return {
    id,
    _id: id,
    groupId: incoming.groupId || fallbackGroupId,
    senderId,
    senderName: incoming.sender?.name || incoming.senderName || 'Team Member',
    senderRole: incoming.sender?.role || 'Member',
    text,
    isEdited: Boolean(incoming.isEdited),
    timestamp: incoming.createdAt ? new Date(incoming.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
    createdAt: incoming.createdAt || new Date().toISOString(),
  };
}

export function normalizeHistoryMessage(message, fallbackGroupId) {
  return {
    id: message._id || message.id,
    _id: message._id || message.id,
    groupId: message.groupId || fallbackGroupId,
    senderId: message.sender?.id || message.sender?._id || message.senderId || 'member',
    senderName: message.sender?.name || message.senderName || 'Team Member',
    senderRole: message.sender?.role || 'Member',
    text: message.content || message.text,
    isEdited: Boolean(message.isEdited),
    timestamp: message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
    createdAt: message.createdAt,
  };
}

export function dedupeMessages(rawMessages) {
  const seen = new Set();
  const serverMessageKeys = new Set(
    rawMessages
      .filter((message) => message._id && !String(message.id).startsWith('msg-'))
      .map((message) => `${message.senderId}_${message.text}`)
  );

  return rawMessages.filter((message) => {
    const key = message._id || message.id;
    if (seen.has(key)) return false;
    seen.add(key);
    if (String(message.id).startsWith('msg-') && serverMessageKeys.has(`${message.senderId}_${message.text}`)) return false;
    return true;
  });
}
