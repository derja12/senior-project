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
    accessToken: {
        type: String
    }
})

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

module.exports = {
    User: User
};