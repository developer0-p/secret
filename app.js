//jshint esversion:6
require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const Strategy = require('passport-facebook').Strategy;


const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));
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
const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  googleId: String,
  facebookId: String,
  secret: String
});

//L5
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

//Level 5
passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET ,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
//************************************
// Configure the Facebook strategy for use by Passport.
//
// OAuth 2.0-based strategies require a `verify` function which receives the
// credential (`accessToken`) for accessing the Facebook API on the user's
// behalf, along with the user's profile.  The function must invoke `cb`
// with a user object, which will be set at `req.user` in route handlers after
// authentication.
passport.use(new Strategy({
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/facebook/secrets'
  },
  function(accessToken, refreshToken, profile, cb) {
    // In this example, the user's Facebook profile is supplied as the user
    // record.  In a production-quality application, the Facebook profile should
    // be associated with a user record in the application's database, which
    // allows for account linking and authentication with other identity
    // providers.
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
    // return cb(null, profile);
  }));

  //*******************************
app.get("/", (req,res)=>{
  res.render("home");
});
//*******************google**********
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });
//**********************facebook****
app.get('/auth/facebook',
  passport.authenticate('facebook' ));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });
  //*******
app.get("/logout", (req,res)=>{
  req.logout();
  res.redirect("/");
});
/////////////////////////// ROUTE SECRETS //////////////////
app.route("/secrets")
//// GET
.get((req,res)=>{
  User.find({"secret": {$ne:null}}, (err,foundUsers)=>{
    if (err) {
      console.log(err);
    } else {
      if (foundUsers) {
        res.render("secrets", {userWithSecrets: foundUsers})
      }
    }
})
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
app.get("/submit", (req,res)=>{
  if(req.isAuthenticated()){
    res.render("submit")
  } else {
    res.redirect("/login")
  }
});
app.post("/submit", (req,res)=>{
  const submittedSecret = req.body.secret
  User.findById(req.user.id, (err,foundUser)=>{
    if (err) {
      console.log(err);
    } else {
      if (foundUser){
        foundUser.secret = submittedSecret;
        foundUser.save(()=>{
          res.redirect("/secrets")
        });
      }
    }
  });
});


app.listen(3000, ()=>{
  console.log("Server listening on port 3000");
})
