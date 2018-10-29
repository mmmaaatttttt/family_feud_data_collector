const db = require("../db");

class Guess {
  constructor(obj) {
    this.id = obj.id;
    this.question_id = obj.question_id;
    this.text = obj.text;
    this.matching_answer_id = obj.matching_answer_id;
    this.order = obj.order;
    this.person_id = obj.person_id;
  }

  static async create(dataObj) {
    const result = await db.query(`
      INSERT INTO guesses (
        question_id,
        text,
        matching_answer_id,
        order,
        person_id
      )
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [
      dataObj.question_id,
      dataObj.text,
      dataObj.matching_answer_id || null,
      dataObj.order,
      dataObj.person_id || null
    ]);
    let newGuess = result.rows[0];
    return new Guess(newGuess);
  }

  isSteal() {
    return this.matching_answer_id !== null && this.person_id === null;
  }
}

module.exports = Guess;