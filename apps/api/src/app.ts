import path from 'node:path';
import fastify from 'fastify';
import cookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import { authRoutes } from './routes/auth.js';
import { meRoute } from './routes/me.js';


export async function buildApp(opts: {sessionSecret: string, serverWeb?: boolean}) {

    const app = fastify({logger: process.env.NODE_ENV !== 'test'});
    await app.register(cookie, {secret: opts.sessionSecret});

    app.get('/api/health', async() => ({ok: true}));
    await app.register(authRoutes, {prefix: '/api/auth'});
    await app.register(meRoute, {prefix: '/api'});


    if(opts.serverWeb){
        await app.register(fastifyStatic, {root: path.resolve(import.meta.dirname, '../../web/dist')});
        app.setNotFoundHandler((req, reply) => 
            req.url.startsWith('/api')
            ? reply.code(404).send({error:'not Found'})
            : reply.sendFile('index.html'));
    }

    return app;
    
}