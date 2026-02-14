import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { users, departments } from '$lib/db/schema';
import { eq, sql, ilike } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const search = url.searchParams.get('search') || '';

	const userList = await db
		.select({
			id: users.id,
			username: users.username,
			displayName: users.displayName,
			role: users.role,
			departmentId: users.departmentId,
			departmentName: departments.name,
			isActive: users.isActive,
			createdAt: users.createdAt
		})
		.from(users)
		.leftJoin(departments, eq(departments.id, users.departmentId))
		.where(
			search
				? ilike(users.displayName, `%${search}%`)
				: undefined
		)
		.orderBy(users.createdAt);

	return json({ success: true, data: userList });
};

export const POST: RequestHandler = async ({ request }) => {
	const { username, password, displayName, role, departmentId } = await request.json();

	if (!username?.trim() || !password || !displayName?.trim() || !role) {
		return json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
	}

	try {
		const passwordHash = await bcrypt.hash(password, 10);
		const result = await db
			.insert(users)
			.values({
				username: username.trim(),
				passwordHash,
				displayName: displayName.trim(),
				role,
				departmentId: departmentId || null,
				isActive: true
			})
			.returning();

		return json({ success: true, data: { ...result[0], passwordHash: undefined } });
	} catch (e: any) {
		if (e.message?.includes('unique') || e.message?.includes('duplicate')) {
			return json({ success: false, message: 'ชื่อผู้ใช้นี้มีอยู่แล้วในระบบ' }, { status: 400 });
		}
		throw e;
	}
};

export const PUT: RequestHandler = async ({ request }) => {
	const { id, username, password, displayName, role, departmentId, isActive } = await request.json();

	if (!id) {
		return json({ success: false, message: 'ไม่พบ ID' }, { status: 400 });
	}

	const updateData: Record<string, any> = { updatedAt: new Date() };
	if (username !== undefined) updateData.username = username.trim();
	if (displayName !== undefined) updateData.displayName = displayName.trim();
	if (role !== undefined) updateData.role = role;
	if (departmentId !== undefined) updateData.departmentId = departmentId || null;
	if (isActive !== undefined) updateData.isActive = isActive;
	if (password) {
		updateData.passwordHash = await bcrypt.hash(password, 10);
	}

	const result = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
	return json({ success: true, data: { ...result[0], passwordHash: undefined } });
};

export const DELETE: RequestHandler = async ({ request }) => {
	const { id } = await request.json();

	// Soft delete
	const result = await db
		.update(users)
		.set({ isActive: false, updatedAt: new Date() })
		.where(eq(users.id, id))
		.returning();

	return json({ success: true, data: { ...result[0], passwordHash: undefined } });
};
