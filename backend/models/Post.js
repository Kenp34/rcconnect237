// models/Post.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const PostSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 2000 },
    image: { type: String, default: null },     // chemin local
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: { type: String, maxlength: 500 },
        createdAt: { type: Date, default: Date.now }
    }],
    pinned: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema);