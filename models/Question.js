const db = require("../db");
const Answer = require("./Answer");
const Guess = require("./Guess");

class Question {
  constructor(obj) {
    this.id = obj.id;
    this.episode_id = obj.episode_id;
    this.text = obj.text;
    this.order = obj.order;
    this.round_type = obj.round_type;
    this.team_decides_to_play = obj.team_decides_to_play;
  }

  static async create(dataObj) {
    const result = await db.query(`
      INSERT INTO questions (
        episode_id,
        text,
        "order",
        round_type,
        team_decides_to_play
      )
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [
      dataObj.episode_id,
      dataObj.text,
      dataObj.order,
      dataObj.round_type,
      dataObj.team_decides_to_play
    ]);
    let newQuestion = result.rows[0];
    return new Question(newQuestion);
  }

  async answers() {
    const results = await db.query(`
      SELECT * FROM answers
      WHERE question_id = $1
      ORDER BY "order" ASC
    `, [this.id]);
    return results.rows.map(row => new Answer(row));
  }

  async guesses() {
    const results = await db.query(`
      SELECT * FROM guesses
      WHERE question_id = $1
      ORDER BY "order" ASC
    `, [this.id]);
    return results.rows.map(row => new Guess(row));
  }

  async setBuzzerWinner(deciding_team_id) {
    const result = await db.query(`
      UPDATE questions
      SET deciding_team_id = $1
      WHERE id=$2 RETURNING *
    `, [deciding_team_id, this.id]);
    let updatedQuestion = result.rows[0];
    return new Question(updatedQuestion);
  }

  async setWinner(winning_team_id) {
    const result = await db.query(`
      UPDATE questions
      SET winning_team_id = $1
      WHERE id=$2 RETURNING *
    `, [winning_team_id, this.id]);
    let updatedQuestion = result.rows[0];
    return new Question(updatedQuestion);
  }

  async setToPass() {
    const result = await db.query(`
      UPDATE questions
      SET team_decides_to_play = false
      WHERE id=$1 RETURNING *
    `, [this.id]);
    let updatedQuestion = result.rows[0];
    return new Question(updatedQuestion);
  }
}

module.exports = Question;
