const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new Schema({
    googleId: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    displayName: {
        type: String,
        required: true
    },
    lastLogin: {
        type: Date,
        default: Date.now // Automatically sets the current date and time
    }
});

module.exports = mongoose.model('User', UserSchema);