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

  static async get(id) {
    const result = await db.query(`
      SELECT * FROM teams WHERE id = $1
    `, [id]);
    let user = result.rows[0];
    return new Team(user);
  }

  static async previousEpisodeAirDates(name) {
    // figure out correct query here
    const result = await db.query(`
      SELECT e.id, e.air_date 
      FROM episodes e
      JOIN teams t1
      ON e.first_team_id = t1.id
      JOIN teams t2
      ON e.second_team_id = t2.id
      WHERE t1.name = $1
      OR t2.name = $1
    `, [name]);
    return result.rows;
  }
}

module.exports = Team;