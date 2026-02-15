<script lang="ts">
	import LoadingSpinner from './LoadingSpinner.svelte';

	interface Props {
		type?: 'button' | 'submit' | 'reset';
		variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
		size?: 'sm' | 'md' | 'lg';
		loading?: boolean;
		disabled?: boolean;
		onclick?: () => void;
		children?: import('svelte').Snippet;
		class?: string;
	}

	let {
		type = 'button',
		variant = 'primary',
		size = 'md',
		loading = false,
		disabled = false,
		onclick,
		children,
		class: className = ''
	}: Props = $props();

	const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

	const variantClasses = {
		primary: 'gradient-bg text-white hover:opacity-90 focus:ring-primary-light',
		secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-400',
		danger: 'bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-400',
		ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-400'
	};

	const sizeClasses = {
		sm: 'px-3 py-1.5 text-xs',
		md: 'px-4 py-2 text-sm',
		lg: 'px-6 py-3 text-base'
	};
</script>

<button
	{type}
	class="{baseClasses} {variantClasses[variant]} {sizeClasses[size]} {className}"
	disabled={disabled || loading}
	onclick={onclick}
>
	{#if loading}
		<LoadingSpinner size={size === 'sm' ? 'sm' : 'md'} color={variant === 'primary' ? 'white' : 'primary'} />
	{/if}
	<span class={loading ? 'opacity-80' : ''}>{@render children?.()}</span>
</button>
