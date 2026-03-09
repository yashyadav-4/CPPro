

async function handleUserCfVerification(req, res){
    let {handle}=req.params;
    let Api=`https://codeforces.com/api/user.info?handles=${handle}`
    const result= await fetch(Api);
    const data= await result.json();


    return res.json(data);
}

module.exports={
    handleUserCfVerification,

}