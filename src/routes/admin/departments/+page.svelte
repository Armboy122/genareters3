<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import type { Department } from '$lib/db/schema';
	import Button from '$lib/components/Button.svelte';

	type DepartmentWithCount = Department & { generatorCount: number };

	let { data } = $props();

	let search = $state('');
	let showModal = $state(false);
	let editingDept: DepartmentWithCount | null = $state(null);
	let formName = $state('');
	let saving = $state(false);
	let errorMessage = $state('');
	let deleting: string | null = $state(null);
	let toggling: string | null = $state(null);

	let departments = $derived(data.departments as DepartmentWithCount[]);

	// Instant client-side filtering
	let filteredDepts = $derived(departments.filter((dept) =>
		dept.name.toLowerCase().includes(search.toLowerCase())
	));

	function openCreate() {
		editingDept = null;
		formName = '';
		errorMessage = '';
		showModal = true;
	}

	function openEdit(dept: DepartmentWithCount) {
		editingDept = dept;
		formName = dept.name;
		errorMessage = '';
		showModal = true;
	}
</script>

<div>
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">จัดการสังกัด</h1>
			<p class="text-gray-500 text-sm mt-1">เพิ่ม แก้ไข หรือลบสังกัด/การไฟฟ้า — ทั้งหมด {departments.length} สังกัด</p>
		</div>
		<button
			onclick={openCreate}
			class="px-4 py-2.5 gradient-bg text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium relative z-10"
		>
			+ เพิ่มสังกัดใหม่
		</button>
	</div>

	<!-- Search (instant filter) -->
	<div class="mb-6">
		<div class="relative">
			<span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
			<input
				type="text"
				bind:value={search}
				placeholder="พิมพ์เพื่อค้นหาสังกัด / การไฟฟ้า... (กรองทันที)"
				class="w-full rounded-lg border border-gray-300 pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent"
			/>
			{#if search}
				<button
					onclick={() => (search = '')}
					class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
				>✕</button>
			{/if}
		</div>
		{#if search}
			<p class="mt-2 text-xs text-gray-500">พบ {filteredDepts.length} จาก {departments.length} สังกัด</p>
		{/if}
	</div>

	<!-- Table -->
	<div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
		{#if filteredDepts.length === 0}
			<div class="p-12 text-center text-gray-400">
				{#if search}
					ไม่พบสังกัดที่ค้นหา "{search}"
				{:else}
					ไม่พบข้อมูลสังกัด
				{/if}
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-gray-50 text-gray-600">
						<tr>
							<th class="text-left px-4 py-3 font-medium w-12">#</th>
							<th class="text-left px-4 py-3 font-medium">ชื่อสังกัด</th>
							<th class="text-left px-4 py-3 font-medium w-32">จำนวนเครื่อง</th>
							<th class="text-right px-4 py-3 font-medium w-40">จัดการ</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredDepts as dept, i}
							<tr class="border-t border-gray-50 hover:bg-gray-50/50">
								<td class="px-4 py-3 text-gray-400">{i + 1}</td>
								<td class="px-4 py-3 font-medium text-gray-800">{dept.name}</td>
								<td class="px-4 py-3">
									<span class="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
										{dept.generatorCount} เครื่อง
									</span>
								</td>
								<td class="px-4 py-3 text-right">
									<button
										onclick={() => openEdit(dept)}
										class="px-3 py-1.5 text-xs bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors mr-1"
									>
										แก้ไข
									</button>
									<form
										method="POST"
										action="?/delete"
										use:enhance={() => {
										  deleting = dept.id;
										  if (!confirm(`ยืนยันลบสังกัด "${dept.name}" ?`)) {
										  deleting = null;
										  return () => {};
										  }
										  return async ({ result, update }) => {
										   deleting = null;
										   if (result.type === 'failure') {
										  alert(result.data?.error || 'ไม่สามารถลบได้');
										 }
										 await update();
										};
										}}
									>
										<input type="hidden" name="id" value={dept.id} />
										<Button
											type="submit"
											variant="danger"
											size="sm"
											loading={deleting === dept.id}
										>
											ลบ
										</Button>
									</form>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<div class="px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
				{#if search}
					แสดง {filteredDepts.length} จาก {departments.length} สังกัด
				{:else}
					ทั้งหมด {departments.length} สังกัด
				{/if}
			</div>
		{/if}
	</div>
</div>

<!-- Modal -->
{#if showModal}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-xl shadow-xl w-full max-w-md">
			<form
				method="POST"
				action={editingDept ? '?/update' : '?/create'}
				use:enhance={() => {
					saving = true;
					errorMessage = '';
					return async ({ result, update }) => {
						saving = false;
						if (result.type === 'success') {
							showModal = false;
							errorMessage = '';
						} else if (result.type === 'failure') {
							errorMessage = (result.data?.error as string) || 'เกิดข้อผิดพลาด';
						}
						await update();
					};
				}}
			>
				{#if editingDept}
					<input type="hidden" name="id" value={editingDept.id} />
				{/if}
				<div class="px-6 py-4 border-b border-gray-100">
					<h3 class="text-lg font-semibold text-gray-800">
						{editingDept ? 'แก้ไขสังกัด' : 'เพิ่มสังกัดใหม่'}
					</h3>
				</div>
				<div class="p-6">
					{#if errorMessage}
						<div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
							{errorMessage}
						</div>
					{/if}
					<label class="block text-sm font-medium text-gray-700 mb-2">ชื่อสังกัด</label>
					<input
						type="text"
						name="name"
						bind:value={formName}
						placeholder="เช่น กฟจ.ยะลา"
						class="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent"
					/>
				</div>
				<div class="px-6 py-4 border-t border-gray-100 flex gap-2 justify-end">
					<Button
						type="button"
						variant="secondary"
						onclick={() => (showModal = false)}
					>
						ยกเลิก
					</Button>
					<Button
						type="submit"
						loading={saving}
					>
						{saving ? 'กำลังบันทึก...' : 'บันทึก'}
					</Button>
				</div>
			</form>
		</div>
	</div>
{/if}
