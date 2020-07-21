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
                  <div v-for="(issue, i) in issuesPerLabel[label].issues" :key="i">
                    <a class="has-text-weight-bold" target="_blank" rel="noopener noreferrer" :href="issue.url">#{{issue.number}} {{issue.title}}</a>
                    <b-tag 
                      v-for="(label, i) in issue.labels" :key="i"
                      :style="{ 
                        backgroundColor: issuesPerLabel[label.name].color,
                        color: fontColor(issuesPerLabel[label.name].color)
                      }"
                      rounded
                      class="has-text-weight-bold"
                    >{{ label.name }}</b-tag>
                  </div>
                </section>
                <footer class="modal-card-foot">
                    <button class="button" type="button" @click="$parent.close()">Close</button>
                </footer>
            </div>
`,
  methods: {
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
          const key = label.name.toLowerCase();
          let value = issuesPerLabel[key];
          if (!value) {
            value = {
              issues: [],
              color: label.color
            };
          }

          value.issues.push(datapoint);
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
