const settingsService = require('../Services/settingsService');

const getVerificationCode= async(req , res)=>{
    try{
        const userId= req.user._id;
        const code= await settingsService.generateCode(userId);
        return res.status(200).json({success:true , code:code});
    }catch(error){
        return res.status(500).json({success:false , message:"could not generate code"});
    }
};

const verifyCodeforcesAccount = async(req, res)=>{
    try{
        const userId= req.user._id;
        const {handle}= req.body;
        if(!handle){
            return res.status(400).json({success:false , message:"handle required"});
        }
        const result = await settingsService.verifyAndLinkCodeforces(userId , handle);
        return res.status(200).json({success:true , message:result.message});
    }catch(error){
        return res.status(error.status || 500).json({success:false , message:error.message});
    }
}

const unlinkCodeforcesAccount = async(req, res)=>{
    try{
        const userId = req.user._id;
        const result = await settingsService.unlinkCodeforces(userId);
        return res.status(200).json({success:true, message:result.message});
    }catch(error){
        return res.status(error.status || 500).json({success:false, message:error.message});
    }
}

module.exports= {getVerificationCode , verifyCodeforcesAccount, unlinkCodeforcesAccount};