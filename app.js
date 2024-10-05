if (process.env.NODE_ENV != "production") {
    require('dotenv').config();
}

const express = require("express");
const app = express();
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
const crypto = require('crypto'); // Import crypto for hashing
const LocalStrategy = require('passport-local');
const GoogleStrategy = require('passport-google-oauth2').Strategy;

const twilio = require('twilio');
const nodemailer = require('nodemailer');
const otp = require('otplib');


const accountSid = process.env.YOUR_TWILIO_ACCOUNT_SID;
const authToken = process.env.YOUR_TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);
const bcrypt = require('bcrypt');
// const { Vonage } = require('@vonage/server-sdk')

const MONGO_URL = "mongodb://127.0.0.1:27017/vcet";
// const dbUrl = process.env.ATLASDB_URL;

main().then(() => {
    console.log("connected to db");
}).catch((err) => {
    console.log(err);
});

async function main() {
    await mongoose.connect(MONGO_URL);
};

app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
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


// // Function to send OTP via SMS
// async function sendOTPSMS(toPhoneNumber, otp) {

//     const formattedPhoneNumber = toPhoneNumber.startsWith('+') ? toPhoneNumber : `+91${toPhoneNumber}`;

//     try {
//         const message = await client.messages.create({
//             body: `Your OTP is: ${otp}`, // Message content
//             to: formattedPhoneNumber, // Recipient phone number
//             from: '+12525166516' // Your Twilio phone number
//         });
//         console.log(`OTP sent via SMS: ${message.sid}`);
//     } catch (error) {
//         console.error(`Error sending OTP via SMS: ${error.message}`);
//     }
// }

// const vonage = new Vonage({
//     apiKey: "879adbdd",
//     apiSecret: "QHYtGiANZnpURL7I"
// })



// async function sendOTPSMS(toPhoneNumber, otpCode) {
//     return new Promise((resolve, reject) => {
//         vonage.sms.send(
//             "Vonage APIs", // Sender ID or phone number
//             toPhoneNumber, // Recipient's phone number
//             `Your OTP code is: ${otpCode}`, // The OTP code in the SMS body
//             (err, responseData) => {
//                 if (err) {
//                     return reject(err); // Handle any errors
//                 }
//                 if (responseData.messages[0]["status"] === "0") {
//                     console.log("Message sent successfully.");
//                     resolve();
//                 } else {
//                     console.log(
//                         `Message failed with error: ${responseData.messages[0]["error-text"]}`
//                     );
//                     reject(new Error(responseData.messages[0]["error-text"]));
//                 }
//             }
//         );
//     });
// }

// Create a transporter using Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'sivachatbot@gmail.com',
      pass: 'zyullbomcvdmailh'
    }
  });
  
  // Function to send OTP
  const sendOTP = async (useremail, otpCode) => {
    try {
      await transporter.sendMail({
        from: 'sivachatbot@gmail.com',
        to: useremail,
        subject: 'Your OTP Code',
        text: `Your OTP code is: ${otpCode}`,
      });
      console.log('OTP sent successfully');
    } catch (error) {
      console.error('Error sending OTP:', error);
    }
  };
  


const subjects = [
    "Penguin", "Toaster", "Galaxy", "Umbrella", "Dragon", "Sunset", "Pirate", "Violin",
    "Cactus", "Spaceship", "Octopus", "Comet", "Zebra", "Phoenix", "Samurai", "Puzzle",
    "Tornado", "Fountain", "Oyster", "Monolith", "Magnet", "Mirror", "Quantum", "Satellite",
    "Robot", "Algorithm", "Wanderer", "Vortex", "Whale", "Minotaur", "Compass", "Serpent",
    "Monarch", "Jungle", "Crystal", "Labyrinth", "Cipher", "Oracle", "Prophet", "Chronicle",
    "Voyage", "Asteroid", "Scorpion", "Nebula", "Sphinx", "Glacier", "Maze", "Phoenix", "Mystic"
];
const verbs = [
    "dances", "gobbles", "radiates", "invents", "tickles", "detonates", "compresses",
    "encrypts", "decodes", "magnifies", "absorbs", "shatters", "awakens", "constructs",
    "dissolves", "combines", "reflects", "splits", "transforms", "orbits", "connects",
    "stretches", "blinks", "whispers", "soars", "travels", "collides", "expands", "drifts",
    "evolves", "transmits", "calculates", "sparks", "ignites", "navigates", "explores",
    "projects", "stores", "flows", "flickers", "warps", "conjures", "unfolds", "reverses"
];
const objects = [
    "treasure", "sandcastle", "equation", "peanut", "paradox", "meteor", "bubble", "puzzle",
    "infinity", "aurora", "tiger", "scroll", "diamond", "planet", "machine", "galaxy", "horizon",
    "nebula", "storm", "whisper", "lightning", "veil", "mirror", "pendulum", "shadow", "cipher",
    "cloud", "echo", "riddle", "key", "pyramid", "veil", "starship", "dragonfly", "phoenix",
    "hourglass", "cipher", "element", "artifact", "compass", "quark", "dimension", "illusion",
    "labyrinth", "mask", "asteroid", "nebula", "solitude", "rift"
];
const adjectives = [
    "purple", "shiny", "enigmatic", "chaotic", "electric", "sublime", "invisible", "ethereal",
    "cosmic", "spectral", "fractal", "mysterious", "cryptic", "phantom", "celestial", "arcane",
    "vibrant", "elusive", "translucent", "timeless", "celestial", "obscure", "quantum", "luminescent",
    "paradoxical", "abstract", "elusive", "infinite", "blazing", "ephemeral", "hidden", "whirling",
    "vivid", "fractured", "illuminated", "surreal", "epic", "boundless", "everlasting", "mirrored",
    "enchanted", "multidimensional", "tangled", "enigmatic", "chaotic"
];

// Function to generate a unique random phrase
function generateRandomPhrase() {
    const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
    const randomVerb = verbs[Math.floor(Math.random() * verbs.length)];
    const randomObject = objects[Math.floor(Math.random() * objects.length)];
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];

    return `The ${randomAdjective} ${randomSubject} ${randomVerb} the ${randomObject}`;
}

// Function to send random phrase via SMS
async function sendRandomPhraseSMS(toPhoneNumber, userEmail) {
    const randomPhrase = generateRandomPhrase();
    const updatedUser = await User.findOneAndUpdate(
        { email: userEmail }, // Query to find the user by email
        { randomPhrase }, // Update the randomPhrase field
        { new: true } // Return the updated document
    );
    if (updatedUser) {
        console.log(updatedUser);
    }
    const formattedPhoneNumber = toPhoneNumber.startsWith('+') ? toPhoneNumber : `+91${toPhoneNumber}`;

    try {
        const message = await client.messages.create({
            body: `Please make sure to note this customized phrase in case you forget your password in the future : "${randomPhrase}"`, // Message content
            to: formattedPhoneNumber, // Recipient phone number
            from: '+19258923514' // Your Twilio phone number
        });
        console.log(`Random phrase sent via SMS: ${message.sid}`);
    } catch (error) {
        console.error(`Error sending random phrase via SMS: ${error.message}`);
    }
}


app.get("/index", (req, res) => {
    res.render("index.ejs");
});

app.get("/admin", (req, res) => {
    res.render("admin.ejs");
});


app.get("/signup", (req, res) => {
    res.render("signup.ejs");
});

app.post('/signup', async (req, res, next) => {
    const { email, password, displayName, phoneNumber } = req.body;
    const toPhoneNumber = phoneNumber;
    const userEmail = email;
    try {
        const user = new User({ email, displayName, phoneNumber });
        const registeredUser = await User.register(user, password);  // Automatically hashes password
        console.log("You have successfully registered");
        await sendRandomPhraseSMS(toPhoneNumber, userEmail);
        res.redirect('/login')
    } catch (err) {
        console.error('Error registering user:', err);
        res.redirect('/signup');
    }
});

app.get('/login', (req, res) => {
    res.render("login.ejs");
})

app.get('/forget', (req, res) => {
    res.render("forget-password.ejs");
})

// Handle the forget password form submission


app.post('/forget', async (req, res) => {
    const { email, randomPhrase, newPassword } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });
    
    console.log('User found:', user);
    
    if (!user) {
        return res.status(400).send('No user found with that email.');
    }

    // Check if the random phrase matches
    if (user.randomPhrase !== randomPhrase) {
        return res.status(400).send('Invalid random phrase.');
    }

    // Check if the salt exists
    if (!user.salt) {
        return res.status(500).send('Error: User salt not found. Cannot update password.');
    }

    // Generate a new hash for the new password using the existing salt
    try {
        const salt = user.salt; // Use existing salt
        const hash = crypto.pbkdf2Sync(newPassword, salt, 10000, 64, 'sha512').toString('hex'); // Create a new hash

        // Update the user's hash
        user.hash = hash;

        await user.save(); // Save the updated user document

        // Optionally log in the user automatically after password reset
        req.login(user, (err) => {
            if (err) {
                return res.status(500).send('Error logging in after password reset.');
            }
            res.redirect('/dashboard'); // Redirect to the dashboard or another page
        });
    } catch (error) {
        console.error('Error hashing password:', error);
        res.status(500).send('Error updating password.');
    }
});



app.post('/login', passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }), async (req, res) => {
    req.session.userid = req.user.id;
    // const otpCode = Math.floor(100000 + Math.random() * 900000);
    const otpSecret = otp.authenticator.generateSecret();
    req.session.otpSecret = otpSecret;

    const otpCode = otp.authenticator.generate(otpSecret);

    req.session.otpCode = otpCode;

    const useremail = req.user.email;  // Assuming you have user's phone in DB
    await sendOTP(useremail, otpCode);
    console.log(req.user);

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
        if (err) {
            return next(err);
        }
        req.flash("success", "You have logged out");
        res.redirect("/");
    });
});

app.all("*", (req, res, next) => {
    next(new ExpressError(404, "page not found!"));
});

app.use((err, req, res, next) => {
    let { status = 500, message = "Something went wrong" } = err;
    res.render("error.ejs", { message });
    //res.status(status).send(message);
});

app.listen(8080, () => {
    console.log("server is listening to port 8080");
});

