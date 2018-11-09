const db = require("../db");

class Person {
  constructor({ id, first_name, order, team_id }) {
    this.id = id;
    this.first_name = first_name;
    this.order = order;
    this.team_id = team_id;
  }

  static async create(dataObj) {
    const result = await db.query(`
      INSERT INTO people (
        first_name,
        "order",
        team_id
      )
      VALUES ($1, $2, $3) RETURNING *`,
      [
        dataObj.first_name,
        dataObj.order,
        dataObj.team_id
      ]
    );
    let newPerson = result.rows[0];
    return new Person(newPerson);
  }
}

module.exports = Person;
