<script lang="ts">
	import { page } from '$app/stores';

	let status = $derived($page.status);
	let message = $derived($page.error?.message || 'เกิดข้อผิดพลาด');
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
	<div class="max-w-md w-full">
		<div class="bg-white rounded-xl shadow-lg p-8">
			<div class="text-center">
				<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
					<span class="text-3xl">⚠️</span>
				</div>
				<h1 class="text-2xl font-bold text-gray-900 mb-2">
					ข้อผิดพลาด {status}
				</h1>
				<p class="text-gray-600 mb-6">{message}</p>
				<a
					href="/"
					class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white gradient-bg hover:opacity-90 transition-opacity relative z-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light"
				>
					กลับหน้าหลัก
				</a>
			</div>
		</div>
	</div>
</div>
