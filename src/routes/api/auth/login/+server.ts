import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { users } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { signSession, getSessionCookieOptions } from '$lib/server/session';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { username, password } = await request.json();

		if (!username || !password) {
			return json({ success: false, message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' }, { status: 400 });
		}

		const userList = await db
			.select()
			.from(users)
			.where(eq(users.username, username))
			.limit(1);

		const user = userList[0];

		if (!user) {
			return json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
		}

		if (!user.isActive) {
			return json({ success: false, message: 'บัญชีนี้ถูกปิดใช้งาน' }, { status: 403 });
		}

		const passwordMatch = await bcrypt.compare(password, user.passwordHash);
		if (!passwordMatch) {
			return json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
		}

		// Create signed session token
		const sessionData = {
			id: user.id,
			username: user.username,
			displayName: user.displayName,
			role: user.role,
			departmentId: user.departmentId
		};

		const token = signSession(sessionData);

		// Set session cookie with signed token
		cookies.set('session', token, getSessionCookieOptions());

		return json({
			success: true,
			user: {
				id: user.id,
				username: user.username,
				displayName: user.displayName,
				role: user.role
			}
		});
	} catch (error) {
		console.error('POST /api/auth/login error:', error);
		return json({ success: false, message: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }, { status: 500 });
	}
};
