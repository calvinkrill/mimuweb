/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Dice5,
  Trash2,
  Copy,
  Check,
  CheckCheck,
  Image,
  Lock,
  Eye,
  EyeOff,
  Plus,
  X,
  Send,
  User,
  ArrowLeft,
  Settings,
  ShieldAlert,
  Inbox,
  AlertCircle,
  HelpCircle,
  Smile,
  Cat,
  Dog,
  Rabbit,
  Bird,
  Fish,
  Crown,
  QrCode,
  Download,
  Calendar,
  Search,
  Share2,
  Pin,
  Globe,
  MessageCircle,
  Keyboard,
  Ghost,
  Gamepad2,
  Heart,
  Star,
  Rocket,
  Flame,
  Sun,
  Moon,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Play,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  Users,
  Monitor,
  UserMinus,
} from 'lucide-react';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'motion/react';
import { DICE_PROMPTS } from './components/DicePrompts.js';
import ShareCard from './components/ShareCard.js';
import { Message, Profile, ApiResponse, WorldChatMessage } from './types.js';

const AVATAR_OPTIONS = [
  { id: 'bear', name: 'Bear', icon: Smile, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { id: 'cat', name: 'Cat', icon: Cat, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  { id: 'dog', name: 'Dog', icon: Dog, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  { id: 'rabbit', name: 'Rabbit', icon: Rabbit, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  { id: 'bird', name: 'Bird', icon: Bird, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { id: 'fish', name: 'Fish', icon: Fish, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  { id: 'crown', name: 'Crown', icon: Crown, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  { id: 'star', name: 'Hero', icon: Sparkles, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  { id: 'ghost', name: 'Ghost', icon: Ghost, color: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20' },
  { id: 'gamer', name: 'Gamer', icon: Gamepad2, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  { id: 'heart', name: 'Lovely', icon: Heart, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  { id: 'rocket', name: 'Cosmic', icon: Rocket, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { id: 'fire', name: 'Spicy', icon: Flame, color: 'text-amber-500 bg-amber-600/10 border-amber-600/20' },
  { id: 'sun', name: 'Sunny', icon: Sun, color: 'text-yellow-500 bg-yellow-600/10 border-yellow-600/20' },
  { id: 'moon', name: 'Luna', icon: Moon, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
];

function ProfileAvatar({ id, className = "w-10 h-10" }: { id?: string; className?: string }) {
  const avatar = AVATAR_OPTIONS.find(a => a.id === id) || AVATAR_OPTIONS[0];
  const IconComp = avatar.icon;
  return (
    <div className={`rounded-xl flex items-center justify-center border p-2 ${avatar.color} ${className}`} id={`avatar-${id}`}>
      <IconComp className="w-full h-full" />
    </div>
  );
}

export default function App() {
  // Splash Screen State
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  // Navigation / View state
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'send'>('landing');
  const [targetUsername, setTargetUsername] = useState('');

  // Input states (Landing Page)
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [usernameInput, setUsernameInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Authenticated Profile states
  const [myProfile, setMyProfile] = useState<Omit<Profile, 'pin'> | null>(null);
  const [userPin, setUserPin] = useState(''); // Keep the PIN securely in React state
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'inbox' | 'safety' | 'calls'>('inbox');

  // Premium Realtime WebRTC Video Call states
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<any | null>(null);
  const [videoRoomsList, setVideoRoomsList] = useState<any[]>([]);
  const [videoRoomsLoading, setVideoRoomsLoading] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remotePeerStreams, setRemotePeerStreams] = useState<Record<string, MediaStream>>({});
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  
  // Create room modal states
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState<'public' | 'private'>('public');
  const [newRoomPassword, setNewRoomPassword] = useState('');
  const [newRoomMaxUsers, setNewRoomMaxUsers] = useState<number>(4);
  const [roomError, setRoomError] = useState('');

  // Refs for WebRTC coordination to prevent race conditions & closure variables
  const peerConnections = React.useRef<Record<string, RTCPeerConnection>>({});
  const activeRoomIdRef = React.useRef<string | null>(null);
  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
  }, [activeRoomId]);

  // Core Additional Call Room features (Kick, Text Chat, Screen Share, Filters)
  const [callChatText, setCallChatText] = useState('');
  const [videoFilter, setVideoFilter] = useState<'none' | 'blur' | 'grayscale' | 'sepia' | 'vintage' | 'neon'>('none');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenStreamRef = React.useRef<MediaStream | null>(null);

  // Safety settings dynamic states
  const [newKeyword, setNewKeyword] = useState('');
  const [blocklist, setBlocklist] = useState<string[]>([]);
  const [aiShield, setAiShield] = useState(true);
  const [quarantinePolicy, setQuarantinePolicy] = useState<'quarantine' | 'block'>('quarantine');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Shared Link copy indicators
  const [linkCopied, setLinkCopied] = useState(false);

  // Active Selected Message for details / Share modal
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [revealedMessages, setRevealedMessages] = useState<Record<string, boolean>>({});

  // Local read message IDs tracking
  const [readMessageIds, setReadMessageIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('mimu_read_message_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Theme support & selection
  const [activeTheme, setActiveTheme] = useState<'amber' | 'indigo' | 'pink'>(() => {
    try {
      const saved = localStorage.getItem('mimu_theme') as 'amber' | 'indigo' | 'pink';
      return (saved && ['amber', 'indigo', 'pink'].includes(saved)) ? saved : 'amber';
    } catch {
      return 'amber';
    }
  });

  const selectTheme = (theme: 'amber' | 'indigo' | 'pink') => {
    setActiveTheme(theme);
    try {
      localStorage.setItem('mimu_theme', theme);
    } catch {}
  };

  // --- SOUNDS & NOTIFICATION SYSTEM ---
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('mimu_sound_enabled') !== 'false';
    } catch {
      return true;
    }
  });

  const [soundVolume, setSoundVolume] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('mimu_sound_volume');
      return saved ? parseFloat(saved) : 0.6;
    } catch {
      return 0.6;
    }
  });

  const [soundTheme, setSoundTheme] = useState<'chime' | 'soft-pop' | 'mention' | 'cosmic-ping'>(() => {
    try {
      return (localStorage.getItem('mimu_sound_theme') as any) || 'chime';
    } catch {
      return 'chime';
    }
  });

  const [notifications, setNotifications] = useState<{ id: string; title: string; text: string; time: Date; read: boolean; type: 'new_message' | 'chat_message' | 'mention' | 'system' }[]>(() => {
    try {
      const saved = localStorage.getItem('mimu_notifications');
      if (saved) {
        return JSON.parse(saved).map((n: any) => ({ ...n, time: new Date(n.time) }));
      }
    } catch (e) {}
    return [];
  });

  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('mimu_sound_enabled', String(soundEnabled));
    } catch {}
  }, [soundEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem('mimu_sound_volume', String(soundVolume));
    } catch {}
  }, [soundVolume]);

  useEffect(() => {
    try {
      localStorage.setItem('mimu_sound_theme', soundTheme);
    } catch {}
  }, [soundTheme]);

  useEffect(() => {
    try {
      localStorage.setItem('mimu_notifications', JSON.stringify(notifications));
    } catch (e) {}
  }, [notifications]);

  const playSoundEffect = (type: 'chime' | 'soft-pop' | 'mention' | 'cosmic-ping' = soundTheme) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;
      
      if (type === 'chime') {
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.exponentialRampToValueAtTime(523.25, now + 0.15);
        gain1.gain.setValueAtTime(soundVolume * 0.12, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.start(now);
        osc1.stop(now + 0.45);

        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, now + 0.12); // E5
        gain2.gain.setValueAtTime(0.0, now);
        gain2.gain.setValueAtTime(soundVolume * 0.12, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.6);
      } else if (type === 'soft-pop') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(640, now + 0.08);
        gain.gain.setValueAtTime(soundVolume * 0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'mention') {
        const freqs = [440.00, 554.37, 659.25, 880.00];
        freqs.forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);
          gain.gain.setValueAtTime(0.0, now);
          gain.gain.setValueAtTime(soundVolume * 0.08, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.3);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.35);
        });
      } else if (type === 'cosmic-ping') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880.00, now); // A5
        osc.frequency.exponentialRampToValueAtTime(220.00, now + 0.4);
        gain.gain.setValueAtTime(soundVolume * 0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.55);
      }
    } catch (err) {
      console.warn('Audio Context error playing sound:', err);
    }
  };

  const addNotification = (
    title: string,
    text: string,
    type: 'new_message' | 'chat_message' | 'mention' | 'system',
    playSound = true,
    customSoundOverride?: 'chime' | 'soft-pop' | 'mention' | 'cosmic-ping'
  ) => {
    // Avoid double notifications for same inbox message texts
    if (type === 'new_message' && notifications.some(n => n.type === 'new_message' && n.text === text)) {
      return;
    }
    
    const newNotif = {
      id: Math.random().toString(36).substring(2, 11),
      title,
      text,
      time: new Date(),
      read: false,
      type,
    };
    
    setNotifications((prev) => [newNotif, ...prev].slice(0, 40));
    showToast(`${title}: ${text.substring(0, 32)}${text.length > 32 ? '...' : ''}`);
    
    if (playSound) {
      playSoundEffect(customSoundOverride || (type === 'mention' ? 'mention' : type === 'chat_message' ? 'soft-pop' : soundTheme));
    }
  };
  // -------------------------------------

  const themeStyles = {
    amber: {
      bg: 'bg-stone-950',
      bgGlow: 'from-amber-950/20 via-orange-800/15 to-stone-950/20',
      text: 'text-amber-400',
      textHover: 'hover:text-amber-300',
      border: 'border-amber-500/20',
      borderFocus: 'focus-within:border-amber-500',
      btn: 'bg-gradient-to-r from-amber-500 to-yellow-450 hover:from-amber-400 hover:to-yellow-400 text-stone-950',
      badge: 'bg-amber-500/10 border-amber-500/25 text-amber-450',
      glow: 'shadow-amber-500/10 hover:shadow-amber-500/20',
      primaryBtn: 'glossy-gold-btn',
      selection: 'selection:bg-amber-500 selection:text-neutral-950',
      accentGlowColor: 'bg-amber-500/10',
      spotlight: 'rgba(153,27,27,0.18)',
      worldChatBg: 'bg-gradient-to-br from-[#18120c] via-[#0d0a08] to-[#18120c]',
      worldChatCardBg: 'bg-stone-900/10 border-stone-800/60 shadow-black/40',
      worldChatIndicator: 'bg-amber-400',
      worldChatIndicatorPing: 'bg-amber-400',
      worldBadge: 'bg-amber-950/40 border-amber-500/20 text-amber-300',
      worldHeaderGlow: 'bg-gradient-to-r from-amber-500/10 to-transparent',
      worldChatLauncher: 'from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-550 border-amber-400/20 shadow-amber-500/10 hover:shadow-amber-500/20',
    },
    indigo: {
      bg: 'bg-slate-950',
      bgGlow: 'from-indigo-950/25 via-blue-900/15 to-zinc-950/20',
      text: 'text-indigo-400',
      textHover: 'hover:text-indigo-300',
      border: 'border-indigo-500/20',
      borderFocus: 'focus-within:border-indigo-500',
      btn: 'bg-gradient-to-r from-indigo-500 to-cyan-400 hover:from-indigo-400 hover:to-cyan-400 text-stone-950',
      badge: 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400',
      glow: 'shadow-indigo-500/10 hover:shadow-indigo-500/20',
      primaryBtn: 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-400 text-stone-950 font-black px-5 py-3 rounded-full hover:shadow-indigo-500/20 active:scale-95 transition-all text-xs uppercase tracking-wider',
      selection: 'selection:bg-indigo-500 selection:text-stone-950',
      accentGlowColor: 'bg-indigo-500/10',
      spotlight: 'rgba(79,70,229,0.18)',
      worldChatBg: 'bg-gradient-to-br from-[#0c0f1c] via-[#080910] to-[#0c0f1c]',
      worldChatCardBg: 'bg-slate-900/10 border-slate-800/60 shadow-black/40',
      worldChatIndicator: 'bg-indigo-400',
      worldChatIndicatorPing: 'bg-indigo-400',
      worldBadge: 'bg-indigo-950/40 border-indigo-500/20 text-indigo-300',
      worldHeaderGlow: 'bg-gradient-to-r from-indigo-500/10 to-transparent',
      worldChatLauncher: 'from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 border-indigo-500/25 shadow-indigo-500/10 hover:shadow-indigo-500/20',
    },
    pink: {
      bg: 'bg-stone-950',
      bgGlow: 'from-pink-950/20 via-rose-950/15 to-stone-950/20',
      text: 'text-pink-400',
      textHover: 'hover:text-pink-300',
      border: 'border-pink-500/25',
      borderFocus: 'focus-within:border-pink-500',
      btn: 'bg-gradient-to-r from-pink-500 to-rose-450 hover:from-pink-400 hover:to-rose-400 text-stone-950',
      badge: 'bg-pink-500/10 border-pink-500/25 text-pink-400',
      glow: 'shadow-pink-500/10 hover:shadow-pink-500/20',
      primaryBtn: 'bg-gradient-to-br from-pink-500 via-rose-500 to-pink-400 text-stone-950 font-black px-5 py-3 rounded-full hover:shadow-pink-500/20 active:scale-95 transition-all text-xs uppercase tracking-wider',
      selection: 'selection:bg-pink-500 selection:text-stone-950',
      accentGlowColor: 'bg-pink-500/10',
      spotlight: 'rgba(236,72,153,0.18)',
      worldChatBg: 'bg-gradient-to-br from-[#1c0c16] via-[#10080e] to-[#1c0c16]',
      worldChatCardBg: 'bg-pink-905/10 border-pink-900/40 shadow-black/40',
      worldChatIndicator: 'bg-pink-400',
      worldChatIndicatorPing: 'bg-pink-400',
      worldBadge: 'bg-pink-950/40 border-pink-500/20 text-pink-300',
      worldHeaderGlow: 'bg-gradient-to-r from-pink-500/10 to-transparent',
      worldChatLauncher: 'from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-450 border-pink-400/25 shadow-pink-500/10 hover:shadow-pink-500/20',
    },
  };

  // Sent Messages tracking list (local device only)
  const [sentTracker, setSentTracker] = useState<{ id: string; text: string; receiver: string; createdAt: string; isRead?: boolean }[]>(() => {
    try {
      const saved = localStorage.getItem('mimu_sent_tracker');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('mimu_sent_tracker', JSON.stringify(sentTracker));
    } catch {}
  }, [sentTracker]);

  // World chat photo attachments state
  const [worldAttachedPhoto, setWorldAttachedPhoto] = useState<string | null>(null);

  const handleAttachPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid photo image.');
      return;
    }

    if (file.size > 2.5 * 1024 * 1024) {
      showToast('Please choose a photo size smaller than 2.5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setWorldAttachedPhoto(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    try {
      localStorage.setItem('mimu_read_message_ids', JSON.stringify(readMessageIds));
    } catch (e) {
      console.error('Failed to sync readMessageIds to localStorage:', e);
    }
  }, [readMessageIds]);

  useEffect(() => {
    if (selectedMessage && !readMessageIds.includes(selectedMessage.id)) {
      setReadMessageIds((prev) => [...prev, selectedMessage.id]);

      // Secure backend write for read receipt update
      if (myProfile && userPin && selectedMessage.receiverUsername.toLowerCase().trim() === myProfile.username.toLowerCase().trim()) {
        fetch('/api/messages/mark-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId: selectedMessage.id,
            username: myProfile.username,
            pin: userPin
          })
        })
        .then(r => r.json())
        .then(res => {
          if (res.success) {
            console.log(`Successfully marked message ${selectedMessage.id} as read on server.`);
          }
        })
        .catch(err => {
          console.error('Failed to mark message as read on server:', err);
        });
      }
    }
  }, [selectedMessage, readMessageIds, myProfile, userPin]);

  // Check read status for our sent messages periodically
  useEffect(() => {
    if (currentView !== 'send' || !targetUsername || sentTracker.length === 0) return;

    const unreadFromTracker = sentTracker
      .filter((m) => m.receiver.toLowerCase().trim() === targetUsername.toLowerCase().trim() && !m.isRead)
      .map((m) => m.id);

    if (unreadFromTracker.length === 0) return;

    const queryStatuses = async () => {
      try {
        const res = await fetch('/api/messages/check-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageIds: unreadFromTracker })
        });
        const data = await res.json();
        if (data.success && data.readIds && data.readIds.length > 0) {
          setSentTracker((prev) =>
            prev.map((m) =>
              data.readIds.includes(m.id) ? { ...m, isRead: true } : m
            )
          );
        }
      } catch (err) {
        console.error('Error querying read statuses:', err);
      }
    };

    queryStatuses();
    const timer = setInterval(queryStatuses, 4000);
    return () => clearInterval(timer);
  }, [currentView, targetUsername, sentTracker]);

  // Sender Page State (?u=username)
  const [targetProfileLoading, setTargetProfileLoading] = useState(false);
  const [targetProfileError, setTargetProfileError] = useState('');
  const [senderMessage, setSenderMessage] = useState('');
  const [senderSending, setSenderSending] = useState(false);
  const [senderSuccess, setSenderSuccess] = useState(false);
  const [senderBlockReason, setSenderBlockReason] = useState('');

  // Web Speech API Voice-to-Text Support for Anonymous Input
  const [isListeningSpeech, setIsListeningSpeech] = useState(false);
  const [speechError, setSpeechError] = useState('');

  const startSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast('Speech recognition not supported in this browser. Try Google Chrome or Safari!');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListeningSpeech(true);
        setSpeechError('');
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event);
        setIsListeningSpeech(false);
        setSpeechError(event.error);
        showToast(`Voice-to-text error: ${event.error}`);
      };

      recognition.onend = () => {
        setIsListeningSpeech(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setSenderMessage((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${transcript}` : transcript;
          });
          showToast('Captured voice message!');
        }
      };

      recognition.start();
    } catch (err) {
      console.error('Speech start error', err);
      setIsListeningSpeech(false);
    }
  };

  // Public timeline and owner reply states
  const [visitorTab, setVisitorTab] = useState<'send' | 'timeline'>('send');
  const [publicMessages, setPublicMessages] = useState<Message[]>([]);
  const [replyInput, setReplyInput] = useState('');
  const [replySaving, setReplySaving] = useState(false);

  // Custom predefinable profile mascot avatar states
  const [selectedAvatarId, setSelectedAvatarId] = useState('bear');
  const [targetAvatarId, setTargetAvatarId] = useState('bear');

  // Inbox Search & Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'starred' | 'pinned'>('all');

  // QR Code States
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);

  // Global Notification / Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // World Chat States
  const [isWorldChatOpen, setIsWorldChatOpen] = useState(false);
  const [worldMessages, setWorldMessages] = useState<WorldChatMessage[]>([]);
  const [worldInput, setWorldInput] = useState('');
  const [senderUuid, setSenderUuid] = useState('');
  const [worldSenderNickname, setWorldSenderNickname] = useState('');
  const [isSendingWorldMsg, setIsSendingWorldMsg] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<WorldChatMessage[]>([]);

  // Real-time typing states, quote-replies, notifications and platform metrics
  const [landingTotalUsers, setLandingTotalUsers] = useState<number>(0);
  const [landingOnlineUsers, setLandingOnlineUsers] = useState<number>(0);
  const [globalPublicReplies, setGlobalPublicReplies] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isLocalTyping, setIsLocalTyping] = useState(false);
  const [localTypingTimer, setLocalTypingTimer] = useState<any>(null);
  const [worldReplyTarget, setWorldReplyTarget] = useState<WorldChatMessage | null>(null);
  const [worldChatNotifications, setWorldChatNotifications] = useState<{ id: string; text: string; senderName: string }[]>([]);

  // Merge server messages with pending optimistic messages for immediate instant render
  const combinedWorldMessages = useMemo(() => {
    const filteredPending = pendingMessages.filter((pm) => {
      return !worldMessages.some(
        (sm) =>
          sm.id === pm.id ||
          (sm.text === pm.text &&
            sm.senderId === pm.senderId &&
            Math.abs(new Date(sm.createdAt).getTime() - new Date(pm.createdAt).getTime()) < 15000)
      );
    });
    return [...worldMessages, ...filteredPending];
  }, [worldMessages, pendingMessages]);

  // Keyboard navigation inside Inbox
  const [kbSelectedIndex, setKbSelectedIndex] = useState<number>(-1);
  const [checkedMessageIds, setCheckedMessageIds] = useState<string[]>([]);

  const handleToggleCheckbox = (msgId: string) => {
    setCheckedMessageIds((prev) =>
      prev.includes(msgId) ? prev.filter((id) => id !== msgId) : [...prev, msgId]
    );
  };

  // Auto-scroll refs
  const messagesGridRef = React.useRef<HTMLDivElement>(null);
  const worldChatEndRef = React.useRef<HTMLDivElement>(null);

  // Initialize UUID and Nickname for world chat on mount
  useEffect(() => {
    let uuid = localStorage.getItem('mimu_uuid');
    if (!uuid) {
      uuid = 'u_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('mimu_uuid', uuid);
    }
    setSenderUuid(uuid);

    let nickname = localStorage.getItem('mimu_nickname');
    if (!nickname) {
      const adjectives = ['Happy', 'Cheerful', 'Silent', 'Cool', 'Sparky', 'Sunny', 'Bright', 'Zesty', 'Calm', 'Warm'];
      const nouns = ['Panda', 'Penguin', 'Koala', 'Bunny', 'Fox', 'Cat', 'Dog', 'Bear', 'Tiger', 'Owl'];
      const randomNick = adjectives[Math.floor(Math.random() * adjectives.length)] + ' ' + nouns[Math.floor(Math.random() * nouns.length)];
      nickname = randomNick;
      localStorage.setItem('mimu_nickname', nickname);
    }
    setWorldSenderNickname(nickname);
  }, []);

  const handleUpdateNickname = (newNick: string) => {
    const val = newNick.trim().substring(0, 15);
    if (val) {
      setWorldSenderNickname(val);
      localStorage.setItem('mimu_nickname', val);
    }
  };

  // Fetch landing page statistics & global public replies periodically
  useEffect(() => {
    const fetchLandingStats = async () => {
      try {
        const res = await fetch('/api/landing/stats');
        const json = await res.json();
        if (json.success && json.data) {
          setLandingTotalUsers(json.data.totalUsers || 0);
          setLandingOnlineUsers(json.data.onlineCount || 1);
          setGlobalPublicReplies(json.data.publicReplies || []);
        }
      } catch (err) {
        console.error('Failed to load landing page stats:', err);
      }
    };

    fetchLandingStats();
    const interval = setInterval(fetchLandingStats, 3000);
    return () => clearInterval(interval);
  }, [currentView]);

  // Fetch world chat messages, typing indicators, user counts & check mentions periodically
  const chatMessagesCount = worldMessages.length;
  useEffect(() => {
    if (!isWorldChatOpen && !myProfile) return;

    const syncWorldChat = async () => {
      try {
        const res = await fetch('/api/world-chat/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: senderUuid,
            senderName: myProfile ? `@${myProfile.username}` : (worldSenderNickname || 'Anonymous Chatty'),
            isTyping: isLocalTyping,
          }),
        });
        const json = await res.json();
        if (json.success && json.data) {
          const newMessages = json.data.messages as WorldChatMessage[];

          if (newMessages.length > 0 && worldMessages.length > 0) {
            const existingIds = new Set(worldMessages.map((m) => m.id));
            const trulyNewWorldMessages = newMessages.filter((m) => !existingIds.has(m.id));

            trulyNewWorldMessages.forEach((msg) => {
              if (msg.senderId !== senderUuid) {
                const myMentionLabel = myProfile ? `@${myProfile.username}` : `@${worldSenderNickname}`;
                const textLower = msg.text.toLowerCase();
                const myMentionLower = myMentionLabel.toLowerCase();

                const isMention = textLower.includes(myMentionLower) ||
                  (myProfile && textLower.includes(`@${myProfile.username.toLowerCase()}`)) ||
                  (worldSenderNickname && textLower.includes(`@${worldSenderNickname.toLowerCase()}`));

                if (isMention) {
                  addNotification(
                    `📢 Mentioned by ${msg.senderName}`,
                    msg.text,
                    'mention',
                    true,
                    'mention'
                  );
                } else {
                  // Standard chat message
                  if (!isWorldChatOpen) {
                    addNotification(
                      `💬 World Chat: ${msg.senderName}`,
                      msg.text,
                      'chat_message',
                      true,
                      'soft-pop'
                    );
                  } else {
                    // Chat is open, just play the soft audio tick if sound is enabled
                    playSoundEffect('soft-pop');
                  }
                }
              }
            });
          }

          setWorldMessages(json.data.messages || []);
          setTypingUsers(json.data.typingUsers || []);
          setLandingTotalUsers(json.data.totalUsers || 0);
          setLandingOnlineUsers(json.data.onlineCount || 1);
        }
      } catch (err) {
        console.error('Failed to sync world chat', err);
      }
    };

    syncWorldChat();
    const interval = setInterval(syncWorldChat, 1000);
    return () => clearInterval(interval);
  }, [isWorldChatOpen, senderUuid, worldSenderNickname, myProfile, isLocalTyping, chatMessagesCount, worldMessages]);



  const handleTogglePin = async (msgId: string) => {
    if (!myProfile) return;
    try {
      const res = await fetch('/api/messages/toggle-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: msgId, username: myProfile.username, pin: userPin }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === msgId ? { ...msg, isPinned: !msg.isPinned } : msg))
        );
        if (selectedMessage && selectedMessage.id === msgId) {
          setSelectedMessage((prev) => prev ? { ...prev, isPinned: !prev.isPinned } : null);
        }
        showToast(data.data.isPinned ? 'Pin limit 3: Message Pinned!' : 'Message Unpinned');
      } else {
        showToast(data.error || 'Failed to toggle pin');
      }
    } catch (err) {
      console.error('Error toggling pin:', err);
      showToast('Error connecting to helper.');
    }
  };

  const handleToggleStar = async (msgId: string) => {
    if (!myProfile) return;
    try {
      const res = await fetch('/api/messages/toggle-star', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: msgId, username: myProfile.username, pin: userPin }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === msgId ? { ...msg, isStarred: !msg.isStarred } : msg))
        );
        if (selectedMessage && selectedMessage.id === msgId) {
          setSelectedMessage((prev) => prev ? { ...prev, isStarred: !prev.isStarred } : null);
        }
        showToast(data.data.isStarred ? 'Message Starred / Favorited!' : 'Star Removed');
      } else {
        showToast(data.error || 'Failed to toggle star');
      }
    } catch (err) {
      console.error('Error toggling star:', err);
      showToast('Error connecting to helper.');
    }
  };

  const handleInputChange = (text: string) => {
    setWorldInput(text);

    if (!isLocalTyping) {
      setIsLocalTyping(true);
    }

    if (localTypingTimer) {
      clearTimeout(localTypingTimer);
    }

    const nextTimer = setTimeout(() => {
      setIsLocalTyping(false);
    }, 2000);

    setLocalTypingTimer(nextTimer);
  };

  const handleSendWorldMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = worldInput.trim();
    const cleanPhoto = worldAttachedPhoto;
    if (!cleanText && !cleanPhoto) return;

    // Cache quote-reply target if set and reset state
    const currentReply = worldReplyTarget;
    setWorldReplyTarget(null);

    // 1. Clear input IMMEDIATELY so the user can type and send their next message with zero delay
    setWorldInput('');
    setWorldAttachedPhoto(null);

    // 2. Generate a temporary ID and create an optimistic message state
    const tempId = 'temp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    const senderName = myProfile ? `@${myProfile.username}` : (worldSenderNickname || 'Anonymous Chatty');
    const optimisticMsg: WorldChatMessage = {
      id: tempId,
      senderName,
      senderId: senderUuid,
      text: cleanText,
      photoUrl: cleanPhoto || undefined,
      createdAt: new Date().toISOString(),
      replyTo: currentReply ? {
        senderName: currentReply.senderName,
        text: currentReply.text
      } : undefined
    };

    // 3. Immediately insert it into pendingMessages to render on the screens instantly
    setPendingMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch('/api/world-chat/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          senderName,
          senderId: senderUuid,
          photoUrl: cleanPhoto || undefined,
          replyTo: currentReply ? {
            senderName: currentReply.senderName,
            text: currentReply.text
          } : undefined
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        // Remove from pending
        setPendingMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        // Add actual message returned from the backend if not already polled
        setWorldMessages((prev) => {
          if (prev.some((m) => m.id === data.data.id)) return prev;
          return [...prev, data.data];
        });
      } else {
        // Revert pending on failure
        setPendingMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        showToast(data.error || 'Failed sending message.');
        setWorldInput((prev) => (prev ? prev : cleanText));
        setWorldAttachedPhoto(cleanPhoto);
        if (currentReply) setWorldReplyTarget(currentReply);
      }
    } catch (err) {
      console.error('Error sending world message:', err);
      // Revert pending on network error
      setPendingMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      showToast('Network error while speaking to community.');
      setWorldInput((prev) => (prev ? prev : cleanText));
      setWorldAttachedPhoto(cleanPhoto);
      if (currentReply) setWorldReplyTarget(currentReply);
    }
  };

  // Initialize and check for URL parameters (e.g. mimu.app/?u=calv)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userParam = params.get('u');

    if (userParam) {
      setTargetUsername(userParam.trim().toLowerCase());
      setCurrentView('send');
    } else {
      // Look for saved offline credentials
      const savedUser = localStorage.getItem('mimu_user');
      const savedPin = localStorage.getItem('mimu_pin');
      if (savedUser && savedPin) {
        autoLogin(savedUser, savedPin);
      }
    }
  }, []);

  // Fetch Public Profile metadata and public timeline when viewing the sender submission card
  useEffect(() => {
    if (currentView === 'send' && targetUsername) {
      setTargetProfileLoading(true);
      setTargetProfileError('');
      
      // Fetch public profile
      fetch(`/api/profile/${targetUsername}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error('This master profile does not exist on mimu.');
          }
          return res.json();
        })
        .then((json: ApiResponse<{ username: string; avatarId?: string }>) => {
          if (json.success) {
            setTargetProfileLoading(false);
            setTargetProfileError('');
            if (json.data && json.data.avatarId) {
              setTargetAvatarId(json.data.avatarId);
            } else {
              setTargetAvatarId('bear');
            }
          } else {
            setTargetProfileError(json.error || 'User not found.');
            setTargetProfileLoading(false);
          }
        })
        .catch((err) => {
          setTargetProfileError(err instanceof Error ? err.message : 'User configuration not found.');
          setTargetProfileLoading(false);
        });

      // Fetch public replies
      fetch(`/api/public/messages/${targetUsername}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data)) {
            setPublicMessages(json.data);
          }
        })
        .catch((err) => {
          console.error('Failed to load public Q&As', err);
        });
    }
  }, [currentView, targetUsername]);

  // Synchronize reply text input with selected message
  useEffect(() => {
    if (selectedMessage) {
      setReplyInput(selectedMessage.replyText || '');
    } else {
      setReplyInput('');
    }
  }, [selectedMessage]);

  // Generate QR Code data URL when myProfile is loaded
  useEffect(() => {
    if (myProfile) {
      const shareUrl = `${window.location.origin}/?u=${myProfile.username}`;
      QRCode.toDataURL(shareUrl, {
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then((url) => {
          setQrDataUrl(url);
        })
        .catch((err) => {
          console.error('Failed to generate profile QR code', err);
        });
    }
  }, [myProfile]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const autoLogin = async (usr: string, pinCode: string) => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usr, pin: pinCode }),
      });
      const data = await res.json();
      if (data.success) {
        setMyProfile(data.profile);
        setSelectedAvatarId(data.profile.avatarId || 'bear');
        setUserPin(pinCode);
        setBlocklist(data.profile.customKeywords);
        setAiShield(data.profile.aiSafetyShield);
        setQuarantinePolicy(data.profile.quarantineAction);
        setCurrentView('dashboard');
        fetchInbox(data.profile.username, pinCode);
      }
    } catch {
      localStorage.removeItem('mimu_user');
      localStorage.removeItem('mimu_pin');
    }
  };

  const fetchInbox = async (usr: string, pinCode: string, silent = false) => {
    if (!silent) setMessagesLoading(true);
    try {
      const res = await fetch(`/api/messages/${usr}?pin=${pinCode}`);
      const data = await res.json();
      if (data.success) {
        setMessages((prevMessages) => {
          const freshData = data.data as Message[];
          if (prevMessages.length > 0) {
            const existingIds = new Set(prevMessages.map((m) => m.id));
            const newFetched = freshData.filter((m) => !existingIds.has(m.id));
            
            if (newFetched.length > 0) {
              newFetched.forEach((m) => {
                addNotification(
                  '🤫 New Confession Received',
                  m.text,
                  'new_message',
                  true,
                  'chime'
                );
              });
            }
          }
          return freshData;
        });

        // Synchronize server-synced read statuses to our client's localized viewed list!
        const serverReadIds = (data.data as Message[])
          .filter((m) => m.isRead)
          .map((m) => m.id);
        if (serverReadIds.length > 0) {
          setReadMessageIds((prev) => {
            const uniques = Array.from(new Set([...prev, ...serverReadIds]));
            return uniques;
          });
        }
      }
    } catch (err) {
      if (!silent) showToast('Could not retrieve messages.');
    } finally {
      if (!silent) setMessagesLoading(false);
    }
  };

  // Poll inbox messages periodically in the background for near-instant message receipt
  useEffect(() => {
    if (!myProfile || !userPin) return;

    const interval = setInterval(() => {
      fetchInbox(myProfile.username, userPin, true);
    }, 1000);

    return () => clearInterval(interval);
  }, [myProfile, userPin]);

  // --- REAL-TIME VIDEO ROOM CALL CORE ENGINE (WebRTC mesh) ---
  const fetchVideoRooms = async () => {
    setVideoRoomsLoading(true);
    try {
      const res = await fetch('/api/video/rooms');
      const data = await res.json();
      if (data.success) {
        setVideoRoomsList(data.data);
      }
    } catch (err) {
      console.error('Error listing rooms:', err);
    } finally {
      setVideoRoomsLoading(false);
    }
  };

  // Poll active public rooms while on the calls tab and not in an active session
  useEffect(() => {
    if (!myProfile || activeTab !== 'calls' || activeRoomId) return;

    fetchVideoRooms();
    const timer = setInterval(fetchVideoRooms, 5000);
    return () => clearInterval(timer);
  }, [myProfile, activeTab, activeRoomId]);

  const cleanupPeerConnection = (peerUsername: string) => {
    if (peerConnections.current[peerUsername]) {
      try {
        peerConnections.current[peerUsername].close();
      } catch (err) {}
      delete peerConnections.current[peerUsername];
    }
    setRemotePeerStreams(prev => {
      const copy = { ...prev };
      delete copy[peerUsername];
      return copy;
    });
  };

  const createPeerConnection = (peerUsername: string, mediaStream: MediaStream) => {
    if (peerConnections.current[peerUsername]) {
      try { peerConnections.current[peerUsername].close(); } catch {}
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    });

    mediaStream.getTracks().forEach(track => {
      pc.addTrack(track, mediaStream);
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && activeRoomIdRef.current && myProfile) {
        fetch('/api/video/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: activeRoomIdRef.current,
            from: myProfile.username,
            to: peerUsername,
            type: 'candidate',
            payload: event.candidate
          })
        }).catch(err => console.warn('Candidate transport error:', err));
      }
    };

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        setRemotePeerStreams(prev => ({
          ...prev,
          [peerUsername]: remoteStream
        }));
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        cleanupPeerConnection(peerUsername);
      }
    };

    peerConnections.current[peerUsername] = pc;
    return pc;
  };

  const handleCreateVideoRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoomError('');
    
    if (!newRoomName.trim()) {
      setRoomError('Please specify a call room name.');
      return;
    }

    if (!myProfile) return;

    try {
      const initRes = await fetch('/api/video/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoomName.trim(),
          type: newRoomType,
          password: newRoomType === 'private' ? newRoomPassword : '',
          maxUsers: newRoomMaxUsers,
          creator: myProfile.username
        })
      });

      const initData = await initRes.json();
      if (!initData.success) {
        setRoomError(initData.error || 'Could not instantiate room.');
        return;
      }

      // Turn on media stream
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (mediaErr) {
        showToast('Camera or mic config failed. Initializing audio/tracking mesh.');
        stream = new MediaStream();
      }

      setLocalStream(stream);
      setIsMicMuted(false);
      setIsCamOff(false);

      const createdRoom = initData.data;
      setActiveRoomId(createdRoom.id);
      setRoomData(createdRoom);

      addNotification('🎥 Video Call Room Opened', `Room "${createdRoom.name}" has been configured successfully!`, 'system', true, 'cosmic-ping');
      
      setIsCreateRoomOpen(false);
      setNewRoomName('');
      setNewRoomPassword('');
      setNewRoomMaxUsers(4);
      setNewRoomType('public');
      
    } catch (err: any) {
      setRoomError(err.message || 'Call room generation failed.');
    }
  };

  const handleJoinVideoRoom = async (roomItem: any, typedPass = '') => {
    if (!myProfile) return;

    if (roomItem.hasPassword && !typedPass) {
      const passcode = prompt('Enter the private passcode protecting this room:');
      if (passcode === null) return;
      handleJoinVideoRoom(roomItem, passcode);
      return;
    }

    try {
      const res = await fetch('/api/video/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: roomItem.id,
          username: myProfile.username,
          password: typedPass
        })
      });

      const data = await res.json();
      if (!data.success) {
        showToast(data.error || 'Access to call chamber denied.');
        return;
      }

      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (err) {
        showToast('Camera/mic missing. Joining call with mock data/carrier session.');
        mediaStream = new MediaStream();
      }

      setLocalStream(mediaStream);
      setIsMicMuted(false);
      setIsCamOff(false);

      const enteredRoom = data.data;
      setActiveRoomId(enteredRoom.id);
      setRoomData(enteredRoom);

      showToast(`Joined call room: ${enteredRoom.name}!`);

    } catch (err: any) {
      showToast('Could not link to call. Check your mic/camera permissions.');
    }
  };

  const handleLeaveVideoRoom = async () => {
    if (!activeRoomId || !myProfile) return;

    try {
      await fetch('/api/video/rooms/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: activeRoomId,
          username: myProfile.username
        })
      });
    } catch (err) {}

    if (localStream) {
      localStream.getTracks().forEach(track => {
        try { track.stop(); } catch {}
      });
    }
    setLocalStream(null);

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch {}
      });
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);

    Object.keys(peerConnections.current).forEach(peerName => {
      cleanupPeerConnection(peerName);
    });
    peerConnections.current = {};

    setActiveRoomId(null);
    setRoomData(null);
    setRemotePeerStreams({});
    showToast('Left calling room.');
  };

  // --- SCREEN SHARING CORE ---
  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = screenStream;
      const screenVideoTrack = screenStream.getVideoTracks()[0];

      screenVideoTrack.onended = () => {
        stopScreenShare();
      };

      // Swap out visual track inside WebRTC peer mesh
      Object.keys(peerConnections.current).forEach(peerUser => {
        const pc = peerConnections.current[peerUser];
        const videoSender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(screenVideoTrack);
        }
      });

      // Update local stream state
      setLocalStream(prev => {
        if (!prev) return screenStream;
        const nextStream = new MediaStream();
        prev.getAudioTracks().forEach(t => nextStream.addTrack(t));
        nextStream.addTrack(screenVideoTrack);
        return nextStream;
      });

      setIsScreenSharing(true);
      showToast('Broadcasting screen share live!');
    } catch (err) {
      console.error('Screen sharing initiation error:', err);
      showToast('Screen sharing declined or unsupported.');
    }
  };

  const stopScreenShare = async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch {}
      });
      screenStreamRef.current = null;
    }

    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const camVideoTrack = cameraStream.getVideoTracks()[0];

      Object.keys(peerConnections.current).forEach(peerUser => {
        const pc = peerConnections.current[peerUser];
        const videoSender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(camVideoTrack);
        }
      });

      setLocalStream(prev => {
        if (!prev) return cameraStream;
        const nextStream = new MediaStream();
        prev.getAudioTracks().forEach(t => nextStream.addTrack(t));
        if (camVideoTrack) {
          nextStream.addTrack(camVideoTrack);
        }
        return nextStream;
      });
    } catch (err) {
      console.warn('Could not restore camera:', err);
    }

    setIsScreenSharing(false);
    showToast('Swapped back to camera feed.');
  };

  // --- KICK DISRUPTIVE PARTICIPANT ---
  const kickParticipant = async (targetUsername: string) => {
    if (!activeRoomId || !myProfile) return;
    try {
      const res = await fetch('/api/video/rooms/kick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: activeRoomId,
          creator: myProfile.username,
          targetUsername
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Remotely ejected @${targetUsername} from call room.`);
        setRoomData(data.data);
      } else {
        showToast(data.error || 'eject action failed.');
      }
    } catch (err) {
      console.error('Kicking error:', err);
    }
  };

  // --- SEND CHAT MESSAGE INSIDE CALL ROOM ---
  const sendCallChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!callChatText.trim() || !activeRoomId || !myProfile) return;

    try {
      const textVal = callChatText.trim();
      setCallChatText('');

      const res = await fetch('/api/video/rooms/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: activeRoomId,
          username: myProfile.username,
          text: textVal
        })
      });
      const data = await res.json();
      if (data.success) {
        // Instant append local cache
        setRoomData((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            chatMessages: [...(prev.chatMessages || []), data.data]
          };
        });
      }
    } catch (err) {
      console.error('Error posting in-call chat:', err);
    }
  };

  const toggleVideoMute = () => {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicMuted(!audioTrack.enabled);
    }
  };

  const toggleVideoCamera = () => {
    if (!localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCamOff(!videoTrack.enabled);
    }
  };

  useEffect(() => {
    if (!myProfile || !activeRoomId || !localStream) return;

    const syncCallChan = async () => {
      try {
        const res = await fetch(`/api/video/signals?username=${encodeURIComponent(myProfile.username)}&roomId=${activeRoomId}`);
        const result = await res.json();
        
        if (!result.success) return;

        if (result.roomState) {
          // POLLED ROOM STATE CHECKS: Auto-kick eviction detection
          const stillRegisteredInRoom = result.roomState.participants.some(
            (p: any) => p.username === myProfile.username
          );

          if (!stillRegisteredInRoom) {
            handleLeaveVideoRoom();
            showToast('⚠️ You have been removed (kicked) from this call room by the host.');
            return;
          }

          setRoomData(result.roomState);
          
          const others = result.roomState.participants.filter((p: any) => p.username !== myProfile.username);
          
          for (const other of others) {
            const otherUser = other.username;
            if (!peerConnections.current[otherUser]) {
              const myPart = result.roomState.participants.find((p: any) => p.username === myProfile.username);
              const otherPart = other;
              
              const isNewer = myPart && otherPart && new Date(myPart.joinedAt).getTime() > new Date(otherPart.joinedAt).getTime();
              
              if (isNewer) {
                console.log(`Connecting to peer: ${otherUser}, making offer since we are newer.`);
                const pc = createPeerConnection(otherUser, localStream);
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                await fetch('/api/video/signal', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    roomId: activeRoomId,
                    from: myProfile.username,
                    to: otherUser,
                    type: 'offer',
                    payload: offer
                  })
                });
              }
            }
          }

          const currentRoomUsers = new Set(others.map((o: any) => o.username));
          Object.keys(peerConnections.current).forEach(peer => {
            if (!currentRoomUsers.has(peer)) {
              console.log(`User ${peer} left room. Closing peer connection.`);
              cleanupPeerConnection(peer);
            }
          });
        }

        const signals = result.data || [];
        for (const sig of signals) {
          if (sig.from === myProfile.username) continue;

          if (sig.type === 'offer') {
            console.log(`Received WebRTC offer from: ${sig.from}`);
            const pc = createPeerConnection(sig.from, localStream);
            await pc.setRemoteDescription(new RTCSessionDescription(sig.payload));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await fetch('/api/video/signal', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                roomId: activeRoomId,
                from: myProfile.username,
                to: sig.from,
                type: 'answer',
                payload: answer
              })
            });
          } else if (sig.type === 'answer') {
            console.log(`Received WebRTC answer from: ${sig.from}`);
            const pc = peerConnections.current[sig.from];
            if (pc) {
              await pc.setRemoteDescription(new RTCSessionDescription(sig.payload));
            }
          } else if (sig.type === 'candidate') {
            console.log(`Received WebRTC ICE candidate from: ${sig.from}`);
            const pc = peerConnections.current[sig.from];
            if (pc) {
              await pc.addIceCandidate(new RTCIceCandidate(sig.payload));
            }
          }
        }

      } catch (err) {
        console.warn('Call coordination poll failure:', err);
      }
    };

    const callSyncInterval = setInterval(syncCallChan, 1500);
    return () => clearInterval(callSyncInterval);

  }, [myProfile, activeRoomId, localStream]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!usernameInput || !pinInput) {
      setAuthError('Please fill out both the username and security password.');
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, pin: pinInput }),
      });
      const data = await res.json();

      if (data.success) {
        setAuthSuccess('Successfully created! Logging in to your secure inbox...');
        localStorage.setItem('mimu_user', data.profile.username);
        localStorage.setItem('mimu_pin', pinInput);
        setTimeout(() => {
          setMyProfile(data.profile);
          setSelectedAvatarId(data.profile.avatarId || 'bear');
          setUserPin(pinInput);
          setBlocklist(data.profile.customKeywords);
          setAiShield(data.profile.aiSafetyShield);
          setQuarantinePolicy(data.profile.quarantineAction);
          setCurrentView('dashboard');
          fetchInbox(data.profile.username, pinInput);
          setAuthSuccess('');
          setUsernameInput('');
          setPinInput('');
        }, 1200);
      } else {
        setAuthError(data.error || 'Failed to register your link.');
      }
    } catch {
      setAuthError('Connection error, please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!usernameInput || !pinInput) {
      setAuthError('Please fill out both the username and security password.');
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, pin: pinInput }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('mimu_user', data.profile.username);
        localStorage.setItem('mimu_pin', pinInput);
        setMyProfile(data.profile);
        setSelectedAvatarId(data.profile.avatarId || 'bear');
        setUserPin(pinInput);
        setBlocklist(data.profile.customKeywords);
        setAiShield(data.profile.aiSafetyShield);
        setQuarantinePolicy(data.profile.quarantineAction);
        setCurrentView('dashboard');
        fetchInbox(data.profile.username, pinInput);
        setUsernameInput('');
        setPinInput('');
      } else {
        setAuthError(data.error || 'Invalid credentials.');
      }
    } catch {
      setAuthError('Server connection error.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Submit Message Filter updates to the server
  const handleSaveSettings = async () => {
    if (!myProfile || !userPin) return;

    setSettingsSaving(true);
    setSettingsSuccess(false);

    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: myProfile.username,
          pin: userPin,
          customKeywords: blocklist,
          aiSafetyShield: aiShield,
          quarantineAction: quarantinePolicy,
          avatarId: selectedAvatarId,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setMyProfile(data.profile);
        setSelectedAvatarId(data.profile.avatarId || 'bear');
        setSettingsSuccess(true);
        showToast('Message Filter settings updated!');
        setTimeout(() => setSettingsSuccess(false), 3000);
      } else {
        showToast(data.error || 'Could not save filter settings.');
      }
    } catch {
      showToast('Connection error updating profile settings.');
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!myProfile || !userPin) return;

    if (!confirm('Are you sure you want to remove this anonymous message permanently?')) {
      return;
    }

    try {
      const res = await fetch('/api/messages/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: msgId,
          username: myProfile.username,
          pin: userPin,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setMessages((prev) => prev.filter((m) => m.id !== msgId));
        setSelectedMessage(null);
        showToast('Message removed permanently from server.');
      } else {
        showToast(data.error || 'Error deleting message.');
      }
    } catch {
      showToast('Failed to communicate with server.');
    }
  };

  const handleDeleteBatchMessages = async () => {
    if (!myProfile || !userPin || checkedMessageIds.length === 0) return;

    if (!confirm(`Are you sure you want to remove ${checkedMessageIds.length} selected message(s) permanently?`)) {
      return;
    }

    try {
      const res = await fetch('/api/messages/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageIds: checkedMessageIds,
          username: myProfile.username,
          pin: userPin,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setMessages((prev) => prev.filter((m) => !checkedMessageIds.includes(m.id)));
        setSelectedMessage(null);
        setCheckedMessageIds([]);
        showToast(`Successfully deleted ${data.deletedCount || checkedMessageIds.length} message(s).`);
      } else {
        showToast(data.error || 'Error during batch delete.');
      }
    } catch {
      showToast('Failed to communicate with server.');
    }
  };

  // Sender Submission
  const handleSendAnonymousMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderMessage.trim()) return;

    setSenderSending(true);
    setSenderBlockReason('');

    try {
      const res = await fetch('/api/messages/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverUsername: targetUsername,
          text: senderMessage,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setSenderSuccess(true);
        // Track the message ID and details so the sender can view high-fidelity live checkmark feedback!
        const newTracked = {
          id: data.id || ('msg_temp_' + Date.now()),
          text: senderMessage,
          receiver: targetUsername || '',
          createdAt: new Date().toISOString(),
          isRead: false
        };
        setSentTracker((prev) => [newTracked, ...prev]);
        setSenderMessage('');
      } else {
        // If message is filtered client displays exact helpful reason
        setSenderBlockReason(data.error || 'Message was flagged by harassment filters.');
      }
    } catch {
      setSenderBlockReason('Connection error sending anonymous message.');
    } finally {
      setSenderSending(false);
    }
  };

  // Roll a dice and copy dynamic safe prompt
  const rollDicePrompt = () => {
    const randomIndex = Math.floor(Math.random() * DICE_PROMPTS.length);
    setSenderMessage(DICE_PROMPTS[randomIndex]);
  };

  const copyProfileLink = () => {
    if (!myProfile) return;
    const shareUrl = `${window.location.origin}/?u=${myProfile.username}`;
    navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    showToast('Copied link to clipboard!');
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleSaveReply = async () => {
    if (!selectedMessage || !myProfile || !userPin) return;

    setReplySaving(true);
    try {
      const res = await fetch('/api/messages/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: selectedMessage.id,
          username: myProfile.username,
          pin: userPin,
          replyText: replyInput,
          isPublic: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(selectedMessage.replyText ? 'Public response updated!' : 'Response published to your public timeline!');
        const updatedMsg = data.data;
        // Sync inbox messages state
        setMessages((prev) => prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m)));
        setSelectedMessage(updatedMsg);
      } else {
        showToast(data.error || 'Failed to save reply.');
      }
    } catch {
      showToast('Connection error publishing reply.');
    } finally {
      setReplySaving(false);
    }
  };

  const handleUnpublishReply = async () => {
    if (!selectedMessage || !myProfile || !userPin) return;

    if (!confirm('Are you sure you want to unpublish this response and hide it from your public timeline?')) {
      return;
    }

    setReplySaving(true);
    try {
      const res = await fetch('/api/messages/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: selectedMessage.id,
          username: myProfile.username,
          pin: userPin,
          replyText: '',
          isPublic: false,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Reply unpublished successfully.');
        setReplyInput('');
        const updatedMsg = data.data;
        // Sync inbox messages state
        setMessages((prev) => prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m)));
        setSelectedMessage(updatedMsg);
      } else {
        showToast(data.error || 'Error unpublishing reply.');
      }
    } catch {
      showToast('Connection error unpublishing reply.');
    } finally {
      setReplySaving(false);
    }
  };

  // Logging out resets credentials safely
  const handleLogout = () => {
    localStorage.removeItem('mimu_user');
    localStorage.removeItem('mimu_pin');
    setMyProfile(null);
    setUserPin('');
    setMessages([]);
    setCurrentView('landing');
  };

  // Settings: add custom keyword chips
  const addKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    const kw = newKeyword.trim().toLowerCase();
    if (kw && !blocklist.includes(kw)) {
      setBlocklist((prev) => [...prev, kw]);
      setNewKeyword('');
    }
  };

  const removeKeyword = (kw: string) => {
    setBlocklist((prev) => prev.filter((item) => item !== kw));
  };

  const toggleRevealQuarantine = (msgId: string) => {
    setRevealedMessages((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const countFlagged = () => {
    return messages.filter((m) => m.status === 'quarantined').length;
  };

  // Filter messages using searchTerm and date ranges
  const filteredMessages = messages.filter((msg) => {
    // 1. Text keyword search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const textMatch = msg.text.toLowerCase().includes(term);
      const replyMatch = msg.replyText ? msg.replyText.toLowerCase().includes(term) : false;
      if (!textMatch && !replyMatch) return false;
    }

    // 2. Start date filter
    if (filterStartDate) {
      const startDateTime = new Date(filterStartDate);
      startDateTime.setHours(0, 0, 0, 0);
      const msgTime = new Date(msg.createdAt);
      if (msgTime < startDateTime) return false;
    }

    // 3. End date filter
    if (filterEndDate) {
      const endDateTime = new Date(filterEndDate);
      endDateTime.setHours(23, 59, 59, 999);
      const msgTime = new Date(msg.createdAt);
      if (msgTime > endDateTime) return false;
    }

    // 4. Category filter
    if (filterCategory === 'starred') {
      if (!msg.isStarred) return false;
    } else if (filterCategory === 'pinned') {
      if (!msg.isPinned) return false;
    }

    return true;
  });

  const displayedMessages = [...filteredMessages].sort((a, b) => {
    const aPinned = a.isPinned ? 1 : 0;
    const bPinned = b.isPinned ? 1 : 0;
    if (aPinned !== bPinned) {
      return bPinned - aPinned;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const getSentimentAverage = () => {
    const analyzed = messages.filter((m) => m.safetyAnalysis);
    if (analyzed.length === 0) return 100;
    const total = analyzed.reduce((acc, m) => acc + (100 - (m.safetyAnalysis?.score ?? 0)), 0);
    return Math.round(total / analyzed.length);
  };

  const renderFormattedText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return (
      <>
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={i} className="font-extrabold text-amber-405">
                {part.slice(2, -2)}
              </strong>
            );
          } else if (part.startsWith('*') && part.endsWith('*')) {
            return (
              <em key={i} className="italic text-stone-200">
                {part.slice(1, -1)}
              </em>
            );
          }
          return part;
        })}
      </>
    );
  };

  const insertFormatting = (type: 'bold' | 'italic') => {
    const textarea = document.getElementById('reply-textarea') as HTMLTextAreaElement | null;
    if (!textarea) {
      if (type === 'bold') setReplyInput((prev) => prev + '**bold**');
      else setReplyInput((prev) => prev + '*italic*');
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = replyInput;
    const selectedText = text.substring(start, end);
    const replacement = type === 'bold' ? `**${selectedText || 'bold'}**` : `*${selectedText || 'italic'}*`;
    const newText = text.substring(0, start) + replacement + text.substring(end);
    setReplyInput(newText);
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + (type === 'bold' ? 2 : 1);
      textarea.setSelectionRange(
        newCursorPos,
        newCursorPos + (selectedText ? selectedText.length : (type === 'bold' ? 4 : 6))
      );
    }, 50);
  };

  const getMostActiveDay = () => {
    if (messages.length === 0) return 'None Yet';
    const counts: Record<string, number> = {};
    messages.forEach((m) => {
      try {
        const day = new Date(m.createdAt).toLocaleDateString(undefined, { weekday: 'long' });
        counts[day] = (counts[day] || 0) + 1;
      } catch (e) {}
    });
    let maxDay = 'None Yet';
    let maxCount = 0;
    for (const day in counts) {
      if (counts[day] > maxCount) {
        maxCount = counts[day];
        maxDay = day;
      }
    }
    return maxDay;
  };

  // Keyboard navigation logic in fully declared scope
  useEffect(() => {
    if (currentView !== 'dashboard' || activeTab !== 'inbox' || displayedMessages.length === 0) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      const keyLower = e.key.toLowerCase();
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || keyLower === 'j') {
        e.preventDefault();
        setKbSelectedIndex((prev) => {
          const nextIndex = prev + 1 >= displayedMessages.length ? 0 : prev + 1;
          const targetMsg = displayedMessages[nextIndex];
          if (targetMsg) {
            const el = document.getElementById(`msg-card-${targetMsg.id}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }
          return nextIndex;
        });
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || keyLower === 'k') {
        e.preventDefault();
        setKbSelectedIndex((prev) => {
          const nextIndex = prev - 1 < 0 ? displayedMessages.length - 1 : prev - 1;
          const targetMsg = displayedMessages[nextIndex];
          if (targetMsg) {
            const el = document.getElementById(`msg-card-${targetMsg.id}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }
          return nextIndex;
        });
      } else if (e.key === 'Enter') {
        if (kbSelectedIndex >= 0 && kbSelectedIndex < displayedMessages.length) {
          e.preventDefault();
          setSelectedMessage(displayedMessages[kbSelectedIndex]);
        }
      } else if (e.key === 'Delete' || e.key === 'Del') {
        if (kbSelectedIndex >= 0 && kbSelectedIndex < displayedMessages.length) {
          e.preventDefault();
          const targetMsg = displayedMessages[kbSelectedIndex];
          handleDeleteMessage(targetMsg.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentView, activeTab, displayedMessages, kbSelectedIndex, handleDeleteMessage, setSelectedMessage]);

  useEffect(() => {
    if (kbSelectedIndex >= displayedMessages.length) {
      setKbSelectedIndex(displayedMessages.length > 0 ? 0 : -1);
    }
  }, [displayedMessages, kbSelectedIndex]);

  const renderDetailContent = (msg: Message) => {
    const isQuarantined = msg.status === 'quarantined';
    const isRevealed = !!revealedMessages[msg.id];
    return (
      <div className="relative">
        {/* Decorative sticker background */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-600/10 to-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex justify-between items-center border-b border-stone-800/60 pb-3 mb-4">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-2 font-sans">
            {/* Brand logo favicon: soft-rounded white square */}
            <div className="w-5 h-5 bg-white rounded-lg flex items-center justify-center shadow-md shadow-white/5 select-none shrink-0 border border-white/10" title="mimu logo">
              <span className="text-[11px] font-black text-stone-950 font-sans tracking-tighter leading-none">m</span>
            </div>
            <span>Selected Message</span>
          </span>
          <button
            type="button"
            onClick={() => setSelectedMessage(null)}
            className="text-stone-400 hover:text-white text-xs underline font-semibold cursor-pointer"
          >
            Close Panel
          </button>
        </div>

        {/* Display warning cover if quarantined but still hidden in panel */}
        {isQuarantined && !isRevealed ? (
          <div id="panel-warn-blur" className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-2xl text-center mb-4">
            <ShieldAlert size={36} className="text-amber-500 mx-auto mb-2 animate-bounce" />
            <h4 className="text-sm font-bold text-stone-200">Potentially Hostile Language</h4>
            <p className="text-stone-400 text-xs mt-1 leading-relaxed max-w-xs mx-auto mb-4">
              mimu AI Moderate flagged this message. You can reveal the feedback safely using the escape unblur key.
            </p>
            <button
              type="button"
              onClick={() => toggleRevealQuarantine(msg.id)}
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-xs font-bold py-2 px-5 rounded-xl cursor-pointer"
            >
              Unblur Conversation
            </button>
          </div>
        ) : (
          <div className="bg-neutral-950/80 border border-stone-800 rounded-2xl p-5 mb-5 break-words">
            <p className="text-white text-base font-semibold leading-relaxed">
              {msg.text}
            </p>
          </div>
        )}

        {/* AI Content Analytics details */}
        {msg.safetyAnalysis && (
          <div className="bg-neutral-950 border border-stone-800 rounded-2xl p-4 mb-5">
            <div className="flex items-center justify-between border-b border-stone-800/40 pb-2 mb-2">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1 font-sans">
                <ShieldCheck size={12} />
                AI Moderate Analysis
              </span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full select-none ${
                msg.safetyAnalysis.isSafe 
                  ? 'bg-emerald-500/10 text-emerald-400' 
                  : 'bg-amber-500/10 text-amber-500'
              }`}>
                Score: {msg.safetyAnalysis.score}/100
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {msg.safetyAnalysis.categories.length === 0 ? (
                <span className="text-[10px] bg-stone-900 border border-stone-800 text-stone-400 px-2 py-0.5 rounded-md">
                  Clear / Warm Context
                </span>
              ) : (
                msg.safetyAnalysis.categories.map((cat, i) => (
                  <span key={i} className="text-[9px] bg-red-500/10 border border-red-500/20 text-amber-400 px-2 py-0.5 rounded-md font-bold select-none">
                    {cat}
                  </span>
                ))
              )}
            </div>

            <p className="text-stone-400 text-xs leading-relaxed italic">
              "{msg.safetyAnalysis.explanation}"
            </p>
          </div>
        )}

        {/* Public Reply & Publish Segment */}
        {msg.status === 'approved' && (
          <div id="reply-container" className="bg-neutral-950/70 border border-stone-800 rounded-2xl p-4 mb-5">
            {msg.replyText && (
              <div className={`mb-4 p-3 bg-white/[0.015] border-l-2 rounded-r-xl ${
                activeTheme === 'pink' ? 'border-l-pink-500' : activeTheme === 'indigo' ? 'border-l-indigo-500' : 'border-l-amber-500'
              }`}>
                <div className={`flex items-center gap-1.5 mb-1.5 text-[9px] font-black tracking-widest font-mono uppercase ${
                  activeTheme === 'pink' ? 'text-pink-400' : activeTheme === 'indigo' ? 'text-indigo-400' : 'text-amber-500'
                }`}>
                  <MessageSquare size={10} />
                  <span>Your Published Public Answer</span>
                </div>
                <p className="text-xs text-stone-200 leading-relaxed font-semibold break-words">
                  {renderFormattedText(msg.replyText)}
                </p>
                {msg.repliedAt && (
                  <span className="text-[8px] text-stone-500 font-mono mt-1.5 block text-right">
                    Published {new Date(msg.repliedAt).toLocaleString()}
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] uppercase font-extrabold tracking-widest font-sans ${
                activeTheme === 'pink' ? 'text-pink-400' : activeTheme === 'indigo' ? 'text-indigo-400' : 'text-amber-400'
              }`}>
                {msg.replyText ? 'Edit your public reply' : 'Write your public reply'}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => insertFormatting('bold')}
                  className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white text-[10px] font-black font-sans transition-colors border border-stone-750 cursor-pointer"
                  title="Bold Tag (**text**)"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('italic')}
                  className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white text-[10px] italic font-serif transition-colors border border-stone-750 cursor-pointer"
                  title="Italic Tag (*text*)"
                >
                  I
                </button>
              </div>
            </div>
            <textarea
              id="reply-textarea"
              maxLength={300}
              rows={3}
              placeholder="Type a thoughtful, friendly answer..."
              value={replyInput}
              onChange={(e) => setReplyInput(e.target.value)}
              className={`w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-xs text-white placeholder-stone-500 focus:outline-none resize-none leading-relaxed ${
                activeTheme === 'pink' ? 'focus:border-pink-500' : activeTheme === 'indigo' ? 'focus:border-indigo-500' : 'focus:border-amber-500'
              }`}
            />

            {replyInput.trim() && (
              <div className="mt-2.5 p-2.5 bg-neutral-950/90 border border-stone-850 rounded-xl text-left">
                <span className="text-[8px] uppercase font-extrabold tracking-widest text-stone-500 block mb-1 font-mono">
                  Live Preview
                </span>
                <p className="text-stone-200 text-xs leading-relaxed font-semibold">
                  {renderFormattedText(replyInput)}
                </p>
              </div>
            )}
            <div className="flex items-center justify-between mt-2.5">
              <span className="text-[10px] text-stone-500 font-mono">
                {replyInput.length}/300 chars
              </span>
              <div className="flex gap-2">
                {msg.replyText && (
                  <button
                    type="button"
                    onClick={handleUnpublishReply}
                    className="text-stone-400 hover:text-red-400 text-[10px] font-bold py-1 px-2 rounded-md hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    Unpublish Reply
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveReply}
                  disabled={replySaving || !replyInput.trim()}
                  className="bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-[10px] font-black py-1.5 px-3 rounded-lg cursor-pointer transition-colors disabled:opacity-40"
                >
                  {replySaving ? 'Saving...' : msg.replyText ? 'Update Reply' : 'Publish Reply'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Panel bottom actions */}
        <div className="flex gap-2">
          <button
            id="btn-designer-trigger"
            onClick={() => setIsShareModalOpen(true)}
            className={`flex-1 text-neutral-950 text-xs font-black py-3 px-4 rounded-xl shadow-lg hover:-translate-y-0.5 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer animate-shimmer font-sans ${
              activeTheme === 'pink'
                ? 'bg-gradient-to-r from-pink-500 to-rose-450 hover:from-pink-400 hover:to-rose-400 shadow-pink-500/10'
                : activeTheme === 'indigo'
                ? 'bg-gradient-to-r from-indigo-500 to-cyan-400 hover:from-indigo-400 hover:to-cyan-450 shadow-indigo-500/10'
                : 'glossy-gold-btn shadow-amber-500/10'
            }`}
          >
            <Sparkles size={14} />
            <span>Share Message</span>
          </button>
          <button
            onClick={() => handleDeleteMessage(msg.id)}
            className="bg-neutral-950 hover:bg-red-950/20 border border-stone-800 hover:border-red-500/30 text-stone-400 hover:text-red-400 p-3 rounded-xl transition-colors cursor-pointer"
            title="Delete message"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  };

  // Red & Gold Glossy Splash Screen
  if (showSplash) {
    return (
      <div className="min-h-screen bg-neutral-950 text-stone-100 flex flex-col items-center justify-center font-sans relative overflow-hidden">
        {/* Soft dark red background radial gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(153,27,27,0.22)_0%,rgba(10,10,10,1)_100%)] z-0" />
        
        {/* Large pulsing gold light */}
        <div className="absolute w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none z-0 pulse-gold-glow" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-4 text-center z-10 select-none animate-shimmer"
        >
          {/* Main logo icon wrapper with a glossy gold border and rotating shine shimmer */}
          <div className="w-24 h-24 bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-500 p-0.5 rounded-3xl shadow-2xl shadow-amber-500/10 flex items-center justify-center relative overflow-hidden">
            <div className="w-full h-full bg-red-950/90 rounded-[22px] flex items-center justify-center backdrop-blur-md">
              <MessageSquare size={44} className="text-amber-400 drop-shadow-[0_2px_10px_rgba(245,158,11,0.4)]" />
            </div>
          </div>
          <h1 className="text-6xl md:text-7xl font-black tracking-widest uppercase bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-200 bg-clip-text text-transparent drop-shadow-lg">
            MIMU
          </h1>
          <p className="text-amber-100/60 uppercase tracking-[0.3em] font-extrabold text-[10px]">
            created by kenzu
          </p>
          <div className="w-16 h-1 rounded-full bg-gradient-to-r from-red-600 via-amber-400 to-red-600 mt-2" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeStyles[activeTheme].bg} text-stone-100 flex flex-col font-sans ${themeStyles[activeTheme].selection} relative overflow-hidden transition-colors duration-500`}>
      {/* Ambient Spotlight Overlay keyed to theme color */}
      <div 
        className="absolute inset-x-0 top-0 h-[600px] pointer-events-none z-0 transition-all duration-700" 
        style={{
          background: `radial-gradient(circle at top, ${themeStyles[activeTheme].spotlight} 0%, rgba(10,10,10,0) 70%)`
        }}
      />

      {/* Floating Theme Preset Selector (Sunset Amber, Cosmic Midnight, Emerald Forest) */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-2 bg-stone-900/80 backdrop-blur-md border border-stone-800/80 p-2 rounded-2xl shadow-2xl">
        <span className="text-[10px] uppercase font-black tracking-wider text-stone-400 pl-1.5 select-none hidden sm:inline">
          Mood Vibe:
        </span>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => selectTheme('amber')}
            className={`w-5 h-5 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-300 border transition-all cursor-pointer ${
              activeTheme === 'amber' ? 'ring-2 ring-amber-400 border-white scale-110 shadow-lg shadow-amber-500/30' : 'border-stone-850 opacity-55 hover:opacity-100 hover:scale-[1.08]'
            }`}
            title="Sunset Amber (Gold)"
          />
          <button
            type="button"
            onClick={() => selectTheme('indigo')}
            className={`w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-400 to-cyan-455 border transition-all cursor-pointer ${
              activeTheme === 'indigo' ? 'ring-2 ring-indigo-400 border-white scale-110 shadow-lg shadow-indigo-500/30' : 'border-stone-850 opacity-55 hover:opacity-100 hover:scale-[1.08]'
            }`}
            title="Cosmic Midnight (Indigo/Teal)"
          />
          <button
            type="button"
            onClick={() => selectTheme('pink')}
            className={`w-5 h-5 rounded-full bg-gradient-to-tr from-pink-600 via-pink-400 to-rose-300 border transition-all cursor-pointer ${
              activeTheme === 'pink' ? 'ring-2 ring-pink-400 border-white scale-110 shadow-lg shadow-pink-500/30' : 'border-stone-850 opacity-55 hover:opacity-100 hover:scale-[1.08]'
            }`}
            title="Sleek Blossom (Pink / Black Gradient)"
          />
        </div>
      </div>

      {/* Toast Alert bar */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 inset-x-4 max-w-sm mx-auto z-50 bg-stone-900 border border-amber-500/30 hover:border-amber-400 text-stone-200 text-sm font-semibold px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between"
          >
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- 1. LANDING VIEW --- */}
      {currentView === 'landing' && (
        <div id="landing-screen" className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-linear-to-b from-transparent via-neutral-950 to-neutral-950 relative overflow-hidden">
          {/* Neon backlighting */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-red-800/15 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 left-1/4 w-[250px] h-[250px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Heading Logo & Mascot */}
          <div className="flex flex-col items-center gap-1.5 mb-8 text-center relative z-10 select-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="w-16 h-16 bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 mb-3 hover:rotate-6 transition-transform duration-300"
            >
              <MessageSquare size={32} className="text-stone-950" />
            </motion.div>
            <h1 className="text-6xl md:text-7xl font-black tracking-widest uppercase bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-100 bg-clip-text text-transparent flex items-center gap-2 drop-shadow-lg">
              MIMU
            </h1>
            <p className="text-amber-100/60 text-sm max-w-xs leading-relaxed mt-2 font-medium">
              Anonymous message sticker links for your peer group with custom safety logic.
            </p>

            {/* Live System stats */}
            <div className="flex items-center gap-3.5 mt-4 bg-stone-900/50 border border-stone-800/80 px-4 py-1.5 rounded-full text-[11px] font-mono shadow-inner">
              <div className="flex items-center gap-1.5 text-stone-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>{landingOnlineUsers} online now</span>
              </div>
              <div className="w-1 h-1 bg-stone-700 rounded-full" />
              <div className="text-stone-400">
                <span>{landingTotalUsers} registered creators</span>
              </div>
            </div>
          </div>

          {/* Authentication Panel Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full max-w-sm glossy-card p-6 md:p-8 rounded-3xl backdrop-blur-xl relative z-10 shadow-2xl"
          >
            {/* Nav tabs for login vs signup */}
            <div className="flex bg-neutral-950/80 border border-amber-500/10 p-1 rounded-xl mb-6">
              <button
                id="btn-tab-register"
                onClick={() => { setAuthMode('register'); setAuthError(''); }}
                className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                  authMode === 'register' 
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 shadow-md font-black shadow-amber-400/20' 
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Create Account
              </button>
              <button
                id="btn-tab-login"
                onClick={() => { setAuthMode('login'); setAuthError(''); }}
                className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                  authMode === 'login' 
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 shadow-md font-black shadow-amber-400/20' 
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Login In
              </button>
            </div>

            {authError && (
              <div id="auth-error-hint" className="p-3 mb-4 bg-red-950/40 border border-red-500/20 text-red-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div id="auth-success-hint" className="p-3 mb-4 bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                <Check size={14} className="flex-shrink-0" />
                <span>{authSuccess}</span>
              </div>
            )}

            <form onSubmit={authMode === 'register' ? handleRegister : handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold uppercase text-amber-100/60 tracking-wider block mb-1">
                  Choose Username
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-500/70 text-sm font-semibold">@</span>
                  <input
                    id="input-username"
                    type="text"
                    placeholder="yourname"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    disabled={authLoading}
                    className="w-full pl-8 pr-4 py-3 bg-neutral-950 border border-stone-800 rounded-xl text-sm focus:border-amber-500 focus:outline-none transition-colors text-stone-100"
                  />
                </div>
                {authMode === 'register' && (
                  <span className="text-[10px] text-stone-500 block mt-1">
                    Your share link: mimu.app/?u=yourname (Local credentials saved to browser)
                  </span>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-stone-400 tracking-wider block mb-1">
                  Security Password
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
                  <input
                    id="input-pin"
                    type="password"
                    maxLength={100}
                    placeholder="Enter security password"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    disabled={authLoading}
                    className="w-full pl-9 pr-4 py-3 bg-neutral-950 border border-stone-800 rounded-xl text-sm focus:border-amber-500 focus:outline-none transition-colors text-stone-100"
                  />
                </div>
                <span className="text-[10px] text-stone-500 block mt-1">
                  Required to view your local inbox messages securely. Keep it safe.
                </span>
              </div>

              <button
                id="btn-auth-submit"
                type="submit"
                disabled={authLoading}
                className="w-full mt-2 glossy-gold-btn animate-shimmer text-black font-extrabold py-3.5 px-4 rounded-xl cursor-pointer hover:shadow-lg transition-all duration-200 shadow-amber-500/10 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {authLoading ? (
                  <div className="w-5 h-5 border-2 border-stone-950/30 border-t-stone-950 rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>{authMode === 'register' ? ' Create Account' : ' Sign in'}</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Global public replies feed */}
          {globalPublicReplies.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full max-w-sm mt-8 relative z-10"
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-xs font-black uppercase text-amber-500/80 tracking-wider font-sans flex items-center gap-1.5">
                  <span>📢 Public QA Feed</span>
                  <span className="text-[10px] bg-stone-800 text-stone-300 font-mono font-normal px-1.5 py-0.5 rounded-full">
                    {globalPublicReplies.length}
                  </span>
                </h3>
                <span className="text-[10px] text-stone-500 font-mono">Recent Q&A</span>
              </div>
              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                {globalPublicReplies.slice(0, 10).map((msg) => (
                  <div key={msg.id} className="p-4 bg-stone-900/30 border border-stone-850 rounded-2xl flex flex-col gap-2 shadow-sm hover:border-stone-800 transition-colors">
                    <div className="flex justify-between items-center text-[10px] font-mono text-stone-500">
                      <span>To: @{msg.receiverUsername}</span>
                      <span>{new Date(msg.repliedAt || msg.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-stone-300 italic">
                      "{msg.text}"
                    </p>
                    <div className="p-2.5 bg-amber-500/5 border-l-2 border-amber-500/30 rounded-r-lg mt-1">
                      <p className="text-[10px] font-bold text-amber-400 font-mono uppercase mb-0.5">Reply:</p>
                      <p className="text-xs text-stone-200 leading-relaxed font-semibold">
                        {renderFormattedText(msg.replyText || '')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </div>
      )}

      {/* --- 2. SENDER SUBMISSION VIEW --- */}
      {currentView === 'send' && (
        <div id="sender-screen" className="flex-1 flex flex-col items-center justify-center p-4 bg-neutral-950 relative overflow-hidden">
          {/* Subtle lighting matching theme */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-gradient-to-tr from-red-800/15 to-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Navigation back and brand logo */}
          <div className="absolute top-6 left-6 z-10">
            <button
              id="btn-sender-home"
              onClick={() => {
                window.history.pushState({}, '', window.location.origin);
                setCurrentView('landing');
              }}
              className="flex items-center gap-2 text-xs font-bold text-stone-300 hover:text-amber-300 bg-stone-900/60 hover:bg-stone-900 border border-stone-800 px-4 py-2.5 rounded-full transition-all duration-200"
            >
              <ArrowLeft size={14} />
              <span>Make my own mimu</span>
            </button>
          </div>

          {targetProfileLoading ? (
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 border-4 border-stone-800 border-t-amber-500 rounded-full animate-spin" />
              <p className="text-stone-400 text-xs">Locating mimu sticker details...</p>
            </div>
          ) : targetProfileError ? (
            <div id="sender-error-state" className="max-w-sm text-center glossy-card p-8 rounded-3xl flex flex-col items-center">
              <ShieldAlert size={48} className="text-red-500 mb-4" />
              <h2 className="text-xl font-bold mb-2">User Not Found</h2>
              <p className="text-stone-400 text-xs mb-6 leading-relaxed">
                {targetProfileError} Check your URL formatting or create your own anonymous mailbox below!
              </p>
              <button
                id="btn-err-back"
                onClick={() => {
                  window.history.pushState({}, '', window.location.origin);
                  setCurrentView('landing');
                }}
                className="glossy-gold-btn text-xs font-bold py-3 px-6 rounded-xl cursor-pointer"
              >
                Create Mine Now
              </button>
            </div>
          ) : (
            <div className="w-full max-w-sm">
              {/* Tab Switcher for Visitor Page */}
              <div id="visitor-tabs" className="flex bg-neutral-900 border border-amber-500/10 p-1.5 rounded-2xl mb-5">
                <button
                  type="button"
                  onClick={() => setVisitorTab('send')}
                  className={`flex-1 py-1.5 text-xs font-black uppercase rounded-xl transition-all cursor-pointer text-center ${
                    visitorTab === 'send' 
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 shadow-md font-black shadow-amber-400/20' 
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Ask Anonymously
                </button>
                <button
                  type="button"
                  onClick={() => setVisitorTab('timeline')}
                  className={`flex-1 py-1.5 text-xs font-black uppercase rounded-xl transition-all cursor-pointer text-center ${
                    visitorTab === 'timeline' 
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 shadow-md font-black shadow-amber-400/20' 
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Public Q&A ({publicMessages.length})
                </button>
              </div>

              <AnimatePresence mode="wait">
                {visitorTab === 'send' ? (
                  <motion.div
                    key="send-form-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {!senderSuccess ? (
                      <div className="glossy-card rounded-3xl p-6 relative shadow-2xl overflow-hidden">
                        {/* Visual Stamp Card accent */}
                        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-red-800 via-amber-500 to-red-800" />

                        <div className="flex flex-col items-center text-center mt-3 mb-6">
                           <ProfileAvatar id={targetAvatarId} className="w-14 h-14 mb-3" />
                          <span className="text-xs uppercase tracking-widest font-bold text-amber-400 mb-1">
                            Anonymous message for
                          </span>
                          <h2 className="text-xl font-black text-white">@{targetUsername}</h2>
                          <p className="text-stone-400 text-[11px] max-w-[250px] leading-relaxed mt-1">
                            Type questions or suggestions anonymously. Rest assured, your identity is 100% trace-free.
                          </p>
                        </div>

                        {senderBlockReason && (
                          <div id="sender-policy-blocked" className="p-3 mb-4 bg-red-950/40 border border-red-500/20 text-red-300 text-xs rounded-xl flex items-start gap-2 leading-relaxed">
                            <ShieldAlert size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold">Content Filter Flagged</p>
                              <p className="text-[10px] mt-0.5 opacity-90">{senderBlockReason}</p>
                            </div>
                          </div>
                        )}

                        <form onSubmit={handleSendAnonymousMessage} className="flex flex-col">
                          <div className="relative bg-neutral-950 border border-stone-800 rounded-2xl p-3 focus-within:border-amber-500 transition-colors">
                            <textarea
                              id="sender-input-textarea"
                              maxLength={500}
                              rows={4}
                              placeholder="send me anonymous messages..."
                              value={senderMessage}
                              onChange={(e) => {
                                  setSenderMessage(e.target.value);
                                  if (senderBlockReason) setSenderBlockReason('');
                              }}
                              disabled={senderSending}
                              className="w-full bg-transparent border-0 outline-none text-stone-100 text-sm resize-none pr-12 focus:ring-0 leading-relaxed"
                            />
                            
                            {/* Creative Assist Toolbar */}
                            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                              {/* Voice-to-text helper button */}
                              <button
                                id="btn-sender-mic"
                                type="button"
                                onClick={startSpeechRecognition}
                                title={isListeningSpeech ? "Listening..." : "Dictate message (Voice-to-Text)"}
                                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                                  isListeningSpeech
                                    ? "bg-red-500/20 text-red-500 border-red-500 animate-pulse scale-105"
                                    : "bg-stone-900 border-stone-800 text-stone-400 hover:text-amber-400 hover:border-amber-500"
                                }`}
                              >
                                {isListeningSpeech ? <Mic size={18} className="animate-bounce" /> : <Mic size={18} />}
                              </button>

                              {/* Roll dynamic Dice Helper */}
                              <button
                                id="btn-sender-dice"
                                type="button"
                                onClick={rollDicePrompt}
                                title="Generate fun prompt idea"
                                className="bg-stone-900 border border-stone-800 hover:border-amber-500 p-2.5 rounded-xl text-amber-400 hover:text-amber-300 transition-colors cursor-pointer flex items-center justify-center"
                              >
                                <Dice5 size={18} className="animate-wiggle" />
                              </button>
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-stone-400 mt-2 px-1">
                            <span>🛡️ Screened by custom harassment blocklists</span>
                            <span>{senderMessage.length}/500</span>
                          </div>

                          <button
                            id="btn-sender-send"
                            type="submit"
                            disabled={senderSending || !senderMessage.trim()}
                            className="w-full mt-5 glossy-gold-btn animate-shimmer text-black font-extrabold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-amber-500/5 hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2 "
                          >
                            {senderSending ? (
                              <div className="w-5 h-5 border-2 border-stone-950/30 border-t-stone-950 rounded-full animate-spin" />
                            ) : (
                              <>
                                <Send size={15} />
                                <span>Send Anonymously</span>
                              </>
                            )}
                          </button>
                        </form>
                      </div>
                    ) : (
                      <div className="glossy-card rounded-3xl p-8 text-center relative shadow-2xl flex flex-col items-center">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 mb-4 text-emerald-400">
                          <Check size={32} />
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 mb-1">
                          Success
                        </span>
                        <h2 className="text-xl font-bold text-white mb-2">Message Sent Anonymously!</h2>
                        <p className="text-stone-400 text-xs mb-8 max-w-xs leading-relaxed">
                          Your message was vetted against safe content standards and delivered to @{targetUsername}'s secure inbox. Senders always remain trace-free.
                        </p>

                        <div className="flex flex-col gap-2 w-full">
                          <button
                            id="btn-sender-restart"
                            onClick={() => {
                              setSenderSuccess(false);
                              setSenderMessage('');
                              setSenderBlockReason('');
                            }}
                            className="w-full bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800 font-semibold py-3 px-4 rounded-xl text-xs transition-colors cursor-pointer"
                          >
                            Send Another Message
                          </button>
                          <button
                            id="btn-sender-signup"
                            onClick={() => {
                              window.history.pushState({}, '', window.location.origin);
                              setCurrentView('landing');
                            }}
                            className="w-full glossy-gold-btn text-black font-extrabold py-3 px-4 rounded-xl text-xs cursor-pointer shadow-amber-500/10"
                          >
                            Get My Own mimu Link
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Tracked Sent Messages to current target user */}
                    {(() => {
                      const mySent = sentTracker.filter((m) => m.receiver.toLowerCase().trim() === (targetUsername || '').toLowerCase().trim());
                      if (mySent.length === 0) return null;
                      return (
                        <div id="sent-messages-tracker" className="glossy-card rounded-3xl p-5 mt-5 border border-stone-850/80 text-left relative overflow-hidden backdrop-blur-md">
                          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                          <div className="flex items-center justify-between border-b border-stone-850/80 pb-2 mb-3">
                            <span className="text-[10px] uppercase font-extrabold tracking-widest text-amber-400 flex items-center gap-1.5 font-sans">
                              📬 Sent Message Status
                            </span>
                            <span className="text-[9px] text-stone-500 font-mono">
                              Device Local Track
                            </span>
                          </div>
                          
                          <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                            {mySent.map((m) => {
                              return (
                                <div key={m.id} className="flex gap-3 justify-between items-start bg-stone-900/40 hover:bg-stone-900/60 p-3 rounded-2xl border border-stone-850 transition-colors">
                                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                                    <p className="text-stone-300 text-xs font-semibold leading-relaxed break-words italic">
                                      "{m.text}"
                                    </p>
                                    <span className="text-[9px] text-stone-500 font-mono">
                                      {new Date(m.createdAt).toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                  <div className="flex flex-col items-end shrink-0 gap-0.5">
                                    {m.isRead ? (
                                      <div className="flex items-center gap-1.5 text-emerald-400 font-black text-[9px] uppercase tracking-wider font-sans bg-emerald-500/10 px-2 py-0.5 rounded-full" title="Opened by recipient">
                                        <CheckCheck size={11} className="stroke-[3]" />
                                        <span>Opened</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1.5 text-stone-400 font-bold text-[9px] uppercase tracking-wider font-sans bg-stone-800 px-2 py-0.5 rounded-full" title="Delivered to inbox">
                                        <Check size={11} className="stroke-[2.5]" />
                                        <span>Delivered</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </motion.div>
                ) : (
                  <motion.div
                    key="timeline-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col gap-4"
                  >
                    {publicMessages.length === 0 ? (
                      <div className="glossy-card rounded-3xl p-8 text-center flex flex-col items-center">
                        <Inbox size={32} className="text-stone-600 mb-2" />
                        <span className="text-xs text-stone-400 leading-relaxed text-center block">
                          No public Q&A posts by @{targetUsername} yet. Ask them an anonymous message to get started!
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-1">
                        {publicMessages.map((msg) => (
                          <div key={msg.id} className="glossy-card rounded-3xl p-5 shadow-xl relative overflow-hidden text-left">
                            {/* Accent line */}
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-800 via-amber-500 to-red-800" />
                            
                            {/* Message question */}
                            <div className="mb-4">
                              <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-widest block mb-1">
                                Anonymous Question
                              </span>
                              <p className="text-stone-100 text-xs font-semibold break-words leading-relaxed bg-neutral-950/60 border border-stone-800/20 px-3.5 py-3 rounded-2xl">
                                "{msg.text}"
                              </p>
                            </div>

                            {/* Reply answer */}
                            <div className="pl-3 border-l-2 border-amber-500/40">
                              <div className="flex items-center gap-1.5 mb-2">
                                {/* Brand logo favicon: soft-rounded white square */}
                                <div className="w-5 h-5 bg-white rounded-md flex items-center justify-center shadow-md select-none shrink-0 border border-white/10" title="mimu logo">
                                  <span className="text-[11px] font-black text-stone-950 font-sans tracking-tighter leading-none">m</span>
                                </div>
                                <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wide">
                                  @{targetUsername}'s response
                                </span>
                              </div>
                              <p className="text-white text-xs font-semibold break-words leading-relaxed">
                                {renderFormattedText(msg.replyText || '')}
                              </p>
                              <span className="text-[9px] text-stone-500 mt-2 block font-mono text-right">
                                {msg.repliedAt && new Date(msg.repliedAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* --- 3. CREATOR DASHBOARD VIEW --- */}
      {currentView === 'dashboard' && myProfile && (
        <div id="creator-dashboard-screen" className="flex-1 flex flex-col max-w-4xl w-full mx-auto p-4 md:p-6 overflow-x-hidden">
          {/* Header area */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-6">
            <div className="flex items-center gap-3">
              <ProfileAvatar id={selectedAvatarId} className="w-12 h-12 shadow-lg border-amber-500/20" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                  <span className="text-xs text-emerald-400 font-bold tracking-wider uppercase">Avatar</span>
                </div>
                <h2 className="text-2xl font-black text-white mt-1">@{myProfile.username}</h2>
              </div>
            </div>

            {/* Link Copy & QR Widget */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 bg-neutral-900/60 border border-amber-500/10 p-2 rounded-2xl">
                <div className="px-2 font-mono text-stone-400 text-xs text-ellipsis overflow-hidden whitespace-nowrap max-w-[120px] sm:max-w-[180px]">
                  mimu.app/?u={myProfile.username}
                </div>
                <button
                  id="btn-copy-dashboard-link"
                  onClick={copyProfileLink}
                  className="flex items-center gap-1.5 glossy-gold-btn text-neutral-950 text-xs font-bold py-2 px-3.5 rounded-xl hover:scale-[1.03] transition-transform cursor-pointer"
                >
                  {linkCopied ? (
                    <>
                      <Check size={13} />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>

              <button
                id="btn-show-qr"
                onClick={() => setShowQrModal(true)}
                className="flex items-center gap-1.5 bg-stone-900/60 hover:bg-stone-900 py-3 px-4 rounded-2xl text-stone-300 hover:text-white border border-stone-800 hover:border-stone-700 hover:scale-[1.03] transition-transform cursor-pointer"
                title="Display QR code"
              >
                <QrCode size={14} className="text-amber-400" />
                <span className="text-xs font-bold">QR Code</span>
              </button>

              {/* Sound & Notification Control Hub */}
              <div className="relative">
                <button
                  id="btn-notif-hub-trigger"
                  onClick={() => setIsNotifMenuOpen(!isNotifMenuOpen)}
                  className={`flex items-center gap-1.5 justify-center py-3 px-4 relative rounded-2xl border transition-all cursor-pointer hover:scale-[1.03] ${
                    isNotifMenuOpen 
                      ? activeTheme === 'pink' 
                        ? 'bg-pink-955 text-white border-pink-500' 
                        : activeTheme === 'indigo'
                        ? 'bg-indigo-955 text-white border-indigo-500'
                        : 'bg-stone-850 text-white border-amber-500' 
                      : 'bg-stone-900/60 text-stone-300 hover:text-white border-stone-800 hover:border-stone-700'
                  }`}
                  title="Notifications & Sound Settings"
                >
                  {soundEnabled ? (
                    <Bell size={14} className={notifications.some(n => !n.read) ? 'text-amber-405 animate-bounce' : 'text-stone-400'} />
                  ) : (
                    <BellOff size={14} className="text-stone-500" />
                  )}
                  <span className="text-xs font-bold">Alerts</span>
                  {notifications.some(n => !n.read) && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-[9px] font-black w-4.5 h-4.5 flex items-center justify-center border border-stone-955 animate-pulse">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {isNotifMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-80 sm:w-96 bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl p-5 z-50 flex flex-col gap-4 font-sans select-none"
                    >
                      {/* Title Bar */}
                      <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                        <div className="flex items-center gap-2">
                          <Bell size={16} className={activeTheme === 'pink' ? 'text-pink-400' : activeTheme === 'indigo' ? 'text-indigo-405' : 'text-amber-450'} />
                          <h3 className="text-sm font-black text-white uppercase tracking-wider">Sounds & Alerts</h3>
                        </div>
                        <div className="flex gap-1.5">
                          {notifications.length > 0 && (
                            <button
                              onClick={() => {
                                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                              }}
                              className="text-[10px] text-stone-400 hover:text-white px-2 py-1 rounded bg-stone-950/60 border border-stone-850 transition-colors cursor-pointer font-bold font-mono"
                            >
                              Read All
                            </button>
                          )}
                          <button
                            onClick={() => setIsNotifMenuOpen(false)}
                            className="p-1 text-stone-500 hover:text-white cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Sound Controls Section */}
                      <div className="bg-stone-950/60 border border-stone-800/80 rounded-2xl p-3.5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {soundEnabled ? (
                              <Volume2 size={14} className={activeTheme === 'pink' ? 'text-pink-400' : activeTheme === 'indigo' ? 'text-indigo-400' : 'text-amber-400'} />
                            ) : (
                              <VolumeX size={14} className="text-stone-500" />
                            )}
                            <span className="text-xs font-bold text-stone-200">Alert Sounds</span>
                          </div>
                          <button
                            onClick={() => {
                              setSoundEnabled(!soundEnabled);
                              if (!soundEnabled) {
                                playSoundEffect('soft-pop');
                              }
                            }}
                            className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              soundEnabled 
                                ? activeTheme === 'pink' 
                                  ? 'bg-pink-500' 
                                  : activeTheme === 'indigo'
                                  ? 'bg-indigo-500'
                                  : 'bg-amber-500' 
                                : 'bg-stone-850'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-stone-950 shadow-lg ring-0 transition duration-200 ease-in-out ${
                                soundEnabled ? 'translate-x-4.5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {soundEnabled && (
                          <div className="space-y-3 pt-2.5 border-t border-stone-900/60">
                            {/* Volume Slider */}
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[10px] text-stone-500 font-mono uppercase tracking-wider">Volume</span>
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.05"
                                  value={soundVolume}
                                  onChange={(e) => {
                                    setSoundVolume(parseFloat(e.target.value));
                                  }}
                                  className={`w-full h-1 bg-stone-850 rounded-lg appearance-none cursor-pointer ${
                                    activeTheme === 'pink' ? 'accent-pink-500' : activeTheme === 'indigo' ? 'accent-indigo-500' : 'accent-amber-500'
                                  }`}
                                />
                                <span className="text-[10px] text-stone-400 font-mono w-6 text-right font-bold">
                                  {Math.round(soundVolume * 100)}%
                                </span>
                              </div>
                            </div>

                            {/* Sound Theme Selection */}
                            <div className="flex items-center justify-between gap-2 pt-1">
                              <span className="text-[10px] text-stone-500 font-mono uppercase tracking-wider">Sound Theme</span>
                              <div className="flex items-center gap-1.5">
                                <select
                                  value={soundTheme}
                                  onChange={(e: any) => {
                                    setSoundTheme(e.target.value);
                                  }}
                                  className="bg-stone-900 border border-stone-800 rounded-lg text-[10px] text-stone-200 py-1 px-1.5 focus:outline-none focus:border-stone-700 cursor-pointer"
                                >
                                  <option value="chime">🔔 Double Chime</option>
                                  <option value="soft-pop">🫧 Bubble Pop</option>
                                  <option value="mention">💫 Celestial Mention</option>
                                  <option value="cosmic-ping">☄️ Cosmic Delay</option>
                                </select>
                                <button
                                  onClick={() => playSoundEffect(soundTheme)}
                                  className={`p-1 rounded cursor-pointer transition-colors ${
                                    activeTheme === 'pink' 
                                      ? 'bg-pink-500 hover:bg-pink-400 text-stone-950' 
                                      : activeTheme === 'indigo'
                                      ? 'bg-indigo-500 hover:bg-indigo-400 text-stone-950'
                                      : 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                                  }`}
                                  title="Play test ringtone"
                                >
                                  <Play size={10} className="fill-stone-950" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* List of Notification Logs */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[10px] text-stone-500 font-mono font-bold uppercase tracking-wide">Recent Alerts ({notifications.length})</span>
                          {notifications.length > 0 && (
                            <button
                              onClick={() => setNotifications([])}
                              className="text-[9px] text-red-400 hover:text-red-300 font-mono font-bold uppercase bg-transparent cursor-pointer"
                            >
                              Clear Logs
                            </button>
                          )}
                        </div>

                        <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                          {notifications.length === 0 ? (
                            <div className="text-center py-6 text-stone-500 border border-dashed border-stone-800 rounded-xl bg-stone-950/20">
                              <p className="text-[10px] font-mono leading-relaxed">No notification alerts triggered.</p>
                              <p className="text-[9px] text-stone-600 mt-0.5">Alerts sound when confessions or mentions arrive.</p>
                            </div>
                          ) : (
                            notifications.map((notif) => (
                              <div
                                key={notif.id}
                                onClick={() => {
                                  setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                                }}
                                className={`p-2.5 rounded-xl border transition-all duration-150 flex gap-2 cursor-pointer text-left ${
                                  notif.read
                                    ? 'bg-stone-950/30 border-stone-900/60 text-stone-400'
                                    : 'bg-stone-850/60 border-stone-800 text-stone-100 hover:bg-stone-800'
                                }`}
                              >
                                <span className="pt-0.5 shrink-0">
                                  {notif.type === 'new_message' ? (
                                    <span className="text-yellow-405 font-bold">🤫</span>
                                  ) : notif.type === 'mention' ? (
                                    <span className="text-pink-400 font-bold">📢</span>
                                  ) : (
                                    <span className="text-indigo-400 font-bold">💬</span>
                                  )}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <p className="text-[11px] font-black leading-tight truncate">{notif.title}</p>
                                    {!notif.read && (
                                      <span className={`w-1.5 h-1.5 rounded-full animate-pulse shrink-0 ${
                                        activeTheme === 'pink' ? 'bg-pink-500' : activeTheme === 'indigo' ? 'bg-indigo-500' : 'bg-amber-500'
                                      }`} />
                                    )}
                                  </div>
                                  <p className="text-[10px] mt-0.5 text-stone-300 font-medium break-words leading-snug line-clamp-2">
                                    {notif.text}
                                  </p>
                                  <span className="text-[8px] text-stone-500 font-mono mt-1 block">
                                    {new Date(notif.time).toLocaleTimeString(undefined, {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Logout Option */}
            <div className="flex gap-2">
              <button
                id="btn-logout"
                onClick={handleLogout}
                className="flex items-center gap-1 hover:bg-stone-800 text-stone-400 hover:text-white text-xs font-semibold py-2 px-3 rounded-xl border border-stone-800 transition-colors cursor-pointer"
              >
                <span>Disconnect</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs (Inbox vs Settings) */}
          <div className="flex border-b border-stone-850 mb-6">
            <button
              id="btn-tab-inbox"
              onClick={() => setActiveTab('inbox')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'inbox'
                  ? 'border-amber-500 text-white'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Inbox size={16} className={activeTab === 'inbox' ? 'text-amber-400' : ''} />
              <span>Received Messages</span>
              <span className="bg-stone-900 border border-stone-800 text-stone-300 rounded-full px-2 py-0.5 text-xs font-medium">
                {messages.length}
              </span>
            </button>

            <button
              id="btn-tab-safety"
              onClick={() => setActiveTab('safety')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'safety'
                  ? 'border-amber-500 text-white'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Settings size={16} className={activeTab === 'safety' ? 'text-amber-400' : ''} />
              <span>Message Filter</span>
              {countFlagged() > 0 && (
                <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full px-2 py-0.5 text-[10px] font-semibold flex items-center gap-0.5">
                  <ShieldAlert size={10} />
                  <span>{countFlagged()} flagged</span>
                </span>
              )}
            </button>

            <button
              id="btn-tab-calls"
              onClick={() => setActiveTab('calls')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'calls'
                  ? 'border-amber-500 text-white'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Video size={16} className={activeTab === 'calls' ? 'text-amber-400' : ''} />
              <span>Video Hub</span>
              <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide">
                Live
              </span>
            </button>
          </div>

          {/* TAB 1: INBOX */}
          {activeTab === 'inbox' && (
            <div className="flex flex-col gap-6">
              {/* Summary Header Panel */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-3xl bg-stone-900/40 border border-stone-850">
                <div className="flex flex-col gap-1 px-4 py-3 bg-stone-950/40 rounded-2xl border border-stone-800/60 shadow-inner">
                  <span className="text-[10px] text-stone-500 uppercase font-mono tracking-wider">Total Messages</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-white">{messages.length}</span>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">messages</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 px-4 py-2.5 bg-stone-950/40 rounded-2xl border border-stone-800/60 shadow-inner">
                  <span className="text-[10px] text-stone-500 uppercase font-mono tracking-wider">Average Sentiment Score</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-amber-400">{getSentimentAverage()}%</span>
                    <span className="text-[10px] text-amber-500/80 font-mono font-bold">constructive</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 px-4 py-2.5 bg-stone-950/40 rounded-2xl border border-stone-800/60 shadow-inner">
                  <span className="text-[10px] text-stone-500 uppercase font-mono tracking-wider">Most Active Day</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-base font-black text-stone-100 uppercase truncate">{getMostActiveDay()}</span>
                    <span className="text-[10px] text-stone-500 font-mono font-bold">peak</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Inbox list */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                {messagesLoading ? (
                  <div className="text-center py-12 glossy-card rounded-3xl">
                    <div className="w-8 h-8 border-2 border-stone-800 border-t-amber-500 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-stone-400 text-xs">Polishing received messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div id="inbox-empty-view" className="text-center py-16 glossy-card p-6 rounded-3xl">
                    <MessageSquare size={36} className="text-stone-500 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-stone-200 font-sans">Inbox is empty</h3>
                    <p className="text-stone-400 text-xs max-w-xs mx-auto leading-relaxed mt-1 mb-6">
                      Share your mimu profile link to start receiving secure anonymous messages from friends.
                    </p>
                    <button
                      id="btn-inbox-share"
                      onClick={copyProfileLink}
                      className="glossy-gold-btn text-black font-extrabold text-xs py-2.5 px-5 rounded-xl cursor-pointer"
                    >
                      Copy My Link
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Search & Date Filter Bar */}
                    <div className="bg-neutral-900/40 border border-stone-800/80 rounded-2xl p-4 mb-2 flex flex-col gap-3">
                      <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-550" />
                          <input
                            type="text"
                            placeholder="Search questions or replies..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-neutral-950 border border-stone-850 rounded-xl pl-9 pr-4 py-2.5 text-xs text-stone-100 placeholder-stone-500 focus:border-amber-500 focus:outline-none transition-colors"
                          />
                          {searchTerm && (
                            <button
                              type="button"
                              onClick={() => setSearchTerm('')}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 text-[10px] uppercase font-bold"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Segmented Category Filter */}
                      <div className="flex gap-1.5 p-1 bg-neutral-955 rounded-xl border border-stone-850">
                        <button
                          type="button"
                          onClick={() => setFilterCategory('all')}
                          className={`flex-1 text-center py-1.5 text-[10px] uppercase font-black tracking-wider rounded-lg transition-all cursor-pointer ${
                            filterCategory === 'all'
                              ? 'bg-amber-500 text-stone-950'
                              : 'text-stone-400 hover:text-stone-200'
                          }`}
                        >
                          All Messages
                        </button>
                        <button
                          type="button"
                          onClick={() => setFilterCategory('starred')}
                          className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] uppercase font-black tracking-wider rounded-lg transition-all cursor-pointer ${
                            filterCategory === 'starred'
                              ? 'bg-yellow-500 text-stone-950'
                              : 'text-stone-400 hover:text-yellow-450'
                          }`}
                        >
                          <Star size={11} className={filterCategory === 'starred' ? 'fill-stone-950 stroke-stone-950' : 'fill-transparent'} />
                          <span>Starred ({messages.filter(m => m.isStarred).length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFilterCategory('pinned')}
                          className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] uppercase font-black tracking-wider rounded-lg transition-all cursor-pointer ${
                            filterCategory === 'pinned'
                              ? 'bg-amber-500/85 text-stone-950'
                              : 'text-stone-400 hover:text-amber-400'
                          }`}
                        >
                          <Pin size={11} className={filterCategory === 'pinned' ? 'fill-stone-950' : ''} />
                          <span>Pinned ({messages.filter(m => m.isPinned).length})</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3" id="filters-date-grid">
                        <div>
                          <label className="text-[9px] uppercase font-extrabold tracking-widest text-stone-500 block mb-1 font-mono">From Date</label>
                          <input
                            type="date"
                            value={filterStartDate}
                            onChange={(e) => setFilterStartDate(e.target.value)}
                            className="w-full bg-neutral-950 border border-stone-850 rounded-xl px-3 py-2 text-[10px] text-stone-300 focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase font-extrabold tracking-widest text-stone-500 block mb-1 font-mono">To Date</label>
                          <input
                            type="date"
                            value={filterEndDate}
                            onChange={(e) => setFilterEndDate(e.target.value)}
                            className="w-full bg-neutral-950 border border-stone-850 rounded-xl px-3 py-2 text-[10px] text-stone-300 focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {(searchTerm || filterStartDate || filterEndDate || filterCategory !== 'all') && (
                        <div className="flex justify-between items-center bg-amber-500/5 p-2 rounded-xl border border-amber-500/10">
                          <span className="text-[10px] text-amber-500/80 font-bold">
                            Found {filteredMessages.length} of {messages.length} messages
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSearchTerm('');
                              setFilterStartDate('');
                              setFilterEndDate('');
                              setFilterCategory('all');
                            }}
                            className="text-[10px] text-stone-400 hover:text-stone-200 underline"
                          >
                            Reset Filters
                          </button>
                        </div>
                      )}
                    </div>

                    {displayedMessages.length === 0 ? (
                      <div className="text-center py-12 bg-neutral-900/30 border border-stone-850 rounded-3xl p-6">
                        <Search size={28} className="text-stone-600 mx-auto mb-2 animate-pulse" />
                        <p className="text-stone-300 text-xs font-bold leading-relaxed">No search matches</p>
                        <p className="text-stone-500 text-[11px] leading-relaxed mt-0.5">Try changing your keywords or date range!</p>
                      </div>
                    ) : (
                      <>
                        {/* Keyboard Shortcuts Help bar near grid */}
                        <div id="shortcuts-tooltip-header" className="flex items-center justify-between px-1 mb-2">
                          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider font-mono">
                            Inbox ({displayedMessages.length})
                          </span>
                          
                          {/* Hover Tooltip */}
                          <div className="relative group">
                            <button
                              id="btn-shortcuts-tooltip"
                              type="button"
                              className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-850 hover:bg-stone-800 border border-stone-800 text-[10px] text-stone-400 hover:text-stone-200 rounded-lg transition-colors cursor-pointer font-mono font-bold"
                            >
                              <Keyboard size={11} className="text-amber-500" />
                              <span>Keyboard Shortcuts</span>
                            </button>
                            <div className="absolute right-0 bottom-full mb-2 w-64 p-3 bg-stone-950 border border-stone-800 rounded-xl shadow-2xl invisible group-hover:visible transition-all duration-200 z-30 flex flex-col gap-1.5 text-[11px] text-stone-300 font-mono">
                              <div className="text-[10px] uppercase font-bold text-amber-500 border-b border-stone-850 pb-1 mb-1 font-sans">
                                Keyboard Navigation
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Prev Code/Msg:</span>
                                <span className="bg-stone-855 text-amber-400 px-1.5 py-0.5 rounded text-[10px] font-bold border border-stone-800">K or ↑</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Next Code/Msg:</span>
                                <span className="bg-stone-855 text-amber-400 px-1.5 py-0.5 rounded text-[10px] font-bold border border-stone-800">J or ↓</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Read/Open:</span>
                                <span className="bg-stone-855 text-amber-400 px-1.5 py-0.5 rounded text-[10px] font-bold border border-stone-800">Enter</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Delete Msg:</span>
                                <span className="bg-stone-855 text-amber-400 px-1.5 py-0.5 rounded text-[10px] font-bold border border-stone-800">Del</span>
                              </div>
                              <div className="text-[9px] text-stone-500 mt-1 font-sans italic border-t border-stone-850 pt-1 leading-relaxed">
                                Tip: Click outside form fields to activate.
                              </div>
                            </div>
                          </div>
                        </div>

                        <div
                          ref={messagesGridRef}
                          id="messages-grid"
                          className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1"
                        >
                        {displayedMessages.map((msg, index) => {
                      const isQuarantined = msg.status === 'quarantined';
                      const isRevealed = !!revealedMessages[msg.id];
                      const isKeyboardSelected = kbSelectedIndex === index;
                      return (
                        <div
                          key={msg.id}
                          id={`msg-card-${msg.id}`}
                          onClick={() => {
                            setSelectedMessage(msg);
                            setKbSelectedIndex(index);
                          }}
                          className={`relative p-5 pl-12 rounded-2xl shadow-md border cursor-pointer hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between h-auto min-h-[160px] md:min-h-[180px] ${
                            isKeyboardSelected
                              ? activeTheme === 'pink'
                                ? 'bg-gradient-to-br from-pink-950/80 to-stone-900 border-pink-400 shadow-xl shadow-pink-500/20 ring-2 ring-pink-500/60'
                                : activeTheme === 'indigo'
                                ? 'bg-gradient-to-br from-indigo-950/80 to-stone-900 border-indigo-400 shadow-xl shadow-indigo-500/20 ring-2 ring-indigo-500/60'
                                : 'bg-gradient-to-br from-red-950/80 to-stone-900 border-amber-400 shadow-xl shadow-amber-500/20 ring-2 ring-amber-500/60'
                              : selectedMessage?.id === msg.id
                              ? activeTheme === 'pink'
                                ? 'bg-gradient-to-br from-pink-950/60 to-stone-900 border-pink-500 shadow-lg shadow-pink-500/5'
                                : activeTheme === 'indigo'
                                ? 'bg-gradient-to-br from-indigo-950/60 to-stone-900 border-indigo-500 shadow-lg shadow-indigo-500/5'
                                : 'bg-gradient-to-br from-red-950/60 to-stone-900 border-amber-500 shadow-lg shadow-amber-500/5'
                              : isQuarantined && !isRevealed
                              ? activeTheme === 'pink'
                                ? 'bg-pink-500/5 border-pink-500/20 shadow-pink-500/5'
                                : activeTheme === 'indigo'
                                ? 'bg-indigo-500/5 border-indigo-500/20 shadow-indigo-500/5'
                                : 'bg-amber-500/5 border-amber-500/20 shadow-amber-500/5'
                              : 'bg-stone-900/40 border-stone-800/80 hover:border-stone-700'
                          }`}
                        >
                          {/* Checkbox */}
                          <div
                            className="absolute top-5.5 left-4.5 z-20 flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={checkedMessageIds.includes(msg.id)}
                              onChange={() => handleToggleCheckbox(msg.id)}
                              className={`w-4.5 h-4.5 rounded border-stone-750 bg-stone-950 focus:ring-offset-stone-900 cursor-pointer ${
                                activeTheme === 'pink'
                                  ? 'text-pink-500 focus:ring-pink-500 accent-pink-500'
                                  : activeTheme === 'indigo'
                                  ? 'text-indigo-500 focus:ring-indigo-500 accent-indigo-500'
                                  : 'text-amber-500 focus:ring-amber-500 accent-amber-500'
                              }`}
                            />
                          </div>
                          {/* Top Tag */}
                          <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-2">
                              {/* Brand logo favicon: a beautiful soft-rounded white square on the dark card, matching the attached photo */}
                              <div className="w-5 h-5 bg-white rounded-lg flex items-center justify-center shadow-md shadow-white/5 select-none shrink-0 border border-white/10" title="mimu logo">
                                <span className="text-[11px] font-black text-stone-950 font-sans tracking-tighter leading-none">m</span>
                              </div>
                              {!readMessageIds.includes(msg.id) && (
                                <span className={`flex items-center gap-1.5 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider select-none animate-pulse ${
                                  activeTheme === 'pink' ? 'bg-pink-500 text-stone-950' : activeTheme === 'indigo' ? 'bg-indigo-500 text-stone-950' : 'bg-amber-500 text-stone-950'
                                }`}>
                                  New
                                </span>
                              )}
                              <span className="text-[10px] text-stone-500 font-mono">
                                {new Date(msg.createdAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {isQuarantined && (
                                <span className={`flex items-center gap-1 text-[9px] border font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full select-none ${
                                  activeTheme === 'pink'
                                    ? 'bg-pink-500/10 border-pink-500/20 text-pink-400'
                                    : activeTheme === 'indigo'
                                    ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                                    : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                }`}>
                                  <ShieldAlert size={10} />
                                  {isRevealed ? 'AI Sensitive' : 'Blocked Blur'}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTogglePin(msg.id);
                                }}
                                className={`p-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
                                  msg.isPinned
                                    ? activeTheme === 'pink'
                                      ? 'text-pink-400 bg-pink-500/20 scale-105'
                                      : msg.isPinned && activeTheme === 'indigo'
                                      ? 'text-indigo-400 bg-indigo-500/20 scale-105'
                                      : 'text-amber-400 bg-amber-500/20 scale-105'
                                    : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800'
                                }`}
                                title={msg.isPinned ? "Unpin message" : "Pin message to top (max 3)"}
                              >
                                <Pin size={12} className={msg.isPinned ? (activeTheme === 'pink' ? "fill-pink-400" : activeTheme === 'indigo' ? "fill-indigo-400" : "fill-amber-400") : ""} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleStar(msg.id);
                                }}
                                className={`p-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
                                  msg.isStarred ? 'text-yellow-400 bg-yellow-500/15 scale-105' : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800'
                                }`}
                                title={msg.isStarred ? "Remove Star / Favorite" : "Star / Favorite message"}
                              >
                                <Star size={12} className={msg.isStarred ? "fill-yellow-400 stroke-yellow-400" : ""} />
                              </button>
                            </div>
                          </div>

                          {/* Body Content */}
                          <div className="my-2 relative flex-1 flex flex-col justify-center">
                            {isQuarantined && !isRevealed ? (
                              <div className="w-full flex flex-col">
                                <p className="text-xs font-bold text-amber-500 mb-1 flex items-center gap-1 select-none font-sans">
                                  <AlertCircle size={12} /> Flagged language detected
                                </p>
                                <p className="text-xs text-stone-400 blur-xs transition-all pointer-events-none line-clamp-2 leading-relaxed">
                                  {msg.text}
                                </p>
                              </div>
                            ) : (
                              <div className="w-full">
                                <p className="text-stone-200 text-sm font-semibold leading-relaxed line-clamp-3 break-words">
                                  {msg.text}
                                </p>
                                
                                {msg.replyText && (
                                  <div className={`mt-2.5 p-2.5 bg-white/[0.02] border-l-2 rounded-r-lg ${
                                    activeTheme === 'pink' ? 'border-l-pink-500/50' : activeTheme === 'indigo' ? 'border-l-indigo-500/50' : 'border-l-amber-500/50'
                                  }`} onClick={(e) => e.stopPropagation()}>
                                    <div className={`flex items-center gap-1.5 mb-1 text-[8px] font-black tracking-widest font-mono uppercase ${
                                      activeTheme === 'pink' ? 'text-pink-400' : activeTheme === 'indigo' ? 'text-indigo-400' : 'text-amber-450'
                                    }`}>
                                      <MessageSquare size={9} />
                                      <span>Your Public Reply</span>
                                    </div>
                                    <p className="text-[11px] text-stone-300 leading-relaxed font-semibold line-clamp-2 break-words">
                                      {msg.replyText}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Bottom controls */}
                          <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-stone-800/40 z-10" onClick={(e) => e.stopPropagation()}>
                            {isQuarantined && (
                              <button
                                onClick={() => toggleRevealQuarantine(msg.id)}
                                className="flex items-center gap-1 text-stone-400 hover:text-stone-200 text-[11px] font-bold"
                              >
                                {isRevealed ? (
                                  <>
                                    <EyeOff size={12} />
                                    <span>Re-hide Text</span>
                                  </>
                                ) : (
                                  <>
                                    <Eye size={12} />
                                    <span>Reveal anyway</span>
                                  </>
                                )}
                              </button>
                            )}
                            <div className="flex-1" />
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="text-stone-500 hover:text-red-400 p-1 rounded-sm transition-colors cursor-pointer"
                              title="Delete permanently"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div></>
                )}
              </>
            )}
          </div>
                       {/* Message detailed view panel */}
              <div className="lg:col-span-5 hidden sm:block">
                <AnimatePresence mode="wait">
                  {selectedMessage ? (
                    <motion.div
                      key={selectedMessage.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="glossy-card rounded-3xl p-6 shadow-xl relative"
                    >
                      {renderDetailContent(selectedMessage)}
                    </motion.div>
                  ) : (
                    <div className="hidden lg:flex flex-col items-center justify-center py-20 px-6 border border-dashed border-stone-800 rounded-3xl text-center text-stone-500">
                      <Inbox size={32} className="text-stone-600 mb-2" />
                      <p className="text-xs">Click a card on the left list to review dynamic AI toxicity markers and export Story stickers.</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}

          {/* TAB 2: SAFETY GUARDRULES */}
          {activeTab === 'safety' && (
            <div className="glossy-card rounded-3xl p-6 shadow-xl max-w-2xl mx-auto w-full animate-shimmer">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2 font-sans">
                <ShieldCheck className="text-amber-400" />
                Message Filter Settings
              </h3>
              <p className="text-stone-400 text-xs leading-relaxed mb-6">
                mimu lets you block bad words. Senders can speak freely, but any message matching your blocklist will be automatically hidden.
              </p>

              {/* Profile Mascot Avatar Picker */}
              <div className="border-b border-stone-800 pb-5 mb-5">
                <span className="text-xs uppercase font-extrabold tracking-widest text-amber-500 block mb-2 font-sans">
                  Profile Mascot Avatar
                </span>
                <p className="text-stone-400 text-[11px] mb-4 leading-relaxed">
                  Choose a friendly mascot for your public profile. People who visit your link to write questions will see this cute character!
                </p>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {AVATAR_OPTIONS.map((avatar) => {
                    const IconComp = avatar.icon;
                    const isSelected = selectedAvatarId === avatar.id;
                    return (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => setSelectedAvatarId(avatar.id)}
                        className={`relative p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-[1.04] cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-md shadow-amber-500/5'
                            : 'bg-neutral-950 border-stone-850 text-stone-500 hover:text-stone-300 hover:border-stone-750'
                        }`}
                        title={avatar.name}
                      >
                        <IconComp size={22} className={isSelected ? 'text-amber-400' : 'text-stone-400'} />
                        <span className="text-[9px] font-bold uppercase tracking-wider">{avatar.name}</span>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 bg-amber-500 text-stone-950 rounded-full p-0.5 shadow-sm">
                            <Check size={8} strokeWidth={4} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Setting 1: Custom Keyword List */}
              <div className="border-b border-stone-800 pb-5 mb-5">
                <span className="text-xs uppercase font-extrabold tracking-widest text-amber-500 block mb-2 font-sans">
                  1. Blocks list Keywords & Phrases
                </span>
                <p className="text-stone-400 text-[11px] mb-3 leading-relaxed">
                  Add specific words, sensitive slang, names, or offensive phrases. Any incoming messages matching these words will be rejected in real-time.
                </p>

                {/* Tag list */}
                <div className="flex flex-wrap gap-1.5 mb-3.5 p-3 bg-neutral-950 border border-stone-850 rounded-xl min-h-[48px]">
                  {blocklist.length === 0 ? (
                    <span className="text-stone-500 text-xs italic self-center">No custom keywords added yet. Try typing one below.</span>
                  ) : (
                    blocklist.map((kw, idx) => (
                      <span key={idx} className="bg-stone-900 border border-amber-500/10 text-amber-400 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 select-none">
                        <span>{kw}</span>
                        <button
                          onClick={() => removeKeyword(kw)}
                          className="hover:text-white p-0.5 rounded-full cursor-pointer"
                          title="Remove keyword"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                <form onSubmit={addKeyword} className="flex gap-2">
                  <input
                    id="input-add-keyword"
                    type="text"
                    placeholder="Enter trigger word (e.g. loser, gossip)"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    className="flex-1 bg-neutral-950 border border-stone-800 rounded-xl text-xs px-4 py-3 focus:border-amber-500 focus:outline-none text-stone-100"
                  />
                  <button
                    id="btn-add-keyword"
                    type="submit"
                    className="bg-stone-800 hover:bg-stone-700 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer text-stone-300"
                  >
                    <Plus size={14} />
                    <span>Add</span>
                  </button>
                </form>
              </div>

              {/* Setting 2: AI Shield Switch */}
              <div className="border-b border-stone-800 pb-5 mb-5">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-xs uppercase font-extrabold tracking-widest text-amber-500 block font-sans">
                      2. AI Message Scanner
                    </span>
                    <p className="text-stone-400 text-[11px] leading-relaxed max-w-sm mt-1">
                      Check message tone with AI support. It will help review tone before messages reach your inbox.
                    </p>
                  </div>
                  <button
                    id="btn-toggle-ai"
                    onClick={() => setAiShield(!aiShield)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                      aiShield ? 'bg-amber-500' : 'bg-neutral-950'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full transition-transform duration-200 ${
                      aiShield ? 'translate-x-6 bg-stone-950' : 'translate-x-0 bg-stone-500'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Setting 3: Policies for flagged contents */}
              <div className="pb-6">
                <span className="text-xs uppercase font-extrabold tracking-widest text-amber-500 block mb-2 font-sans">
                  3. Filter Actions
                </span>
                <p className="text-stone-400 text-[11px] mb-3 leading-relaxed">
                  Choose what to do if a message contains blocked words from your list.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setQuarantinePolicy('quarantine')}
                    className={`p-4 rounded-2xl border cursor-pointer hover:border-amber-500/60 transition-all ${
                      quarantinePolicy === 'quarantine'
                        ? 'bg-gradient-to-tr from-red-950/20 to-stone-900 border-amber-500 shadow-md'
                        : 'bg-neutral-950 border-stone-800 text-stone-400'
                    }`}
                  >
                    <span className="font-bold text-xs block text-stone-200">Hide & Blur Message</span>
                    <span className="text-[10px] mt-1 block leading-normal opacity-85">
                      Blocked messages will be blurred in your inbox. You can still reveal and read them if you want.
                    </span>
                  </div>

                  <div
                    onClick={() => setQuarantinePolicy('block')}
                    className={`p-4 rounded-2xl border cursor-pointer hover:border-amber-500/60 transition-all ${
                      quarantinePolicy === 'block'
                        ? 'bg-gradient-to-tr from-red-950/20 to-stone-900 border-amber-500 shadow-md'
                        : 'bg-neutral-950 border-stone-800 text-stone-400'
                    }`}
                  >
                    <span className="font-bold text-xs block text-stone-200">Block Message Entirely</span>
                    <span className="text-[10px] mt-1 block leading-normal opacity-85">
                      The message will be completely rejected when submitted. The sender will be asked to rewrite it.
                    </span>
                  </div>
                </div>
              </div>

              {/* Save settings action */}
              <div className="flex justify-end gap-2 pt-2 border-t border-stone-800/40">
                <button
                  id="btn-save-settings"
                  onClick={handleSaveSettings}
                  disabled={settingsSaving}
                  className="glossy-gold-btn text-black font-extrabold text-xs py-3.5 px-6 rounded-xl cursor-pointer shadow-lg shadow-amber-500/10 transition-all disabled:opacity-50"
                >
                  {settingsSaving ? 'Saving filter settings...' : 'Save Filter Settings'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: REAL-TIME VIDEO ROOMS CALL CENTER */}
          {activeTab === 'calls' && (
            <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 select-none font-sans">
              {/* If NOT in a call room session */}
              {!activeRoomId ? (
                <div className="flex flex-col gap-6">
                  {/* Title and Intro */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-stone-900/40 border border-stone-850 p-6 rounded-3xl glossy-card">
                    <div>
                      <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2 mb-1.5">
                        <Video size={20} className="text-emerald-400" />
                        Live Calling Hub & Stream Rooms
                      </h3>
                      <p className="text-stone-400 text-xs leading-relaxed max-w-xl">
                        Create your own call chamber, control privacy settings, restrict room capacities, and video chat directly with other users on mimu using peer-to-peer WebRTC channels.
                      </p>
                    </div>

                    {!isCreateRoomOpen && (
                      <button
                        id="btn-open-create-room"
                        onClick={() => {
                          setIsCreateRoomOpen(true);
                          setRoomError('');
                        }}
                        className={`flex items-center gap-2 py-3 px-5 text-xs font-black uppercase tracking-wider rounded-2xl glossy-gold-btn text-black transition-all hover:scale-[1.03] cursor-pointer`}
                      >
                        <Plus size={15} />
                        Host Call Room
                      </button>
                    )}
                  </div>

                  {/* Create Room Form (Inline Modal block) */}
                  <AnimatePresence>
                    {isCreateRoomOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-stone-900 border border-stone-800 rounded-3xl p-6 flex flex-col gap-4 shadow-2xl relative"
                      >
                        <button
                          onClick={() => setIsCreateRoomOpen(false)}
                          className="absolute top-4 right-4 text-stone-400 hover:text-white p-1 cursor-pointer transition-colors"
                        >
                          <X size={18} />
                        </button>

                        <div className="border-b border-stone-800 pb-3">
                          <h4 className="text-sm font-black text-white uppercase tracking-widest">Create Call Room</h4>
                          <p className="text-[10px] text-stone-500 mt-0.5">Define your room limits and options</p>
                        </div>

                        <form onSubmit={handleCreateVideoRoom} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Room Topic Name */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-stone-400 font-mono font-bold uppercase tracking-wider">Room Name / Theme</label>
                              <input
                                type="text"
                                maxLength={30}
                                placeholder="e.g. Late night chat vibes"
                                value={newRoomName}
                                onChange={(e) => setNewRoomName(e.target.value)}
                                className="w-full bg-neutral-950 border border-stone-800 rounded-xl px-4 py-3 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 transition-colors"
                              />
                            </div>

                            {/* Max Users Capacity */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-stone-400 font-mono font-bold uppercase tracking-wider">Users Limit</label>
                              <select
                                value={newRoomMaxUsers}
                                onChange={(e) => setNewRoomMaxUsers(Number(e.target.value))}
                                className="w-full bg-neutral-950 border border-stone-800 rounded-xl px-4 py-3 text-xs text-stone-200 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                              >
                                <option value="2">👥 2 Users (1-on-1 calls)</option>
                                <option value="3">👥 3 Users (Small chat)</option>
                                <option value="4">👥 4 Users (Optimal Mesh)</option>
                                <option value="5">👥 5 Users (Group talk)</option>
                                <option value="8">👥 8 Users (Large party)</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Room Type */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-stone-400 font-mono font-bold uppercase tracking-wider">Room Privacy Type</label>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => setNewRoomType('public')}
                                  className={`py-3 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                    newRoomType === 'public'
                                      ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                                      : 'bg-neutral-950 border-stone-850 text-stone-500 hover:text-stone-300'
                                  }`}
                                >
                                  Public Room
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setNewRoomType('private')}
                                  className={`py-3 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                    newRoomType === 'private'
                                      ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                                      : 'bg-neutral-950 border-stone-850 text-stone-500 hover:text-stone-300'
                                  }`}
                                >
                                  <Lock size={12} />
                                  Private
                                </button>
                              </div>
                            </div>

                            {/* Passcode (Gated if private) */}
                            {newRoomType === 'private' && (
                              <div className="space-y-1.5 animate-shimmer">
                                <label className="text-[10px] text-stone-400 font-mono font-bold uppercase tracking-wider">Room Passcode</label>
                                <input
                                  type="password"
                                  maxLength={15}
                                  placeholder="Protect passcode..."
                                  value={newRoomPassword}
                                  onChange={(e) => setNewRoomPassword(e.target.value)}
                                  className="w-full bg-neutral-950 border border-stone-800 rounded-xl px-4 py-3 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 transition-colors"
                                />
                              </div>
                            )}
                          </div>

                          {roomError && (
                            <div className="p-3 bg-red-950/20 border border-red-500/10 text-red-400 text-xs rounded-xl flex items-center gap-2 leading-relaxed">
                              <AlertCircle size={14} className="flex-shrink-0" />
                              <span>{roomError}</span>
                            </div>
                          )}

                          <div className="flex justify-end gap-2.5 pt-2 border-t border-stone-800/40">
                            <button
                              type="button"
                              onClick={() => setIsCreateRoomOpen(false)}
                              className="px-4 py-3 text-xs text-stone-400 hover:text-white font-black uppercase tracking-wider cursor-pointer transition-colors bg-stone-905 rounded-xl border border-stone-850"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-5 py-3 text-xs text-black bg-amber-500 hover:bg-amber-400 rounded-xl font-black uppercase tracking-wider cursor-pointer shadow-lg shadow-amber-500/10 transition-colors flex items-center gap-1.5"
                            >
                              <Video size={13} className="fill-stone-950" />
                              Launch Call Chamber
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Call Rooms Feed Directory */}
                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] text-stone-500 font-mono font-bold uppercase tracking-wider px-1">
                      Active MimU Call Chambers ({videoRoomsList.length})
                    </span>

                    {videoRoomsLoading && videoRoomsList.length === 0 ? (
                      <div className="text-center py-12 text-stone-500 border border-stone-850 bg-stone-900/10 rounded-3xl flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-amber-505 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-mono text-stone-400">Scanning live calling channels...</span>
                      </div>
                    ) : videoRoomsList.length === 0 ? (
                      <div className="text-center py-12 text-stone-500 border border-dashed border-stone-800 bg-stone-900/10 rounded-3xl">
                        <Video size={24} className="mx-auto mb-2 text-stone-600" />
                        <p className="text-xs font-bold text-stone-300">No rooms active right now.</p>
                        <p className="text-[10px] text-stone-500 mt-1">Host your own call room to invite other users!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {videoRoomsList.map((room) => {
                          const isFull = room.participants.length >= room.maxUsers;
                          return (
                            <div
                              key={room.id}
                              className="border border-stone-850 hover:border-stone-750 bg-neutral-950/60 hover:bg-neutral-950 p-5 rounded-3xl transition-all flex flex-col justify-between gap-4 shadow-md group relative overflow-hidden"
                            >
                              {/* Backdrop glow effect */}
                              <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-500/5 blur-3xl group-hover:bg-amber-500/10 transition-colors duration-300" />

                              <div>
                                <div className="flex items-center justify-between gap-2 border-b border-stone-900 pb-2.5 mb-2.5">
                                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider truncate leading-none pt-0.5">
                                    {room.name}
                                  </h4>
                                  <div className="flex items-center gap-1.5">
                                    {room.hasPassword ? (
                                      <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                        <Lock size={8} /> passcode
                                      </span>
                                    ) : (
                                      <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase px-1.5 py-0.5 rounded">
                                        public
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-1.5 text-[10px] text-stone-400 truncate">
                                    <span className="text-amber-500 font-bold">🎙️ Host:</span>
                                    <span className="font-mono font-bold">@{room.creator}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] text-stone-400">
                                    <span className="text-stone-500 font-bold">👥 Users:</span>
                                    <span className="font-bold text-stone-300">
                                      {room.participants.length} / {room.maxUsers} limit
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => handleJoinVideoRoom(room)}
                                disabled={isFull}
                                className={`w-full py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                  isFull
                                    ? 'bg-stone-950 text-stone-600 border border-stone-900 cursor-not-allowed'
                                    : 'bg-stone-900 border border-stone-800 hover:border-amber-500 text-stone-200 hover:text-white'
                                }`}
                              >
                                {isFull ? (
                                  <span>Room Full</span>
                                ) : (
                                  <>
                                    <Phone size={10} className="text-emerald-400" />
                                    <span>Dial Join Call</span>
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* ACTIVE SESSION INTERACTIVE VIEW */
                <div className="flex flex-col gap-6">
                  {/* Call Header */}
                  <div className="flex items-center justify-between bg-stone-900 border border-stone-805 p-5 rounded-3xl glossy-card">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider truncate">
                          ☎️ {roomData?.name || 'Live Call Chamber'}
                        </h3>
                        <p className="text-[10px] text-stone-400 mt-0.5">
                          Conferencing as <span className="text-amber-400 font-mono font-bold">@{myProfile.username}</span> • {roomData?.participants.length || 1} active in room
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleLeaveVideoRoom}
                      className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-stone-950 font-black text-[10px] uppercase tracking-wider py-2.5 px-4 rounded-xl cursor-pointer shadow-lg shadow-red-500/10 transition-all hover:scale-[1.03]"
                    >
                      <PhoneOff size={11} className="stroke-stone-950" />
                      Leave Call
                    </button>
                  </div>

                  {/* 2-Column Split: Area Left (Streams + Options) & Area Right (Transient Chat Sidebar) */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
                    
                    {/* Left 2/3: Video Feeds & Controls list */}
                    <div className="lg:col-span-2 flex flex-col gap-5">
                      
                      {/* Video Camera Filter Selection bar */}
                      <div className="bg-stone-900/35 border border-stone-800 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                        <span className="text-[10px] text-stone-400 font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles size={11} className="text-amber-400 animate-pulse" />
                          Camera Filter & Scenic Blur
                        </span>
                        <div className="flex flex-wrap items-center gap-1">
                          {(['none', 'blur', 'grayscale', 'sepia', 'vintage', 'neon'] as const).map((fx) => (
                            <button
                              key={fx}
                              type="button"
                              onClick={() => {
                                setVideoFilter(fx);
                                showToast(`Applied ${fx} camera effect.`);
                              }}
                              className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border cursor-pointer select-none transition-all ${
                                videoFilter === fx
                                  ? 'bg-amber-500/15 border-amber-500 text-amber-400 font-extrabold'
                                  : 'bg-neutral-950 border-stone-850 text-stone-500 hover:text-stone-300'
                              }`}
                            >
                              {fx === 'none' ? 'original' : fx === 'blur' ? 'soft blur' : fx}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Active Streams Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                        
                        {/* Your local device stream camera */}
                        <div className="bg-neutral-950/80 border border-stone-805 rounded-3xl p-3 flex flex-col justify-between aspect-video relative group overflow-hidden shadow-xl">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 pointer-events-none" />

                          {/* Actual Video tag with reactive CSS Filter styles applied! */}
                          {!isCamOff && localStream ? (
                            <div className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden">
                              <video
                                ref={(videoElement) => {
                                  if (videoElement && localStream) {
                                    if (videoElement.srcObject !== localStream) {
                                      videoElement.srcObject = localStream;
                                    }
                                  }
                                }}
                                autoPlay
                                playsInline
                                muted={true}
                                className="w-full h-full object-cover transition-all duration-300"
                                style={{
                                  filter: (() => {
                                    switch (videoFilter) {
                                      case 'blur': return 'blur(5px) brightness(1.05) saturate(1.15)';
                                      case 'grayscale': return 'grayscale(1) contrast(1.15)';
                                      case 'sepia': return 'sepia(0.85) hue-rotate(-10deg) saturate(1.1)';
                                      case 'vintage': return 'contrast(0.9) sepia(0.15) brightness(0.95) saturate(0.8)';
                                      case 'neon': return 'hue-rotate(240deg) saturate(1.5) contrast(1.15)';
                                      default: return 'none';
                                    }
                                  })()
                                }}
                              />
                            </div>
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-900/60 rounded-2xl gap-2 font-black text-xs text-stone-400">
                              <span className="text-amber-455 font-bold block animate-wiggle uppercase tracking-wider">Camera Shut</span>
                              <span className="text-[10px] text-stone-550 font-mono">@{myProfile.username} (You)</span>
                            </div>
                          )}

                          {/* Header Overlays */}
                          <div className="flex items-center justify-between z-20 relative px-1">
                            <span className="bg-black/50 border border-stone-800/80 text-[8px] font-black uppercase text-amber-400 px-2 py-0.5 rounded-md font-mono tracking-wider flex items-center gap-1">
                              {isScreenSharing ? (
                                <>
                                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                                  SCREEN SHARE
                                </>
                              ) : (
                                'MY CAMERA'
                              )}
                            </span>
                            {isMicMuted && (
                              <span className="bg-red-500/15 border border-red-500/30 text-red-400 text-[8px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-0.5">
                                <MicOff size={8} /> muted
                              </span>
                            )}
                          </div>

                          {/* Footer label details */}
                          <div className="z-20 relative flex items-center justify-between px-1 border-stone-850">
                            <div className="flex flex-col">
                              <span className="text-xs text-stone-100 font-extrabold shadow-sm drop-shadow">@{myProfile.username}</span>
                              <span className="text-[8px] font-mono font-bold text-stone-450">Room Owner</span>
                            </div>
                          </div>
                        </div>

                        {/* Remote Streams */}
                        {roomData?.participants
                          .filter((p: any) => p.username !== myProfile.username)
                          .map((p: any) => {
                            const guestStream = remotePeerStreams[p.username];
                            const isNoVideo = !guestStream || guestStream.getVideoTracks().length === 0 || !guestStream.getVideoTracks()[0].enabled;
                            
                            return (
                              <div
                                key={p.username}
                                className="bg-neutral-950/80 border border-stone-805 rounded-3xl p-3 flex flex-col justify-between aspect-video relative group overflow-hidden shadow-xl"
                              >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 pointer-events-none" />

                                {!isNoVideo && guestStream ? (
                                  <video
                                    ref={(videoElement) => {
                                      if (videoElement && guestStream) {
                                        if (videoElement.srcObject !== guestStream) {
                                          videoElement.srcObject = guestStream;
                                        }
                                      }
                                    }}
                                    autoPlay
                                    playsInline
                                    muted={false}
                                    className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                                  />
                                ) : (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-900/60 rounded-2xl gap-2 font-black text-xs text-stone-400 animate-pulse">
                                    <span className="text-emerald-450 font-bold block uppercase tracking-wider">Audio Connecting...</span>
                                    <span className="text-[10px] text-stone-550 font-mono">@{p.username}</span>
                                  </div>
                                )}

                                {/* Header details with KICK option */}
                                <div className="flex items-center justify-between z-20 relative px-1">
                                  <span className="bg-black/50 border border-stone-800/80 text-[8px] font-black uppercase text-stone-300 px-2 py-0.5 rounded-md font-mono">
                                    Live Peer Session
                                  </span>

                                  {/* HOST CONTROL: Kick disruptive user */}
                                  {roomData?.creator === myProfile.username && (
                                    <button
                                      type="button"
                                      onClick={() => kickParticipant(p.username)}
                                      title={`Eject @${p.username} from call`}
                                      className="bg-red-500/15 hover:bg-red-500 border border-red-500/40 text-red-400 hover:text-black py-1 px-2 rounded-xl text-[8px] font-black uppercase transition-all cursor-pointer flex items-center gap-1.5"
                                    >
                                      <UserMinus size={10} />
                                      <span>Kick</span>
                                    </button>
                                  )}
                                </div>

                                {/* Footer details */}
                                <div className="z-20 relative flex items-center justify-between px-1 animate-shimmer">
                                  <div className="flex flex-col">
                                    <span className="text-xs text-stone-100 font-extrabold py-0.5 rounded">@{p.username}</span>
                                    <span className="text-[8px] font-mono font-bold text-stone-450">Visitor Participant</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                        {/* Waiting placeholder card if empty small rooms */}
                        {(!roomData || roomData.participants.length <= 1) && (
                          <div className="bg-stone-900/15 border border-dashed border-stone-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-2 aspect-video">
                            <Users size={20} className="text-stone-550 animate-pulse" />
                            <p className="text-xs font-bold text-stone-300">Invite guest to enter</p>
                            <p className="text-[9px] text-stone-500 max-w-[200px] leading-relaxed">
                              Copy your roommate profile username or ask other users to dial into your room theme!
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Interactive Controls Panel */}
                      <div className="flex items-center justify-center gap-3 bg-stone-900/40 border border-stone-800/85 p-4 rounded-3xl mx-auto w-full shadow-lg">
                        {/* Audio Toggle Button */}
                        <button
                          onClick={toggleVideoMute}
                          title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-center hover:scale-[1.05] ${
                            isMicMuted
                              ? 'bg-red-500/25 border-red-500 text-red-500 shadow-md shadow-red-500/5'
                              : 'bg-stone-950 border-stone-850 text-stone-300 hover:text-white'
                          }`}
                        >
                          {isMicMuted ? <MicOff size={18} /> : <Mic size={18} />}
                        </button>

                        {/* Video Camera Toggle Button */}
                        <button
                          onClick={toggleVideoCamera}
                          title={isCamOff ? 'Turn Camera ON' : 'Turn Camera OFF'}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-center hover:scale-[1.05] ${
                            isCamOff
                              ? 'bg-red-500/25 border-red-500 text-red-500 shadow-md shadow-red-500/5'
                              : 'bg-stone-950 border-stone-850 text-stone-300 hover:text-white'
                          }`}
                        >
                          {isCamOff ? <VideoOff size={18} /> : <Video size={18} />}
                        </button>

                        {/* SCREEN SHARING BUTTON */}
                        <button
                          onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                          title={isScreenSharing ? 'Stop Screen Share' : 'Broadcast Screen Share'}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-center hover:scale-[1.05] ${
                            isScreenSharing
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 animate-pulse'
                              : 'bg-stone-950 border-stone-850 text-stone-300 hover:text-emerald-400'
                          }`}
                        >
                          <Monitor size={18} />
                        </button>

                        {/* Quick Disconnect Stream Button */}
                        <button
                          onClick={handleLeaveVideoRoom}
                          title="Disconnect Call Room Session"
                          className="p-3 bg-red-650 hover:bg-red-550 border border-transparent rounded-2xl text-stone-950 flex items-center justify-center transition-all hover:scale-[1.05] cursor-pointer shadow-lg shadow-red-500/10"
                        >
                          <PhoneOff size={18} className="stroke-stone-950" />
                        </button>
                      </div>

                    </div>

                    {/* Right 1/3: Elegant Transient Text Chat Sidebar */}
                    <div className="lg:col-span-1 bg-stone-900/40 border border-stone-850 p-5 rounded-3xl glossy-card flex flex-col justify-between h-[450px] lg:h-[500px]">
                      
                      {/* Chat Sidebar Header */}
                      <div className="border-b border-stone-800 pb-3 mb-3">
                        <span className="text-[10px] text-stone-400 font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                          💬 Room Chat Stream
                        </span>
                        <p className="text-[9px] text-stone-500 leading-none mt-1">Transient call messages log</p>
                      </div>

                      {/* Chat Messages Scrolling log */}
                      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1.5 scrollbar-thin">
                        {!roomData?.chatMessages || roomData.chatMessages.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center text-stone-650 p-4">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Silence in Chat</span>
                            <span className="text-[9px] text-stone-600 mt-1">Send a message to everyone in the room.</span>
                          </div>
                        ) : (
                          roomData.chatMessages.map((msg: any) => {
                            const isMe = msg.from === myProfile.username.toLowerCase();
                            return (
                              <div
                                key={msg.id}
                                className={`flex flex-col max-w-[85%] ${
                                  isMe ? 'items-end ml-auto' : 'items-start mr-auto'
                                }`}
                              >
                                <div className="flex items-center gap-1 mb-0.5">
                                  <span className="text-[8px] font-mono font-black text-stone-500">@{msg.from}</span>
                                  <span className="text-[7px] text-stone-600">
                                    {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <div
                                  className={`px-3 py-2 rounded-2xl text-[11px] leading-relaxed break-words ${
                                    isMe
                                      ? 'bg-amber-500 text-stone-950 rounded-tr-none font-medium'
                                      : 'bg-stone-950 text-stone-200 border border-stone-850 rounded-tl-none'
                                  }`}
                                >
                                  {msg.text}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Message Input form */}
                      <form onSubmit={(e) => { e.preventDefault(); sendCallChatMessage(); }} className="mt-3 flex items-center gap-1.5 bg-stone-950 border border-stone-850 rounded-2xl p-1.5">
                        <input
                          type="text"
                          maxLength={150}
                          value={callChatText}
                          onChange={(e) => setCallChatText(e.target.value)}
                          placeholder="Type chat message..."
                          className="flex-1 bg-transparent border-0 outline-none text-[11px] text-white px-2 py-1 placeholder-stone-600 focus:ring-0 leading-relaxed"
                        />
                        <button
                          type="submit"
                          className="bg-amber-500 hover:bg-amber-400 p-2 rounded-xl text-stone-950 cursor-pointer flex items-center justify-center transition-all hover:scale-105"
                        >
                          <Send size={11} className="stroke-stone-950" />
                        </button>
                      </form>

                    </div>

                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile Slide-Up Message Detail Drawer */}
          <AnimatePresence>
            {selectedMessage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                id="mobile-drawer-backdrop"
                className="sm:hidden fixed inset-0 z-40 bg-stone-950/80 backdrop-blur-sm flex items-end justify-center"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setSelectedMessage(null);
                }}
              >
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="w-full bg-neutral-900 border-t border-stone-850 rounded-t-3xl max-h-[85vh] overflow-y-auto p-6 shadow-2xl relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div 
                    className="w-12 h-1.5 bg-stone-700/80 hover:bg-stone-600 rounded-full mx-auto mb-5 cursor-pointer" 
                    onClick={() => setSelectedMessage(null)} 
                  />
                  {renderDetailContent(selectedMessage)}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Social Media Share Modal */}
          <AnimatePresence>
            {isShareModalOpen && selectedMessage && (
              <ShareCard
                messageText={selectedMessage.text}
                username={myProfile?.username || ''}
                onClose={() => setIsShareModalOpen(false)}
              />
            )}
          </AnimatePresence>

          {/* QR Code Modal */}
          <AnimatePresence>
            {showQrModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-stone-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
                onClick={() => setShowQrModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="bg-stone-900 border border-stone-800 text-stone-200 rounded-3xl p-6 shadow-2xl max-w-sm w-full relative overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2 font-sans">
                      <QrCode className="text-amber-400" size={18} />
                      Share Profile QR Code
                    </h3>
                    <button
                      onClick={() => setShowQrModal(false)}
                      className="p-1.5 hover:bg-stone-800 text-stone-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <p className="text-stone-400 text-xs mb-5 font-medium leading-relaxed">
                    Saves your unique link to receive anonymous messages! Let others scan it or copy the link below.
                  </p>

                  <div className="bg-white p-4 rounded-2xl flex items-center justify-center shadow-inner max-w-[240px] mx-auto mb-5 border-4 border-stone-800/20">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="Profile QR Code"
                        className="w-full h-auto rounded-lg select-none"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    ) : (
                      <div className="w-[200px] h-[200px] flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-stone-900 border-t-amber-500 rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="bg-neutral-950/50 rounded-xl p-3 border border-stone-850 flex items-center justify-between mb-4">
                    <span className="text-[10px] font-mono text-stone-400 truncate max-w-[190px]">
                      {`${window.location.origin}/?u=${myProfile?.username}`}
                    </span>
                    <button
                      onClick={() => {
                        const shareUrl = `${window.location.origin}/?u=${myProfile?.username}`;
                        navigator.clipboard.writeText(shareUrl)
                          .then(() => showToast('Profile link copied to clipboard!'))
                          .catch(() => showToast('Failed to copy link.'));
                      }}
                      className="text-[10px] font-black uppercase text-amber-400 hover:text-amber-300 font-mono"
                    >
                      Copy Link
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      if (qrDataUrl) {
                        const link = document.createElement('a');
                        link.href = qrDataUrl;
                        link.download = `${myProfile?.username || 'mimu'}_qr_code.png`;
                        link.click();
                        showToast('QR Code download started!');
                      }
                    }}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-550 text-stone-950 font-black text-xs py-3 rounded-xl transition-all shadow-lg active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 font-sans"
                  >
                    <Download size={14} />
                    <span>Download QR Code Image</span>
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Batch Delete Panel */}
          <AnimatePresence>
            {checkedMessageIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.95 }}
                className="fixed bottom-24 right-6 bg-stone-900/95 backdrop-blur-md border border-stone-800 shadow-2xl p-4 rounded-3xl flex items-center gap-3.5 z-40 max-w-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-rose-400 font-mono">
                      {checkedMessageIds.length} Checked
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-stone-500 font-mono">Batch Action</span>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <button
                    onClick={() => setCheckedMessageIds([])}
                    className="px-3 py-2 bg-stone-800 hover:bg-stone-750 text-stone-400 hover:text-stone-200 text-[10px] uppercase font-bold tracking-wider rounded-xl transition-colors cursor-pointer font-mono"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleDeleteBatchMessages}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-505 text-white text-[10px] uppercase tracking-widest font-black rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer border border-red-500/20 font-mono"
                  >
                    <Trash2 size={11} />
                    <span>Delete</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Floating World Chat Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsWorldChatOpen(true)}
          className={`flex items-center gap-2 bg-gradient-to-r ${themeStyles[activeTheme].worldChatLauncher} text-stone-950 font-black px-4 py-3.5 rounded-full shadow-xl active:scale-95 transition-all text-xs uppercase tracking-wider cursor-pointer border`}
        >
          <Globe size={15} className="animate-spin-slow text-stone-950" />
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
          <span>World Chat</span>
        </button>
      </div>

      {/* World Chat Drawer */}
      <AnimatePresence>
        {isWorldChatOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsWorldChatOpen(false)}
              className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-50 cursor-pointer"
            />

            {/* World Chat Sidebar */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className={`fixed top-0 right-0 h-full w-full md:max-w-none sm:max-w-md ${themeStyles[activeTheme].worldChatBg} z-50 flex flex-col backdrop-blur-2xl border-l border-white/5 shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`p-4 border-b border-white/5 relative overflow-hidden ${themeStyles[activeTheme].worldHeaderGlow} flex items-center justify-between`}>
                <div className="max-w-4xl mx-auto w-full flex items-center justify-between px-2 md:px-6">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <div>
                      <h3 className="text-sm md:text-base font-black text-white uppercase tracking-wider">MIMU CHAT LOUNGE</h3>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[9px] md:text-[10px] text-stone-500 font-mono">
                        <span className="bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/20 text-emerald-300 font-bold">
                          {landingOnlineUsers} active
                        </span>
                        <span>•</span>
                        <span>{landingTotalUsers} Users</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsWorldChatOpen(false)}
                    className="p-2 text-stone-400 hover:text-white bg-stone-850 hover:bg-stone-800 rounded-lg transition-all duration-150 cursor-pointer flex items-center gap-1.5 text-xs font-bold font-mono"
                  >
                    <X size={16} />
                    <span className="hidden md:inline">CLOSE</span>
                  </button>
                </div>
              </div>

              {/* Nickname selection */}
              <div className="px-4 py-2.5 bg-stone-950/40 border-b border-stone-850">
                <div className="max-w-4xl mx-auto w-full flex items-center justify-between px-2 md:px-6">
                  <span className="text-[11px] md:text-xs text-stone-400 font-mono shrink-0">Your Name:</span>
                  {myProfile ? (
                    <span className={`text-xs md:text-sm font-bold ${themeStyles[activeTheme].text} font-mono`}>
                      @{myProfile.username} (Account Sync)
                    </span>
                  ) : (
                    <span className="text-xs md:text-sm text-stone-500 font-mono italic">
                      Viewing as Guest: {worldSenderNickname}
                    </span>
                  )}
                </div>
              </div>

              {/* Chat Sub-Dashboard layout */}
              <div className="flex-1 overflow-hidden flex flex-col bg-transparent md:py-6">
                <div className={`max-w-4xl mx-auto w-full flex-1 flex flex-col ${themeStyles[activeTheme].worldChatCardBg} border border-white/5 md:rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl`}>
                  
                  {/* Message container */}
                  <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                    {combinedWorldMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-stone-500 max-w-xs mx-auto">
                        <MessageSquare size={36} className="text-stone-700 mb-3 animate-bounce" />
                        <p className="text-xs md:text-sm font-bold text-stone-400">Say hello first!</p>
                        <p className="text-[10px] md:text-xs mt-1 leading-relaxed text-stone-500">No messages yet. Send a safe message to say hello!</p>
                      </div>
                    ) : (
                      combinedWorldMessages.map((msg) => {
                        const isMe = msg.senderId === senderUuid;
                        const isPending = msg.id.startsWith('temp-');

                        // Detect mentions
                        const myMentionLabel = myProfile ? `@${myProfile.username}` : `@${worldSenderNickname}`;
                        const hasMentionInMsg = 
                          (msg.text.toLowerCase().includes(myMentionLabel.toLowerCase())) ||
                          (myProfile && msg.text.toLowerCase().includes(`@${myProfile.username.toLowerCase()}`)) ||
                          (worldSenderNickname && msg.text.toLowerCase().includes(`@${worldSenderNickname.toLowerCase()}`));

                        return (
                          <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-full ${isPending ? 'opacity-70 animate-pulse' : ''}`}>
                            {/* Name label & Reply Trigger */}
                            <div className="flex items-center gap-2 mb-1 px-1">
                              <span className="text-[10px] md:text-[11px] text-stone-500 font-bold font-mono">
                                {msg.senderName} {isMe && '(You)'}
                              </span>
                              {!isPending && (
                                <button
                                  type="button"
                                  onClick={() => setWorldReplyTarget(msg)}
                                  className="text-[9px] text-amber-500/60 hover:text-amber-400 hover:bg-stone-800 px-1 rounded font-bold transition-all"
                                  title="Reply to message"
                                >
                                  Reply
                                </button>
                              )}
                            </div>
                                     {/* Bubble - Styled beautifully like Facebook Messenger font sizing and tracking */}
                            <div className={`py-2.5 px-4 md:py-3 md:px-5 rounded-2xl text-[15px] max-w-[85%] break-words shadow-sm font-sans tracking-wide leading-snug ${
                              isMe 
                                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-955 font-semibold rounded-tr-none' 
                                : hasMentionInMsg
                                  ? 'bg-amber-950/70 border-2 border-amber-500 text-stone-100 rounded-tl-none shadow-md shadow-amber-500/15'
                                  : 'bg-stone-850 text-stone-100 border border-stone-800 rounded-tl-none'
                            }`}>
                              {/* Quoted Message citation */}
                              {msg.replyTo && (
                                <div className={`mb-1.5 p-2 rounded-lg text-left border-l-2 text-[12px] leading-tight ${
                                  isMe
                                    ? 'bg-amber-600/30 border-amber-900 text-stone-950/90'
                                    : 'bg-stone-900/80 border-amber-500/40 text-stone-305'
                                }`}>
                                  <p className="font-bold font-mono text-[10px] uppercase tracking-wider opacity-80 mb-0.5">
                                    Quote • {msg.replyTo.senderName}
                                  </p>
                                  <p className="line-clamp-2 italic text-[12px]">
                                    "{msg.replyTo.text}"
                                  </p>
                                </div>
                              )}

                              {msg.photoUrl && (
                                <div className="mb-2 max-w-[230px] rounded-xl overflow-hidden border border-black/40 shadow-xl bg-stone-900">
                                  <img
                                    src={msg.photoUrl}
                                    alt="Attached attachment"
                                    className="w-full h-auto object-cover max-h-[170px] rounded-lg"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              )}

                              {msg.text && <p className="leading-snug break-words text-[15px]">{msg.text}</p>}
                              
                              <span className="block text-[9px] md:text-[10px] opacity-70 text-right mt-1.5 font-mono">
                                {isPending ? (
                                  <span>sending...</span>
                                ) : (
                                  new Date(msg.createdAt).toLocaleTimeString(undefined, {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={worldChatEndRef} />
                  </div>

                  {/* Typing Indicator */}
                  {typingUsers.length > 0 && (
                    <div className="px-4 py-2 bg-stone-950/40 border-t border-stone-850 flex items-center gap-2 select-none">
                      <div className="flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-[11px] text-stone-400 font-mono italic">
                        {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                      </span>
                    </div>
                  )}

                  {/* Active Reply Quote Preview */}
                  {worldReplyTarget && (
                    <div className="px-4 py-2.5 bg-stone-950 border-t border-stone-850 flex items-center justify-between gap-3 text-xs">
                      <div className="flex-1 min-w-0 border-l-2 border-amber-500 pl-3">
                        <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest font-mono">
                          Replying to {worldReplyTarget.senderName}
                        </div>
                        <p className="text-stone-300 truncate text-[11px] mt-0.5">
                          "{worldReplyTarget.text}"
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setWorldReplyTarget(null)}
                        className="text-stone-500 hover:text-stone-300 p-1 rounded-full bg-stone-900/60 transition-colors"
                        title="Cancel Reply"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}

                  {/* Input bar */}
                  {myProfile ? (
                    <form
                      onSubmit={handleSendWorldMessage}
                      className="p-3 md:p-4 border-t border-stone-850 bg-stone-950/80 flex flex-col gap-2"
                    >
                      {/* Attached Photo Preview */}
                      {worldAttachedPhoto && (
                        <div className="relative self-start mt-1 mr-2 border border-stone-800 rounded-xl overflow-hidden shadow-lg bg-stone-900 group">
                          <img
                            src={worldAttachedPhoto}
                            alt="Attached preview"
                            className="h-16 w-auto object-cover max-w-[120px] rounded-lg border border-stone-800"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => setWorldAttachedPhoto(null)}
                            className="absolute -top-1 -right-1 bg-red-600 hover:bg-red-500 text-white rounded-full p-1 shadow-md transition-transform hover:scale-105"
                            title="Remove photo"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <label className="bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-stone-700 text-stone-400 hover:text-stone-200 p-3 rounded-xl transition-colors cursor-pointer shrink-0 flex items-center justify-center" title="Attach picture from phone gallery">
                          <Image size={16} />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAttachPhotoChange}
                            className="hidden"
                          />
                        </label>
                        <input
                          type="text"
                          value={worldInput}
                          onChange={(e) => handleInputChange(e.target.value)}
                          placeholder={worldAttachedPhoto ? "Add a description... (optional)" : "Type a message..."}
                          maxLength={120}
                          className="flex-1 bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 text-[14px] md:text-[15px] text-white placeholder-stone-500 focus:border-amber-500 focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={!worldInput.trim() && !worldAttachedPhoto}
                          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-550 text-stone-950 p-3 rounded-xl transition-all duration-200 shadow-md flex items-center justify-center cursor-pointer disabled:opacity-40 shrink-0"
                          title="Send"
                        >
                          <Send size={15} className="fill-stone-950 stroke-none text-stone-950" />
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="p-5 border-t border-stone-850 bg-stone-950/80 text-center flex flex-col items-center gap-2.5">
                      <p className="text-[11px] md:text-xs text-stone-400 font-mono">
                        🔒 Account is required to join world chat and send messages.
                      </p>
                      <button
                        onClick={() => {
                          setIsWorldChatOpen(false);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                          setCurrentView('landing');
                        }}
                        className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-550 text-stone-950 font-extrabold text-[10px] md:text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 cursor-pointer"
                      >
                        Sign In / Create Account
                      </button>
                    </div>
                  )}

                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
