const mongoose = require('mongoose');

module.exports = () => {
    const mongoDB = 'mongodb+srv://user:pass@grandprix.yv45t.mongodb.net/db?retryWrites=true&w=majority';
    mongoose.connect(mongoDB, {useNewUrlParser:true, useUnifiedTopology:true})
        .then(result => console.log("Connected to MongoDB Atlas"))
        .catch(err => console.log(err));
}