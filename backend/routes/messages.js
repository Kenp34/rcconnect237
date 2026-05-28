const router = require('express').Router();
const { protect } = require('../middleware/auth');
const Message = require('../models/Message');
const { getRoomId } = require('../helpers/room');

// GET /api/messages - Liste des conversations
router.get('/', protect, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { recipient: req.user._id }],
      deleted: { $ne: true }
    })
      .populate('sender', 'name avatar department')
      .populate('recipient', 'name avatar department')
      .sort({ createdAt: -1 });

    // Grouper par room et garder le dernier message
    const conversations = {};
    messages.forEach(msg => {
      const otherId = msg.sender._id.toString() === req.user._id.toString()
        ? msg.recipient._id.toString()
        : msg.sender._id.toString();

      if (!conversations[otherId] || msg.createdAt > conversations[otherId].createdAt) {
        conversations[otherId] = {
          _id: msg._id,
          content: msg.deleted ? '[Message supprimé]' : msg.content,
          createdAt: msg.createdAt,
          sender: msg.sender,
          recipient: msg.recipient,
          unread: !msg.read && msg.recipient._id.toString() === req.user._id.toString()
        };
      }
    });

    res.json(Object.values(conversations));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/messages/:userId - Historique des messages avec un utilisateur
router.get('/:userId', protect, async (req, res) => {
  try {
    const roomId = getRoomId(req.user._id, req.params.userId);

    const messages = await Message.find({ room: roomId, deleted: { $ne: true } })
      .populate('sender', 'name avatar department')
      .sort({ createdAt: 1 })
      .limit(50);

    // Marquer les messages non lus comme lus
    await Message.updateMany(
      { room: roomId, recipient: req.user._id, read: false },
      { read: true }
    );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// POST /api/messages - Envoyer un message
router.post('/', protect, async (req, res) => {
  try {
    const { recipientId, content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Message vide' });
    }

    const roomId = getRoomId(req.user._id, recipientId);

    const message = await Message.create({
      sender: req.user._id,
      recipient: recipientId,
      content: content.trim(),
      room: roomId
    });

    await message.populate('sender', 'name avatar');
    await message.populate('recipient', 'name avatar');


    // Émettre via Socket.io
    const io = req.app.get('io');
    io.to(`user_${recipientId}`).emit('newNotification', {
      _id: notification._id,
      type: 'message',
      sender: { _id: req.user._id, name: req.user.name, avatar: req.user.avatar },
      message: content.trim().substring(0, 100),
      createdAt: notification.createdAt,
      read: false
    });

    // Ajouter dans le POST /api/messages après création du message
    const Notification = require('../models/Notification');

    // Créer une notification pour le destinataire
    const notification = await Notification.create({
      recipient: recipientId,
      sender: req.user._id,
      type: 'message',
      message: content.trim().substring(0, 100),
      metadata: { messageId: message._id, roomId }
    });

    

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/messages/:id - MODIFIER un message
router.put('/:id', protect, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Le message ne peut pas être vide' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ message: 'Message trop long (max 1000 caractères)' });
    }

    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }

    // Vérifier que l'utilisateur est l'auteur
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Vous ne pouvez modifier que vos propres messages' });
    }

    // Sauvegarder l'ancien contenu
    message.edited = true;
    message.editedAt = new Date();
    message.oldContent = message.content;
    message.content = content.trim();

    await message.save();
    await message.populate('sender', 'name avatar department');

    // Émettre l'événement via Socket.io
    const io = req.app.get('io');
    io.to(message.room).emit('messageEdited', {
      messageId: message._id,
      content: message.content,
      edited: true,
      editedAt: message.editedAt
    });

    res.json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



// DELETE /api/messages/:id - SUPPRIMER un message (soft delete)
router.delete('/:id', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }

    // Vérifier que l'utilisateur est l'auteur
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Vous ne pouvez supprimer que vos propres messages' });
    }

    // Soft delete
    message.deleted = true;
    message.deletedAt = new Date();
    message.content = '[Message supprimé]';

    await message.save();

    // Émettre l'événement via Socket.io
    const io = req.app.get('io');
    io.to(message.room).emit('messageDeleted', {
      messageId: message._id,
      deleted: true
    });

    res.json({ message: 'Message supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;