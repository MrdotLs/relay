import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password.js";

describe('password hashing', () => {
    it('verfies the right password and reject wrong password', async() => {
        const h = await hashPassword('correct horse battery staple');
        expect(h).not.toContain('correct horse'); //never store in plain
        expect(await verifyPassword(h, 'correct horse battery stable'))
        expect(await verifyPassword(h, 'wrong password')).toBe(false);
    });
});