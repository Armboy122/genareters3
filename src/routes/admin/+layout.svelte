<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	async function handleLogout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		goto('/login');
	}

	const menuItems = [
		{ href: '/admin', label: 'แดชบอร์ด', icon: '📊' },
		{ href: '/admin/departments', label: 'จัดการสังกัด', icon: '🏢' },
		{ href: '/admin/generators', label: 'จัดการเครื่อง', icon: '⚡' },
		{ href: '/admin/form-templates', label: 'จัดการแบบฟอร์ม', icon: '📋' },
		{ href: '/admin/users', label: 'จัดการผู้ใช้', icon: '👤' },
		{ href: '/admin/inspections', label: 'ประวัติการตรวจ', icon: '🔍' }
	];

	let currentPath = $derived($page.url.pathname);

	function isActive(href: string) {
		if (href === '/admin') return currentPath === '/admin';
		return currentPath.startsWith(href);
	}

	let { children } = $props();
	let sidebarOpen = $state(false);
</script>

<div class="min-h-screen flex">
	<!-- Mobile sidebar overlay -->
	{#if sidebarOpen}
		<div
			class="fixed inset-0 bg-black/50 z-40 lg:hidden"
			onclick={() => (sidebarOpen = false)}
			role="button"
			tabindex="-1"
			aria-label="ปิดเมนู"
			onkeydown={(e) => e.key === 'Escape' && (sidebarOpen = false)}
		></div>
	{/if}

	<!-- Sidebar -->
	<aside
		class="fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-primary-dark text-white flex flex-col transition-transform duration-200
		{sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0"
	>
		<!-- Logo -->
		<div class="p-5 border-b border-white/10">
			<div class="flex items-center gap-2">
				<div class="w-8 h-8 rounded-lg bg-amber-400/20 flex items-center justify-center">
					<span class="text-amber-300">⚡</span>
				</div>
				<div>
					<h1 class="font-bold text-sm leading-tight">ระบบตรวจสภาพ</h1>
					<p class="text-[10px] text-blue-300/60">Admin Panel</p>
				</div>
			</div>
		</div>

		<!-- Navigation -->
		<nav class="flex-1 py-4 overflow-y-auto">
			{#each menuItems as item}
				<a
					href={item.href}
					class="flex items-center gap-3 px-5 py-3 text-sm transition-colors
					{isActive(item.href)
						? 'bg-white/10 text-white border-r-2 border-amber-400'
						: 'text-blue-200/70 hover:bg-white/5 hover:text-white'}"
					onclick={() => (sidebarOpen = false)}
				>
					<span class="text-base">{item.icon}</span>
					<span>{item.label}</span>
				</a>
			{/each}
		</nav>

		<!-- Footer -->
		<div class="p-4 border-t border-white/10 space-y-2">
			<a
				href="/dashboard"
				class="flex items-center gap-2 text-sm text-blue-200/60 hover:text-white transition-colors"
			>
				<span>←</span>
				<span>กลับหน้าผู้ตรวจ</span>
			</a>
			<button
				onclick={handleLogout}
				class="flex items-center gap-2 text-sm text-red-300/60 hover:text-red-300 transition-colors w-full"
			>
				<span>🚪</span>
				<span>ออกจากระบบ</span>
			</button>
		</div>
	</aside>

	<!-- Main Content -->
	<div class="flex-1 min-w-0">
		<!-- Top bar (mobile) -->
		<header class="lg:hidden sticky top-0 z-30 bg-primary-dark text-white px-4 py-3 flex items-center gap-3 shadow-md">
			<button
				onclick={() => (sidebarOpen = !sidebarOpen)}
				class="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
				aria-label="เปิดเมนู"
			>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
				</svg>
			</button>
			<span class="font-semibold text-sm">Admin Panel</span>
		</header>

		<main class="p-4 sm:p-6 lg:p-8">
			{@render children()}
		</main>
	</div>
</div>
