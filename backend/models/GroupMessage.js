const mongoose = require('mongoose');

const GroupMessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  readBy:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  deleted:    { type: Boolean, default: false },
  deletedAt:  { type: Date,    default: null },
  edited:     { type: Boolean, default: false },
  editedAt:   { type: Date,    default: null },
  oldContent: { type: String,  default: null },
}, { timestamps: true });

GroupMessageSchema.index({ group: 1, createdAt: -1 });

module.exports = mongoose.model('GroupMessage', GroupMessageSchema);