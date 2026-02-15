<script lang="ts">
	import { navigating } from '$app/stores';
	import LoadingSpinner from './LoadingSpinner.svelte';
</script>

{#if $navigating}
	<div class="fixed top-0 left-0 right-0 z-[100] bg-primary-light/10 backdrop-blur-sm">
		<div class="h-1 bg-gradient-to-r from-primary-light via-amber-400 to-primary-light animate-pulse"></div>
	</div>
	<div class="fixed inset-0 z-[99] flex items-center justify-center bg-white/50 backdrop-blur-[2px]">
		<div class="bg-white rounded-xl shadow-xl p-6 flex flex-col items-center gap-3">
			<LoadingSpinner size="lg" />
			<p class="text-sm text-gray-600 font-medium">กำลังโหลด...</p>
		</div>
	</div>
{/if}
