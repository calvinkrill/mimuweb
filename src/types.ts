/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SafetyAnalysis {
  isSafe: boolean;
  score: number; // 0 to 100 toxicity score
  categories: string[]; // e.g. ["Harassment", "Hate Speech", "Profanity", "Bullying", "Spam"]
  explanation: string; // Brief non-technical human friendly explanation
}

export interface Profile {
  username: string;
  pin: string; // simple string-pin/password
  customKeywords: string[]; // custom words the user blocks
  aiSafetyShield: boolean; // toggle AI safety moderator
  quarantineAction: 'quarantine' | 'block'; // action when content matches filters
  createdAt: string;
  avatarId?: string;
}

export interface Message {
  id: string;
  receiverUsername: string;
  text: string;
  status: 'approved' | 'quarantined' | 'blocked';
  safetyAnalysis?: SafetyAnalysis;
  createdAt: string;
  replyText?: string;
  repliedAt?: string;
  isPublic?: boolean;
  isPinned?: boolean;
}

export interface WorldChatMessage {
  id: string;
  senderName: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  reason?: string;
}
