# Teacher App

## Current State
- Full live streaming app with Agora RTC integration
- Teacher/student dashboards, profiles, class management, recordings
- LiveRoomPage has a local-only chat sidebar (messages not shared between users)
- No PWA install capability

## Requested Changes (Diff)

### Add
- Backend: `ChatMessage` type with id, classId, senderId, senderName, text, sentAt
- Backend: `sendChatMessage(classId, text)` -- stores message in class chat
- Backend: `getChatMessages(classId)` -- returns array of ChatMessage
- Frontend: LiveRoomPage polls `getChatMessages` every 2-3 seconds while joined, displays real messages from all participants
- Frontend: PWA manifest.json with app name, icons, theme colors
- Frontend: Service worker registration for offline/install support
- Frontend: Install button in Header (or floating button) that triggers browser PWA install prompt, visible only when `beforeinstallprompt` event fires

### Modify
- LiveRoomPage chat: replace local state messages with backend-synced messages via polling
- index.html: add `<link rel="manifest">` tag

### Remove
- Hardcoded mock chat messages (Emma R., James K.) from LiveRoomPage initial state

## Implementation Plan
1. Generate Motoko backend with chat message support added
2. Update LiveRoomPage to poll getChatMessages and call sendChatMessage on submit
3. Add manifest.json to public/
4. Add service worker (sw.js) to public/
5. Register service worker in main.tsx
6. Add PWA install prompt hook and Install button in Header or App
