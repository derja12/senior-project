const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { Schema } = mongoose;
mongoose.connect('mongodb+srv://daf:BigT3chBr0th3r@bettercluster.qntzaw0.mongodb.net/?retryWrites=true&w=majority');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, "Please specify a first name"]
    },
    lastName: {
        type: String,
        required: [true, "Please specify a last name"]
    },
    email: {
        type: String,
        required: [true, "Please specify an email"],
        unique: true
    },
    encryptedPassword: {
        type: String,
        required: [true, "Please specify a password"]
    },
    refreshToken: {
        type: String
    },
    listens: [{ type: Schema.Types.ObjectId, ref: 'listen' }]
});

userSchema.methods.setEncryptedPassword = function (passwordText) {
    // CREATE A PROMISE
    let promise = new Promise((resolve, reject) => {
        
        // bcrypt HASHING
        if (passwordText == "") {
            resolve();
        }
        bcrypt.hash(passwordText, 12).then((hash) => {
            this.encryptedPassword = hash;

            // RESOLVE PROMISE
            resolve();
        });
    });
    return promise;
};

userSchema.methods.verifyPassword = function (passwordText) {
    // CREATE A PROMISE
    let promise = new Promise((resolve, reject) => {

        // bcrypt HASHING
        bcrypt.compare(passwordText, this.encryptedPassword).then((result) => {
        
            // RESOLVE PROMISE with parameter
            resolve(result);
        });
    });
    return promise;
};

const User = mongoose.model("user", userSchema);
const Listen = mongoose.model('listen', {
    track_uri: String,
    // track: { 
    //     type: Schema.Types.ObjectId, 
    //     ref: 'track'
    // },
    played_at: Number,
    context_uri: String,
    // context: {
    //     type: Schema.Types.ObjectId,
    //     ref: 'context'
    // }
});
// const Track = mongoose.model('track', {
//     album: {
//         type: Schema.Types.ObjectId,
//         ref: 'album'
//     },
//     artists: [{
//         type: Schema.Types.ObjectId,
//         ref: 'artist'
//     }],
//     disc_number: {type: Number},
//     duration_ms: {type: Number},
//     explicit: {type: bool},
//     external_ids: {type: Schema.Types.Mixed},
//     href: {type: String},
//     id: {
//         type: String, 
//         unique: true
//     },
//     is_local: {Type: bool},
//     ...
// })


module.exports = {
    User: User,
    Listen: Listen
};