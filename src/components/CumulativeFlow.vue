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
      this.$emit("on-receive", index);
    }
  }
};
</script>
