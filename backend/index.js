const express = require('express');
const CORS = require('cors');
const fetch = require('node-fetch');
const session = require('express-session');
const passport = require('passport');
const passportLocal = require('passport-local');

const dotenv = require('dotenv');
dotenv.config();

const authorizeSpotify = require('./authorizeSpotify');
const getAccessToken = require('./getAccessToken');
const refreshAccessToken = require('./refreshAccessToken');
const getRecentlyPlayed = require('./getRecentlyPlayed');
const spotify = require('./credentials');

const model = require('./model');
const User = model.User;

const app = express();
const port = process.env.PORT || 3000;

var tokens = {};

app.use(express.urlencoded({extended: false}));
app.use(CORS());

// PASSPORT STUFF
// Secret is a 'signiture' for cookies
app.use(session({ secret: 'p198n1f0198481hm209656565', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new passportLocal.Strategy(
    // configuration
    {
        usernameField: 'email',
        passwordField: 'passwordText',
    },
    // authentication logic
    // email=String, passwordText=String, done=Function
    function (email, passwordText, done) {
        User.findOne({email: email}).then(function (user) {
            if (user) {
                user.verifyPassword(passwordText).then(function (result) {
                    if (result) {
                        done(null, user);
                    } else {
                        console.log('Failed Login: Wrong Password\n  [' + email +  ']\n');
                        done(null, false);
                    }
                });
            } else {
                console.log('Failed Login: User doesn\'t exist\n  [' + email + ']\n');
                done(null, false);
            }
        }).catch(function (err) {
            console.log('Failed Login: findOne error\n  [' + email + ']\n');
            done(err);
        });
    }
));

passport.serializeUser(function (user, done) {
    done(null, user._id);
});

passport.deserializeUser(function (userId, done) {
    User.findOne({_id: userId}).then(function (user) {
        done(null, user);
    }).catch(function (err) {
        done(err);
    });
});

app.get('/session', function (req, res) {
    if (req.user) {
        responseObject = {
            firstName: req.user.firstName,
            email: req.user.email,
        }
        res.json(responseObject);
    } else {
        res.sendStatus(401);
    }
});

app.post('/session', passport.authenticate('local'), function(req, res) {
    console.log('User Logged in:', req.user.email, end='\n');
    res.sendStatus(201);
});

app.delete('/session', function(req, res) {
    req.logout(() => {
        res.sendStatus(204);
    });
});

app.post('/users', (req, res) => {
    var user = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email
    });
    user.setEncryptedPassword(req.body.passwordText).then(() => {
        user.save().then(() => {
            console.log('User created:', user);
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
});

app.get('/ping', async (_, res) => {
    let ping = await fetch('http://localhost:8000/ping');
    console.log(ping.statusText);
    res.json({response_status: ping.statusText});
});

app.get('/auth', authorizeSpotify);
app.get('/callback', getAccessToken, (req, res, next) => {
    if (!req.user) {
        res.sendStatus(401);
        return;
    }

    let token = req.credentials;
    tokens[req.user._id] = token;
    console.log('token inserted:', req.user, '->', token);
    res.redirect('/?authorized=true');
});

app.get('/history', async (req, res) => {
    if (!req.user) {
        res.sendStatus(401);
        return;
    }

    // refresh token
    tokens[req.user._id].access_token = await refreshAccessToken(tokens[req.user._id].refresh_token);

    const accessToken = tokens[req.user._id].access_token;
    try {
        let data = await getRecentlyPlayed(accessToken);
        console.log('data', data);
        res.json(data);

    } catch (error) {
        console.log("could not get recently played:", error);
    }
});

app.listen(port, () => {
    console.log(`Server listening -> PORT ${port}`);
});