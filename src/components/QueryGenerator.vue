<template>
  <section id="container">
    <h1 class="is-size-1-desktop is-size-3-touch has-text-centered">Github Statistics</h1>
    <b-field label="Query Range">
      <b-datepicker placeholder="Click to select..." v-model="dates" range icon="calendar-today"></b-datepicker>
    </b-field>

    <b-field label="Interval in Days">
      <b-numberinput v-model="interval" min="1"></b-numberinput>
    </b-field>

    <b-field label="Repositories">
      <b-taginput v-model="repos" type="is-info" placeholder="e.g. lherman-cs/github-statistics"></b-taginput>
    </b-field>

    <b-button type="is-primary" id="query-btn" class="has-text-weight-bold" @click="onQuery">Query</b-button>
  </section>
</template>

<script>
export default {
  data() {
    let start = new Date();
    start.setMonth(start.getMonth() - 3);
    let end = new Date();
    let interval = 7;
    let repos = [];

    const lastChoiceStr = window.localStorage.getItem("lastChoice");
    if (lastChoiceStr) {
      try {
        const lastChoice = JSON.parse(lastChoiceStr);
        if (lastChoice.start) {
          start = new Date(lastChoice.start);
        }

        if (lastChoice.end) {
          end = new Date(lastChoice.end);
        }

        if (lastChoice.interval) {
          interval = lastChoice.interval;
        }

        if (lastChoice.repos) {
          repos = lastChoice.repos;
        }
      } catch (e) {
        /* explicit ignore, use default values instead */
      }
    }

    return {
      dates: [start, end],
      interval,
      repos
    };
  },
  methods: {
    onQuery() {
      const start = this.dates[0].toISOString();
      const end = this.dates[1].toISOString();
      const repos = this.repos.join(",");
      const url = `?repos=${repos}&start=${start}&end=${end}&interval=${this.interval}`;

      const lastChoice = {
        start: this.dates[0],
        end: this.dates[1],
        interval: this.interval,
        repos: this.repos
      };
      window.localStorage.setItem("lastChoice", JSON.stringify(lastChoice));
      document.location.href = url;
    }
  }
};
</script>

<style scoped>
#container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  height: auto;
  display: flex;
  max-width: 600px;
  flex-direction: column;
}

#query-btn {
  align-self: center;
}
</style>
