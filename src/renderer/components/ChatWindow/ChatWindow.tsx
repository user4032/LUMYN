import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Paper,
  Popper,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  InputAdornment,
  Menu,
  MenuItem,
  Chip,
  Fade,
  Tooltip,
  Button,
  Dialog,
  DialogContent,
} from '@mui/material';
import {
  Reply as ReplyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PushPin as PinIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { RootState } from '@store/store';
import { addMessage, deleteMessage, editMessage, togglePin, toggleMute, addChat } from '@store/slices/chatsSlice';
import { formatDistanceToNow, format } from 'date-fns';
import { uk, enUS } from 'date-fns/locale';
import {
  BrutalCallIcon,
  BrutalVideoIcon,
  BrutalMoreIcon,
  BrutalAttachIcon,
  BrutalEmojiIcon,
  BrutalSendIcon,
} from '../icons/BrutalIcons';
import UserProfileDialog from '../UserProfileDialog/UserProfileDialog';
import EmojiPicker from '../EmojiPicker/EmojiPicker';
import GifPicker from '../GifPicker/GifPicker';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog';
import PinnedMessagesDialog from '../PinnedMessagesDialog/PinnedMessagesDialog';
import MessageSearchDialog from '../MessageSearchDialog/MessageSearchDialog';
import { t } from '@i18n/index';
import { socketService } from '../../services/socket';

interface ChatWindowProps {
  chatId: string | null;
  channelId?: string | null;
  onSelectChat?: (chatId: string) => void;
}

interface MentionMember {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'idle' | 'dnd' | 'away' | 'busy' | 'invisible';
}

interface MentionItem {
  id: string;
  type: 'user' | 'role' | 'channel';
  label: string;
  value: string;
  subtitle?: string;
  avatar?: string;
  status?: MentionMember['status'];
  matchText: string;
}

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const formatInlineMarkdown = (value: string) => {
  let out = escapeHtml(value);

  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (match, text, url) => {
    const safeUrl = String(url).replace(/"/g, '&quot;');
    return `<a href="${safeUrl}" target="_blank" rel="noreferrer noopener">${text}</a>`;
  });

  const codeTokens: string[] = [];
  out = out.replace(/`([^`]+?)`/g, (match, code) => {
    const token = `@@CODE${codeTokens.length}@@`;
    codeTokens.push(`<code class="inline-code">${escapeHtml(code)}</code>`);
    return token;
  });

  out = out.replace(/\*\*\*([\s\S]+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  out = out.replace(/___([\s\S]+?)___/g, '<strong><em>$1</em></strong>');
  out = out.replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/__([\s\S]+?)__/g, '<u>$1</u>');
  out = out.replace(/\*([^*]+?)\*/g, '<em>$1</em>');
  out = out.replace(/_([^_]+?)_/g, '<em>$1</em>');
  out = out.replace(/~~([\s\S]+?)~~/g, '<s>$1</s>');

  out = out.replace(/\|\|([\s\S]+?)\|\|/g, '<span class="spoiler">$1</span>');

  out = out.replace(/@@CODE(\d+)@@/g, (match, idx) => codeTokens[Number(idx)] || match);

  return out;
};

const formatDiscordMarkdown = (value: string) => {
  const lines = value.replace(/\r\n/g, '\n').split('\n');
  let html = '';
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let listOpen = false;

  const closeList = () => {
    if (listOpen) {
      html += '</ul>';
      listOpen = false;
    }
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLines = [];
      } else {
        inCodeBlock = false;
        html += `<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (line.startsWith('>>>')) {
      closeList();
      const remaining = [line.replace(/^>>>\s?/, ''), ...lines.slice(i + 1)];
      html += `<blockquote>${formatInlineMarkdown(remaining.join('\n'))}</blockquote>`;
      break;
    }

    if (line.startsWith('> ')) {
      closeList();
      html += `<blockquote>${formatInlineMarkdown(line.replace(/^>\s?/, ''))}</blockquote>`;
      continue;
    }

    const listMatch = line.match(/^\s*[-*]\s+(.+)$/);
    if (listMatch) {
      if (!listOpen) {
        html += '<ul>';
        listOpen = true;
      }
      html += `<li>${formatInlineMarkdown(listMatch[1])}</li>`;
      continue;
    }

    closeList();

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      html += `<div class="md-h${level}">${formatInlineMarkdown(headingMatch[2])}</div>`;
      continue;
    }

    if (line.startsWith('-# ')) {
      html += `<div class="md-subtext">${formatInlineMarkdown(line.replace(/^-#\s+/, ''))}</div>`;
      continue;
    }

    html += `<div class="md-line">${formatInlineMarkdown(line)}</div>`;
  }

  if (inCodeBlock) {
    html += `<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`;
  }
  closeList();

  return { __html: html };
};

const STATUS_COLORS: Record<string, string> = {
  online: '#3ba55d',
  offline: '#747f8d',
  idle: '#faa61a',
  dnd: '#ed4245',
  away: '#faa61a',
  busy: '#ed4245',
  invisible: '#747f8d',
};

const ChatWindow: React.FC<ChatWindowProps> = ({ chatId, channelId, onSelectChat }) => {
  const dispatch = useDispatch();
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number; messageId: string } | null>(null);
  const [emojiPickerAnchor, setEmojiPickerAnchor] = useState<HTMLElement | null>(null);
  const [editingMessage, setEditingMessage] = useState<{ id: string; content: string } | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; userName: string; content: string } | null>(null);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<HTMLElement | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userProfileOpen, setUserProfileOpen] = useState(false);
  const [chatTextScale, setChatTextScale] = useState(1);
  const [gifPickerAnchor, setGifPickerAnchor] = useState<HTMLElement | null>(null);
  const [idleBadgeIndex, setIdleBadgeIndex] = useState(0);
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);
  const [confirmDeleteChat, setConfirmDeleteChat] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pinnedMessageId, setPinnedMessageId] = useState<string | null>(null);
  const [pinnedMessagesDialogOpen, setPinnedMessagesDialogOpen] = useState(false);
  const [messageSearchDialogOpen, setMessageSearchDialogOpen] = useState(false);
  const [mentionItems, setMentionItems] = useState<MentionItem[]>([]);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [serverMembers, setServerMembers] = useState<MentionMember[]>([]);
  const [mentionAnchorEl, setMentionAnchorEl] = useState<HTMLElement | null>(null);
  const [forceUpdateKey, setForceUpdateKey] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gifInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  
  const activeId = chatId || channelId;

  const idleBadgeVariants = [
    { bgcolor: '#5865F2', borderRadius: '50%', rotate: '0deg' },
    { bgcolor: '#3BA55D', borderRadius: '18%', rotate: '45deg' },
    { bgcolor: '#FAA81A', borderRadius: '50% 10% 50% 10%', rotate: '0deg' },
    { bgcolor: '#ED4245', borderRadius: '12%', rotate: '-20deg' },
    { bgcolor: '#57F287', borderRadius: '60% 20% 60% 20%', rotate: '10deg' },
    { bgcolor: '#EB459E', borderRadius: '35% 35% 10% 10%', rotate: '0deg' },
  ];
  
  const chat = useSelector((state: RootState) =>
    state.chats.chats.find((c) => c.id === activeId)
  );
  
  const servers = useSelector((state: RootState) => state.servers.servers);
  const activeServer = useSelector((state: RootState) => state.servers.activeServer);
  const activeChannel = useSelector((state: RootState) => state.servers.activeChannel);
  const language = useSelector((state: RootState) => state.ui.language);
  const chats = useSelector((state: RootState) => state.chats.chats);
  const messagesByChat = useSelector((state: RootState) => state.chats.messages);
  
  // Отримуємо дані про канал якщо це сервер
  const currentChannel = channelId && activeServer 
    ? servers.find(s => s.id === activeServer)?.channels.find(ch => ch.id === activeChannel)
    : null;

  const activeServerData = activeServer
    ? servers.find(s => s.id === activeServer)
    : null;
  
  const messages = useSelector((state: RootState) => {
    if (!activeId) return [];
    return state.chats.messages[activeId] || [];
  }, (left, right) => {
    if (left.length !== right.length) return false;
    return left.every((msg, i) => {
      const rightMsg = right[i];
      return msg.id === rightMsg?.id &&
             msg.content === rightMsg?.content &&
             msg.edited === rightMsg?.edited;
    });
  });

  const currentUser = useSelector((state: RootState) => state.user.currentUser);

  // Завантаження закріпленого повідомлення
  useEffect(() => {
    if (!activeId) return;
    try {
      const saved = JSON.parse(localStorage.getItem('disgram_pins') || '{}');
      setPinnedMessageId(saved[activeId] || null);
    } catch (e) {
      setPinnedMessageId(null);
    }
  }, [activeId]);

  useEffect(() => {
    const loadMembers = async () => {
      if (!activeServer || !currentChannel) return;
      try {
        const token = localStorage.getItem('disgram_auth_token');
        if (!token) return;
        const response = await fetch(`http://localhost:4777/servers/${activeServer}/members`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) return;
        const data = await response.json();
        if (data.ok && data.members) {
          setServerMembers(data.members);
        }
      } catch (e) {
        // keep empty
      }
    };

    loadMembers();
  }, [activeServer, currentChannel]);

  // Автоскрол до нових повідомлень
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!activeId) {
      setIdleBadgeIndex(0);
    }
  }, [activeId]);

  // Завантаження масштабу тексту чату
  useEffect(() => {
    const loadScale = () => {
      try {
        const settings = JSON.parse(localStorage.getItem('disgram_settings') || '{}');
        setChatTextScale(Number(settings.chatTextScale) || 1);
      } catch (e) {
        // Використовуємо значення за замовчуванням
      }
    };

    loadScale();
    window.addEventListener('disgram-settings', loadScale);
    return () => {
      window.removeEventListener('disgram-settings', loadScale);
    };
  }, []);

  // Завантаження історії повідомлень з сервера
  useEffect(() => {
    if (!chatId || !currentUser) return;
    
    const loadMessageHistory = async () => {
      try {
        const token = localStorage.getItem('disgram_token');
        if (!token) return;
        
        const response = await fetch(
          `http://localhost:4777/messages/history/${currentUser.id}/${chatId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.ok && data.messages) {
            // Додаємо повідомлення до Redux store
            data.messages.forEach((msg: any) => {
              const message = {
                id: msg.id,
                chatId: msg.senderId === currentUser.id ? msg.recipientId : msg.senderId,
                userId: msg.senderId === currentUser.id ? 'me' : msg.senderId,
                userName: msg.senderId === currentUser.id ? (currentUser.displayName || currentUser.username) : chat?.name || '',
                userAvatar: msg.senderId === currentUser.id ? currentUser.avatar : chat?.avatar,
                content: msg.content,
                timestamp: msg.timestamp,
                edited: msg.edited,
                attachments: msg.attachments,
                reactions: msg.reactions,
                replyTo: msg.replyTo,
              };
              dispatch(addMessage(message));
            });
          }
        }
      } catch (error) {
        console.error('Failed to load message history:', error);
      }
    };
    
    loadMessageHistory();
  }, [chatId, currentUser, dispatch, chat]);

  const compressImage = (file: File, maxWidth: number = 1920, maxHeight: number = 1080, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Обчислюємо нові розміри зі збереженням пропорцій
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Стискаємо зображення перед додаванням
    const processedFiles = await Promise.all(
      files.map(async (file) => {
        if (file.type.startsWith('image/') && !file.type.includes('gif')) {
          return await compressImage(file);
        }
        return file;
      })
    );
    
    setSelectedFiles(processedFiles);
  };

  const handleGifSelect = async (gifUrl: string) => {
    try {
      console.log('Fetching GIF:', gifUrl);
      // Fetch the GIF file with CORS mode
      const response = await fetch(gifUrl, { mode: 'cors' });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch GIF: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('GIF blob size:', blob.size, 'bytes');
      
      // Перевіряємо розмір (максимум 10MB)
      if (blob.size > 10 * 1024 * 1024) {
        alert('GIF занадто великий. Максимальний розмір: 10MB');
        return;
      }
      
      // Create a File object from the blob
      const file = new File([blob], 'tenor.gif', { type: 'image/gif' });
      
      console.log('Created file:', file.name, file.size, file.type);
      
      // Add to selected files like a regular file upload
      setSelectedFiles(prev => [...prev, file]);
      
      // Close the picker
      setGifPickerAnchor(null);
    } catch (error) {
      console.error('Failed to fetch GIF:', error);
      alert('Помилка завантаження GIF. Спробуйте інший.');
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if (!activeId || (!messageText.trim() && selectedFiles.length === 0)) return;

    if (editingMessage) {
      handleSaveEdit();
      return;
    }

    let attachments: string[] = [];
    
    // Конвертуємо файли в base64
    if (selectedFiles.length > 0) {
      attachments = await Promise.all(
        selectedFiles.map(file => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve(JSON.stringify({
                name: file.name,
                type: file.type,
                size: file.size,
                data: reader.result as string,
              }));
            };
            reader.readAsDataURL(file);
          });
        })
      );
    }

    const newMessage = {
      id: `msg-${Date.now()}`,
      chatId: activeId,
      userId: 'me',
      userName: currentUser?.displayName || 'Я',
      userAvatar: currentUser?.avatar,
      content: messageText,
      timestamp: Date.now(),
      replyTo: replyingTo?.id,
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    dispatch(addMessage(newMessage));
    
    // Send message to recipient via WebSocket
    if (chat && chat.type === 'private' && currentUser) {
      // Для отримувача chatId має бути ID відправника (поточного користувача)
      const messageForRecipient = {
        ...newMessage,
        chatId: currentUser.id, // Отримувач побачить повідомлення у чаті з відправником
        userId: currentUser.id,
        userName: currentUser.displayName || currentUser.username,
        userAvatar: currentUser.avatar,
      };
      socketService.sendMessage(chat.id, currentUser.id, messageForRecipient);
    }
    
    setMessageText('');
    setReplyingTo(null);
    setSelectedFiles([]);
    setMentionOpen(false);
    setMentionItems([]);
    setMentionStart(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleMentionSelect = (item: MentionItem) => {
    if (mentionStart === null) return;
    const cursor = inputRef.current?.selectionStart ?? messageText.length;
    const before = messageText.slice(0, mentionStart);
    const after = messageText.slice(cursor);
    const nextValue = `${before}${item.value} ${after}`;
    const nextCursor = before.length + item.value.length + 1;

    setMessageText(nextValue);
    setMentionOpen(false);
    setMentionItems([]);
    setMentionStart(null);

    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(nextCursor, nextCursor);
      }
    });
  };

  const buildMentionItems = (query: string): MentionItem[] => {
    const normalized = query.trim().toLowerCase();
    const items: MentionItem[] = [];

    if (currentChannel && activeServerData) {
      serverMembers.forEach((member) => {
        const label = member.displayName || member.username;
        const matchText = `${label} ${member.username}`.toLowerCase();
        items.push({
          id: member.id,
          type: 'user',
          label,
          value: `@${member.username || label}`,
          subtitle: `@${member.username || label}`,
          avatar: member.avatar,
          status: member.status,
          matchText,
        });
      });

      activeServerData.roles?.forEach((role) => {
        const label = role.name;
        const matchText = label.toLowerCase();
        items.push({
          id: role.id,
          type: 'role',
          label: `@${label}`,
          value: `@${label}`,
          subtitle: language === 'uk' ? 'Роль' : 'Role',
          matchText,
        });
      });

      activeServerData.channels?.forEach((channel) => {
        const label = channel.name;
        const matchText = label.toLowerCase();
        items.push({
          id: channel.id,
          type: 'channel',
          label: `#${label}`,
          value: `#${label}`,
          subtitle: language === 'uk' ? 'Канал' : 'Channel',
          matchText,
        });
      });
    } else if (chat?.type === 'private' && chat.id !== 'saved_messages') {
      const label = chat.name;
      const matchText = label.toLowerCase();
      items.push({
        id: chat.id,
        type: 'user',
        label,
        value: `@${label}`,
        subtitle: `@${label}`,
        avatar: chat.avatar,
        matchText,
      });
    }

    const filtered = normalized
      ? items.filter((item) => item.matchText.includes(normalized))
      : items;

    const startsWith = (item: MentionItem) => item.matchText.startsWith(normalized) ? 0 : 1;
    const typeOrder: Record<MentionItem['type'], number> = { user: 0, role: 1, channel: 2 };

    return filtered
      .sort((a, b) => {
        if (normalized) {
          const startDiff = startsWith(a) - startsWith(b);
          if (startDiff !== 0) return startDiff;
        }
        const typeDiff = typeOrder[a.type] - typeOrder[b.type];
        if (typeDiff !== 0) return typeDiff;
        return a.label.localeCompare(b.label);
      })
      .slice(0, 12);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (mentionOpen && mentionItems.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % mentionItems.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + mentionItems.length) % mentionItems.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleMentionSelect(mentionItems[mentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionOpen(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value;
    setMessageText(nextValue);

    const cursor = e.target.selectionStart ?? nextValue.length;
    const beforeCursor = nextValue.slice(0, cursor);
    const match = beforeCursor.match(/(^|\s)@([\w-]*)$/);

    if (match) {
      const start = (match.index ?? 0) + match[1].length;
      const query = match[2] || '';
      const items = buildMentionItems(query);
      setMentionStart(start);
      setMentionItems(items);
      setMentionIndex(0);
      setMentionOpen(items.length > 0);
      setMentionAnchorEl(inputRef.current);
    } else {
      setMentionOpen(false);
      setMentionItems([]);
      setMentionStart(null);
    }
    
    // Симуляція typing для інших користувачів
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      // Тут можна відправити подію "припинив набір"
    }, 1000);
  };

  const handleContextMenu = (event: React.MouseEvent, messageId: string) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
      messageId,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleDeleteMessage = () => {
    if (contextMenu && activeId) {
      const message = messages.find(m => m.id === contextMenu.messageId);
      const isOwn = message && (message.userId === 'me' || message.userId === currentUser?.id);
      if (isOwn) {
        dispatch(deleteMessage({ messageId: contextMenu.messageId, chatId: activeId }));
        if (chat && chat.type === 'private' && currentUser) {
          socketService.sendMessageDelete(chat.id, currentUser.id, {
            messageId: contextMenu.messageId,
            chatId: currentUser.id,
          });
        }
      }
    }
    setContextMenu(null);
  };

  const handleEditMessage = () => {
    if (contextMenu && activeId) {
      const message = messages.find(m => m.id === contextMenu.messageId);
      const isOwn = message && (message.userId === 'me' || message.userId === currentUser?.id);
      if (message && isOwn) {
        setEditingMessage({ id: message.id, content: message.content });
        setMessageText(message.content);
      }
    }
    setContextMenu(null);
  };

  const handlePinMessage = () => {
    if (contextMenu && activeId) {
      try {
        const saved = JSON.parse(localStorage.getItem('disgram_pins') || '{}');
        const nextId = saved[activeId] === contextMenu.messageId ? null : contextMenu.messageId;
        if (nextId) {
          saved[activeId] = nextId;
        } else {
          delete saved[activeId];
        }
        localStorage.setItem('disgram_pins', JSON.stringify(saved));
        setPinnedMessageId(nextId);
      } catch (e) {
        // noop
      }
    }
    setContextMenu(null);
  };

  const handleSaveEdit = () => {
    if (editingMessage && activeId && messageText.trim()) {
      dispatch(editMessage({ messageId: editingMessage.id, chatId: activeId, newContent: messageText }));
      if (chat && chat.type === 'private' && currentUser) {
        socketService.sendMessageEdit(chat.id, currentUser.id, {
          messageId: editingMessage.id,
          chatId: currentUser.id,
          newContent: messageText,
        });
      }
      setEditingMessage(null);
      setMessageText('');
    }
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setMessageText('');
    setReplyingTo(null);
  };

  const handleCall = (type: 'audio' | 'video') => {
    const callType = type === 'audio' ? t('audio') : t('video');
    alert(`${callType} ${t('callInProgress')} ${chat?.name}...\n${t('featureInDev')}`);
  };

  const handleMoreMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMoreMenuAnchor(event.currentTarget);
  };

  const handleReplyMessage = () => {
    if (contextMenu && activeId) {
      const message = messages.find(m => m.id === contextMenu.messageId);
      if (message) {
        setReplyingTo({ id: message.id, userName: message.userName, content: message.content });
      }
    }
    setContextMenu(null);
  };

  const handleCopyMessageLink = () => {
    if (contextMenu && activeId) {
      const messageLink = `${window.location.origin}?chat=${activeId}&messageId=${contextMenu.messageId}`;
      navigator.clipboard.writeText(messageLink).then(() => {
        alert(t('messageLinkCopied'));
      }).catch(() => {
        alert('Failed to copy message link');
      });
    }
    setContextMenu(null);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handlePinChat = () => {
    if (activeId) {
      dispatch(togglePin(activeId));
    }
    setMoreMenuAnchor(null);
  };

  const handleMuteChat = () => {
    if (activeId) {
      dispatch(toggleMute(activeId));
    }
    setMoreMenuAnchor(null);
  };

  const handleSendMessageFromProfile = (userId: string) => {
    if (selectedUser) {
      // Create or ensure chat exists
      dispatch(addChat({
        id: selectedUser.id,
        name: selectedUser.displayName || selectedUser.username,
        avatar: selectedUser.avatar,
        type: 'private',
        unreadCount: 0,
        status: selectedUser.status || 'offline',
      }));
      
      // Switch to chat
      if (onSelectChat) {
        onSelectChat(selectedUser.id);
      }
    }
  };

  const handleUserClick = async (userId: string, userName: string) => {
    const chatData = chat;

    try {
      const token = localStorage.getItem('disgram_auth_token');
      if (token) {
        const response = await fetch(`http://localhost:4777/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.ok && data.user) {
            setSelectedUser(data.user);
            setUserProfileOpen(true);
            return;
          }
        }
      }
    } catch (e) {
      // fallback below
    }

    // Fallback to chat data
    setSelectedUser({
      id: userId,
      username: chatData?.name || userName,
      displayName: chatData?.name || userName,
      status: chatData?.status || 'offline',
      bio: '',
      avatar: chatData?.avatar,
    });
    setUserProfileOpen(true);
  };

  const handleClearHistory = () => {
    setConfirmClearHistory(true);
    setMoreMenuAnchor(null);
  };

  const confirmClearHistoryAction = () => {
    if (activeId) {
      // Читаємо всі повідомлення з localStorage
      const allMessages = JSON.parse(localStorage.getItem('disgram_messages') || '{}');
      // Очищаємо тільки повідомлення поточного чату
      allMessages[activeId] = [];
      localStorage.setItem('disgram_messages', JSON.stringify(allMessages));
      window.location.reload();
    }
    setConfirmClearHistory(false);
  };

  const handleDeleteChat = () => {
    setConfirmDeleteChat(true);
    setMoreMenuAnchor(null);
  };

  const confirmDeleteChatAction = () => {
    if (activeId) {
      alert(t('deleteChatInDev'));
    }
    setConfirmDeleteChat(false);
  };

  const contextMessage = contextMenu ? messages.find(m => m.id === contextMenu.messageId) : null;
  const canEditMessage = !!contextMessage && (contextMessage.userId === 'me' || contextMessage.userId === currentUser?.id);

  const getTimeDisplay = (timestamp: number) => {
    // Завантажуємо налаштування
    let timeFormat = '24';
    let showSeconds = false;
    try {
      const settings = JSON.parse(localStorage.getItem('disgram_settings') || '{}');
      timeFormat = settings.timeFormat || '24';
      showSeconds = settings.showSeconds || false;
    } catch (e) {
      // Використовуємо значення за замовчуванням
    }

    const timePattern = timeFormat === '12'
      ? (showSeconds ? 'h:mm:ss a' : 'h:mm a')
      : (showSeconds ? 'HH:mm:ss' : 'HH:mm');
    
    // Показуємо точний час
    const now = new Date();
    const messageDate = new Date(timestamp);
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
    
    if (todayDate.getTime() === messageDay.getTime()) {
      // Сьогодні - показуємо тільки час
      return format(timestamp, timePattern);
    } else {
      // Інший день - показуємо дату та час
      const locale = language === 'en' ? enUS : uk;
      return format(timestamp, `dd MMM ${timePattern}`, { locale });
    }
  };

  // Listen for settings changes to re-render time display
  React.useEffect(() => {
    const handleSettingsChange = () => {
      // Force re-render by triggering a state update
      setForceUpdateKey(prev => prev + 1);
    };
    
    window.addEventListener('disgram-settings-changed', handleSettingsChange);
    return () => window.removeEventListener('disgram-settings-changed', handleSettingsChange);
  }, []);

  if (!activeId) {
    const idleVariant = idleBadgeVariants[idleBadgeIndex % idleBadgeVariants.length];
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          gap: 2,
        }}
      >
        <Box
          onClick={() => setIdleBadgeIndex((prev) => (prev + 1) % idleBadgeVariants.length)}
          sx={{
            width: 120,
            height: 120,
            borderRadius: idleVariant.borderRadius,
            bgcolor: idleVariant.bgcolor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 2s infinite',
            transition: 'all 0.3s ease-in-out',
            cursor: 'pointer',
            transform: `rotate(${idleVariant.rotate})`,
            '@keyframes pulse': {
              '0%, 100%': { opacity: 0.3 },
              '50%': { opacity: 1 },
            },
            '&:hover': {
              animation: 'none',
              opacity: 1,
              transform: `scale(1.15) rotate(${idleVariant.rotate})`,
              boxShadow: '0 0 30px rgba(88, 101, 242, 0.6), 0 0 60px rgba(88, 101, 242, 0.3)',
            },
          }}
        >
        </Box>
        <Typography variant="h5" sx={{ color: 'text.secondary' }}>
          {t('selectChat')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('selectChatHint')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      {/* Заголовок чату */}
      <Box
        sx={(theme) => ({
          height: 56,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper,
          boxShadow: '0 1px 0 rgba(4,4,5,0.2),0 1.5px 0 rgba(6,6,7,0.05),0 2px 0 rgba(4,4,5,0.05)',
          position: 'relative',
        })}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {!currentChannel && (
            <Avatar
              src={chat?.id === currentUser?.id ? currentUser?.avatar : chat?.avatar}
              onClick={() => {
                if (chat && chat.type === 'private') {
                  handleUserClick(chat.id, chat.name);
                }
              }}
              sx={(theme) => ({
                width: 36,
                height: 36,
                bgcolor: theme.palette.primary.main,
                color: '#ffffff',
                cursor: chat && chat.type === 'private' ? 'pointer' : 'default',
                '&:hover': {
                  opacity: chat && chat.type === 'private' ? 0.8 : 1,
                },
              })}
            >
              {chat?.name[0].toUpperCase()}
            </Avatar>
          )}
          <Box>
            <Typography 
              variant="h6" 
              onClick={() => {
                if (chat && !currentChannel && chat.type === 'private') {
                  handleUserClick(chat.id, chat.name);
                }
              }}
              sx={{ 
                fontWeight: 600, 
                color: 'text.primary',
                cursor: chat && !currentChannel && chat.type === 'private' ? 'pointer' : 'default',
                '&:hover': {
                  textDecoration: chat && !currentChannel && chat.type === 'private' ? 'underline' : 'none',
                },
              }}
            >
              {currentChannel ? `# ${currentChannel.name}` : chat?.name}
            </Typography>
            {currentChannel ? (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {currentChannel.type === 'text' ? t('textChannel') : t('voiceChannel')}
              </Typography>
            ) : chat?.status && chat.status !== 'offline' ? (
              <Typography variant="caption" sx={{ color: 'success.main' }}>
                {t(chat.status)}
              </Typography>
            ) : (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {chat?.type === 'group' && `${messages.length} ${t('messages')}`}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, position: 'absolute', right: 16 }}>
          <Tooltip title={t('pinnedMessages')}>
            <IconButton onClick={() => setPinnedMessagesDialogOpen(true)} sx={{ color: 'text.secondary' }}>
              <PinIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('searchMessages')}>
            <IconButton onClick={() => setMessageSearchDialogOpen(true)} sx={{ color: 'text.secondary' }}>
              <SearchIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('audioCall')}>
            <IconButton onClick={() => handleCall('audio')} sx={{ color: 'text.secondary' }}>
              <BrutalCallIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('videoCall')}>
            <IconButton onClick={() => handleCall('video')} sx={{ color: 'text.secondary' }}>
              <BrutalVideoIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('more')}>
            <IconButton onClick={handleMoreMenu} sx={{ color: 'text.secondary' }}>
              <BrutalMoreIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Повідомлення */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          position: 'relative',
          bgcolor: 'background.default',
          background: (theme) => 
            theme.palette.mode === 'dark'
              ? `
                radial-gradient(circle at 20% 50%, rgba(88, 101, 242, 0.05) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(42, 171, 238, 0.05) 0%, transparent 50%),
                radial-gradient(circle at 40% 20%, rgba(88, 101, 242, 0.03) 0%, transparent 50%),
                ${theme.palette.background.default}
              `
              : `
                radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.08) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(118, 75, 162, 0.08) 0%, transparent 50%),
                radial-gradient(circle at 40% 20%, rgba(102, 126, 234, 0.05) 0%, transparent 50%),
                ${theme.palette.background.default}
              `,
          '& > *': {
            position: 'relative',
            zIndex: 1,
          },
        }}
      >
        {pinnedMessageId && (() => {
          const pinnedMessage = messages.find(m => m.id === pinnedMessageId);
          return pinnedMessage ? (
            <Box
              sx={{
                mb: 1,
                p: 1,
                borderRadius: 2,
                bgcolor: 'action.hover',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <PinIcon fontSize="small" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {t('pinMessage')}:
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {pinnedMessage.content || t('photo')}
              </Typography>
            </Box>
          ) : null;
        })()}
        {messages.map((message, index) => {
          const isMe = message.userId === 'me' || message.userId === currentUser?.id;
          const showAvatar = index === 0 || messages[index - 1].userId !== message.userId;
          const showName = !isMe && showAvatar && chat?.type !== 'private';
          const hasAttachments = !!(message.attachments && message.attachments.length > 0);
          const hasContent = !!message.content;
          const messageFontSize = `${1 * chatTextScale}rem`;
          const replyFontSize = `${0.75 * chatTextScale}rem`;
          const metaFontSize = `${0.7 * chatTextScale}rem`;

          return (
            <Fade in key={message.id} timeout={300}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: isMe ? 'flex-end' : 'flex-start',
                  gap: 1,
                  alignItems: 'flex-end',
                }}
              >
                {!isMe && (
                  showAvatar ? (
                    <Avatar 
                      src={
                        message.userId === currentUser?.id 
                          ? currentUser?.avatar 
                          : (chat?.type === 'private' ? chat?.avatar : undefined) || message.userAvatar
                      }
                      onClick={() => handleUserClick(message.userId, message.userName)}
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        bgcolor: 'secondary.main',
                        color: '#ffffff',
                        cursor: 'pointer',
                        '&:hover': {
                          opacity: 0.8,
                        },
                      }}
                    >
                      {message.userName?.[0]?.toUpperCase()}
                    </Avatar>
                  ) : (
                    <Box sx={{ width: 32 }} />
                  )
                )}

                <Box
                  sx={{
                    maxWidth: '60%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start',
                  }}
                >
                  {showName && (
                    <Typography 
                      variant="caption" 
                      onClick={() => handleUserClick(message.userId, message.userName)}
                      sx={{ 
                        ml: 2, 
                        fontWeight: 600, 
                        color: 'secondary.main',
                        cursor: 'pointer',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      {message.userName}
                    </Typography>
                  )}
                  
                  {/* Вкладення (images/files) - above bubble */}
                  {hasAttachments && (
                    <Box
                      sx={{
                        mt: 0.5,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.5,
                        alignItems: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '60%',
                      }}
                    >
                      {message.attachments?.map((attachmentStr, idx) => {
                        try {
                          const attachment = typeof attachmentStr === 'string' ? JSON.parse(attachmentStr) : attachmentStr;
                          const isImage = attachment.type.startsWith('image/');
                          
                          if (isImage) {
                            return (
                              <Paper
                                key={idx}
                                sx={{
                                  p: 0.5,
                                  cursor: 'pointer',
                                  border: '1px solid transparent',
                                  maxWidth: 'fit-content',
                                  bgcolor: 'transparent',
                                  boxShadow: 'none',
                                  borderRadius: 2,
                                  overflow: 'hidden',
                                }}
                                onClick={() => attachment.data && setImagePreview(attachment.data)}
                              >
                                <Box
                                  component="img"
                                  src={attachment.data}
                                  alt={attachment.name}
                                  sx={{
                                    maxWidth: 420,
                                    maxHeight: 420,
                                    borderRadius: 2,
                                    cursor: 'pointer',
                                    objectFit: 'contain',
                                    display: 'block',
                                  }}
                                />
                              </Paper>
                            );
                          } else {
                            return (
                              <Paper
                                key={idx}
                                sx={{
                                  p: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  bgcolor: 'action.hover',
                                  cursor: 'pointer',
                                  maxWidth: 300,
                                  '&:hover': {
                                    bgcolor: 'action.selected',
                                  },
                                }}
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = attachment.data;
                                  link.download = attachment.name;
                                  link.click();
                                }}
                              >
                                <BrutalAttachIcon />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {attachment.name}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    {(attachment.size / 1024).toFixed(1)} KB
                                  </Typography>
                                </Box>
                              </Paper>
                            );
                          }
                        } catch (e) {
                          return null;
                        }
                      })}
                    </Box>
                  )}

                  <Paper
                    id={`message-${message.id}`}
                    onContextMenu={(e) => handleContextMenu(e, message.id)}
                    sx={(theme) => ({
                      px: hasContent ? 2 : 0.5,
                      py: hasContent ? 1.5 : 0.5,
                      bgcolor: hasContent ? (isMe ? theme.palette.primary.main : theme.palette.mode === 'dark' ? '#40444b' : '#f3f4f6') : 'transparent',
                      color: isMe ? '#ffffff' : theme.palette.text.primary,
                      borderRadius: 3,
                      position: 'relative',
                      cursor: 'pointer',
                      boxShadow: 'none',
                      border: 'none',
                      transition: 'background-color 0.1s ease',
                      '&:hover': {
                        bgcolor: hasContent ? (isMe ? theme.palette.primary.dark : theme.palette.mode === 'dark' ? '#383a40' : '#e9eaed') : 'transparent',
                        '& .reaction-btn': {
                          opacity: 1,
                        },
                      },
                    })}
                  >
                    {/* Відповідь на повідомлення */}
                    {message.replyTo && (() => {
                      const repliedMessage = messages.find(m => m.id === message.replyTo);
                      return repliedMessage ? (
                        <Box sx={{ mb: 1, pb: 1, borderLeft: '3px solid', borderColor: isMe ? 'rgba(255,255,255,0.3)' : 'primary.main', pl: 1, opacity: 0.8 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', fontSize: replyFontSize }}>
                            {repliedMessage.userName}
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: replyFontSize, opacity: 0.7 }}>
                            {repliedMessage.content.length > 50 ? repliedMessage.content.substring(0, 50) + '...' : repliedMessage.content}
                          </Typography>
                        </Box>
                      ) : null;
                    })()}
                    
                    {hasContent && (
                      <Box
                        sx={(theme) => ({
                          fontSize: messageFontSize,
                          '& .md-line': { marginBottom: '0.1rem' },
                          '& .md-h1': { fontSize: '1.25em', fontWeight: 700, marginBottom: '0.2rem' },
                          '& .md-h2': { fontSize: '1.1em', fontWeight: 700, marginBottom: '0.2rem' },
                          '& .md-h3': { fontSize: '1em', fontWeight: 700, marginBottom: '0.2rem' },
                          '& .md-subtext': { opacity: 0.7, fontSize: '0.85em' },
                          '& a': { color: theme.palette.primary.light, textDecoration: 'underline' },
                          '& pre': {
                            backgroundColor: theme.palette.mode === 'dark' ? '#1f2227' : '#f0f2f5',
                            padding: '8px 10px',
                            borderRadius: 6,
                            overflowX: 'auto',
                            margin: '6px 0',
                          },
                          '& code.inline-code': {
                            backgroundColor: theme.palette.mode === 'dark' ? '#2b2f35' : '#eef0f2',
                            padding: '1px 4px',
                            borderRadius: 4,
                            fontFamily: 'monospace',
                            fontSize: '0.9em',
                          },
                          '& blockquote': {
                            borderLeft: `3px solid ${theme.palette.divider}`,
                            margin: '6px 0',
                            paddingLeft: 8,
                            color: theme.palette.text.secondary,
                          },
                          '& ul': { margin: '6px 0', paddingLeft: 18 },
                          '& li': { marginBottom: 4 },
                          '& .spoiler': {
                            backgroundColor: theme.palette.mode === 'dark' ? '#2b2f35' : '#e6e8eb',
                            color: 'transparent',
                            borderRadius: 4,
                            padding: '0 4px',
                            cursor: 'pointer',
                          },
                          '& .spoiler:hover': {
                            color: 'inherit',
                          },
                        })}
                        dangerouslySetInnerHTML={formatDiscordMarkdown(message.content)}
                      />
                    )}
                    
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 0.5,
                        opacity: 0.7,
                        fontSize: metaFontSize,
                      }}
                    >
                      {getTimeDisplay(message.timestamp)}
                      {message.edited && <span style={{ marginLeft: 8 }}>{t('edited')}</span>}
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            </Fade>
          );
        })}
        <div ref={messagesEndRef} />
      </Box>

      {/* Поле вводу */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        {editingMessage && (
          <Box sx={{ mb: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: 'primary.main' }}>
              {t('editMessage')}
            </Typography>
            <Button size="small" onClick={handleCancelEdit}>
              {t('cancel')}
            </Button>
          </Box>
        )}
        {replyingTo && (
          <Box sx={{ mb: 1, p: 1, bgcolor: 'action.selected', borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '3px solid', borderColor: 'primary.main' }}>
            <Box>
              <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
                {t('replyTo')} {replyingTo.userName}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>
                {replyingTo.content}
              </Typography>
            </Box>
            <Button size="small" onClick={handleCancelReply}>
              {t('cancel')}
            </Button>
          </Box>
        )}
        {currentChannel && currentChannel.type === 'voice' ? (
          <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('voiceChannelNotice')}
            </Typography>
          </Box>
        ) : (
          <>
            {selectedFiles.length > 0 && (
              <Box sx={{ mb: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                  {t('selectedFiles')} ({selectedFiles.length})
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedFiles.map((file, index) => (
                    <Chip
                      key={index}
                      label={`${file.name} (${(file.size / 1024).toFixed(1)} KB)`}
                      onDelete={() => handleRemoveFile(index)}
                      size="small"
                      sx={{ maxWidth: 250 }}
                    />
                  ))}
                </Box>
              </Box>
            )}
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder={editingMessage ? t('editMessagePlaceholder') : t('typeMessagePlaceholder')}
              value={messageText}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              inputRef={inputRef}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Tooltip title={t('attachFile')}>
                      <IconButton size="small" onClick={() => fileInputRef.current?.click()}>
                        <BrutalAttachIcon />
                      </IconButton>
                    </Tooltip>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      hidden
                      onChange={handleFileSelect}
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                    />
                    <Tooltip title="GIF">
                      <IconButton size="small" onClick={(e) => setGifPickerAnchor(e.currentTarget)}>
                        <Box sx={{ fontWeight: 700, fontSize: '0.85rem' }}>GIF</Box>
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('emoji')}>
                      <IconButton size="small" onClick={(e) => setEmojiPickerAnchor(e.currentTarget)}>
                        <BrutalEmojiIcon />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() && selectedFiles.length === 0}
                      color="primary"
                      sx={{
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'scale(1.1) rotate(15deg)',
                        },
                      }}
                    >
                      <BrutalSendIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={(theme) => ({
                '& .MuiOutlinedInput-root': {
                  borderRadius: 8,
                  bgcolor: theme.palette.mode === 'dark' ? '#40444b' : '#e3e5e8',
                },
              })}
            />
            <Popper
              open={mentionOpen && mentionItems.length > 0}
              anchorEl={mentionAnchorEl}
              placement="top-start"
              sx={{ zIndex: 1200 }}
              transition
            >
              {({ TransitionProps }) => (
                <Fade {...TransitionProps} timeout={160}>
                  <Paper
                    sx={{
                      mt: 1,
                      borderRadius: 2,
                      minWidth: 260,
                      maxWidth: 360,
                      maxHeight: 240,
                      overflow: 'auto',
                      transformOrigin: 'left bottom',
                    }}
                  >
                    <List dense disablePadding>
                      {mentionItems.map((item, index) => (
                        <ListItemButton
                          key={`${item.type}-${item.id}`}
                          selected={index === mentionIndex}
                          onMouseEnter={() => setMentionIndex(index)}
                          onClick={() => handleMentionSelect(item)}
                          sx={{ gap: 1, py: 0.75 }}
                        >
                          <ListItemAvatar sx={{ minWidth: 36 }}>
                            <Avatar
                              src={item.avatar}
                              sx={{
                                width: 28,
                                height: 28,
                                bgcolor: item.type === 'channel' ? 'secondary.main' : 'primary.main',
                                fontSize: '0.85rem',
                              }}
                            >
                              {!item.avatar && (item.type === 'channel' ? '#' : '@')}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {item.label}
                                </Typography>
                                {item.type === 'user' && item.status && (
                                  <Box
                                    sx={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: '50%',
                                      bgcolor: STATUS_COLORS[item.status] || STATUS_COLORS.offline,
                                    }}
                                  />
                                )}
                              </Box>
                            }
                            secondary={item.subtitle}
                          />
                        </ListItemButton>
                      ))}
                    </List>
                  </Paper>
                </Fade>
              )}
            </Popper>
          </>
        )}
      </Box>

      {/* Контекстне меню */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
        disableRestoreFocus
        disableAutoFocus
      >
        <MenuItem onClick={handleReplyMessage}>
          <ReplyIcon sx={{ mr: 1 }} fontSize="small" />
          {t('reply')}
        </MenuItem>
        {canEditMessage && (
          <MenuItem onClick={handleEditMessage}>
            <EditIcon sx={{ mr: 1 }} fontSize="small" />
            {t('edit')}
          </MenuItem>
        )}
        <MenuItem onClick={handlePinMessage}>
          <PinIcon sx={{ mr: 1 }} fontSize="small" />
          {t('pinMessage')}
        </MenuItem>
        <MenuItem onClick={handleCopyMessageLink}>
          <IconButton size="small" sx={{ mr: -0.5 }}>📋</IconButton>
          {t('copyMessageLink')}
        </MenuItem>
        {canEditMessage && (
          <MenuItem onClick={handleDeleteMessage} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
            {t('delete')}
          </MenuItem>
        )}
      </Menu>

      {/* Меню "Більше" */}
      <Menu
        open={Boolean(moreMenuAnchor)}
        onClose={() => setMoreMenuAnchor(null)}
        anchorEl={moreMenuAnchor}
        disableRestoreFocus
        disableAutoFocus
      >
        <MenuItem onClick={handlePinChat}>
          <PinIcon sx={{ mr: 1 }} fontSize="small" />
          {chat?.isPinned ? t('unpinChat') : t('pinChat')}
        </MenuItem>
        <MenuItem onClick={handleMuteChat}>
          {chat?.isMuted ? '🔔' : '🔕'} {chat?.isMuted ? t('unmuteChat') : t('muteChat')}
        </MenuItem>
        <MenuItem
          onClick={handleClearHistory}
          sx={{
            '& .MuiTouchRipple-child': {
              backgroundColor: 'error.main',
            },
          }}
        >
          {t('clearHistory')}
        </MenuItem>
        <MenuItem onClick={handleDeleteChat} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          {t('deleteChat')}
        </MenuItem>
      </Menu>

      {/* Picker для емоджі в інпуті */}
      <EmojiPicker
        onEmojiSelect={(emoji) => {
          setMessageText(prev => prev + emoji);
        }}
        anchorEl={emojiPickerAnchor}
        onClose={() => setEmojiPickerAnchor(null)}
      />

      {/* GIF Picker */}
      <GifPicker
        open={gifPickerAnchor !== null}
        onClose={() => setGifPickerAnchor(null)}
        anchorEl={gifPickerAnchor}
        onGifSelect={handleGifSelect}
      />

      {/* Діалог профілю користувача */}
      <UserProfileDialog
        open={userProfileOpen}
        onClose={() => {
          setUserProfileOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onMessage={handleSendMessageFromProfile}
      />

      {/* Перегляд зображення */}
      <Dialog
        open={!!imagePreview}
        onClose={() => setImagePreview(null)}
        maxWidth="md"
      >
        <DialogContent sx={{ p: 1, bgcolor: 'background.paper' }}>
          {imagePreview && (
            <Box
              component="img"
              src={imagePreview}
              alt={t('photo')}
              sx={{ maxWidth: '90vw', maxHeight: '90vh', display: 'block' }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Діалог підтвердження очищення історії */}
      <ConfirmDialog
        open={confirmClearHistory}
        title={t('clearHistory')}
        message={t('clearHistoryConfirm')}
        confirmText={t('clear')}
        cancelText={t('cancel')}
        onConfirm={confirmClearHistoryAction}
        onCancel={() => setConfirmClearHistory(false)}
        confirmColor="error"
      />

      {/* Діалог підтвердження видалення чату */}
      <ConfirmDialog
        open={confirmDeleteChat}
        title={t('deleteChat')}
        message={t('deleteChatConfirm')}
        confirmText={t('delete')}
        cancelText={t('cancel')}
        onConfirm={confirmDeleteChatAction}
        onCancel={() => setConfirmDeleteChat(false)}
        confirmColor="error"
      />

      {/* Діалог пінованих повідомлень */}
      <PinnedMessagesDialog
        open={pinnedMessagesDialogOpen}
        onClose={() => setPinnedMessagesDialogOpen(false)}
        chatId={activeId}
        onSelectMessage={(messageId) => {
          const messageElement = document.getElementById(`message-${messageId}`);
          messageElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setPinnedMessagesDialogOpen(false);
        }}
      />

      {/* Діалог пошуку повідомлень */}
      <MessageSearchDialog
        open={messageSearchDialogOpen}
        onClose={() => setMessageSearchDialogOpen(false)}
        chatId={activeId}
        onSelectMessage={(messageId) => {
          const messageElement = document.getElementById(`message-${messageId}`);
          messageElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setMessageSearchDialogOpen(false);
        }}
      />
    </Box>
  );
};

export default ChatWindow;
