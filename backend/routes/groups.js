const router       = require('express').Router();
const mongoose     = require('mongoose');
const { protect }  = require('../middleware/auth');
const Group        = require('../models/Group');
const GroupMessage = require('../models/GroupMessage');

// ── GET / — Liste groupes ──────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    let query = {};

    if (req.query.type === 'my') {
      // Mes groupes uniquement
      query = { 'members.user': req.user._id };
    } else {
      // Tous les groupes publics
      query = { isPrivate: false };
    }

    const groups = await Group.find(query)
      .populate('createdBy', 'name')
      .populate('members.user', 'name avatar department')
      .sort({ createdAt: -1 });

    // ✅ Ajouter isMember et isAdmin pour le frontend
    const enriched = groups.map(g => {
      const me = g.members.find(
        m => m.user?._id?.toString() === req.user._id.toString()
      );
      return {
        ...g.toObject(),
        isMember: !!me,
        isAdmin:  me?.role === 'admin',
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /:id — Détail groupe ───────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: 'ID invalide' });

    const group = await Group.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('members.user', 'name avatar department');

    if (!group)
      return res.status(404).json({ message: 'Groupe introuvable' });

    // ✅ Ajouter isMember et isAdmin
    const me = group.members.find(
      m => m.user?._id?.toString() === req.user._id.toString()
    );

    res.json({
      ...group.toObject(),
      isMember: !!me,
      isAdmin:  me?.role === 'admin',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST / — Créer groupe ──────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, isPrivate } = req.body;

    if (!name?.trim())
      return res.status(400).json({ message: 'Le nom est obligatoire' });

    const exists = await Group.findOne({ name: name.trim() });
    if (exists)
      return res.status(400).json({ message: 'Ce nom existe déjà' });

    const group = await Group.create({
      name:        name.trim(),
      description: description?.trim() || '',
      isPrivate:   isPrivate || false,
      createdBy:   req.user._id,
      members:     [{ user: req.user._id, role: 'admin' }],
    });

    await group.populate('members.user', 'name avatar department');
    await group.populate('createdBy', 'name');

    res.status(201).json({
      ...group.toObject(),
      isMember: true,
      isAdmin:  true,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /:id — Modifier groupe ─────────────────────────────
router.put('/:id', protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: 'ID invalide' });

    const group = await Group.findById(req.params.id);
    if (!group)
      return res.status(404).json({ message: 'Groupe introuvable' });

    if (!group.isAdmin(req.user._id))
      return res.status(403).json({ message: 'Réservé aux admins' });

    const { name, description, isPrivate } = req.body;

    if (name && name.trim() !== group.name) {
      const exists = await Group.findOne({ name: name.trim() });
      if (exists)
        return res.status(400).json({ message: 'Ce nom existe déjà' });
      group.name = name.trim();
    }

    if (description !== undefined) group.description = description.trim();
    if (isPrivate   !== undefined) group.isPrivate   = isPrivate;

    await group.save();
    await group.populate('members.user', 'name avatar department');
    await group.populate('createdBy', 'name');

    res.json({
      ...group.toObject(),
      isMember: true,
      isAdmin:  true,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /:id — Supprimer groupe ────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: 'ID invalide' });

    const group = await Group.findById(req.params.id);
    if (!group)
      return res.status(404).json({ message: 'Groupe introuvable' });

    const isAdmin      = group.isAdmin(req.user._id);
    const isSuperAdmin = req.user.role === 'admin';

    if (!isAdmin && !isSuperAdmin)
      return res.status(403).json({ message: 'Non autorisé' });

    // Supprimer tous les messages du groupe
    await GroupMessage.deleteMany({ group: req.params.id });
    await group.deleteOne();

    res.json({ message: 'Groupe supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /:id/join — Rejoindre ─────────────────────────────
router.post('/:id/join', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group)
      return res.status(404).json({ message: 'Groupe introuvable' });

    if (group.isPrivate)
      return res.status(403).json({ message: 'Groupe privé' });

    if (group.isMember(req.user._id))
      return res.status(400).json({ message: 'Déjà membre' });

    group.members.push({ user: req.user._id, role: 'member' });
    await group.save();

    res.json({ joined: true, message: 'Vous avez rejoint le groupe' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /:id/leave — Quitter ──────────────────────────────
router.post('/:id/leave', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group)
      return res.status(404).json({ message: 'Groupe introuvable' });

    if (!group.isMember(req.user._id))
      return res.status(400).json({ message: 'Vous n\'êtes pas membre' });

    // Admin seul ne peut pas quitter
    const isAdmin = group.isAdmin(req.user._id);
    const otherAdmins = group.members.filter(
      m => m.role === 'admin' &&
           m.user?.toString() !== req.user._id.toString()
    );

    if (isAdmin && otherAdmins.length === 0 && group.members.length > 1)
      return res.status(400).json({
        message: 'Transférez l\'admin avant de quitter'
      });

    group.members = group.members.filter(
      m => m.user?.toString() !== req.user._id.toString()
    );
    await group.save();

    res.json({ joined: false, message: 'Vous avez quitté le groupe' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /:id/members/:userId — Exclure membre ──────────
router.delete('/:id/members/:userId', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group)
      return res.status(404).json({ message: 'Groupe introuvable' });

    const isSelf  = req.params.userId === req.user._id.toString();
    const isAdmin = group.isAdmin(req.user._id);

    if (!isSelf && !isAdmin)
      return res.status(403).json({ message: 'Non autorisé' });

    group.members = group.members.filter(
      m => m.user?.toString() !== req.params.userId
    );
    await group.save();

    res.json({ message: 'Membre retiré' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /:id/messages — Charger messages ──────────────────
router.get('/:id/messages', protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: 'ID invalide' });

    const group = await Group.findById(req.params.id);
    if (!group)
      return res.status(404).json({ message: 'Groupe introuvable' });

    if (!group.isMember(req.user._id))
      return res.status(403).json({ message: 'Membres uniquement' });

    const page  = parseInt(req.query.page) || 1;
    const limit = 100;

    const messages = await GroupMessage.find({
      group: req.params.id,
    })
      .populate('sender', 'name avatar department')
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Marquer comme lu
    await GroupMessage.updateMany(
      { group: req.params.id, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /:id/messages — Envoyer message ──────────────────
router.post('/:id/messages', protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: 'ID invalide' });

    const group = await Group.findById(req.params.id);
    if (!group)
      return res.status(404).json({ message: 'Groupe introuvable' });

    if (!group.isMember(req.user._id))
      return res.status(403).json({ message: 'Membres uniquement' });

    if (!req.body.content?.trim())
      return res.status(400).json({ message: 'Contenu vide' });

    const message = await GroupMessage.create({
      sender:  req.user._id,
      group:   req.params.id,
      content: req.body.content.trim(),
      readBy:  [req.user._id],
    });

    await message.populate('sender', 'name avatar department');

    // ✅ Émettre via Socket.io
    const io = req.app.get('io');
    io.to(`group_${req.params.id}`).emit('groupMessage', message);

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /:id/messages/:msgId — Modifier message ───────────
router.put('/:id/messages/:msgId', protect, async (req, res) => {
  try {
    const message = await GroupMessage.findById(req.params.msgId);
    if (!message)
      return res.status(404).json({ message: 'Message introuvable' });

    if (message.sender.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Non autorisé' });

    message.oldContent = message.content;
    message.content    = req.body.content.trim();
    message.edited     = true;
    message.editedAt   = new Date();
    await message.save();

    // ✅ Émettre via Socket.io
    const io = req.app.get('io');
    io.to(`group_${req.params.id}`).emit('groupMessageEdited', {
      messageId: message._id,
      content:   message.content,
      edited:    true,
      editedAt:  message.editedAt,
    });

    res.json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /:id/messages/:msgId — Supprimer message ───────
router.delete('/:id/messages/:msgId', protect, async (req, res) => {
  try {
    const message = await GroupMessage.findById(req.params.msgId);
    if (!message)
      return res.status(404).json({ message: 'Message introuvable' });

    const group   = await Group.findById(req.params.id);
    const isOwner = message.sender.toString() === req.user._id.toString();
    const isAdmin = group?.isAdmin(req.user._id);

    if (!isOwner && !isAdmin)
      return res.status(403).json({ message: 'Non autorisé' });

    message.deleted   = true;
    message.deletedAt = new Date();
    message.content   = '[Message supprimé]';
    await message.save();

    // ✅ Émettre via Socket.io
    const io = req.app.get('io');
    io.to(`group_${req.params.id}`).emit('groupMessageDeleted', {
      messageId: message._id,
    });

    res.json({ message: 'Message supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;