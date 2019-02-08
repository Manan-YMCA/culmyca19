var mongoose = require('mongoose');

mongoose.connect('mongodb://namansachdeva:namansachdeva12@ds159204.mlab.com:59204/culmyca19',{ useNewUrlParser: true });

var db = mongoose.connect

var SponsorSchema = mongoose.Schema({

	name: String,
	title: String,
    rank: Number,
    logo: String,
    website: String
    
});
var Sponsor = module.exports = mongoose.model('Sponsor',SponsorSchema);
module.exports.createSponsor = function(newSponsor,callback){
	newSponsor.save(callback);
}