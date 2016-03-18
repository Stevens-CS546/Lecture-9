// We first require our express package
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var movieData = require('./data.js');

// We create our express isntance:
var app = express();

app.use(cookieParser());
app.use(bodyParser.json()); // for parsing application/json

// Middlewares:

// 1. One which will count the number of requests made to your website

// Request is the request object, just like how we have access to the request in our routes
// Response is the response object, just like how we have access to the response in our routes
// next is a callback that will call the next middleware registered, or proceed to routes if none exist.
// If we do not call next(), we need to make sure we send a response of some sort or it will poll forever! 
var currentNumberOfRequests = 0;
app.use(function(request, response, next) {
    currentNumberOfRequests++;
    console.log("There have now been " + currentNumberOfRequests + " requests made to the website.");
    next();
});

// 2. One which will count the number of requests that have been made to the current path
var pathsAccessed = {};
app.use(function(request, response, next) {
    if (!pathsAccessed[request.path]) pathsAccessed[request.path] = 0;

    pathsAccessed[request.path]++;

    console.log("There have now been " + currentNumberOfRequests + " requests made to " + request.path);
    next();
});

// 3. One which will log the last time the user has made a request, and store it in a cookie.
app.use(function(request, response, next) {
    // If we had a user system, we could check to see if we could access /admin

    console.log("The request has all the following cookies:");
    console.log(request.cookies);
    if (request.cookies.lastAccessed) {
        console.log("This user last accessed the site at " + request.cookies.lastAccessed);
    } else {
        console.log("This user has never accessed the site before");
    }
    
    // THIS SECTION WILL EXPIRE THE COOKIE EVERY 5th request
    if (currentNumberOfRequests % 5 === 0) {
        console.log("now clearing the cookie");
        
        var anHourAgo = new Date();
        anHourAgo.setHours(anHourAgo.getHours() -1);
        
        // invalidate, then clear so that lastAccessed no longer shows up on the
        // cookie object
        response.cookie("lastAccessed", "", { expires: expiresAt });
        response.clearCookie("lastAccessed");

        next();
        return;
    }

    var now = new Date();
    var expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Providing a third parameter is optional, but allows you to set options for the cookies.
    // see: http://expressjs.com/en/api.html#res.cookie
    // for details on what you can do!
    response.cookie("lastAccessed", now.toString(), { expires: expiresAt });
    next();
});

// 4. One which will deny all users access to the /admin path.
app.use("/admin", function(request, response, next) {
    // If we had a user system, we could check to see if we could access /admin

    console.log("Someone is trying to get access to /admin! We're stopping them!");
    response.status(500).send("You cannot access /admin");
});

// Get the best movies
app.get("/api/movies/best", function(request, response) {
    movieData.getPopularMovies().then(function(popularMovies) {
        response.json(popularMovies);
    });
});

// Get a single movie
app.get("/api/movies/:id", function(request, response) {
    movieData.getMovie(request.params.id).then(function(movie) {
        response.json(movie);
    }, function(errorMessage) {
        response.status(500).json({ error: errorMessage });
    });
});

// Get all the movies
app.get("/api/movies", function(request, response) {
    movieData.getAllMovies().then(function(movieList) {
        response.json(movieList);
    });
});

// Create a movie
app.post("/api/movies", function(request, response) {
    movieData.createMovie(request.body.title, request.body.rating).then(function(movie) {
        response.json(movie);
    }, function(errorMessage) {
        response.status(500).json({ error: errorMessage });
    });
});

// Update a movie 
app.put("/api/movies/:id", function(request, response) {
    movieData.updateMovie(request.params.id, request.body.title, request.body.rating).then(function(movie) {
        response.json(movie);
    }, function(errorMessage) {
        response.status(500).json({ error: errorMessage });
    });
});

app.delete("/api/movies/:id", function(request, response) {
    movieData.deleteMovie(request.params.id).then(function(status) {
        response.json({ success: status });
    }, function(errorMessage) {
        response.status(500).json({ error: errorMessage });
    });
});

app.get("/admin*", function(request, response) {
    response.status(200).send("Oh my! You're in the admin panel!");
})

// We can now navigate to localhost:3000
app.listen(3000, function() {
    console.log('Your server is now listening on port 3000! Navigate to http://localhost:3000 to access it');
});
