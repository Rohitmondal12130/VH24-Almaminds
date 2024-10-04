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
const LocalStrategy = require('passport-local');
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;

const twilio = require('twilio');
const otp = require('otplib');


const accountSid = process.env.YOUR_TWILIO_ACCOUNT_SID;
const authToken = process.env.YOUR_TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);


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

passport.use(new LocalStrategy({ usernameField: 'email' }, User.authenticate()));

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


otp.authenticator.options = {
    step: 80,
    window: 1,
  };


// Function to send OTP via SMS
async function sendOTPSMS(toPhoneNumber, otp) {

    const formattedPhoneNumber = toPhoneNumber.startsWith('+') ? toPhoneNumber : `+91${toPhoneNumber}`;

    try {
        const message = await client.messages.create({
            body: `Your OTP is: ${otp}`, // Message content
            to: formattedPhoneNumber, // Recipient phone number
            from: '+12525166516' // Your Twilio phone number
        });
        console.log(`OTP sent via SMS: ${message.sid}`);
    } catch (error) {
        console.error(`Error sending OTP via SMS: ${error.message}`);
    }
}



app.get("/signup", (req, res) => {
    res.render("signup.ejs");
});

app.post('/signup', async (req, res, next) => {
    const { email, password, displayName, phoneNumber } = req.body;

    try {
        const user = new User({ email, displayName, phoneNumber });
        const registeredUser= await User.register(user, password);  // Automatically hashes password
        req.login(registeredUser, (err) => {
            if (err) return next(err);
            console.log("You have successfully registered");
            res.redirect("/profile");
        });
    } catch (err) {
        console.error('Error registering user:', err);
        res.redirect('/signup');
    }
});

app.get('/login',(req,res)=>{
    res.render("login.ejs");
})

app.post('/login', passport.authenticate('local', {failureRedirect: '/login',failureFlash: true}),async(req,res)=>{
    req.session.userid = req.user.id;
  // const otpCode = Math.floor(100000 + Math.random() * 900000);
  const otpSecret = otp.authenticator.generateSecret();
  req.session.otpSecret = otpSecret;

  const otpCode = otp.authenticator.generate(otpSecret);

  req.session.otpCode = otpCode;

  const tophoneNumber  = req.user.phoneNumber;  // Assuming you have user's phone in DB
  await sendOTPSMS(tophoneNumber, otpCode);
  console.log(req.user)

  res.redirect('/verify-otp');
});

app.get('/verify-otp', (req, res) => {
    res.render('verify-otp.ejs');
  });


app.post('/verify-otp', (req, res) => {
    const userInputOtp = req.body.otp;

    const storedOtp = req.session.otpCode;
    const otpSecret = req.session.otpSecret;
  
    // Verify the OTP
    console.log('User Input OTP:', userInputOtp);
    console.log('Stored OTP Secret:', otpSecret);
    console.log('Stored OTP :', storedOtp);
  
    const isValid = otp.authenticator.check(userInputOtp, otpSecret);
  
    if (isValid) {
      // OTP is valid
      console.log('OTP verified successfully');
      req.session.otpSecret = null;
      req.session.otpCode = null;
      req.session.userType = 'user';
      res.redirect('/profile');
    } else {
      console.log('Invalid OTP');
      res.send('Invalid OTP. Please try again.');
    }
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


app.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if(err){
            return next(err);
          }
        req.flash("success", "You have logged out");
        res.redirect("/");
    });
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


