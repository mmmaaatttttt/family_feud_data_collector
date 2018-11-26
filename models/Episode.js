const db = require("../db");
const Team = require("./Team");
const Question = require("./Question");

class Episode {
  constructor(obj) {
    this.id = obj.id;
    this.episode_number = obj.episode_number;
    this.season = obj.season;
    this.air_date = obj.air_date;
    this.left_team_id = obj.left_team_id;
    this.right_team_id = obj.right_team_id;
  }

  static async create(dataObj) {
    const result = await db.query(
      `
      INSERT INTO episodes (
        episode_number,
        season,
        air_date,
        left_team_id,
        right_team_id
      )
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `,
      [
        dataObj.episode_number,
        dataObj.season,
        dataObj.air_date,
        dataObj.left_team_id,
        dataObj.right_team_id
      ]
    );
    let newEpisode = result.rows[0];
    return new Episode(newEpisode);
  }

  async title() {
    let teams = await Promise.all([
      Team.find(this.left_team_id),
      Team.find(this.right_team_id)
    ]);
    return `${teams[0].name} vs. ${teams[1].name}`;
  }

  async questions() {
    const results = await db.query(
      `
      SELECT * FROM questions
      WHERE episode_id = $1
      ORDER BY id ASC
    `,
      [this.id]
    );
    return results.rows.map(row => new Question(row));
  }

  async getWinner() {
    let teams = await Promise.all([
      Team.find(this.left_team_id),
      Team.find(this.right_team_id)
    ]);
    let points = await Promise.all(teams.map(t => t.points(this.id)));
    let questions = await this.questions();

    for (let i = 0; i < teams.length; i++) {
      // one way to win: get > 300 points
      let enoughPointsToWin = points[i] > Episode.POINTS_TO_WIN;
      if (enoughPointsToWin) return teams[i];

      // another way to win: get enough points after 4 questions,
      // at which point play proceeds to fast money (maybe?)
      // let morePointsAfterEnoughQuestions =
      //   questions.length >= 4 && points[i] === Math.max(...points);

      // if (enoughPointsToWin || morePointsAfterEnoughQuestions) return teams[i];
    }
    return null;
  }
}

Episode.NUM_FAST_MONEY_QUESTIONS = 5;
Episode.POINTS_TO_WIN = 300;

module.exports = Episode;
