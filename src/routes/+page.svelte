<script lang="ts">
	import { page } from '$app/stores';
	import { getShortThaiMonthName } from '$lib/utils';

	let pageData = $derived($page.data);
	let departments = $derived(pageData.departments);
	let overall = $derived(pageData.overall);
	let currentMonth = $derived(pageData.currentMonth);
	let currentYear = $derived(pageData.currentYear);
	let formStats = $derived(pageData.formStats);
	let topAbnormalByForm = $derived(pageData.topAbnormalByForm);
	let heatmap = $derived(pageData.heatmap);
	let kpiTrend = $derived(pageData.kpiTrend);
	let repeatRepair = $derived(pageData.repeatRepair);

	let searchQuery = $state('');
	let activeTab: 'overview' | 'analysis' | 'heatmap' = $state('overview');

	let filteredDepartments = $derived(departments.filter((dept: any) =>
		dept.name.toLowerCase().includes(searchQuery.toLowerCase())
	));

	// KPI Trend chart helpers
	let trendMax = $derived(Math.max(...(kpiTrend?.map((t: any) => t.kpiPercent) || [100]), 100));

	// Heatmap summary stats
	let heatmapCompleteCells = $derived(heatmap?.reduce((s: number, d: any) => s + d.months.filter((m: any) => m.status === 'complete').length, 0) || 0);
	let heatmapPartialCells = $derived(heatmap?.reduce((s: number, d: any) => s + d.months.filter((m: any) => m.status === 'partial').length, 0) || 0);
	let heatmapNoneCells = $derived(heatmap?.reduce((s: number, d: any) => s + d.months.filter((m: any) => m.status === 'none').length, 0) || 0);

	function scoreColor(score: number): string {
		if (score >= 5) return 'text-emerald-600';
		if (score >= 4) return 'text-sky-600';
		if (score >= 3) return 'text-amber-600';
		if (score >= 2) return 'text-orange-600';
		return 'text-red-600';
	}

	function scoreBg(score: number): string {
		if (score >= 5) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
		if (score >= 4) return 'bg-sky-100 text-sky-700 border-sky-200';
		if (score >= 3) return 'bg-amber-100 text-amber-700 border-amber-200';
		if (score >= 2) return 'bg-orange-100 text-orange-700 border-orange-200';
		return 'bg-red-100 text-red-700 border-red-200';
	}

	function scoreLabel(score: number): string {
		if (score >= 5) return 'ดีเยี่ยม';
		if (score >= 4) return 'ดี';
		if (score >= 3) return 'ปานกลาง';
		if (score >= 2) return 'ต้องปรับปรุง';
		return 'วิกฤต';
	}

	function kpiBarColor(pct: number, allComplete: boolean): string {
		if (!allComplete) return 'bg-gray-300';
		if (pct >= 80) return 'gradient-bg';
		if (pct >= 70) return 'bg-sky-500';
		if (pct >= 60) return 'bg-amber-500';
		return 'bg-red-500';
	}

	function ringDash(pct: number): string {
		const circumference = 2 * Math.PI * 40;
		const filled = (pct / 100) * circumference;
		return `${filled} ${circumference - filled}`;
	}

	function ringStroke(score: number, allComplete: boolean): string {
		if (!allComplete) return 'stroke-gray-300';
		if (score >= 5) return 'stroke-emerald-500';
		if (score >= 4) return 'stroke-sky-500';
		if (score >= 3) return 'stroke-amber-500';
		if (score >= 2) return 'stroke-orange-500';
		return 'stroke-red-500';
	}

	const formCardStyles = [
		{ border: 'border-sky-200', bg: 'bg-sky-50/30', badge: 'bg-sky-100 text-sky-600' },
		{ border: 'border-violet-200', bg: 'bg-violet-50/30', badge: 'bg-violet-100 text-violet-600' },
		{ border: 'border-teal-200', bg: 'bg-teal-50/30', badge: 'bg-teal-100 text-teal-600' },
		{ border: 'border-rose-200', bg: 'bg-rose-50/30', badge: 'bg-rose-100 text-rose-600' },
		{ border: 'border-amber-200', bg: 'bg-amber-50/30', badge: 'bg-amber-100 text-amber-600' },
		{ border: 'border-indigo-200', bg: 'bg-indigo-50/30', badge: 'bg-indigo-100 text-indigo-600' },
	];

	function getFormStyle(idx: number) {
		return formCardStyles[idx % formCardStyles.length];
	}

	function heatmapColor(status: string): string {
		if (status === 'complete') return 'bg-emerald-500 text-white';
		if (status === 'partial') return 'bg-amber-400 text-white';
		return 'bg-red-100 text-red-400';
	}

	function heatmapTooltip(cell: any): string {
		return `${cell.inspected}/${cell.total} เครื่อง`;
	}
</script>

<div class="min-h-screen">
	<!-- Header -->
	<header class="gradient-bg text-white shadow-lg">
		<div class="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8 relative z-10">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-lg bg-amber-400/20 flex items-center justify-center">
					<span class="text-amber-300 text-xl">⚡</span>
				</div>
				<div>
					<h1 class="text-2xl sm:text-3xl font-bold tracking-tight">KPI ความพร้อมอุปกรณ์</h1>
					<p class="text-blue-200/70 mt-0.5 text-sm">ระบบตรวจสภาพเครื่องกำเนิดไฟฟ้า — การไฟฟ้าส่วนภูมิภาค (กฟภ.)</p>
				</div>
			</div>
		</div>
	</header>

	<main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
		<!-- Overall KPI Card -->
		<div class="mb-8 rounded-xl bg-white p-6 shadow-md">
			<div class="flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
				<!-- Ring Chart -->
				<div class="flex-shrink-0 mx-auto md:mx-0">
					<div class="relative w-32 h-32">
						<svg class="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
							<circle cx="50" cy="50" r="40" fill="none" stroke-width="6" class="stroke-gray-100" />
							{#if overall.allComplete}
								<circle
									cx="50" cy="50" r="40" fill="none" stroke-width="6"
									stroke-linecap="round"
									class={ringStroke(overall.kpiScore, overall.allComplete)}
									stroke-dasharray={ringDash(overall.kpiPercent)}
								/>
							{:else}
								<circle
									cx="50" cy="50" r="40" fill="none" stroke-width="6"
									stroke-linecap="round"
									class="stroke-gray-300"
									stroke-dasharray={ringDash(0)}
								/>
							{/if}
						</svg>
						<div class="absolute inset-0 flex flex-col items-center justify-center">
							{#if overall.allComplete}
								<span class="text-3xl font-bold {scoreColor(overall.kpiScore)}">{overall.kpiPercent}%</span>
							{:else}
								<span class="text-lg font-bold text-gray-400">รอข้อมูล</span>
							{/if}
						</div>
					</div>
				</div>

				<!-- Overall Stats -->
				<div class="flex-1">
					<div class="flex items-center gap-3 mb-3">
						<h2 class="text-xl font-bold text-gray-800">ภาพรวมทั้งหมด</h2>
						{#if overall.allComplete}
							<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold border {scoreBg(overall.kpiScore)}">
								คะแนน {overall.kpiScore}/5 — {scoreLabel(overall.kpiScore)}
							</span>
						{:else}
							<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-gray-100 text-gray-500 border-gray-200">
								ยังตรวจไม่ครบทุกเดือน
							</span>
						{/if}
					</div>
					<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
						<div class="text-center p-3 bg-slate-50 rounded-lg border border-slate-100">
							<p class="text-2xl font-bold text-slate-700">{overall.total}</p>
							<p class="text-xs text-gray-500 mt-0.5">เครื่องทั้งหมด</p>
						</div>
						<div class="text-center p-3 bg-green-50 rounded-lg border border-green-100">
							<p class="text-2xl font-bold text-green-700">{overall.working}</p>
							<p class="text-xs text-gray-500 mt-0.5">ใช้งานได้</p>
						</div>
						<div class="text-center p-3 bg-amber-50 rounded-lg border border-amber-100">
							<p class="text-2xl font-bold text-amber-700">{overall.repair}</p>
							<p class="text-xs text-gray-500 mt-0.5">ซ่อมแซม</p>
						</div>
						<div class="text-center p-3 bg-red-50 rounded-lg border border-red-100">
							<p class="text-2xl font-bold text-red-700">{overall.disposedCount}</p>
							<p class="text-xs text-gray-500 mt-0.5">รอจำหน่าย</p>
						</div>
					</div>

					{#if !overall.allComplete}
						<div class="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
							⚠️ KPI จะแสดงได้เมื่อตรวจครบทุกเดือน (ม.ค. — ปัจจุบัน) ทุกสังกัด
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- KPI Score Reference -->
		<div class="mb-6 flex flex-wrap gap-2 text-xs">
			<span class="text-gray-500">เกณฑ์คะแนน:</span>
			<span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">100% = 5 คะแนน</span>
			<span class="px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">80-99% = 4 คะแนน</span>
			<span class="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">70-79% = 3 คะแนน</span>
			<span class="px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">60-69% = 2 คะแนน</span>
			<span class="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">&lt;60% = 1 คะแนน</span>
		</div>

		<!-- Tab Navigation -->
		<div class="mb-6 flex gap-1 bg-gray-100 rounded-lg p-1">
			<button
				onclick={() => (activeTab = 'overview')}
				class="flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all
					{activeTab === 'overview' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}"
			>
				📊 ภาพรวมสังกัด
			</button>
			<button
				onclick={() => (activeTab = 'analysis')}
				class="flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all
					{activeTab === 'analysis' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}"
			>
				🔍 วิเคราะห์ข้อมูล
			</button>
			<button
				onclick={() => (activeTab = 'heatmap')}
				class="flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all
					{activeTab === 'heatmap' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}"
			>
				📅 ติดตามการลงข้อมูล
			</button>
		</div>

		<!-- ==================== TAB: ภาพรวมสังกัด ==================== -->
		{#if activeTab === 'overview'}
			<!-- Search & Filter -->
			<div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h3 class="text-xl font-semibold text-gray-800">สังกัดทั้งหมด</h3>
					<p class="text-sm text-gray-500">กดที่สังกัดเพื่อดูรายละเอียดและเริ่มตรวจ</p>
				</div>
				<div class="relative w-full sm:w-80">
					<span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="ค้นหาสังกัด / การไฟฟ้า..."
						class="w-full rounded-lg border border-gray-300 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent"
					/>
					{#if searchQuery}
						<button
							onclick={() => (searchQuery = '')}
							class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
						>✕</button>
					{/if}
				</div>
			</div>

			{#if searchQuery && filteredDepartments.length === 0}
				<div class="rounded-xl bg-white p-12 shadow-md text-center text-gray-400">
					ไม่พบสังกัดที่ค้นหา "{searchQuery}"
				</div>
			{:else}
				<!-- Department KPI Cards -->
				<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
					{#each filteredDepartments as dept}
						<a
							href="/department/{dept.id}/calendar"
							class="group block rounded-xl bg-white shadow-md hover:shadow-lg transition-all p-5 border-l-4
								{dept.allMonthsComplete
									? dept.kpiScore >= 5 ? 'border-emerald-500' : dept.kpiScore >= 4 ? 'border-sky-500' : dept.kpiScore >= 3 ? 'border-amber-500' : 'border-red-500'
									: 'border-gray-300'}"
						>
							<!-- Header -->
							<div class="flex items-start justify-between mb-4">
								<div class="flex-1 min-w-0">
									<h3 class="text-base font-semibold text-gray-800 truncate">{dept.name}</h3>
									<p class="text-xs text-gray-500 mt-0.5">เครื่องทั้งหมด {dept.total} เครื่อง</p>
								</div>
								{#if dept.allMonthsComplete}
									<div class="flex flex-col items-center ml-3">
										<span class="text-2xl font-bold {scoreColor(dept.kpiScore)}">{dept.kpiScore}</span>
										<span class="text-[10px] text-gray-500">คะแนน</span>
									</div>
								{:else}
									<span class="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] rounded-full ml-3 whitespace-nowrap">
										รอตรวจครบ
									</span>
								{/if}
							</div>

							<!-- KPI Bar -->
							<div class="mb-3">
								<div class="flex justify-between text-xs mb-1">
									<span class="text-gray-500">ความพร้อมอุปกรณ์</span>
									{#if dept.allMonthsComplete}
										<span class="font-semibold {scoreColor(dept.kpiScore)}">{dept.kpiPercent}%</span>
									{:else}
										<span class="font-semibold text-gray-400">—</span>
									{/if}
								</div>
								<div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
									{#if dept.allMonthsComplete}
										<div
											class="h-full rounded-full transition-all duration-700 {kpiBarColor(dept.kpiPercent, true)}"
											style="width: {dept.kpiPercent}%"
										></div>
									{/if}
								</div>
							</div>

							<!-- Status Breakdown -->
							<div class="grid grid-cols-3 gap-2 text-center">
								<div class="bg-green-50 rounded-lg py-1.5">
									<p class="text-sm font-semibold text-green-700">{dept.working}</p>
									<p class="text-[10px] text-gray-500">ใช้งานได้</p>
								</div>
								<div class="bg-amber-50 rounded-lg py-1.5">
									<p class="text-sm font-semibold text-amber-700">{dept.repair}</p>
									<p class="text-[10px] text-gray-500">ซ่อมแซม</p>
								</div>
								<div class="bg-red-50 rounded-lg py-1.5">
									<p class="text-sm font-semibold text-red-700">{dept.disposedCount}</p>
									<p class="text-[10px] text-gray-500">รอจำหน่าย</p>
								</div>
							</div>

							<!-- Incomplete months warning -->
							{#if !dept.allMonthsComplete && dept.incompleteMonths.length > 0}
								<div class="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg py-2 px-3">
									⚠️ ตรวจไม่ครบ: {dept.incompleteMonths.join(', ')}
								</div>
							{:else if dept.total > 0 && dept.inspected === 0}
								<div class="mt-3 text-xs text-gray-500 text-center bg-gray-50 rounded-lg py-1.5">
									ยังไม่มีข้อมูลการตรวจ — กดเพื่อเริ่มบันทึก
								</div>
							{/if}
						</a>
					{/each}
				</div>
			{/if}

		<!-- ==================== TAB: วิเคราะห์ข้อมูล ==================== -->
		{:else if activeTab === 'analysis'}

			<!-- Section 1: Form Template Breakdown -->
			<div class="mb-8 rounded-xl bg-white p-6 shadow-md">
				<h3 class="text-lg font-semibold text-gray-800 mb-1">จำนวนเครื่องแบ่งตามแบบฟอร์ม</h3>
				<p class="text-sm text-gray-500 mb-5">เปรียบเทียบจำนวนเครื่องกำเนิดไฟฟ้าแยกตามแบบฟอร์มการตรวจ</p>

				{#if formStats && formStats.length > 0}
					<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
						{#each formStats as form, idx}
							{@const style = getFormStyle(idx)}
							<div class="rounded-xl border-2 {style.border} {style.bg} p-5">
								<div class="flex items-center gap-2 mb-4">
									<div class="w-8 h-8 rounded-lg {style.badge} flex items-center justify-center text-sm font-bold">
										{idx + 1}
									</div>
									<div class="flex-1 min-w-0">
										<h4 class="font-semibold text-gray-800 truncate" title={form.formName}>{form.formName}</h4>
									</div>
									<span class="text-2xl font-bold text-gray-700">{form.total}</span>
								</div>
								<div class="grid grid-cols-4 gap-2 text-center text-xs">
									<div class="bg-white rounded-lg py-2 border border-gray-100">
										<p class="text-base font-bold text-slate-700">{form.total}</p>
										<p class="text-gray-500">ทั้งหมด</p>
									</div>
									<div class="bg-white rounded-lg py-2 border border-green-100">
										<p class="text-base font-bold text-green-700">{form.working}</p>
										<p class="text-gray-500">ใช้งานได้</p>
									</div>
									<div class="bg-white rounded-lg py-2 border border-amber-100">
										<p class="text-base font-bold text-amber-700">{form.repair}</p>
										<p class="text-gray-500">ซ่อมแซม</p>
									</div>
									<div class="bg-white rounded-lg py-2 border border-red-100">
										<p class="text-base font-bold text-red-700">{form.disposal}</p>
										<p class="text-gray-500">รอจำหน่าย</p>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="text-center py-8 text-gray-400 text-sm">ไม่พบข้อมูลแบบฟอร์ม</div>
				{/if}
			</div>

			<!-- Section A: KPI Trend Chart -->
			
			<!-- Section 2: Top 10 Abnormal Items by Form Template -->
			<div class="mb-8 rounded-xl bg-white p-6 shadow-md">
				<h3 class="text-lg font-semibold text-gray-800 mb-1">10 อันดับรายการตรวจที่ผิดปกติมากที่สุด</h3>
				<p class="text-sm text-gray-500 mb-5">จัดอันดับจากจำนวนครั้งที่พบความผิดปกติ แยกตามแบบฟอร์ม</p>

				{#if topAbnormalByForm && topAbnormalByForm.length > 0}
					<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{#each topAbnormalByForm as formGroup, gIdx}
							<div>
								<div class="flex items-center gap-2 mb-3">
									<div class="w-6 h-6 rounded bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold">{gIdx + 1}</div>
									<h4 class="font-medium text-gray-700">{formGroup.formName}</h4>
								</div>
								{#if formGroup.items.length > 0}
									<div class="space-y-1.5">
										{#each formGroup.items as item, i}
											{@const maxCount = formGroup.items[0]?.count || 1}
											<div class="flex items-center gap-3 group">
												<span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
													{i < 3 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}">
													{i + 1}
												</span>
												<div class="flex-1 min-w-0">
													<div class="flex items-center justify-between mb-0.5">
														<span class="text-sm text-gray-700 truncate" title="{item.itemCode} — {item.description}">
															{item.description}
														</span>
														<span class="text-sm font-semibold text-red-600 ml-2 whitespace-nowrap">{item.count} ครั้ง</span>
													</div>
													<div class="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
														<div class="h-full bg-red-400 rounded-full transition-all" style="width: {(item.count / maxCount) * 100}%"></div>
													</div>
												</div>
											</div>
										{/each}
									</div>
								{:else}
									<div class="text-center py-8 text-gray-400 text-sm">ไม่พบรายการผิดปกติ</div>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<div class="text-center py-8 text-gray-400 text-sm">ไม่พบรายการผิดปกติ</div>
				{/if}
			</div>

			<!-- Section B: Repeat Repair Machines -->
			{#if repeatRepair && repeatRepair.length > 0}
				<div class="mb-8 rounded-xl bg-white p-6 shadow-md">
					<h3 class="text-lg font-semibold text-gray-800 mb-1">เครื่องที่ซ่อมซ้ำบ่อย</h3>
					<p class="text-sm text-gray-500 mb-5">เครื่องที่มีสถานะ "ซ่อมแซม" ตั้งแต่ 2 เดือนขึ้นไปในปี {currentYear}</p>

					<div class="overflow-x-auto">
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b border-gray-200">
									<th class="text-left py-2.5 px-3 text-gray-500 font-medium">#</th>
									<th class="text-left py-2.5 px-3 text-gray-500 font-medium">รหัสทรัพย์สิน</th>
									<th class="text-left py-2.5 px-3 text-gray-500 font-medium">ขนาด (KW)</th>
									<th class="text-left py-2.5 px-3 text-gray-500 font-medium">สังกัด</th>
									<th class="text-center py-2.5 px-3 text-gray-500 font-medium">จำนวนเดือน</th>
									<th class="text-left py-2.5 px-3 text-gray-500 font-medium">เดือนที่ซ่อม</th>
								</tr>
							</thead>
							<tbody>
								{#each repeatRepair as machine, i}
									<tr class="border-b border-gray-50 hover:bg-gray-50/50">
										<td class="py-2.5 px-3 text-gray-400">{i + 1}</td>
										<td class="py-2.5 px-3 font-medium text-gray-800">{machine.assetId}</td>
										<td class="py-2.5 px-3 text-gray-600">{machine.sizeKw}</td>
										<td class="py-2.5 px-3 text-gray-600 max-w-[200px] truncate">{machine.departmentName}</td>
										<td class="py-2.5 px-3 text-center">
											<span class="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold
												{machine.repairMonths >= 4 ? 'bg-red-100 text-red-700' : machine.repairMonths >= 3 ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'}">
												{machine.repairMonths}
											</span>
										</td>
										<td class="py-2.5 px-3">
											<div class="flex gap-1 flex-wrap">
												{#each machine.months as m}
													<span class="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">{getShortThaiMonthName(m)}</span>
												{/each}
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}

		<!-- ==================== TAB: ติดตามการลงข้อมูล ==================== -->
		{:else if activeTab === 'heatmap'}

			<!-- Section 3: Monthly Completeness Heatmap -->
			<div class="mb-8 rounded-xl bg-white p-6 shadow-md">
				<h3 class="text-lg font-semibold text-gray-800 mb-1">ภาพรวมการลงข้อมูลรายเดือน</h3>
				<p class="text-sm text-gray-500 mb-2">ปี {currentYear} — แสดงสถานะการตรวจของแต่ละสังกัดในแต่ละเดือน</p>

				<!-- Legend -->
				<div class="flex gap-4 mb-5 text-xs">
					<div class="flex items-center gap-1.5">
						<span class="w-4 h-4 rounded bg-emerald-500"></span>
						<span class="text-gray-600">ครบทุกเครื่อง</span>
					</div>
					<div class="flex items-center gap-1.5">
						<span class="w-4 h-4 rounded bg-amber-400"></span>
						<span class="text-gray-600">ตรวจบางส่วน</span>
					</div>
					<div class="flex items-center gap-1.5">
						<span class="w-4 h-4 rounded bg-red-100 border border-red-200"></span>
						<span class="text-gray-600">ยังไม่ได้ตรวจ</span>
					</div>
				</div>

				{#if heatmap && heatmap.length > 0}
					<div class="overflow-x-auto">
						<table class="w-full text-sm border-collapse">
							<thead>
								<tr>
									<th class="text-left py-2 px-3 text-gray-500 font-medium sticky left-0 bg-white min-w-[180px]">สังกัด</th>
									<th class="text-center py-2 px-1 text-gray-500 font-medium min-w-[40px]">รวม</th>
									{#each Array.from({ length: currentMonth }, (_, i) => i + 1) as m}
										<th class="text-center py-2 px-1 text-gray-500 font-medium min-w-[50px]">{getShortThaiMonthName(m)}</th>
									{/each}
								</tr>
							</thead>
							<tbody>
								{#each heatmap as dept}
									{@const completedMonths = dept.months.filter((m: any) => m.status === 'complete').length}
									<tr class="border-t border-gray-100 hover:bg-gray-50/50">
										<td class="py-2 px-3 font-medium text-gray-700 sticky left-0 bg-white truncate max-w-[200px]" title={dept.name}>
											<a href="/department/{dept.id}/calendar" class="hover:text-blue-600 hover:underline">{dept.name}</a>
											<span class="text-xs text-gray-400 ml-1">({dept.total})</span>
										</td>
										<td class="py-2 px-1 text-center">
											<span class="text-xs font-semibold {completedMonths === currentMonth ? 'text-emerald-600' : 'text-gray-500'}">
												{completedMonths}/{currentMonth}
											</span>
										</td>
										{#each dept.months as cell}
											<td class="py-1.5 px-1 text-center">
												<div
													class="mx-auto w-10 h-8 rounded-md flex items-center justify-center text-xs font-medium cursor-default transition-transform hover:scale-110 {heatmapColor(cell.status)}"
													title="{dept.name} — {getShortThaiMonthName(cell.month)}: {heatmapTooltip(cell)}"
												>
													{#if cell.status === 'complete'}
														✓
													{:else if cell.status === 'partial'}
														{cell.inspected}
													{:else}
														—
													{/if}
												</div>
											</td>
										{/each}
									</tr>
								{/each}
							</tbody>
						</table>
					</div>

					<!-- Summary row -->
					<div class="mt-4 pt-4 border-t border-gray-200">
						<div class="grid grid-cols-3 gap-4 text-center">
							<div class="bg-emerald-50 rounded-lg py-3 border border-emerald-100">
								<p class="text-2xl font-bold text-emerald-700">{heatmapCompleteCells}</p>
								<p class="text-xs text-gray-500">ครบทุกเครื่อง</p>
							</div>
							<div class="bg-amber-50 rounded-lg py-3 border border-amber-100">
								<p class="text-2xl font-bold text-amber-700">{heatmapPartialCells}</p>
								<p class="text-xs text-gray-500">ตรวจบางส่วน</p>
							</div>
							<div class="bg-red-50 rounded-lg py-3 border border-red-100">
								<p class="text-2xl font-bold text-red-700">{heatmapNoneCells}</p>
								<p class="text-xs text-gray-500">ยังไม่ได้ตรวจ</p>
							</div>
						</div>
					</div>
				{:else}
					<div class="text-center py-12 text-gray-400 text-sm">ไม่มีข้อมูลสังกัดที่มีเครื่องกำเนิดไฟฟ้า</div>
				{/if}
			</div>
		{/if}

		<!-- Formula Note -->
		<div class="mt-8 text-center text-xs text-gray-400">
			สูตร KPI: ((เครื่องทั้งหมด − รอจำหน่าย) − ซ่อมแซม) ÷ (เครื่องทั้งหมด − รอจำหน่าย) × 100 | KPI จะแสดงเมื่อตรวจครบทุกเดือนตั้งแต่ ม.ค. ถึงเดือนปัจจุบัน
		</div>
	</main>
</div>
