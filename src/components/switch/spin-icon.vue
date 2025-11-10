<template>
  <svg :class="className" viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor">
    <path
      d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"
    />
    <path
      d="M512 140c-205.4 0-372 166.6-372 372h72c0-165.7 134.3-300 300-300s300 134.3 300 300h72c0-205.4-166.6-372-372-372z"
    >
      <animateTransform
        attributeName="transform"
        attributeType="XML"
        type="rotate"
        dur="1s"
        from="0 512 512"
        to="360 512 512"
        repeatCount="indefinite"
      />
    </path>
  </svg>
</template>

<script setup lang="ts">
interface SpinIconProps {
  className?: string
}

withDefaults(defineProps<SpinIconProps>(), {
  className: '',
})
</script>
