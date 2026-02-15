<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	export let data: PageData;

	type FormTemplateWithStats = {
		id: string;
		name: string;
		description: string | null;
		isActive: boolean;
		createdAt: Date;
		itemCount: number;
		generatorCount: number;
	};

	let showModal = false;
	let editingTemplate: FormTemplateWithStats | null = null;
	let saving = false;
	let errorMessage = '';
	let formName = '';
	let formDescription = '';

	$: templates = data.templates as FormTemplateWithStats[];

	function openCreate() {
		editingTemplate = null;
		formName = '';
		formDescription = '';
		errorMessage = '';
		showModal = true;
	}

	function openEdit(tmpl: FormTemplateWithStats) {
		editingTemplate = tmpl;
		formName = tmpl.name;
		formDescription = tmpl.description || '';
		errorMessage = '';
		showModal = true;
	}
</script>

<div>
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">จัดการแบบฟอร์มตรวจสอบ</h1>
			<p class="text-gray-500 text-sm mt-1">สร้าง แก้ไข หรือทำสำเนาแบบฟอร์ม</p>
		</div>
		<button
			on:click={openCreate}
			class="px-4 py-2.5 gradient-bg text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium relative z-10"
		>
			+ สร้างแบบฟอร์มใหม่
		</button>
	</div>

	<!-- Templates Grid -->
	{#if templates.length === 0}
		<div class="p-12 text-center text-gray-400">ยังไม่มีแบบฟอร์ม</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each templates as tmpl}
				<div class="bg-white rounded-xl border border-gray-100 p-5 {tmpl.isActive ? '' : 'opacity-60'}">
					<div class="flex items-start justify-between mb-3">
						<div>
							<h3 class="font-semibold text-gray-800">{tmpl.name}</h3>
							{#if tmpl.description}
								<p class="text-xs text-gray-500 mt-0.5">{tmpl.description}</p>
							{/if}
						</div>
						<span class="px-2 py-0.5 rounded-full text-xs {tmpl.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}">
							{tmpl.isActive ? 'ใช้งาน' : 'ปิด'}
						</span>
					</div>

					<div class="flex gap-4 text-sm text-gray-600 mb-4">
						<div>
							<span class="text-gray-400">หัวข้อตรวจ:</span>
							<span class="font-medium">{tmpl.itemCount}</span>
						</div>
						<div>
							<span class="text-gray-400">เครื่องที่ใช้:</span>
							<span class="font-medium">{tmpl.generatorCount}</span>
						</div>
					</div>

					<div class="flex gap-2 flex-wrap">
						<a
							href="/admin/form-templates/{tmpl.id}/edit"
							class="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
						>
							📝 แก้ไขหัวข้อ
						</a>
						<button
							on:click={() => openEdit(tmpl)}
							class="px-3 py-1.5 text-xs bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
						>
							แก้ไขชื่อ
						</button>
						<form method="POST" action="?/duplicate" use:enhance={() => {
							if (!confirm(`ทำสำเนาแบบฟอร์ม "${tmpl.name}" ?`)) return () => {};
							return async ({ update }) => { await update(); };
						}} class="inline">
							<input type="hidden" name="id" value={tmpl.id} />
							<button type="submit" class="px-3 py-1.5 text-xs bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
								ทำสำเนา
							</button>
						</form>
						<form method="POST" action="?/toggleActive" use:enhance={() => {
							const newStatus = !tmpl.isActive;
							if (!confirm(`ยืนยัน${newStatus ? 'เปิด' : 'ปิด'}ใช้งานแบบฟอร์ม "${tmpl.name}" ?`)) return () => {};
							return async ({ update }) => { await update(); };
						}} class="inline">
							<input type="hidden" name="id" value={tmpl.id} />
							<input type="hidden" name="isActive" value={String(!tmpl.isActive)} />
							<button type="submit" class="px-3 py-1.5 text-xs rounded-lg transition-colors
								{tmpl.isActive ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}">
								{tmpl.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
							</button>
						</form>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Modal -->
{#if showModal}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-xl shadow-xl w-full max-w-md">
			<form
				method="POST"
				action={editingTemplate ? '?/update' : '?/create'}
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
				{#if editingTemplate}
					<input type="hidden" name="id" value={editingTemplate.id} />
				{/if}
				<div class="px-6 py-4 border-b border-gray-100">
					<h3 class="text-lg font-semibold text-gray-800">
						{editingTemplate ? 'แก้ไขแบบฟอร์ม' : 'สร้างแบบฟอร์มใหม่'}
					</h3>
				</div>
				<div class="p-6 space-y-4">
					{#if errorMessage}
						<div class="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{errorMessage}</div>
					{/if}
					<div>
						<label for="tmpl-name" class="block text-sm font-medium text-gray-700 mb-1">ชื่อแบบฟอร์ม *</label>
						<input id="tmpl-name" type="text" name="name" bind:value={formName} placeholder="เช่น แบบฟอร์ม 1"
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light" />
					</div>
					<div>
						<label for="tmpl-desc" class="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label>
						<textarea id="tmpl-desc" name="description" bind:value={formDescription} placeholder="คำอธิบายเพิ่มเติม..." rows="3"
							class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light"></textarea>
					</div>
				</div>
				<div class="px-6 py-4 border-t border-gray-100 flex gap-2 justify-end">
					<button type="button" on:click={() => (showModal = false)} class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
						ยกเลิก
					</button>
					<button type="submit" disabled={saving}
						class="px-4 py-2 text-sm gradient-bg text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 relative z-10">
						{saving ? 'กำลังบันทึก...' : 'บันทึก'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
