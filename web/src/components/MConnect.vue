<template>
  <div>
    <q-btn :label="statusLabel" @click="connect" />
  </div>
</template>

<script>
import { defineComponent } from "vue";
import { MicroBit } from "boot/MicroBit";

export default defineComponent({
  name: "MConnect",
  props: {
    device: {
      type: Object,
      required: true,
    },
  },
  computed: {
    microBit() {
      return MicroBit.get(this.device?.id);
    },
    isConnected() {
      return this.microBit?.isConnected;
    },
    statusLabel() {
      return this.isConnected ? "Disconnect" : "Connect";
    },
  },
  methods: {
    async connect() {
      try {
        await this.microBit.connect();
      } catch (error) {
        console.log(error);
      }
    },
  },
});
</script>
