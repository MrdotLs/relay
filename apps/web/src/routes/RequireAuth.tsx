import { Navigate, Outlet, useLocation } from "react-router";
import {useMe} from '../lib/auth';

export function RequireAuth() {
    const me = useMe();
    const location = useLocation();

    if (me.isPending) return <p className="p-8 text-gray-500">Loading...</p>
    if (me.isError) return <p className="p-8 text-red-500">Couldn't reach the Server. Refresh to try again</p>
    if (!me.data) {

        return <Navigate to="/sign-in" replace state={{from:location.pathname + location.search}} />;
    }
    return <Outlet/>;
}