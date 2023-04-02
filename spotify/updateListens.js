const model = require('../mongo/model');
const User = model.User;
const Listen = model.Listen;

const refreshAccessToken = require('./refreshAccessToken');
const getRecentlyPlayed = require('./getRecentlyPlayed');

const userHelper = require('../users/userHelpers');

const updateListens = async () => {
    // list all users
    let users = await User.find().populate({
        path: 'listens',
        options: {
            sort: {
                'played_at': 'asc',
            }
        }
    }).exec();

    for (let i in users) {
        let user = users[i]
        if (!user.refreshToken) {
            console.log("Skipping user w/out refresh token:", user.email);
            continue;
        }

        // console.log('user:', user);

        // refresh access token
        let accessToken = await refreshAccessToken(user.refreshToken);
        if ((typeof accessToken == Object && 'error' in accessToken) || !accessToken) {
            console.error("unable to fetch history:", accessToken);
        }
        console.log('accessToken:', accessToken);

        // get most recent listen
        let lastListenedAt = 0;
        let lastListen = userHelper.GetMostRecentListen(user);
        if (lastListen) {
            lastListenedAt = lastListen.played_at;
        }
        // console.log(lastListen);

        // get recently played
        let history = await getRecentlyPlayed(accessToken, lastListenedAt);
        if (history.hasOwnProperty('error') || !history) { 
            console.error("unable to fetch history for", user.email, ":", history);
            continue;
        }

        // iterate over history
        let count = 0;
        for (let j in history) {
            let full_listen = history[j];

            try {
                let context_uri;
                if (full_listen.context) {
                    context_uri = full_listen.context.uri;
                }

                let listen = new Listen({
                    track_uri: full_listen.track.uri,
                    played_at: Date.parse(full_listen.played_at),
                    context_uri: context_uri
                })
                let created = await listen.save();
                if (created != listen) {
                    console.error("unable to save listen:", listen, "\ncreated:", created);
                } else {   
                    user.listens.push(created);
                    count++;
                }
            } catch (error) {
                console.error("unable to insert track:", full_listen, "\nError:", error);
            }
        }
        let updated = await user.save();
        if (updated != user) {
            console.error("unable to update user:", user, "\nupdated:", updated);
        }

        console.log("Saved %d new listens for user: %s", count, user.email);

        // console.log(updated);
        // clearInterval(interval);
    }
}

module.exports = updateListens;