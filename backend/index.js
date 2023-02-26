const express = require("express");
const CORS = require("cors");
const fetch = require('node-fetch');
const session = require("express-session");
const passport = require("passport");
const passportLocal = require("passport-local");
const authorizeSpotify = require('./authorizeSpotify');
const getAccessToken = require('./getAccessToken');
const getRecentlyPlayed = require('./getRecentlyPlayed');
const spotify = require('./credentials');

const model = require("./model");
const User = model.User;

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// const db = new Datastore();

app.use(express.urlencoded({extended: false}));
app.use(CORS());

// PASSPORT STUFF
// Secret is a 'signiture' for cookies
app.use(session({ secret: "p198n1f0198481hm209656565", resave: false, saveUninitialized: true }));
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
                        console.log("Failed Login: Wrong Password\n  [" + email +  "]\n");
                        done(null, false);
                    }
                });
            } else {
                console.log("Failed Login: User doesn't exist\n  [" + email + "]\n");
                done(null, false);
            }
        }).catch(function (err) {
            console.log("Failed Login: findOne error\n  [" + email + "]\n");
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

app.get("/session", function (req, res) {
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

app.post("/session", passport.authenticate("local"), function(req, res) {
    console.log("User Logged in:", req.user.email, end="\n");
    res.sendStatus(201);
});

app.delete("/session", function(req, res) {
    req.logout();
    res.sendStatus(204);
});

app.post('/users', (req, res) => {
    var user = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email
    });
    user.setEncryptedPassword(req.body.passwordText).then(() => {
        user.save().then(() => {
            console.log("User created:", user);
            res.status(201).send("created");
        }).catch((error) => {
            if (error.code == 11000) {
                // email -> NOT UNIQUE
                res.status(422).json({"email": "Email already in use"});
                return;
            }
            if (error.errors) {
                let errorMessages = {};
                for (let e in error.errors) {
                    errorMessages[e] = error.errors[e].message;
                }
                if (req.body.passwordText == "") {
                    errorMessages["password"] = "Please specify a password";
                }
                res.status(422).json(errorMessages);
            } else {
                console.error("Error occured while creating a user:", error);
                res.status(500).send("server error");
            }
        });    
    });    
});

app.get('/ping', async (_, res) => {
    let ping = await fetch("http://localhost:8000/ping")
    console.log(ping.statusText)
    res.json({response_status: ping.statusText})
});

// app.get('/login', authorizeSpotify);
// app.get('/callback', getAccessToken, (req, res, next) => {
//     let token = req.credentials
//     console.log("token inserted:", token)
//     db.insert(token, err => {
//       if (err) {
//         next(err);
//       } else {
//         res.redirect(`/?authorized=true`);
//       }
//     });
// });

// app.get('/history', async (req, res) => {
//     db.find({}, async (err, docs) => {
//         if (err) {
//             throw Error('Failed to retrieve documents');
//         }

//         const accessToken = docs[0].access_token;
//         console.log("token", accessToken)
//         try {
//             let data = await getRecentlyPlayed(accessToken)
//             console.log("data", data)
            
//             const arr = data.map(e => ({
//                 played_at: e.played_at,
//                 track_name: e.track.name,
//             }));

//             res.json(arr);
//         } catch (e) {
//             console.log(e)
//         }
//     });
// });

app.listen(port, () => {
    console.log(`Server listening -> PORT ${port}`);
});