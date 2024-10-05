const express = require("express");
const mongoose = require("mongoose");
const useragent = require("express-useragent");
const requestIp = require("request-ip");
const geoip = require("geoip-lite");
const bcrypt = require("bcrypt");
const axios = require("axios");
const path = require("path");
const fs = require("fs"); // Import fs for file handling

// MongoDB connection
mongoose
  .connect(
    "mgodb.net/userTracking?retryWrites=true&w=majority"
  )
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// User Schema (for actual user data)
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", UserSchema);

// UserAction Schema
const UserActionSchema = new mongoose.Schema({
  username: { type: String, required: true },
  action: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  ipAddress: { type: String, required: false },
  deviceInfo: { type: String, required: false },
  location: { type: String, required: false },
  sessionDuration: { type: Number, required: false }, // in milliseconds
  failedLoginAttempts: { type: Number, default: 0 }, // Counter for failed logins
  lastFailedLogin: { type: Date, default: null }, // Timestamp of the last failed login
  isBlocked: { type: Boolean, default: false }, // If user is blocked
});

const UserAction = mongoose.model(
  "UserAction",
  UserActionSchema,
  "UserActions"
);

// Create an instance of Express
const app = express();

// Middleware for user agent and IP address
app.use(useragent.express());
app.use(requestIp.mw());
app.use(express.json()); // Middleware to parse JSON bodies

app.use(express.static(path.join(__dirname, "../public")));

// Function to fetch the public IP address
async function getPublicIP(req) {
  try {
    const response = await axios.get("https://api.ipify.org?format=json");
    return response.data.ip;
  } catch (error) {
    console.error("Error fetching public IP:", error);
    return null; // Return null if unable to fetch the public IP
  }
}

// Function to get location from IP
function getLocationFromIP(ipAddress) {
  const geo = geoip.lookup(ipAddress);
  return geo ? `${geo.city}, ${geo.country}` : "Unknown";
}

// Function to append logs to a text file
// Function to append logs to a text file with a blank line between entries
function logToFile(data) {
  const logData = 
    `username: ${data.username}\n` +
    `action: ${data.action}\n` +
    `ipAddress: ${data.ipAddress}\n` +
    `deviceInfo: ${data.deviceInfo}\n` +
    `location: ${data.location}\n` +
    `failedLoginAttempts: ${data.failedLoginAttempts}\n` +
    `lastFailedLogin: ${data.lastFailedLogin}\n` +
    `isBlocked: ${data.isBlocked}\n` +
    `sessionDuration: ${data.sessionDuration}\n\n`; // Add two newlines for separation

  fs.appendFile("userActionsLog.txt", logData, (err) => {
    if (err) {
      console.error("Error writing to log file:", err);
    }
  });
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Sign-Up Endpoint
app.post("/api/signup", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send({ message: "Email already in use." });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });

    await newUser.save();

    // Log signup action
    const userAction = new UserAction({
      username: email,
      action: "Sign Up",
      ipAddress: await getPublicIP(req),
      deviceInfo: req.useragent.source,
      location: getLocationFromIP(await getPublicIP(req)),
    });

    await userAction.save();
    logToFile(userAction); // Append the user action log to the file

    res.status(201).send({ message: "User registered successfully." });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});


// Sign-In Endpoint
app.post("/api/signin", async (req, res) => {
  const { email, password } = req.body;
  const deviceInfo = req.useragent.source;
  const publicIP = await getPublicIP(req);
  const location = getLocationFromIP(publicIP);
  const loginStartTime = Date.now();

  try {
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      // Create or update userAction based on email
      let userAction = await UserAction.findOne({ username: email });

      if (!userAction) {
        userAction = new UserAction({
          username: email,
          action: "Login Failed",
          ipAddress: publicIP,
          deviceInfo,
          location,
        });
      }

      // Increment failed login attempts
      userAction.failedLoginAttempts += 1;
      userAction.lastFailedLogin = new Date();

      // Block the user after multiple failed attempts
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000); 
      if (
        userAction.failedLoginAttempts > 5 &&
        userAction.lastFailedLogin > twoMinutesAgo
      ) {
        userAction.isBlocked = true;
        await userAction.save();
        return res.status(403).send({
          message:
            "Your account is temporarily blocked due to multiple failed login attempts. Please try again later.",
        });
      }

      await userAction.save();
      logToFile(userAction);
      return res.status(400).send({ message: "Invalid credentials." });
    }

    // Check password match
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      let userAction = await UserAction.findOne({ username: email });

      if (!userAction) {
        userAction = new UserAction({
          username: email,
          action: "Login Failed",
          ipAddress: publicIP,
          deviceInfo,
          location,
        });
      }

      userAction.failedLoginAttempts += 1;
      userAction.lastFailedLogin = new Date();

      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      if (
        userAction.failedLoginAttempts > 5 &&
        userAction.lastFailedLogin > twoMinutesAgo
      ) {
        userAction.isBlocked = true;
        await userAction.save();
        return res.status(403).send({
          message:
            "Your account is temporarily blocked due to multiple failed login attempts. Please try again later.",
        });
      }

      await userAction.save();
      logToFile(userAction);
      return res.status(400).send({ message: "Invalid credentials." });
    }

    // Reset failed attempts and log successful login
    let userAction = await UserAction.findOne({ username: email });
    if (userAction) {
      userAction.failedLoginAttempts = 0;
      userAction.lastFailedLogin = null;
      userAction.isBlocked = false;
      userAction.action = "Login";
      userAction.timestamp = new Date();
      userAction.sessionDuration = Date.now() - loginStartTime;

      await userAction.save();
      logToFile(userAction);
    }

    res.status(200).send({ message: "Login successful" });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
