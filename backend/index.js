const express = require("express");
const CORS = require("cors");
const Datastore = require('nedb');
var fetch = require('node-fetch');
const authorizeSpotify = require('./authorizeSpotify');
const getAccessToken = require('./getAccessToken');
const getRecentlyPlayed = require('./getRecentlyPlayed');
const spotify = require('./credentials');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const db = new Datastore();

app.use(express.urlencoded({extended: false}));
app.use(CORS({origin: "http://localhost:5173/"}));

app.get('/ping', async (_, res) => {
    let ping = await fetch("http://localhost:8000/ping")
    console.log(ping.statusText)
    res.json({response_status: ping.statusText})
});

app.get('/login', authorizeSpotify);
app.get('/callback', getAccessToken, (req, res, next) => {
    let token = req.credentials
    console.log("token inserted:", token)
    db.insert(token, err => {
      if (err) {
        next(err);
      } else {
        res.redirect(`/?authorized=true`);
      }
    });
});

app.get('/history', async (req, res) => {
    db.find({}, async (err, docs) => {
        if (err) {
            throw Error('Failed to retrieve documents');
        }

        const accessToken = docs[0].access_token;
        console.log("token", accessToken)
        try {
            let data = await getRecentlyPlayed(accessToken)
            console.log("data", data)
            
            const arr = data.map(e => ({
                played_at: e.played_at,
                track_name: e.track.name,
            }));

            res.json(arr);
        } catch (e) {
            console.log(e)
        }
    });
});

app.listen(port, () => {
    console.log(`Server listening -> PORT ${port}`);
});