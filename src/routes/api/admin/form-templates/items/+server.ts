import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { formTemplateItems } from '$lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const formTemplateId = url.searchParams.get('formTemplateId');

	if (!formTemplateId) {
		return json({ success: false, message: 'กรุณาระบุ formTemplateId' }, { status: 400 });
	}

	const items = await db
		.select()
		.from(formTemplateItems)
		.where(eq(formTemplateItems.formTemplateId, formTemplateId))
		.orderBy(formTemplateItems.sortOrder);

	return json({ success: true, data: items });
};

export const POST: RequestHandler = async ({ request }) => {
	const { formTemplateId, itemCode, category, description, isDisposalCriteria, sortOrder } =
		await request.json();

	if (!formTemplateId || !itemCode?.trim() || !category?.trim() || !description?.trim()) {
		return json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
	}

	const result = await db
		.insert(formTemplateItems)
		.values({
			formTemplateId,
			itemCode: itemCode.trim(),
			category: category.trim(),
			description: description.trim(),
			isDisposalCriteria: isDisposalCriteria || false,
			sortOrder: sortOrder || 0
		})
		.returning();

	return json({ success: true, data: result[0] });
};

export const PUT: RequestHandler = async ({ request }) => {
	const body = await request.json();

	// Support bulk update (reorder) or single update
	if (Array.isArray(body)) {
		// Bulk reorder
		for (const item of body) {
			await db
				.update(formTemplateItems)
				.set({
					sortOrder: item.sortOrder,
					itemCode: item.itemCode,
					category: item.category,
					description: item.description,
					isDisposalCriteria: item.isDisposalCriteria,
					updatedAt: new Date()
				})
				.where(eq(formTemplateItems.id, item.id));
		}
		return json({ success: true });
	}

	const { id, itemCode, category, description, isDisposalCriteria, sortOrder } = body;

	if (!id) {
		return json({ success: false, message: 'ไม่พบ ID' }, { status: 400 });
	}

	const updateData: Record<string, any> = { updatedAt: new Date() };
	if (itemCode !== undefined) updateData.itemCode = itemCode.trim();
	if (category !== undefined) updateData.category = category.trim();
	if (description !== undefined) updateData.description = description.trim();
	if (isDisposalCriteria !== undefined) updateData.isDisposalCriteria = isDisposalCriteria;
	if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

	const result = await db
		.update(formTemplateItems)
		.set(updateData)
		.where(eq(formTemplateItems.id, id))
		.returning();

	return json({ success: true, data: result[0] });
};

export const DELETE: RequestHandler = async ({ request }) => {
	const { id } = await request.json();

	await db.delete(formTemplateItems).where(eq(formTemplateItems.id, id));
	return json({ success: true });
};
