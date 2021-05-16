//jshint esversion:6
require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
// level 3 const md5 = require('md5');
// level 4 const bcrypt = require('bcrypt');
// level 4 const saltRounds = 10;
// level 5 session & passport & cookies
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const  app = express();


app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
//Level 5 session
app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// mongo connection
mongoose.connect("mongodb+srv://admin-pablo:" + process.env.DB_PASS + process.env.DB_CLUSTER + process.env.DB_NAME , {useNewUrlParser: true, useUnifiedTopology: true })
mongoose.set("useCreateIndex", true);
// mongo configuration (schema & model)
const userSchema = new mongoose.Schema({
  user: String,
  password: String
});

//L5
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

//Level 5
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", (req,res)=>{
  res.render("home");
})
app.get("/logout", (req,res)=>{
  req.logout();
  res.redirect("/");
})
/////////////////////////// ROUTE SECRETS //////////////////
app.route("/secrets")
//// GET
.get((req,res)=>{
  if(req.isAuthenticated()){
    res.render("secrets")
  } else {
    res.redirect("/login")
  }
});
//////////////////////// ROUTE LOGIN //////////////////
app.route("/login")
//// GET
.get((req,res)=>{
  res.render("login");
})
//// POST
.post((req,res)=>{
  const user = new User({
    username: req.body.username,
    password: req.body.password
  })
  req.login(user, (err)=>{
    if(err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req,res,()=>{
        res.redirect("/secrets");
      });
    }
  })

});
//////////////////////// ROUTE REGISTER //////////////////
app.route("/register")
//// GET
.get((req,res)=>{
  res.render("register");
})
//// POST
.post((req,res)=>{
  User.register({username: req.body.username}, req.body.password, (err,user)=>{
    if(err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req,res,()=>{
        res.redirect("/secrets");
      });
    }
  })
});



app.listen(3000, ()=>{
  console.log("Server listening on port 3000");
})
