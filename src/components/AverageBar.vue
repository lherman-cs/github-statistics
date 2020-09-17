<script>
import { Bar, mixins } from "vue-chartjs";
const { reactiveData } = mixins;
import moment from "moment";

function getRandomColor() {
  const letters = "0123456789ABCDEF".split("");
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export default {
  extends: Bar,
  mixins: [reactiveData],
  props: ["issues"],
  data() {
    return {
      chartData: "",
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          yAxes: [
            {
              scaleLabel: {
                display: true,
                labelString: "Percentage %"
              }
            }
          ]
        }
      }
    };
  },
  mounted() {
    this.renderChart(this.chartData, this.options);
  },
  computed: {
    averagesPerRepo() {
      if (!this.issues) {
        return;
      }

      const averagesPerRepo = {};
      const now = moment();

      for (const group of this.issues) {
        for (const issue of group.datapoints) {
          if (!(issue.repo in averagesPerRepo)) {
            averagesPerRepo[issue.repo] = {
              buckets: [0, 0, 0, 0],
              count: 0
            };
          }

          let closedAt = now;
          if (issue.closed) {
            closedAt = issue.closedAt;
          }

          const stat = averagesPerRepo[issue.repo];
          const i = Math.min(
            closedAt.diff(issue.createdAt, "weeks"),
            stat.buckets.length - 1
          );
          stat.buckets[i]++;
          stat.count++;
        }
      }

      for (const repo in averagesPerRepo) {
        const stat = averagesPerRepo[repo];
        for (let i = 0; i < stat.buckets.length; i++) {
          stat.buckets[i] /= stat.count * 0.01;
        }
      }

      console.log(averagesPerRepo);
      return averagesPerRepo;
    }
  },
  watch: {
    averagesPerRepo: function(averagesPerRepo) {
      if (!averagesPerRepo) {
        return;
      }

      const datasets = [];
      for (const repo in averagesPerRepo) {
        datasets.push({
          backgroundColor: getRandomColor(),
          label: repo,
          data: averagesPerRepo[repo].buckets
        });
      }

      this.chartData = {
        datasets,
        labels: ["< 1 week", "1 - 2 weeks", "2 - 3 weeks", "> 3 weeks"]
      };
    }
  }
};
</script>
