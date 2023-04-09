const model = require('../mongo/model');
const User = model.User;

const refreshAccessToken = require('../spotify/refreshAccessToken');
const getBulkTrackData = require('../spotify/getBulkTrackData');
const { updateListensForUser } = require('../spotify/updateListens');

/*
enum list_option {
    COUNT = 1,
    TIME,
    ALBUM_ALPHABETICAL,
    ARTIST_ALPHABETICAL,
};

interface ListTracksRequest {
    list_by: list_option;
    page_size: number;
    page_num: number;
    time_filter: TimeFilter;
};

interface TimeFilter {
    start_time: number;
    end_time: number;
};
*/
const COUNT                  = 1
const TIME                   = 2
const ARTIST_ALPHABETICAL    = 4
const ALBUM_ALPHABETICAL     = 5

const listAlbums = async (req, res) => {
    if (!req.user) {
        res.sendStatus(401);
        return;
    }

    // validate request
    let request = req.query;
    let invalid = validateRequest(request);
    if (invalid) {
        res.status(400).json(invalid);
        return;
    }
    
    // populate listens
    let user = await User.findById(req.user._id).populate({
        path: 'listens'
    }).exec();

    await updateListensForUser(req.user);

    // refresh listens
    user = await User.findById(req.user._id).populate({
        path: 'listens'
    }).exec();

    // condense listens to map and list
    let listen_map = {};
    for (let i = 0; i < user.listens.length; i++) {
        let listen = user.listens[i];
        let uri = listen.track_uri;

        if (!(uri in listen_map)) {
            listen_map[uri] = {
                track: null,
                played_at: listen.played_at,
                context_uri: listen.context_uri,
                count: 0
            }
        }

        listen_map[uri].count++;
    }

    // getTrackData for each listen ([uri] -> track)
    let dataMap = await mapUriToTrackData(user, listen_map);
    let uris = Object.keys(dataMap);
    for (let i = 0; i < uris.length; i++) {
        let uri = uris[i];
        listen_map[uri].track = dataMap[uri];
    }

    // create array of listens
    let listens = Object.values(listen_map);
    
    // map/count listens to their albums ([album_uri] -> album)
    let albumsMap = {};
    for (let i = 0; i < listens.length; i++) {
        let listen = listens[i];
        let album = listen.track.album;
        let uri = album.uri;

        if (!(uri in albumsMap)) {
            album.count = 0;
            album.artists = listen.track.artists;
            albumsMap[uri] = album;
        }

        albumsMap[uri].count += listen.count;
    }

    let albums = Object.values(albumsMap);

    // sort albums and return request
    switch (request.list_by) {
    case COUNT:
        albums.sort(sortByCount);
        if (request.hasOwnProperty('page_num')) {
            page_start = Math.min((request.page_num-1)*request.page_size, albums.length);
            page_end = Math.min(request.page_num*request.page_size, albums.length);
            res.json(albums.slice(page_start, page_end)).status(200);
        } else {
            res.json(albums).status(200);
        }
        return;
    case TIME:
        res.status(405).json({
            error: "list_by TRACK_TIME not currently supported"
        });
        return;
    case ARTIST_ALPHABETICAL:
        res.status(405).json({
            error: "list_by ARTIST_ALPHABETICAL not currently supported"
        });
        return;
    case ALBUM_ALPHABETICAL:
        res.status(405).json({
            error: "list_by ALBUM_ALPHABETICAL not currently supported"
        });
        return;
    default:
        res.status(400).json({
            error: `unknown list_by: ${request.list_by}`
        });
        return;
    }
}

const validateRequest = (request) => {
    if (!request.hasOwnProperty("list_by")) {
        return {error: "must specify list_by enum"};
    }
    try {
        request.list_by = Number(request.list_by);
    } catch (e) {
        return {error: e};
    }
    if (request.list_by <= 0 || request.list_by > 5) {
        return {error: "list_by must be within 1 and 5"};
    }
    if (request.list_by == 3) {
        return {error: "list_by TRACK_ALPHABETICAL not supported"};
    }

    if (!request.hasOwnProperty("page_size")) {
        request.page_size = 50; // default page size
    }
    try {
        request.page_size = Number(request.page_size);
    } catch (e) {
        return {error: e};
    }
    if (request.page_size <= 0 || request.page_size > 100) {
        return {error: "page_size must be within 1 and 100"};
    }
    
    if (!request.hasOwnProperty("page_num")) {
        request.page_num = 1; // default page num
    }
    try {
        request.page_num = Number(request.page_num);
    } catch (e) {
        return {error: e};
    }
    if (request.page_num <= 0) {
        return {error: "page_num must be greater than 0"};
    }
}

const mapUriToTrackData = async (user, listen_map) => {
    // refresh access token
    let accessToken = await refreshAccessToken(user.refreshToken);
    if ((typeof accessToken == Object && 'error' in accessToken) || !accessToken) {
        console.error("unable to fetch history:", accessToken);
    }

    // get data for each uri; set listens
    data_map = {};
    let tracks = await getBulkTrackData(accessToken, Object.keys(listen_map));
    for (const i in tracks) {
        let track = tracks[i]; 
        data_map[track.uri] = track;
    }

    return data_map;
}

const sortByCount = (album_a, album_b) => {
    return album_b.count - album_a.count;
}

module.exports = listAlbums;