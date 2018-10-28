require("dotenv").config();

const { prompt, choose } = require("promptly");
const { Answer, Episode, Guess, Question, Team } = require("./models");
const CONTESTANTS_PER_TEAM = 5;

async function record() {
  let { teams, episode } = await createEpisodeAndTeams();

  console.log("\n\nLet's play the feud!\n\n");

  let questionOrder = 1;

  // while teams.left.points() < 300 and teams.right.points() < 300
  let guessOrder = 1;
  let numAnswers = +(await prompt("How many answers are on the board?"));
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

  let direction = await choose("Which team buzzed in first, left or right?", [
    "left",
    "right"
  ]);

  let guessingTeam = team[direction];
  let teamDecided = false;
  let teamOrder;

  while (!teamDecided) {
    teamOrder =
      (questionOrder - 1 + Math.floor((guessOrder - 1) / 2)) %
      CONTESTANTS_PER_TEAM;

    let { answer } = await recordGuessAndAnswer(guessingTeam, teamOrder, guessOrder, question.id);

    if (
      answer.order === 1 ||
      answer.points === Math.max(question.answers().map(a => a.points))
    ) {
      teamDecided = true;
    } else {
      guessingTeam = guessingTeam === teams.left ? teams.right : teams.left;
      guessOrder++;
    }
  }

  let decidedToPass = await choose(
    `Did the ${
      guessingTeam.name
    } family decide to pass? Enter 'y' for yes, just hit enter for no.`,
    ["y", ""],
    { default: "" }
  );

  if (decidedToPass) {
    await question.setToPass();
    guessingTeam = guessingTeam === teams.left ? teams.right : teams.left;
  }

  let numStrikes = 0;

  while (numStrikes < 3 && question.answers() < numAnswers) {
    guessOrder++;
    teamOrder = (teamOrder + 1) % CONTESTANTS_PER_TEAM;
    // await new question and answer
    // if answer is null, numStrikes++
    // else nothing
  }

  // if numStrikes === 3, steal opportunity
  // otherwise guessingTeam gets all the points

  // record fast money
}

record().then(() => {
  console.log("your episode has been successfully recorded. Goodbye!");
  process.exit(0);
});

async function createEpisodeAndTeams() {
  let teams = {
    left: null,
    right: null
  };

  let name1 = await prompt("What is the name of the left team?");
  teams.left = await Team.findOrCreate(name1);

  let name2 = await prompt("What is the name of the right team?");
  teams.right = await Team.findOrCreate(name2);

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

  return { teams, episode };
}

async function recordGuessAndAnswer(team, teamOrder, guessOrder, question_id) {
  let teamMembers = team.people();
  let currentPerson = teamMembers[teamOrder];

  if (!currentPerson) {
    let first_name = await prompt("What is the guesser's name?");
    currentPerson = await Person.create({
      first_name,
      order: teamOrder,
      team_id: team.id
    });
  }

  let guessData = {
    question_id,
    text: await prompt(`What was ${currentPerson.first_name}'s guess?`),
    order: guessOrder,
    person_id: currentPerson.id
  };

  let answer = null;
  let answerText = await prompt(
    "Enter the answer text, or hit enter for a strike",
    { default: "" }
  );

  if (answerText) {
    let answerData = {
      question_id,
      text: answerText,
      points: +(await prompt("How many points was this answer worth?")),
      order: +(await prompt("What's this answer's ranking?"))
    };
    answer = await Answer.create(answerData);
    guessData.matching_answer_id = answer.id;
  }

  let guess = await Guess.create(guessData);

  return { guess, answer };
}
