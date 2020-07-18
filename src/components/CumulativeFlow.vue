<script>
import { Line, mixins } from "vue-chartjs";
const { reactiveData } = mixins;

export default {
  extends: Line,
  mixins: [reactiveData],
  props: ["cumulativeSums", "start"],
  data() {
    return {
      chartData: "",
      options: {
        onClick: (point, event) => {
          const item = event[0];
          this.$emit("on-receive", item._index);
        },
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          xAxes: [
            {
              type: "time",
              distribution: "series",
              time: {
                unit: "day"
              }
            }
          ],
          yAxes: [
            {
              stacked: true
            }
          ]
        }
      }
    };
  },
  mounted() {
    this.renderChart(this.chartData, this.options);
  },
  watch: {
    cumulativeSums: function(cumulativeSums) {
      if (!cumulativeSums) {
        return;
      }

      const sliceByStart = (sums, start) => {
        if (!start) {
          return sums;
        }

        for (let i = 0; i < sums.length; i++) {
          if (sums[i].x >= start) {
            return sums.slice(i);
          }
        }

        return [];
      };

      const allSums = sliceByStart(cumulativeSums.all, this.start);
      const closedSums = sliceByStart(cumulativeSums.closed, this.start);

      const openDataset = {
        label: "Open",
        data: allSums.map((e, i) => ({
          ...e,
          y: e.y - closedSums[i].y
        }))
      };
      const closedDataset = {
        label: "Closed",
        data: closedSums
      };
      const datasets = [closedDataset, openDataset];
      this.chartData = { datasets };
    }
  }
};
</script>
