var mongoose = require('mongoose');

mongoose.connect('mongodb://namansachdeva:namansachdeva12@ds159204.mlab.com:59204/culmyca19',{ useNewUrlParser: true });

var db = mongoose.connect

var UserSchema = mongoose.Schema({

    name: String,
    phone: Number,
    email: String,
    college: String,
    fid: String,
    gid: String
    
});
var User = module.exports = mongoose.model('User',UserSchema);
module.exports.createUser = function(newUser,callback){
	newUser.save(callback);
}