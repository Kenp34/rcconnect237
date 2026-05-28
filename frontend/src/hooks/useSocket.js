import { useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { getRoomId } from '../helpers/rooms';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';

export function useSocket() {
  const { token, user } = useAuth();
  const socketRef = useRef(null);
  const currentRoomRef = useRef(null);
  const currentGroupRoomRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Stocker les callbacks
  const callbacksRef = useRef({
    // Messages privés
    onNewMessage: null,
    onMessageEdited: null,
    onMessageDeleted: null,
    onTyping: null,
    onNotification: null,
    // Messages groupe
    onNewGroupMessage: null,
    onTypingGroup: null
  });

  // Fonction pour enregistrer les callbacks
  const registerCallbacks = useCallback((callbacks) => {
    console.log('📝 Registration des callbacks:', Object.keys(callbacks));
    callbacksRef.current = { ...callbacksRef.current, ...callbacks };
  }, []);

  // Initialisation du socket
  useEffect(() => {
    if (!token || !user) {
      console.log('❌ Pas de token ou user');
      return;
    }

    console.log('🟢 Initialisation du socket...');

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current = socket;

    // Événements de connexion
    socket.on('connect', () => {
      console.log('✅ Socket connecté - ID:', socket.id);
      setIsConnected(true);
      socket.emit('joinPersonalRoom', user._id);
    });

    socket.on('disconnect', () => {
      console.log('🔴 Socket déconnecté');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket error:', error.message);
    });

    // ========== MESSAGES PRIVÉS ==========
    socket.on('newMessage', (message) => {
      console.log('📩 [SOCKET] newMessage reçu:', message);
      if (callbacksRef.current.onNewMessage) {
        callbacksRef.current.onNewMessage(message);
      }
    });

    socket.on('messageEdited', (data) => {
      console.log('✏️ [SOCKET] messageEdited reçu');
      if (callbacksRef.current.onMessageEdited) {
        callbacksRef.current.onMessageEdited(data);
      }
    });

    socket.on('messageDeleted', (data) => {
      console.log('🗑️ [SOCKET] messageDeleted reçu');
      if (callbacksRef.current.onMessageDeleted) {
        callbacksRef.current.onMessageDeleted(data);
      }
    });

    socket.on('userTyping', ({ userId, userName, isTyping }) => {
      if (callbacksRef.current.onTyping) {
        callbacksRef.current.onTyping(userId, userName, isTyping);
      }
    });

    socket.on('newNotification', (notification) => {
      console.log('🔔 Notification reçue:', notification);
      if (callbacksRef.current.onNotification) {
        callbacksRef.current.onNotification(notification);
      }
    });

    // ========== MESSAGES GROUPES ==========
    socket.on('newGroupMessage', (message) => {
      console.log('📩 [SOCKET] newGroupMessage reçu:', message);
      if (callbacksRef.current.onNewGroupMessage) {
        callbacksRef.current.onNewGroupMessage(message);
      }
    });

    socket.on('userTypingGroup', ({ userId, userName, isTyping }) => {
      console.log('⌨️ [SOCKET] userTypingGroup:', userName, isTyping);
      if (callbacksRef.current.onTypingGroup) {
        callbacksRef.current.onTypingGroup(userId, userName, isTyping);
      }
    });

    return () => {
      console.log('🔴 Nettoyage du socket');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
    };
  }, [token, user]);

  // ========== FONCTIONS MESSAGES PRIVÉS ==========

  // Rejoindre une room privée
  const joinRoom = useCallback((otherUserId) => {
    if (!socketRef.current || !user?._id) {
      console.warn('⚠️ Socket non disponible');
      return null;
    }
    const roomId = getRoomId(user._id, otherUserId);
    if (currentRoomRef.current) {
      socketRef.current.emit('leaveRoom', currentRoomRef.current);
    }
    socketRef.current.emit('joinRoom', roomId);
    currentRoomRef.current = roomId;
    console.log(`📌 Room privée rejointe: ${roomId}`);
    return roomId;
  }, [user]);

  // Quitter la room privée
  const leaveRoom = useCallback(() => {
    if (!socketRef.current || !currentRoomRef.current) return;
    socketRef.current.emit('leaveRoom', currentRoomRef.current);
    currentRoomRef.current = null;
    console.log(`📌 Room privée quittée`);
  }, []);

  // Envoyer un message privé
  const sendMessage = useCallback((recipientId, content) => {
    if (!socketRef.current) {
      console.warn('⚠️ Socket non disponible');
      return;
    }
    console.log(`📤 Envoi message privé à: ${recipientId}`);
    socketRef.current.emit('sendMessage', { recipientId, content });
  }, []);

  // Indicateur de frappe (privé)
  const sendTyping = useCallback((recipientId, isTyping) => {
    if (!socketRef.current || !user?._id) return;
    const roomId = getRoomId(user._id, recipientId);
    socketRef.current.emit('typing', { roomId, isTyping, userId: user._id, userName: user.name });
  }, [user]);

  // ========== FONCTIONS GROUPES ==========

  // Rejoindre une room de groupe
  const joinGroupRoom = useCallback((groupId) => {
    if (!socketRef.current) {
      console.warn('⚠️ Socket non disponible');
      return;
    }
    if (currentGroupRoomRef.current) {
      socketRef.current.emit('leaveGroupRoom', currentGroupRoomRef.current);
    }
    socketRef.current.emit('joinGroupRoom', groupId);
    currentGroupRoomRef.current = groupId;
    console.log(`👥 Room groupe rejointe: group_${groupId}`);
  }, []);

  // Quitter une room de groupe
  const leaveGroupRoom = useCallback((groupId) => {
    if (!socketRef.current) return;
    if (currentGroupRoomRef.current) {
      socketRef.current.emit('leaveGroupRoom', currentGroupRoomRef.current);
      currentGroupRoomRef.current = null;
    }
    console.log(`👥 Room groupe quittée: group_${groupId}`);
  }, []);

  // Envoyer un message de groupe
  const sendGroupMessage = useCallback((groupId, content) => {
    if (!socketRef.current) {
      console.warn('⚠️ Socket non disponible');
      return;
    }
    console.log(`📤 Envoi message groupe ${groupId}: ${content}`);
    socketRef.current.emit('sendGroupMessage', { groupId, content });
  }, []);

  // Indicateur de frappe pour groupe
  const sendTypingGroup = useCallback((groupId, isTyping) => {
    if (!socketRef.current) return;
    socketRef.current.emit('typingGroup', { groupId, isTyping });
  }, []);

  // ========== FONCTIONS UTILITAIRES ==========

  // Room personnelle pour notifications
  const joinPersonalRoom = useCallback(() => {
    if (!socketRef.current || !user?._id) return;
    socketRef.current.emit('joinPersonalRoom', user._id);
    console.log(`🏠 Room personnelle rejointe: user_${user._id}`);
  }, [user]);

  // Modifier un message
  const editMessage = useCallback((messageId, content) => {
    if (!socketRef.current) return;
    socketRef.current.emit('editMessage', { messageId, content });
  }, []);

  // Supprimer un message
  const deleteMessage = useCallback((messageId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('deleteMessage', { messageId });
  }, []);

  return {
    // État
    isConnected,
    
    // Configuration
    registerCallbacks,
    
    // Messages privés
    joinRoom,
    leaveRoom,
    sendMessage,
    sendTyping,
    
    // Messages groupe
    joinGroupRoom,
    leaveGroupRoom,
    sendGroupMessage,
    sendTypingGroup,
    
    // Utilitaires
    joinPersonalRoom,
    editMessage,
    deleteMessage
  };
}