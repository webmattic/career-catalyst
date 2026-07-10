import { requireAdminSession } from '../lib/admin-auth.js';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';
  const isLoginRoute = pathname === '/admin/login' || pathname === '/admin/api/login';
  const isApiRoute = pathname.startsWith('/admin/api/');

  if (isLoginRoute) {
    return context.next();
  }

  const authResponse = requireAdminSession({
    request: context.request,
    env: context.env,
    isApiRoute,
  });

  if (authResponse) {
    return authResponse;
  }

  return context.next();
}
