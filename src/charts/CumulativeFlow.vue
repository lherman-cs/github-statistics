<script>
import { Line, mixins } from "vue-chartjs";
const { reactiveData } = mixins;

export default {
  extends: Line,
  mixins: [reactiveData],
  props: ["issues"],
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
    issues: function(issues) {
      if (!issues) {
        return;
      }

      const cumulativeSum = sum => {
        return sample => {
          sum += sample.datapoints.length;
          return {
            x: sample.at,
            y: sum
          };
        };
      };

      const closedSums = issues.closed.map(cumulativeSum(0));
      const openSums = issues.all.map(cumulativeSum(0)).map((s, i) => ({
        x: s.x,
        y: s.y - closedSums[i].y
      }));

      console.log({ all: issues.all, closed: issues.closed });
      const totalDataset = {
        label: "Open",
        data: openSums
      };
      const closedDataset = {
        label: "Closed",
        data: closedSums
      };
      const datasets = [closedDataset, totalDataset];

      this.chartData = { datasets };
      console.log(datasets);
    }
  }
};
</script>
