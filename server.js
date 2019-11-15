require("dotenv").config();
const express = require("express");
const { getSecret, flipCoin } = require("./gamble");

const session = require("express-session");
const Strategy = require("passport-discord").Strategy;
const passport = require("passport");
const mongoose = require("mongoose");

const port = 3000;

var bodyParser = require("body-parser");

var app = express();

const uri = `mongodb+srv://root:${process.env.DB_PASSWORD}@cluster0-f1lpy.mongodb.net/test?retryWrites=true&w=majority`;

const User = require("./models/User");

//Connenct to db
mongoose.connect(uri, { useNewUrlParser: true });

app.set("view engine", "ejs");

app.use(bodyParser.json());
app.use(express.static("public"));

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

passport.use(
  new Strategy(
    {
      clientID: "609157033471770636",
      clientSecret: process.env.EXPRESS_SECRET,
      callbackURL: "http://localhost:3000/api/callback",
      scope: ["identify"]
    },
    (accessToken, refreshToken, profile, done) => {
      User.findOne(
        {
          discordId: profile.id
        },
        (err, user) => {
          if (err) return done(err);

          if (!user) {
            console.log("creating user");
            new User({
              discordId: profile.id,
              clientId: profile.id,
              username: profile.username
            }).save(function(err) {
              if (err) console.log(err);
              console.log("created user");
              return done(null, user);
            });
          } else {
            console.log("user already created");
            return done(null, user);
          }
        }
      );
    }
  )
);

app.use(
  session({
    secret: process.env.EXPRESS_SALT,
    // cookie: { maxAge: 60000 },
    resave: false,
    saveUninitialized: false
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static("dist"));

const checkAuth = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.redirect("/");
};

app.get(
  "/api/login",
  passport.authenticate("discord", { scope: ["identify"] }),
  (req, res) => {}
);

app.get(
  "/api/callback",
  passport.authenticate("discord", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/");
  }
);

app.get("/api/info", checkAuth, (req, res) => {
  User.findOne(
    {
      discordId: req.user.discordId
    },
    (err, user) => {
      if (err) return res.json({ status: "error" });

      if (!user) {
        return res.json({ status: "error" });
      } else {
        return res.json(user);
      }
    }
  );
});

app.get("/api/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

app.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    return res.render("index.ejs");
  }

  return res.sendFile(__dirname + "/views/auth.html");
});

app.post("/api/flip", checkAuth, (req, res) => {
  User.findOne(
    {
      discordId: req.user.discordId
    },
    (err, user) => {
      if (err) return res.json({ status: "error" });

      if (user) {
        const coinSides = ["Heads", "Tails"];

        const choice = req.body["choice"];
        let betAmount = req.body["betAmount"];

        //Error handling
        if (!coinSides.includes(choice)) return res.json({ status: "error" });
        if (!betAmount) return res.json({ status: "error" });
        if (isNaN(parseInt(betAmount))) return res.json({ status: "error" });

        if (parseInt(betAmount) > user["bits"])
          return res.json({ status: "error" });

        const clientId = user["clientId"];
        const secret = getSecret();
        const nonce = user["nonce"].toString();
        const result = flipCoin(secret, clientId, nonce);
        const winner = result === choice ? true : false;

        let updatedNonce = user["nonce"] + 1;
        let updatedBits = user["bits"] - parseInt(betAmount);

        updatedBits = Math.round(updatedBits * 1e12) / 1e12;

        user.updateOne({ nonce: updatedNonce, bits: updatedBits }).exec();

        return res.json({
          status: "success",
          info: {
            winner,
            choice,
            result,
            secret,
            clientId,
            nonce,
            updatedBits
          }
        });
      } else {
        return res.json({ status: "error" });
      }
    }
  );
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
