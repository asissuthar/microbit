<template>
  <div>
    <div class="text-h4">A</div>
    <div class="text-h2">{{ deviceButtonAData }}</div>
  </div>
</template>

<script>
import { MicroBit } from "boot/MicroBit";
import { defineComponent } from "vue";

export default defineComponent({
  name: "MicroBitButtonA",
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
    deviceButtonAData() {
      return this.device?.button.a.data;
    },
  },
  methods: {
    getMicroBit() {
      return MicroBit.get(this.deviceId);
    },
    async readButtonA() {
      try {
        await this.getMicroBit()?.readButtonA();
      } catch (error) {
        console.log(error);
      }
    },
  },
  async mounted() {
    await this.readButtonA();
  },
});
</script>
