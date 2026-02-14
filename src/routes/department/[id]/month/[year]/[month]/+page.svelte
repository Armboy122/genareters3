<script lang="ts">
	import { page } from '$app/stores';
	import { formatThaiDate } from '$lib/utils';

	$: ({ department, generators, inspectedCount, uninspectedCount, monthName, year } = $page.data);
</script>

<div class="min-h-screen">
	<!-- Header -->
	<header class="gradient-bg text-white shadow-lg">
		<div class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 relative z-10">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold tracking-tight">{department.name}</h1>
					<p class="text-blue-200/70 text-sm">เดือน {monthName} {year}</p>
				</div>
				<a
					href="/department/{department.id}/calendar"
					class="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white"
				>
					← กลับปฏิทิน
				</a>
			</div>
		</div>
	</header>

	<main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
		<!-- Summary Bar -->
		<div class="mb-6 flex flex-col gap-4 rounded-xl bg-white p-6 shadow-md sm:flex-row sm:items-center sm:justify-between">
			<div class="flex items-center gap-2">
				<span class="text-2xl">✅</span>
				<div>
					<p class="text-sm text-gray-600">ตรวจแล้ว</p>
					<p class="text-xl font-bold text-green-600">{inspectedCount}</p>
				</div>
			</div>
			<div class="flex items-center gap-2">
				<span class="text-2xl">❌</span>
				<div>
					<p class="text-sm text-gray-600">ยังไม่ได้ตรวจ</p>
					<p class="text-xl font-bold text-orange-600">{uninspectedCount}</p>
				</div>
			</div>
		</div>

		<!-- Generators List -->
		<div class="space-y-4">
			{#each generators as generator}
				<a
					href={generator.isInspected
						? `/inspection/${generator.inspection.id}`
						: `/inspection/new/${generator.id}/${year}/${$page.data.month}`}
					class="block bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border-l-4 {generator.statusColor}"
				>
					<div class="p-6">
						<div class="flex justify-between items-start mb-4">
							<h3 class="text-lg font-semibold text-gray-800">{generator.assetId}</h3>
							{#if generator.isInspected}
								<span class="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">✅ ตรวจแล้ว</span>
							{:else}
								<span class="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full">❌ ยังไม่ตรวจ</span>
							{/if}
						</div>

						<div class="grid grid-cols-2 gap-4 text-sm mb-4">
							<div>
								<p class="text-gray-600">ประเภท</p>
								<p class="font-semibold text-gray-800">{generator.type}</p>
							</div>
							<div>
								<p class="text-gray-600">ขนาด (kW)</p>
								<p class="font-semibold text-gray-800">{generator.sizeKw}</p>
							</div>
							<div>
								<p class="text-gray-600">ผลิตภัณฑ์</p>
								<p class="font-semibold text-gray-800">{generator.product || '-'}</p>
							</div>
							<div>
								<p class="text-gray-600">สถานที่ติดั้ง</p>
								<p class="font-semibold text-gray-800">{generator.location}</p>
							</div>
						</div>

						<div class="mb-2">
							<p class="text-gray-600">แบบฟอร์ม</p>
							<p class="font-semibold text-slate-700">{generator.templateName}</p>
						</div>

						{#if generator.isInspected}
							<div class="border-t pt-4 mt-4">
								<p class="text-sm text-gray-600 mb-2">วันที่ตรวจ</p>
								<p class="font-semibold text-gray-800">
									{formatThaiDate(generator.inspection.inspectionDate)}
								</p>
								<p class="text-sm text-gray-600 mb-2">ผู้ตรวจ</p>
								<p class="font-semibold text-gray-800">{generator.inspection.inspectorName}</p>
								<div class="flex gap-2 mt-2">
									<div class="px-3 py-1 text-sm rounded-full
									{generator.inspection.overallStatus === 'ปกติ' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
										{generator.inspection.overallStatus}
									</div>
									<div class="px-3 py-1 text-sm rounded-full
									{generator.inspection.machineStatus === 'ใช้งานได้' ? 'bg-green-100 text-green-700' : generator.inspection.machineStatus === 'ซ่อมแซม' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}">
										{generator.inspection.machineStatus}
									</div>
								</div>
							</div>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	</main>
</div>
