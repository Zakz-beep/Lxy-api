import { Session,User } from "../db/schema.js";


export const isAuthenticated = async(req,res,next)=>{
    const token = req.headers.token;
    if(!token){
        return res.status(401).json({message:"Unauthorized"})
    }
    const sessions = await Session.findByPk(token,{
        include:{model:User,as:"user"}
    })
    if(!sessions || sessions.revoked){
        return res.status(401).json({message:"Unauthorized"})
    }
    if(new Date() > sessions.expiresAt){
        return res.status(401).json({message:"expires"})
    }
    req.user = sessions.user
    req.sessions = sessions
    next()
}