const fix = async () => {
  console.log("Starting fix...");
  let users = await User.find()
    .populate({
      path: "listens",
      options: {
        sort: {
          played_at: "asc",
        },
      },
    })
    .exec();

  // update listens for each user
  let extras, dupcount, lMap;
  for (let i in users) {
    let user = users[i];
    switch (user.email) {
      case "derekjacketta@gmail.com":
        console.log("Derek listens", user.listens.length);
        extras = user.listens.slice(user.listens.length - 200);
        lMap = {};
        dupcount = 0;
        extras.forEach((listen) => {
          if (lMap.hasOwnProperty(listen.track_uri)) {
            dupcount++;
          } else {
            lMap[listen.track_uri] = listen;
          }
        });
        user.listens = user.listens
          .slice(0, user.listens.length - 200)
          .concat(Object.values(lMap));
        console.log(dupcount);
        console.log("Modified listens", user.listens.length);
        break;
      case "henry@derek.com":
        console.log("Henry listens", user.listens.length);
        extras = user.listens.slice(user.listens.length - 150);
        lMap = {};
        dupcount = 0;
        extras.forEach((listen) => {
          if (lMap.hasOwnProperty(listen.track_uri)) {
            dupcount++;
          } else {
            lMap[listen.track_uri] = listen;
          }
        });
        user.listens = user.listens
          .slice(0, user.listens.length - 150)
          .concat(Object.values(lMap));
        console.log(dupcount);
        console.log("Modified listens", user.listens.length);
        break;
      case "kaleb@mail.com":
        console.log("Kaleb listens", user.listens.length);
        extras = user.listens.slice(user.listens.length - 10);
        lMap = {};
        dupcount = 0;
        extras.forEach((listen) => {
          if (lMap.hasOwnProperty(listen.track_uri)) {
            dupcount++;
          } else {
            lMap[listen.track_uri] = listen;
          }
        });
        user.listens = user.listens
          .slice(0, user.listens.length - 10)
          .concat(Object.values(lMap));
        console.log(dupcount);
        console.log("Modified listens", user.listens.length);
        break;
      case "kendall@kendall.com":
        console.log("Kendall listens", user.listens.length);
        extras = user.listens.slice(user.listens.length - 10);
        lMap = {};
        dupcount = 0;
        extras.forEach((listen) => {
          if (lMap.hasOwnProperty(listen.track_uri)) {
            dupcount++;
          } else {
            lMap[listen.track_uri] = listen;
          }
        });
        user.listens = user.listens
          .slice(0, user.listens.length - 10)
          .concat(Object.values(lMap));
        console.log(dupcount);
        console.log("Modified listens", user.listens.length);
        break;
      default:
        console.log("skipping", user.email);
    }
    console.log(await user.save());
  }
};
