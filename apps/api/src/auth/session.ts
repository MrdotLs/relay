import {createHash, randomBytes} from 'node:crypto';
import {eq} from 'drizzle-orm';
import {db} from '../db/client.js';
import {sessions, users} from '../db/schema.js';


const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 //30 days

function hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: string){
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await db.insert(sessions).values({id: hashToken(token), userId, expiresAt});
    return {token, expiresAt};

}

export async function validateSession(token: string) {
    const id = hashToken(token);
    const [row] = await db.select({
        user: {id: users.id, email: users.email, name:users.name},
        expiresAt: sessions.expiresAt, 
    }).from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, id));
    
    if(!row) return null;
    if (row.expiresAt.getTime() <= Date.now()) {
        await db.delete(sessions).where(eq(sessions.id, id));
        return null;
    }
    return {user: row.user, expiresAt: row.expiresAt};
}

export async function deleteSession(token:string) {
    await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
    
}
