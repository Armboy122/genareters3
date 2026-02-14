<script lang="ts">
	import { page } from '$app/stores';
	import { formatThaiDate } from '$lib/utils';

	$: ({ inspection } = $page.data);
</script>

<div class="min-h-screen">
	<!-- Header -->
	<header class="gradient-bg text-white shadow-lg">
		<div class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 relative z-10">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold tracking-tight">รายละเอียดการตรวจ</h1>
					<p class="text-blue-200/70 text-sm font-mono">{inspection.inspectionCode}</p>
				</div>
				<a
					href="/department/{inspection.department.id}/month/{inspection.year}/{inspection.month}"
					class="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white"
				>
					← กลับหน้ารายการ
				</a>
			</div>
		</div>
	</header>

	<main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
		<!-- Generator Info -->
		<div class="mb-8 bg-white rounded-xl shadow-md p-6">
			<h2 class="text-xl font-semibold text-gray-800 mb-4">ข้อมูลเครื่องกำเนิดไฟฟ้า</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div>
					<p class="text-sm text-gray-600">รหัสทรัพย์สิน</p>
					<p class="text-lg font-semibold text-gray-800">{inspection.generator.assetId}</p>
				</div>
				<div>
					<p class="text-sm text-gray-600">ประเภท</p>
					<p class="text-lg font-semibold text-gray-800">{inspection.generator.type}</p>
				</div>
				<div>
					<p class="text-sm text-gray-600">ขนาด (kW)</p>
					<p class="text-lg font-semibold text-gray-800">{inspection.generator.sizeKw}</p>
				</div>
				<div>
					<p class="text-sm text-gray-600">ผลิตภัณฑ์</p>
					<p class="text-lg font-semibold text-gray-800">{inspection.generator.product || '-'}</p>
				</div>
				<div>
					<p class="text-sm text-gray-600">สถานที่ติดตั้ง</p>
					<p class="text-lg font-semibold text-gray-800">{inspection.generator.location}</p>
				</div>
				<div>
					<p class="text-sm text-gray-600">สังกัด</p>
					<p class="text-lg font-semibold text-gray-800">{inspection.department.name}</p>
				</div>
				<div>
					<p class="text-sm text-gray-600">แบบฟอร์ม</p>
					<p class="text-lg font-semibold text-gray-800">{inspection.formTemplateName}</p>
				</div>
			</div>
		</div>

		<!-- Inspection Info -->
		<div class="mb-8 bg-white rounded-xl shadow-md p-6">
			<h2 class="text-xl font-semibold text-gray-800 mb-4">ข้อมูลการตรวจ</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div>
					<p class="text-sm text-gray-600">วันที่ตรวจ</p>
					<p class="text-lg font-semibold text-gray-800">
						{formatThaiDate(inspection.inspectionDate)}
					</p>
				</div>
				<div>
					<p class="text-sm text-gray-600">ผู้ตรวจ</p>
					<p class="text-lg font-semibold text-gray-800">{inspection.inspectorName}</p>
				</div>
				<div>
					<p class="text-sm text-gray-600">สถานะรวม</p>
					<span class="inline-block px-3 py-1 text-sm rounded-full
						{inspection.overallStatus === 'ปกติ' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
						{inspection.overallStatus}
					</span>
				</div>
				<div>
					<p class="text-sm text-gray-600">สถานะเครื่อง</p>
					<span class="inline-block px-3 py-1 text-sm rounded-full
						{inspection.machineStatus === 'ใช้งานได้' ? 'bg-green-100 text-green-700' : inspection.machineStatus === 'ซ่อมแซม' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}">
						{inspection.machineStatus}
					</span>
				</div>
			</div>
		</div>

		<!-- Inspection Details -->
		<div class="mb-8 bg-white rounded-xl shadow-md p-6">
			<h2 class="text-xl font-semibold text-gray-800 mb-4">รายละเอียดการตรวจ</h2>
			<div class="space-y-4">
				{#each inspection.details as detail}
					<div class="border-b border-gray-100 pb-4 last:border-0">
						<div class="flex justify-between items-start mb-2">
							<div class="flex-1">
								<span class="text-sm font-medium text-slate-500 font-mono">{detail.itemCode}</span>
								<p class="text-gray-800">{detail.description}</p>
							</div>
							<div class="text-right ml-4">
								<span
									class="px-3 py-1 text-sm rounded-full {detail.status === 'ปกติ'
										? 'bg-green-100 text-green-700'
										: 'bg-red-100 text-red-700'}"
								>
									{detail.status}
								</span>
							</div>
						</div>
						{#if detail.remark}
							<div class="ml-4 mt-2">
								<p class="text-sm text-gray-600 mb-1">หมายเหตุ:</p>
								<p class="text-gray-700 bg-gray-50 p-3 rounded-lg">{detail.remark}</p>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Overall Remark -->
		{#if inspection.overallRemark}
			<div class="mb-8 bg-white rounded-xl shadow-md p-6">
				<h2 class="text-xl font-semibold text-gray-800 mb-4">หมายเหตุรวม</h2>
				<p class="text-gray-700 bg-gray-50 p-4 rounded-lg">{inspection.overallRemark}</p>
			</div>
		{/if}

		<!-- Actions -->
		<div class="flex gap-4 mt-6">
			<a
				href="/inspection/new/{inspection.generatorId}/{inspection.year}/{inspection.month}"
				class="flex-1 px-6 py-3 gradient-bg text-white font-semibold rounded-lg hover:opacity-90 transition-opacity text-center relative z-10"
			>
				✏️ แก้ไข
			</a>
			<a
				href="/department/{inspection.department.id}/month/{inspection.year}/{inspection.month}"
				class="flex-1 px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors text-center"
			>
				กลับหน้ารายการ
			</a>
		</div>
	</main>
</div>
