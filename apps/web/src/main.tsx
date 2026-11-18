import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Navigate} from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient.ts';
import { RequireAuth } from './routes/RequireAuth.tsx';
import { SignIn } from './routes/SignIn.tsx';
import { Signup } from './routes/Singup.tsx';
import { Home } from './routes/Home.tsx';
import './index.css';


const router = createBrowserRouter([
  {path: '/sign-in', element:<SignIn/>},
  {path: '/sign-up', element:<Signup/>},
  {
    element: <RequireAuth/>,
    children: [
      {path:'/', element: <Home/>},
      //boreds id and element board
    ],
  },
  {path: '*', element: <Navigate to="/" replace/>},
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router}/>

    </QueryClientProvider>
  </StrictMode>,
);
