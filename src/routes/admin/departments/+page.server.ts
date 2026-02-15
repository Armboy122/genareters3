import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/db';
import { departments, generators } from '$lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const deptList = await db
		.select({
			id: departments.id,
			name: departments.name,
			createdAt: departments.createdAt,
			updatedAt: departments.updatedAt,
			generatorCount: sql<number>`count(${generators.id})::int`
		})
		.from(departments)
		.leftJoin(generators, eq(generators.departmentId, departments.id))
		.groupBy(departments.id)
		.orderBy(departments.name);

	return { departments: deptList };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name') as string;

		if (!name?.trim()) {
			return fail(400, { error: 'กรุณาระบุชื่อสังกัด', name });
		}

		try {
			await db.insert(departments).values({ name: name.trim() });
			return { success: true };
		} catch (error) {
			console.error('Create department error:', error);
			return fail(500, { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่', name });
		}
	},

	update: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		const name = data.get('name') as string;

		if (!id || !name?.trim()) {
			return fail(400, { error: 'ข้อมูลไม่ครบถ้วน' });
		}

		try {
			await db
				.update(departments)
				.set({ name: name.trim(), updatedAt: new Date() })
				.where(eq(departments.id, id));
			return { success: true };
		} catch (error) {
			console.error('Update department error:', error);
			return fail(500, { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
		}
	},

	delete: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;

		if (!id) {
			return fail(400, { error: 'ไม่พบ ID' });
		}

		try {
			const genCount = await db
				.select({ count: sql<number>`count(*)::int` })
				.from(generators)
				.where(eq(generators.departmentId, id));

			if (genCount[0].count > 0) {
				return fail(400, { error: 'ไม่สามารถลบสังกัดที่มีเครื่องกำเนิดไฟฟ้าอยู่ได้' });
			}

			await db.delete(departments).where(eq(departments.id, id));
			return { success: true };
		} catch (error) {
			console.error('Delete department error:', error);
			return fail(500, { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
		}
	}
};
