const fetch = require("node-fetch");

const { copyTrackData } = require("./getTrackData");

// [uri...] -> [track...]
const getBulkTrackData = async (accessToken, track_uris) => {
  // convert to ids
  let ids = [];
  for (const i in track_uris) {
    let uri = track_uris[i];
    uri_comps = uri.split(":");
    if (uri_comps[1] != "track" || uri_comps.length != 3) {
      console.error("invalid uri for getBulkTrackData:", uri);
    }
    ids.push(uri_comps[2]);
  }

  let need_count = 0;
  let need_ids_csv = "";
  let cTracks = [];
  for (const i in ids) {
    let id = ids[i];

    if (need_count < 50) {
      need_count++;
      need_ids_csv += `,${id}`;
    }

    if (need_count == 50 || i == ids.length - 1) {
      // fetch sTracks from spotify api
      url = "https://api.spotify.com/v1/tracks/?ids=" + need_ids_csv.slice(1);
      let res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      let resObj = await res.json();
      if (!resObj.hasOwnProperty("tracks")) {
        return { error: resObj };
      }

      let sTracks = resObj.tracks;
      for (let i in sTracks) {
        let sTrack = sTracks[i];
        // copy track into cTrack
        let cTrack = copyTrackData(sTrack);
        cTracks.push(cTrack);
      }

      // reset need ids
      need_count = 0;
      need_ids_csv = "";
    }
  }
  return cTracks;
};

module.exports = getBulkTrackData;
