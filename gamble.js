require("dotenv").config();
const crypto = require("crypto");
const Chance = require("chance");

const getSecret = () => {
  return crypto
    .createHash("sha256")
    .update(`${new Date().getTime().toString()}-${process.env.SECRET_SALT}`)
    .digest("hex");
};

const generateSeed = (dailySecret, clientSecret, nonce) => {
  clientSecretAndNounce = `${dailySecret}-${clientSecret}-${nonce}`;

  return crypto
    .createHash("sha256")
    .update(clientSecretAndNounce)
    .digest("hex");
};

const flipCoin = (dailySecret, clientSecret, nonce) => {
  let coinSides = ["Heads", "Tails"];

  let seed = generateSeed(dailySecret, clientSecret, nonce);

  return new Chance(seed).shuffle(coinSides)[0];
};

module.exports = {
  getSecret,
  generateSeed,
  flipCoin
};
