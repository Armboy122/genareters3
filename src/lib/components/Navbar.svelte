<script lang="ts">
	import { page } from '$app/stores';

	let mobileOpen = $state(false);

	const navItems = [
		{ href: '/', label: 'KPI ภาพรวม', icon: '📈' },
		{ href: '/dashboard', label: 'รายงานการตรวจ', icon: '📊' },
		{ href: '/admin', label: 'จัดการระบบ', icon: '⚙️' }
	];

	let currentPath = $derived($page.url.pathname);

	function isActive(href: string): boolean {
		if (href === '/') return currentPath === '/';
		return currentPath.startsWith(href);
	}

	let showNavbar = $derived(!currentPath.startsWith('/admin') && currentPath !== '/login');
</script>

{#if showNavbar}
	<nav class="gradient-bg border-b border-white/10 relative z-40">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
			<div class="flex items-center justify-between h-11">
				<!-- Logo -->
				<a href="/" class="flex items-center gap-2 shrink-0 group">
					<span class="text-amber-300 text-sm">⚡</span>
					<span class="text-white/80 font-medium text-sm group-hover:text-white transition-colors">ระบบตรวจสภาพ <span class="text-blue-300/40 text-xs">กฟภ.</span></span>
				</a>

				<!-- Desktop Nav -->
				<div class="hidden sm:flex items-center gap-0.5">
					{#each navItems as item (item.href)}
						<a
							href={item.href}
							class="flex items-center gap-1.5 px-3 py-1 rounded-md text-sm transition-all
								{isActive(item.href)
									? 'bg-white/15 text-white font-medium'
									: 'text-blue-200/60 hover:bg-white/10 hover:text-white'}"
						>
							<span class="text-xs">{item.icon}</span>
							<span>{item.label}</span>
						</a>
					{/each}
				</div>

				<!-- Mobile hamburger -->
				<button
					class="sm:hidden p-1.5 rounded-md text-blue-200/60 hover:bg-white/10 hover:text-white transition-colors"
					onclick={() => (mobileOpen = !mobileOpen)}
					aria-label="เปิดเมนู"
				>
					{#if mobileOpen}
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					{:else}
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
						</svg>
					{/if}
				</button>
			</div>

			<!-- Mobile menu -->
			{#if mobileOpen}
				<div class="sm:hidden pb-2 border-t border-white/10 mt-0.5 pt-1.5 space-y-0.5">
					{#each navItems as item (item.href)}
						<a
							href={item.href}
							onclick={() => (mobileOpen = false)}
							class="flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all
								{isActive(item.href)
									? 'bg-white/15 text-white font-medium'
									: 'text-blue-200/60 hover:bg-white/10 hover:text-white'}"
						>
							<span>{item.icon}</span>
							<span>{item.label}</span>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</nav>
{/if}
