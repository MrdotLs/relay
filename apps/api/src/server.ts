import path from 'node:path';
import Fasitfy from 'fastify';
import cookie from '@fastify/cookie';
import {Server} from 'socket.io';
import fastifyStatic from '@fastify/static';

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) throw new Error('Session_Secret is not set');

const app = Fasitfy ({logger:true});
await app.register(cookie, {secret: sessionSecret});

app.get('/api/health', async () => ({ok:true}));

if(process.env.NODE_ENV === 'production') {
    await app.register(fastifyStatic, {root: path.resolve(import.meta.dirname, '../../web/dist')});
    app.setNotFoundHandler((req, reply) =>
        req.url.startsWith('/api')
        ? reply.code(404).send({error: 'Not Found'})
        : reply.sendFile('index.html')
    );
}

const io = new Server(app.server);
io.on('connection', (socket) => {
    //session reading 
    // handle board join by checking membership and calling socket join
});

await app.listen({port : Number(process.env.PORT ?? 3000), host : '0.0.0.0'})
