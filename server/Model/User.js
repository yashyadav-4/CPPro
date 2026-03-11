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

}, {timestamps:true});

userSchema.index({email:1});
userSchema.index({username:1});

userSchema.index({"location.country":1 , "location.city":1} , {sparse:true}); // using sparse to make sure the document which contains the indexed field only are inlcuded in index

const User= mongoose.model('User' , userSchema);

module.exports=User;