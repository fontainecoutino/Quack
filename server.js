/*
    NAME: Fontaine Coutino
    DATE: August 12, 2020
    COURSE: CS 337
    ASSIGNMENT: FINAL; Quack
    FILE: server.js
    PURPOSE: Responsible for Quack server using NodeJs and express. Server 
    displays public_html statically to represent Quack. Uses MongoDb in 
    order to store users, posts, and comments. Cookies are used in order to 
    start sessions and leave the user logged in.
*/

const express = require('express');
const mongoose = require('mongoose');
const parser = require('body-parser');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const multer = require('multer');
const {
    nextTick
} = require('process');
const {
    ChangeStream
} = require('mongodb');

const app = express();
app.use(parser.json());
app.use(parser.urlencoded({
    extended: true
}));
app.use(cookieParser());

// Express location
const ip = 'localhost';
const port = 5000;

// MongoDB location
const db = mongoose.connection;
const mongoDBURL = 'mongodb://127.0.0.1/quack'

// Images location
const upload = multer({
    dest: __dirname + '/public_html/img'
});

/* -------------------------------------------------------------------------- */
/*                                   Cookies                                  */
/* -------------------------------------------------------------------------- */

const cookieTime = 60000 * 10;

var sessionKeys = {};

/**
 * This function updates servers cookies - key relation in order
 * to maintain users logged in. It deletes the pair whenever the
 * cookie has existed longer than the cookieTime
 */
function updateSessions() {
    let now = Date.now();
    for (e in sessionKeys) {
        if (sessionKeys[e][1] < (now - cookieTime)) {
            delete sessionKeys[e];
        }
    }
}
setInterval(updateSessions, 2000);

/**
 * Authenticates user access to Ostaa. If user has to be logged in
 * which generates a cookie on server and browser, which both have to
 * match password in order to grant access
 */
function authenticate(req, res, page) {
    if (Object.keys(req.cookies).length > 0) {
        // Check login
        let u = req.cookies.login.username;
        let k = req.cookies.login.key;
        if (!sessionKeys[u]) { // Error with cookies
            res.sendFile(__dirname + "/public_html/access.html");

        } else if (sessionKeys[u][0] == k) { // logged in
            res.sendFile(__dirname + "/public_html/index.html");

        } else { // Invalid login
            res.sendFile(__dirname + "/public_html/access.html");
        }

    } else { // Not logged in
        res.sendFile(__dirname + "/public_html/access.html");
    }
}

// Pages that need authentication
app.use('/index.html', (req, res) => {
    res.redirect('/');
});
app.use('/access.html', (req, res) => {
    res.redirect('/');
});

app.get('/cookies', (req, res) => {
    res.send(JSON.stringify(req.cookies));
})

// Quack
app.get('/', authenticate);


/* -------------------------------------------------------------------------- */
/*                                    Mongo                                   */
/* -------------------------------------------------------------------------- */

var Schema = mongoose.Schema;

var CommentSchema = new Schema({
    username: String,
    text: String
});
var Comment = mongoose.model('Comment', CommentSchema);

var PostSchema = new Schema({
    username: String,
    profilePicture: String,
    text: String,
    picture: String,
    likes: [String], // user ids
    comments: [CommentSchema]
});
var Post = mongoose.model('Post', PostSchema);

var UserSchema = new Schema({
    username: String,
    salt: String,
    hash: String,
    profilePicture: String,
    followers: [String], // usernames
    following: [String], // usernames
    likes: Number,
    posts: [String]
});
var User = mongoose.model('User', UserSchema);

// Set up default mongoose connection
mongoose.connect(mongoDBURL, {
    useNewUrlParser: true
});
db.on('error', console.error.bind(console, 'MongoDB connection error:'));


/* -------------------------------------------------------------------------- */
/*                                   Routes                                   */
/* -------------------------------------------------------------------------- */

app.use(express.static('public_html'));

/* --------------------------------- Access --------------------------------- */

const saltIterations = 1000;

/**
 * Responsible for logging in user. Looks for user in database and 
 * then validates that the password is correct. If both are true,
 * it generates cookies for user to start a session.
 */
app.post('/login', (req, res) => {
    let userObj = JSON.parse(req.body.user);
    let username = userObj.username;
    let password = userObj.password;

    // looks for username in db
    User.findOne({
            username: username
        })
        .exec((err, user) => {
            if (!user) { // Username doesn't exist in db
                res.send('User does not exist');

            } else { // Success

                var salt = user.salt;
                crypto.pbkdf2(password, salt, saltIterations, 64, 'sha512', (err, hash) => {
                    if (err) throw err;

                    if (user.hash != hash) {
                        res.send('Incorrect password');

                    } else { // Success
                        // Start session
                        let key = Math.floor(Math.random() * 100000);
                        sessionKeys[username] = [key, Date.now()];
                        res.cookie('login', {
                            username: username,
                            key: key
                        }, {
                            maxAge: cookieTime
                        });
                        res.send('Log in successful')
                    }
                })
            }
        });
});

/**
 * Adds a user to the database. The username and password should be 
 * sent as POST parameter(s).
 */
app.post('/signup', (req, res) => {
    let userObj = JSON.parse(req.body.user);

    // looks for username in db
    User.findOne({
            username: userObj.username
        })
        .exec((err, result) => {
            // Username is valid since it doesn't exist in db
            if (!result) {

                var salt = crypto.randomBytes(64).toString('base64');
                crypto.pbkdf2(userObj.password, salt, saltIterations, 64, 'sha512', (err, hash) => {
                    if (err) throw err;
                    // Stores into DB
                    let user = new User({
                        username: userObj.username,
                        salt: salt,
                        hash: hash,
                        profilePicture: 'defaultProfilePic.jpg',
                        rank: 'unranked',
                        score: 0,
                        followers: [],
                        following: [],
                        likes: 0,
                        posts: []
                    });
                    user.save((err) => {
                        if (err) res.send('Error storing user to DB');
                    });
                    res.send('Added successfully!');
                })

            } else {
                res.send('User already exist')
            }
        });
});

/* ---------------------------------- Home ---------------------------------- */

/**
 * Responsible for displaying home page of user. Based on cookies, it gets
 * the users follower's post and displays them in chronological order. If
 * an error is encountered along the way, it sends an error message.
 */
app.get('/home', (req, res) => {
    var cookie = req.cookies.login;
    if (!cookie) {
        res.send('Expired cookie');
        return;
    }
    // looks for username in db
    User.findOne({
            username: cookie.username
        })
        .exec((err, user) => {
            if (!user) { // Error loading info
                res.send('Error loading posts');
            } else { // User found
                //Gets all followed users
                User.find({
                        'username': {
                            $in: user.following.concat([user.username])
                        }
                    })
                    .exec(function (err, following) {
                        // Get posts from all users
                        var homePosts = [];
                        for (i = 0; i < following.length; i++) {
                            homePosts = homePosts.concat(following[i].posts)
                        }
                        // Gets posts list
                        Post.find({
                                '_id': {
                                    $in: homePosts
                                }
                            })
                            .sort({
                                '_id': -1
                            })
                            .exec((err, posts) => {
                                res.send(JSON.stringify(posts));
                            })
                    });
            }
        });
});

/* --------------------------------- Explore -------------------------------- */

/**
 * Responsible for displaying explore page of user. It loads random posts that 
 * have been posted on Quack in no particular order. If
 * an error is encountered along the way, it sends an error message.
 */
app.get('/explore', (req, res) => {
    var cookie = req.cookies.login;
    if (!cookie) {
        res.send('Expired cookie');
        return;
    }

    // looks for username in db
    Post.find()
        .exec((err, results) => {
            if (!results) { // Error loading info
                res.send('Error loading posts');

            } else { // User found
                // Make random post list
                var randomPosts = [];
                for (i = 0; i < 50; i++) {
                    let randomNum = (Math.floor(Math.random() * results.length + 1));
                    let post = results[randomNum % results.length];
                    if (randomPosts.length >= results.length) break;
                    if (post.username == cookie.username) continue;
                    if (randomPosts.includes(post)) continue;
                    randomPosts.push(post);
                }
                res.setHeader('Content-Type', 'text/plain');
                res.send(JSON.stringify(randomPosts, null, 4));
            }
        });
});

/* ---------------------------------  Quacks -------------------------------- */

/**
 * Responsible for adding new quacks. Receives a form and stores info in 
 * mongo and cookie username
 */
app.post('/quack', upload.single('image'), (req, res) => {
    var cookie = req.cookies.login;
    if (!cookie) {
        res.redirect('/');
        return;
    }

    var postObj = req.body;
    var image = 'none';
    if (req.file) image = req.file.filename;

    // Adds item
    User.findOne({
            username: cookie.username
        })
        .exec((err, result) => {
            if (!result || err) {
                res.send('Error storing comment');
                res.redirect('/');
            } else {
                // Stores into DB
                let post = new Post({
                    username: result.username,
                    profilePicture: result.profilePicture,
                    text: postObj.quackText,
                    picture: image,
                    likes: [],
                    comments: []
                });
                post.save((err) => {
                    if (err) res.end('Error storing post to DB');
                });

                // Adds to user
                result.posts.push(post._id);
                result.save((err) => {
                    if (err) res.end('Error storing item to user');
                });
                res.redirect('/');
            }
        });
});

/**
 * Responsible for liking posts. Receives post id and an action. It finds post
 * and action decides if post is being liked or disliked.
 */
app.get('/like/:action/:id', (req, res) => {
    var cookie = req.cookies.login;
    if (!cookie) {
        res.send('Expired cookie');
        return;
    }
    // Finds  post
    Post.findOne({
            _id: req.params.id
        })
        .exec((err, post) => {
            if (!post || err) {
                res.send('Error liking post');
            } else {
                // Finds comment's user
                User.findOne({
                        username: post.username
                    })
                    .exec((err, user) => {
                        if (!user || err) {
                            res.send('Error liking post');
                        } else {
                            if (req.params.action == 'like') {
                                post.likes.push(cookie.username);
                                user.likes = user.likes + 1;
                            } else if (req.params.action == 'unlike') {
                                post.likes.splice(post.likes.indexOf(cookie.username), 1);
                                user.likes = user.likes - 1;
                            }
                            post.save((err) => {
                                if (err) res.end('Error liking post');
                            });
                            user.save((err) => {
                                if (err) res.end('Error liking post');
                            });

                            var info = {
                                postLikes: post.likes.length,
                                userLikes: user.likes
                            }
                            res.send(JSON.stringify(info));
                        }
                    });
            }
        });
});

/**
 * Responsible for commenting posts. Receives post id and adds to comment
 * array.
 */
app.post('/comment', (req, res) => {
    var cookie = req.cookies.login;
    if (!cookie) {
        res.send('Expired cookie');
        return;
    }

    let commentObj = JSON.parse(req.body.user);
    // Adds item
    Post.findOne({
            _id: commentObj.postId
        })
        .exec((err, post) => {
            if (!post || err) {
                res.send('Error commenting post');
            } else {
                // Stores into DB
                let comment = new Comment({
                    username: cookie.username,
                    text: commentObj.text,
                });
                comment.save((err) => {
                    if (err) res.send('Error commenting post');
                });

                // Adds to user
                post.comments.push(comment);
                post.save((err) => {
                    if (err) res.send('Error commenting post');
                });
                res.send(JSON.stringify(post));
            }
        });
});

/* ---------------------------------- User ---------------------------------- */

/**
 * Responsible for displaying given user page. Only sends public information.
 */
app.get('/profile/:username', (req, res) => {
    var cookie = req.cookies.login;
    if (!cookie) {
        res.send('Expired cookie');
        return;
    }

    User.findOne({ // looks for username in db
            username: req.params.username
        })
        .exec((err, user) => {
            if (!user) { // Error loading info
                res.send('User does not exist');
            } else { // User found
                // Relation to profile
                var status = 'not followed';
                if (user.followers.includes(cookie.username)) status = 'followed';
                if (cookie.username == user.username) status = 'self';
                Post.find({ // Gets posts list
                        '_id': {
                            $in: user.posts
                        }
                    })
                    .sort({
                        '_id': -1
                    })
                    .exec((err, posts) => {
                        var userPublic = {
                            username: user.username,
                            profilePicture: user.profilePicture,
                            rank: user.rank,
                            followers: user.followers.length,
                            following: user.following.length,
                            likes: user.likes,
                            status: status,
                            posts: posts
                        }
                        res.setHeader('Content-Type', 'text/plain');
                        res.send(JSON.stringify(userPublic, null, 4));
                    })
            }
        });
});

/**
 * Adds profile picture to cookie user
 */
app.post('/addProfilePic', upload.single('image'), (req, res) => {
    var cookie = req.cookies.login;
    if (!cookie) {
        res.redirect('/');
        return;
    }

    var image = '';
    if (req.file) image = req.file.filename;

    // Adds item
    User.findOne({
            username: cookie.username
        })
        .exec((err, result) => {
            if (!result) {
                res.send('Error saving picture');
                res.redirect('/');
            } else {
                result.profilePicture = image;
                result.save((err) => {
                    if (err) {
                        res.send('Error storing picture to user');
                        res.redirect('/');
                    }
                });
                res.redirect('/');
            }
        });
})

/**
 * Ends current session and logs user out 
 */
app.get('/logout', (req, res) => {
    var cookie = req.cookies.login;
    if (!cookie) {
        res.redirect('/');
        return;
    }

    delete sessionKeys[cookie.username]

    res.redirect('/');
});

/**
 * Responsible for either following or un following another user. 
 */
app.get('/user/:action/:username', (req, res) => {
    var cookie = req.cookies.login;
    if (!cookie) {
        res.redirect('/');
        return;
    }

    // Finds user
    User.findOne({
            username: cookie.username
        })
        .exec((err, user) => {
            if (!user) {
                res.send('Error loading user');
            } else {
                // Finds :username 
                User.findOne({
                        username: req.params.username
                    })
                    .exec((err, result) => {
                        if (!result) {
                            res.send('User does not exist');
                        } else {
                            if (req.params.action == 'follow') {
                                user.following.push(result.username);
                                result.followers.push(user.username);
                            } else if (req.params.action == 'unfollow') {
                                user.following.splice(user.following.indexOf(result.username), 1);
                                result.followers.splice(result.followers.indexOf(user.username), 1);
                            }

                            user.save((err) => {
                                if (err) {
                                    res.send('Error storing user');
                                    res.redirect('/');
                                }
                            });
                            result.save((err) => {
                                if (err) {
                                    res.send('Error storing picture user');
                                    res.redirect('/');
                                }
                            });
                            res.redirect('/');
                        }
                    });
            }
        });
});


/* --------------------------------- Other ---------------------------------- */

// Any other route
app.get('/*', (req, res) => {
    res.redirect('/');
});

// Responsible for server
app.listen(port, () => {
    console.log(`Server running at http://${ip}:${port} :)`);
});