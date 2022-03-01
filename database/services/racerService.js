const RacerModel = require('../models/racerModel');
const RegisteredModel = require('../models/registeredModel');
const RaceModel = require('../models/raceModel');

module.exports.createRacer = async (content) => {
    try {
        let result = await RacerModel.find({ group: content.group });
        content.number = result.length + 1;
        content.status = "Heat 1";
        let racer = new RacerModel(content);
        return await racer.save();
    } catch (error) {
        console.log("Something went wrong with createRacer", error);
        throw new Error(error);
    }
}

module.exports.getRacersByFirstName = async (filter) => {
    try {
        let result = await RacerModel.find(filter);
        return result;
    } catch (error) {
        console.log("Something went wrong with getRacersByFirstName", error);
        throw new Error(error);
    }
}

module.exports.getNextRacers = async (status, groupNum) => {
    try {
        // Get a list of racers in the given group
        let result = await RacerModel.find({ status: status, group: groupNum });
        return result.slice(0, Math.ceil(result.length / Math.ceil(result.length / 8)));
    } catch (error) {
        console.log("Something went wrong with getNextRacers", error);
        throw new Error(error);
    }
}

module.exports.getTotalRacersInGroupByRace = async (race) => {
    try {
        totalRacers = [];
        for (let i = 1; i <= 3; i++) {
            let result = await RacerModel.find({ group: i, status: race });
            totalRacers.push(result.length);
        }
        return totalRacers;
    } catch (error) {
        console.log("Something went wrong with getTotalRacersInGroupByRace", error);
        throw new Error(error);
    }
}

module.exports.getWinners = async () => {
    try {
        return RacerModel.find({ status: "Winners" });
    } catch (error) {
        console.log("Something went wrong with getWinners", error);
        throw new Error(error);
    }
}

module.exports.updateRacer = async (id, status, place) => {
    try {
        let result;
        if (place === undefined) {
            result = await RacerModel.findOneAndUpdate({ _id: id }, { status: status });
        } else {
            result = await RacerModel.findOneAndUpdate({ _id: id }, { status: status, place: place });
        }
        console.log(result);
        return result;
    } catch (error) {
        console.log("Something went wrong with updateRacer", error);
        throw new Error(error);
    }
}

module.exports.deleteRacer = async (id) => {
    try {
        let result = await RacerModel.deleteOne({ _id: id });
        console.log(result);
        return result;
    } catch (error) {
        console.log("Something went wrong with deleteRacer", error);
        throw new Error(error);
    }
}

module.exports.deleteAllRacers = async () => {
    try {
        let result = await RacerModel.deleteMany({});
        return result;
    } catch (error) {
        console.log("Something went wrong with deleteAllRacers", error);
        throw new Error(error);
    }
}

module.exports.getRegisteredUsers = async (filter) => {
    try {
        let result = await RegisteredModel.find(filter);
        return result;
    } catch (error) {
        console.log("Something went wrong with getRegisteredUsers", error);
        throw new Error(error);
    }
}

module.exports.deleteRegisteredUser = async (filter) => {
    try {
        let result = await RegisteredModel.deleteOne(filter);
        return result;
    } catch (error) {
        console.log("Something went wrong with deleteRegisteredUser", error);
        throw new Error(error);
    }
}

module.exports.addRace = async (content) => {
    try {
        let result = await RaceModel.find({ type: content.type, group: content.group });
        content.number = result.length + 1;
        let race = new RaceModel(content);
        return await race.save();
    } catch (error) {
        console.log("Something went wrong with addRace", error);
        throw new Error(error);
    }
}

module.exports.getRaces = async (filter) => {
    return await RaceModel.find(filter).populate('results');
}

module.exports.deleteAllRaces = async () => {
    try {
        let result = await RaceModel.deleteMany({});
        return result;
    } catch (error) {
        console.log("Something went wrong with deleteAllRaces", error);
        throw new Error(error);
    }
}