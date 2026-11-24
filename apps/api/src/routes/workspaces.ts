import type { FastifyPluginAsync} from "fastify";
import { randomBytes } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import {generateNKeysBetween} from 'fractional-indexing';
import {createBoardSchema, createWorkspaceSchema} from '@relay/shared';
import { db } from "../db/client.js";
import { boardColumns, boards, memberships, workspaces } from "../db/schema.js";
import { authenticate } from "../auth/authenticate.js";
import { byWorkspaceId, requireRole } from "../auth/requireRole.js";


function makeSlug(name: string) {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0,40);
    return `${base || 'workspace'}-${randomBytes(3).toString('hex')}`;
}

const DEFUALT_COLUMNS = ['To do', 'In progress', 'Done'];

export const workspaceRoutes: FastifyPluginAsync = async (app) => {
    app.post('/workspaces', { preHandler: authenticate}, async(req, reply) => {
        const parsed = createWorkspaceSchema.safeParse(req.body);
        if(!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0]?.message?? 'Invalid input'});
        const {name} = parsed.data;

        const workspace = await db.transaction(async(tx)=>{
            const[ws] = await tx.insert(workspaces).values({name, slug: makeSlug(name)}).returning();
            await tx.insert(memberships).values({workspaceId: ws!.id, userId:req.user!.id, role:'owner'});
            return ws!;
        });
        return reply.code(201).send({workspace: {...workspace, role: 'owner'}});
    });

    app.get(
        '/workspaces/:id/boards',
        { preHandler: [authenticate,requireRole('viewer', byWorkspaceId)]},
        async(req) => {
            const rows = await db 
            .select({ id: boards.id, name: boards.name})
            .from(boards)
            .where(eq(boards.workspaceId, req.membership!.workspaceId))
            .orderBy(asc(boards.name));
        return {boards: rows};
        },
    );

    app.post('/workspaces/:id/boards', {preHandler: [authenticate, requireRole('member', byWorkspaceId)]},
    async(req, reply) => {
        const parsed = createBoardSchema.safeParse(req.body);
        if(!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Invalid input'});

        const board = await db.transaction(async(tx) => {
            const [b] = await tx
            .insert(boards)
            .values({workspaceId: req.membership!.workspaceId, name:parsed.data.name})
            .returning({id: boards.id, name:boards.name});
        const pos = generateNKeysBetween(null, null, DEFUALT_COLUMNS.length);
        await tx.insert(boardColumns).values(
            DEFUALT_COLUMNS.map((columnName, i) => ({ boardId: b!.id, name: columnName, position: pos[i]! })),
        );
        return b!;
        });
        return reply.code(201).send({board});
    },
    );
};