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

// Start the server
app.listen(3000, () => {
    console.log("Listening on port 3000");
});


/**
 * Routes
 */
app.route('/').get(async (req, res) => {
    // Get a list of all registered participants
    let users = await racerService.getRegisteredUsers();
    let newRacers = {
        'fnames': {},
        'lnames': {}
    };
    // For each participant
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

// A JSON object that lays out the path that the winners and losers of each race will follow
let raceDestinations = {
    "Heat 1": {
        "Winners": "Heat 2 Upper",
        "Losers": "Heat 2 Lower"
    },
    "Heat 2 Upper": {
        "Winners": "Semi-Finals",
        "Losers": "Heat 2 Lower"
    },
    "Heat 2 Lower": {
        "Winners": "Semi-Finals",
        "Losers": "Out"
    },
    "Semi-Finals": {
        "Winners": "Finals",
        "Losers": "Out"
    },
    "Finals": {
        "Winners": "Winners",
        "Losers": "Out"
    }
}
let currentRaceType = 0;
let numSemiFinalRaces;

app.route('/reset').get(async (req, res) => {
    currentRaceType = 0;
    
    let result = await racerService.getTotalRacersInGroupByRace(Object.keys(raceDestinations)[currentRaceType]);
    
    max = Math.max(...result);
    numRaces = result.map(i => Math.ceil(max / (i + 1)));
    curRace = 1;
    curGroup = 1;

    numSemiFinalRaces = undefined;

    res.redirect('/race');
});

app.route('/race').get(async (req, res) => {
    for (let i = curRace; i <= max + 1; i++) {
        for (let j = curGroup; j <= 3; j++) {
            if ((i % numRaces[(j - 1 % 3)]) === 0) {
                let response = "Race " + i + " Group " + j;
                console.log(response);

                let raceName = Object.keys(raceDestinations)[currentRaceType];
                let result = await racerService.getNextRacers(raceName, j);

                if (result.length > 0) {
                    let numWinners = numSemiFinalRaces === undefined ? undefined : numSemiFinalRaces[curGroup - 1];
                    curRace = i;
                    curGroup = j + 1;

                    if (curGroup > 3) {
                        curGroup = 1;
                        curRace++;
                    }

                    return res.render('race', { title: 'Races', static: ".", script: "raceScript.js", racers: result, raceName: raceName, numWinners: numWinners });
                } else {
                    currentRaceType++;

                    let result = await racerService.getTotalRacersInGroupByRace(Object.keys(raceDestinations)[currentRaceType]);
                    
                    if (Object.keys(raceDestinations)[currentRaceType] === "Semi-Finals") {
                        let racers = await racerService.getTotalRacersInGroupByRace("Semi-Finals");
                        console.log("Number of racers: " + racers);
                        numSemiFinalRaces = racers.map(i => Math.ceil(i / 8));
                        console.log("Number of semi-final races: " + numSemiFinalRaces);
                    }

                    max = Math.max(...result);
                    numRaces = result.map(i => Math.ceil(max / (i + 1)));
                    curRace = 1;
                    curGroup = 1;
                
                    return res.redirect('/race');
                }
            }
        }
    }
    let result = await racerService.getWinners();
    return res.redirect('/raceHistory');
    //return res.send(result);
});

app.route('/submitResults').post(async (req, res) => {
    let raceResults = req.body.raceResults;
    let curRaceName = Object.keys(raceDestinations)[currentRaceType];
    let numWinners;

    if (curRaceName === "Finals") {
        numWinners = 3;
    } else if (curRaceName === "Semi-Finals") {
        numWinners = numSemiFinalRaces[curGroup === 1 ? 2 : curGroup - 2] <= 2 ? 3 : Math.ceil(raceResults.length / 3);
        console.log("Semi-Final Winners: " + numWinners);
    } else {
        numWinners = Math.ceil(raceResults.length / 3);
    }
    let raceDest = raceDestinations[curRaceName];

    let result = racerService.addRace({ type: curRaceName, group: curGroup === 1 ? 3 : curGroup - 1, results: raceResults, numWinners: numWinners, raceDest: raceDest });
    console.log(result);

    for (let i = 0; i < raceResults.length; i++) {
        result = raceDest[i < numWinners ? "Winners" : "Losers"];

        racerService.updateRacer(raceResults[i], result, curRaceName === "Finals" ? i + 1 : undefined);
    }

    res.send(JSON.stringify("{ result: \"Completed\" }"));
});

app.route('/raceHistory').get(async (req, res) => {
    let races = await racerService.getRaces();
    return res.render('history', { title: 'History', static: '.', script: 'script.js', races: races });
});

app.route('/deleteAllData').get(async (req, res) => {
    racerService.deleteAllRacers();
    racerService.deleteAllRaces();
    racerService.deleteAllRegisteredUsers();
    res.send("Deleted");
});