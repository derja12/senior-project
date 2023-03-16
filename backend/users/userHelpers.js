const GetMostRecentListen = (user) => {
    try {
        return user.listens[user.listens.length - 1];
    } catch (error) {
        console.error("could not get most recent listen:", error);
        return null;
    }
}

module.exports = {
    GetMostRecentListen: GetMostRecentListen,
};