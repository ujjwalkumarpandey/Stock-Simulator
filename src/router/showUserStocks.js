const express = require("express");
var con = require("../database/db");
const router = express.Router();
const middlewares = require("../utils/verifyUser.js");
const yahooFinance = require("yahoo-finance2").default;
var flash = require("connect-flash");
const fetch = require("node-fetch");

const CryptoJS = require("crypto-js");
const { use } = require("passport");
const key = "12345";

var crypt = {
  // (B1) THE SECRET KEY
  secret: "CIPHERKEY",

  // (B2) ENCRYPT
  encrypt: (clear) => {
    var cipher = CryptoJS.AES.encrypt(clear, crypt.secret);
    return cipher.toString();
  },

  // (B3) DECRYPT
  decrypt: (cipher) => {
    var decipher = CryptoJS.AES.decrypt(cipher, crypt.secret);
    return decipher.toString(CryptoJS.enc.Utf8);
  },
};

const getPrice = async (row) => {
  return new Promise((resolve, reject) => {
    yahooFinance
      .quote(row)
      .then((quote) => {
        // console.log(quote.regularMarketPrice);

        resolve(quote.regularMarketPrice);
      })
      .catch((err) => {
        console.error(err);
      });
  });
};

const getPriceNew = async (row) => {
  try {
    row += "EQN";
    const apiKey = "62bd052f8cmsh23bc0917e49ac99p114e72jsn0d060908d7c5";
    const index = "NIFTY 200";
    const response = await fetch(
      `https://latest-stock-price.p.rapidapi.com/price?Indices=${index}&Identifier=${row}`,
      {
        headers: {
          "x-rapidapi-host": "latest-stock-price.p.rapidapi.com",
          "x-rapidapi-key": apiKey,
        },
      }
    );

    const data = await response.json();
    // console.log(data)
    return data[0].lastPrice;
  } catch (err) {
    console.error(err);
    //  res.status(500).send("Server Error");
  }
};


// show user stocks
router.get("/showUserStocks", middlewares.verifyUser, async (req, res) => {
  try {
    var id = req.user.username;
    console.log(id)
    const sql = `SELECT * FROM userStocks where username = '${id}'`;
    con.query(sql, async (error, result) => {
      if (error) {
        res.sendStatus(500);
      }

      if (result.length === 0) {
        res.render("showUserStocks", {
          resultWithProfit: [],
        });
        return;
      }

      const resultWithProfit = await Promise.all(
        result.map(async (row) => {

          const price = await getPriceNew(row.id);
          var currValue = parseFloat(price) * parseInt(row.units);
          currValue = currValue.toFixed(2);
          var profit = (currValue * 100) / row.amt_invested;
          profit = (profit - 100).toFixed(2);

          var flagProfit = false;
          if (profit >= 0) {
            flagProfit = true;
          }

          // console.log(profit);
          return {
            ...row,
            currValue: currValue,
            profit: profit,
            flagProfit,
          };
        })
      );

      res.render("showUserStocks", {
        resultWithProfit,
      });
    });
  } catch (error) {
    // console.log(error);
    res.sendStatus(500);
  }
});

// show all stocks
router.get("/stockSelect", middlewares.verifyUser, async (req, res) => {
  try {
    const apiKey = "b50e47636emshec659faa495b4e4p163ca3jsna5ada859cc6e";
    const index = "NIFTY 200";
    const response = await fetch(
      `https://latest-stock-price.p.rapidapi.com/price?Indices=${index}`,
      {
        headers: {
          "x-rapidapi-host": "latest-stock-price.p.rapidapi.com",
          "x-rapidapi-key": apiKey,
        },
      }
    );
    const data = await response.json();

    const sortedData = data.sort((a, b) =>
      a.identifier > b.identifier ? 1 : -1
    );

    //  console.log("sortedData"+sortedData);
    const resultWithProfit = await Promise.all(
      sortedData.map(async (row) => {
        var flagProfit = false;
        if (row.change >= 0) {
          flagProfit = true;
        }

        return {
          ...row,
          flagProfit,
        };
      })
    );


    res.render("stockSelect", {
      resultWithProfit,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// router.get("/buy", middlewares.verifyUser, async (req, res) => {
//   try {
//     const id = req.query.id;
//     // console.log(id);

//     const message = req.query.message;
//     //search if this id exist in userStocks
//     var sql = `SELECT * FROM stocks WHERE id=?`;
//     con.query(sql, [id], (error, result) => {
//       if (error) {
//         // console.log(error);
//       }
//       // console.log(result);

//       res.render("buy", {
//         result,
//         message,
//       });
//     });
//   } catch (error) {
//     if (error) {
//       // console.log(error);
//     }
//   }
// });

router.post("/post", middlewares.verifyUser, async (req, res) => {
  try {
    var id = req.body.id; //stock id
    var userId = req.body.userId;
    var units = parseInt(req.body.units);
    // console.log("unit " + units);
    var password = req.body.password;
    // console.log(userId, units);
    var open = req.body.lastPrice;
    // console.log("open " + open);

    var name = req.body.name;

    var identifier = name;
    console.log(name);

    const dayHigh = parseFloat(req.body.dayHigh);
    const dayLow = req.body.dayLow;
    const lastPrice = req.body.lastPrice;
    const previousClose = req.body.previousClose;
    const change = req.body.change;
    const pChange = req.body.pChange;
    // console.log(pChange,dayHigh);
    // console.log("jfhs")
    const totalTradedVolume = req.body.totalTradedVolume;
    const totalTradedValue = req.body.totalTradedValue;
    const lastUpdateTime = req.body.lastUpdateTime;
    const yearHigh = req.body.yearHigh;
    const yearLow = req.body.yearLow;
    const perChange365d = req.body.perChange365d;
    const perChange30d = req.body.perChange30d;

    //check if userId exist

    // console.log(crypt.encrypt(password));

    var sql = `select * from stockuser where username='${userId}'`;
    con.query(sql, (error, result) => {
      if (error) {
        console.log(error);
      } else {
        console.log(result);

        // console.log(result);
        let gg = crypt.decrypt(result[0].password);
        if (gg.localeCompare(password) == 0) {
          if (result[0]) {
            //
            var cost = units * open;

            // console.log("cost " + cost);

            if (cost > result[0].amount) {
              //req.flash("message", "please enter  custid");
              res.redirect(
                `/api/showUserStocks/productDescription?id=${id}&identifier=${identifier}&open=${open}&dayHigh=${dayHigh}&dayLow=${dayLow}&lastPrice=${lastPrice}&previousClose=${previousClose}&change=${change}&pChange=${pChange}&totalTradedVolume=${totalTradedVolume}&totalTradedValue=${totalTradedValue}&lastUpdateTime=${lastUpdateTime}&yearHigh=${yearHigh}&yearLow=${yearLow}&perChange365d=${perChange365d}&perChange30d=${perChange30d}&error=` +
                encodeURIComponent("Insufficient-Fund")
              );
            } else {
              //update the balance of user in buyer table
              var newAmount = result[0].amount - cost;
              var sql2 = `update stockuser set amount=${newAmount} where username='${userId}'`;
              con.query(sql2, (error, result) => {
                if (error) {
                  // console.log(error);
                }
              });
              ////

              //check if stock already present in userStocks
              var sql = `SELECT * FROM userStocks WHERE id=? and username='${req.user.username}'`;
              con.query(sql, [id], (error, result) => {
                if (error) {
                  console.log(error);
                }
                // console.log(result);
                if (result[0]) {
                  //if exist
                  var newUnit = result[0].units + units;
                  // console.log("djshfdus->"+result[0].units);
                  var newamt = result[0].amt_invested + cost;
                  // console.log('yyyy', newUnit);
                  // console.log('newamt', newAmount);
                  var sql = `UPDATE userStocks set units=${newUnit}, amt_invested=${newamt} WHERE id="${id}" and username='${req.user.username}'`;
                  con.query(sql, (error, result) => {
                    if (error) {
                      console.log(error);
                    }
                    // alert('Succefully done');
                    else {
                      const currentDate = new Date();

                      const year = currentDate.getFullYear();
                      const month = currentDate.getMonth() + 1;
                      const day = currentDate.getDate();

                      const hours = currentDate.getHours();
                      const minutes = currentDate.getMinutes();
                      const seconds = currentDate.getSeconds();

                      const formattedDate = `${day}-${month}-${year}`;
                      const formattedTime = `${hours}:${minutes}:${seconds}`;
                      var sql = `insert into transactionHistory values('${id}',${units},${cost * -1},'${formattedDate}','${formattedTime}','${req.user.username}')`;
                      con.query(sql, (error, result) => {
                        if (error) {
                          console.log(error);
                        } else {
                          res.redirect(
                            `/api/showUserStocks/productDescription?id=${id}&identifier=${identifier}&open=${open}&dayHigh=${dayHigh}&dayLow=${dayLow}&lastPrice=${lastPrice}&previousClose=${previousClose}&change=${change}&pChange=${pChange}&totalTradedVolume=${totalTradedVolume}&totalTradedValue=${totalTradedValue}&lastUpdateTime=${lastUpdateTime}&yearHigh=${yearHigh}&yearLow=${yearLow}&perChange365d=${perChange365d}&perChange30d=${perChange30d}&error=` +
                            encodeURIComponent("Transaction-successfull")
                          );
                          //console.log("sold finalyy");
                        }
                      });
                    }
                  });
                } else {
                  // console.log(req.user.username);

                  var sql = `INSERT INTO userStocks VALUES(?,?,?,?,?)`;
                  // console.log(name);

                  var values = [id, name, units, cost, req.user.username];
                  // console.log(values);

                  con.query(sql, values, (error, result) => {
                    if (error) {
                      res.redirect(
                        `/api/showUserStocks/productDescription?id=${id}&identifier=${identifier}&open=${open}&dayHigh=${dayHigh}&dayLow=${dayLow}&lastPrice=${lastPrice}&previousClose=${previousClose}&change=${change}&pChange=${pChange}&totalTradedVolume=${totalTradedVolume}&totalTradedValue=${totalTradedValue}&lastUpdateTime=${lastUpdateTime}&yearHigh=${yearHigh}&yearLow=${yearLow}&perChange365d=${perChange365d}&perChange30d=${perChange30d}&error=` +
                        encodeURIComponent("Transaction Unsuccessful")
                      );
                    } else {
                      const currentDate = new Date();

                      const year = currentDate.getFullYear();
                      const month = currentDate.getMonth() + 1;
                      const day = currentDate.getDate();

                      const hours = currentDate.getHours();
                      const minutes = currentDate.getMinutes();
                      const seconds = currentDate.getSeconds();

                      const formattedDate = `${day}-${month}-${year}`;
                      const formattedTime = `${hours}:${minutes}:${seconds}`;
                      var sql = `insert into transactionHistory values('${id}',${units},${cost * -1},'${formattedDate}','${formattedTime}','${req.user.username}')`;
                      con.query(sql, (error, result) => {
                        if (error) {
                          console.log(error);
                        } else {
                          res.redirect(
                            `/api/showUserStocks/productDescription?id=${id}&identifier=${identifier}&open=${open}&dayHigh=${dayHigh}&dayLow=${dayLow}&lastPrice=${lastPrice}&previousClose=${previousClose}&change=${change}&pChange=${pChange}&totalTradedVolume=${totalTradedVolume}&totalTradedValue=${totalTradedValue}&lastUpdateTime=${lastUpdateTime}&yearHigh=${yearHigh}&yearLow=${yearLow}&perChange365d=${perChange365d}&perChange30d=${perChange30d}&error=` +
                            encodeURIComponent("Transaction-successfull")
                          );
                          //console.log("sold finalyy");
                        }
                      });
                    }

                    // alert('Succefully done');
                  });
                }
              });
            }
          } else {
            // res.redirect('buy')
            res.redirect(
              `/api/showUserStocks/productDescription?id=${id}&identifier=${identifier}&open=${open}&dayHigh=${dayHigh}&dayLow=${dayLow}&lastPrice=${lastPrice}&previousClose=${previousClose}&change=${change}&pChange=${pChange}&totalTradedVolume=${totalTradedVolume}&totalTradedValue=${totalTradedValue}&lastUpdateTime=${lastUpdateTime}&yearHigh=${yearHigh}&yearLow=${yearLow}&perChange365d=${perChange365d}&perChange30d=${perChange30d}&error=` +
              encodeURIComponent("user-not exist")
            );
          }
        } else {
          // console.log("incorrect password");
          res.redirect(
            `/api/showUserStocks/productDescription?id=${id}&identifier=${identifier}&open=${open}&dayHigh=${dayHigh}&dayLow=${dayLow}&lastPrice=${lastPrice}&previousClose=${previousClose}&change=${change}&pChange=${pChange}&totalTradedVolume=${totalTradedVolume}&totalTradedValue=${totalTradedValue}&lastUpdateTime=${lastUpdateTime}&yearHigh=${yearHigh}&yearLow=${yearLow}&perChange365d=${perChange365d}&perChange30d=${perChange30d}&error=` +
            encodeURIComponent("Invalid-Password")
          );
        }
      }
    });
  } catch (error) {
    if (error) {
      // console.log(error);
    }
  }
});

// gives product description on buy page
router.get("/productDescription", middlewares.verifyUser, async (req, res, next) => {
  var message = req.query.error;

  // 
  const {
    id,
    identifier,
    open,
    dayHigh,
    dayLow,
    lastPrice,
    previousClose,
    change,
    pChange,
    totalTradedVolume,
    totalTradedValue,
    lastUpdateTime,
    yearHigh,
    yearLow,
    perChange365d,
    perChange30d,
  } = req.query;

  const quote = {
    id,
    identifier,
    open,
    dayHigh,
    dayLow,
    lastPrice,
    previousClose,
    change,
    pChange,
    totalTradedVolume,
    totalTradedValue,
    lastUpdateTime,
    yearHigh,
    yearLow,
    perChange365d,
    perChange30d,
  };

  var autoBuyIdentfier = identifier.substring(1, identifier.length - 1);

  // console.log(quote);
  //////////
  var symbol = quote.id + ".NS";
  // console.log("symbol"+symbol);
  const today = new Date();
  const end = today.toISOString().slice(0, 10);
  const start = new Date(
    today.getFullYear(),
    today.getMonth() - 12,
    today.getDate()
  )
    .toISOString()
    .slice(0, 10);
  const options = {
    period1: start,
    period2: end,
    interval: "1d",
  };

  var fun = async function (symbol, options) {
    try {
      var data = await yahooFinance.historical(symbol, options);
      return data;
    } catch (error) {
      console.log(error);
    }
  };

  // Use async/await syntax to wait for Promise to resolve
  async function getStockData() {
    let stockData = await fun(symbol, options);
    // console.log("stockData", stockData);

    if (!stockData) {
      res
        .status(404)
        .send(
          '<h2 style="display:flex; justify-content:center; align-items:center;">Stock data not available yet. Please refresh to try again later.</h2>'
        );
    } else {
      // now take two arrays , one for date and one for price of stock at that date
      // console.log('inside')
      var dates = [];
      var prices = [];
      stockData.forEach((obj) => {
        // extract the first 10 characters of the date string
        var date = obj.date.toISOString().slice(0, 10);
        const dateObj = new Date(date);
        const options = {
          day: "2-digit",
          month: "short",
          year: "2-digit",
        };
        const formattedDate = dateObj.toLocaleDateString("en-GB", options);

        var price = parseFloat(obj.close);
        dates.push(formattedDate);
        prices.push(price);
      });

      res.render("productDescription", {
        quote,
        message,
        prices: JSON.stringify(prices),
        dates: JSON.stringify(dates),
        autoBuyIdentfier,
      });
    }
  }

  getStockData();

  /////
});

// stock home page
router.get("/stockHome", middlewares.verifyUser, async (req, res) => {
  try {
    const apiKey = "b50e47636emshec659faa495b4e4p163ca3jsna5ada859cc6e";
    const index = "NIFTY 200";
    const response = await fetch(
      `https://latest-stock-price.p.rapidapi.com/price?Indices=${index}`,
      {
        headers: {
          "x-rapidapi-host": "latest-stock-price.p.rapidapi.com",
          "x-rapidapi-key": apiKey,
        },
      }
    );

    const data = await response.json();
    var sortedData1 = data;
    var sortedData2 = data;
    var sortedData3 = data;

    data.sort((a, b) =>
      a.totalTradedVolume <= b.totalTradedVolume ? 1 : -1
    );

    sortedData2.sort((a, b) =>
      a.pChange <= b.pChange ? 1 : -1
    );

    // sortedData3.sort((a, b) =>
    //   a.pChange >= b.pChange ? 1 : -1
    // );

    var name = req.user.Name;
    var email = req.user.email;
    var amount = 0;
    var sql10 = `select * from stockuser where username='${req.user.username}'`
    con.query(sql10, (error, ress) => {
      if (error) {
        console.log(error)
      }
      else {
        amount = ress[0].amount;

      }
    })
    sortedData1.length = 4;
    sortedData2.length = 4;
    sortedData3.length = 4;
    var sql = `select * from reviews`;
    con.query(sql, (error, result) => {
      if (error) {
        console.log(error);
      } else {
        console.log(result);
        res.render("stockHome", {
          result,
          name,
          email,
          sortedData1,
          sortedData2,
          sortedData3,
          amount

        });
      }
    });
    // console.log(sortedData);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

//most bought
router.get("/mostBought", middlewares.verifyUser, async (req, res, next) => {
  try {
    const apiKey = "b50e47636emshec659faa495b4e4p163ca3jsna5ada859cc6e";
    const index = "NIFTY 200";
    const response = await fetch(
      `https://latest-stock-price.p.rapidapi.com/price?Indices=${index}`,
      {
        headers: {
          "x-rapidapi-host": "latest-stock-price.p.rapidapi.com",
          "x-rapidapi-key": apiKey,
        },
      }
    );

    const data = await response.json();
    const sortedData = data.sort((a, b) =>
      a.totalTradedVolume <= b.totalTradedVolume ? 1 : -1
    );
    // console.log(sortedData);

    const resultWithProfit = await Promise.all(
      sortedData.map(async (row) => {
        var flagProfit = false;
        if (row.change >= 0) {
          flagProfit = true;
        }

        return {
          ...row,
          flagProfit,
        };
      })
    );

    res.render("mostBought", {
      resultWithProfit,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// top gainers
router.get("/topGainers", middlewares.verifyUser, async (req, res, next) => {
  try {
    const apiKey = "b50e47636emshec659faa495b4e4p163ca3jsna5ada859cc6e";
    const index = "NIFTY 200";
    const response = await fetch(
      `https://latest-stock-price.p.rapidapi.com/price?Indices=${index}`,
      {
        headers: {
          "x-rapidapi-host": "latest-stock-price.p.rapidapi.com",
          "x-rapidapi-key": apiKey,
        },
      }
    );

    const data = await response.json();
    const sortedData = data.sort((a, b) => (a.pChange <= b.pChange ? 1 : -1));
    // console.log(sortedData);

    const resultWithProfit = await Promise.all(
      sortedData.map(async (row) => {
        var flagProfit = false;
        if (row.change >= 0) {
          flagProfit = true;
        }

        return {
          ...row,
          flagProfit,
        };
      })
    );

    res.render("topGainers", {
      resultWithProfit,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// top losers
router.get("/topLosers", middlewares.verifyUser, async (req, res, next) => {
  try {
    const apiKey = "b50e47636emshec659faa495b4e4p163ca3jsna5ada859cc6e";
    const index = "NIFTY 200";
    const response = await fetch(
      `https://latest-stock-price.p.rapidapi.com/price?Indices=${index}`,
      {
        headers: {
          "x-rapidapi-host": "latest-stock-price.p.rapidapi.com",
          "x-rapidapi-key": apiKey,
        },
      }
    );

    const data = await response.json();
    const sortedData = data.sort((a, b) => (a.pChange >= b.pChange ? 1 : -1));

    const resultWithProfit = await Promise.all(
      sortedData.map(async (row) => {
        var flagProfit = false;
        if (row.change >= 0) {
          flagProfit = true;
        }

        return {
          ...row,
          flagProfit,
        };
      })
    );

    res.render("topLosers", {
      resultWithProfit,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

//user review
router.get("/userReview", middlewares.verifyUser, async (req, res) => {
  var username = req.user.username;

  res.render("userReview", {
    username,
  });
});

router.post("/review", middlewares.verifyUser, async (req, res, next) => {
  var username = req.query.username;
  var rating = req.body.rating;
  var comment = req.body.comment;
  var sql = `insert into reviews (username, rating, comment) values ('${username}', ${rating}, '${comment}')`;
  con.query(sql, (error, result) => {
    if (error) {
      // console.log(error);
    }
    // console.log(result);

    res.render("userReview", {
      username,
    });
  });
});

router.get("/allUserReview", middlewares.verifyUser, async (req, res) => {
  var name = req.user.Name;
  var email = req.user.email;
  console.log(name);

  var sql = `select * from reviews`;
  con.query(sql, (error, result) => {
    if (error) {
      console.log(error);
    } else {
      console.log(result);
      res.render("allUserReview", {
        result,
        name,
        email,
      });
    }
  });
});

const getPriceNew1 = async (row) => {
  try {
    row += "EQN";
    const apiKey = "62bd052f8cmsh23bc0917e49ac99p114e72jsn0d060908d7c5";
    const index = "NIFTY 200";
    const response = await fetch(
      `https://latest-stock-price.p.rapidapi.com/price?Indices=${index}&Identifier=${row}`,
      {
        headers: {
          "x-rapidapi-host": "latest-stock-price.p.rapidapi.com",
          "x-rapidapi-key": apiKey,
        },
      }
    );

    const data = await response.json();
    // console.log(data)
    return data[0];
  } catch (err) {
    console.error(err);
    //  res.status(500).send("Server Error");
  }
};

// display wishlist page
router.get("/wishlist", middlewares.verifyUser, async (req, res) => {
  var sql = `select * from wishlist where username='${req.user.username}'`;

  con.query(sql, async (error, result) => {
    if (error) {
      console.log(error);
    }

    const resultWithProfit = await Promise.all(
      result.map(async (row) => {
        // console.log(row);

        const price = await getPriceNew(row.id);

        // console.log(price);
        var currValue = parseFloat(price) * parseInt(row.units);
        currValue = currValue.toFixed(2);
        var profit = (currValue * 100) / row.amt_invested;
        profit = (profit - 100).toFixed(2);

        var flagProfit = false;
        if (profit >= 0) {
          flagProfit = true;
        }

        // console.log(profit);
        return {
          ...row,
          currValue: currValue,
          profit: profit,
          flagProfit,
        };
      })
    );

    res.render("wishlist", {
      resultWithProfit,
    });
  });
});

//

// add to wishlist on productDescription page
router.post("/addToWishlist", middlewares.verifyUser, async (req, res) => {
  var id = req.body.id;
  var userId = req.body.userId;
  var units = parseInt(req.body.units);
  var password = req.body.password;

  var open = req.body.open;

  var name = req.body.name;

  var identifier = name;

  const dayHigh = parseFloat(req.body.dayHigh);
  const dayLow = req.body.dayLow;
  const lastPrice = req.body.lastPrice;
  const previousClose = req.body.previousClose;
  const change = req.body.change;
  const pChange = req.body.pChange;

  const totalTradedVolume = req.body.totalTradedVolume;
  const totalTradedValue = req.body.totalTradedValue;
  const lastUpdateTime = req.body.lastUpdateTime;
  const yearHigh = req.body.yearHigh;
  const yearLow = req.body.yearLow;
  const perChange365d = req.body.perChange365d;
  const perChange30d = req.body.perChange30d;

  // checking whether userId is matching or not
  if (userId.localeCompare(req.user.username) != 0) {
    return res.redirect(
      `/api/showUserStocks/productDescription?id=${id}&identifier=${identifier}&open=${open}&dayHigh=${dayHigh}&dayLow=${dayLow}&lastPrice=${lastPrice}&previousClose=${previousClose}&change=${change}&pChange=${pChange}&totalTradedVolume=${totalTradedVolume}&totalTradedValue=${totalTradedValue}&lastUpdateTime=${lastUpdateTime}&yearHigh=${yearHigh}&yearLow=${yearLow}&perChange365d=${perChange365d}&perChange30d=${perChange30d}&error=` +
      encodeURIComponent("Invalid User ID")
    );
  }
  else {
    // checking whether password is matching or not
    var sql = `select password from stockuser where username='${userId}'`;
    con.query(sql, async (error, result) => {
      if (error) {
        console.log(error);
        return res.sendStatus(500);
      }
      else {
        let gg = crypt.decrypt(result[0].password);
        if (gg.localeCompare(password) != 0) { // password not matching
          return res.redirect(
            `/api/showUserStocks/productDescription?id=${id}&identifier=${identifier}&open=${open}&dayHigh=${dayHigh}&dayLow=${dayLow}&lastPrice=${lastPrice}&previousClose=${previousClose}&change=${change}&pChange=${pChange}&totalTradedVolume=${totalTradedVolume}&totalTradedValue=${totalTradedValue}&lastUpdateTime=${lastUpdateTime}&yearHigh=${yearHigh}&yearLow=${yearLow}&perChange365d=${perChange365d}&perChange30d=${perChange30d}&error=` +
            encodeURIComponent("Invalid Password")
          );
        }
        else { // password matching
          var sql = `select * from wishlist where id='${id}' and username='${req.user.username}'`;
          con.query(sql, (error, result) => {
            if (error) {
              console.log(error);
            }
            else {
              if (result[0]) {
                return res.redirect(
                  `/api/showUserStocks/productDescription?id=${id}&identifier=${identifier}&open=${open}&dayHigh=${dayHigh}&dayLow=${dayLow}&lastPrice=${lastPrice}&previousClose=${previousClose}&change=${change}&pChange=${pChange}&totalTradedVolume=${totalTradedVolume}&totalTradedValue=${totalTradedValue}&lastUpdateTime=${lastUpdateTime}&yearHigh=${yearHigh}&yearLow=${yearLow}&perChange365d=${perChange365d}&perChange30d=${perChange30d}&error=` +
                  encodeURIComponent("Already in Wishlist")
                );
              }
              else {
                var sql = `insert into wishlist (id, name , units, username) values ('${id}',${name}, ${units}, '${req.user.username}')`;
                con.query(sql, (error, result) => {
                  if (error) {
                    console.log(error);
                  } else {
                    return res.redirect(
                      `/api/showUserStocks/productDescription?id=${id}&identifier=${identifier}&open=${open}&dayHigh=${dayHigh}&dayLow=${dayLow}&lastPrice=${lastPrice}&previousClose=${previousClose}&change=${change}&pChange=${pChange}&totalTradedVolume=${totalTradedVolume}&totalTradedValue=${totalTradedValue}&lastUpdateTime=${lastUpdateTime}&yearHigh=${yearHigh}&yearLow=${yearLow}&perChange365d=${perChange365d}&perChange30d=${perChange30d}&error=` +
                      encodeURIComponent("Successfully added to wishlist")
                    );
                  }
                });
              }
            }
          });
        }
      }
    });
  }


});

// buy from wishlist
router.get("/buyWishlist", middlewares.verifyUser, async (req, res) => {
  ////

  try {
    var id = req.query.id;
    console.log(id + "knd");
    var name = req.query.name;
    var units = req.query.units;
    var username = req.user.username;
    var data = await getPriceNew1(id);
    console.log(data + "parwez");

    var open = data.lastPrice;

    var sql = `select * from stockuser where username='${username}'`;
    con.query(sql, (error, result) => {
      if (error) {
        console.log(error);
      } else {
        if (result[0]) {
          //
          var cost = units * open;

          if (cost > result[0].amount) {
            //req.flash("message", "please enter  custid");
            res.redirect(
              `/api/showUserStocks/wishlist&error=` +
              encodeURIComponent("Insufficient-Fund")
            );
          } else {
            //update the balance of user in buyer table
            var newAmount = result[0].amount - cost;
            var sql2 = `update stockuser set amount=${newAmount} where username='${username}'`;
            con.query(sql2, (error, result) => {
              if (error) {
                console.log(error);
              }
            });
            ////

            //check if stock already present in userStocks
            var sql = `SELECT * FROM userStocks WHERE id=? and username='${req.user.username}'`;
            con.query(sql, [id], (error, result) => {
              if (error) {
                console.log(error);
              }
              // console.log(result);
              if (result[0]) {
                //if exist
                var newUnit = result[0].units + units;
                // console.log("djshfdus->"+result[0].units);
                var newamt = result[0].amt_invested + cost;
                // console.log('yyyy', newUnit);
                // console.log('newamt', newAmount);
                var sql = `UPDATE userStocks set units=${newUnit}, amt_invested=${newamt} WHERE id="${id}" and username='${req.user.username}'`;
                con.query(sql, (error, result) => {
                  if (error) {
                    console.log(error);
                  }
                  var sql10 = `DELETE FROM wishlist WHERE id='${id}'`;
                  con.query(sql10, (error, result) => {
                    if (error) {
                      console.log(error);
                    }
                    else {
                      ////

                      //get todays date and time
                      const currentDate = new Date();

                      const year = currentDate.getFullYear();
                      const month = currentDate.getMonth() + 1;
                      const day = currentDate.getDate();

                      const hours = currentDate.getHours();
                      const minutes = currentDate.getMinutes();
                      const seconds = currentDate.getSeconds();

                      const formattedDate = `${day}-${month}-${year}`;
                      const formattedTime = `${hours}:${minutes}:${seconds}`;
                      ////////
                      ////
                      var sql = `insert into transactionHistory values(?,?,?,?,?,?)`;
                      con.query(sql, [id, units, cost, formattedDate, formattedTime, req.user.username], (error, result) => {
                        if (error) {
                          console.log(error);

                        }
                        else {
                          res.redirect(
                            `/api/showUserStocks/wishlist?error=` +
                            encodeURIComponent("Transaction-successfull")
                          );
                        }
                      })


                    }
                  });
                });
              } else {
                var sql = `INSERT INTO userStocks VALUES(?,?,?,?,?)`;
                // console.log(name);

                var values = [id, name, units, cost, req.user.username];
                // console.log(values);

                con.query(sql, values, (error, result) => {
                  if (error) {
                    res.redirect(
                      `/api/showUserStocks/wishlist&error=` +
                      encodeURIComponent("Transaction Unsuccessful")
                    );
                  }

                  var sql10 = `DELETE FROM wishlist WHERE id='${id}'`;
                  con.query(sql10, (error, result) => {
                    if (error) {
                      console.log(error);
                    }
                    else {
                      ////

                      //get todays date and time
                      const currentDate = new Date();

                      const year = currentDate.getFullYear();
                      const month = currentDate.getMonth() + 1;
                      const day = currentDate.getDate();

                      const hours = currentDate.getHours();
                      const minutes = currentDate.getMinutes();
                      const seconds = currentDate.getSeconds();

                      const formattedDate = `${day}-${month}-${year}`;
                      const formattedTime = `${hours}:${minutes}:${seconds}`;
                      ////////
                      ////
                      var sql = `insert into transactionHistory values(?,?,?,?,?,?)`;
                      con.query(sql, [id, units, cost, formattedDate, formattedTime, req.user.username], (error, result) => {
                        if (error) {
                          console.log(error);

                        }
                        else {
                          res.redirect(
                            `/api/showUserStocks/wishlist?error=` +
                            encodeURIComponent("Transaction-successfull")
                          );
                        }
                      })


                    }

                  });
                });
              }
            });
          }
        } else {
          // res.redirect('buy')
          res.redirect(
            `/api/showUserStocks/wishlist&error=` +
            encodeURIComponent("user-not exist")
          );
        }
      }
    });
  } catch (error) {
    if (error) {
      console.log(error);
    }
  }

  /////
});

// logout
router.get("/logout", middlewares.verifyUser, async function (req, res, next) {
  try {
    res.clearCookie('access_token');
    res.render("landing");
    // await req.user.save()
  }
  catch (error) {
    res.status(500).send("Some error logging out")
  }
});

module.exports = router;
