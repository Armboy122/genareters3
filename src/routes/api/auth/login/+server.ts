import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { users } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
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

	// Set session cookie with user info (simple approach - JSON encoded)
	const sessionData = JSON.stringify({
		id: user.id,
		username: user.username,
		displayName: user.displayName,
		role: user.role,
		departmentId: user.departmentId
	});

	// Base64 encode for cookie safety
	const encoded = Buffer.from(sessionData).toString('base64');

	cookies.set('session', encoded, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 7 // 7 days
	});

	return json({
		success: true,
		user: {
			id: user.id,
			username: user.username,
			displayName: user.displayName,
			role: user.role
		}
	});
};
