import type { FastifyPluginAsync } from 'fastify';
import {eq} from 'drizzle-orm';
import { signupSchema, loginSchema } from '@relay/shared';
import {db} from '../db/client.js';
import {users} from '../db/schema.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import {createSession, deleteSession} from '../auth/session.js';
import { SESSION_COOKIE, setSessionCookie, clearSessionCookie } from '../auth/authenticate.js';


export const authRoutes: FastifyPluginAsync = async(app) => {
    app.post('/signup', async(req, reply) => {
        const parsed = signupSchema.safeParse(req.body);
        if(!parsed.success) return reply.code(400).send ({ error: 'Invalid input', issues:parsed.error.issues });
        const {email, name, password} = parsed.data;

        const [user] = await db
            .insert(users)
            .values({email, name, passwordHash: await hashPassword(password)})
            .onConflictDoNothing({target: users.email})
            .returning({id: users.id, email: users.email, name:users.name});
        if(!user) return reply.code(409).send({error: 'email registered already'});

        const { token, expiresAt} = await createSession(user.id);
        setSessionCookie(reply, token, expiresAt);
        return reply.code(201).send({user});
        
    });

    app.post('/login', async(req, reply) => {
        const parsed = loginSchema.safeParse(req.body);
        if(!parsed.success) return reply.code(400).send({error: 'invalid input'});
        const {email, password} = parsed.data;

        const [user] = await db.select().from(users).where(eq(users.email, email));
        const ok = user ? await verifyPassword(user.passwordHash, password) : false;
        if (!user || !ok) return reply.code(401).send({error: 'invalid email or password'});

        const {token, expiresAt} = await createSession(user.id);
        setSessionCookie(reply, token, expiresAt);
        return {user: {id: user.id, email: user.email, name: user.name}};
    });

    app.post('/logout', async(req, reply) => {
        const token = req.cookies[SESSION_COOKIE];
        if (token) await deleteSession(token);
        clearSessionCookie(reply);
        return reply.code(204).send();
        
    });
};