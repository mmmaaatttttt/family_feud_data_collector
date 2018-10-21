const db = require("../db");

class Team {
  constructor({id, name}) {
    this.id = id;
    this.name = name;
  }

  static async create(name) {
    const result = await db.query(`
      INSERT INTO teams (name) VALUES ($1) RETURNING *
    `, [name]);
    let newUser = result.rows[0];
    return new Team(newUser);
  }

  async previousEpisodeAirDates() {
    const result = await db.query(`
      SELECT e.air_date 
      FROM episodes e
      WHERE e.first_team_id = $1
      OR e.second_team_id = $1
    `, [this.id]);
    return result.rows;
  }
}

module.exports = Team;