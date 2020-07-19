<script>
import { PolarArea, mixins } from "vue-chartjs";
const { reactiveData } = mixins;

export default {
  extends: PolarArea,
  mixins: [reactiveData],
  props: ["cumulativeSums", "index"],
  data() {
    return {
      chartData: "",
      options: {}
    };
  },
  mounted() {
    this.renderChart(this.chartData, this.options);
  },
  watch: {
    cumulativeSums: function(cumulativeSums) {
      this.handleChange(cumulativeSums, this.index);
    },
    index: function(index) {
      this.handleChange(this.cumulativeSums, index);
    }
  },
  methods: {
    handleChange(cumulativeSums, index) {
      if (!cumulativeSums) {
        return;
      }

      if (!index || index < 0) {
        return;
      }

      const cumulativeSum = cumulativeSums.open[index];
      const datapoints = cumulativeSum.datapoints;
      const labels = {};
      for (const datapoint of datapoints) {
        if (datapoint.labels.length === 0) {
          labels["unlabeled"] = (labels["unlabeled"] || 0) + 1;
          continue;
        }

        for (const label of datapoint.labels) {
          labels[label] = (labels[label] || 0) + 1;
        }
      }

      const dynamicColors = function() {
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        return "rgb(" + r + "," + g + "," + b + ")";
      };

      const data = Object.keys(labels).map(label => labels[label]);
      this.chartData = {
        datasets: [
          {
            data,
            backgroundColor: Object.keys(labels).map(dynamicColors)
          }
        ],
        labels: Object.keys(labels)
      };
    }
  }
};
</script>
