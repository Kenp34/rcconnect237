import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import ConversationList from '../Components/message/ConversationList';
import ChatArea from '../Components/message/ChatArea';
import styles from './message.module.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [following, setFollowing] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typingUser, setTypingUser] = useState(null);

  const { joinRoom, sendMessage, sendTyping, registerCallbacks } = useSocket();
  

  // Mettre à jour la liste des conversations
  const updateConversationLastMessage = useCallback((message) => {
    setConversations(prev => {
      const otherId = message.sender._id === user._id
        ? message.recipient._id
        : message.sender._id;

      const exists = prev.some(conv => {
        const convOtherId = conv.sender?._id === user._id
          ? conv.recipient?._id
          : conv.sender?._id;
        return convOtherId === otherId;
      });

      if (!exists) {
        return [{
          _id: message._id,
          content: message.content,
          createdAt: message.createdAt,
          sender: message.sender,
          recipient: message.recipient,
          unread: message.sender._id !== user._id
        }, ...prev];
      }

      return prev.map(conv => {
        const convOtherId = conv.sender?._id === user._id
          ? conv.recipient?._id
          : conv.sender?._id;
        if (convOtherId === otherId) {
          return { ...conv, content: message.content, createdAt: message.createdAt };
        }
        return conv;
      }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });
  }, [user]);

  // Enregistrer les callbacks Socket
  useEffect(() => {
    registerCallbacks({
      // 🔥 Quand on reçoit un message de l'AUTRE personne
      onNewMessage: (newMessage) => {
        console.log('📩 Message reçu de:', newMessage.sender?.name);
        updateConversationLastMessage(newMessage);
        setMessages(prev => {
          const exists = prev.some(m => m._id === newMessage._id);
          if (exists) return prev;
          return [...prev, newMessage];
        });
      },
      
      onMessageEdited: ({ messageId, content, editedAt }) => {
        setMessages(prev => prev.map(msg =>
          msg._id === messageId ? { ...msg, content, edited: true, editedAt } : msg
        ));
      },
      
      onMessageDeleted: ({ messageId }) => {
        setMessages(prev => prev.map(msg =>
          msg._id === messageId ? { ...msg, deleted: true, content: '[Message supprimé]' } : msg
        ));
      },
      
      onTyping: (userId, userName, isTyping) => {
        setTypingUser(isTyping ? { id: userId, name: userName } : null);
        if (isTyping) setTimeout(() => setTypingUser(null), 2000);
      }
    });
  }, [registerCallbacks, updateConversationLastMessage]);

  // Charger les conversations
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: convs }, { data: me }] = await Promise.all([
          axios.get(`${API}/messages`),
          axios.get(`${API}/users/me`)
        ]);
        setConversations(convs);
        setFollowing(me.following || []);
      } catch (error) {
        console.error('Erreur:', error);
      }
    };
    fetchData();
  }, []);

  // Charger les messages d'une conversation
  const loadMessages = useCallback(async (otherUser) => {
    setLoading(true);
    setActiveConversation(otherUser);
    joinRoom(otherUser._id);
    
    try {
      const { data } = await axios.get(`${API}/messages/${otherUser._id}`);
      setMessages(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, [joinRoom]);

  // 🚀 ENVOYER UN MESSAGE
  const handleSendMessage = useCallback((content) => {
    if (!content.trim() || !activeConversation) return;

    const tempId = Date.now();
    const tempMessage = {
      _id: tempId,
      content: content.trim(),
      sender: { _id: user._id, name: user.name, avatar: user.avatar },
      recipient: activeConversation,
      createdAt: new Date().toISOString(),
      read: false
    };
    
    // 🔥 1. AFFICHAGE IMMÉDIAT (optimistic update)
    setMessages(prev => [...prev, tempMessage]);
    updateConversationLastMessage(tempMessage);

    // 2. Envoi API (sauvegarde)
    axios.post(`${API}/messages`, {
      recipientId: activeConversation._id,
      content: content.trim()
    })
    .then(({ data }) => {
      // Remplacer le message temporaire par le vrai
      setMessages(prev => prev.map(msg => msg._id === tempId ? data : msg));
      updateConversationLastMessage(data);
    })
    .catch((err) => {
      console.error('Erreur:', err);
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
    });
    
    // 3. Envoi Socket (pour l'autre personne)
    sendMessage(activeConversation._id, content.trim());
  }, [activeConversation, user, sendMessage, updateConversationLastMessage]);

  const handleDeleteMessage = useCallback(async (messageId) => {
    try {
      await axios.delete(`${API}/messages/${messageId}`);
      setMessages(prev => prev.map(msg =>
        msg._id === messageId ? { ...msg, deleted: true, content: '[Message supprimé]' } : msg
      ));
    } catch (error) {
      console.error('Erreur:', error);
    }
  }, []);

  const handleEditMessage = useCallback(async (messageId, newContent) => {
    try {
      const { data } = await axios.put(`${API}/messages/${messageId}`, { content: newContent });
      setMessages(prev => prev.map(msg =>
        msg._id === messageId ? { ...msg, content: data.content, edited: true } : msg
      ));
    } catch (error) {
      console.error('Erreur:', error);
    }
  }, []);

  const handleTyping = useCallback((isTyping) => {
    if (activeConversation) {
      sendTyping(activeConversation._id, isTyping);
    }
  }, [activeConversation, sendTyping]);

  return (
    <div className={styles.messagesContainer}>
      <div className={styles.messagesWrapper}>
        <ConversationList
          conversations={conversations}
          following={following}
          activeConversation={activeConversation}
          onSelectConversation={loadMessages}
          currentUser={user}
        />
        <ChatArea
          messages={messages}
          activeConversation={activeConversation}
          currentUser={user}
          loading={loading}
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          typingUser={typingUser}
          onDeleteMessage={handleDeleteMessage}
          onEditMessage={handleEditMessage}
        />
      </div>
    </div>
  );
}
