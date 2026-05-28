export function getRoomId(userId1,userId2){
  console.log("ROOM FUNCTION LOADED")
  const sorted=[userId1.toString(),userId2.toString()].sort();
  return `conv_${sorted[0]}_${sorted[1]}`;
}

export const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
 
  if (diff < 60 * 1000) return "À l'instant";
  if (diff < 60 * 60 * 1000) return `Il y a ${Math.floor(diff / 60000)} min`;
  if (diff < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};