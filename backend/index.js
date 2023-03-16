const express = require('express');
const CORS = require('cors');
const fetch = require('node-fetch');
const session = require('express-session');
const passport = require('passport');
const passportLocal = require('passport-local');

const dotenv = require('dotenv');
dotenv.config();

const authorizeSpotify = require('./spotify/authorizeSpotify');
const getAccessToken = require('./spotify/getAccessToken');
const refreshAccessToken = require('./spotify/refreshAccessToken');
const getRecentlyPlayed = require('./spotify/getRecentlyPlayed');

const postUser = require('./users/postUser');
const userHelper = require('./users/userHelpers');

const ping = require('./misc/ping');

const model = require('./mongo/model');
const User = model.User;
const Listen = model.Listen;

const app = express();
const port = process.env.PORT || 3000;

var tokens = {};

app.use(express.urlencoded({extended: false}));
app.use(CORS());

// #region Passport stuff
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
                        done(null, false);
                    }
                });
            } else {
                done(null, false);
            }
        }).catch(function (err) {
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

// #endregion

app.post('/users', postUser);

app.get('/ping', ping);

app.get('/auth', authorizeSpotify);
app.get('/callback', getAccessToken, async (req, res, next) => {
    if (!req.user) {
        res.sendStatus(401);
        return;
    }

    // store access token in memory
    let token = req.credentials;
    tokens[req.user._id] = token;

    // update refresh token in db
    let update = await User.updateOne({ _id: req.user._id }, { refreshToken: token.refresh_token })

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

let interval = setInterval(async () => {
    // list all users
    let users = await User.find().populate({
        path: 'listens',
        options: {
            sort: {
                'played_at': 'asc',
            }
        }
    }).exec();

    for (let i in users) {
        let user = users[i]

        // console.log('user:', user);

        // refresh token
        let accessToken = await refreshAccessToken(user.refreshToken);
        if ((typeof accessToken == Object && 'error' in accessToken) || !accessToken) { 
            console.error("unable to fetch history:", accessToken);
        }
        console.log('accessToken:', accessToken);

        // get most recent listen
        let lastListenedAt = 0;
        let lastListen = userHelper.GetMostRecentListen(user);
        if (lastListen) {
            lastListenedAt = lastListen.played_at;
        }
        // console.log(lastListen);

        // get recently played
        let history = await getRecentlyPlayed(accessToken, lastListenedAt);
        if ((typeof accessToken == Object && 'error' in history) || !history) { 
            console.error("unable to fetch history:", history);
        }

        // iterate over history
        for (let j in history) {
            let full_listen = history[j];

            let listen = new Listen({
                track_uri: full_listen.track.uri,
                played_at: Date.parse(full_listen.played_at),
                context_uri: full_listen.context.uri
            })
            let created = await listen.save();
            if (created != listen) {
                console.error("unable to save listen:", listen, "\ncreated:", created);
            } else {   
                user.listens.push(created);

                let at = new Date(full_listen.played_at);
                console.log(full_listen.track.name, at.toUTCString(), full_listen.context.type);
            }
        }
        let updated = await user.save();
        if (updated != user) {
            console.error("unable to update user:", user, "\nupdated:", updated);
        }

        // console.log(updated);
        // clearInterval(interval);
    }
}, 5000); // 3600000); // once every hour

app.listen(port, () => {
    console.log(`Server listening -> PORT ${port}`);
});