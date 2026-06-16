/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Dice5,
  Trash2,
  Copy,
  Check,
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
  Calendar,
  Search,
  Share2,
  Pin,
  Globe,
  MessageCircle,
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
  { id: 'rabbit', name: 'Rabbit', icon: Rabbit, color: 'text-purple-400 bg-purple-505/10 border-purple-500/20' },
  { id: 'bird', name: 'Bird', icon: Bird, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { id: 'fish', name: 'Fish', icon: Fish, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-505/20' },
  { id: 'crown', name: 'Crown', icon: Crown, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  { id: 'star', name: 'Hero', icon: Sparkles, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
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
  const [activeTab, setActiveTab] = useState<'inbox' | 'safety'>('inbox');

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

  // Sender Page State (?u=username)
  const [targetUsername, setTargetUsername] = useState('');
  const [targetProfileLoading, setTargetProfileLoading] = useState(false);
  const [targetProfileError, setTargetProfileError] = useState('');
  const [senderMessage, setSenderMessage] = useState('');
  const [senderSending, setSenderSending] = useState(false);
  const [senderSuccess, setSenderSuccess] = useState(false);
  const [senderBlockReason, setSenderBlockReason] = useState('');

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

  // Fetch world chat messages periodically
  useEffect(() => {
    if (!isWorldChatOpen) return;

    const fetchWorldChat = async () => {
      try {
        const res = await fetch('/api/world-chat');
        const json = await res.json();
        if (json.success && json.data) {
          setWorldMessages(json.data);
        }
      } catch (err) {
        console.error('Failed to load world chat', err);
      }
    };

    fetchWorldChat();
    const interval = setInterval(fetchWorldChat, 4000);
    return () => clearInterval(interval);
  }, [isWorldChatOpen]);

  // World chat bottom scroll
  useEffect(() => {
    if (isWorldChatOpen && worldChatEndRef.current) {
      worldChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [worldMessages, isWorldChatOpen]);

  // Auto-scroll inbox to the top (newest messages) when tab is entered or loading finishes
  useEffect(() => {
    if (activeTab === 'inbox' && !messagesLoading && messages.length > 0) {
      if (messagesGridRef.current) {
        messagesGridRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [activeTab, messagesLoading, messages.length]);



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

  const handleSendWorldMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = worldInput.trim();
    if (!cleanText) return;

    setIsSendingWorldMsg(true);
    try {
      const res = await fetch('/api/world-chat/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          senderName: myProfile ? `@${myProfile.username}` : (worldSenderNickname || 'Anonymous Chatty'),
          senderId: senderUuid,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWorldMessages((prev) => [...prev, data.data]);
        setWorldInput('');
      } else {
        showToast(data.error || 'Failed sending message.');
      }
    } catch (err) {
      console.error('Error sending world message:', err);
      showToast('Network error while speaking to community.');
    } finally {
      setIsSendingWorldMsg(false);
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

  const fetchInbox = async (usr: string, pinCode: string) => {
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/messages/${usr}?pin=${pinCode}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.data);
      }
    } catch (err) {
      showToast('Could not retrieve messages.');
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!usernameInput || !pinInput) {
      setAuthError('Please fill out both the username and security PIN.');
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
      setAuthError('Please fill out both the username and security PIN.');
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

  // Submit Safety Guardrails updates to the server
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
        showToast('Safety filters updated successfully!');
        setTimeout(() => setSettingsSuccess(false), 3000);
      } else {
        showToast(data.error || 'Could not save safety guardrails.');
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

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
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
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentView, activeTab, displayedMessages, kbSelectedIndex]);

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
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
            <MessageSquare size={13} />
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
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-amber-400 block mb-2 font-sans">
              Write your public reply
            </span>
            <textarea
              maxLength={300}
              rows={3}
              placeholder="Type a thoughtful, friendly answer..."
              value={replyInput}
              onChange={(e) => setReplyInput(e.target.value)}
              className="w-full bg-stone-900 border border-stone-800 rounded-xl p-3 text-xs text-white placeholder-stone-500 focus:border-amber-500 focus:outline-none resize-none leading-relaxed"
            />
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
            className="flex-1 glossy-gold-btn text-neutral-950 text-xs font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-amber-500/10 hover:-translate-y-0.5 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer animate-shimmer font-sans"
          >
            <Sparkles size={14} />
            <span>Design sharing story</span>
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
          <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-200 bg-clip-text text-transparent drop-shadow-md">
            Mimu
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
    <div className="min-h-screen bg-neutral-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-neutral-950 relative overflow-hidden">
      {/* Dark Red Ambient Radial Spotlight Overlay */}
      <div className="absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(circle_at_top,rgba(153,27,27,0.18)_0%,rgba(10,10,10,0)_70%)] pointer-events-none z-0" />

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
            <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-100 bg-clip-text text-transparent flex items-center gap-2">
              mimu
            </h1>
            <p className="text-amber-100/60 text-sm max-w-xs leading-relaxed mt-2 font-medium">
              Anonymous message sticker links for your peer group with custom safety logic.
            </p>
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
                    Your share link: mimu.app/?u=yourname (Local PIN credentials saved to browser)
                  </span>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-stone-400 tracking-wider block mb-1">
                  Security PIN (At least 4 digits)
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
                  <input
                    id="input-pin"
                    type="password"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="••••"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                    disabled={authLoading}
                    className="w-full pl-9 pr-4 py-3 bg-neutral-950 border border-stone-800 rounded-xl text-sm tracking-widest focus:border-amber-500 focus:outline-none transition-colors text-stone-100"
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
                    <span>{authMode === 'register' ? 'Create Local Account' : 'Secure Sign In'}</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Value Prop banner */}
          <div className="flex flex-col md:flex-row items-center gap-6 mt-12 max-w-xl text-stone-400 text-xs text-center md:text-left z-10 px-4">
            <div className="flex items-center gap-3 bg-stone-900/40 border border-stone-800 p-4 rounded-2xl md:flex-1">
              <ShieldCheck size={36} className="text-amber-500 flex-shrink-0" />
              <div>
                <p className="font-bold text-stone-200">Custom Keywords</p>
                <p>Add triggers to flag name-calling or unwanted words instantly before they touch you.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-stone-900/40 border border-stone-800 p-4 rounded-2xl md:flex-1">
              <Sparkles size={36} className="text-amber-400 flex-shrink-0" />
              <div>
                <p className="font-bold text-stone-200">AI Bully Screen</p>
                <p>Gemini verifies the tone of each msg, auto-blurring severe content or blocking trolls.</p>
              </div>
            </div>
          </div>
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
                            
                            {/* Roll dynamic Dice Helper */}
                            <button
                              id="btn-sender-dice"
                              type="button"
                              onClick={rollDicePrompt}
                              title="Generate fun prompt idea"
                              className="absolute bottom-3 right-3 bg-stone-900 border border-stone-800 hover:border-amber-500 p-2.5 rounded-xl text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                            >
                              <Dice5 size={18} className="animate-wiggle" />
                            </button>
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
                              <div className="flex items-center gap-1.5 mb-1 bg-stone-900 rounded-md">
                                <span className="w-4 h-4 bg-gradient-to-tr from-amber-600 to-yellow-400 rounded-md flex items-center justify-center text-[8px] font-black text-stone-950">m</span>
                                <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wide">
                                  @{targetUsername}'s response
                                </span>
                              </div>
                              <p className="text-white text-xs font-bold break-words leading-relaxed">
                                {msg.replyText}
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
                  <span className="text-xs text-emerald-400 font-bold tracking-wider uppercase">Active Sticker Inbox</span>
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
              <span>Safety Guardrails</span>
              {countFlagged() > 0 && (
                <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full px-2 py-0.5 text-[10px] font-semibold flex items-center gap-0.5">
                  <ShieldAlert size={10} />
                  <span>{countFlagged()} flagged</span>
                </span>
              )}
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

                      {(searchTerm || filterStartDate || filterEndDate) && (
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
                          className={`relative p-5 pl-12 rounded-2xl shadow-md border cursor-pointer hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between aspect-video ${
                            isKeyboardSelected
                              ? 'bg-gradient-to-br from-red-950/80 to-stone-900 border-amber-400 shadow-xl shadow-amber-500/20 ring-2 ring-amber-500/60'
                              : selectedMessage?.id === msg.id
                              ? 'bg-gradient-to-br from-red-950/60 to-stone-900 border-amber-500 shadow-lg shadow-amber-500/5'
                              : isQuarantined && !isRevealed
                              ? 'bg-amber-500/5 border-amber-500/20 shadow-amber-500/5'
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
                              className="w-4.5 h-4.5 rounded border-stone-750 bg-stone-950 text-amber-500 focus:ring-amber-500 focus:ring-offset-stone-900 cursor-pointer accent-amber-500"
                            />
                          </div>
                          {/* Top Tag */}
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-stone-500 font-mono">
                              {new Date(msg.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {isQuarantined && (
                                <span className="flex items-center gap-1 text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-500 font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full select-none">
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
                                  msg.isPinned ? 'text-amber-400 bg-amber-500/20 scale-105' : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800'
                                }`}
                                title={msg.isPinned ? "Unpin message" : "Pin message to top (max 3)"}
                              >
                                <Pin size={12} className={msg.isPinned ? "fill-amber-400" : ""} />
                              </button>
                            </div>
                          </div>

                          {/* Body Content */}
                          <div className="my-2 relative flex-1 flex items-center">
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
                              <p className="text-stone-200 text-sm font-semibold leading-relaxed line-clamp-3 break-words">
                                {msg.text}
                              </p>
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
                  </div>
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
                Custom Harassment Filters
              </h3>
              <p className="text-stone-400 text-xs leading-relaxed mb-6">
                mimu lets you completely control your inbox. Senders whose content is flagged will either be quarantined or blocked based on your settings.
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
                      2. Gemini AI safety shield
                    </span>
                    <p className="text-stone-400 text-[11px] leading-relaxed max-w-sm mt-1">
                      Turn on Gemini-powered peer safety validation. We auto-analyze text tone for cyberbullying, insults, and harassment before delivering them.
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
                  3. Violation Escalation Actions
                </span>
                <p className="text-stone-400 text-[11px] mb-3 leading-relaxed">
                  Decide how heavily you react when a message fails verification checks or triggers triggers.
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
                    <span className="font-bold text-xs block text-stone-200">Flag & Quarantine Blur</span>
                    <span className="text-[10px] mt-1 block leading-normal opacity-85">
                      Messages show up blurred in your card inbox with standard AI warning headers. Unseal them manually whenever you wish.
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
                    <span className="font-bold text-xs block text-stone-200">Reject Entirely (Zero Tolerance)</span>
                    <span className="text-[10px] mt-1 block leading-normal opacity-85">
                      Violating messages are rejected on submit. The sender is polite asking to keep feedback warm, saving you from receiving bad vibes.
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
                  {settingsSaving ? 'Saving guardrails...' : 'Confirm Safety Settings'}
                </button>
              </div>
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
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-550 text-stone-950 font-black px-4 py-3.5 rounded-full shadow-xl shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-95 transition-all text-xs uppercase tracking-wider cursor-pointer border border-amber-400/20"
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
              className="fixed top-0 right-0 h-full w-full md:max-w-none sm:max-w-md bg-stone-900 border-l border-stone-800 shadow-2xl z-50 flex flex-col md:bg-stone-950"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-stone-850 bg-stone-900 flex items-center justify-between">
                <div className="max-w-4xl mx-auto w-full flex items-center justify-between px-2 md:px-6">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                    <div>
                      <h3 className="text-sm md:text-base font-black text-white uppercase tracking-wider">mimu World Chat Dashboard</h3>
                      <p className="text-[10px] md:text-xs text-stone-500 font-medium lowercase">account required to chat, view only for guests</p>
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
              <div className="px-4 py-2.5 bg-stone-950 border-b border-stone-850">
                <div className="max-w-4xl mx-auto w-full flex items-center justify-between px-2 md:px-6">
                  <span className="text-[11px] md:text-xs text-stone-400 font-mono shrink-0">Your Name:</span>
                  {myProfile ? (
                    <span className="text-xs md:text-sm font-bold text-amber-400 font-mono">
                      @{myProfile.username} (Account Sync)
                    </span>
                  ) : (
                    <span className="text-xs md:text-sm text-stone-500 font-mono italic">
                      Viewing as Guest
                    </span>
                  )}
                </div>
              </div>

              {/* Chat Sub-Dashboard layout */}
              <div className="flex-1 overflow-hidden flex flex-col bg-stone-900/50 md:py-6">
                <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col bg-stone-900 md:border md:border-stone-800 md:rounded-3xl shadow-2xl overflow-hidden">
                  
                  {/* Message container */}
                  <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                    {worldMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-stone-500 max-w-xs mx-auto">
                        <MessageSquare size={36} className="text-stone-700 mb-3 animate-bounce" />
                        <p className="text-xs md:text-sm font-bold text-stone-400">Say hello first!</p>
                        <p className="text-[10px] md:text-xs mt-1 leading-relaxed text-stone-500">No messages yet. Send a safe message to say hello!</p>
                      </div>
                    ) : (
                      worldMessages.map((msg) => {
                        const isMe = msg.senderId === senderUuid;
                        return (
                          <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-full`}>
                            {/* Name label */}
                            <span className="text-[9px] md:text-[10px] text-stone-500 font-bold mb-0.5 px-1 font-mono">
                              {msg.senderName} {isMe && '(You)'}
                            </span>
                            
                            {/* Bubble */}
                            <div className={`p-3 md:p-4 rounded-2xl text-xs md:text-sm max-w-[85%] break-words shadow-sm ${
                              isMe 
                                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-semibold rounded-tr-none' 
                                : 'bg-stone-850 text-stone-200 border border-stone-800 rounded-tl-none'
                            }`}>
                              <p className="leading-relaxed">{msg.text}</p>
                              <span className="block text-[8px] md:text-[9px] opacity-60 text-right mt-1.5 font-mono">
                                {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={worldChatEndRef} />
                  </div>

                  {/* Input bar */}
                  {myProfile ? (
                    <form
                      onSubmit={handleSendWorldMessage}
                      className="p-3 md:p-4 border-t border-stone-850 bg-stone-950/80 flex items-center gap-3"
                    >
                      <input
                        type="text"
                        value={worldInput}
                        onChange={(e) => setWorldInput(e.target.value)}
                        placeholder="Type basic easy message..."
                        maxLength={120}
                        disabled={isSendingWorldMsg}
                        className="flex-1 bg-stone-900 border border-stone-805 rounded-xl px-4 py-3 text-xs md:text-sm text-white placeholder-stone-500 focus:border-amber-500 focus:outline-none disabled:opacity-50"
                      />
                      <button
                        type="submit"
                        disabled={isSendingWorldMsg || !worldInput.trim()}
                        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-550 text-stone-950 p-3 rounded-xl transition-all duration-200 shadow-md flex items-center justify-center cursor-pointer disabled:opacity-40 shrink-0"
                        title="Send"
                      >
                        <Send size={15} className="fill-stone-950 stroke-none text-stone-950" />
                      </button>
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
