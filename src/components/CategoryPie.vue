<script>
import { PolarArea, mixins } from "vue-chartjs";
const { reactiveData } = mixins;

const IssueList = {
  props: ["issuesPerLabel", "label"],
  template: `
            <div class="modal-card" style="width: auto">
                <header class="modal-card-head">
                    <p class="modal-card-title">Issues</p>
                </header>
                <section class="modal-card-body">
                  <div v-for="(issues, repo) in categorizeIssues(issuesPerLabel[label].issues)" :key="repo">
                    <h2 class="is-size-6-desktop is-size-7-touch has-text-weight-bold	">{{ repo }}</h2>
                    <p class="is-size-6-desktop is-size-7-touch" v-for="(issue, i) in issues" :key="i">
                      <a target="_blank" rel="noopener noreferrer" :href="issue.url">#{{issue.number}} {{issue.title}}</a>
                      <b-tag 
                        v-for="(label, i) in issue.labels" :key="i"
                        :style="{ 
                          backgroundColor: issuesPerLabel[label].color,
                          color: fontColor(issuesPerLabel[label].color)
                        }"
                        rounded
                      >{{label}}</b-tag>
                    </p>
                  </div>
                </section>
                <footer class="modal-card-foot">
                    <button class="button" type="button" @click="$parent.close()">Close</button>
                </footer>
            </div>
`,
  methods: {
    categorizeIssues(issues) {
      const repos = {};
      for (const issue of issues) {
        let arr = repos[issue.repo];
        if (!arr) {
          arr = {};
        }

        arr[issue.number] = issue;
        repos[issue.repo] = arr;
      }

      for (const repo in repos) {
        const arr = repos[repo];
        repos[repo] = Object.keys(arr).map(k => arr[k]);
        repos[repo].sort((a, b) => a.number > b.number);
      }

      return repos;
    },
    fontColor(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      const color = result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
          }
        : null;

      if (!color) {
        throw new Error("Failed to parse color hex");
      }

      const { r, g, b } = color;
      // Reference: https://graphicdesign.stackexchange.com/questions/17359/how-to-calculate-the-best-type-colour-for-a-random-background-colour
      const gamma = 2.2;
      const L =
        0.2126 * Math.pow(r / 255, gamma) +
        0.7152 * Math.pow(g / 255, gamma) +
        0.0722 * Math.pow(b / 255, gamma);

      return L > 0.5 ? "#000000" : "#ffffff";
    }
  }
};

export default {
  extends: PolarArea,
  mixins: [reactiveData],
  props: ["issues", "index"],
  data() {
    return {
      chartData: "",
      options: {
        legend: {
          onHover: event => {
            event.target.style.cursor = "pointer";
          }
        },
        onHover: (event, chartElement) => {
          event.target.style.cursor = chartElement[0] ? "pointer" : "default";
        },
        maintainAspectRatio: false,
        onClick: (point, event) => {
          const item = event[0];
          if (!item) {
            return;
          }
          const index = item._index;
          const label = this.chartData.labels[index];
          this.$buefy.modal.open({
            parent: this,
            component: IssueList,
            hasModalCard: true,
            props: {
              issuesPerLabel: this.issuesPerLabel,
              label
            },
            trapFocus: true
          });
        }
      }
    };
  },
  mounted() {
    this.renderChart(this.chartData, this.options);
  },
  computed: {
    issuesPerLabel() {
      if (!this.issues) {
        return;
      }

      if (!this.index || this.index < 0) {
        return;
      }

      const datapoints = this.issues[this.index].datapoints;
      const issuesPerLabel = {};
      for (const datapoint of datapoints) {
        const labels =
          datapoint.labels.length === 0
            ? [{ name: "unlabeled", color: "000000" }]
            : datapoint.labels;

        for (const label of labels) {
          const hash = label => label.name.toLowerCase();
          const key = hash(label);
          let value = issuesPerLabel[key];
          if (!value) {
            value = {
              issues: [],
              color: label.color
            };
          }

          value.issues.push({
            ...datapoint,
            labels: datapoint.labels.map(hash)
          });
          value.color = "#" + label.color;
          issuesPerLabel[key] = value;
        }
      }

      return issuesPerLabel;
    }
  },
  watch: {
    issuesPerLabel: function(issuesPerLabel) {
      if (!issuesPerLabel) {
        return;
      }

      const labels = Object.keys(issuesPerLabel);
      const colors = labels.map(l => issuesPerLabel[l].color);
      const data = labels.map(label => issuesPerLabel[label].issues.length);
      this.chartData = {
        datasets: [
          {
            data,
            backgroundColor: colors
          }
        ],
        labels
      };
    }
  }
};
</script>
