import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { buildApp } from "../app.js";
import { db } from '../db/client.js';
import { users } from '../db/schema.js';

const email = `auth-${crypto.randomUUID()}@example.com`;
const password = 'correct horse battery staple';
let app: Awaited<ReturnType<typeof buildApp>>;

beforeAll(async () => {
   app = await buildApp({sessionSecret: 'qwertyuiopazsdfghjklzxcvbnmqwerty'});
});

afterAll(async() => {
     await db.delete(users).where(eq(users.email, email)); //remove session
     await app.close();
     await db.$client.end();
});

const sessionCookie = (res: { cookies: {name: string; value: string; httpOnly?: boolean}[] }) => res.cookies.find((c) => c.name === 'relay_session');

describe('auth', () => {
    it('signs up, sets an httpOnly cookie and never return the hash', async() => {
        const res = await app.inject({ method: 'POST', url: '/api/auth/signup', payload:{email, name: 'Pitou', password}});
        expect(res.statusCode).toBe(201);
        expect(sessionCookie(res)?.httpOnly).toBe(true);
        expect(res.body).not.toContain('passwordHash');
    });

    it('reject a duplicate email with 409', async() => {
        const res = await app.inject({ method: 'POST', url:'/api/auth/signup', payload:{email, name: 'Pitou', password}});
        expect(res.statusCode).toBe(409)
    });

    it('reject invalid input with 400', async() => {
        const res = await app.inject({ method: 'POST', url:'/api/auth/signup', payload:{email: 'not-an-email', name: '', password: '123'}});
        expect(res.statusCode).toBe(400);
    })
    
    it('reject a wrong password with 401', async() => {
        const res = await app.inject({ method: 'POST', url:'/api/auth/login', payload:{email, password: 'wrong password'}});
        expect(res.statusCode).toBe(401);
    })

    it('return 401 from /api/me without a cookie', async() => {
        const res = await app.inject({ method: 'GET', url:'/api/me'});
        expect(res.statusCode).toBe(401);
    })

    it('logs in, read /api/me, logout, and the old cookie stop working', async() => {
        const login = await app.inject({method:'POST', url:'/api/auth/login', payload:{email, password}});
        expect(login.statusCode).toBe(200);
        const cookies = {relay_session: sessionCookie(login)!.value};

        const me = await app.inject({method: 'GET', url:'/api/me', cookies });
        expect(me.statusCode).toBe(200);
        expect(me.json().user.email).toBe(email);

        const logout = await app.inject({method: 'POST', url:'/api/auth/logout', cookies});
        expect(logout.statusCode).toBe(204);

        const after = await app.inject({method: 'GET', url:'/api/me', cookies});
        expect(after.statusCode).toBe(401);
    });

});