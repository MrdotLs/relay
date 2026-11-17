import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {eq} from 'drizzle-orm';
import {db} from '../db/client.js';
import {users, sessions} from '../db/schema.js';
import {createSession, validateSession, deleteSession} from './session.js'

describe('sessions', () => {
    let userId: string;

    beforeAll(async () => {
        const [u] = await db
            .insert(users)
            .values({ email: `test-${crypto.randomUUID()}@example.com`, name: 'Test', passwordHash: 'x'})
            .returning ();
        userId = u!.id;
    });

    afterAll(async() => {
        await db.delete(users).where(eq(users.id, userId));
        await db.$client.end();
    });

    it('creates, validate and delete a session', async() => {
        const {token} = await createSession(userId);
        expect((await validateSession(token))?.user.id).toBe(userId); 

        await deleteSession(token);
        expect(await validateSession(token)).toBeNull();
    });

    it('rejects an unkown token', async() => {
        expect(await validateSession('not-a-real-token')).toBeNull();
    });

    it('rejects an expired session', async() => {
        const {token} = await createSession(userId);
        await db.update(sessions)
            .set({expiresAt: new Date(Date.now() - 1000)})
            .where(eq(sessions.userId, userId));
        expect(await validateSession(token)).toBeNull()
    });

 

});