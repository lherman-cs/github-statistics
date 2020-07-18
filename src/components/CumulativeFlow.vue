<script>
import { Line, mixins } from "vue-chartjs";
const { reactiveData } = mixins;

export default {
  extends: Line,
  mixins: [reactiveData],
  props: ["cumulativeSums"],
  data: () => ({
    chartData: "",
    options: {
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
  }),
  mounted() {
    this.renderChart(this.chartData, this.options);
  },
  watch: {
    cumulativeSums: function(cumulativeSums) {
      if (!cumulativeSums) {
        return;
      }

      const openDataset = {
        label: "Open",
        data: cumulativeSums.all.map((e, i) => ({
          ...e,
          y: e.y - cumulativeSums.closed[i].y
        }))
      };
      const closedDataset = {
        label: "Closed",
        data: cumulativeSums.closed
      };
      const datasets = [closedDataset, openDataset];
      this.chartData = { datasets };
    }
  }
};
</script>
