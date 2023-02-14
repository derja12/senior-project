const fetch = require('node-fetch');

const getRecentlyPlayed = async (accessToken) => {
    const url = 'https://api.spotify.com/v1/me/player/recently-played?limit=10';

    let res = await fetch(url, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
    })
    let data = await res.json()
    return data.items;
};

module.exports = getRecentlyPlayed;