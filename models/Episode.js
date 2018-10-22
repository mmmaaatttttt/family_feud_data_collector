const db = require("../db");
const { Team } = require("./");

class Episode {
  constructor({
    id,
    episode_number,
    season,
    air_date,
    first_team_id,
    second_team_id
  }) {
    this.id = id;
    this.episode_number = episode_number;
    this.season = season;
    this.air_date = air_date;
    this.first_team_id = first_team_id;
    this.second_team_id = second_team_id;
  }

  static async create(dataObj) {
    const result = await db.query(`
      INSERT INTO episodes (
        episode_number,
        season,
        air_date,
        first_team_id,
        second_team_id
      )
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [
      dataObj.episode_number,
      dataObj.season,
      dataObj.air_date,
      dataObj.first_team_id,
      dataObj.second_team_id
    ]);
    let newEpisode = result.rows[0];
    return new Episode(newEpisode);
  }

  async get title() {
    let team1 = await Team.find(this.first_team_id);
    let team2 = await Team.find(this.second_team_id);
    return `${team1.name} vs. ${team2.name}`;
  }
}

module.exports = Episode;
