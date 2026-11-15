import { Server } from "socket.io";
import { buildApp } from "./app.js";

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) throw new Error('Session_Secret is not set');


const app = await buildApp({
    sessionSecret,
    serverWeb: process.env.NODE_ENV === 'production'
});

const io = new Server(app.server);
io.on('connection', (socket) => {
    //handle board join with member shipo checking and socket join
})


await app.listen({port : Number(process.env.PORT ?? 3000), host : '0.0.0.0'})
