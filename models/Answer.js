class Answer {
  constructor(obj) {
    this.id = obj.id;
    this.question_id = obj.question_id;
    this.text = obj.text;
    this.points = obj.points;
  }

  static async create(dataObj) {
    const result = await db.query(`
      INSERT INTO guesses (
        question_id,
        text,
        points
      )
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [
      dataObj.question_id,
      dataObj.text,
      dataObj.points
    ]);
    let newAnswer = result.rows[0];
    return new Answer(newAnswer);
  }
}

module.exports = Answer;