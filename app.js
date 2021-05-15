//jshint esversion:6
require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
// const md5 = require('md5');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const  app = express();


app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

// mongo connection
mongoose.connect("mongodb+srv://admin-pablo:" + process.env.DB_PASS + process.env.DB_CLUSTER + process.env.DB_NAME , {useNewUrlParser: true, useUnifiedTopology: true })
// mongo configuration (schema & model)
const userSchema = new mongoose.Schema({
  user: String,
  password: String
});

const User = new mongoose.model("User", userSchema);

app.get("/", (req,res)=>{
  res.render("home");
})

app.route("/login")

.get((req,res)=>{
  res.render("login");
})
.post((req,res)=>{
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({user: username}, (err,foundUser)=>{
    if(err){console.log(err);} else {
      if(foundUser) {
        bcrypt.compare(password, foundUser.password, function(err, result) {
          if (result === true) {
            res.render("secrets");
          }
        });
      }
    }
  })
});

app.route("/register")

.get((req,res)=>{
  res.render("register");
})
.post((req,res)=>{
  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    const newUser = new User ({
      user: req.body.username,
      password: hash
    });
    newUser.save((err)=>{
      if (!err) {
        console.log("New user created");
        res.render("secrets");
      } else {
        console.log(err);
      }
    })
  })
});

app.listen(3000, ()=>{
  console.log("Server listening on port 3000");
})
