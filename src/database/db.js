var mysql = require("mysql2/promise");
const dotenv = require('dotenv');
let result = dotenv.config(); 


var db = mysql.createPool({
  host:  process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DATABASE,
  port: process.env.DB_PORT
});

    // db.connect(function (err) {
    //   if (err) {
    //     console.log("Error in db connectivity");
    //   } else {
    //     console.log("connected to database");
    //   }
    // });
    
module.exports=db;

