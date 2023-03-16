const ping = async (_, res) => {
    let ping = await fetch('http://localhost:8000/ping');
    console.log(ping.statusText);
    res.json({response_status: ping.statusText});
};

module.exports = ping;