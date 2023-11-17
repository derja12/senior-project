const model = require("../mongo/model");
const User = model.User;

const refreshAccessToken = require("../spotify/refreshAccessToken");
const getBulkTrackData = require("../spotify/getBulkTrackData");
const { updateListensForUser } = require("../spotify/updateListens");

/*
enum list_option {
    TRACK_COUNT = 1,
    TRACK_TIME,
    TRACK_ALPHABETICAL,
    ARTIST_ALPHABETICAL,
    ALBUM_ALPHABETICAL,
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
const TRACK_COUNT = 1;
const TRACK_TIME = 2;
const TRACK_ALPHABETICAL = 3;
const ARTIST_ALPHABETICAL = 4;
const ALBUM_ALPHABETICAL = 5;

const ALBUM_CONTEXT = "album";
const PLAYLIST_CONTEXT = "playlist";
const CONTEXT_FREE = "context_free";

const listTracks = async (req, res) => {
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
  let user = await User.findById(req.user._id)
    .populate({
      path: "listens",
    })
    .exec();

  await updateListensForUser(req.user);

  // refresh listens
  user = await User.findById(req.user._id)
    .populate({
      path: "listens",
    })
    .exec();

  // filter out contexts
  let contexts = request.contexts.split(",");
  let contextsKept = { playlist: false, album: false, none: false };
  for (let i = 0; i < contexts.length; i++) {
    switch (contexts[i]) {
      case ALBUM_CONTEXT:
        contextsKept["album"] = true;
        continue;
      case PLAYLIST_CONTEXT:
        contextsKept["playlist"] = true;
        continue;
      case CONTEXT_FREE:
        contextsKept["none"] = true;
        continue;
      default:
        console.log("list tracks invalid context value given:", contexts[i]);
    }
  }
  let filtered_listens = [];
  let contextFree = 0;
  let playlist = 0;
  let album = 0;
  for (let i = 0; i < user.listens.length; i++) {
    let listen = user.listens[i];
    // include context free?
    if (!listen.context_uri) {
      if (contextsKept["none"]) {
        contextFree++;
        filtered_listens.push(listen);
      }
      continue;
    }
    let context = listen.context_uri.split(":")[1];
    // include playlists?
    if (context == "playlist") {
      if (contextsKept["playlist"]) {
        playlist++;
        filtered_listens.push(listen);
      }
      continue;
    }
    // include albums?
    if (context == "album") {
      if (contextsKept["album"]) {
        album++;
        filtered_listens.push(listen);
      }
      continue;
    }
    // not found? include if context free
    if (contextsKept["none"]) {
      contextFree++;
      filtered_listens.push(listen);
    }
  }
  // console.log(contextFree, "context free listens");
  // console.log(playlist, "playlist listens");
  // console.log(album, "album listens");

  // reassign user listens to filtered list
  user.listens = filtered_listens;

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
        count: 0,
      };
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

  // sort listens and return request
  switch (request.list_by) {
    case TRACK_COUNT:
      listens.sort(sortByCount);
      if (request.hasOwnProperty("page_size")) {
        page_start = Math.min(
          (request.page_num - 1) * request.page_size,
          listens.length
        );
        page_end = Math.min(
          request.page_num * request.page_size,
          listens.length
        );
        res.json(listens.slice(page_start, page_end)).status(200);
      } else {
        res.json(listens).status(200);
      }
      return;
    case TRACK_TIME:
      listens.sort(sortByTime);
      if (request.hasOwnProperty("page_size")) {
        page_start = Math.min(
          (request.page_num - 1) * request.page_size,
          listens.length
        );
        page_end = Math.min(
          request.page_num * request.page_size,
          listens.length
        );
        res.json(listens.slice(page_start, page_end)).status(200);
      } else {
        res.json(listens).status(200);
      }
      return;
    case TRACK_ALPHABETICAL:
      listens.sort(sortByTrack);
      if (request.hasOwnProperty("page_size")) {
        page_start = Math.min(
          (request.page_num - 1) * request.page_size,
          listens.length
        );
        page_end = Math.min(
          request.page_num * request.page_size,
          listens.length
        );
        res.json(listens.slice(page_start, page_end)).status(200);
      } else {
        res.json(listens).status(200);
      }
      return;
    case ARTIST_ALPHABETICAL:
      listens.sort(sortByArtist);
      if (request.hasOwnProperty("page_size")) {
        page_start = Math.min(
          (request.page_num - 1) * request.page_size,
          listens.length
        );
        page_end = Math.min(
          request.page_num * request.page_size,
          listens.length
        );
        res.json(listens.slice(page_start, page_end)).status(200);
      } else {
        res.json(listens).status(200);
      }
      return;
    case ALBUM_ALPHABETICAL:
      listens.sort(sortByAlbum);
      if (request.hasOwnProperty("page_size")) {
        page_start = Math.min(
          (request.page_num - 1) * request.page_size,
          listens.length
        );
        page_end = Math.min(
          request.page_num * request.page_size,
          listens.length
        );
        res.json(listens.slice(page_start, page_end)).status(200);
      } else {
        res.json(listens).status(200);
      }
      return;
    default:
      res.status(400).json({
        error: `unsupported list_by: ${request.list_by}`,
      });
      return;
  }
};

const validateRequest = (request) => {
  if (!request.hasOwnProperty("list_by")) {
    return { error: "must specify list_by enum" };
  }
  try {
    request.list_by = Number(request.list_by);
  } catch (e) {
    return { error: e };
  }
  if (request.list_by <= 0 || request.list_by > 5) {
    return { error: "list_by must be within 1 and 5" };
  }

  if (request.hasOwnProperty("page_size")) {
    try {
      request.page_size = Number(request.page_size);
    } catch (e) {
      return { error: e };
    }
    if (request.page_size <= 0) {
      return { error: "page_size must be greater than 0" };
    }
  } else {
    // no page_size == entire list.
    // should insert limit once FE can adapt.
  }

  if (!request.hasOwnProperty("page_num")) {
    request.page_num = 1; // default page num
  }
  try {
    request.page_num = Number(request.page_num);
  } catch (e) {
    return { error: e };
  }
  if (request.page_num <= 0) {
    return { error: "page_num must be greater than 0" };
  }
};

const mapUriToTrackData = async (user, listen_map) => {
  // refresh access token
  let accessToken = await refreshAccessToken(user.refreshToken);
  if (
    (typeof accessToken == Object && "error" in accessToken) ||
    !accessToken
  ) {
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
};

const sortByCount = (listen_a, listen_b) => {
  return listen_b.count - listen_a.count;
};

const sortByTime = (listen_a, listen_b) => {
  let b_seconds = listen_b.track.duration_ms * listen_b.count;
  let a_seconds = listen_a.track.duration_ms * listen_a.count;
  return b_seconds - a_seconds;
};

const sortByTrack = (listen_a, listen_b) => {
  let b_title = listen_b.track.name;
  let a_title = listen_a.track.name;
  if (b_title < a_title) {
    return 1;
  } else if (b_title > a_title) {
    return -1;
  } else {
    return sortByCount(listen_a, listen_b);
  }
};

const sortByArtist = (listen_a, listen_b) => {
  let b_artist;
  try {
    b_artist = listen_b.track.artists[0].name;
  } catch {
    b_artist = "";
  }
  let a_artist;
  try {
    a_artist = listen_a.track.artists[0].name;
  } catch {
    a_artist = "";
  }
  if (b_artist < a_artist) {
    return 1;
  } else if (b_artist > a_artist) {
    return -1;
  } else {
    return sortByCount(listen_a, listen_b);
  }
};

const sortByAlbum = (listen_a, listen_b) => {
  let b_album;
  try {
    b_album = listen_b.track.album.name;
  } catch {
    b_album = "";
  }
  let a_album;
  try {
    a_album = listen_a.track.album.name;
  } catch {
    a_album = "";
  }
  if (b_album < a_album) {
    return 1;
  } else if (b_album > a_album) {
    return -1;
  } else {
    return sortByCount(listen_a, listen_b);
  }
};

module.exports = listTracks;
