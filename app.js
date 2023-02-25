const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();

// Socket IO
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

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
server.listen(3000, () => {
    console.log("Listening on port 3000");
});


/**
 * Routes
 */
app.route('/').get(async (req, res) => {
    res.render('index', { title: 'Home', static: ".", script: "index.js" });
});

app.route('/addRacer').get(async ( req, res) => {
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
    res.render('add_racer', { title: 'Home', static: ".", script: "addRacer.js", racers: newRacers });
}).post(async (req, res) => {
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
let curRace = 1;
let curGroup = 1;
let cur_racers = [];
let next_racers = [];

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
    
    await moveToNextRaceType();
    await getNextRacers();

    // Go to race screen
    res.redirect('/race');
});

app.route('/race').get(async (req, res) => {
    // Start at the current race and group and loop until the next valid race
    for (let i = curRace; i <= max; i++) {
        for (let j = curGroup; j <= 3; j++) {
            let response = "Race " + i + " Group " + j;
            let raceName = Object.keys(raceDestinations)[currentRaceType];
            // Get the list of racers based on the current race name and the current group

            let result;
            if (next_racers === []) {
                result = await racerService.getNextRacers(raceName, j);
            } else {
                result = next_racers;
            }
            //let result = await racerService.getNextRacers(raceName, j);

            // If there are racers
            if (result.length > 0) {
                console.log(response);
                console.log(result.length + " Racers");

                // Determine the number of winners
                let numWinners = numSemiFinalRaces === undefined ? undefined : numSemiFinalRaces[j - 1];
                // Update the current race and group to match the race we are on
                curRace = i;
                curGroup = j + 1;

                // If we have looped through all of the groups, return to group one
                if (curGroup > 3) {
                    curGroup = 1;
                    curRace++;
                }

                // Emit the racers list using sockets to update the current racers screen
                cur_racers = result;
                io.emit("Current Racers", result);
                await getNextRacers();

                // Return the data to be rendered
                return res.render('race', { title: 'Races', static: ".", script: "raceScript.js", racers: result, raceName: raceName, numWinners: numWinners });
            } else {
                // If no racers were found for the current race and group
                console.log("No racers found");

                //Update the current race and group to match the race we are on
                curRace = i;
                curGroup = j + 1;

                // If we have looped through all of the groups, return to group one
                if (curGroup > 3) {
                    curGroup = 1;
                    curRace++;
                }
            }
        }
    }

    // If we have not run all of the races, then move to the next race type
    if (++currentRaceType <= Object.keys(raceDestinations).length) {
        console.log("Next Race Type");

        await moveToNextRaceType();
        await getNextRacers();

        return res.render('race', { title: 'Races', static: ".", script: "raceScript.js", racers: null, raceName: Object.keys(raceDestinations)[currentRaceType], numWinners: 0 });
        //return res.redirect('/race');
    }

    let result = await racerService.getWinners();
    return res.redirect('/raceHistory');
});

app.route('/submitResults').post(async (req, res) => {
    console.log("Results Submitted");
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

app.route('/deleteAllData').delete(async (req, res) => {
    racerService.deleteAllRacers();
    racerService.deleteAllRaces();
    racerService.deleteAllRegisteredUsers();
    res.send({ res: "Deleted" });
});

app.route('/curRacers').get(async (req, res) => {
    return res.render('cur_racers', { static: '.', script: 'curRacerScript.js', racers: cur_racers });
});

app.route('/nextRacers').get(async (req, res) => {
    return res.render('next_racers', { static: '.', script: 'nextRacerScript.js', racers: next_racers });
});

app.route('/racerLookup').get(async (req, res) => {
    return res.render('racer_lookup', { static: '.', script: 'racerLookup.js' });
}).post(async (req, res) => {
    let fname = req.body.fname;
    let lname = req.body.lname;
    let div = req.body.div;
    let num = req.body.num;

    let racers = await racerService.getRacersByFirstName({
        fname: fname,
        lname: lname
    });

    racers = racers.concat(await racerService.getRacersByFirstName({
        group: div,
        number: num
    }));

    res.send(JSON.stringify(racers));
});

io.on('connection', (socket) => {
    console.log("A user connected using io");
    socket.on('disconnect', () => {
        console.log("A user disconnected using io");
    });
});

async function moveToNextRaceType() {
    //Recalculate the max number of races for this race type
    let result = await racerService.getTotalRacersInGroupByRace(Object.keys(raceDestinations)[currentRaceType]);

    if (Object.keys(raceDestinations)[currentRaceType] === "Semi-Finals") {
        let racers = await racerService.getTotalRacersInGroupByRace("Semi-Finals");
        console.log("Number of racers: " + racers);
        numSemiFinalRaces = racers.map(i => Math.ceil(i / 8));
        console.log("Number of semi-final races: " + numSemiFinalRaces);
    } else {
        numSemiFinalRaces = undefined;
    }

    max = Math.ceil(Math.max(...result) / 8);
    curRace = 1;
    curGroup = 1;
}

async function getNextRacers() {
    for (let i = curRace; i <= max; i++) {
        for (let j = curGroup; j <= 3; j++) {
            let response = "Race " + i + " Group " + j;
            let raceName = Object.keys(raceDestinations)[currentRaceType];
            // Get the list of racers based on the current race name and the current group
            let result = await racerService.getNextRacers(raceName, j);

            // If there are racers
            if (result.length > 0) {
                console.log("Next Racers Found:");
                console.log(response);
                console.log(result.length + " Racers");
                next_racers = result;

                if (numSemiFinalRaces && numSemiFinalRaces[j - 1] === 1) {
                    console.log("Semi Final Race skipped for Group " + j + " due to their only being 1 race");

                    for (let i = 0; i < next_racers.length; i++) {
                        racerService.updateRacer(next_racers[i], "Finals", undefined);
                    }

                    //Update the current race and group to match the race we are on
                    curRace = i;
                    curGroup = j + 1;

                    // If we have looped through all of the groups, return to group one
                    if (curGroup > 3) {
                        curGroup = 1;
                        curRace++;
                    }
                } else {
                    // Emit the racers list using sockets to update the current racers screen
                    io.emit("Next Racers", result, j);

                    for (let i = 0; i < next_racers.length; i++) {
                        racerService.updateRacer(next_racers[i], "Up Next", undefined);
                    }

                    return;
                }
            } else {
                // If no racers were found for the current race and group
                console.log("No racers found");

                //Update the current race and group to match the race we are on
                curRace = i;
                curGroup = j + 1;

                // If we have looped through all of the groups, return to group one
                if (curGroup > 3) {
                    curGroup = 1;
                    curRace++;
                }
            }
        }
    }

    console.log("Next Race Type 2");
    let raceName = Object.keys(raceDestinations)[currentRaceType + 1];
    io.emit("Next Race Type", raceName);
}