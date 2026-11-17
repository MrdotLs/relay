import { describe, it, expect } from "vitest";
import { buildApp } from "./app.js";


describe('GET /api/health', () => {
    it('return ok', async () => {
        
        const app = await buildApp({ sessionSecret: 'qwertyuiopasdfghjklzxcvbnmqwerty'});
    
        const res = await app.inject({method:'GET', url: 'api/health'});

        expect(res.statusCode).toBe(200);
        expect(res.json()).toEqual({ok:true});
        await app.close();
        
    });
});



