import { computed, defineComponent, ref } from 'vue';
export const ElPopoverStub = defineComponent({
  name: 'ElPopover',
  props: {
    disabled: Boolean,
    hideAfter: Number,
    offset: Number,
    placement: String,
    popperClass: String,
    teleported: Boolean,
    trigger: String,
    visible: { type: Boolean, default: undefined },
    width: [String, Number],
  },
  emits: ['beforeEnter', 'beforeLeave', 'hide', 'show', 'update:visible'],
  setup(props, { emit }) {
    const internalVisible = ref(false);
    const shown = computed(() => props.visible ?? internalVisible.value);
    const toggle = () => {
      if (props.disabled || props.trigger === 'manual') return;
      // Toggle what is actually shown, so a controlled `visible` that was closed from outside reopens.
      internalVisible.value = !shown.value;
      emit('update:visible', internalVisible.value);
    };
    return { shown, toggle };
  },
  template: '<span class="el-popover"><span @click="toggle"><slot name="reference" /></span><Teleport to="body" :disabled="!teleported"><span v-if="shown" :class="popperClass"><slot /></span></Teleport></span>',
});