import bcrypt from "bcrypt"
import { prisma } from "../../lib/db.js";
const saltRounds=10;

export async function checkUserExistance(number:string){
    return await prisma.user.findUnique({
        where:{
            number
        }
    })
}
//TODO: Add zod type for userPayload
export async function createUser(userPayload:any){
    const userHash = await bcrypt.hash(userPayload.password , saltRounds)
    const user = await prisma.user.create({
        data:{
            number:userPayload.number,
            password:userHash,
            name:userPayload.name
        }})
        return user;
    }
    
//TODO: Add zod type for userPayload
export async function signInUser(userPayload:any, hash:string){
    const a:boolean = await bcrypt.compare(userPayload.password , hash);
    return a;
}