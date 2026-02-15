import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/db';
import { formTemplates, formTemplateItems, generators } from '$lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
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

	return { templates };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		const description = data.get('description') as string;

		if (!name?.trim()) {
			return fail(400, { error: 'กรุณาระบุชื่อแบบฟอร์ม' });
		}

		try {
			const result = await db
				.insert(formTemplates)
				.values({ name: name.trim(), description: description?.trim() || null })
				.returning();
			return { success: true, newId: result[0].id };
		} catch (error) {
			console.error('Create form template error:', error);
			return fail(500, { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
		}
	},

	update: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		const name = data.get('name') as string | null;
		const description = data.get('description') as string | null;
		const isActive = data.get('isActive');

		if (!id) {
			return fail(400, { error: 'ไม่พบ ID' });
		}

		try {
			const updateData: Record<string, any> = { updatedAt: new Date() };
			if (name !== null) updateData.name = name.trim();
			if (description !== null) updateData.description = description?.trim() || null;
			if (isActive !== null) updateData.isActive = isActive === 'true';

			await db.update(formTemplates).set(updateData).where(eq(formTemplates.id, id));
			return { success: true };
		} catch (error) {
			console.error('Update form template error:', error);
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
				.update(formTemplates)
				.set({ isActive, updatedAt: new Date() })
				.where(eq(formTemplates.id, id));
			return { success: true };
		} catch (error) {
			console.error('Toggle form template error:', error);
			return fail(500, { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
		}
	},

	duplicate: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;

		if (!id) {
			return fail(400, { error: 'ไม่พบ ID' });
		}

		try {
			// Get original template
			const original = await db
				.select()
				.from(formTemplates)
				.where(eq(formTemplates.id, id))
				.limit(1);

			if (!original[0]) {
				return fail(404, { error: 'ไม่พบแบบฟอร์มต้นฉบับ' });
			}

			// Create copy
			const newTemplate = await db
				.insert(formTemplates)
				.values({
					name: `${original[0].name} (สำเนา)`,
					description: original[0].description
				})
				.returning();

			// Copy items
			const items = await db
				.select()
				.from(formTemplateItems)
				.where(eq(formTemplateItems.formTemplateId, id))
				.orderBy(formTemplateItems.sortOrder);

			if (items.length > 0) {
				await db.insert(formTemplateItems).values(
					items.map((item) => ({
						formTemplateId: newTemplate[0].id,
						itemCode: item.itemCode,
						category: item.category,
						description: item.description,
						isDisposalCriteria: item.isDisposalCriteria,
						sortOrder: item.sortOrder
					}))
				);
			}

			return { success: true };
		} catch (error) {
			console.error('Duplicate form template error:', error);
			return fail(500, { error: 'ไม่สามารถทำสำเนาได้' });
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
				.where(eq(generators.formTemplateId, id));

			if (genCount[0].count > 0) {
				return fail(400, { error: 'ไม่สามารถลบแบบฟอร์มที่มีเครื่องใช้งานอยู่ได้' });
			}

			await db.delete(formTemplates).where(eq(formTemplates.id, id));
			return { success: true };
		} catch (error) {
			console.error('Delete form template error:', error);
			return fail(500, { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
		}
	}
};
