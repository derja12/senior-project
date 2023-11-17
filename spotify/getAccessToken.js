const spotify = require("./credentials");
var fetch = require("node-fetch");

const getAccessToken = async (req, _, next) => {
  if (req.query.code) {
    const url = "https://accounts.spotify.com/api/token";
    const searchParams = new URLSearchParams();

    searchParams.set("grant_type", "authorization_code");
    searchParams.set("code", req.query.code);
    searchParams.set("redirect_uri", spotify.redirect_uri);
    searchParams.set("client_id", spotify.client_id);
    searchParams.set("client_secret", spotify.client_secret);

    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: searchParams,
    });
    try {
      credentials = await res.json();
      req.credentials = credentials;
    } catch (e) {
      console.error(e);
    }
    next();
  }
};

module.exports = getAccessToken;
