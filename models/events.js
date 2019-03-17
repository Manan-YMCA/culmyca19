var mongoose = require('mongoose');

mongoose.connect('mongodb://namansachdeva:namansachdeva12@ds159204.mlab.com:59204/culmyca19',{ useNewUrlParser: true });

var db = mongoose.connect

var EventSchema = mongoose.Schema({
    title: String,
    clubname: String,
    category: String,
    desc: String,
    rules : String,
    venue: String,
    photolink: String,
	fee: Number,
	timing:{
              from:{
                  type:Number
              },
              to:{
                  type:Number
              }
          },
	coordinators: [{name: {type:String,default:""},phone: {type:Number,default:""}}],
	prizes: {
        prize1: String,
        prize2: String,
        prize3: String
    },
    eventtype: String,
    tags : [String],
    hitCount : Number
});
var Event = module.exports = mongoose.model('Event',EventSchema);
module.exports.createEvent = function(newEvent,callback){
	newEvent.save(callback);
}