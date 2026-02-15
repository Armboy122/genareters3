import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/db';
import { users, departments } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';

export const load: PageServerLoad = async () => {
	const [userList, departmentsList] = await Promise.all([
		db
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
			.orderBy(users.createdAt),
		db
			.select()
			.from(departments)
			.orderBy(departments.name)
	]);

	return {
		users: userList,
		departments: departmentsList
	};
};

export const actions: Actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const username = data.get('username') as string;
		const password = data.get('password') as string;
		const displayName = data.get('displayName') as string;
		const role = data.get('role') as string;
		const departmentId = data.get('departmentId') as string;

		if (!username?.trim() || !password || !displayName?.trim() || !role) {
			return fail(400, { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
		}

		if (password.length < 4) {
			return fail(400, { error: 'รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร' });
		}

		try {
			const passwordHash = await bcrypt.hash(password, 10);
			await db.insert(users).values({
				username: username.trim(),
				passwordHash,
				displayName: displayName.trim(),
				role: role as 'admin' | 'inspector' | 'viewer',
				departmentId: departmentId || null
			});
			return { success: true };
		} catch (e: any) {
			if (e.message?.includes('unique') || e.message?.includes('duplicate')) {
				return fail(400, { error: 'ชื่อผู้ใช้นี้มีอยู่แล้วในระบบ' });
			}
			console.error('Create user error:', e);
			return fail(500, { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
		}
	},

	update: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		const displayName = data.get('displayName') as string;
		const role = data.get('role') as string;
		const departmentId = data.get('departmentId') as string;
		const password = data.get('password') as string;

		if (!id) {
			return fail(400, { error: 'ไม่พบ ID' });
		}

		try {
			const updateData: Record<string, any> = { updatedAt: new Date() };
			if (displayName) updateData.displayName = displayName.trim();
			if (role) updateData.role = role;
			updateData.departmentId = departmentId || null;

			if (password && password.length >= 4) {
				updateData.passwordHash = await bcrypt.hash(password, 10);
			}

			await db.update(users).set(updateData).where(eq(users.id, id));
			return { success: true };
		} catch (error) {
			console.error('Update user error:', error);
			return fail(500, { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
		}
	},

	toggleActive: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		const isActive = data.get('isActive') === 'true';

		if (!id) {
			return fail(400, { error: 'ไม่พบ ID' });
		}

		try {
			await db
				.update(users)
				.set({ isActive, updatedAt: new Date() })
				.where(eq(users.id, id));
			return { success: true };
		} catch (error) {
			console.error('Toggle user error:', error);
			return fail(500, { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
		}
	}
};
