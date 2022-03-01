let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let RacerSchema = new Schema({
    fname: String,
    lname: String,
    group: Number,
    number: Number,
    status: String,
    place: Number
});

module.exports = mongoose.model('racer', RacerSchema);