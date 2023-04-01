const fetch = require('node-fetch');

const getTrackData = require('./getTrackData');

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

    // fill in cache (order/list messes up if not. Investigate???)
    for (i in data.items) {
        await getTrackData(accessToken, data.items[i].track.uri);
    }
    
    // get track data for each track
    for (i in data.items) {
        let cTrack = await getTrackData(accessToken, data.items[i].track.uri);
        data.items[i].track = cTrack;
    }

    return data.items;
};

module.exports = getRecentlyPlayed;