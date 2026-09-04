# Real-Time Team Chat Collaboration Feature

**Document:** Implementation Plan & Technical Architecture  
**Target Module:** Workspace Employee Portal (`frontend/src/features/workspace-app`)  
**Backend Integration:** Phase 9 Real-Time WebSockets (`backend/src/modules/chat`, `backend/src/realtime`)  
**Status:** Ready to Implement Next Session  

---

## 1. Overview & Goal

Build an enterprise-grade real-time Team Chat collaboration module inside the Employee Workspace Portal (`features/workspace-app`).

When an employee logs into a workspace (e.g. Acme Engineering as Lead Architect), they can open **Team Chat** to collaborate across team channels and 1-on-1 direct messages, with live messaging, typing indicators, and message moderation.

---

## 2. Architecture & Layout

```
WorkspaceApp (Router)
  └── "Team Chat" View (ChatView.jsx)
        ├── Left: Channels & DMs Sidebar (ChannelSidebar.jsx)
        │     ├── Workspace Channels: #general, #engineering, #releases, #infra-alerts
        │     ├── Direct Messages (DMs): Diana Morales, Ben Kaur, etc. (with online dots)
        │     └── Unread message count badges
        ├── Center / Right: Active Conversation Pane
        │     ├── Chat Header (channel name, topic, member count, search)
        │     ├── Message Stream (MessageList.jsx)
        │     │     ├── Date dividers (e.g. "Today", "Yesterday")
        │     │     ├── Sender avatar, name, role badge, timestamp
        │     │     ├── Message bubbles with multiline and code formatting
        │     │     ├── Hover action menu (Edit, Delete — author-only)
        │     │     └── System event alerts (e.g. user elevated access via JIT)
        │     ├── Live Typing Indicator ("Diana is typing...")
        │     └── Rich Message Input (MessageInput.jsx)
        │           ├── Input textarea with auto-grow
        │           ├── Send on Enter (Shift+Enter for newline)
        │           └── Emoji picker trigger & attachment placeholder
```

---

## 3. Backend Socket.IO Event Contract

Matches `backend/src/modules/chat/chat.handler.js` and `backend/src/realtime/socket.server.js`:

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `team:join` | Client $\rightarrow$ Server | `{ teamId }` | Joins the room `team:${teamId}` |
| `chat:send` | Client $\rightarrow$ Server | `{ teamId, content, messageType: "TEXT" }` | Emits message to the room |
| `chat:message` | Server $\rightarrow$ Client | `{ _id, teamId, sender, content, createdAt }` | Broadcast to all room members |
| `chat:typing` | Bidirectional | `{ teamId, senderId, senderName, isTyping }` | Live typing indicator broadcast |
| `chat:edit` | Client $\rightarrow$ Server | `{ messageId, content }` | Edits message content |
| `chat:message_updated` | Server $\rightarrow$ Client | `{ messageId, content, isEdited: true }` | Broadcasts edited state |
| `chat:delete` | Client $\rightarrow$ Server | `{ messageId }` | Deletes a message |
| `chat:message_deleted` | Server $\rightarrow$ Client | `{ messageId }` | Broadcasts deleted state |
| `chat:history` | Client $\rightarrow$ Server | `{ teamId, limit, before }` | Cursor-based message history |

---

## 4. File Changes & New Components

### A. Socket Service & Offline Mock Provider
- **Path:** `frontend/src/features/workspace-app/services/chatSocket.service.js`
- **Purpose:** Manages WebSocket connection via `socket.io-client`. Includes graceful fallback for local mock mode so developers can test real-time chat with simulated peer replies without requiring a running backend socket server.

### B. Chat Constants & Seed History
- **Path:** `frontend/src/features/workspace-app/constants/chat.constants.js`
- **Channels:**
  - `#general`: Workspace-wide announcements and team chatter
  - `#engineering`: Architecture discussions, PR reviews, bug reports
  - `#releases`: Deployment notifications and release logs
  - `#infra-alerts`: High-priority infrastructure status
- **Initial Data:** Pre-populated message threads showing realistic engineer dialogues, code snippets, and timestamps.

### C. Chat Components
1. **`ChatView.jsx`**: Main split-pane container and state orchestrator (active channel, message feed, online users).
2. **`ChannelSidebar.jsx`**: Channel selector, DM user list with online/offline presence indicators, and unread badges.
3. **`MessageList.jsx` & `MessageItem.jsx`**: Chronological message list, author role chips, edited markers, and hover action popover.
4. **`MessageInput.jsx`**: Input field with typing throttle, keyboard shortcuts, and send button.

### D. Navigation Integration
- **`WorkspaceAppSidebar.jsx`**: Add "Team Chat" navigation item with `forum` material icon and active unread badge.
- **`WorkspaceApp.jsx`**: Route view `chat` $\rightarrow$ `<ChatView />`.

---

## 5. Verification Checklist

1. [ ] Log in as Alice Johnson (`alice.j@example.com`).
2. [ ] Enter the "Acme Engineering" workspace.
3. [ ] Click "Team Chat" in the sidebar.
4. [ ] Verify channel switching (`#general` $\leftrightarrow$ `#engineering`) loads respective threads.
5. [ ] Send a message $\rightarrow$ verify it renders instantly in the thread.
6. [ ] Test typing indicator.
7. [ ] Edit an existing message $\rightarrow$ verify "(edited)" badge appears.
8. [ ] Delete a message $\rightarrow$ verify it is removed from the thread.
9. [ ] Check responsive layout across window resizing.
