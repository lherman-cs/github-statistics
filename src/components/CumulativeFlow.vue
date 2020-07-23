<script>
import { Line, mixins } from "vue-chartjs";
const { reactiveData } = mixins;

export default {
  extends: Line,
  mixins: [reactiveData],
  props: ["cumulativeSums", "start"],
  data() {
    return {
      prevIndex: -1,
      chartData: "",
      options: {
        onHover: (event, chartElement) => {
          event.target.style.cursor = chartElement[0] ? "pointer" : "default";
        },
        onClick: (point, event) => {
          const item = event[0];
          this.handleOnClick(item._index);
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

      const sharedOpts = {
        pointBackgroundColor: cumulativeSums.all.map(() => "#f1f1f1"),
        hitRadius: 3
      };

      const openDataset = {
        label: "Open",
        data: cumulativeSums.all.map((e, i) => ({
          ...e,
          y: e.y - cumulativeSums.closed[i].y
        })),
        backgroundColor: "#4f9a94",
        ...sharedOpts
      };
      const closedDataset = {
        label: "Closed",
        data: cumulativeSums.closed,
        backgroundColor: "#80cbc4",
        ...sharedOpts
      };
      const datasets = [closedDataset, openDataset];
      this.chartData = { datasets };
      this.handleOnClick(cumulativeSums.all.length - 1);
    }
  },
  methods: {
    handleOnClick(index) {
      const datasets = this.chartData.datasets;
      datasets[0].pointBackgroundColor[index] = "#0275D8";
      datasets[1].pointBackgroundColor[index] = "#0275D8";
      if (this.prevIndex !== -1) {
        datasets[0].pointBackgroundColor[this.prevIndex] = "#f1f1f1";
        datasets[1].pointBackgroundColor[this.prevIndex] = "#f1f1f1";
      }
      this.prevIndex = index;
      this.$data._chart.update();
      this.$emit("on-receive", index);
    }
  }
};
</script>
