const model = require('../mongo/model');
const User = model.User;
const Listen = model.Listen;

const refreshAccessToken = require('../spotify/refreshAccessToken');
const getBulkTrackData = require('../spotify/getBulkTrackData');

/*
enum list_option {
    SONG_COUNT = 1,
    SONG_TIME,
    SONG_ALPHABETICAL,
    ARTIST_ALPHABETICAL,
    ALBUM_ALPHABETICAL,
};

interface ListSongsRequest {
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
const SONG_COUNT            = 1
const SONG_TIME             = 2
const SONG_ALPHABETICAL     = 3
const ARTIST_ALPHABETICAL   = 4
const ALBUM_ALPHABETICAL    = 5

const listSongs = async (req, res) => {
    if (!req.user) {
        res.sendStatus(401);
        return;
    }

    // validate request
    let request = req.body;
    let invalid = validateRequest(request);
    if (invalid) {
        res.status(400).json(invalid);
        return;
    }
    
    // populate listens
    let user = await User.findById(req.user._id).populate({
        path: 'listens'
    }).exec();

    // condense listens to map and list
    let listen_map = {};
    for (let i = 0; i < user.listens.length; i++) {
        let uri = user.listens[i].track_uri;

        if (!(uri in listen_map)) {
            listen_map[uri] = 0
        }

        listen_map[uri]++;
    }

    // getTrackData for each listen ([uri] -> track)
    let dataMap = await mapUriToTrackData(user, listen_map);

    // create array with order specified
    switch (request.list_by) {
    case SONG_COUNT:
        let tracks = Object.values(dataMap);
        tracks.sort(sortByCount);
        page_start = Math.min((request.page_num-1)*request.page_size, tracks.length-1);
        page_end = Math.min(request.page_num*request.page_size, tracks.length-1);
        res.json(tracks.slice(page_start, page_end)).status(200);
        return
    case SONG_TIME:
        res.status(405).json({
            error: "list_by SONG_TIME not currently allowed"
        });
        return;
    case SONG_ALPHABETICAL:
        res.status(405).json({
            error: "list_by SONG_ALPHABETICAL not currently allowed"
        });
        return;
    case ARTIST_ALPHABETICAL:
        res.status(405).json({
            error: "list_by ARTIST_ALPHABETICAL not currently allowed"
        });
        return;
    case ALBUM_ALPHABETICAL:
        res.status(405).json({
            error: "list_by ALBUM_ALPHABETICAL not currently allowed"
        });
        return;
    default:
        res.status(400).json({
            error: `unsupported list_by: ${request.list_by}`
        });
        return;
    }
}

const validateRequest = (request) => {
    if (!request.hasOwnProperty("list_by")) {
        return {error: "must specify list_by enum"};
    }
    if (request.list_by <= 0 || request.list_by > 5) {
        return {error: "list_by must be within 1 and 5"};
    }

    if (!request.hasOwnProperty("page_size")) {
        request.page_size = 50; // default page size
    }
    if (request.page_size <= 0 || request.page_size > 100) {
        return {error: "page_size must be within 1 and 100"};
    }
    
    if (!request.hasOwnProperty("page_num")) {
        request.page_num = 1; // default page num
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
    for (const uri in listen_map) {
        try {   
            data_map[uri].listens = listen_map[uri];
        } catch (e) {
            console.error("failed to set listens for", uri, ":", e);
        }
    }

    return data_map;
}

const sortByCount = (track_a, track_b) => {
    return track_b.listens - track_a.listens;
}

module.exports = listSongs;