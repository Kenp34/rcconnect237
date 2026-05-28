const jwt = require('jsonwebtoken');
const User = require('../models/User');


const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Récupérer le token
      token = req.headers.authorization.split(' ')[1];
      // Vérifier le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Ajouter l'utilisateur à la requête
      req.user = await User.findById(decoded.id).select('-password');
      next()  } catch (error) {
      console.error(error);
      return res.status(401).json({
        message: 'Non autorisé, token invalide'
      });
    }
  }
  if (!token) {
    return res.status(401).json({
      message: 'Non autorisé, pas de token'
    });
  }
};
module.exports ={ protect };