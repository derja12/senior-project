const fetch = require('node-fetch');

const getRecentlyPlayed = async (accessToken, after) => {
    let url = 'https://api.spotify.com/v1/me/player/recently-played?';

    if (after > 0) {
        url += "after=" + encodeURIComponent(after.toString()) + "&";
    }
    url += "limit=50";

    let res = await fetch(url, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
    });

    let data = await res.json();
    if ('error' in data || !data) { return data; }
    return data.items;
};

module.exports = getRecentlyPlayed;