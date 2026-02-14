import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { departments, generators } from '$lib/db/schema';
import { eq, sql, ilike } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const search = url.searchParams.get('search') || '';

	const deptList = await db
		.select({
			id: departments.id,
			name: departments.name,
			createdAt: departments.createdAt,
			generatorCount: sql<number>`count(${generators.id})::int`
		})
		.from(departments)
		.leftJoin(generators, eq(generators.departmentId, departments.id))
		.where(search ? ilike(departments.name, `%${search}%`) : undefined)
		.groupBy(departments.id)
		.orderBy(departments.name);

	return json({ success: true, data: deptList });
};

export const POST: RequestHandler = async ({ request }) => {
	const { name } = await request.json();

	if (!name?.trim()) {
		return json({ success: false, message: 'กรุณาระบุชื่อสังกัด' }, { status: 400 });
	}

	const result = await db.insert(departments).values({ name: name.trim() }).returning();
	return json({ success: true, data: result[0] });
};

export const PUT: RequestHandler = async ({ request }) => {
	const { id, name } = await request.json();

	if (!id || !name?.trim()) {
		return json({ success: false, message: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
	}

	const result = await db
		.update(departments)
		.set({ name: name.trim(), updatedAt: new Date() })
		.where(eq(departments.id, id))
		.returning();

	return json({ success: true, data: result[0] });
};

export const DELETE: RequestHandler = async ({ request }) => {
	const { id } = await request.json();

	// Check if department has generators
	const genCount = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(generators)
		.where(eq(generators.departmentId, id));

	if (genCount[0].count > 0) {
		return json(
			{ success: false, message: 'ไม่สามารถลบสังกัดที่มีเครื่องกำเนิดไฟฟ้าอยู่ได้' },
			{ status: 400 }
		);
	}

	await db.delete(departments).where(eq(departments.id, id));
	return json({ success: true });
};
