<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import type { FormTemplateItem } from '$lib/db/schema';

	$: templateId = $page.params.id;

	type EditableItem = FormTemplateItem & { sortOrder: number; _deleted?: boolean; isNew?: boolean; isNewCategory?: boolean };
	type NewItem = {
		id: null;
		formTemplateId: string | undefined;
		itemCode: string;
		category: string;
		description: string;
		isDisposalCriteria: boolean;
		sortOrder: number;
		isNew: true;
		isNewCategory?: boolean;
		_deleted?: boolean;
	};

	export let data;
	let templateName = data.template.name;
	let templateDescription = data.template.description || '';
	let items: (EditableItem | NewItem)[] = data.items;
	let saving = false;
	let errorMessage = '';

	function addItem() {
		const lastItem = items[items.length - 1];
		const category = lastItem?.category || 'หมวดใหม่';
		items = [
			...items,
			{
				id: null,
				formTemplateId: templateId,
				itemCode: '',
				category,
				description: '',
				isDisposalCriteria: false,
				sortOrder: items.length,
				isNew: true
			}
		];
	}

	function addCategory() {
		items = [
			...items,
			{
				id: null,
				formTemplateId: templateId,
				itemCode: '',
				category: '',
				description: '',
				isDisposalCriteria: false,
				sortOrder: items.length,
				isNew: true,
				isNewCategory: true
			}
		];
	}

	function removeItem(index: number) {
		const item = items[index];
		if (item.id && !item.isNew) {
			item._deleted = true;
			items = [...items];
		} else {
			items = items.filter((_, i) => i !== index);
		}
	}

	function moveItem(index: number, direction: number) {
		const newIndex = index + direction;
		if (newIndex < 0 || newIndex >= items.length) return;
		const temp = items[index];
		items[index] = items[newIndex];
		items[newIndex] = temp;
		items = items.map((item, i) => ({ ...item, sortOrder: i }));
	}

	$: visibleItems = items.filter((i) => !i._deleted);
	$: categories = [...new Set(visibleItems.map((i) => i.category).filter(Boolean))];
	$: itemsJson = JSON.stringify(items);
</script>

<form
	method="POST"
	action="?/save"
	use:enhance={() => {
		saving = true;
		errorMessage = '';
		return async ({ result, update }) => {
			saving = false;
			if (result.type === 'failure') {
				errorMessage = (result.data?.error as string) || 'เกิดข้อผิดพลาดในการบันทึก';
			}
			await update();
		};
	}}
>
	<input type="hidden" name="templateName" value={templateName} />
	<input type="hidden" name="templateDescription" value={templateDescription} />
	<input type="hidden" name="items" value={itemsJson} />

	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">แก้ไขแบบฟอร์ม</h1>
			<p class="text-gray-500 text-sm mt-1">จัดการหัวข้อตรวจสอบ</p>
		</div>
		<div class="flex gap-2">
			<a
				href="/admin/form-templates"
				class="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
			>
				← กลับ
			</a>
			<button
				type="submit"
				disabled={saving}
				class="px-4 py-2.5 gradient-bg text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-50 relative z-10"
			>
				{saving ? 'กำลังบันทึก...' : '💾 บันทึก'}
			</button>
		</div>
	</div>

	{#if errorMessage}
		<div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{errorMessage}</div>
	{/if}

		<!-- Template Info -->
		<div class="bg-white rounded-xl border border-gray-100 p-5 mb-6">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="tmpl-edit-name" class="block text-sm font-medium text-gray-700 mb-1">ชื่อแบบฟอร์ม</label>
					<input id="tmpl-edit-name" type="text" bind:value={templateName}
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light" />
				</div>
				<div>
					<label for="tmpl-edit-desc" class="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label>
					<input id="tmpl-edit-desc" type="text" bind:value={templateDescription}
						class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light" />
				</div>
			</div>
		</div>

		<!-- Items -->
		<div class="bg-white rounded-xl border border-gray-100 overflow-hidden mb-6">
			<div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
				<h2 class="font-semibold text-gray-800">หัวข้อตรวจสอบ ({visibleItems.length} รายการ)</h2>
				<div class="flex gap-2">
					<button
						type="button"
						on:click={addCategory}
						class="px-3 py-1.5 text-xs bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
					>
						+ หมวดใหม่
					</button>
					<button
						type="button"
						on:click={addItem}
						class="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
					>
						+ เพิ่มหัวข้อ
					</button>
				</div>
			</div>

			{#if visibleItems.length === 0}
				<div class="p-8 text-center text-gray-400">ยังไม่มีหัวข้อตรวจ กดปุ่ม "เพิ่มหัวข้อ" เพื่อเริ่มต้น</div>
			{:else}
				<div class="divide-y divide-gray-50">
					{#each visibleItems as item, i (item.id || `new-${i}`)}
						{@const itemIndex = items.indexOf(item)}
						<div class="p-4 hover:bg-gray-50/50 transition-colors">
							<div class="flex items-start gap-3">
								<!-- Move buttons -->
								<div class="flex flex-col gap-0.5 pt-1">
									<button
										type="button"
										on:click={() => moveItem(itemIndex, -1)}
										class="text-gray-400 hover:text-gray-600 text-xs leading-none"
										aria-label="เลื่อนขึ้น"
									>▲</button>
									<button
										type="button"
										on:click={() => moveItem(itemIndex, 1)}
										class="text-gray-400 hover:text-gray-600 text-xs leading-none"
										aria-label="เลื่อนลง"
									>▼</button>
								</div>

								<!-- Fields -->
								<div class="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2">
									<input
										type="text"
										bind:value={item.itemCode}
										placeholder="รหัส"
										class="sm:col-span-1 rounded border border-gray-300 px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary-light"
									/>
									<select
										bind:value={item.category}
										class="sm:col-span-3 rounded border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-light"
									>
										<option value="">เลือกหมวด</option>
										{#each categories as cat}
											<option value={cat}>{cat}</option>
										{/each}
									</select>
									<input
										type="text"
										bind:value={item.description}
										placeholder="คำอธิบายหัวข้อตรวจ"
										class="sm:col-span-6 rounded border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-light"
									/>
									<div class="sm:col-span-2 flex items-center gap-2">
										<label class="flex items-center gap-1 text-xs cursor-pointer">
											<input type="checkbox" bind:checked={item.isDisposalCriteria} class="rounded" />
											<span class="text-red-600">เกณฑ์รอจำหน่าย</span>
										</label>
									</div>
								</div>

								<!-- Delete -->
								<button
									type="button"
									on:click={() => removeItem(itemIndex)}
									class="text-red-400 hover:text-red-600 text-sm p-1"
									aria-label="ลบหัวข้อ"
								>✕</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
</form>
