const { choose } = require("promptly");
const moment = require("moment");
const groupBy = require("lodash/groupBy");
const size = require("lodash/size");
const db = require("../db");
const Person = require("./Person");

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

  static async findOrCreate(name) {
    const results = await Team.previousTeams(name);
    let choice = "";
    if (size(results) > 0) {
      let choiceMsg = `Teams named ${name} already exist. Is one of these teams the one you're referring to?\n`;
      for (let id in results) {
        let formattedDates = results[id].map(r => (
          moment(r.air_date).format("MM/DD/YYYY")
        )).join(", ")
        choiceMsg += `${id}. Episodes: ${formattedDates}\n`
      }
      choiceMsg += "Enter the team's id if you've found it here.\nOtherwise just hit enter, and I'll create a new team for you."
      choice = await choose(choiceMsg, Object.keys(results).concat(""), { default: "" });
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
      ON e.left_team_id = t1.id
      JOIN teams t2
      ON e.right_team_id = t2.id
      WHERE t1.name = $1
      OR t2.name = $1
    `, [name]);
    return groupBy(results.rows, "team_id");
  }

  async people() {
    const results = await db.query(`
      SELECT * FROM people
      WHERE team_id = $1
      ORDER BY "order" ASC
    `, [this.id]);
    return results.rows.map(row => new Person(row));
  }

  async points(episode_id) {
    const results = await db.query(`
      SELECT q.winning_team_id, SUM(a.points) AS points
      FROM guesses g
      LEFT JOIN answers a
      ON a.id = g.matching_answer_id
      LEFT JOIN questions q
      ON g.question_id = q.id
      WHERE g.person_id IS NOT NULL
      AND q.episode_id = $1
      AND q.round_type != 'fast_money'
      GROUP BY winning_team_id
      HAVING q.winning_team_id = $2
    `, [episode_id, this.id]);
    return results[0].points;
  }

  async isWinner(episode_id) {
    return (await this.points(episode_id)) < 300;
  }
}

Team.NUM_CONTESTANTS = 5;

module.exports = Team;