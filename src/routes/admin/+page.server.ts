import { db } from '$lib/db';
import { departments, generators, formTemplates, inspections, users } from '$lib/db/schema';
import { sql, eq, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const now = new Date();
	const currentMonth = now.getMonth() + 1;
	const currentYear = now.getFullYear();

	const [
		deptCount,
		genCount,
		templateCount,
		userCount,
		inspectionThisMonth,
		activeGenCount,
		recentInspections
	] = await Promise.all([
		db.select({ count: sql<number>`count(*)::int` }).from(departments),
		db.select({ count: sql<number>`count(*)::int` }).from(generators),
		db.select({ count: sql<number>`count(*)::int` }).from(formTemplates).where(eq(formTemplates.isActive, true)),
		db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.isActive, true)),
		db
			.select({ count: sql<number>`count(*)::int` })
			.from(inspections)
			.where(
				and(
					eq(inspections.month, currentMonth),
					eq(inspections.year, currentYear)
				)
			),
		db.select({ count: sql<number>`count(*)::int` }).from(generators).where(eq(generators.isActive, true)),
		db
			.select({
				id: inspections.id,
				inspectionCode: inspections.inspectionCode,
				inspectorName: inspections.inspectorName,
				overallStatus: inspections.overallStatus,
				machineStatus: inspections.machineStatus,
				inspectionDate: inspections.inspectionDate,
				generatorAssetId: generators.assetId,
				departmentName: departments.name
			})
			.from(inspections)
			.leftJoin(generators, eq(generators.id, inspections.generatorId))
			.leftJoin(departments, eq(departments.id, generators.departmentId))
			.orderBy(sql`${inspections.createdAt} DESC`)
			.limit(10)
	]);

	return {
		stats: {
			departments: deptCount[0].count,
			generators: genCount[0].count,
			activeGenerators: activeGenCount[0].count,
			formTemplates: templateCount[0].count,
			users: userCount[0].count,
			inspectionsThisMonth: inspectionThisMonth[0].count
		},
		recentInspections,
		currentMonth,
		currentYear
	};
};
