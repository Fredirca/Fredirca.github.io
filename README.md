# flipcoin

Flipcoin is a proof of concept coin flip gambling site written in NodeJS. The main goal of this site is to provide the user with a probability fair system which allows the user to verify the integrity of each game they play. To verify the game users may use this [script](https://repl.it/repls/SkeletalSquigglyClasses).

### TODO:

 - Implement history feature so players can view past games/hashes associated with them.

### Installation
Setup:

```sh
git clone https://github.com/suite/flipcoin.git
cd flipcoin
npm i # "sudo npm i" if you're on macOS or Linux
```

Run After Setup:

```sh
node server.js
```

.env Setup

```sh
SECRET_SALT=    #salt used to generate game secrets
EXPRESS_SALT=   #salt used to encrypt cookies
EXPRESS_SECRET= #discord secret
DB_PASSWORD=    #mongodb password
```
## Screenshots
![1](https://i.imgur.com/VAhRsqD.png)
![2](https://i.imgur.com/86X8kWS.png)
