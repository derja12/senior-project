const fetch = require('node-fetch');

/* Data
---------------------------------
- track.album.uri           (str)
- track.album.total_tracks  (num)
- track.album.images        (lst)
    - image.height          (num)
    - image.width           (num)
    - image.url             (str)
- track.album.name          (str)

- track.artists             (lst)
    - artist.uri            (str)
    - artist.name           (str)

- track.duration_ms         (num)
- track.name
- track.popularity
- track.track_number
- track.uri
*/

// IM_CACHE (in memory cache) maps cTracks by uri
// ex: IM_CACHE[...uri] => {album: {...}, artists: [...], ...}
let IM_CACHE = {};

const copyTrackData = function (sTrack) {
    let cTrack = {
        album: {
            uri:          sTrack.album.uri,
            total_tracks: sTrack.album.total_tracks,
            images:       [],
            name:         sTrack.album.name,
        },
        artists: [],
        duration_ms:  sTrack.duration_ms,
        name:         sTrack.name,
        popularity:   sTrack.popularity,
        track_number: sTrack.track_number,
        uri:          sTrack.uri,
    };

    // keep the smallest image
    if (sTrack.album.images) {
        let smallest_image = sTrack.album.images[0];
        for (i in sTrack.album.images) {
            if (sTrack.album.images[i] < smallest_image.width) {
                smallest_image = sTrack.album.images[i];
            }
        }
        cTrack.album.images.push(smallest_image);
    }

    // fill artists
    for (i in sTrack.artists) {
        let cArtist = {
            uri: sTrack.artists[i].uri,
            name: sTrack.artists[i].name,
        };
        cTrack.artists.push(cArtist);
    }
    return cTrack;
}

const getTrackData = async (accessToken, trackUri) => {
    // validate track uri
    uri_comps = trackUri.split(':');
    if (uri_comps[1] != 'track' || uri_comps.length != 3) {
        console.error("invalid uri for getTrackData:", trackUri);
    }
    
    // check cache
    if (IM_CACHE[trackUri]) {
        return IM_CACHE[trackUri];
    }

    // fetch sTrack from spotify api
    url = 'https://api.spotify.com/v1/tracks/' + uri_comps[2];
    let res = await fetch(url, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
    });
    let sTrack = await res.json();

    // copy track into cTrack, store in cache
    let cTrack = copyTrackData(sTrack);
    IM_CACHE[trackUri] = cTrack;

    return cTrack;
};

module.exports = getTrackData;