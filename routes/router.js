import express from "express"
import bcrypt from "bcrypt"
import { Profile, Session, User } from "../db/schema.js"
import { isAuthenticated } from "../middlewares/auth.js"

const router = express.Router()

router.post('/api/register',async(req,res)=>{
    const {name,username,email,password} = req.body
    try{
        if(!name || !username || !email || !password){
            return res.status(400).json({message:"Semua field harus diisi"})
        }
        const hash = await bcrypt.hash(password,10)

        const user = await User.create({
            name,
            username,
            email,
            passwordHash:hash
        })
        await Profile.create({
            userId:user.id
        })
        return res.json({message:"Register berhasil",status:200})

    }catch(err){
        return res.status(500).json({message:"Register gagal",status:500,error:err.message})
    }
})

router.post("/api/login",async(req,res)=>{
    const {email,password} = req.body
    try{
       const user = await User.findOne({where:{email}})
       if(!user){
        return res.status(404).json({message:"user tidak ditemukan"})
       }
       const compare = await bcrypt.compare(password,user.passwordHash)
       if(!compare){
        return res.status(400).json({message:"Password Salah"})
       }
       const sessions = await Session.create({
           userId:user.id,
           userAgents: req.headers['user-agent'],
           ipAddress: req.ip,
           expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),

       })
       return res.json({message:"Login berhasil",status:200,sessions})  
    }catch(err){
        return res.status(500).json({message:err.message})
    }
})
router.put("/api/profile",async(req,res)=>{
    const {token} = req.headers
    const {gender,birthday,location,website,phone,bio} = req.body
    try{
        const sessions = await Session.findByPk(token,{include:"user"})
        if(!sessions | sessions.revoked){
            return res.status(401).json({message:"Unauthorized"})
        }
        const [profile,created] = await Profile.findOrCreate({
            where:{userId:sessions.user.id},
        })
        await profile.update({
            gender:gender,
            birthday,
            location,
            website,
            phone
        })
        await sessions.user.update({
  bio,
})

        return res.json({message:"Profile berhasil diupdate",status:200,profile})
    }catch(err){
        return res.status(500).json({message:err.message})
    }
})
router.get("/me",isAuthenticated,async(req,res)=>{
    return res.json(req.user)
})
export default router