<script lang="ts">
	import { page } from '$app/stores';

	$: ({ departments, overall, currentMonth, currentYear } = $page.data);

	let searchQuery = '';

	$: filteredDepartments = departments.filter((dept: any) =>
		dept.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

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
							<p class="text-2xl font-bold text-red-700">{overall.disposal}</p>
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
						on:click={() => (searchQuery = '')}
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
								<p class="text-sm font-semibold text-red-700">{dept.disposal}</p>
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

		<!-- Formula Note -->
		<div class="mt-8 text-center text-xs text-gray-400">
			สูตร KPI: ((เครื่องทั้งหมด − รอจำหน่าย) − ซ่อมแซม) ÷ (เครื่องทั้งหมด − รอจำหน่าย) × 100 | KPI จะแสดงเมื่อตรวจครบทุกเดือนตั้งแต่ ม.ค. ถึงเดือนปัจจุบัน
		</div>
	</main>
</div>
