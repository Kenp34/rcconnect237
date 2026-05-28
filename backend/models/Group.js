const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom est obligatoire'],
    unique: true,
    trim: true,
    maxlength: 80,
  },
  description: { type: String, default: '', maxlength: 500 },
  avatar:      { type: String, default: null },
  isPrivate:   { type: Boolean, default: false },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['admin','member'], default: 'member' },
  }],
}, { timestamps: true });

// ✅ Méthodes nécessaires
GroupSchema.methods.isMember = function(userId) {
  return this.members.some(
    m => m.user?.toString() === userId?.toString()
  );
};

GroupSchema.methods.isAdmin = function(userId) {
  return this.members.some(
    m => m.user?.toString() === userId?.toString()
      && m.role === 'admin'
  );
};

module.exports = mongoose.model('Group', GroupSchema);