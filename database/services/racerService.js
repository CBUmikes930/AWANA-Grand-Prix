const RacerModel = require('../models/racerModel');
const RegisteredModel = require('../models/registeredModel');

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

module.exports.getNextRacers = async (groupNum) => {
    try {
        // Get a list of racers in the given group
        let result = await RacerModel.find({ group: groupNum });
        return result.slice(0, Math.ceil(result.length / Math.ceil(result.length / 8)));
    } catch (error) {
        console.log("Something went wrong with getNextRacers", error);
        throw new Error(error);
    }
}

module.exports.getTotalRacersInGroupByRace = async(race) => {
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