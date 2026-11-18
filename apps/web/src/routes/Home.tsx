import { useLogout, useMe } from "../lib/auth";

export function Home() {
    const me = useMe();
    const logout = useLogout();

    if(!me.data) return null;

    return (
        <main className="p-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Hello, {me.data.user.name}</h1>
                <button onClick={() => logout.mutate()} disabled={logout.isPending} className="rounded border px-3 py-1.5 text-sm">Logout</button>
            </div>
            <p className="mt-4 text-gray-600">
                you are in {me.data.workspaces.length} workspaces(s). the workspaces grid arrive in week 2 development.
            </p>
        </main>
    )
}