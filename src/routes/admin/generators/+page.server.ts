import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/db';
import { generators, departments, formTemplates } from '$lib/db/schema';
import { eq, sql, ilike, and, or } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('search') || '';
	const departmentId = url.searchParams.get('departmentId') || '';
	const type = url.searchParams.get('type') || '';
	const formTemplateId = url.searchParams.get('formTemplateId') || '';
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = 25;
	const offset = (page - 1) * limit;

	const conditions = [];
	if (search) {
		conditions.push(
			or(
				ilike(generators.assetId, `%${search}%`),
				ilike(generators.product, `%${search}%`),
				ilike(generators.location, `%${search}%`)
			)
		);
	}
	if (departmentId) conditions.push(eq(generators.departmentId, departmentId));
	if (type) conditions.push(eq(generators.type, type));
	if (formTemplateId) conditions.push(eq(generators.formTemplateId, formTemplateId));

	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	const [genList, countResult, departmentsList, templatesList] = await Promise.all([
		db
			.select({
				id: generators.id,
				assetId: generators.assetId,
				type: generators.type,
				sizeKw: generators.sizeKw,
				product: generators.product,
				location: generators.location,
				departmentId: generators.departmentId,
				departmentName: departments.name,
				formTemplateId: generators.formTemplateId,
				formTemplateName: formTemplates.name,
				isActive: generators.isActive,
				createdAt: generators.createdAt
			})
			.from(generators)
			.leftJoin(departments, eq(departments.id, generators.departmentId))
			.leftJoin(formTemplates, eq(formTemplates.id, generators.formTemplateId))
			.where(whereClause)
			.orderBy(generators.assetId)
			.limit(limit)
			.offset(offset),
		db
			.select({ count: sql<number>`count(*)::int` })
			.from(generators)
			.where(whereClause),
		db
			.select()
			.from(departments)
			.orderBy(departments.name),
		db
			.select()
			.from(formTemplates)
			.where(eq(formTemplates.isActive, true))
			.orderBy(formTemplates.name)
	]);

	return {
		generators: genList,
		pagination: {
			page,
			limit,
			total: countResult[0].count,
			totalPages: Math.ceil(countResult[0].count / limit)
		},
		departments: departmentsList,
		formTemplates: templatesList,
		filters: { search, departmentId, type, formTemplateId }
	};
};

export const actions: Actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const assetId = data.get('assetId') as string;
		const type = data.get('type') as string;
		const sizeKw = data.get('sizeKw') as string;
		const product = data.get('product') as string;
		const location = data.get('location') as string;
		const departmentId = data.get('departmentId') as string;
		const formTemplateId = data.get('formTemplateId') as string;

		if (!assetId?.trim() || !type?.trim() || !sizeKw || !location?.trim() || !departmentId) {
			return fail(400, { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
		}

		try {
			await db.insert(generators).values({
				assetId: assetId.trim(),
				type: type.trim(),
				sizeKw: String(sizeKw),
				product: product?.trim() || null,
				location: location.trim(),
				departmentId,
				formTemplateId: formTemplateId || null
			});
			return { success: true };
		} catch (e: any) {
			if (e.message?.includes('unique') || e.message?.includes('duplicate')) {
				return fail(400, { error: 'รหัสทรัพย์สินนี้มีอยู่แล้วในระบบ' });
			}
			console.error('Create generator error:', e);
			return fail(500, { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
		}
	},

	update: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		const assetId = data.get('assetId') as string;
		const type = data.get('type') as string;
		const sizeKw = data.get('sizeKw') as string;
		const product = data.get('product') as string;
		const location = data.get('location') as string;
		const departmentId = data.get('departmentId') as string;
		const formTemplateId = data.get('formTemplateId') as string;

		if (!id) {
			return fail(400, { error: 'ไม่พบ ID' });
		}

		try {
			const updateData: Record<string, any> = { updatedAt: new Date() };
			if (assetId) updateData.assetId = assetId.trim();
			if (type) updateData.type = type.trim();
			if (sizeKw) updateData.sizeKw = String(sizeKw);
			if (product !== null) updateData.product = product?.trim() || null;
			if (location) updateData.location = location.trim();
			if (departmentId) updateData.departmentId = departmentId;
			updateData.formTemplateId = formTemplateId || null;

			await db.update(generators).set(updateData).where(eq(generators.id, id));
			return { success: true };
		} catch (error) {
			console.error('Update generator error:', error);
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
				.update(generators)
				.set({ isActive, updatedAt: new Date() })
				.where(eq(generators.id, id));
			return { success: true };
		} catch (error) {
			console.error('Toggle generator error:', error);
			return fail(500, { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
		}
	}
};
