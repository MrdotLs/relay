export class ApiError extends Error {
    status: number;

    constructor(status: number, message:string) {
        super(message);
        this.status = status;
    }
}

type Options = {method?: string; body?: unknown};

export async function api<T>(path: string, {method = 'GET', body}: Options = {}): Promise<T> {
    const res = await fetch(`/api${path}`, {
        method,
        //send json header with body / any other it would reject empty one
        headers: body === undefined ? {} : {'Content-Type': 'application/json'},
        body :body === undefined ?  undefined: JSON.stringify(body),

    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new ApiError (res.status, data.error ?? res.statusText);
    }
    return res.status === 204 ? (undefined as T): res.json();
}
