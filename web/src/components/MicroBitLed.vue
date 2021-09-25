<template>
  <div>
    <div class="row justify-center" v-for="x in 5" :key="x">
      <div class="col-auto" v-for="y in 5" :key="y">
        <q-checkbox
          dense
          :model-value="deviceLedData[x - 1][y - 1]"
          @update:model-value="writeMatrixState(x - 1, y - 1, $event)"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { MicroBit } from "boot/MicroBit";
import { defineComponent } from "vue";

export default defineComponent({
  name: "MicroBitLed",
  props: {
    device: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      matrix: [
        [false, false, false, false, false],
        [false, false, false, false, false],
        [false, false, false, false, false],
        [false, false, false, false, false],
        [false, false, false, false, false],
      ],
    };
  },
  computed: {
    deviceId() {
      return this.device?.id;
    },
    deviceLedData() {
      return this.device?.led.data;
    },
  },
  watch: {
    deviceLedData(value) {
      this.matrix = value;
    },
  },
  methods: {
    getMicroBit() {
      return MicroBit.get(this.deviceId);
    },
    async writeMatrixState(x, y, value) {
      try {
        this.matrix[x][y] = value;
        await this.getMicroBit()?.writeMatrixState(this.matrix);
      } catch (error) {
        console.log(error);
      }
    },
    async readMatrixState() {
      try {
        await this.getMicroBit()?.readMatrixState();
      } catch (error) {
        console.log(error);
      }
    },
  },
  async mounted() {
    await this.readMatrixState();
  },
});
</script>
