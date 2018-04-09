# Cryptocurrency-API
A RESTful API for the back-end of Cryptocurrency-Tracker.

## Usage
This API establishes a connection to a MongoDB database using Mongoose and Express.

When a user registers, a POST request is sent to the server to add the new user to the database. 
```
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
```

If the registration is successful, the new user will be added to the database with a hashed password via bcrypt.
```
module.exports.addUser = function(newUser, callback){
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
            if(err) throw err;
            newUser.password = hash;
            newUser.save(callback);
        });
    });
}
```

When the user is ready to login, their entered username and password will be compared to the stored username and hashed password in the MongoDB database. If successful, a new JSON Web Token is created.
```
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
```

Lastly, passport is used to validate the user with their provided JSON Web Token.
```
router.get('/profile', passport.authenticate('jwt', { session: false }), (req, res, next) => {
    res.json({ user: req.user });
});
```
