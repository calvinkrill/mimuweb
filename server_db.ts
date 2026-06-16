/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc, orderBy, limit } from 'firebase/firestore';
import { Profile, Message, WorldChatMessage } from './src/types.js';

let db: any = null;
let isFirestoreAvailable = false;

try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    isFirestoreAvailable = true;
    console.log('[mimu store] Cloud Firestore initialized successfully.');
  } else {
    console.warn('[mimu store] firebase-applet-config.json not found. Falling back to local storage.');
  }
} catch (err) {
  console.error('[mimu store] Failed to initialize Firestore SDK, falling back to local storage:', err);
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
    if (isFirestoreAvailable && db) {
      try {
        const docRef = doc(db, 'profiles', normalized);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return docSnap.data() as Profile;
        }
        return null;
      } catch (err) {
        console.error(`[firestore] Error fetching profile for ${normalized}:`, err);
      }
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

    if (isFirestoreAvailable && db) {
      try {
        const docRef = doc(db, 'profiles', normalized);
        await setDoc(docRef, cleanProfile);
        return;
      } catch (err) {
        console.error('[firestore] Error saving profile:', err);
      }
    }
    // Fallback
    const local = loadLocalDb();
    local.profiles[normalized] = cleanProfile;
    saveLocalDb(local);
  },

  // Messages
  async getMessagesForUser(username: string): Promise<Message[]> {
    const normalized = username.toLowerCase().trim();
    if (isFirestoreAvailable && db) {
      try {
        const q = query(collection(db, 'messages'), where('receiverUsername', '==', normalized));
        const querySnapshot = await getDocs(q);
        const msgs: Message[] = [];
        querySnapshot.forEach((docSnap) => {
          msgs.push(docSnap.data() as Message);
        });
        return msgs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } catch (err) {
        console.error(`[firestore] Error fetching messages for ${normalized}:`, err);
      }
    }
    // Fallback
    const local = loadLocalDb();
    return local.messages
      .filter((msg) => msg.receiverUsername.toLowerCase().trim() === normalized)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async addMessage(message: Message): Promise<void> {
    await this.saveMessage(message);
  },

  async saveMessage(message: Message): Promise<void> {
    if (isFirestoreAvailable && db) {
      try {
        const docRef = doc(db, 'messages', message.id);
        await setDoc(docRef, message);
        return;
      } catch (err) {
        console.error('[firestore] Error saving message:', err);
      }
    }
    // Fallback
    const local = loadLocalDb();
    const index = local.messages.findIndex((m) => m.id === message.id);
    if (index !== -1) {
      local.messages[index] = message;
    } else {
      local.messages.push(message);
    }
    saveLocalDb(local);
  },

  async deleteMessage(messageId: string, username: string): Promise<boolean> {
    const normalized = username.toLowerCase().trim();
    if (isFirestoreAvailable && db) {
      try {
        const docRef = doc(db, 'messages', messageId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as Message;
          if (data.receiverUsername.toLowerCase().trim() === normalized) {
            await deleteDoc(docRef);
            return true;
          }
        }
        return false;
      } catch (err) {
        console.error('[firestore] Error deleting message:', err);
      }
    }
    // Fallback
    const local = loadLocalDb();
    const initialLen = local.messages.length;
    local.messages = local.messages.filter(
      (msg) => !(msg.id === messageId && msg.receiverUsername.toLowerCase().trim() === normalized)
    );
    saveLocalDb(local);
    return local.messages.length < initialLen;
  },

  async getWorldChatMessages(): Promise<WorldChatMessage[]> {
    if (isFirestoreAvailable && db) {
      try {
        const q = query(collection(db, 'world_chat'), orderBy('createdAt', 'desc'), limit(100));
        const querySnapshot = await getDocs(q);
        const msgs: WorldChatMessage[] = [];
        querySnapshot.forEach((docSnap) => {
          msgs.push(docSnap.data() as WorldChatMessage);
        });
        return msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      } catch (err) {
        console.error('[firestore] Error fetching world chat:', err);
      }
    }
    const local = loadLocalDb();
    if (!local.worldChat) local.worldChat = [];
    return local.worldChat
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(-100);
  },

  async addWorldChatMessage(message: WorldChatMessage): Promise<void> {
    if (isFirestoreAvailable && db) {
      try {
        const docRef = doc(db, 'world_chat', message.id);
        await setDoc(docRef, message);
        return;
      } catch (err) {
        console.error('[firestore] Error saving world chat message:', err);
      }
    }
    const local = loadLocalDb();
    if (!local.worldChat) local.worldChat = [];
    local.worldChat.push(message);
    if (local.worldChat.length > 200) {
      local.worldChat = local.worldChat.slice(-200);
    }
    saveLocalDb(local);
  },
};
