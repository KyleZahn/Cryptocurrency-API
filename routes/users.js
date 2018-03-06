const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const config = require('../config/database');
const User = require('../models/user');

/*
    POST request to register the user.
*/
router.post('/register', (req, res, next) => {
    let newUser = new User({
        email: req.body.email,
        username: req.body.username,
        password: req.body.password,
        bitcoin: req.body.bitcoin,
        ether: req.body.ether,
        litecoin: req.body.litecoin
    });

    User.addUser(newUser, (err, user) => {
        if (err) {
            res.json({ success: false, msg: 'Failed to register user.' });
        } else {
            res.json({ success: true, msg: 'User registered!' });
        }
    });
});

/*
    POST request to change the user's bitcoin amount in the MongoDB database.
*/
router.post('/bitcoin', passport.authenticate('jwt', { session: false }), function (req, res) {
    const bitcoin = req.body.bitcoin;
    const user = req.user;

    user.bitcoin = bitcoin;
    user.save();
    res.json(({ success: true, msg: 'Bitcoin changed!' }))
});


/*
    POST request to authenticate the user. Comapares the entered values to the users information
    from the database, then generates a new js token.
*/
router.post('/authenticate', (req, res, next) => {
    const password = req.body.password;
    const username = req.body.username;

    User.getUserByUsername(username, (err, user) => {
        if (err) throw err;
        if (!user) {
            return res.json({ success: false, msg: 'User not found.' })
        }
        User.comparePassword(password, user.password, (err, isMatch) => {
            if (err) throw err;
            if (isMatch) {
                const token = jwt.sign({ data: user }, config.secret, {
                    expiresIn: 604800 // 1 week expiration time.
                });

                res.json({
                    success: true,
                    token: 'JWT ' + token,
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email
                    }
                });
            } else {
                return res.json({ success: false, msg: 'The password you have entered is wrong.' });
            }
        });
    });
});

/*
    Authenticates the user with the provided js token.
*/
router.get('/profile', passport.authenticate('jwt', { session: false }), (req, res, next) => {
    res.json({ user: req.user });
});



module.exports = router;
