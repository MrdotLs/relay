import {describe, it, expect, beforeAll, afterAll} from 'vitest';
import {asc, eq, inArray} from 'drizzle-orm';
import { buildApp } from '../app.js';
import {db} from '../db/client.js';
import { boardColumns, memberships, users, workspaces } from '../db/schema.js';

type TestUser = {id:string, cookies: {relay_session:string}};


let app: Awaited<ReturnType<typeof buildApp>>;
let owner: TestUser;
let viewer: TestUser;
let outsider: TestUser;
let workspaceId: string;
const createdUserIds: string[] = [];


async function signUp(label:string): Promise<TestUser> {
    const res = await app.inject({
        method: 'POST',
        url: '/api/auth/signup',
        payload: {email: `${label}-${crypto.randomUUID()}@example.com`, name: label, password: 'correct horse battery staple'},

    });
    const user = {id: res.json().user.id, cookies: {relay_session: res.cookies.find((c) => c.name === 'relay_session')!.value}};
    createdUserIds.push(user.id);
    return user;
    
}

beforeAll(async () => {
    app = await buildApp({ sessionSecret: 'qwertyuiopazsdfghjklzxcvbnmqwerty'});
    owner = await signUp('owner');
    viewer = await signUp('viewer');
    outsider = await signUp('outsider');

    const res = await app.inject({ method: 'POST', url: '/api/workspaces', cookies: owner.cookies, payload: {name: 'Test Team'}});
    workspaceId = res.json().workspace.id;

    await db.insert(memberships).values({workspaceId, userId: viewer.id, role: 'viewer'});
});

afterAll(async () => {
    if (workspaceId) await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
    if (createdUserIds.length) await db.delete(users).where(inArray(users.id, createdUserIds));
    await app.close();
    await db.$client.end();
});

describe('workspaces', () => {
    it('reject creating workspace when signed out', async () => {
        const res = await app.inject({method: 'POST', url: '/api/workspaces', payload: {name: 'Nope'}});
        expect(res.statusCode).toBe(401);
    });

    it('rejects a blank workspace name', async() => {
        const res = await app.inject({method: 'POST', url: '/api/workspaces', cookies: owner.cookies, payload: {name:'  '}});
        expect(res.statusCode).toBe(400);
    });
    it('makes the create the owner', async () => {
        const res = await app.inject({method: 'GET', url: '/api/me', cookies: owner.cookies});
        expect(res.json().workspaces).toContainEqual(expect.objectContaining({id: workspaceId, role: 'owner'}));
    });  
});

describe('board permission', () => {
    it('let the owner create a board with three starting columns', async () => {
        const res = await app.inject({
            method: 'POST',
            url: `/api/workspaces/${workspaceId}/boards`,
            cookies: owner.cookies,
            payload: {name: 'Roadmap'},
        });
        expect(res.statusCode).toBe(201);

        const columns = await db 
        .select({name: boardColumns.name})
        .from(boardColumns)
        .where(eq(boardColumns.boardId, res.json().board.id))
        .orderBy(asc(boardColumns.position));
    expect(columns.map((c) => c.name)).toEqual(['To do', 'In progress', 'Done']);
    });

    it('lets a viewer list boards', async() => {
        const res = await app.inject({
            method: 'GET',
            url:`/api/workspaces/${workspaceId}/boards`,
            cookies: viewer.cookies
        });
        expect(res.statusCode).toBe(200);
        expect(res.json().boards).toContainEqual(expect.objectContaining({name: 'Roadmap'}));
    })

    it('stops a viewer from making a board with 403', async() => {
        const res = await app.inject({
            method: 'POST',
            url: `/api/workspaces/${workspaceId}/boards`,
            cookies: viewer.cookies,
            payload: {name: "Sneaky_Sneaky"},
        });
        expect(res.statusCode).toBe(403);
    });

    it('gives an outsider 404 for both reading and writing', async() => {
        const read = await app.inject({ method: 'GET', url: `api/workspaces/${workspaceId}/boards`, cookies: outsider.cookies})
        const write = await app.inject({
            method: 'POST',
            url: `/api/workspaces/${workspaceId}/boards`,
            cookies: outsider.cookies,
            payload: {name:"Sneaky_Sneaky"},
        });
        expect(read.statusCode).toBe(404);
        expect(write.statusCode).toBe(404);
    });

    it('treat unkown malformed ids as 404, not 500', async() => {
        const unkown = await app.inject({method: 'GET', url: `/api/workspaces/${crypto.randomUUID()}/boards`, cookies: owner.cookies});
        const malformed = await app.inject({method: 'GET', url:`/api/workspaces/not-a-uuid/boards`, cookies: owner.cookies});
        expect(unkown.statusCode).toBe(404);
        expect(malformed.statusCode).toBe(404);
    });

    it('ask for sign-inb before checking role', async() => {
        const res = await app.inject({method: 'GET', url: `/api/workspaces/${workspaceId}/boards`});
        expect(res.statusCode).toBe(401);
    });
  
});