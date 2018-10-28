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

    let { answer } = await recordGuessAndAnswer(
      guessingTeam,
      guessOrder,
      question.id,
      teamOrder
    );

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
    let { answer } = await recordGuessAndAnswer(
      guessingTeam,
      guessOrder,
      question.id,
      teamOrder
    );
    if (!answer) numStrikes++;
  }

  if (numStrikes === 3) {
    guessOrder++;
    guessingTeam = guessingTeam === teams.left ? teams.right : teams.left;
    await recordGuessAndAnswer(guessingTeam, guessOrder, question.id);
  }

  while (question.answers() < numAnswers) {
    await recordAnswer("Please record the next answer that nobody guessed.", question.id);
  }

  // fast money
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

async function recordGuessAndAnswer(team, guessOrder, question_id, teamOrder=null) {
  let teamMembers = team.people();
  let currentPerson = teamMembers[teamOrder];

  if (!currentPerson && teamOrder) {
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
    person_id: currentPerson ? currentPerson.id : null // no person_id for steal attempts
  };

  let answer = await recordAnswer(
    "Enter the answer text, or hit enter for a strike",
    question_id
  );

  if (answer) {
    guessData.matching_answer_id = answer.id;
  }

  let guess = await Guess.create(guessData);

  return { guess, answer };
}

async function recordAnswer(msg, question_id) {
  let answer = null;
  let answerText = await prompt(msg, { default: "" });

  if (answerText) {
    let answerData = {
      question_id,
      text: answerText,
      points: +(await prompt("How many points was this answer worth?")),
      order: +(await prompt("What's this answer's ranking?"))
    };
    answer = await Answer.create(answerData);
  }

  return answer;
}
