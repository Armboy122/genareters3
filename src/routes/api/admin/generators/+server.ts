import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { generators, departments, formTemplates } from '$lib/db/schema';
import { eq, sql, ilike, and, or } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const search = url.searchParams.get('search') || '';
	const departmentId = url.searchParams.get('departmentId') || '';
	const type = url.searchParams.get('type') || '';
	const formTemplateId = url.searchParams.get('formTemplateId') || '';
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '25');
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

	const [genList, countResult] = await Promise.all([
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
			.where(whereClause)
	]);

	return json({
		success: true,
		data: genList,
		pagination: {
			page,
			limit,
			total: countResult[0].count,
			totalPages: Math.ceil(countResult[0].count / limit)
		}
	});
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { assetId, type, sizeKw, product, location, departmentId, formTemplateId } = body;

	if (!assetId?.trim() || !type?.trim() || !sizeKw || !location?.trim() || !departmentId) {
		return json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
	}

	try {
		const result = await db
			.insert(generators)
			.values({
				assetId: assetId.trim(),
				type: type.trim(),
				sizeKw: String(sizeKw),
				product: product?.trim() || null,
				location: location.trim(),
				departmentId,
				formTemplateId: formTemplateId || null
			})
			.returning();

		return json({ success: true, data: result[0] });
	} catch (e: any) {
		if (e.message?.includes('unique') || e.message?.includes('duplicate')) {
			return json({ success: false, message: 'รหัสทรัพย์สินนี้มีอยู่แล้วในระบบ' }, { status: 400 });
		}
		throw e;
	}
};

export const PUT: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { id, assetId, type, sizeKw, product, location, departmentId, formTemplateId, isActive } = body;

	if (!id) {
		return json({ success: false, message: 'ไม่พบ ID' }, { status: 400 });
	}

	const updateData: Record<string, any> = { updatedAt: new Date() };
	if (assetId !== undefined) updateData.assetId = assetId.trim();
	if (type !== undefined) updateData.type = type.trim();
	if (sizeKw !== undefined) updateData.sizeKw = String(sizeKw);
	if (product !== undefined) updateData.product = product?.trim() || null;
	if (location !== undefined) updateData.location = location.trim();
	if (departmentId !== undefined) updateData.departmentId = departmentId;
	if (formTemplateId !== undefined) updateData.formTemplateId = formTemplateId || null;
	if (isActive !== undefined) updateData.isActive = isActive;

	const result = await db.update(generators).set(updateData).where(eq(generators.id, id)).returning();
	return json({ success: true, data: result[0] });
};

export const DELETE: RequestHandler = async ({ request }) => {
	const { id } = await request.json();

	// Soft delete - set isActive to false
	const result = await db
		.update(generators)
		.set({ isActive: false, updatedAt: new Date() })
		.where(eq(generators.id, id))
		.returning();

	return json({ success: true, data: result[0] });
};
