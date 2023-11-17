const spotify = require("./credentials");
var fetch = require("node-fetch");

// refreshAccessToken takes a refresh token and returns the
// new access token from spotify.
const refreshAccessToken = async (refresh_token) => {
  const url = "https://accounts.spotify.com/api/token";
  const searchParams = new URLSearchParams();

  searchParams.set("grant_type", "refresh_token");
  searchParams.set("refresh_token", refresh_token);
  searchParams.set("client_id", spotify.client_id);
  searchParams.set("client_secret", spotify.client_secret);

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: searchParams,
    });
    credentials = await response.json();
    if ("error" in credentials || !credentials) {
      return credentials;
    }
    return credentials.access_token;
  } catch (error) {
    console.error("could not refresh token:", error);
  }
};

module.exports = refreshAccessToken;
