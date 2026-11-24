import type{ FastifyReply, FastifyRequest } from "fastify";
import {and, eq} from 'drizzle-orm';
import {z} from 'zod';
import {db} from '../db/client.js';
import { memberships} from "../db/schema.js";


export type Role = 'viewer' | 'member' | 'owner';

const rank: Record<Role, number> = {viewer:1, member:2, owner:3};


declare module 'fastify' {
    interface FastifyRequest {
        membership?: {workspaceId: string, role:Role};
    }
}

type findWorkspace = (id: string) => Promise<string | null>;

const isUuid = (value: unknown): value is string => z.uuid().safeParse(value).success;

export function requireRole(minRole: Role, findWorkspace: findWorkspace) {
    return async function checkRole(req: FastifyRequest, reply:FastifyReply) {
        const {id} = req.params as {id?:string};

        const workspaceId = isUuid(id) ? await findWorkspace(id): null;

        const [membership] = workspaceId ? await db
        .select({role: memberships.role})
        .from(memberships)
        .where(and(eq(memberships.workspaceId, workspaceId), eq(memberships.userId, req.user!.id))) : [];
        
        if (!workspaceId || !membership) return reply.code(404).send({error:'Not found'});
        if (rank[membership.role] < rank[minRole]) {
            return reply.code(403).send({error: "you dont have permission to perform that"});

        }
        req.membership = {workspaceId, role:membership.role};
    };
}

export const byWorkspaceId: findWorkspace = async(id) => id;

