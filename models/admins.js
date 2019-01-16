var mongoose = require('mongoose');

mongoose.connect('mongodb://namansachdeva:namansachdeva12@ds159204.mlab.com:59204/culmyca19',{ useNewUrlParser: true });

var db = mongoose.connect

var AdminSchema = mongoose.Schema({

username: String,
password: String

});
var Admin = module.exports = mongoose.model('Admin',AdminSchema);
module.exports.createAdmin = function(newAdmin,callback){
	newAdmin.save(callback);
}