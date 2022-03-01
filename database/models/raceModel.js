let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let RaceSchema = new Schema({
    type: String,
    group: Number,
    number: Number,
    results: [{
        type: Schema.Types.ObjectId,
        ref: "racer"
    }],
    numWinners: Number,
    raceDest: Object
});

module.exports = mongoose.model('race', RaceSchema);