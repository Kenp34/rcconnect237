const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');


// GET /api/users - Récupérer tous les utilisateurs (pour l'annuaire)
router.get('/', protect, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('-password')
      .limit(50);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/me - Voir son propre profil
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('following', 'name avatar')
      .populate('followers', 'name avatar');

    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/:id - Voir le profil d'un utilisateur
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('following', 'name avatar')
      .populate('followers', 'name avatar');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/me - Modifier son propre profil
router.put('/me', protect, async (req, res) => {
  try {
    const { name, bio, department } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, bio, department },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/me/avatar - Upload avatar
router.put('/me/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    const avatarPath = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarPath },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users/:id/follow - Follow/Unfollow
router.post('/:id/follow', protect, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "Auto-follow interdit" });
    }

    const target = await User.findById(req.params.id);
    const me = await User.findById(req.user._id);

    if (!target || !me) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    const isFollowing = me.following.includes(target._id);

    if (isFollowing) {
      me.following.pull(target._id);
      target.followers.pull(me._id);
      await me.save();
      await target.save();
      return res.json({ message: "Utilisateur désabonné", following: false });
    }

    else {
      me.following.push(target._id);
      target.followers.push(me._id);

      // Créer une notification
      const Notification = require('../models/Notification');
      const notification = await Notification.create({
        recipient: target._id,
        sender: req.user._id,
        type: 'follow',
        message: `${req.user.name} a commencé à vous suivre`
      });

      // Émettre via Socket.io
      const io = req.app.get('io');
      io.to(`user_${target._id}`).emit('newNotification', {
        _id: notification._id,
        type: 'follow',
        sender: { _id: req.user._id, name: req.user.name, avatar: req.user.avatar },
        message: notification.message,
        createdAt: notification.createdAt,
        read: false
      });


      await me.save();
      await target.save();
      return res.json({ message: "Utilisateur suivi", following: true });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;

/*
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')           // Jamais le mot de passe
      .populate('following', 'name avatar')  // Infos des personnes suivies
      .populate('followers', 'name avatar')// Infos des abonnés

    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
});


router.put('/me',protect,async (req, res) => {
  try {
    const { name, bio, department } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,              // ID de l'uti]lisateur connecté
      { name, bio, department }, // Champs à mettre à jour
      { new: true }              // Retourner le document MIS A JOUR
    ).select('-password');

    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }

})


router.get('/:id', async (req, res) => {
try {
const user = await User.findById(req.params.id)
.select('-password')
.populate('followers', 'name avatar')
.populate('following', 'name avatar');
if (!user) {
return res.status(404).json({ message: 'Utilisateur non trouvé' });
}
res.json(user);
} catch (error) {
res.status(500).json({ message: error.message });
}
});

router.post('/:id/follow', protect, async (req, res) => {
  try {
    // Empêcher l'auto-follow
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        message: "Auto-follow interdit"
      });
    }
    const target = await User.findById(req.params.id);
    const me = await User.findById(req.user._id);

    // Vérifier les utilisateurs
    if (!target || !me) {
      return res.status(404).json({
        message: "Utilisateur introuvable"
      });
    }
    // Vérifier si déjà follow
    const isFollowing = me.following.includes(target._id);
    if (isFollowing) {
      // UNFOLLOW
      me.following.pull(target._id);
      target.followers.pull(me._id);

      await me.save();
      await target.save();

      return res.json({
        message: "Utilisateur désabonné"
      });

    } else {

      // FOLLOW
      me.following.push(target._id);
      target.followers.push(me._id);

      await me.save();
      await target.save();

      return res.json({
        message: "Utilisateur suivi"
      });
    }

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erreur serveur"
    });
  }
})
module.exports = router;



// GET /api/users/me — Voir son propre profil
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('following', 'name avatar department')
      .populate('followers', 'name avatar department');

    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/users/:id — Voir le profil d'un autre utilisateur
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('following', 'name avatar department')
      .populate('followers', 'name avatar department');

    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/users/me — Modifier son propre profil
router.put('/me', protect, async (req, res) => {
  try {
    const { name, bio, department } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, bio, department },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/users/me/avatar — Upload avatar
router.put('/me/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier envoyé' });

    const avatarPath = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarPath },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/users/:id/follow — Suivre / Ne plus suivre
router.post('/:id/follow', protect, async (req, res) => {
  try {
    // Empêcher l'auto-follow
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "Auto-follow interdit" });
    }

    const target = await User.findById(req.params.id);
    const me = await User.findById(req.user._id);

    if (!target || !me) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    const isFollowing = me.following.includes(target._id);

    if (isFollowing) {
      // UNFOLLOW
      me.following.pull(target._id);
      target.followers.pull(me._id);
      await me.save();
      await target.save();

      // ✅ Retourner { following: false }
      return res.json({ following: false, message: "Utilisateur désabonné" });

    } else {
      // FOLLOW
      me.following.push(target._id);
      target.followers.push(me._id);
      await me.save();
      await target.save();

      // ✅ Retourner { following: true }
      return res.json({ following: true, message: "Utilisateur suivi" });
    }

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
});


















*/
