// Fonction utilitaire (dans un fichier helpers/room.js)
const getRoomId = (userId1, userId2) => {
  // Trier les deux IDs pour avoir toujours le même résultat
  const sorted = [userId1.toString(), userId2.toString()].sort();
  console.log("ROOM FUNCTION LOADED")
  return `conv_${sorted[0]}_${sorted[1]}`;
};

// Alice (ID: 'aaa') et Bob (ID: 'bbb') :
// getRoomId('aaa', 'bbb') => 'conv_aaa_bbb'
// getRoomId('bbb', 'aaa') => 'conv_aaa_bbb'  (même résultat !)

module.exports = { getRoomId };
