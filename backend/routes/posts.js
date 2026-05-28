const router = require('express').Router();
const { protect } = require('../middleware/auth');
const Post = require('../models/Post');
const upload=require('../middleware/upload');


// GET /api/posts/user/:userId - Récupérer les posts d'un utilisateur
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('author', 'name avatar');
   
    console.log("📝 Posts trouvés pour", req.params.userId, ":", posts.length);
    res.json(posts);
  } catch (err) {
    console.error("❌ Erreur:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/posts/feed - Récupérer le feed
router.get('/feed', protect, async (req, res) => {
  try {
    const ids = [...req.user.following, req.user._id];
   
    const posts = await Post.find({ author: { $in: ids } })
      .populate('author', 'name avatar department')
      .populate('comments.user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(20);
   
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/posts - Créer un post
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    const postData = {
      author: req.user._id,
      content: req.body.content,
      image: req.file ? `/uploads/${req.file.filename}` : null
    };
   
    const post = await Post.create(postData);
    await post.populate('author', 'name avatar department');
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// DELETE /api/posts/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post introuvable' });
    if (post.author.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Non autorisé' });
    await post.deleteOne();
    res.json({ message: 'Post supprimé' });
  } catch (err) { res.status(500).json({ message: err.message }); }
})


// POST /api/posts/:id/like - Liker/Unliker un post
router.post('/:id/like', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post introuvable' });
   
    const liked = post.likes.some(
      id => id.toString() === req.user._id.toString()
    );
   
    if (liked) {
      post.likes = post.likes.filter(
        id => id.toString() !== req.user._id.toString()
      );
    } else {
      post.likes.push(req.user._id);
    }
    
     // Créer une notification seulement si ce n'est pas son propre post
      if (post.author._id.toString() !== req.user._id.toString()) {
        const Notification = require('../models/Notification');
        const notif = await Notification.create({
          recipient: post.author._id,
          sender:    req.user._id,
          type:      'like',
          post:      post._id,
          message:   `${req.user.name} a aimé votre publication`,
        });

        // Envoyer la notification en temps réel via Socket.io
        const io = req.app.get('io');       
         io.to(`user_${post.author._id}`).emit('notification', notif);
      }
   
    await post.save();
   
    res.json({
      liked: !liked,
      likesCount: post.likes.length,
      likes: post.likes,
    });

   
    


  }catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/posts/:id/comment - Commenter un post
router.post('/:id/comment', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Texte requis' });
   
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post introuvable' });
   
    post.comments.push({ user: req.user._id, text });
    await post.save();
   
    await post.populate('comments.user', 'name department avatar');
   
    const newComment = post.comments[post.comments.length - 1];
    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
