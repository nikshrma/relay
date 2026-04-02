import { prisma } from "../../lib/db.js";

export async function fetchUsers(id: string){
    const otherUsers = await prisma.user.findMany({
        where:{
            id:{
                not:id
            }
        },
        select:{
            id:true,
            name:true,
            number:true,
            password:false
        }
    })
    return otherUsers;
}

export async function fetchMessages(userA: string, userB: string){
    const messages = await prisma.message.findMany({
        where:{
            OR:[
                {
                    receiverId:userA,
                    senderId:userB
                },
                {
                    receiverId:userB,
                    senderId:userA
                }
            ],
        },
        select:{
            content:true,
            createdAt:true,
            id:true,
            senderId:true,
            receiverId:true
        },
        orderBy:{
            createdAt:"asc"
        }
    })
    return messages;
}