<template>
  <div>
    <div class="text-h4">Temperature</div>
    <div class="text-h2">{{ deviceTemperatureData }}</div>
  </div>
</template>

<script>
import { MicroBit } from "boot/MicroBit";
import { defineComponent } from "vue";

export default defineComponent({
  name: "MicroBitTemperature",
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
    deviceTemperatureData() {
      return this.device?.temperature.data;
    },
  },
  methods: {
    getMicroBit() {
      return MicroBit.get(this.deviceId);
    },
    async readTemperature() {
      try {
        await this.getMicroBit()?.readTemperature();
      } catch (error) {
        console.log(error);
      }
    },
  },
  async mounted() {
    await this.readTemperature();
  },
});
</script>
