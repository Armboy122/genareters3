import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { formTemplates, formTemplateItems, generators } from '$lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const templates = await db
		.select({
			id: formTemplates.id,
			name: formTemplates.name,
			description: formTemplates.description,
			isActive: formTemplates.isActive,
			createdAt: formTemplates.createdAt,
			itemCount: sql<number>`count(distinct ${formTemplateItems.id})::int`,
			generatorCount: sql<number>`count(distinct ${generators.id})::int`
		})
		.from(formTemplates)
		.leftJoin(formTemplateItems, sql`${formTemplateItems.formTemplateId} = ${formTemplates.id} AND ${formTemplateItems.isActive} = true`)
		.leftJoin(generators, eq(generators.formTemplateId, formTemplates.id))
		.groupBy(formTemplates.id)
		.orderBy(formTemplates.name);

	return json({ success: true, data: templates });
};

export const POST: RequestHandler = async ({ request }) => {
	const { name, description } = await request.json();

	if (!name?.trim()) {
		return json({ success: false, message: 'กรุณาระบุชื่อแบบฟอร์ม' }, { status: 400 });
	}

	const result = await db
		.insert(formTemplates)
		.values({ name: name.trim(), description: description?.trim() || null })
		.returning();

	return json({ success: true, data: result[0] });
};

export const PUT: RequestHandler = async ({ request }) => {
	const { id, name, description, isActive } = await request.json();

	if (!id) {
		return json({ success: false, message: 'ไม่พบ ID' }, { status: 400 });
	}

	const updateData: Record<string, any> = { updatedAt: new Date() };
	if (name !== undefined) updateData.name = name.trim();
	if (description !== undefined) updateData.description = description?.trim() || null;
	if (isActive !== undefined) updateData.isActive = isActive;

	const result = await db
		.update(formTemplates)
		.set(updateData)
		.where(eq(formTemplates.id, id))
		.returning();

	return json({ success: true, data: result[0] });
};

export const DELETE: RequestHandler = async ({ request }) => {
	const { id } = await request.json();

	// Check if template is used by generators
	const genCount = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(generators)
		.where(eq(generators.formTemplateId, id));

	if (genCount[0].count > 0) {
		return json(
			{ success: false, message: 'ไม่สามารถลบแบบฟอร์มที่มีเครื่องใช้งานอยู่ได้' },
			{ status: 400 }
		);
	}

	await db.delete(formTemplates).where(eq(formTemplates.id, id));
	return json({ success: true });
};
