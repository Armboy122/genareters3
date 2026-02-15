<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Button from '$lib/components/Button.svelte';

	let username = $state('');
	let password = $state('');
	let loading = $state(false);
	let errorMessage = $state('');

	let redirectTo = $derived($page.url.searchParams.get('redirect') || '/admin');

	async function handleLogin() {
		if (!username.trim() || !password) {
			errorMessage = 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน';
			return;
		}

		loading = true;
		errorMessage = '';

		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username: username.trim(), password })
			});

			const data = await res.json();

			if (data.success) {
				goto(redirectTo);
			} else {
				errorMessage = data.message || 'เข้าสู่ระบบไม่สำเร็จ';
			}
		} catch {
			errorMessage = 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4">
	<div class="w-full max-w-sm">
		<!-- Logo -->
		<div class="text-center mb-8">
			<div class="w-16 h-16 rounded-2xl bg-amber-400/20 flex items-center justify-center mx-auto mb-4">
				<span class="text-3xl">⚡</span>
			</div>
			<h1 class="text-2xl font-bold text-white">ระบบตรวจสภาพเครื่องกำเนิดไฟฟ้า</h1>
			<p class="text-blue-300/60 text-sm mt-1">เข้าสู่ระบบผู้ดูแล</p>
		</div>

		<!-- Login Card -->
		<div class="bg-white rounded-2xl shadow-2xl p-8">
			{#if errorMessage}
				<div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
					<span>⚠️</span>
					<span>{errorMessage}</span>
				</div>
			{/if}

			<form onsubmit={(e) => { e.preventDefault(); handleLogin(); }} class="space-y-5">
				<div>
					<label for="login-username" class="block text-sm font-medium text-gray-700 mb-1.5">ชื่อผู้ใช้</label>
					<input
						id="login-username"
						type="text"
						bind:value={username}
						placeholder="username"
						autocomplete="username"
						class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
					/>
				</div>

				<div>
					<label for="login-password" class="block text-sm font-medium text-gray-700 mb-1.5">รหัสผ่าน</label>
					<input
						id="login-password"
						type="password"
						bind:value={password}
						placeholder="••••••••"
						autocomplete="current-password"
						class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
					/>
				</div>

				<Button
					type="submit"
					loading={loading}
					size="lg"
					class="w-full"
				>
					{loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
				</Button>
			</form>

			<div class="mt-6 text-center">
				<a href="/dashboard" class="text-sm text-gray-400 hover:text-gray-600 transition-colors">
					← กลับหน้าหลัก
				</a>
			</div>
		</div>
	</div>
</div>
