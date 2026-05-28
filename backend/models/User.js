// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    avatar: { type: String, default: null },  // chemin local
    bio: { type: String, maxlength: 500 },
    department: { type: String },                 // département/service
    role: { type: String, enum: ['employe', 'manager', 'admin'], default: 'employe' },
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Hash du mot de passe avant sauvegarde
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next;
    this.password = await bcrypt.hash(this.password, 12);
    next;
});

UserSchema.methods.matchPassword = async function (pwd) {
    return bcrypt.compare(pwd, this.password);
};

module.exports = mongoose.model('User', UserSchema);

