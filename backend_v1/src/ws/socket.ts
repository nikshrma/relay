import { WebSocketServer, type Server } from 'ws'
import { server } from '../index.js'
import type { Server as HttpServer } from 'http'

export function initWebSocketServer(server:HttpServer ){
    const wss= new WebSocketServer({server})
}
