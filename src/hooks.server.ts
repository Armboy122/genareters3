import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionCookie = event.cookies.get('session');

	if (sessionCookie) {
		try {
			const decoded = Buffer.from(sessionCookie, 'base64').toString('utf-8');
			event.locals.user = JSON.parse(decoded);
		} catch {
			event.locals.user = null;
		}
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

	return resolve(event);
};
