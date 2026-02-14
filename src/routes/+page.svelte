<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		goto('/dashboard');
	});
</script>

<div class="flex items-center justify-center min-h-screen">
	<div class="text-center">
		<div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-t-transparent"></div>
		<p class="mt-4 text-gray-600">กำลังโหลด...</p>
	</div>
</div>
