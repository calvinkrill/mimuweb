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

  // 2. Local rule-based profanity & harassment regex guards
  const abuseRegex = /\b(fuck|shit|asshole|bitch|bastard|cunt|dick|whore|slut|rape|kill yourself|kys|murder|die|choke|worthless)\b/i;
  if (abuseRegex.test(normText)) {
    return {
      status: 'blocked',
      safetyAnalysis: {
        isSafe: false,
        score: 95,
        categories: ['Severe Profanity / Verbal Abuse'],
        explanation: 'Flagged immediately by local server safety filters protecting against severe profanity or harassment.',
      },
    };
  }

  // 3. AI-powered Moderation Shield
  if (aiEnabled && aiClient) {
    try {
      const promptText = `Evaluate this anonymous message written for a classmate or peer. You must detect abusive behavior, cyberbullying, sexual harassment, explicit slurs, physical threats, severe insults, and hate speech.
Message text: "${text}"`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: promptText,
        config: {
          systemInstruction: `You are the core safety gatekeeper for 'mimu' - an anonymous messaging app designed to share friendly Q&A and support constructive peer-to-peer feedback.
Your goal is to isolate and neutralize cyberbullying, physical harms, harassment, and toxic slurs while allowing lighthearted banter or friendly advice.
You must return a well-formatted JSON response adhering strictly to this schema.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isSafe: {
                type: Type.BOOLEAN,
                description: 'Set to true if text is warm, playful, neutral, or safe. Set to false if it contains targeted insults, verbal abuse, cyberbullying, hate speech, threats, or severe harassment.',
              },
              score: {
                type: Type.INTEGER,
                description: 'Toxicity rating from 0 (completely nice and constructive) to 100 (hostile/threatening/abusive).',
              },
              categories: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Specific concerns detected (e.g., ["Harassment", "Cyberbullying", "Profanity", "Slur", "Threat"]). Leave empty if clean.',
              },
              explanation: {
                type: Type.STRING,
                description: 'A friendly, brief, human-readable summary of the safety check to give the profile owner perspective.',
              },
            },
            required: ['isSafe', 'score', 'categories', 'explanation'],
          },
        },
      });

      const responseText = response.text?.trim() || '';
      if (responseText) {
        const parsed = JSON.parse(responseText);
        let status: 'approved' | 'quarantined' | 'blocked' = 'approved';

        if (!parsed.isSafe) {
          // If the toxic severity score is very high OR profile owner opted to 'block' everything flagged:
          if (parsed.score >= 70 || quarantineAction === 'block') {
            status = 'blocked';
          } else {
            status = 'quarantined';
          }
        }

        return {
          status,
          safetyAnalysis: {
            isSafe: parsed.isSafe,
            score: parsed.score ?? 50,
            categories: parsed.categories ?? [],
            explanation: parsed.explanation ?? 'Screened by AI Safety Shield.',
          },
        };
      }
    } catch (err) {
      console.error('Error during Gemini AI Safety evaluation:', err);
    }
  }

  // Fallback approved if no filters are triggered
  return {
    status: 'approved',
    safetyAnalysis: {
      isSafe: true,
      score: 0,
      categories: [],
      explanation: 'No safety issues detected by server analysis.',
    },
  };
}

// --- API ROUTES ---

// 1. Create a shareable inbox / Register profile
app.post('/api/register', async (req, res) => {
  const { username, pin } = req.body;
  if (!username || !pin) {
    return res.status(400).json({ success: false, error: 'Username and security PIN are required.' });
  }

  const normalizedUsername = username.trim().toLowerCase();
  const pinString = String(pin).trim();

  if (normalizedUsername.length < 3 || normalizedUsername.length > 20) {
    return res.status(400).json({ success: false, error: 'Username must be between 3 and 20 characters.' });
  }

  if (!/^[a-zA-Z0-9_\-]+$/.test(normalizedUsername)) {
    return res.status(400).json({ success: false, error: 'Username can only contain numbers, letters, hyphens, and underscores.' });
  }

  if (pinString.length < 4) {
    return res.status(400).json({ success: false, error: 'PIN must be at least 4 digits.' });
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
    return res.status(400).json({ success: false, error: 'Username and PIN are required.' });
  }

  const profile = await dbStore.getProfile(String(username).trim());
  if (!profile) {
    return res.status(400).json({ success: false, error: 'No profile found with that username.' });
  }

  if (profile.pin !== String(pin).trim()) {
    return res.status(401).json({ success: false, error: 'Incorrect security PIN. Please try again.' });
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
  };

  await dbStore.addMessage(newMessage);

  res.json({
    success: true,
    status: newMessage.status,
    message: 'Message sent successfully!',
    safetyAnalysis: newMessage.safetyAnalysis,
  });
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

// 12. Submit message to world chat
app.post('/api/world-chat/submit', async (req, res) => {
  const { text, senderName, senderId } = req.body;

  if (!text || !senderId) {
    return res.status(400).json({ success: false, error: 'Content and sender ID are required.' });
  }

  const cleanText = String(text).trim();
  if (cleanText.length === 0) {
    return res.status(400).json({ success: false, error: 'Message cannot be empty.' });
  }
  if (cleanText.length > 200) {
    return res.status(400).json({ success: false, error: 'Stay concise! Keep it under 200 characters.' });
  }

  const abuseRegex = /\b(fuck|shit|asshole|bitch|bastard|cunt|dick|whore|slut|rape|kill yourself|kys|murder|die|choke|worthless)\b/i;
  if (abuseRegex.test(cleanText.toLowerCase())) {
    return res.status(422).json({ success: false, error: 'Keep the chat friendly! Message filtered.' });
  }

  const cleanName = String(senderName || 'Anonymous Chatty').trim();

  const newChat = {
    id: 'chat_' + Math.random().toString(36).substring(2, 11),
    senderName: cleanName,
    senderId: String(senderId).trim(),
    text: cleanText,
    createdAt: new Date().toISOString()
  };

  await dbStore.addWorldChatMessage(newChat);
  res.json({ success: true, data: newChat });
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
