const User= require('../Model/User');
const {setUser, getUser}= require('../Services/auth')
const bcrypt = require('bcryptjs');


async function handleVerifyAuth(req, res) {
    try {
        const token = req.cookies?.token;
        if (!token) return res.json({ authenticated: false });
        
        const userPayload = getUser(token);
        if (!userPayload) return res.json({ authenticated: false });

        const user = await User.findById(userPayload._id).select('-password');
        if (!user) return res.json({ authenticated: false });

        return res.json({ authenticated: true, user });
    } catch (err) {
        console.error("Auth verify error:", err);
        return res.json({ authenticated: false });
    }
}

async function handleUserSignup(req , res){
    const { name , email , password }= req.body;
    try{
        const user= await User.findOne({email});
        if(user) return res.status(400).json({message : "Account already exists"});
        
        // auto-generate a unique username from the name
        const baseUsername = name.trim().toLowerCase().replace(/\s+/g, '_');
        const suffix = Math.floor(1000 + Math.random() * 9000);
        const username = `${baseUsername}_${suffix}`;

        const hashedPassword= await bcrypt.hash(password , 10);
        await User.create({
            username,
            name ,
            email ,
            password:hashedPassword,
        })
        return res.status(201).json({message:"Account created successfully"})
    }catch(err){
        console.error("Signup error:" , err);
        return res.status(500).json({ message: "Something went wrong" });
    }
}

async function handleUserLogin(req , res){
    try{
        const {email , password}=req.body;
        if(!email || !password) {
            return res.status(400).json({message: "Invalid Credentials"});
        }
        const user=await User.findOne({email});
        if(!user) return res.status(401).json({message:"Invalid Credentials"})
        
        // bcrypt confirmation
        const isMatch= await bcrypt.compare(password , user.password);
        if(!isMatch){
            return res.status(401).json({message:"Invalid Credentials"});
        }

        const token=setUser(user);

        res.cookie('token' , token , {
            httpOnly: true,
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(200).json({message:"Login Successful "});
    }catch(err){
        console.error("Login error:" , err);
        res.status(500).json({message: "Something went wrong"});
    }
}

function handleLogOut(req, res){
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0),
        maxAge: 0,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    });
    return res.json({message: "logged out succesfully"});
}

async function handlePasswordChange(req , res){
    try{
        const {email , oldPassword , newPassword}= req.body;
        if(!email || !oldPassword || !newPassword ) return res.status(401).json({message:"invalid credentials"});
        const user= await User.findOne({email});
        if(!user) return res.status(401).json({message:"Invalid credentials"});

        const correctPass=await bcrypt.compare(oldPassword , user.password);
        if(!correctPass){
            return res.status(401).json({message:"invalid credentials"});
        }

        const hashedPassword= await bcrypt.hash(newPassword , 10);
        user.password=hashedPassword;
        await user.save();

        return res.status(200).json({message:"Password updated successfully"})

    }catch(err){
        console.error("Password change error:" , err);
        res.status(500).json({message:"Something went wrong"});
    }
}

module.exports={
    handleUserSignup,
    handleUserLogin,
    handleVerifyAuth,
    handleLogOut,
    handlePasswordChange,

}