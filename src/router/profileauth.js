const express = require("express");
var db = require("../database/db");
const jwt = require("jsonwebtoken");
const middlewares = require("../utils/verifyUser.js");
const router = express.Router();
router.get("/profileView", async (req, res, next) => {
  res.render("profileView");
});

///transaction history
router.get("/transactionHistory", middlewares.verifyUser, (req, res) => {
  //take data fron transactionHistory
  var sql = `select * from transactionHistory where username='${req.user.username}'`;
  // console.log(req.user.username);
  db.query(sql, (error, result) => {
    res.render("transactionHistory", { result });
  });
});
/////
//autosellview
router.get("/autoSellView", middlewares.verifyUser, (req, res) => {
  //take data fron autoselltable
  var sql = `select * from autoSell where username='${req.user.username}'`;
  // console.log(req.user.username);
  db.query(sql, (error, result) => {
    if (error) {
      console.log(error);
    } else {
      res.render("autoSellView", { result });
    }
  });
});
router.get("/deleteAutoBuy", middlewares.verifyUser, (req, res) => {
  var username = req.query.username;
  var id = req.query.id;
  var selected_price = req.query.selected_price;
  console.log(username);
  console.log("id: " + id);
  console.log(selected_price);

  var sql = `delete from autoBuy where id='${id}' and username='${username}' and selected_price=${selected_price}`;
  db.query(sql, (error, result) => {
    if (error) {
      console.log(error);
    } else {
      res.redirect("/api/profileauth/autoBuyView");
    }
  });
});
//////

////autobuyview
router.get('/autoBuyView',middlewares.verifyUser, (req,res)=>{
  //take data fron autobuy table
  var sql = `select * from autoBuy where username='${req.user.username}'`;
  // console.log(req.user.username);
  db.query(sql,(error,result)=>{


    if (error) {
      console.log(error);
    } else {
      res.render("autoBuyView", { result });
    }
  })
  
})
router.get("/deleteAutoSell", middlewares.verifyUser, (req, res) => {
  var username = req.query.username;
  var id = req.query.id;
  var selected_price = req.query.selected_price;
  console.log(username);
  console.log("id: " + id);
  console.log(selected_price);

  var sql = `delete from autoSell where id='${id}' and username='${username}' and selected_price=${selected_price}`;
  db.query(sql, (error, result) => {
    if (error) {
      console.log(error);
    } else {
      res.redirect("/api/profileauth/autoSellView");
    }
  });
});
////
router.get("/userProfile", middlewares.verifyUser, (req, res) => {
   var sql = `select * from stockuser where username='${req.user.username}'`;
   db.query(sql, (error, result) => {
     if (error) {
       console.log(error);
     } else {
       console.log(result);
       res.render("userProfile", {result});
     }
   });
 

});

router.get("/editEmail", middlewares.verifyUser, (req, res) => {
   res.render('editEmail');

});
router.post("/editEmail", middlewares.verifyUser, (req, res) => {
  var sql = `update stockuser set email='${req.body.email}' where username='${req.user.username}'`;
  db.query(sql, (error, result) => {
    if (error) {
      console.log(error);
    } else {
      console.log(result);

      res.redirect("/api/profileauth/userProfile");
    }
  });
});




router.get("/editPhone", middlewares.verifyUser, (req, res) => {
  res.render("editPhone");
});
router.post("/editPhone", middlewares.verifyUser, (req, res) => {
  var sql = `update stockuser set mobileNumber='${req.body.phone}' where username='${req.user.username}'`;
  db.query(sql, (error, result) => {
    if (error) {
      console.log(error);
    } else {
      console.log(result);

      res.redirect("/api/profileauth/userProfile");
    }
  });
});



module.exports=router;