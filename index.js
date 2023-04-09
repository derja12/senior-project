const express = require('express');
const CORS = require('cors');
const fetch = require('node-fetch');
const session = require('express-session');
const passport = require('passport');
const passportLocal = require('passport-local');
// const history = require('connect-history-api-fallback');

const dotenv = require('dotenv');
dotenv.config();

const authorizeSpotify = require('./spotify/authorizeSpotify');
const getAccessToken = require('./spotify/getAccessToken');
const refreshAccessToken = require('./spotify/refreshAccessToken');
const getRecentlyPlayed = require('./spotify/getRecentlyPlayed');
const { updateListens } = require('./spotify/updateListens');

const listTracks = require('./tracks/listTracks');

const postUser = require('./users/postUser');
const userHelper = require('./users/userHelpers');

const ping = require('./misc/ping');
const pong = require('./misc/pong');

const model = require('./mongo/model');
const User = model.User;
const Listen = model.Listen;

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('ui/dist')); // tells the server to host
// app.use(history());
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(CORS({
    origin: 'https://derja12.github.io'
}));

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
            spotifyConnected: Boolean(req.user.refreshToken),
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

app.get('/', pong);
app.get('/ping', ping);

app.get('/auth', authorizeSpotify);
app.get('/callback', getAccessToken, async (req, res, next) => {
    if (!req.user) {
        res.sendStatus(401);
        return;
    }

    // update refresh token in db
    let update = await User.updateOne({ _id: req.user._id }, { refreshToken: req.credentials.refresh_token })

    console.log('token inserted:', req.user.email, '->', req.credentials);
    res.redirect('/');
});
app.get('/history', async (req, res) => {
    if (!req.user) {
        res.sendStatus(401);
        return;
    }

    // refresh token
    const accessToken  = await refreshAccessToken(req.user.refreshToken);
    try {
        let data = await getRecentlyPlayed(accessToken);
        res.json(data);

    } catch (error) {
        console.log("could not get recently played:", error);
    }
});


app.get('/tracks', listTracks);
    app.get('/login', (req, res) => {
    res.redirect('/');
})

if (process.env.UPDATE_LISTENS === "true") {
    updateListens()
    setInterval(updateListens, 3600000); // once every hour
}

app.listen(port, () => {
    console.log(`Server listening -> PORT ${port}`);
});