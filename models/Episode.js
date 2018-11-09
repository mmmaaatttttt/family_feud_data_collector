const db = require("../db");
const Team = require("./Team");

class Episode {
  constructor(obj) {
    this.id = obj.id;
    this.episode_number = obj.episode_number;
    this.season = obj.season;
    this.air_date = obj.air_date;
    this.first_team_id = obj.first_team_id;
    this.second_team_id = obj.second_team_id;
  }

  static async create(dataObj) {
    const result = await db.query(
      `
      INSERT INTO episodes (
        episode_number,
        season,
        air_date,
        first_team_id,
        second_team_id
      )
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `,
      [
        dataObj.episode_number,
        dataObj.season,
        dataObj.air_date,
        dataObj.first_team_id,
        dataObj.second_team_id
      ]
    );
    let newEpisode = result.rows[0];
    return new Episode(newEpisode);
  }

  async title() {
    let teams = await Promise.all([
      Team.find(this.first_team_id),
      Team.find(this.second_team_id)
    ]);
    return `${teams[0].name} vs. ${teams[1].name}`;
  }

  async hasMovedToFastMoney() {
    let teams = await Promise.all([
      Team.find(this.first_team_id),
      Team.find(this.second_team_id)
    ]);
    let winnerYet = await Promise.all(teams.map(t => t.isWinner(this.id)));
    return winnerYet[0] || winnerYet[1];
  }
}

module.exports = Episode;
