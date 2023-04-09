const { User } = require('../mongo/model');

const postUser = (req, res) => {
    var user = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email
    });
    user.setEncryptedPassword(req.body.passwordText).then(() => {
        user.save().then(() => {
            res.status(201).send('created');
        }).catch((error) => {
            if (error.code == 11000) {
                // email -> NOT UNIQUE
                res.status(422).json({'email': 'Email already in use'});
                return;
            }
            if (error.errors) {
                let errorMessages = {};
                for (let e in error.errors) {
                    errorMessages[e] = error.errors[e].message;
                }
                if (req.body.passwordText == '') {
                    errorMessages['password'] = 'Please specify a password';
                }
                res.status(422).json(errorMessages);
            } else {
                console.error('Error occured while creating a user:', error);
                res.status(500).send('server error');
            }
        });    
    });    
};

module.exports = postUser;