import type { FastifyReply, FastifyRequest } from "fastify";
import { validateSession } from "./session.js";

export const SESSION_COOKIE = 'relay_session';

declare module 'fastify' {
    interface FastifyRequest{
        user? : {id: string; email: string; name:string};
    }
}

export function setSessionCookie(reply: FastifyReply, token: string, expiresAt: Date) {
    reply.setCookie(SESSION_COOKIE, token, {
        httpOnly:true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: expiresAt,
    });
    
}

export function clearSessionCookie(reply: FastifyReply) {
    reply.clearCookie(SESSION_COOKIE, {path: '/'});
}

export async function authenticate(req:FastifyRequest, reply: FastifyReply) {
    const token = req.cookies[SESSION_COOKIE];
    const result = token ? await validateSession(token) : null;
    if (!result) return reply.code(401).send ({ error: 'Not signed in'});
    req.user = result.user;
}