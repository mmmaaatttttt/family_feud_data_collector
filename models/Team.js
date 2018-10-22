const { prompt, choose } = require("promptly");
const groupBy = require("lodash/groupBy");
const size = require("lodash/size");
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

  static async find(id) {
    const result = await db.query(`
      SELECT * FROM teams WHERE id = $1
    `, [id]);
    let user = result.rows[0];
    return new Team(user);
  }

  static async findByName(name) {
    const result = await db.query(`
      SELECT * FROM teams WHERE name = $1
    `, [name]);
    return result.rows.map(row => new Team(row));
  }

  static async findOrCreate(name) {
    const results = await Team.previousTeams(name);
    let choice = "";
    if (size(results) > 0) {
      let choiceMsg = `Teams named ${name} already exist. Is one of these teams the one you're referring to?\n`;
      for (let id of results) {
        choiceMsg += `${id}. Episodes: ${results[id].air_date.join(", ")}\n`
      }
      choiceMsg += "Enter the team's id if you've found it here.\nOtherwise just hit enter, and I'll create a new team for you."
      choice = await choose(choiceMsg, Object.keys(results).concat(""));
    }
    if (choice) {
      return await Team.find(+choice);
    }
    console.log("Okay, I'll create a new team for you.")
    return await Team.create(name);
  }

  static async previousTeams(name) {
    const results = await db.query(`
      SELECT e.id, e.air_date, 
      CASE 
        WHEN t1.name = $1 then t1.id
        ELSE t2.id
      END AS team_id
      FROM episodes e
      JOIN teams t1
      ON e.first_team_id = t1.id
      JOIN teams t2
      ON e.second_team_id = t2.id
      WHERE t1.name = $1
      OR t2.name = $1
    `, [name]);
    return groupBy(results.rows, "team_id");
  }
}

module.exports = Team;