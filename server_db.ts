/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Profile, Message, WorldChatMessage } from './src/types.js';

let db: any = null;
let isFirestoreAvailable = false;

try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const apps = getApps();
    const app = apps.length > 0 ? apps[0] : initializeApp({
      projectId: firebaseConfig.projectId,
    });
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    isFirestoreAvailable = true;
    console.log('[mimu store] Cloud Firestore Admin SDK initialized successfully.');
  } else {
    console.warn('[mimu store] firebase-applet-config.json not found. Falling back to local storage.');
  }
} catch (err) {
  console.warn('[mimu store] Failed to initialize Firestore Admin SDK, falling back to local storage:', err);
  isFirestoreAvailable = false;
}

// Fallback JSON File-safe database store
const DB_LOCAL_FILE = path.join(process.cwd(), 'v_data_store.json');

interface Schema {
  profiles: Record<string, Profile>;
  messages: Message[];
  worldChat?: WorldChatMessage[];
}

function loadLocalDb(): Schema {
  try {
    if (fs.existsSync(DB_LOCAL_FILE)) {
      const content = fs.readFileSync(DB_LOCAL_FILE, 'utf-8');
      const parsed = JSON.parse(content) as Schema;
      if (!parsed.worldChat) {
        parsed.worldChat = [];
      }
      if (!parsed.profiles) {
        parsed.profiles = {};
      }
      if (!parsed.messages) {
        parsed.messages = [];
      }
      return parsed;
    }
  } catch (err) {
    console.error('[local db] Error reading fallback store:', err);
  }
  return { profiles: {}, messages: [], worldChat: [] };
}

function saveLocalDb(data: Schema) {
  try {
    fs.writeFileSync(DB_LOCAL_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[local db] Error writing to fallback store:', err);
  }
}

export const dbStore = {
  // Profiles
  async getProfile(username: string): Promise<Profile | null> {
    const normalized = username.toLowerCase().trim();
    let profileFromFirestore: Profile | null = null;

    if (isFirestoreAvailable && db) {
      try {
        const docRef = db.doc(`profiles/${normalized}`);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          profileFromFirestore = docSnap.data() as Profile;
          
          // Keep local fallback in sync!
          try {
            const local = loadLocalDb();
            local.profiles[normalized] = profileFromFirestore;
            saveLocalDb(local);
          } catch (cacheErr) {
            console.warn('[mimu store] Local cache update failed:', cacheErr);
          }
        }
      } catch (err) {
        const errStr = String(err);
        if (errStr.includes('permission') || errStr.includes('Permission') || errStr.includes('unauthenticated') || errStr.includes('credentials') || errStr.includes('CREDENTIALS')) {
          console.info(`[mimu store] Profiles read-permission constrained. Falling back cleanly to local-persisted storage.`);
          isFirestoreAvailable = false;
        } else {
          console.error(`[firestore] Error fetching profile for ${normalized}:`, err);
        }
      }
    }

    if (profileFromFirestore) {
      return profileFromFirestore;
    }

    // Fallback
    const local = loadLocalDb();
    return local.profiles[normalized] || null;
  },

  async saveProfile(profile: Profile): Promise<void> {
    const normalized = profile.username.toLowerCase().trim();
    const cleanProfile = {
      ...profile,
      username: normalized,
    };

    // 1. ALWAYS write to local fallback DB first so it is never lost or reset
    const local = loadLocalDb();
    local.profiles[normalized] = cleanProfile;
    saveLocalDb(local);

    // 2. Also save to cloud Firestore database if available
    if (isFirestoreAvailable && db) {
      try {
        const docRef = db.doc(`profiles/${normalized}`);
        await docRef.set(cleanProfile);
      } catch (err) {
        const errStr = String(err);
        if (errStr.includes('permission') || errStr.includes('Permission') || errStr.includes('unauthenticated') || errStr.includes('credentials') || errStr.includes('CREDENTIALS')) {
          console.info(`[mimu store] Profiles write-permission constrained in Firestore.`);
          isFirestoreAvailable = false;
        } else {
          console.error('[firestore] Error saving profile:', err);
        }
      }
    }
  },

  // Messages
  async getMessagesForUser(username: string): Promise<Message[]> {
    const normalized = username.toLowerCase().trim();
    let firestoreMessages: Message[] | null = null;

    if (isFirestoreAvailable && db) {
      try {
        const querySnapshot = await db.collection('messages')
          .where('receiverUsername', '==', normalized)
          .get();
        const msgs: Message[] = [];
        querySnapshot.forEach((docSnap: any) => {
          msgs.push(docSnap.data() as Message);
        });
        firestoreMessages = msgs;

        // Sync local database copy of these messages
        try {
          const local = loadLocalDb();
          if (!local.messages) local.messages = [];
          
          // Remove outdated/old cached messages for this user and add current ones
          local.messages = local.messages.filter(
            (m) => m.receiverUsername.toLowerCase().trim() !== normalized
          );
          local.messages.push(...msgs);
          saveLocalDb(local);
        } catch (cacheErr) {
          console.warn('[mimu store] Local cache update failed:', cacheErr);
        }

      } catch (err) {
        const errStr = String(err);
        if (errStr.includes('permission') || errStr.includes('Permission') || errStr.includes('unauthenticated') || errStr.includes('credentials') || errStr.includes('CREDENTIALS')) {
          console.info('[mimu store] Messages read-permission constrained. Loading local-persisted user inbox.');
          isFirestoreAvailable = false;
        } else {
          console.error(`[firestore] Error fetching messages for ${normalized}:`, err);
        }
      }
    }

    if (firestoreMessages !== null) {
      return firestoreMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Fallback
    const local = loadLocalDb();
    return (local.messages || [])
      .filter((msg) => msg.receiverUsername.toLowerCase().trim() === normalized)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async addMessage(message: Message): Promise<void> {
    await this.saveMessage(message);
  },

  async saveMessage(message: Message): Promise<void> {
    // 1. ALWAYS write to local fallback first
    const local = loadLocalDb();
    if (!local.messages) local.messages = [];
    const index = local.messages.findIndex((m) => m.id === message.id);
    if (index !== -1) {
      local.messages[index] = message;
    } else {
      local.messages.push(message);
    }
    saveLocalDb(local);

    // 2. Also write to Cloud Firestore if available
    if (isFirestoreAvailable && db) {
      try {
        const docRef = db.doc(`messages/${message.id}`);
        await docRef.set(message);
      } catch (err) {
        const errStr = String(err);
        if (errStr.includes('permission') || errStr.includes('Permission') || errStr.includes('unauthenticated') || errStr.includes('credentials') || errStr.includes('CREDENTIALS')) {
          console.info('[mimu store] Messages write-permission constrained in Cloud Firestore.');
          isFirestoreAvailable = false;
        } else {
          console.error('[firestore] Error saving message:', err);
        }
      }
    }
  },

  async getMessageById(id: string): Promise<Message | null> {
    if (isFirestoreAvailable && db) {
      try {
        const docRef = db.doc(`messages/${id}`);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          return docSnap.data() as Message;
        }
      } catch {}
    }
    const local = loadLocalDb();
    return (local.messages || []).find((m) => m.id === id) || null;
  },

  async deleteMessage(messageId: string, username: string): Promise<boolean> {
    const normalized = username.toLowerCase().trim();
    let firestoreDeleteSuccess = false;

    if (isFirestoreAvailable && db) {
      try {
        const docRef = db.doc(`messages/${messageId}`);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          const data = docSnap.data() as Message;
          if (data.receiverUsername.toLowerCase().trim() === normalized) {
            await docRef.delete();
            firestoreDeleteSuccess = true;
          }
        }
      } catch (err) {
        const errStr = String(err);
        if (errStr.includes('permission') || errStr.includes('Permission') || errStr.includes('unauthenticated') || errStr.includes('credentials') || errStr.includes('CREDENTIALS')) {
          console.info('[mimu store] Messages delete-permission constrained. Deleting from local-persisted inbox.');
          isFirestoreAvailable = false;
        } else {
          console.error('[firestore] Error deleting message:', err);
        }
      }
    }

    // ALWAYS delete from local store too
    const local = loadLocalDb();
    if (!local.messages) local.messages = [];
    const initialLen = local.messages.length;
    local.messages = local.messages.filter(
      (msg) => !(msg.id === messageId && msg.receiverUsername.toLowerCase().trim() === normalized)
    );
    saveLocalDb(local);

    return firestoreDeleteSuccess || local.messages.length < initialLen;
  },

  async getWorldChatMessages(): Promise<WorldChatMessage[]> {
    let cloudMsgs: WorldChatMessage[] | null = null;
    if (isFirestoreAvailable && db) {
      try {
        const querySnapshot = await db.collection('world_chat')
          .orderBy('createdAt', 'desc')
          .limit(100)
          .get();
        const msgs: WorldChatMessage[] = [];
        querySnapshot.forEach((docSnap: any) => {
          msgs.push(docSnap.data() as WorldChatMessage);
        });
        cloudMsgs = msgs;

        // Keep local in sync
        try {
          const local = loadLocalDb();
          local.worldChat = msgs;
          saveLocalDb(local);
        } catch {}

      } catch (err) {
        const errStr = String(err);
        if (errStr.includes('permission') || errStr.includes('Permission') || errStr.includes('unauthenticated') || errStr.includes('credentials') || errStr.includes('CREDENTIALS')) {
          console.info('[mimu store] World chat read-permission constrained. Loading local-persisted world chat history.');
          isFirestoreAvailable = false;
        } else {
          console.error('[firestore] Error fetching world chat:', err);
        }
      }
    }

    if (cloudMsgs !== null) {
      return cloudMsgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    const local = loadLocalDb();
    if (!local.worldChat) local.worldChat = [];
    return local.worldChat
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(-100);
  },

  async addWorldChatMessage(message: WorldChatMessage): Promise<void> {
    // 1. ALWAYS write to local fallback database
    const local = loadLocalDb();
    if (!local.worldChat) local.worldChat = [];
    local.worldChat.push(message);
    if (local.worldChat.length > 200) {
      local.worldChat = local.worldChat.slice(-200);
    }
    saveLocalDb(local);

    // 2. Also save to cloud Firestore if available
    if (isFirestoreAvailable && db) {
      try {
        const docRef = db.doc(`world_chat/${message.id}`);
        await docRef.set(message);
      } catch (err) {
        const errStr = String(err);
        if (errStr.includes('permission') || errStr.includes('Permission') || errStr.includes('unauthenticated') || errStr.includes('credentials') || errStr.includes('CREDENTIALS')) {
          console.info('[mimu store] World chat write-permission constrained in Firestore.');
          isFirestoreAvailable = false;
        } else {
          console.error('[firestore] Error saving world chat message:', err);
        }
      }
    }
  },

  async getAllPublicMessages(): Promise<Message[]> {
    if (isFirestoreAvailable && db) {
      try {
        const querySnapshot = await db.collection('messages')
          .where('isPublic', '==', true)
          .get();
        const msgs: Message[] = [];
        querySnapshot.forEach((docSnap: any) => {
          const m = docSnap.data() as Message;
          if (m.status === 'approved' && m.replyText) {
            msgs.push(m);
          }
        });
        return msgs.sort((a, b) => new Date(b.repliedAt || b.createdAt).getTime() - new Date(a.repliedAt || a.createdAt).getTime());
      } catch (err) {
        const errStr = String(err);
        if (errStr.includes('permission') || errStr.includes('Permission') || errStr.includes('unauthenticated') || errStr.includes('credentials') || errStr.includes('CREDENTIALS')) {
          console.info('[mimu store] Public messages read-permission constrained. Loading local-persisted public replies config.');
          isFirestoreAvailable = false;
        } else {
          console.error('[firestore] Error getting all public messages:', err);
        }
      }
    }
    const local = loadLocalDb();
    return (local.messages || [])
      .filter((m) => m.status === 'approved' && m.isPublic && m.replyText)
      .sort((a, b) => new Date(b.repliedAt || b.createdAt).getTime() - new Date(a.repliedAt || a.createdAt).getTime());
  },

  async getRegisteredUsersCount(): Promise<number> {
    if (isFirestoreAvailable && db) {
      try {
        const querySnapshot = await db.collection('profiles').get();
        return querySnapshot.size;
      } catch (err) {
        const errStr = String(err);
        if (errStr.includes('permission') || errStr.includes('Permission') || errStr.includes('unauthenticated') || errStr.includes('credentials') || errStr.includes('CREDENTIALS')) {
          console.info('[mimu store] User count read-permission constrained. Using local counts fallback.');
          isFirestoreAvailable = false;
        } else {
          console.error('[firestore] Error getting user count:', err);
        }
      }
    }
    const local = loadLocalDb();
    return Object.keys(local.profiles || {}).length;
  },
};
