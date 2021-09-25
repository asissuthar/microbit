<template>
  <div>
    <div class="text-h4">B</div>
    <div class="text-h2">{{ deviceButtonBData }}</div>
  </div>
</template>

<script>
import { MicroBit } from "boot/MicroBit";
import { defineComponent } from "vue";

export default defineComponent({
  name: "MicroBitButtonB",
  props: {
    device: {
      type: Object,
      required: true,
    },
  },
  computed: {
    deviceId() {
      return this.device?.id;
    },
    deviceButtonBData() {
      return this.device?.button.b.data;
    },
  },
  methods: {
    getMicroBit() {
      return MicroBit.get(this.deviceId);
    },
    async readButtonBState() {
      try {
        await this.getMicroBit()?.readButtonBState();
      } catch (error) {
        console.log(error);
      }
    },
  },
  async mounted() {
    await this.readButtonBState();
  },
});
</script>
