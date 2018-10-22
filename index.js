require("dotenv").config();

const { prompt, confirm, choose } = require("promptly");
const { Answer, Episode, Guess, Question, Team } = require("./models");

async function record() {
  let name1 = await prompt("What is the name of the first team?");
  let team1 = await Team.findOrCreate(name1);

  let name2 = await prompt("What is the name of the second team?");
  let team2 = await Team.findOrCreate(name2);

  let episode_number = +(await prompt("What's the episode number?"));
  let season = +(await prompt("What season is the episode in?"));
  let air_date = await prompt("When did the episode air?");

  let episode = await Episode.create({
    episode_number,
    season,
    air_date,
    first_team_id: team1.id,
    second_team_id: team2.id
  });
}

record().then(() => {
  console.log("your episode has been successfully recorded. Goodbye!");
  process.exit(0);
});
