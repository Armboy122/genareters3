import { db } from '$lib/db';
import { departments, generators, inspections, inspectionDetails } from '$lib/db/schema';
import { eq, and, sql, count } from 'drizzle-orm';
import { getCurrentMonthYear, getThaiMonthName } from '$lib/utils';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const { month: currentMonth, year: currentYear } = getCurrentMonthYear();

	// Get all departments
	const deptList = await db.select().from(departments).orderBy(departments.name);

	// For each department, get generator counts, check monthly completeness, and compute KPI
	const deptKPIs = await Promise.all(
		deptList.map(async (dept) => {
			// Total active generators in this department
			const totalResult = await db
				.select({ count: count() })
				.from(generators)
				.where(and(eq(generators.departmentId, dept.id), eq(generators.isActive, true)));
			const total = totalResult[0]?.count || 0;

			if (total === 0) {
				return {
					id: dept.id,
					name: dept.name,
					total: 0,
					working: 0,
					repair: 0,
					disposal: 0,
					kpiPercent: 100,
					kpiScore: 5,
					inspected: 0,
					allMonthsComplete: true,
					incompleteMonths: [] as string[]
				};
			}

			// Check completeness for each month from January to current month
			const monthlyCompleteness = await db.execute(sql`
				SELECT ins.month, count(DISTINCT ins.generator_id)::int as inspected_count
				FROM inspections ins
				JOIN generators g ON g.id = ins.generator_id
				WHERE g.department_id = ${dept.id}
					AND g.is_active = true
					AND ins.year = ${currentYear}
					AND ins.month <= ${currentMonth}
				GROUP BY ins.month
				ORDER BY ins.month
			`);

			const monthMap = new Map<number, number>();
			for (const row of monthlyCompleteness.rows) {
				monthMap.set(row.month as number, row.inspected_count as number);
			}

			// Find incomplete months
			const incompleteMonths: string[] = [];
			for (let m = 1; m <= currentMonth; m++) {
				const inspectedInMonth = monthMap.get(m) || 0;
				if (inspectedInMonth < total) {
					incompleteMonths.push(getThaiMonthName(m));
				}
			}
			const allMonthsComplete = incompleteMonths.length === 0;

			// Get the latest inspection for each generator in this department
			const latestStatuses = await db.execute(sql`
				SELECT i.machine_status, count(*)::int as cnt
				FROM (
					SELECT DISTINCT ON (ins.generator_id) ins.machine_status
					FROM inspections ins
					JOIN generators g ON g.id = ins.generator_id
					WHERE g.department_id = ${dept.id} AND g.is_active = true
					ORDER BY ins.generator_id, ins.year DESC, ins.month DESC, ins.created_at DESC
				) i
				GROUP BY i.machine_status
			`);

			let working = 0;
			let repair = 0;
			let disposal = 0;
			let inspected = 0;

			for (const row of latestStatuses.rows) {
				const cnt = row.cnt as number;
				inspected += cnt;
				if (row.machine_status === 'ใช้งานได้') working = cnt;
				else if (row.machine_status === 'ซ่อมแซม') repair = cnt;
				else if (row.machine_status === 'รอจำหน่าย') disposal = cnt;
			}

			// KPI formula: ((total - disposal) - repair) / (total - disposal) * 100
			// Only calculate if all months are complete
			let kpiPercent = 0;
			let kpiScore = 0;

			if (allMonthsComplete) {
				const denominator = total - disposal;
				kpiPercent = denominator > 0
					? Math.round(((denominator - repair) / denominator) * 100)
					: 0;

				if (kpiPercent >= 100) kpiScore = 5;
				else if (kpiPercent >= 80) kpiScore = 4;
				else if (kpiPercent >= 70) kpiScore = 3;
				else if (kpiPercent >= 60) kpiScore = 2;
				else kpiScore = 1;
			}

			return {
				id: dept.id,
				name: dept.name,
				total,
				working,
				repair,
				disposal,
				kpiPercent,
				kpiScore,
				inspected,
				allMonthsComplete,
				incompleteMonths
			};
		})
	);

	// Overall summary — only count departments with all months complete for KPI
	const overallTotal = deptKPIs.reduce((s, d) => s + d.total, 0);
	const overallWorking = deptKPIs.reduce((s, d) => s + d.working, 0);
	const overallRepair = deptKPIs.reduce((s, d) => s + d.repair, 0);
	const overallDisposal = deptKPIs.reduce((s, d) => s + d.disposal, 0);
	const overallInspected = deptKPIs.reduce((s, d) => s + d.inspected, 0);
	const allComplete = deptKPIs.every((d) => d.allMonthsComplete);

	let overallKpiPercent = 0;
	let overallKpiScore = 0;

	if (allComplete) {
		const overallDenom = overallTotal - overallDisposal;
		overallKpiPercent = overallDenom > 0
			? Math.round(((overallDenom - overallRepair) / overallDenom) * 100)
			: 0;

		if (overallKpiPercent >= 100) overallKpiScore = 5;
		else if (overallKpiPercent >= 80) overallKpiScore = 4;
		else if (overallKpiPercent >= 70) overallKpiScore = 3;
		else if (overallKpiPercent >= 60) overallKpiScore = 2;
		else overallKpiScore = 1;
	}

	// === NEW: 1. Form template breakdown ===
	const formBreakdown = await db.execute(sql`
		SELECT
			ft.id as form_id,
			ft.name as form_name,
			count(*)::int as total,
			count(*) FILTER (WHERE i.machine_status = 'ใช้งานได้')::int as working,
			count(*) FILTER (WHERE i.machine_status = 'ซ่อมแซม')::int as repair,
			count(*) FILTER (WHERE i.machine_status = 'รอจำหน่าย')::int as disposal,
			count(*) FILTER (WHERE i.machine_status IS NULL)::int as not_inspected
		FROM generators g
		LEFT JOIN form_templates ft ON ft.id = g.form_template_id
		LEFT JOIN LATERAL (
			SELECT ins.machine_status
			FROM inspections ins
			WHERE ins.generator_id = g.id
			ORDER BY ins.year DESC, ins.month DESC, ins.created_at DESC
			LIMIT 1
		) i ON true
		WHERE g.is_active = true
		GROUP BY ft.id, ft.name
		ORDER BY total DESC
	`);

	const formStats = formBreakdown.rows.map((row) => ({
		formId: row.form_id as string | null,
		formName: (row.form_name as string) || 'ไม่ระบุแบบฟอร์ม',
		total: row.total as number,
		working: row.working as number,
		repair: row.repair as number,
		disposal: row.disposal as number,
		notInspected: row.not_inspected as number
	}));

	// === NEW: 2. Top 10 abnormal inspection items (split by form template) ===
	const topAbnormalByForm = await db.execute(sql`
		SELECT
			ft.id as form_id,
			ft.name as form_name,
			d.item_code,
			d.description,
			count(*)::int as abnormal_count,
			ROW_NUMBER() OVER (PARTITION BY ft.id ORDER BY count(*) DESC) as rn
		FROM inspection_details d
		JOIN inspections ins ON ins.id = d.inspection_id
		JOIN generators g ON g.id = ins.generator_id
		LEFT JOIN form_templates ft ON ft.id = g.form_template_id
		WHERE d.status = 'ไม่ปกติ'
			AND g.is_active = true
		GROUP BY ft.id, ft.name, d.item_code, d.description
		ORDER BY ft.name, abnormal_count DESC
	`);

	// Group top 10 abnormal items per form template
	const topAbnormalMap = new Map<string, { formName: string; items: { itemCode: string; description: string; count: number }[] }>();
	for (const row of topAbnormalByForm.rows) {
		const formId = (row.form_id as string) || 'none';
		const rn = row.rn as number;
		if (rn > 10) continue;
		if (!topAbnormalMap.has(formId)) {
			topAbnormalMap.set(formId, {
				formName: (row.form_name as string) || 'ไม่ระบุแบบฟอร์ม',
				items: []
			});
		}
		topAbnormalMap.get(formId)!.items.push({
			itemCode: row.item_code as string,
			description: row.description as string,
			count: row.abnormal_count as number
		});
	}
	const topAbnormalByFormList = Array.from(topAbnormalMap.entries()).map(([formId, data]) => ({
		formId,
		formName: data.formName,
		items: data.items
	}));

	// === NEW: 3. Monthly completeness heatmap (dept × month) ===
	const heatmapData = await db.execute(sql`
		SELECT
			g.department_id,
			ins.month,
			count(DISTINCT ins.generator_id)::int as inspected_count
		FROM inspections ins
		JOIN generators g ON g.id = ins.generator_id
		WHERE g.is_active = true
			AND ins.year = ${currentYear}
			AND ins.month <= ${currentMonth}
		GROUP BY g.department_id, ins.month
		ORDER BY g.department_id, ins.month
	`);

	// Build heatmap: { deptId: { month: inspectedCount } }
	const heatmapMap = new Map<string, Map<number, number>>();
	for (const row of heatmapData.rows) {
		const deptId = row.department_id as string;
		if (!heatmapMap.has(deptId)) heatmapMap.set(deptId, new Map());
		heatmapMap.get(deptId)!.set(row.month as number, row.inspected_count as number);
	}

	const heatmap = deptKPIs
		.filter((d) => d.total > 0)
		.map((dept) => {
			const monthData = heatmapMap.get(dept.id) || new Map();
			const months: { month: number; inspected: number; total: number; status: 'complete' | 'partial' | 'none' }[] = [];
			for (let m = 1; m <= currentMonth; m++) {
				const inspected = monthData.get(m) || 0;
				months.push({
					month: m,
					inspected,
					total: dept.total,
					status: inspected >= dept.total ? 'complete' : inspected > 0 ? 'partial' : 'none'
				});
			}
			return { id: dept.id, name: dept.name, total: dept.total, months };
		});

	// === NEW: Feature A — KPI Trend (last 12 months) ===
	const trendData = await db.execute(sql`
		WITH months AS (
			SELECT generate_series(1, 12) as month_num
		),
		monthly_stats AS (
			SELECT
				ins.month,
				count(DISTINCT ins.generator_id)::int as inspected,
				count(DISTINCT g.id) FILTER (WHERE i_latest.machine_status = 'ใช้งานได้')::int as working,
				count(DISTINCT g.id) FILTER (WHERE i_latest.machine_status = 'ซ่อมแซม')::int as repair,
				count(DISTINCT g.id) FILTER (WHERE i_latest.machine_status = 'รอจำหน่าย')::int as disposal
			FROM inspections ins
			JOIN generators g ON g.id = ins.generator_id AND g.is_active = true
			LEFT JOIN LATERAL (
				SELECT ins2.machine_status
				FROM inspections ins2
				WHERE ins2.generator_id = g.id AND ins2.year = ${currentYear} AND ins2.month = ins.month
				ORDER BY ins2.created_at DESC
				LIMIT 1
			) i_latest ON true
			WHERE ins.year = ${currentYear} AND ins.month <= ${currentMonth}
			GROUP BY ins.month
		)
		SELECT
			m.month_num as month,
			COALESCE(ms.inspected, 0)::int as inspected,
			COALESCE(ms.working, 0)::int as working,
			COALESCE(ms.repair, 0)::int as repair,
			COALESCE(ms.disposal, 0)::int as disposal
		FROM months m
		LEFT JOIN monthly_stats ms ON ms.month = m.month_num
		WHERE m.month_num <= ${currentMonth}
		ORDER BY m.month_num
	`);

	const totalActive = deptKPIs.reduce((s, d) => s + d.total, 0);
	const kpiTrend = trendData.rows.map((row) => {
		const total = totalActive;
		const inspected = row.inspected as number;
		const disposal = row.disposal as number;
		const repair = row.repair as number;
		// If no inspections at all for this month, KPI = 0
		if (inspected === 0) {
			return { month: row.month as number, inspected: 0, total, kpiPercent: 0 };
		}
		const denom = total - disposal;
		const kpiPercent = denom > 0 ? Math.round(((denom - repair) / denom) * 100) : 0;
		return {
			month: row.month as number,
			inspected,
			total,
			kpiPercent
		};
	});

	// === NEW: Feature B — Machines with repeated repair status ===
	const repeatRepair = await db.execute(sql`
		SELECT
			g.asset_id,
			g.size_kw,
			d.name as department_name,
			count(*)::int as repair_months,
			array_agg(DISTINCT ins.month ORDER BY ins.month) as months
		FROM inspections ins
		JOIN generators g ON g.id = ins.generator_id
		JOIN departments d ON d.id = g.department_id
		WHERE ins.machine_status = 'ซ่อมแซม'
			AND g.is_active = true
			AND ins.year = ${currentYear}
		GROUP BY g.id, g.asset_id, g.size_kw, d.name
		HAVING count(*) >= 2
		ORDER BY repair_months DESC, g.asset_id
		LIMIT 20
	`);

	return {
		departments: deptKPIs,
		overall: {
			total: overallTotal,
			working: overallWorking,
			repair: overallRepair,
			disposal: overallDisposal,
			inspected: overallInspected,
			kpiPercent: overallKpiPercent,
			kpiScore: overallKpiScore,
			allComplete
		},
		currentMonth,
		currentYear,
		formStats,
		topAbnormalByForm: topAbnormalByFormList,
		heatmap,
		kpiTrend,
		repeatRepair: repeatRepair.rows.map((r) => ({
			assetId: r.asset_id as string,
			sizeKw: r.size_kw as string,
			departmentName: r.department_name as string,
			repairMonths: r.repair_months as number,
			months: r.months as number[]
		}))
	};
};
