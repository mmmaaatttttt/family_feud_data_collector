const db = require("../db");
const Team = require("./Team");

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

  async hasNoWinner() {
    let teams = await Promise.all([
      Team.find(this.left_team_id),
      Team.find(this.right_team_id)
    ]);
    let winnerYet = await Promise.all(teams.map(t => t.isWinner(this.id)));
    return !winnerYet[0] && !winnerYet[1];
  }
}

Episode.NUM_FAST_MONEY_QUESTIONS = 5;

module.exports = Episode;
