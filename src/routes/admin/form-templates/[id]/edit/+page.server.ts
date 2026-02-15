import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/db';
import { formTemplates, formTemplateItems } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const templateId = params.id;

	// Load template
	const templateResult = await db
		.select({
			id: formTemplates.id,
			name: formTemplates.name,
			description: formTemplates.description,
			isActive: formTemplates.isActive,
			createdAt: formTemplates.createdAt,
			updatedAt: formTemplates.updatedAt
		})
		.from(formTemplates)
		.where(eq(formTemplates.id, templateId))
		.limit(1);

	if (!templateResult[0]) {
		throw error(404, 'ไม่พบแบบฟอร์ม');
	}

	const template = templateResult[0];

	// Load template items
	const items = await db
		.select({
			id: formTemplateItems.id,
			formTemplateId: formTemplateItems.formTemplateId,
			itemCode: formTemplateItems.itemCode,
			category: formTemplateItems.category,
			description: formTemplateItems.description,
			isDisposalCriteria: formTemplateItems.isDisposalCriteria,
			sortOrder: formTemplateItems.sortOrder,
			isActive: formTemplateItems.isActive,
			createdAt: formTemplateItems.createdAt,
			updatedAt: formTemplateItems.updatedAt
		})
		.from(formTemplateItems)
		.where(eq(formTemplateItems.formTemplateId, templateId))
		.orderBy(formTemplateItems.sortOrder);

	return {
		template,
		items: items.map((item, i) => ({ ...item, sortOrder: i }))
	};
};

export const actions: Actions = {
	save: async ({ request, params }) => {
		const templateId = params.id;
		const data = await request.formData();
		const templateName = data.get('templateName') as string;
		const templateDescription = data.get('templateDescription') as string;
		const itemsJson = data.get('items') as string;

		if (!templateName?.trim()) {
			return fail(400, { error: 'กรุณาระบุชื่อแบบฟอร์ม' });
		}

		try {
			// Update template name/description
			await db
				.update(formTemplates)
				.set({
					name: templateName.trim(),
					description: templateDescription?.trim() || null,
					updatedAt: new Date()
				})
				.where(eq(formTemplates.id, templateId));

			// Parse items
			const items = JSON.parse(itemsJson || '[]') as Array<{
				id: string | null;
				itemCode: string;
				category: string;
				description: string;
				isDisposalCriteria: boolean;
				sortOrder: number;
				isNew?: boolean;
				_deleted?: boolean;
			}>;

			// Delete removed items
			for (const item of items.filter((i) => i._deleted && i.id)) {
				await db.delete(formTemplateItems).where(eq(formTemplateItems.id, item.id!));
			}

			// Create new items
			for (const item of items.filter((i) => i.isNew && !i._deleted)) {
				await db.insert(formTemplateItems).values({
					formTemplateId: templateId,
					itemCode: item.itemCode,
					category: item.category,
					description: item.description,
					isDisposalCriteria: item.isDisposalCriteria,
					sortOrder: item.sortOrder
				});
			}

			// Update existing items (bulk)
			const existingItems = items.filter((i) => i.id && !i.isNew && !i._deleted);
			for (const item of existingItems) {
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
					.where(eq(formTemplateItems.id, item.id!));
			}

			throw redirect(303, '/admin/form-templates');
		} catch (e) {
			if (e && typeof e === 'object' && 'status' in e && e.status === 303) throw e;
			console.error('Save form template edit error:', e);
			return fail(500, { error: 'เกิดข้อผิดพลาดในการบันทึก' });
		}
	}
};
