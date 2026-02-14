<script lang="ts">
	import { page } from '$app/stores';
	import { formatThaiDate } from '$lib/utils';

	$: ({ stats, recentInspections } = $page.data);

	const statCards = [
		{ label: 'สังกัดทั้งหมด', key: 'departments', icon: '🏢', color: 'bg-blue-50 text-blue-700 border-blue-200' },
		{ label: 'เครื่องทั้งหมด', key: 'generators', icon: '⚡', color: 'bg-amber-50 text-amber-700 border-amber-200' },
		{ label: 'เครื่องใช้งาน', key: 'activeGenerators', icon: '✅', color: 'bg-green-50 text-green-700 border-green-200' },
		{ label: 'แบบฟอร์ม', key: 'formTemplates', icon: '📋', color: 'bg-purple-50 text-purple-700 border-purple-200' },
		{ label: 'ผู้ใช้งาน', key: 'users', icon: '👤', color: 'bg-slate-50 text-slate-700 border-slate-200' },
		{ label: 'ตรวจเดือนนี้', key: 'inspectionsThisMonth', icon: '🔍', color: 'bg-teal-50 text-teal-700 border-teal-200' }
	];

	const quickLinks = [
		{ href: '/admin/departments', label: 'จัดการสังกัด', icon: '🏢', desc: 'เพิ่ม/แก้ไข/ลบสังกัด' },
		{ href: '/admin/generators', label: 'จัดการเครื่อง', icon: '⚡', desc: 'เพิ่ม/แก้ไขเครื่องกำเนิดไฟฟ้า' },
		{ href: '/admin/form-templates', label: 'จัดการแบบฟอร์ม', icon: '📋', desc: 'สร้าง/แก้ไขแบบฟอร์มตรวจ' },
		{ href: '/admin/users', label: 'จัดการผู้ใช้', icon: '👤', desc: 'เพิ่ม/แก้ไขผู้ใช้งาน' },
		{ href: '/admin/inspections', label: 'ประวัติการตรวจ', icon: '🔍', desc: 'ดูประวัติและส่งออกข้อมูล' },
		{ href: '/dashboard', label: 'หน้าผู้ตรวจ', icon: '📱', desc: 'ไปหน้าแดชบอร์ดผู้ตรวจ' }
	];
</script>

<div>
	<div class="mb-8">
		<h1 class="text-2xl font-bold text-gray-900">แดชบอร์ดผู้ดูแลระบบ</h1>
		<p class="text-gray-500 text-sm mt-1">ภาพรวมระบบตรวจสภาพเครื่องกำเนิดไฟฟ้า</p>
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
		{#each statCards as card}
			<div class="rounded-xl border p-4 {card.color}">
				<div class="flex items-center gap-2 mb-2">
					<span class="text-lg">{card.icon}</span>
					<span class="text-xs font-medium opacity-70">{card.label}</span>
				</div>
				<p class="text-2xl font-bold">{stats[card.key]}</p>
			</div>
		{/each}
	</div>

	<!-- Quick Links -->
	<div class="mb-8">
		<h2 class="text-lg font-semibold text-gray-800 mb-4">เมนูลัด</h2>
		<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
			{#each quickLinks as link}
				<a
					href={link.href}
					class="block bg-white rounded-xl border border-gray-100 p-4 hover:border-primary-light hover:shadow-md transition-all group"
				>
					<span class="text-2xl block mb-2 group-hover:scale-110 transition-transform inline-block">{link.icon}</span>
					<p class="font-semibold text-sm text-gray-800">{link.label}</p>
					<p class="text-xs text-gray-500 mt-0.5">{link.desc}</p>
				</a>
			{/each}
		</div>
	</div>

	<!-- Recent Inspections -->
	<div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
		<div class="px-6 py-4 border-b border-gray-100">
			<h2 class="text-lg font-semibold text-gray-800">การตรวจล่าสุด</h2>
		</div>
		{#if recentInspections.length === 0}
			<div class="p-8 text-center text-gray-400">
				<p>ยังไม่มีข้อมูลการตรวจ</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-gray-50 text-gray-600">
						<tr>
							<th class="text-left px-4 py-3 font-medium">รหัสการตรวจ</th>
							<th class="text-left px-4 py-3 font-medium">เครื่อง</th>
							<th class="text-left px-4 py-3 font-medium">สังกัด</th>
							<th class="text-left px-4 py-3 font-medium">ผู้ตรวจ</th>
							<th class="text-left px-4 py-3 font-medium">สถานะรวม</th>
							<th class="text-left px-4 py-3 font-medium">สถานะเครื่อง</th>
							<th class="text-left px-4 py-3 font-medium">วันที่</th>
						</tr>
					</thead>
					<tbody>
						{#each recentInspections as ins}
							<tr class="border-t border-gray-50 hover:bg-gray-50/50">
								<td class="px-4 py-3">
									<a href="/inspection/{ins.id}" class="text-primary-light hover:underline font-mono text-xs">
										{ins.inspectionCode}
									</a>
								</td>
								<td class="px-4 py-3 font-medium">{ins.generatorAssetId}</td>
								<td class="px-4 py-3 text-gray-600">{ins.departmentName}</td>
								<td class="px-4 py-3 text-gray-600">{ins.inspectorName}</td>
								<td class="px-4 py-3">
									<span class="px-2 py-0.5 rounded-full text-xs
										{ins.overallStatus === 'ปกติ' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
										{ins.overallStatus}
									</span>
								</td>
								<td class="px-4 py-3">
									<span class="px-2 py-0.5 rounded-full text-xs
										{ins.machineStatus === 'ใช้งานได้' ? 'bg-green-100 text-green-700' : ins.machineStatus === 'ซ่อมแซม' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}">
										{ins.machineStatus}
									</span>
								</td>
								<td class="px-4 py-3 text-gray-500 text-xs">{formatThaiDate(ins.inspectionDate)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
