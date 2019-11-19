require("dotenv").config();
const crypto = require("crypto");
const Chance = require("chance");
const mongoose = require("mongoose");

const DailySecret = require("./models/DailySecret");

const generateDailySecret = (fn) => {
    let newDailyToken = crypto
        .createHash("sha256")
        .update(`${new Date().getTime().toString()}-${process.env.SECRET_SALT}`)
        .digest("hex");

    new DailySecret({
      secret: newDailyToken
    }).save(function(err) {
      if (err) console.log(err);
      console.log(`Generated new daily token: ${newDailyToken}`);
      return fn(newDailyToken);
    });
}

const getSecret = (fn) => {
  console.log("Fetching daily secret...")
  DailySecret.findOne({}, {}, { sort: { 'dateAdded' : -1 } }, function(err, secret) { 
    if(err) return console.log("error")
    
    if(secret === null) {
      generateDailySecret(dailySecret => fn(dailySecret))
    } else {
      return fn(secret["secret"]);
    }
  })
};

const generateSeed = (clientSecret, nonce, fn) => {
  getSecret(dailySecret => {
    console.log(dailySecret)
    clientSecretAndNounce = `${dailySecret}-${clientSecret}-${nonce}`;

    return fn(crypto
      .createHash("sha256")
      .update(clientSecretAndNounce)
      .digest("hex"));
    })
};

const flipCoin = (clientSecret, nonce, fn) => {
  let coinSides = ["Heads", "Tails"];

  generateSeed(clientSecret, nonce, seed => {
    return fn(new Chance(seed).shuffle(coinSides)[0]);
  });

};

module.exports = {
  getSecret,
  generateSeed,
  flipCoin,
  generateDailySecret
};
