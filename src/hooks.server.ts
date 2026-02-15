import { redirect, type Handle } from '@sveltejs/kit';
import { verifySession } from '$lib/server/session';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionCookie = event.cookies.get('session');

	if (sessionCookie) {
		const user = verifySession(sessionCookie);
		event.locals.user = user;
	} else {
		event.locals.user = null;
	}

	// Protect /admin routes - require login with admin role
	if (event.url.pathname.startsWith('/admin')) {
		if (!event.locals.user) {
			throw redirect(302, '/login?redirect=' + encodeURIComponent(event.url.pathname));
		}
		if (event.locals.user.role !== 'admin') {
			throw redirect(302, '/dashboard');
		}
	}

	// Protect /api/admin routes
	if (event.url.pathname.startsWith('/api/admin')) {
		if (!event.locals.user || event.locals.user.role !== 'admin') {
			return new Response(JSON.stringify({ success: false, message: 'ไม่มีสิทธิ์เข้าถึง' }), {
				status: 403,
				headers: { 'Content-Type': 'application/json' }
			});
		}
	}

	// Protect /dashboard route - require login
	if (event.url.pathname.startsWith('/dashboard')) {
		if (!event.locals.user) {
			throw redirect(302, '/login?redirect=' + encodeURIComponent(event.url.pathname));
		}
	}

	// Protect /department routes - require login
	if (event.url.pathname.startsWith('/department')) {
		if (!event.locals.user) {
			throw redirect(302, '/login?redirect=' + encodeURIComponent(event.url.pathname));
		}
	}

	// Protect /inspection routes - require login
	if (event.url.pathname.startsWith('/inspection')) {
		if (!event.locals.user) {
			throw redirect(302, '/login?redirect=' + encodeURIComponent(event.url.pathname));
		}
	}

	return resolve(event);
};
