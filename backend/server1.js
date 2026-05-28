const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
    res.json({
        message: 'API AcademiConnect opérationnelle'
    });
});
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Serveur démarré sur <http://localhost>:${PORT}`);
});



const path = require('path');


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const authroutes=require('./routes/auth');
// Routes
app.use('/api/auth',authroutes);
//app.use('/api/users',require('./routes/users'));
//app.use('/api/posts',require('./routes/posts'));
//app.use('/api/groups',require('./routes/groups'));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => app.listen(5001, () => console.log('Serveur démarré')))
  .catch(err => console.error(err));
app.use(express.urlencoded({extended:true}))

/*

router.get('/feed', protect, async (req, res) => {
  try {
    // Construire la liste : mes abonnements + moi-même
    const ids = [...req.user.following, req.user._id];

    const posts = await Post.find({ author: { $in: ids } })
      .populate('author', 'name avatar department')
      .populate('comments.user', 'name avatar')
      .sort({ createdAt: -1 })  // Plus récent en premier
      .limit(20);               // Pagination simple

    res.json(posts);
  } catch (err) { res.status(500).json({ message: err.message }); }
});


router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    const postData = {
      author: req.user._id,
      content: req.body.content,
      // Si une image est uploadée, on stocke son chemin
      image: req.file ? `/uploads/${req.file.filename}` : null
    };

    const post = await Post.create(postData);
    await post.populate('author', 'name avatar department');
    res.status(201).json(post);
  } catch (err) { res.status(500).json({ message: err.message }); }
});



router.post('/:id/like', protect, async (req, res) => {

    try {

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: "Post introuvable"
            });
        }

        // Vérifier si l'utilisateur a déjà liké
        const liked = post.likes.some(
            (id) => id.toString() === req.user._id.toString()
        );

        if (liked) {

            // Retirer le like
            post.likes = post.likes.filter(
                (id) => id.toString() !== req.user._id.toString()
            );

        } else {

            // Ajouter le like
            post.likes.push(req.user._id);
        }

        await post.save();

        res.status(200).json({
            likes: post.likes.length,
            liked: !liked
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: err.message
        });
    }
})


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
});

// POST /api/posts/:id/comment
router.post('/:id/comment', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    post.comments.push({ user: req.user._id, text: req.body.text });
    await post.save();
    await post.populate('comments.user', 'name avatar');
    res.json(post.comments);
  } catch (err) { res.status(500).json({ message: err.message }); }
})



const { protect } = require('../middleware/auth');
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
})44







 // Récupérer les suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!profile || !me) return;
      setLoadingSuggestions(true);
      try {
        const { data: allUsers } = await axios.get(`${API}/users`, axiosConfig);
        const followingIds = profile.following?.map(f => f._id) || [];
        const filteredSuggestions = allUsers.filter(user =>
          user._id !== me._id && !followingIds.includes(user._id)
        ).slice(0, 5);
        setSuggestions(filteredSuggestions);
      } catch (error) {
        console.error("Erreur suggestions:", error);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    if (isMe && profile && me) {
      fetchSuggestions();
    }
  }, [isMe, profile, me, token]);
*/