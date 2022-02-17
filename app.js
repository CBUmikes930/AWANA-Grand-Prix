const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('static'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Connect to the MongoDB database
const dbConnection = require('./database/connection');
dbConnection();

// Import database services
const racerService = require('./database/services/racerService');


app.listen(3000, () => {
    console.log("Listening on port 3000");
});


/**
 * Routes
 */

app.route('/').get(async (req, res) => {
    // Get a list of all Racers
    let users = await racerService.getRegisteredUsers();
    let newRacers = {
        'fnames': {},
        'lnames': {}
    };
    users.forEach((racer) => {
        // If this is a new firstname then create an element with the firstname as the key and an empty array as the value
        if (newRacers.fnames[racer.fname] == null) {
            newRacers.fnames[racer.fname] = [];
        }
        // Add the last name into the array with the firstname as the value
        newRacers.fnames[racer.fname].push(racer.lname);

        // If this is a new lastname then create an element with the lastname as the key and an empty array as the value
        if (newRacers.lnames[racer.lname] == null) {
            newRacers.lnames[racer.lname] = [];
        }
        // Add the first name into the array with the lastname as the value
        newRacers.lnames[racer.lname].push(racer.fname);
    });
    // Send racers as an ejs param to be used in the view
    res.render('index', { title: 'Home', static: ".", script: "script.js", racers: newRacers });
});

app.route('/addRacer').post(async (req, res) => {
    // Log the event
    console.log("Add Racer:");
    console.log("\tName: " + req.body.fname + " " + req.body.lname)
    console.log("\tGroup: " + req.body.group);

    // Create a new racer in the DB
    let racer = await racerService.createRacer(req.body);
    console.log(racer);
    // Delete the user from the registered list
    let del = await racerService.deleteRegisteredUser({ fname: req.body.fname, lname: req.body.lname });

    res.send(JSON.stringify(racer));
});

let max = 0;
let numRaces = [];
let curRace = 1;
let curGroup = 1;

app.route('/race').get(async (req, res) => {
    let result = await racerService.getTotalRacersInGroupByRace("Heat 1");
    max = Math.max(...result);
    numRaces = result.map(i => Math.ceil(max / (i + 1)));

    result = await racerService.getNextRacers(1);
    console.log(result);

    res.render('race', { title: 'Races', static: ".", script: "raceScript.js", racers: result });
});

app.route('/submitResults').post(async (req, res) => {
    raceResults = req.body.raceResults;
    // Get the winners
    console.log("Winners: " + raceResults.slice(0, Math.ceil(raceResults.length / 3)));
    // Get the losers
    console.log("Losers: " + raceResults.slice(Math.ceil(raceResults.length / 3)));
});

app.route('/test').get(async (req, res) => {
    for (let i = curRace; i <= max + 1; i++) {
        for (let j = curGroup; j <= 3; j++) {
            if ((i % numRaces[(j - 1 % 3)]) === 0) {
                let response = "Race " + i + " Group " + j
                console.log(response);
                curRace = i;
                curGroup = j + 1;
                if (curGroup > 3) {
                    curGroup = 1;
                    curRace++;
                }
                
                return res.send(response);
            }
        }
    }
    console.log("Completed");
    return res.send("Completed");
});