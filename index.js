require("dotenv").config();

const { EpisodeRecording } = require("./models");

let newRecording = new EpisodeRecording();

newRecording.logNewEpisode().then(() => {
  console.log("your episode has been successfully recorded. Goodbye!");
  process.exit(0);
});
