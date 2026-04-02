import express, {type Express, type Request, type Response} from 'express'
import authMiddleware from './middlewares/auth.middlewares.js';
import { prisma } from '../lib/db.js';
import { checkUserExistance, createUser, signInUser } from './services/auth.services.js';
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { fetchMessages, fetchUsers } from './services/app.services.js';

dotenv.config();
const app: Express=express();
app.use(express.json());
app.use(cookieParser())

app.post("/signup",async (req:Request , res:Response)=>{
    const userPayload = req.body;
    //TODO: Add zod type here for userPayload
    if(!userPayload || !userPayload.number || !userPayload.password || !userPayload.name){
        return res.status(400).json({message:"Missing args"})
    }
    const user = await checkUserExistance(userPayload.number.toString());
    if(user){
        return res.status(400).json({message:"User already exists"})
    }
    let createdUser;
    try{
         createdUser = await createUser({
             ...userPayload,
             number: userPayload.number.toString(),
             name: userPayload.name.toString()
         });
    }catch(e){
        return res.status(400).json({message:"Please try again later"})
    }
    const token = jwt.sign({id:createdUser.id}, process.env.JWT_SECRET as string)
    res.cookie("token",token ,{
        httpOnly:true,
        secure:false,
        sameSite:"lax"
    })
    return res.status(200).json({message:"User created"})
})

app.post("/signin",async(req:Request , res:Response)=>{
   const userPayload = req.body;
    //TODO: Add zod type here for userPayload
    if(!userPayload || !userPayload.number || !userPayload.password){
        return res.status(400).json({message:"Missing args"})
    }
    const user = await checkUserExistance(userPayload.number.toString());
    if(!user){
        return res.status(400).json({message:"User doesn't exist. Please signup"})
    }
   const a = await signInUser(userPayload , user.password)
   if(!a){
    return res.status(403).json({message:"Invalid password."})
   }
    const token = jwt.sign({id:user.id}, process.env.JWT_SECRET as string)
    res.cookie("token",token ,{
        httpOnly:true,
        secure:false,
        sameSite:"lax"
    })
    return res.status(200).json({"message":"Signed in"});
  
})
app.get("/users",authMiddleware,async(req:Request , res:Response)=>{
    if(!req.id){
        return res.json({"message":"unauthorised"})
    }
    try{
        const users = await fetchUsers(req.id) 
        res.status(200).json({users})
    }catch(e){
        return res.status(500).json({message:"Try again"})
    }
})
app.get("/messages",authMiddleware,async(req:Request , res:Response)=>{
     if(!req.id){
        return res.json({"message":"unauthorised"})
    }
    const to = req.query.to as string;
    const from = req.query.from as string;

    if (req.id !== to && req.id !== from) {
        return res.status(403).json({ message:" Forbidden:you are not a participant in this conversation. "});
    }

    if (!to || !from) {
    return res.status(400).json({message: "Missing 'to' or 'from' query params"});
    }
     try{
        const messages = await fetchMessages(to,from);
        res.status(200).json({messages})
    }catch(e){
        return res.status(500).json({message:"Try again"})
    }
})

export default app;