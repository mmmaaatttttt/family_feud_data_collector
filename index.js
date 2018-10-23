require("dotenv").config();

const { prompt, confirm, choose } = require("promptly");
const { Answer, Episode, Guess, Question, Team } = require("./models");

async function record() {
  let teams = {
    left: null,
    right: null
  }

  let name1 = await prompt("What is the name of the left team?");
  let team1 = await Team.findOrCreate(name1);

  let name2 = await prompt("What is the name of the right team?");
  let team2 = await Team.findOrCreate(name2);

  teams.left = team1;
  teams.right = team2;

  let episode_number = +(await prompt("What's the episode number?"));
  let season = +(await prompt("What season is the episode in?"));
  let air_date = await prompt("When did the episode air?");

  let episode = await Episode.create({
    episode_number,
    season,
    air_date,
    first_team_id: teams.left.id,
    second_team_id: teams.right.id
  });

  console.log("\n\nLet's play the feud!\n\n");
  let questionOrder = 1;

  // while teams.left.points() < 300 and teams.right.points() < 300
  let questionData = {
    episode_id: episode.id,
    text: await prompt(`What is the text of question #${questionOrder}?`),
    order: questionOrder,
    round_type: await choose(
      `How are point values determined? single, double, or triple?`,
      ["single", "double", "triple"]
    ),
    team_decides_to_play: true
  };

  let question = await Question.create(questionData);
  
  // 1. ask which team buzzed in first
  // 2. record their guess
  // 3. if guess matches #1 answer, go to play or pass
  // 4. if not:
    // 5. record other team's guess
    // 6. if other team's guess is higher than first guess... hmm
  // need to figure out which team winds up guessing
  // record guesses, answers strikes
  // stealing
  // end of round <-- not sure whether data model supports these yet
  // let direction = prompt("")

  // record fast money
}

record().then(() => {
  console.log("your episode has been successfully recorded. Goodbye!");
  process.exit(0);
});
