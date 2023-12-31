var mysql = require("mysql2");
const dotenv = require('dotenv');
let result = dotenv.config();


var db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DATABASE,
});

db.connect(function (err) {
  if (err) {
    console.log("Error in db connectivity");
  } else {
    console.log("connected to database");
  }
});

module.exports = db;

