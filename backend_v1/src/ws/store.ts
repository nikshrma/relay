import cookie from "cookie";
import type { IncomingMessage } from "http";
import jwt from "jsonwebtoken";
import type WebSocket from "ws";

const map: Map<string,WebSocket> =  new Map();

export function addUser(id:string , socket:WebSocket){
    map.set(id,socket);
}
export function removeUserSocket(id:string , socket:WebSocket){
    const exists = map.get(id);
    if(exists==socket){
    map.delete(id);
    }
}
export function getUserSocket(id:string){
    return map.get(id);
}
