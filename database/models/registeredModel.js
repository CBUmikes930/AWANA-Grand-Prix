let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let RegisteredSchema = new Schema({
    fname: String,
    lname: String
});

module.exports = mongoose.model('registered', RegisteredSchema);