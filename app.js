if (process.env.NODE_ENV != "production") {
    require('dotenv').config();
}

const express = require("express");
const app= express();
const mongoose = require("mongoose");
const User = require("./models/user.js");
const ejs = require('ejs');
const path = require("path");
const ejsMate = require("ejs-mate");
// const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const bodyParser = require('body-parser')

const session = require('express-session')
const passport = require('passport');

const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;


const MONGO_URL ="mongodb://127.0.0.1:27017/vcet";
// const dbUrl = process.env.ATLASDB_URL;

main().then(() =>{
   console.log("connected to db");
}).catch((err) =>{
    console.log(err);
});

async function main(){
    await mongoose.connect(MONGO_URL);
};

app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended: true}));
app.use(bodyParser.json())

app.engine('ejs', ejsMate);

app.use(session({
    secret: 'vcet',
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    }
  }));

// app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:8080/auth/google/callback",
    passReqToCallback: true
},
async (request, accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
            user = new User({
                googleId: profile.id,
                email: profile.email,
                displayName: profile.displayName
            });
            await user.save();
        }
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

app.get("/", (req, res) => {
    res.render("login");
});

app.get("/auth/google", passport.authenticate("google", {
    scope: ["profile", "email"]
}));

app.get("/auth/google/callback", passport.authenticate("google", {
    failureRedirect: "/"
}), async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, { lastLogin: new Date() });
        res.redirect("/profile");
    } catch (err) {
        // Handle error
        console.error("Error updating last login time:", err);
        res.redirect("/error");
    }
});


app.get("/profile", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("profile", { user: req.user });
    } else {
        res.redirect("/");
    }
});

app.all("*", (req, res, next)=>{
    next(new ExpressError (404,"page not found!")) ;
 });
 
 app.use((err, req ,res , next)=>{
  let{status=500, message="Something went wrong"} = err;  
  res.render("error.ejs",{message});
  //res.status(status).send(message);
 });

app.listen(8080, ()=>{
    console.log("server is listening to port 8080");
}); 


