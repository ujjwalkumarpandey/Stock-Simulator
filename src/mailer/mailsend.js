var nodemailer = require("nodemailer");

var transport = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: "projectaaupy@gmail.com",
    pass: "duzhllsbspwoyctk",
  },
});


module.exports = transport;
