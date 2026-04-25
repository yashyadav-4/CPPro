const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        trim:true,
    },
    name:{
        type:String , 
        required:true,
    },
    email:{
        type:String ,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    password:{
        type:String ,
        required:true,
    },
    role:{
        type:String,
        enum:['user' , 'admin' , 'moderator'],
        default:'user'
    },
    isVerified:{
        type:Boolean,
        default:false,
    },
    profilePic:{
        type:String,
        default: "",
    },
    gender:{
        type:String,
        enum:['Male' , 'Female'],
    },
    age:{
        type:Number,
        min:1,
        max:100,
    },
    location:{
        city:{
            type:String,    
            default:'',
        },
        state:{
            type:String,
            default:'',
        },
        country:{
            type:String,
            default:'',
        }
    },
    college:{
        type:String,
        default:'',
        trim:true,
    },
    linkedAccounts:{
        codeforces:{type:String , default:''},
        leetcode :{ type:String , default:''},
        codechef: {type:String , default:''},
    },
    preferences:{
        theme:{
            type:String,
            default:'light',
        },
        public: {
            type:Boolean,
            default:true,
        }
    },
    verificationCode:{ //changed later: needed for platform verification
        type:String,
        default:null
    },
    lastLogin:{
        type:Date,
        default:null
    },
    lastCfUpdate:{
        type:Date,
        default:null
    },
    lastLcUpdate:{
        type:Date,
        default:null
    },
    lastCcUpdate:{
        type:Date,
        default:null
    },
    lcSession: {
        iv:             { type: String, default: null },
        encryptedToken: { type: String, default: null },
        authTag:        { type: String, default: null },
        status:         { type: String, enum: ['not_set', 'active', 'expired'], default: 'not_set' },
        updatedAt:      { type: Date,   default: null },
    },
}, {timestamps:true});



userSchema.index({"location.country":1} , {partialFilterExpression: {"location.country": {$ne: ''}}});
userSchema.index({college:1} , {partialFilterExpression: {college: {$ne: ''}}});

const User= mongoose.model('User' , userSchema);

module.exports=User;