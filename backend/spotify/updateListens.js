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
        if ((typeof accessToken == Object && 'error' in history) || !history) { 
            console.error("unable to fetch history:", history);
        }

        // iterate over history
        for (let j in history) {
            let full_listen = history[j];

            let listen = new Listen({
                track_uri: full_listen.track.uri,
                played_at: Date.parse(full_listen.played_at),
                context_uri: full_listen.context.uri
            })
            let created = await listen.save();
            if (created != listen) {
                console.error("unable to save listen:", listen, "\ncreated:", created);
            } else {   
                user.listens.push(created);

                let at = new Date(full_listen.played_at);
                console.log(full_listen.track.name, at.toUTCString(), full_listen.context.type);
            }
        }
        let updated = await user.save();
        if (updated != user) {
            console.error("unable to update user:", user, "\nupdated:", updated);
        }

        // console.log(updated);
        // clearInterval(interval);
    }
}

module.exports = updateListens;