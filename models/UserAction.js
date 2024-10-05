// models/UserAction.js

const mongoose = require('mongoose');

const userActionSchema = new mongoose.Schema({
    username: { type: String, required: true },
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    ipAddress: { type: String, required: false },
    deviceInfo: { type: String, required: false },
    location: { type: String, required: false },
    sessionDuration: { type: Number, required: false }, // in milliseconds
    failedLoginAttempts: { type: Number, default: 0 },  // Counter for failed logins
    lastFailedLogin: { type: Date, default: null },     // Timestamp of last failed login
    isBlocked: { type: Boolean, default: false }        // If user is blocked
});

const UserAction = mongoose.model('UserAction', userActionSchema);

module.exports = UserAction;
