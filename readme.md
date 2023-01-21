# AWANA Grand Prix

Written by Micah Steinbock on 2/25/2022 for Grace Baptist Church's AWANA Grand Prix event.

## Overview

This system controls the bracket for the AWANA Grand Prix. The bracket is a double elimination tournament, which means that every participant will get at a minimum, 2 chances to race. The tournament is divided into 3 divisions, based on grade: 3rd/4th is Division 1, 5th/6th is Division 2, Journey/Trek/Leaders is Division 3.

Within each division there are a series of races:

* **Heat 1:** The first qualifier round where every participant gets a chance to race once.
* **Heat 2:** Divided into two sub-categories:
  * **Upper:** The winners from heat one. Winners from this heat will advance to the **Semi-Finals**. Losers from this heat will drop to the **Lower** bracket.
  * **Lower:** The losers from heat one and heat two upper. The winners from this heat will advance to the **Semi-Finals**. Losers will be eliminated.
* **Semi-Finals:** This race is made up of the winners from heat two. Winners will advance to the **Finals**. Losers will be eliminated.
* **Finals:** This race is made up of the winners from the semi-finals. The winners of the tournament will be determined by the first, second, and third place racers from this race. Losers will be eliminated.

The amount of winners is determined based on the number of participants in the current race. This is done in order to keep it close to fair for all participants. The number of winners is determined by the following formula:

```
Math.ceil(number_of_racers / 3)
```

| Number of Racers | Number of Winners | Percentage of Winners |
| ---------------- | ----------------- | --------------------- |
| 2 | 1 | 50% |
| 3 | 1 | 33% |
| 4 | 2 | 50% |
| 5 | 2 | 40% |
| 6 | 2 | 33% |
| 7 | 3 | 43% |
| 8 | 3 | 38% |

While not perfect, this formula means that there will alway be at least 1/3 of participants moving on. There are exceptions to this rule:

* If the race is the **Finals**, then the number of winners will always be 3 (1st, 2nd, 3rd).
* If the race is the **Semi-Finals**, then the number of winners will be determined by how many semi-final races there are.
  * If there are one or two semi-final races, then there will be 3 winners.
  * Otherwise, we use the same formula as above.

## Implementation Overview

This system has been coded using the NodeJS framework. This system uses to control the various routes.

The backend is created using MongoDB Atlas cloud Database with the Node mongoose package used to interface with the database.

The UI is created using EJS Viewing engine which allows for the creation of templates that can be controlled by the backend server. These templates use JQuery to create the responsive front-end and Bootstrap for styling.

# Script Documentation

## app.js

The main file that controls the application. The server operates using a localhost:3000 url.

### Routes:

#### /

The index page for the application. 

This page is responsible for checking racers in. Not all registers participants are going to participate, so we first check in the participants that show up. 

The server starts by pulling a list of registered participants from the database using the [racerService](). The server then formats the racers into a JSON object that allows for searching by first and last name. It does this by iterating over all participants and grouping them by similar first and last names. It then returns the index template (ejs) with the JSON object.

#### /addRacer

The route for a `POST` request that registers the given name as a racer.

The server passes the `req.body` to the [racerService]() which creates a new racer in the database. The server then deletes the racer from the registered user list.

The request returns the response from the creation of the racer.

#### /reset

The route for a `GET` request that resets the whole race system. 

The server resets the current race type to be 0. The server then gets the total number of racers for the first race by group. It then finds the group with the most racers. It then uses this maximum number of racers to determine the number of races for each group.

The server then sets the current race and current group counters to 1, which means division one heat one.

The server then redirects to the `/race` page.

#### /race

The route for a `GET` request that shows the race screen. This screen is the main part of the system that is displayed during the races to show the current racers and allow the user to enter the results.

The server gets the current race name from the `raceDestinations` variable using the `currentRaceType` integer to find the index in the JSON object. The server then uses this `raceName` variable and the `j` loop integer which denotes which group we are in to get the list of next racers. If the result is valid (a list is returned), then the server determines the number of winners based on whether it has defined the number of semi final racers or not (This is for the exception to the winners calculation defined above). If this race is part of the third group, then we loop back to the first group and iterate the current race. The server then returns the races template with the list of next racers, the current race name and the number of winners for this race.

If the list of next racers was empty, then we have finished that set of races. The server increments the `currentRaceType` variable to move to the next race type. The server then gets the number of racers per group for the next set of races. If this new race type is the Semi-Finals, then we define the number of semi-final races as the number of racers in that group divided by 8, rounded up. The server then calculates the number of races based off of the maximum number of racers in a group. The server then resets the current race and group counters to 1 and then calls the /race method again to start the next race.

If we reach the end of the loops without returning, then that means all races have been finished. The server then queries the DB for the winners and returns the `/raceHistory` page. 

#### /submitResults

The route for a `POST` request that gives the current race results in order of place.

The server takes in a variable called `raceResults` in the post request body. The server then determines how many winners there are. If the current race is the finals, then the number of winners is always 3 (1st, 2nd, 3rd). If the current race is the semi-finals, then the number was defined earlier in the `/race` method based on the number of racers in the given division. Otherwise, we use the main formula, which is number of racers divided by 3, rounded up.

The server then adds a record of the race results into the database by providing the current race name, the current group, the results, the number of winners and the `raceDest` (a JSON object of where the winners move to and where the losers move to).

Then for each of the racers in the results variable, we update their racer record to show what category they have moved to. If the current race is finals, then we also define their final ranking.

#### /raceHistory

The route for a `GET` request that returns a page with the a table of race results.

The server gets the history of races from the DB and returns the history template with the result from the database to display a history of races with the winners and losers of each race.

#### /deleteAllData

The route for a `GET` request that deletes all racers and races and registered users from the database.
