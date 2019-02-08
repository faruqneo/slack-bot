const mongoose = require('mongoose');

let tokenSchema = mongoose.Schema({
    refresh_token: {
        type: String,
        require: true
    },
    admin: {
        type: String,
        require: true
    }
}, { versionKey: false});

let Tokens = module.exports = mongoose.model('Token',tokenSchema, 'tokens' );