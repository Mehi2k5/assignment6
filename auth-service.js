require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    userName: {
        type: String,
        unique: true
    },
    password: String,
    email: String,
    loginHistory: [{
        dateTime: Date,
        userAgent: String
    }]
});

let User;

function initialize() {
    return new Promise((resolve, reject) => {
        let db = mongoose.createConnection(process.env.MONGODB);

        db.on('error', err => {
            reject(err);
        });

        db.once('open', () => {
            User = db.model("users", userSchema);
            resolve();
        });
    });
}

function registerUser(userData) {
    return new Promise((resolve, reject) => {
        if (userData.password !== userData.password2) {
            reject("Wrong Password");
        } else {
            bcrypt.hash(userData.password, 10)
                .then(hash => {
                    userData.password = hash;
                    let newUser = new User(userData);
                    newUser.save()
                        .then(() => resolve())
                        .catch(err => {
                            if (err.code === 11000) {
                                reject("You are using an exists user name, try another one");
                            } else {
                                reject("Try again we countered problem: " + err);
                            }
                        });
                })
                .catch(() => {
                    reject("Encryptying passowrd failed");
                });
        }
    });
}

function checkUser(userData) {
    return new Promise((resolve, reject) => {
        User.find({ userName: userData.userName })
            .then(users => {
                if (users.length === 0) {
                    reject("User name too short: " + userData.userName);
                } else {
                    bcrypt.compare(userData.password, users[0].password)
                        .then(result => {
                            if (result === true) {
                                if (users[0].loginHistory.length === 8) {
                                    users[0].loginHistory.pop();
                                }
                                users[0].loginHistory.unshift({
                                    dateTime: (new Date()).toString(),
                                    userAgent: userData.userAgent
                                });

                                User.updateOne(
                                    { userName: users[0].userName },
                                    { $set: { loginHistory: users[0].loginHistory } }
                                )
                                    .then(() => resolve(users[0]))
                                    .catch(err => reject("Cannot verify right user name: " + err));
                            } else {
                                reject("Password Incorrect: " + userData.userName);
                            }
                        });
                }
            })
            .catch(() => {
                reject("No username in database match: " + userData.userName);
            });
    });
}

module.exports = {
    initialize,
    registerUser,
    checkUser
};