require("dotenv").config();
const express = require("express");
const { flipCoin, generateDailySecret } = require("./gamble");

const session = require("express-session");
const Strategy = require("passport-discord").Strategy;
const passport = require("passport");
const mongoose = require("mongoose");

const port = 3000;

var bodyParser = require("body-parser");

var app = express();

const uri = `mongodb+srv://root:${process.env.DB_PASSWORD}@cluster0-f1lpy.mongodb.net/test?retryWrites=true&w=majority`;

const User = require("./models/User");
const DailySecret = require("./models/DailySecret");

//Connenct to db
mongoose.connect(uri, { useUnifiedTopology: true, useNewUrlParser: true });

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
    return res.sendFile(__dirname + "/views/index.html");
  }

  return res.sendFile(__dirname + "/views/auth.html");
});

app.post("/api/clientid", checkAuth, (req, res) => {
  User.findOne(
    {
      discordId: req.user.discordId
    },
    (err, user) => {
      if (err) return res.json({ status: "error" });
      if (user) {
        const clientId = req.body["clientId"];

        //Not required...
        if (!clientId) {
          let newClientId = `${user["discordId"]}`;

          user.updateOne({ clientId: newClientId }).exec();

          return res.json({ status: "success" });
        } else {
          let newClientId = `${user["discordId"]}_${clientId}`;

          user.updateOne({ clientId: newClientId }).exec();

          return res.json({ status: "success" });
        }
      } else {
        return res.json({ status: "error" });
      }
    }
  );
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
        if (isNaN(parseFloat(betAmount))) return res.json({ status: "error" });

        if (parseFloat(betAmount) > user["bits"])
          return res.json({ status: "error" });

        if (parseFloat(betAmount) <= 0) return res.json({ status: "error" });

        const clientId = user["clientId"];
        const nonce = user["nonce"].toString();
        flipCoin(clientId, nonce, result => { 
          const winner = result === choice ? true : false;

          let updatedNonce = user["nonce"] + 1;
          let updatedBits = user["bits"] - parseFloat(betAmount);

          if (winner) updatedBits = updatedBits + parseFloat(betAmount) * 1.98;

          updatedBits = Math.round(updatedBits * 1e12) / 1e12;

          user.updateOne({ nonce: updatedNonce, bits: updatedBits }).exec();

          return res.json({
            status: "success",
            info: {
              winner,
              choice,
              result,
              clientId,
              nonce,
              updatedBits
            }
          });
        });
      } else {
        return res.json({ status: "error" });
      }
    }
  );
});

app.get("/api/secrets", (req, res) => {
  DailySecret.find({}, {}, { sort: { 'dateAdded' : -1 } }, function(err, secrets) { 
    if(err)  return res.json({ status: "error" });
    
    if(secrets === null) return res.json([])
      
    const newSecrets = secrets.slice(1)
    return res.json(newSecrets)
  })
})

//Generate new daily secret every 12 hours... (Checking every minute)
setInterval(() => {
  DailySecret.findOne({}, {}, { sort: { 'dateAdded' : -1 } }, function(err, secret) { 
    if(err) return console.log("error creating new key")
    
    if(secret === null) {
      generateDailySecret(token => console.log(`No key found. Generated new token ${token}`))
    } else if(new Date().getTime() >= secret["dateAdded"].getTime()+(1000*60*60*12)) {
      generateDailySecret(token => console.log(`12 hours has passed. Generated new token ${token}`))
    } else {
      console.log("No new daily secret needed...")
    }
  })
}, 1000*60)

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
