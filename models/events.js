var mongoose = require('mongoose');

mongoose.connect('mongodb://namansachdeva:namansachdeva12@ds159204.mlab.com:59204/culmyca19',{ useNewUrlParser: true });

var db = mongoose.connect

var EventSchema = mongoose.Schema({

	fees: Number,
	starttime: Date,
	endtime: Date,
	coordnates: [{name: String,phone: Number}],
	prizes: {
        prize1: String,
        prize2: String,
        prize3: String
    },
    eventtype: String,
    title: String,
    clubname: String,
    category: String,
    description: String,
    venue: String,
    photolink: String,
    winner: {
        winner1: String,
        winner2: String,
        winner3: String
    }
});
var Event = module.exports = mongoose.model('Event',EventSchema);
module.exports.createEvent = function(newEvent,callback){
	newEvent.save(callback);
}