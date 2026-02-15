<script lang="ts">
	import { page } from '$app/stores';
	import { formatThaiDate } from '$lib/utils';

	$: ({ department, generators, inspectedCount, uninspectedCount, monthName, year } = $page.data);

	let searchQuery = '';
	let filterStatus = 'all';

	$: filteredGenerators = generators
		.filter((g: any) => {
			if (filterStatus === 'inspected' && !g.isInspected) return false;
			if (filterStatus === 'uninspected' && g.isInspected) return false;
			return true;
		})
		.filter((g: any) =>
			g.assetId.toLowerCase().includes(searchQuery.toLowerCase()) ||
			g.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(g.product || '').toLowerCase().includes(searchQuery.toLowerCase())
		);
</script>

<div class="min-h-screen">
	<!-- Header -->
	<header class="gradient-bg text-white shadow-lg">
		<div class="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8 relative z-10">
			<div class="flex items-center gap-2 text-blue-200/60 text-sm mb-1">
				<a href="/dashboard" class="hover:text-white transition-colors">รายงานการตรวจ</a>
				<span>/</span>
				<a href="/department/{department.id}/calendar" class="hover:text-white transition-colors">{department.name}</a>
				<span>/</span>
				<span class="text-white">{monthName}</span>
			</div>
			<h1 class="text-2xl font-bold tracking-tight">{department.name}</h1>
			<p class="text-blue-200/70 text-sm mt-0.5">เดือน {monthName} {year + 543}</p>
		</div>
	</header>

	<main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
		<!-- Summary Bar -->
		<div class="mb-6 rounded-xl bg-white p-6 shadow-md">
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
				<div class="text-center p-3 bg-slate-50 rounded-lg border border-slate-100">
					<p class="text-sm text-gray-600 mb-1">เครื่องทั้งหมด</p>
					<p class="text-2xl font-bold text-slate-700">{generators.length}</p>
				</div>
				<div class="text-center p-3 bg-green-50 rounded-lg border border-green-100">
					<p class="text-sm text-gray-600 mb-1">ตรวจแล้ว</p>
					<p class="text-2xl font-bold text-green-700">{inspectedCount}</p>
				</div>
				<div class="text-center p-3 bg-orange-50 rounded-lg border border-orange-100">
					<p class="text-sm text-gray-600 mb-1">ยังไม่ได้ตรวจ</p>
					<p class="text-2xl font-bold text-orange-700">{uninspectedCount}</p>
				</div>
				<div class="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
					<p class="text-sm text-gray-600 mb-1">ความคืบหน้า</p>
					<p class="text-2xl font-bold text-blue-700">{generators.length > 0 ? Math.round(inspectedCount / generators.length * 100) : 0}%</p>
				</div>
			</div>
		</div>

		<!-- Search & Filter -->
		<div class="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
			<div class="relative flex-1">
				<span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="ค้นหา รหัสทรัพย์สิน / สถานที่ / ผลิตภัณฑ์..."
					class="w-full rounded-lg border border-gray-300 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent"
				/>
				{#if searchQuery}
					<button
						on:click={() => (searchQuery = '')}
						class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
					>✕</button>
				{/if}
			</div>
			<div class="flex gap-1">
				<button
					on:click={() => (filterStatus = 'all')}
					class="px-3 py-2 rounded-lg text-sm transition-colors {filterStatus === 'all' ? 'gradient-bg text-white relative z-10' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}"
				>ทั้งหมด ({generators.length})</button>
				<button
					on:click={() => (filterStatus = 'uninspected')}
					class="px-3 py-2 rounded-lg text-sm transition-colors {filterStatus === 'uninspected' ? 'bg-orange-500 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}"
				>ยังไม่ตรวจ ({uninspectedCount})</button>
				<button
					on:click={() => (filterStatus = 'inspected')}
					class="px-3 py-2 rounded-lg text-sm transition-colors {filterStatus === 'inspected' ? 'bg-green-500 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}"
				>ตรวจแล้ว ({inspectedCount})</button>
			</div>
		</div>

		<!-- Generators List -->
		{#if filteredGenerators.length === 0}
			<div class="rounded-xl bg-white p-12 shadow-md text-center text-gray-400">
				ไม่พบเครื่องที่ค้นหา
			</div>
		{:else}
			<div class="space-y-3">
				{#each filteredGenerators as generator}
					<a
						href={generator.isInspected
							? `/inspection/${generator.inspection.id}`
							: `/inspection/new/${generator.id}/${year}/${$page.data.month}`}
						class="block bg-white rounded-xl shadow-md hover:shadow-lg transition-all border-l-4 {generator.statusColor}"
					>
						<div class="p-5">
							<div class="flex justify-between items-start mb-3">
								<div>
									<h3 class="text-base font-semibold text-gray-800">{generator.assetId}</h3>
									<p class="text-xs text-gray-500 mt-0.5">{generator.type} — {generator.sizeKw} kW</p>
								</div>
								{#if generator.isInspected}
									<span class="px-2.5 py-1 bg-green-100 text-green-700 text-xs rounded-full">✅ ตรวจแล้ว</span>
								{:else}
									<span class="px-2.5 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">❌ ยังไม่ตรวจ</span>
								{/if}
							</div>

							<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
								<div>
									<p class="text-xs text-gray-500">ผลิตภัณฑ์</p>
									<p class="font-medium text-gray-700">{generator.product || '-'}</p>
								</div>
								<div>
									<p class="text-xs text-gray-500">สถานที่ติดตั้ง</p>
									<p class="font-medium text-gray-700">{generator.location}</p>
								</div>
								<div>
									<p class="text-xs text-gray-500">แบบฟอร์ม</p>
									<p class="font-medium text-gray-700">{generator.templateName}</p>
								</div>
								{#if generator.isInspected}
									<div>
										<p class="text-xs text-gray-500">ผู้ตรวจ</p>
										<p class="font-medium text-gray-700">{generator.inspection.inspectorName}</p>
									</div>
								{:else}
									<div class="flex items-end">
										<span class="text-xs text-primary-light font-medium">กดเพื่อเริ่มตรวจ →</span>
									</div>
								{/if}
							</div>

							{#if generator.isInspected}
								<div class="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
									<span class="text-xs text-gray-500">{formatThaiDate(generator.inspection.inspectionDate)}</span>
									<span class="px-2 py-0.5 text-xs rounded-full
										{generator.inspection.overallStatus === 'ปกติ' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
										{generator.inspection.overallStatus}
									</span>
									<span class="px-2 py-0.5 text-xs rounded-full
										{generator.inspection.machineStatus === 'ใช้งานได้' ? 'bg-green-100 text-green-700' : generator.inspection.machineStatus === 'ซ่อมแซม' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}">
										{generator.inspection.machineStatus}
									</span>
								</div>
							{/if}
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</main>
</div>
