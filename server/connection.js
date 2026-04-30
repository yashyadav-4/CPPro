const mongoose = require('mongoose');

async function connectToMongoDb(url){
    return mongoose.connect(url, {
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        maxPoolSize: 100,
    });
}
module.exports={
    connectToMongoDb,  
}