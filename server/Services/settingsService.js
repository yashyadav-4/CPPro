const axios= require('axios');
const crypto=require('crypto');
const User= require('../Model/User');
const {acquireLock , releaseLock}= require('../Utils/cfApiQueue');

const generateCode=async(userId)=>{
    const uniqueCode= `cppro-${crypto.randomBytes(3).toString('hex')}`;
    
    await User.findByIdAndUpdate(userId ,{
        $set:{verificationCode: uniqueCode}
    });
    return uniqueCode;
} 

const verifyAndLinkCodeforces = async(userId ,handle)=>{
    const cleanHandle= handle.trim();
    const user = await User.findById(userId);

    if(!user.verificationCode){
        const err= new Error("No verification code found. please generate one first");
        err.status=400;
        throw err;
    }
    let cfProfile;
    try{
        await acquireLock('high');
        const response = await axios.get(`https://codeforces.com/api/user.info?handles=${cleanHandle}`);
        cfProfile = response.data.result[0];
    }catch(error){
        const err= new Error("Invalid codeforces handle");
        err.status=400;
        throw err;
    }finally{
        releaseLock();
    }

    const firstName= cfProfile.firstName || "";
    // const lastName= cfProfile.lastName || ""; //will use only firstname for verification for cf
    const code= user.verificationCode;

    if(!firstName.includes(code)){
        const err= new Error("cf handle verification failed");
        err.status=400;
        throw err; 
    }
    await User.findByIdAndUpdate(
        userId,
        {
            $set:{"linkedAccounts.codeforces":cleanHandle},
            $unset:{verificationCode :""}
        },
        {new:true}
    );
    return {message: `linking codeforces account successful: ${cleanHandle}`};
};

module.exports={generateCode , verifyAndLinkCodeforces};
