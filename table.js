const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    uid: { type: mongoose.Schema.Types.ObjectId, auto: true }
}, { timestamps: true });

const messageSchema = new mongoose.Schema({
    uid: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
    msgid: { type: mongoose.Schema.Types.ObjectId, auto: true }, 
    msgdescription: { type: String, required: true }, 
    createdAt: { type: Date, default: Date.now, expires: 86400 } // 86400s = 24 hours
}, { timestamps: true });

// Track Schema
const trackSchema = new mongoose.Schema({
    msgid: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', required: true },
    uid: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Export Models
const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);
const Track = mongoose.model('Track', trackSchema);

module.exports = { User, Message, Track };