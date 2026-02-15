import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
	try {
		cookies.delete('session', { path: '/' });
		return json({ success: true });
	} catch (error) {
		console.error('POST /api/auth/logout error:', error);
		return json({ success: false, message: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }, { status: 500 });
	}
};
