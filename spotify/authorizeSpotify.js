const spotify = require('./credentials');
    
const authorizeSpotify = (req, res) => {
    console.log("Authorizing Spotify...");
    const scopes = 'user-read-recently-played';
    const url = `https://accounts.spotify.com/authorize?&client_id=` + spotify.client_id + `&redirect_uri=${encodeURI(
        spotify.redirect_uri
    )}&response_type=code&scope=${scopes}`;
    res.json({"url": url});
};

module.exports = authorizeSpotify;