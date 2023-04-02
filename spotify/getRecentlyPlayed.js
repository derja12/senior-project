const fetch = require('node-fetch');

const getBulkTrackData = require('./getBulkTrackData');

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

    let uris = [];
    for (i in data.items) {
        uris.push(data.items[i].track.uri);
    }
    let cTracks = await getBulkTrackData(accessToken, uris);
    return cTracks;
};

module.exports = getRecentlyPlayed;