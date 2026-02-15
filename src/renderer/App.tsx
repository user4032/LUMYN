import React, { useState, useEffect, useMemo } from 'react';
import { Box, ThemeProvider } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import Sidebar from './components/Sidebar/Sidebar';
import ChatList from './components/ChatList/ChatList';
import ChatWindow from './components/ChatWindow/ChatWindow';
import ServerList from './components/ServerList/ServerList';
import MembersList from './components/MembersList/MembersList';
import ThreadsView from './components/Threads/ThreadsView';
import UserProfilePanel from './components/UserProfilePanel/UserProfilePanel';
import SplashScreen from './components/SplashScreen/SplashScreen';
import AuthScreen from './components/Auth/AuthScreen';
import WelcomeAnimation from './components/WelcomeAnimation/WelcomeAnimation';
import { NotificationsPanel } from './components/NotificationsPanel/NotificationsPanel';
import { setUser } from './store/slices/userSlice';
import { setTheme, setLanguage } from './store/slices/uiSlice';
import { addMessage, addChat, editMessage, deleteMessage, loadFromStorage, updateUserProfile, updateUserStatus } from './store/slices/chatsSlice';
import { addNotification } from './store/slices/notificationsSlice';
import { RootState } from './store/store';
import { getTheme } from './theme';
import { fetchMe } from './api/auth';
import { getMyServers } from './api/social';
import { getChats, saveChats } from './api/chats';
import { setServers } from './store/slices/serversSlice';
import { socketService } from './services/socket';

const App: React.FC = () => {
  const dispatch = useDispatch();
  const [currentView, setCurrentView] = useState<'chats' | 'servers' | 'threads'>('chats');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false);
  
  // Отримуємо активний канал та тему зі стору
  const activeChannel = useSelector((state: RootState) => state.servers.activeChannel);
  const activeServer = useSelector((state: RootState) => state.servers.activeServer);
  const themeMode = useSelector((state: RootState) => state.ui.theme);
  const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  const chats = useSelector((state: RootState) => state.chats.chats);
  const selectedChatData = chats.find((chat) => chat.id === selectedChat) || null;
  
  // Створюємо тему на основі режиму
  const theme = useMemo(() => getTheme(themeMode), [themeMode]);

  // Завантаження користувача та налаштувань з localStorage при старті
  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      try {
        const token = localStorage.getItem('disgram_auth_token');
        if (token) {
          const response = await fetchMe(token);
          if (response.user && mounted) {
            dispatch(
              setUser({
                id: response.user.id,
                email: response.user.email,
                username: response.user.username,
                displayName: response.user.displayName,
                status: response.user.status || 'online',
                customStatus: response.user.customStatus,
                bio: response.user.bio,
                avatar: response.user.avatar,
                profileBanner: response.user.profileBanner,
                profileFrame: response.user.profileFrame,
                token: token,
              })
            );

            try {
              const serverResponse = await getMyServers(token);
              if (serverResponse.servers && mounted) {
                dispatch(setServers(serverResponse.servers));
              }
            } catch (err) {
              console.error('Failed to load servers:', err);
            }
            
            // Завантажуємо чати з сервера
            try {
              console.log('[Boot] Fetching chats from server...');
              const serverChats = await getChats(token);
              console.log('[Boot] Server chats received:', serverChats);
              if (mounted) {
                // Додаємо кожен чат до Redux
                serverChats.forEach(chat => {
                  console.log('[Boot] Adding chat from server:', chat);
                  dispatch(addChat(chat as any));
                });
                
                // Якщо на сервері немає чатів, завантажуємо з localStorage (для міграції)
                if (serverChats.length === 0) {
                  console.log('[Boot] Server has no chats, loading from localStorage for migration...');
                  dispatch(loadFromStorage());
                }
                
              }
            } catch (err) {
              console.error('[Boot] Failed to load chats from server:', err);
              // Fallback до localStorage
              console.log('[Boot] Fallback to localStorage');
              dispatch(loadFromStorage());
            }
          }
        }

        // Завантажуємо налаштування UI
        const savedSettings = localStorage.getItem('disgram_settings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          if (settings.theme) {
            dispatch(setTheme(settings.theme));
          }

          if (settings.language) {
            dispatch(setLanguage(settings.language));
          } else {
            // Автовизначення мови системи
            const systemLanguage = navigator.language.toLowerCase();
            const appLanguage = systemLanguage.startsWith('uk') ? 'uk' : 'en';
            dispatch(setLanguage(appLanguage));
          }

          // Застосовуємо налаштування анімацій
          if (settings.animations !== undefined) {
            document.body.style.setProperty('--animations-enabled', settings.animations ? '1' : '0');
            if (!settings.animations) {
              document.body.style.setProperty('transition', 'none');
            }
          }
        } else {
          // Якщо налаштувань немає зовсім - автовизначення мови
          const systemLanguage = navigator.language.toLowerCase();
          const appLanguage = systemLanguage.startsWith('uk') ? 'uk' : 'en';
          dispatch(setLanguage(appLanguage));
        }
      } catch (e) {
        console.error('Failed to load settings from storage:', e);
      }
    };

    boot();
    return () => {
      mounted = false;
    };
  }, [dispatch]);

  // Socket.IO integration for real-time messaging and status updates
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      // Connect to WebSocket server
      socketService.connect(currentUser.id);

      // Listen for incoming messages
      socketService.onMessageReceive(async ({ chatId, message }) => {
        // Перевіряємо чи існує чат з цим користувачем
        const existingChat = chats.find(c => c.id === chatId);
        
        if (!existingChat) {
          // Якщо чату немає - створюємо його
          try {
            const token = localStorage.getItem('disgram_auth_token');
            if (token) {
              // Отримуємо дані користувача який надіслав повідомлення
              const response = await fetch(`http://localhost:4777/users/search?query=${message.userName}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              
              if (response.ok) {
                const data = await response.json();
                const sender = data.users?.find((u: any) => u.id === chatId);
                
                if (sender) {
                  // Створюємо новий чат
                  dispatch(addChat({
                    id: sender.id,
                    name: sender.displayName || sender.username,
                    avatar: sender.avatar,
                    type: 'private',
                    unreadCount: 0,
                    status: sender.status || 'offline',
                  }));
                }
              }
            }
          } catch (error) {
            console.error('Failed to create chat for new message:', error);
          }
        }
        
        // Додаємо повідомлення
        dispatch(addMessage(message));

        // Показуємо desktop notification якщо увімкнено
        const settings = JSON.parse(localStorage.getItem('disgram_settings') || '{}');
        if (settings.desktopNotifications !== false && message.userId !== currentUser.id) {
          const chatName = existingChat?.name || message.userName || 'Unknown';
          const messageContent = message.content.length > 100 
            ? message.content.substring(0, 100) + '...' 
            : message.content;
          
          // Перевіряємо чи підтримується Notification API
          if ('Notification' in window) {
            // Запитуємо дозвіл якщо ще не надано
            if (Notification.permission === 'granted') {
              const notification = new Notification(chatName, {
                body: messageContent,
                icon: existingChat?.avatar || '/icon.png',
                tag: `message-${message.id}`,
              });

              // Клік на notification відкриває чат
              notification.onclick = () => {
                window.focus();
                notification.close();
              };
            } else if (Notification.permission !== 'denied') {
              Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                  const notification = new Notification(chatName, {
                    body: messageContent,
                    icon: existingChat?.avatar || '/icon.png',
                    tag: `message-${message.id}`,
                  });

                  notification.onclick = () => {
                    window.focus();
                    notification.close();
                  };
                }
              });
            }
          }
        }
      });

      socketService.onMessageEdit(({ chatId, messageId, newContent }) => {
        dispatch(editMessage({ chatId, messageId, newContent }));
      });

      // Message reactions functionality not yet implemented
      // socketService.onMessageReaction(({ chatId, messageId, emoji, userId, action }) => {
      //   if (action === 'add') {
      //     dispatch(addReaction({ chatId, messageId, emoji, userId }));
      //   } else if (action === 'remove') {
      //     dispatch(removeReaction({ chatId, messageId, emoji, userId }));
      //   }
      // });

      socketService.onMessageDelete(({ chatId, messageId }) => {
        dispatch(deleteMessage({ chatId, messageId }));
      });

      // Listen for user status updates
      socketService.onUserStatus(({ userId, status }) => {
        dispatch(updateUserStatus({ userId, status }));
        console.log(`User ${userId} status changed to ${status}`);
      });

      // Listen for user profile updates (avatar, displayName, etc.)
      socketService.onUserProfileUpdate(({ userId, username, displayName, avatar }) => {
        dispatch(updateUserProfile({ userId, username, displayName, avatar }));
        console.log(`User ${userId} profile updated:`, { username, displayName, avatar: avatar ? 'changed' : 'unchanged' });
      });

      // Listen for new notifications
      socketService.onNotification((notification: any) => {
        dispatch(addNotification({
          id: notification.id,
          type: notification.type,
          title: notification.title,
          content: notification.content,
          data: notification.data,
          read: false,
          createdAt: notification.createdAt,
        }));
      });

      // Cleanup on logout or disconnect
      return () => {
        socketService.disconnect();
      };
    }
  }, [isAuthenticated, currentUser, dispatch, chats]);

  // Зберігаємо чати на сервер при змінах
  useEffect(() => {
    if (isAuthenticated && currentUser && chats.length > 0) {
      const token = localStorage.getItem('disgram_auth_token');
      if (token) {
        const saveChatsToServer = async () => {
          try {
            await saveChats(token, chats as any);
          } catch (err) {
            console.error('Failed to save chats to server:', err);
          }
        };

        // Затримуємо на 1 сек щоб не зберігати за кожну зміну
        const timer = setTimeout(saveChatsToServer, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated, currentUser, chats]);

  // При зміні view скидаємо вибір
  const handleViewChange = (view: 'chats' | 'servers' | 'threads') => {
    setCurrentView(view);
    if (view === 'chats') {
      setSelectedChat(null);
      setSelectedServer(null);
      // Не скидаємо activeServer/activeChannel щоб зберегти стан при поверненні
    } else {
      setSelectedChat(null);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      {showWelcome ? (
        <WelcomeAnimation isNewUser={isNewUser} onFinish={() => setShowWelcome(false)} />
      ) : showSplash ? (
        <SplashScreen
          onFinish={() => {
            setShowSplash(false);
            if (isAuthenticated) {
              setShowWelcome(true);
            }
          }}
        />
      ) : !isAuthenticated ? (
        <AuthScreen
          onAuthSuccess={async (user, token, isRegistering) => {
            localStorage.setItem('disgram_auth_token', token);
            setIsNewUser(isRegistering || false);
            dispatch(
              setUser({
                id: user.id,
                email: user.email,
                username: user.username,
                displayName: user.displayName,
                avatar: user.avatar,
                status: 'online',
                profileBanner: user.profileBanner,
                profileFrame: user.profileFrame,
                token: token,
              })
            );
            try {
              const serverResponse = await getMyServers(token);
              if (serverResponse.servers) {
                dispatch(setServers(serverResponse.servers));
              }
            } catch (err) {
              console.error('Failed to load servers:', err);
            }
            
            // Завантажуємо чати та повідомлення з localStorage
            dispatch(loadFromStorage());
            setShowWelcome(false);
            setShowSplash(true);
          }}
        />
      ) : (
        <Box
          sx={{
            display: 'flex',
            height: '100vh',
            overflow: 'hidden',
            background: (theme) => 
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #16213e 75%, #1a1a2e 100%)'
                : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 25%, #667eea 50%, #c3cfe2 75%, #f5f7fa 100%)',
            transition: 'background 0.5s ease-in-out',
          }}
        >
          {/* Бокова панель з іконками */}
          <Sidebar currentView={currentView} onViewChange={handleViewChange} />

          {/* Список серверів або чатів */}
          {currentView === 'servers' && (
            <ServerList 
              onSelectServer={setSelectedServer}
              selectedServer={selectedServer}
            />
          )}
          {currentView === 'chats' && (
            <ChatList
              selectedChat={selectedChat}
              onSelectChat={setSelectedChat}
            />
          )}

          {/* Вікно чату або каналу */}
          {(currentView === 'chats' || currentView === 'servers') && (
            <ChatWindow 
              chatId={currentView === 'chats' ? selectedChat : null}
              channelId={currentView === 'servers' ? activeChannel : null}
              onSelectChat={(chatId) => {
                setCurrentView('chats');
                setSelectedChat(chatId);
              }}
            />
          )}

          {/* Threads view */}
          {currentView === 'threads' && (
            <ThreadsView />
          )}

          {/* Список учасників сервера */}
          {currentView === 'servers' && activeServer && (
            <MembersList 
              serverId={activeServer} 
              onSelectChat={(chatId) => {
                setCurrentView('chats');
                setSelectedChat(chatId);
              }}
            />
          )}

          {/* Профіль для приватних чатів */}
          {currentView === 'chats' && selectedChatData?.type === 'private' && selectedChatData.id !== 'saved_messages' && (
            <UserProfilePanel chat={selectedChatData} />
          )}
        </Box>
      )}

      {/* Notifications Panel */}
      <NotificationsPanel 
        open={notificationsPanelOpen} 
        onClose={() => setNotificationsPanelOpen(false)} 
      />
    </ThemeProvider>
  );
};

export default App;
