const CodeTemplate =require('../Model/CodeTemplate');

async function handleFetchAllTemplate(req ,res){
    try{
        const user=req.user._id;
        const Alltemplates= await CodeTemplate.find({userId:user})
        return res.status(200).json(Alltemplates);
    }catch(err){
        console.log("Error " , err);
        return res.status(500).json({message:"Something went Wrong"})
    }
}

async function handleTemplateAdd(req ,res){
    const userId= req.user._id;
    const {title , description , language , code , tags , isPublic}=req.body;
   try{
        if(!userId){
            return res.status(401).json({message:"Not authenticated"});
        }
        const newTemplate = await CodeTemplate.create({
            userId , title , description , language , code , tags , isPublic
        })
        return res.status(201).json({message: "Snippet added successfully" , template:newTemplate});
   }catch(err){
        console.log("Error " , err);
        return res.status(500).json({message:"Something went Wrong"})
   }
}

async function handleTemplateDelete(req , res){
    try{
        const {id}= req.params;
        const userId= req.user._id;
        // applying  userId filter too in this so you can delete only your code template and cant touch anyone others even if you know there code template id
        const deletedTemplate= await CodeTemplate.findOneAndDelete({_id:id , userId : userId});
        if(!deletedTemplate){
            return res.status(404).json({message:"Template not found"});
        }
        return res.status(200).json({message:"Template Deleted Succesfully"});
    }catch(err){
        console.log("Error " , err);
        res.status(500).json({message:"Something went Wrong"});
    }
}

async function handleTemplateUpdate(req , res){
    try{
        const {id}= req.params;
        const userId= req.user._id;
        const newTemplate=req.body;
        // same here applying better security checks
        const updatedTemplate= await CodeTemplate.findOneAndUpdate({_id:id , userId:userId} , newTemplate , {returnDocument:'after'});
        if(!updatedTemplate){
            return res.status(404).json({message:"template cant be updated"});
        }
        return res.status(200).json({message:"Template updated succeesfully" , template:updatedTemplate});
    }catch(err){
        console.log("Error " , err);
        res.status(500).json({message: "Something went wrong"});
    }
}

module.exports={
    handleFetchAllTemplate,
    handleTemplateAdd ,
    handleTemplateDelete,
    handleTemplateUpdate,

}
