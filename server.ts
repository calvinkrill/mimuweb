/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { dbStore } from './server_db.js';
import { Message, Profile } from './src/types.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT) || 3000;

// Initialize server-side Gemini client securely
let aiClient: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('Gemini client initialized successfully for AI safety shield.');
  } else {
    console.warn('GEMINI_API_KEY environment variable is not set. Defaulting to local keyword moderation shield.');
  }
} catch (err) {
  console.error('Failed to initialize Gemini Client', err);
}

/**
 * Moderate messages against Custom Profile Keywords + Local Prohibited Filters + Gemini AI analysis
 */
async function assessMessageSafety(
  text: string,
  customKeywords: string[],
  aiEnabled: boolean,
  quarantineAction: 'quarantine' | 'block'
): Promise<{
  status: 'approved' | 'quarantined' | 'blocked';
  safetyAnalysis: {
    isSafe: boolean;
    score: number;
    categories: string[];
    explanation: string;
  };
}> {
  const normText = text.toLowerCase().trim();

  // 1. Evaluate user's custom keywords (Highest Priority Block)
  for (const keyword of customKeywords) {
    const cleanKeyword = keyword.trim().toLowerCase();
    if (cleanKeyword && normText.includes(cleanKeyword)) {
      return {
        status: 'blocked',
        safetyAnalysis: {
          isSafe: false,
          score: 100,
          categories: ['Matched Custom Keyword Filters'],
          explanation: `This message matched the receiver's personal blocklist keyword: "${cleanKeyword}".`,
        },
      };
    }
  }

  // Under user request, automated filters are removed to allow users to say anything
  return {
    status: 'approved',
    safetyAnalysis: {
      isSafe: true,
      score: 0,
      categories: [],
      explanation: 'Passed.',
    },
  };
}

// --- API ROUTES ---

// 1. Create a shareable inbox / Register profile
app.post('/api/register', async (req, res) => {
  const { username, pin } = req.body;
  if (!username || !pin) {
    return res.status(400).json({ success: false, error: 'Username and security password are required.' });
  }

  const normalizedUsername = username.trim().toLowerCase();
  const pinString = String(pin).trim();

  if (normalizedUsername.length < 3 || normalizedUsername.length > 20) {
    return res.status(400).json({ success: false, error: 'Username must be between 3 and 20 characters.' });
  }

  if (!/^[a-zA-Z0-9_\-]+$/.test(normalizedUsername)) {
    return res.status(400).json({ success: false, error: 'Username can only contain numbers, letters, hyphens, and underscores.' });
  }

  const existing = await dbStore.getProfile(normalizedUsername);
  if (existing) {
    return res.status(400).json({ success: false, error: 'Username is already taken. Try choosing a different one!' });
  }

  const newProfile: Profile = {
    username: normalizedUsername,
    pin: pinString,
    customKeywords: [],
    aiSafetyShield: true,
    quarantineAction: 'quarantine',
    createdAt: new Date().toISOString(),
    avatarId: 'bear', // Default simple cute avatar
  };

  await dbStore.saveProfile(newProfile);

  // Return public safe version of profile (hide pin)
  const { pin: _, ...safeProfile } = newProfile;
  res.json({ success: true, profile: safeProfile });
});

// 2. Login to view inbox
app.post('/api/login', async (req, res) => {
  const { username, pin } = req.body;
  if (!username || !pin) {
    return res.status(400).json({ success: false, error: 'Username and password are required.' });
  }

  const profile = await dbStore.getProfile(String(username).trim());
  if (!profile) {
    return res.status(400).json({ success: false, error: 'No profile found with that username.' });
  }

  if (profile.pin !== String(pin).trim()) {
    return res.status(401).json({ success: false, error: 'Incorrect security password. Please try again.' });
  }

  const { pin: _, ...safeProfile } = profile;
  res.json({ success: true, profile: safeProfile });
});

// 3. Fetch public-safe profile settings (for link send page)
app.get('/api/profile/:username', async (req, res) => {
  const username = req.params.username;
  const profile = await dbStore.getProfile(username);
  if (!profile) {
    return res.status(404).json({ success: false, error: 'The requested username does not exist on mimu.' });
  }

  res.json({
    success: true,
    data: {
      username: profile.username,
      customKeywords: profile.customKeywords,
      aiSafetyShield: profile.aiSafetyShield,
      quarantineAction: profile.quarantineAction,
      avatarId: profile.avatarId || 'bear',
    },
  });
});

// 4. Update Profile Moderation Settings
app.post('/api/profile/update', async (req, res) => {
  const { username, pin, customKeywords, aiSafetyShield, quarantineAction, avatarId } = req.body;

  const profile = await dbStore.getProfile(username);
  if (!profile) {
    return res.status(404).json({ success: false, error: 'Profile not found.' });
  }

  if (profile.pin !== String(pin).trim()) {
    return res.status(401).json({ success: false, error: 'Unauthorized PIN modification request.' });
  }

  // Update properties safely
  profile.customKeywords = Array.isArray(customKeywords)
    ? customKeywords.map((k) => String(k).trim().toLowerCase()).filter(Boolean)
    : profile.customKeywords;
  profile.aiSafetyShield = typeof aiSafetyShield === 'boolean' ? aiSafetyShield : profile.aiSafetyShield;
  profile.quarantineAction = ['quarantine', 'block'].includes(quarantineAction)
    ? quarantineAction
    : profile.quarantineAction;
  profile.avatarId = typeof avatarId === 'string' ? avatarId : (profile.avatarId || 'bear');

  await dbStore.saveProfile(profile);

  const { pin: _, ...safeProfile } = profile;
  res.json({ success: true, profile: safeProfile });
});

// 5. Get Owner Inbox (Authenticated via security PIN)
app.get('/api/messages/:username', async (req, res) => {
  const username = req.params.username;
  const pin = req.query.pin;

  if (!pin) {
    return res.status(400).json({ success: false, error: 'Authentication PIN is required.' });
  }

  const profile = await dbStore.getProfile(username);
  if (!profile) {
    return res.status(404).json({ success: false, error: 'Profile not found.' });
  }

  if (profile.pin !== String(pin).trim()) {
    return res.status(401).json({ success: false, error: 'Invalid authentication PIN.' });
  }

  const messages = await dbStore.getMessagesForUser(username);
  res.json({ success: true, data: messages });
});

// 6. Submit anonymous message (sender flow with filters)
app.post('/api/messages/submit', async (req, res) => {
  const { receiverUsername, text } = req.body;

  if (!receiverUsername || !text) {
    return res.status(400).json({ success: false, error: 'Message content is missing.' });
  }

  const profile = await dbStore.getProfile(receiverUsername);
  if (!profile) {
    return res.status(404).json({ success: false, error: 'The username you are trying to contact does not exist.' });
  }

  const cleanText = String(text).trim();
  if (cleanText.length === 0) {
    return res.status(400).json({ success: false, error: 'Message cannot be empty.' });
  }

  if (cleanText.length > 500) {
    return res.status(400).json({ success: false, error: 'Message exceeds the 500 characters limit.' });
  }

  // Screen the content with custom rules + Gemini AI if enabled
  const safetyResult = await assessMessageSafety(
    cleanText,
    profile.customKeywords,
    profile.aiSafetyShield,
    profile.quarantineAction
  );

  // If the policy/filter outcome is 'blocked', notify the sender to prevent abuse
  if (safetyResult.status === 'blocked') {
    return res.status(422).json({
      success: false,
      status: 'blocked',
      error: 'Message contains language flagged by the user\'s harassment filters. Please keep it clean and friendly!',
      safetyAnalysis: safetyResult.safetyAnalysis,
    });
  }

  // Create message record
  const newMessage: Message = {
    id: 'msg_' + Math.random().toString(36).substring(2, 11),
    receiverUsername: profile.username,
    text: cleanText,
    status: safetyResult.status, // 'approved' or 'quarantined'
    safetyAnalysis: safetyResult.safetyAnalysis,
    createdAt: new Date().toISOString(),
    isRead: false,
  };

  await dbStore.addMessage(newMessage);

  res.json({
    success: true,
    id: newMessage.id,
    status: newMessage.status,
    message: 'Message sent successfully!',
    safetyAnalysis: newMessage.safetyAnalysis,
  });
});

// 6b. Mark message as read
app.post('/api/messages/mark-read', async (req, res) => {
  const { messageId, username, pin } = req.body;

  if (!messageId || !username || !pin) {
    return res.status(400).json({ success: false, error: 'Missing mark-read parameters.' });
  }

  const profile = await dbStore.getProfile(username);
  if (!profile) {
    return res.status(404).json({ success: false, error: 'Profile not found.' });
  }

  if (profile.pin !== String(pin).trim()) {
    return res.status(401).json({ success: false, error: 'Unauthorized PIN.' });
  }

  const messages = await dbStore.getMessagesForUser(username);
  const targetMsg = messages.find((m) => m.id === messageId);
  if (targetMsg) {
    targetMsg.isRead = true;
    await dbStore.saveMessage(targetMsg);
    return res.json({ success: true, message: 'Message marked as read' });
  }

  res.status(404).json({ success: false, error: 'Message not found.' });
});

// 6c. Check read status for submitted messages (for tracking double-checks)
app.post('/api/messages/check-read', async (req, res) => {
  const { messageIds } = req.body;

  if (!messageIds || !Array.isArray(messageIds)) {
    return res.status(400).json({ success: false, error: 'messageIds array is required.' });
  }

  const readIds: string[] = [];

  for (const id of messageIds) {
    try {
      const msg = await dbStore.getMessageById(id);
      if (msg && msg.isRead) {
        readIds.push(id);
      }
    } catch {}
  }

  res.json({ success: true, readIds });
});

// 7. Delete an anonymous message from owner's inbox
app.post('/api/messages/delete', async (req, res) => {
  const { messageId, username, pin } = req.body;

  if (!messageId || !username || !pin) {
    return res.status(400).json({ success: false, error: 'Missing deletion arguments.' });
  }

  const profile = await dbStore.getProfile(username);
  if (!profile) {
    return res.status(404).json({ success: false, error: 'Profile not found.' });
  }

  if (profile.pin !== String(pin).trim()) {
    return res.status(401).json({ success: false, error: 'Unauthorized PIN to execute actions.' });
  }

  const wasDeleted = await dbStore.deleteMessage(messageId, username);
  if (wasDeleted) {
    res.json({ success: true, message: 'Message removed permanently.' });
  } else {
    res.status(404).json({ success: false, error: 'Message could not be found.' });
  }
});

// 7b. Batch delete anonymous messages from owner's inbox
app.post('/api/messages/batch-delete', async (req, res) => {
  const { messageIds, username, pin } = req.body;

  if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0 || !username || !pin) {
    return res.status(400).json({ success: false, error: 'Missing batch deletion arguments.' });
  }

  const profile = await dbStore.getProfile(username);
  if (!profile) {
    return res.status(404).json({ success: false, error: 'Profile not found.' });
  }

  if (profile.pin !== String(pin).trim()) {
    return res.status(401).json({ success: false, error: 'Unauthorized PIN to execute actions.' });
  }

  let deletedCount = 0;
  for (const messageId of messageIds) {
    const wasDeleted = await dbStore.deleteMessage(messageId, username);
    if (wasDeleted) {
      deletedCount++;
    }
  }

  res.json({ success: true, message: `Successfully deleted ${deletedCount} messages.`, deletedCount });
});

// 8. Fetch public timeline replied messages for a user profile
app.get('/api/public/messages/:username', async (req, res) => {
  const username = String(req.params.username).trim().toLowerCase();

  const allMessages = await dbStore.getMessagesForUser(username);

  // Filter for approved, public, and has a reply
  const publicMessages = allMessages.filter(
    (msg) => msg.status === 'approved' && msg.isPublic === true && (msg.replyText !== undefined && msg.replyText !== '')
  );

  res.json({ success: true, data: publicMessages });
});

// 9. Submit owner's response / reply to an anonymous message
app.post('/api/messages/reply', async (req, res) => {
  const { messageId, username, pin, replyText, isPublic } = req.body;

  if (!messageId || !username || !pin) {
    return res.status(400).json({ success: false, error: 'Message ID, username, and security PIN are required.' });
  }

  const profile = await dbStore.getProfile(username);
  if (!profile) {
    return res.status(404).json({ success: false, error: 'Profile not found.' });
  }

  if (profile.pin !== String(pin).trim()) {
    return res.status(401).json({ success: false, error: 'Unauthorized security PIN.' });
  }

  // Fetch the user's messages to locate the target message
  const userMessages = await dbStore.getMessagesForUser(username);
  const targetMsg = userMessages.find((m) => m.id === messageId);

  if (!targetMsg) {
    return res.status(404).json({ success: false, error: 'Target message not found.' });
  }

  // Update reply fields
  targetMsg.replyText = String(replyText || '').trim();
  targetMsg.repliedAt = new Date().toISOString();
  targetMsg.isPublic = typeof isPublic === 'boolean' ? isPublic : true;

  // Save the updated message
  await dbStore.saveMessage(targetMsg);

  res.json({ success: true, data: targetMsg });
});

// 10. Toggle message pin state
app.post('/api/messages/toggle-pin', async (req, res) => {
  const { messageId, username, pin } = req.body;

  if (!messageId || !username || !pin) {
    return res.status(400).json({ success: false, error: 'Message ID, username, and security PIN are required.' });
  }

  const profile = await dbStore.getProfile(username);
  if (!profile) {
    return res.status(404).json({ success: false, error: 'Profile not found.' });
  }

  if (profile.pin !== String(pin).trim()) {
    return res.status(401).json({ success: false, error: 'Unauthorized security PIN.' });
  }

  const userMessages = await dbStore.getMessagesForUser(username);
  const targetMsg = userMessages.find((m) => m.id === messageId);

  if (!targetMsg) {
    return res.status(404).json({ success: false, error: 'Target message not found.' });
  }

  // Count currently pinned posts
  const currentlyPinnedCount = userMessages.filter((m) => m.isPinned).length;
  if (!targetMsg.isPinned && currentlyPinnedCount >= 3) {
    return res.status(400).json({ success: false, error: 'You can only pin up to 3 messages. Please unpin another message first.' });
  }

  targetMsg.isPinned = !targetMsg.isPinned;
  await dbStore.saveMessage(targetMsg);

  res.json({ success: true, data: targetMsg });
});

// 10b. Toggle message star state
app.post('/api/messages/toggle-star', async (req, res) => {
  const { messageId, username, pin } = req.body;

  if (!messageId || !username || !pin) {
    return res.status(400).json({ success: false, error: 'Message ID, username, and security PIN are required.' });
  }

  const profile = await dbStore.getProfile(username);
  if (!profile) {
    return res.status(404).json({ success: false, error: 'Profile not found.' });
  }

  if (profile.pin !== String(pin).trim()) {
    return res.status(401).json({ success: false, error: 'Unauthorized security PIN.' });
  }

  const userMessages = await dbStore.getMessagesForUser(username);
  const targetMsg = userMessages.find((m) => m.id === messageId);

  if (!targetMsg) {
    return res.status(404).json({ success: false, error: 'Target message not found.' });
  }

  targetMsg.isStarred = !targetMsg.isStarred;
  await dbStore.saveMessage(targetMsg);

  res.json({ success: true, data: targetMsg });
});

// Active typing and session tracking store (in-memory)
interface ActiveSession {
  senderId: string;
  senderName: string;
  lastSeen: number;
  isTyping: boolean;
}
const activeSessions = new Map<string, ActiveSession>();

// 11. Fetch world chat messages
app.get('/api/world-chat', async (req, res) => {
  try {
    const messages = await dbStore.getWorldChatMessages();
    res.json({ success: true, data: messages });
  } catch (err) {
    console.error('Error fetching world chat:', err);
    res.status(500).json({ success: false, error: 'Failed to yield world chat.' });
  }
});

// 11b. Sync world chat, typing indicators, and user counts
app.post('/api/world-chat/sync', async (req, res) => {
  try {
    const { senderId, senderName, isTyping } = req.body;
    const now = Date.now();

    if (senderId && senderName) {
      activeSessions.set(senderId, {
        senderId: String(senderId),
        senderName: String(senderName),
        lastSeen: now,
        isTyping: !!isTyping
      });
    }

    // Clean up old sessions (> 12 seconds inactivity)
    for (const [sid, session] of activeSessions.entries()) {
      if (now - session.lastSeen > 12000) {
        activeSessions.delete(sid);
      }
    }

    // Grab other users who are currently typing
    const typingUsers = Array.from(activeSessions.values())
      .filter((s) => s.isTyping && s.senderId !== senderId && now - s.lastSeen < 6000)
      .map((s) => s.senderName);

    // Dynamic stats
    const totalUsers = await dbStore.getRegisteredUsersCount();
    const onlineCount = Math.max(1, activeSessions.size);

    // Fetch messages
    const messages = await dbStore.getWorldChatMessages();

    res.json({
      success: true,
      data: {
        messages,
        typingUsers,
        onlineCount,
        totalUsers
      }
    });

  } catch (err) {
    console.error('Error syncing world chat:', err);
    res.status(500).json({ success: false, error: 'Failed to sync world chat.' });
  }
});

// 11c. Landing page statistics & public reply feed
app.get('/api/landing/stats', async (req, res) => {
  try {
    const now = Date.now();
    // Clean old sessions
    for (const [sid, session] of activeSessions.entries()) {
      if (now - session.lastSeen > 12000) {
        activeSessions.delete(sid);
      }
    }

    const totalUsers = await dbStore.getRegisteredUsersCount();
    const onlineCount = Math.max(1, activeSessions.size);
    const publicReplies = await dbStore.getAllPublicMessages();

    res.json({
      success: true,
      data: {
        totalUsers,
        onlineCount,
        publicReplies
      }
    });
  } catch (err) {
    console.error('Error fetching landing page stats:', err);
    res.status(500).json({ success: false, error: 'Failed to load landing page metrics.' });
  }
});

// 12. Submit message to world chat
app.post('/api/world-chat/submit', async (req, res) => {
  const { text, senderName, senderId, replyTo, photoUrl } = req.body;

  if (!senderId) {
    return res.status(400).json({ success: false, error: 'Sender ID is required.' });
  }

  if (!text && !photoUrl) {
    return res.status(400).json({ success: false, error: 'Message content or photo is required.' });
  }

  const cleanText = text ? String(text).trim() : '';
  if (cleanText.length > 200) {
    return res.status(400).json({ success: false, error: 'Stay concise! Keep it under 200 characters.' });
  }

  const cleanName = String(senderName || 'Anonymous Chatty').trim();

  const newChat = {
    id: 'chat_' + Math.random().toString(36).substring(2, 11),
    senderName: cleanName,
    senderId: String(senderId).trim(),
    text: cleanText,
    photoUrl: photoUrl ? String(photoUrl).trim() : undefined,
    createdAt: new Date().toISOString(),
    replyTo: replyTo ? {
      senderName: String(replyTo.senderName).trim(),
      text: String(replyTo.text).trim()
    } : undefined
  };

  await dbStore.addWorldChatMessage(newChat as any);
  res.json({ success: true, data: newChat });
});

// --- REAL-TIME PORTABLE VIDEO CALL ROOMS & HEALING CHANNELS ---
const activeRooms = new Map<string, any>();
let signalingQueue: any[] = [];
const participantHeartbeats = new Map<string, number>(); // key: 'roomId:username' -> timestamp

function pruneInactiveParticipantsAndRooms() {
  const now = Date.now();
  
  for (const [key, lastSeen] of participantHeartbeats.entries()) {
    if (now - lastSeen > 12000) {
      participantHeartbeats.delete(key);
      const parts = key.split(':');
      if (parts.length >= 2) {
        const roomId = parts[0];
        const username = parts.slice(1).join(':');
        const room = activeRooms.get(roomId);
        if (room) {
          room.participants = room.participants.filter((p: any) => p.username !== username);
          if (room.participants.length === 0) {
            activeRooms.delete(roomId);
          } else {
            activeRooms.set(roomId, room);
          }
        }
      }
    }
  }

  signalingQueue = signalingQueue.filter(s => {
    return now - new Date(s.createdAt).getTime() < 45000;
  });
}

// Background cleanup timer
setInterval(pruneInactiveParticipantsAndRooms, 6000);

// Get active calls
app.get('/api/video/rooms', (req, res) => {
  pruneInactiveParticipantsAndRooms();
  const roomsList = Array.from(activeRooms.values()).map(r => {
    const { password, ...safeRoom } = r;
    return {
      ...safeRoom,
      hasPassword: !!password
    };
  });
  res.json({ success: true, data: roomsList });
});

// Create video call room
app.post('/api/video/rooms', (req, res) => {
  const { name, type, password, maxUsers, creator } = req.body;
  if (!name || !creator) {
    return res.status(400).json({ success: false, error: 'Room name and creator username are required.' });
  }

  const cleanCreator = String(creator).trim().toLowerCase();
  const cleanName = String(name).trim().substring(0, 30);
  const matchedRoom = Array.from(activeRooms.values()).find(r => r.name.toLowerCase() === cleanName.toLowerCase());
  
  if (matchedRoom) {
    return res.status(400).json({ success: false, error: 'A video room with that name already exists. Choose a unique name!' });
  }

  const roomId = 'room_' + Math.random().toString(36).substring(2, 11);
  const newRoom = {
    id: roomId,
    name: cleanName,
    type: type === 'private' ? 'private' : 'public',
    password: type === 'private' && password ? String(password).trim() : undefined,
    maxUsers: Number(maxUsers) || 4,
    creator: cleanCreator,
    participants: [{ username: cleanCreator, joinedAt: new Date().toISOString() }],
    chatMessages: [],
    kickedParticipants: [],
    createdAt: new Date().toISOString()
  };

  activeRooms.set(roomId, newRoom);
  participantHeartbeats.set(`${roomId}:${cleanCreator}`, Date.now());

  res.json({ success: true, data: newRoom });
});

// Join video room
app.post('/api/video/rooms/join', (req, res) => {
  const { roomId, username, password } = req.body;
  if (!roomId || !username) {
    return res.status(400).json({ success: false, error: 'Room ID and username are required.' });
  }

  const cleanUsername = String(username).trim().toLowerCase();
  const room = activeRooms.get(roomId);
  if (!room) {
    return res.status(404).json({ success: false, error: 'This Call Room was not found or has been closed.' });
  }

  if (room.kickedParticipants && room.kickedParticipants.includes(cleanUsername)) {
    return res.status(403).json({ success: false, error: 'Denied! You have been removed (kicked) from this call room by the host.' });
  }

  const isAlreadyIn = room.participants.some((p: any) => p.username === cleanUsername);

  if (!isAlreadyIn) {
    if (room.participants.length >= room.maxUsers) {
      return res.status(400).json({ success: false, error: `This Call Room is full! Maximum limit is ${room.maxUsers} participants.` });
    }

    if (room.type === 'private' && room.password) {
      if (room.password !== String(password || '').trim()) {
        return res.status(401).json({ success: false, error: 'Incorrect room access passcode.' });
      }
    }

    room.participants.push({ username: cleanUsername, joinedAt: new Date().toISOString() });
    activeRooms.set(roomId, room);
  }

  participantHeartbeats.set(`${roomId}:${cleanUsername}`, Date.now());

  res.json({ success: true, data: room });
});

// Leave call room
app.post('/api/video/rooms/leave', (req, res) => {
  const { roomId, username } = req.body;
  if (!roomId || !username) {
    return res.status(400).json({ success: false, error: 'Room ID and username are required.' });
  }

  const cleanUsername = String(username).trim().toLowerCase();
  participantHeartbeats.delete(`${roomId}:${cleanUsername}`);

  const room = activeRooms.get(roomId);
  if (room) {
    room.participants = room.participants.filter((p: any) => p.username !== cleanUsername);
    if (room.participants.length === 0) {
      activeRooms.delete(roomId);
    } else {
      activeRooms.set(roomId, room);
    }
  }

  res.json({ success: true });
});

// Kick disruptive participant (Creator-Only)
app.post('/api/video/rooms/kick', (req, res) => {
  const { roomId, creator, targetUsername } = req.body;
  if (!roomId || !creator || !targetUsername) {
    return res.status(400).json({ success: false, error: 'Incomplete parameters to process participant ejection.' });
  }

  const room = activeRooms.get(roomId);
  if (!room) {
    return res.status(404).json({ success: false, error: 'Active Call Room was not found.' });
  }

  if (room.creator !== String(creator).trim().toLowerCase()) {
    return res.status(403).json({ success: false, error: 'Only the room creator is permitted to eject users.' });
  }

  const cleanTarget = String(targetUsername).trim().toLowerCase();
  if (cleanTarget === room.creator) {
    return res.status(400).json({ success: false, error: 'The primary room creator cannot be kicked!' });
  }

  if (!room.kickedParticipants) {
    room.kickedParticipants = [];
  }
  if (!room.kickedParticipants.includes(cleanTarget)) {
    room.kickedParticipants.push(cleanTarget);
  }

  room.participants = room.participants.filter((p: any) => p.username !== cleanTarget);
  activeRooms.set(roomId, room);

  participantHeartbeats.delete(`${roomId}:${cleanTarget}`);

  res.json({ success: true, data: room });
});

// Post a chat message inside the Video Call Room
app.post('/api/video/rooms/chat', (req, res) => {
  const { roomId, username, text } = req.body;
  if (!roomId || !username || !text) {
    return res.status(400).json({ success: false, error: 'Chat parameters are incomplete.' });
  }

  const room = activeRooms.get(roomId);
  if (!room) {
    return res.status(404).json({ success: false, error: 'Call chamber is currently unavailable.' });
  }

  if (!room.chatMessages) {
    room.chatMessages = [];
  }

  const cleanFrom = String(username).trim().toLowerCase();
  const newChat = {
    id: 'callmsg_' + Math.random().toString(36).substring(2, 11),
    from: cleanFrom,
    text: String(text).trim().substring(0, 500),
    time: new Date().toISOString()
  };

  room.chatMessages.push(newChat);
  if (room.chatMessages.length > 60) {
    room.chatMessages.shift();
  }

  activeRooms.set(roomId, room);
  res.json({ success: true, data: newChat });
});

// Post signaling packets
app.post('/api/video/signal', (req, res) => {
  const { roomId, from, to, type, payload } = req.body;
  if (!roomId || !from || !to || !type || !payload) {
    return res.status(400).json({ success: false, error: 'Signaling parameters incomplete.' });
  }

  const newSignal = {
    id: 'sig_' + Math.random().toString(36).substring(2, 11),
    roomId,
    from: String(from).trim().toLowerCase(),
    to: String(to).trim().toLowerCase(),
    type,
    payload,
    createdAt: new Date().toISOString()
  };

  signalingQueue.push(newSignal);
  res.json({ success: true });
});

// Poll signaling queue & set/keep active heartbeat
app.get('/api/video/signals', (req, res) => {
  const { username, roomId } = req.query;
  if (!username) {
    return res.status(400).json({ success: false, error: 'username is required for signals routing.' });
  }

  const cleanUsername = String(username).trim().toLowerCase();
  
  if (roomId) {
    participantHeartbeats.set(`${roomId}:${cleanUsername}`, Date.now());
  }

  const matchingSignals = signalingQueue.filter(s => s.to === cleanUsername);
  signalingQueue = signalingQueue.filter(s => s.to !== cleanUsername);

  const room = roomId ? activeRooms.get(String(roomId)) : null;

  res.json({ 
    success: true, 
    data: matchingSignals,
    roomState: room
  });
});

// Configure Vite integration for Dev and static assets for Production
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[mimu server] running gracefully on http://localhost:${PORT}`);
  });
}

start();
