const { prompt, choose } = require("promptly");
const Answer = require("./Answer");
const Episode = require("./Episode");
const Guess = require("./Guess");
const Person = require("./Person");
const Season = require("./Season");
const Question = require("./Question");
const Team = require("./Team");

// todo: winner is first to 300 or winner after 4 questions?

class EpisodeRecording {
  constructor() {
    this.teams = { left: null, right: null };
    this.episode = null;
    this.currentQuestion = null;
    this.currentTeam = null;
    this.questionOrder = 1;
    this.guessOrder = 1;
    this.teamOrder = 1;
  }

  async logNewEpisode() {
    let winningTeam = null;
    await this.setEpisodeAndTeams();
    const countPointsOnSteal = this.episode.season
      .steal_includes_stolen_answer_points;

    console.log("\n\nLet's play the feud!\n\n");

    // handle main game (competition between two teams)
    do {
      let dirs = ["left", "right"];
      for (let dir of dirs) {
        let name = this.teams[dir].name;
        let points = await this.teams[dir].points(
          this.episode.id,
          countPointsOnSteal
        );
        console.log(`${name} Family: ${points} points.`);
      }

      let numAnswers = +(await prompt(
        `Question #${this.questionOrder}: How many answers are on the board?`
      ));

      await this.setCurrentQuestion();
      await this.determineBuzzerWinner();

      // if sudden death, whoever wins the buzzer goes to fast money
      if (this.currentQuestion.round_type === "sudden_death") {
        winningTeam = this.currentTeam;
      } else {
        // otherwise, proceed as usual to log questions
        console.log(`The ${this.currentTeam.name} family is ready to guess!`);

        await this.logGuessesAndStrikes(numAnswers);
        winningTeam = await this.episode.getWinner(
          countPointsOnSteal,
          this.episode.season.first_to_300_points_wins
        );
      }
    } while (!winningTeam);

    // in the event that not everone guessed during the episode,
    // be sure to record their information too
    await this.logRemainingPeople(this.teams.left);
    await this.logRemainingPeople(this.teams.right);

    // handle fast money
    await this.logFastMoney(winningTeam);
  }

  async setEpisodeAndTeams() {
    let name1 = await prompt("What is the name of the left team?");
    this.teams.left = await Team.findOrCreate(name1);

    let name2 = await prompt("What is the name of the right team?");
    this.teams.right = await Team.findOrCreate(name2);

    let episode_number = +(await prompt("What's the episode number?"));
    let seasonId = +(await prompt("What season is the episode in?"));
    let season = await Season.findOrCreate(seasonId);
    let air_date = await prompt("When did the episode air?");

    let episode = await Episode.create({
      episode_number,
      season: seasonId,
      air_date,
      left_team_id: this.teams.left.id,
      right_team_id: this.teams.right.id
    });

    this.episode = episode;
    this.episode.season = season;
  }

  async setCurrentQuestion(isFastMoney = false) {
    let questionData = {
      episode_id: this.episode.id,
      text: await prompt(
        `What is the text of question #${this.questionOrder}?`
      ),
      order: this.questionOrder,
      round_type: isFastMoney
        ? "fast_money"
        : await choose(
            `How are point values determined? single, double, triple, or sudden_death?`,
            ["single", "double", "triple", "sudden_death"]
          ),
      team_decides_to_play: !isFastMoney || null
    };

    let question = await Question.create(questionData);

    this.currentQuestion = question;
  }

  async determineBuzzerWinner() {
    let direction = await choose("Which team buzzed in first, left or right?", [
      "left",
      "right"
    ]);

    this.currentTeam = this.teams[direction];
    let teamDecided = false;

    do {
      // during the buzzer portion of the game,
      // guesses alternate between teams, so we should only increment who's next
      // after every OTHER guess
      let nextInLine =
        this.questionOrder - 1 + Math.floor((this.guessOrder - 1) / 2);

      // loop to the front of the line and handle off-by-1
      this.teamOrder = (nextInLine % Team.NUM_CONTESTANTS) + 1;

      let { answer } = await this.logGuessAndAnswer(this.teamOrder);
      let answersSoFar = await this.currentQuestion.answers();
      let guessesSoFar = await this.currentQuestion.guesses();
      let guessCameFromTeamThatDidntBuzz = guessesSoFar.length % 2 === 0;

      if (answer) {
        // if there's a matching answer
        // there are four ways for the buzzer section to end:
        let orders = answersSoFar.map(a => a.order);

        // 1. You guessed the #1 answer
        let isBestAnswer = answer.order === 1;

        // 2. You're not the first person to guess, you guess an answer,
        // and you were on the second team to guess
        let isOnlyAnswer =
          guessCameFromTeamThatDidntBuzz && answersSoFar.length === 1;

        // 3. You're on the team that didn't buzz in, but your answer is better
        // than the other team's guess
        let isBetterAnswer =
          guessCameFromTeamThatDidntBuzz &&
          answer.order === Math.min(...orders);

        // 4. You're on the team that didn't buzz in,
        //  but your answer is lower than the other team's guess
        let isWorseAnswer = guessCameFromTeamThatDidntBuzz && !isBetterAnswer;
        if (isBestAnswer || isOnlyAnswer || isBetterAnswer || isWorseAnswer) {
          teamDecided = true;
          if (isWorseAnswer) this.toggleCurrentTeam();
        }
      } else {
        // if there's no answer, the buzzer round can still end
        // provided there was a previous answer
        // and the team that guessed isn't the team that buzzed in
        if (answersSoFar.length === 1 && guessCameFromTeamThatDidntBuzz) {
          teamDecided = true;
          this.toggleCurrentTeam();
        }
      }

      // toggle team if it hasn't been decided yet
      if (!teamDecided) {
        this.toggleCurrentTeam();
        this.guessOrder++;
      }
    } while (!teamDecided);

    await this.currentQuestion.setBuzzerWinner(this.currentTeam.id);

    let decidedToPlay = await choose(
      `Did the ${
        this.currentTeam.name
      } family decide to play? Hit enter for yes, type 'n' for no.`,
      ["", "n"],
      { default: "" }
    );

    if (decidedToPlay) {
      await this.currentQuestion.setToPass();
      this.toggleCurrentTeam();
    }
  }

  async logGuessAndAnswer(teamOrder = null) {
    let teamMembers = await this.currentTeam.people();
    let currentPerson = teamMembers.find(p => p.order === teamOrder);

    // guesses for steal attempts aren't associated with any one person on the team
    let stealAttempt = teamOrder === null;

    if (!currentPerson && !stealAttempt) {
      currentPerson = await this.logNewPerson(this.teamOrder, this.currentTeam);
    }

    // messaging is different for a steal attempt
    let person_id = null;
    let textMsg = "What did they guess to try to steal?";

    if (currentPerson) {
      // this runs precisely when we're not in a steal attempt
      person_id = currentPerson.id;
      textMsg = `What was ${
        currentPerson.first_name
      }'s guess? Hit enter if they didn't guess anything.`;
    }

    let guessData = {
      question_id: this.currentQuestion.id,
      text: await prompt(textMsg, { default: "" }),
      order: this.guessOrder,
      person_id
    };

    let answer = await this.logAnswer(
      "Enter the answer text, or hit enter for a strike.",
      this.currentQuestion.id
    );

    if (answer) {
      guessData.matching_answer_id = answer.id;
    }

    let guess = await Guess.create(guessData);

    return { guess, answer };
  }

  async logGuessesAndStrikes(numAnswers) {
    let numStrikes = 0;
    let foundAnswers = [];
    let maxStrikes = 3;
    if (this.currentQuestion.round_type === "triple") {
      maxStrikes = this.episode.season.num_strikes_for_triple_rounds;
    }

    // loop while there are fewer than three strikes
    // and while the team hasn't found all of the answers
    do {
      this.guessOrder++;
      this.teamOrder = (this.teamOrder % Team.NUM_CONTESTANTS) + 1;

      let { answer } = await this.logGuessAndAnswer(this.teamOrder);

      if (!answer) {
        numStrikes++;
        console.log(`Strike #${numStrikes}!`);
      }

      foundAnswers = await this.currentQuestion.answers();
    } while (numStrikes < maxStrikes && foundAnswers.length < numAnswers);

    await this.handleRoundEnd(foundAnswers, numAnswers, numStrikes, maxStrikes);
  }

  async handleRoundEnd(foundAnswers, numAnswers, numStrikes, maxStrikes) {
    // if the round ends because there are no more answers,
    // the current team wins!
    if (foundAnswers.length === numAnswers) {
      await this.currentQuestion.setWinner(this.currentTeam.id);
    }

    // if there are thee strikes, the other team has an opportunity to steal!
    if (numStrikes === maxStrikes) {
      this.guessOrder++;
      this.toggleCurrentTeam();
      console.log(
        `The ${this.currentTeam.name} family now has an opportunity to steal!`
      );

      let { answer } = await this.logGuessAndAnswer();

      // if steal attempt failed, the other team should win the round
      if (!answer) this.toggleCurrentTeam();

      await this.currentQuestion.setWinner(this.currentTeam.id);
      await this.logAnswersThatWerentGuessed(numAnswers);
    }

    // set orders for next round
    this.questionOrder++;
    this.guessOrder = 1;
  }

  async logAnswer(msg, question_id, isFastMoney = false) {
    let answer = null;
    let answerText = await prompt(msg, { default: "" });

    if (answerText) {
      let answerData = {
        question_id,
        text: answerText,
        points: +(await prompt("How many points was this answer worth?")),
        order: isFastMoney
          ? null
          : +(await prompt("What's this answer's ranking?"))
      };
      answer = await Answer.create(answerData);
    }

    return answer;
  }

  async logAnswersThatWerentGuessed(numAnswers) {
    while ((await this.currentQuestion.answers()).length < numAnswers) {
      await this.logAnswer(
        "Please record the next answer that nobody guessed.",
        this.currentQuestion.id
      );
    }
  }

  async logNewPerson(order, team) {
    let first_name = await prompt(
      `What is the name of person #${order} in the ${team.name} family?`
    );
    let newPerson = await Person.create({
      first_name,
      order,
      team_id: team.id
    });
    return newPerson;
  }

  async logRemainingPeople(team) {
    let people = await team.people();
    let orders = Array.from({ length: Team.NUM_CONTESTANTS }, (_, i) => i + 1);
    for (let order of orders) {
      let person = people.find(p => p.order === order);
      if (!person) {
        await this.logNewPerson(order, team);
      }
    }
  }

  async logFastMoney(team) {
    let people = await team.people();
    let peopleStr = people
      .map(p => `Order #${p.order}: ${p.first_name}`)
      .join("\n");
    let firstPersonOrder = await choose(
      `Who went first in fast money? Please enter their order. \n${peopleStr}\n`,
      people.map(p => p.order).map(o => "" + o)
    );

    let firstPersonIdx = people.findIndex(p => p.order === +firstPersonOrder);
    let firstPerson = people[firstPersonIdx];
    people.splice(firstPersonIdx, 1);
    let guesses = [];
    let questions = [];
    this.questionOrder = 1;

    // get first person's guesses
    for (var i = 0; i < Episode.NUM_FAST_MONEY_QUESTIONS; i++) {
      // get current fast money question
      await this.setCurrentQuestion(true);
      this.questionOrder++;
      questions.push(this.currentQuestion);

      let guessData = {
        question_id: this.currentQuestion.id,
        text: await prompt(
          `What did ${
            firstPerson.first_name
          } guess for this fast money question?`,
          { default: "" }
        ),
        order: 1,
        person_id: firstPerson.id
      };

      guesses.push(guessData);
    }

    // get first person's answers
    await this.logFastMoneyAnswers(guesses);

    peopleStr = people
      .map(p => `Order #${p.order}: ${p.first_name}`)
      .join("\n");
    let secondPersonOrder = await choose(
      `Who went second in fast money? Please enter their order. \n ${peopleStr}`,
      people.map(p => p.order).map(o => "" + o)
    );

    let secondPerson = people.find(p => p.order === +secondPersonOrder);
    guesses = [];

    // get second person's guesses
    for (var i = 0; i < Episode.NUM_FAST_MONEY_QUESTIONS; i++) {
      let guessData = {
        question_id: questions[i].id,
        text: await prompt(
          `What did ${
            secondPerson.first_name
          } guess for this fast money question?`,
          { default: "" }
        ),
        order: 2,
        person_id: secondPerson.id
      };

      guesses.push(guessData);
    }

    // get second person's answers
    await this.logFastMoneyAnswers(guesses);

    // TODO: Show final score, and whether or not the family won!
  }

  async logFastMoneyAnswers(guesses) {
    for (let guessIdx in guesses) {
      // TODO: deal with passing
      let guess = guesses[guessIdx];
      let answer = await this.logAnswer(
        `Enter the fast money answer for question #${+guessIdx +
          1} (hit enter for no answer)`,
        guess.question_id,
        true
      );

      if (answer) guess.matching_answer_id = answer.id;

      await Guess.create(guess);
    }
  }

  toggleCurrentTeam() {
    let leftIsCurrent = this.currentTeam === this.teams.left;
    this.currentTeam = leftIsCurrent ? this.teams.right : this.teams.left;
  }
}

module.exports = EpisodeRecording;
