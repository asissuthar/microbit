<template>
  <div>{{ device }}</div>
</template>

<script>
import { defineComponent } from "vue";
import { MicroBit } from "boot/MicroBit";

export default defineComponent({
  name: "MUartService",
  props: {
    device: {
      type: Object,
      required: true,
    },
  },
  watch: {
    device: {
      immediate: true,
      handler(value) {
        console.log(value);
        console.log(this.getService());
      },
    },
  },
  methods: {
    getService() {
      return MicroBit.get(this.device?.id)?.services;
    },
  },
});
</script>
