<template>
  <div id="app">
    <template v-if="!showQueryGenerator">
      <section v-if="progress < 100">
        <b-progress type="is-info" :value="progress" show-value format="percent"></b-progress>
      </section>
      <section id="container" v-else>
        <CumulativeFlow
          :cumulative-sums="slicedCumulativeSums && slicedCumulativeSums.all"
          @on-receive="updateIndex"
          id="cumulative-flow"
        />
        <CategoryPie
          :issues="slicedIssues && slicedIssues.all.all"
          :index="index"
          id="category-pie"
        />
        <Table :cumulative-sums="slicedCumulativeSums" :index="index" id="summary-table" />
      </section>
    </template>

    <QueryGenerator v-else />
  </div>
</template>

<script>
import firebase from "firebase/app";
import moment from "moment";
import { GithubAPI } from "./api";
import CumulativeFlow from "./components/CumulativeFlow.vue";
import Table from "./components/Table.vue";
import CategoryPie from "./components/CategoryPie.vue";
import QueryGenerator from "./components/QueryGenerator.vue";

export default {
  components: {
    CumulativeFlow,
    Table,
    CategoryPie,
    QueryGenerator
  },
  data() {
    return {
      // interval determines the range between samples in days
      interval: 7,
      issues: null,
      index: -1,
      start: null,
      end: null,
      progress: 0,
      unfetchedRepos: [],
      showQueryGenerator: false
    };
  },
  async mounted() {
    const query = this.$route.query;

    // TODO: Validate parameters and show error message

    const reposStr = query.repos;
    if (!reposStr) {
      this.showQueryGenerator = true;
      return;
    }

    const repos = reposStr.split(",");
    if (!repos || repos.length === 0) {
      this.showQueryGenerator = true;
      return;
    }

    this.start = query.start && moment(query.start);
    this.end = query.end && moment(query.end);
    this.interval = parseInt(query.interval);
    if (!this.interval) {
      this.interval = 7;
    }

    let token = null;

    /* TODO: reenable cache
    token = window.localStorage.getItem("token");
    if (!token) {
      const result = await firebase.auth().getRedirectResult();
      if (result.credential) {
        token = result.credential.accessToken;
        window.localStorage.setItem("token", token);
      }
    }
    */

    const result = await firebase.auth().getRedirectResult();
    if (result.credential) {
      token = result.credential.accessToken;
      window.localStorage.setItem("token", token);
    }

    if (token) {
      const api = new GithubAPI(token);
      this.issues = await api.issues(
        repos,
        this.end,
        this.interval,
        (progress, total) => (this.progress = (progress * 100) / total),
        false
      );
    } else {
      await this.login();
    }
  },
  computed: {
    slicedIssues() {
      return this.slice(this.issues, this.start, this.interval);
    },
    cumulativeSums() {
      if (!this.issues) {
        return null;
      }

      const cumulativeSum = sum => {
        let datapoints = [];
        return sample => {
          sum += sample.datapoints.length;
          datapoints.push(...sample.datapoints);
          return {
            x: sample.x,
            y: sum,
            datapoints
          };
        };
      };

      const cumulativeSumAll = groupedIssues => ({
        all: groupedIssues.all.map(cumulativeSum(0)),
        open: groupedIssues.open.map(cumulativeSum(0)),
        closed: groupedIssues.closed.map(cumulativeSum(0))
      });

      const cumulativeSums = {};
      for (const repo in this.issues) {
        const groupedIssues = this.issues[repo];
        cumulativeSums[repo] = cumulativeSumAll(groupedIssues);
      }
      return cumulativeSums;
    },
    slicedCumulativeSums() {
      return this.slice(this.cumulativeSums, this.start, this.interval);
    }
  },
  methods: {
    slice(data, start, interval) {
      if (!data) {
        return null;
      }

      if (!start) {
        start = moment.unix(0);
      }

      const slice = sums => {
        if (!sums || sums.length === 0) {
          return [];
        }

        const range = start.diff(sums[0].x, "days");
        let i = Math.max(0, Math.floor(range / interval) + 1);
        i = Math.min(sums.length - 1, i);
        return sums.slice(i);
      };

      const sliceAll = e => ({
        all: slice(e.all),
        closed: slice(e.closed),
        open: slice(e.open)
      });

      const sliced = {};
      for (const repo in data) {
        const e = data[repo];
        sliced[repo] = sliceAll(e);
      }
      return sliced;
    },
    updateIndex(index) {
      // since some charts use previous data, we can't use 0
      if (index === 0) {
        return;
      }
      this.index = index;
    },
    async login() {
      const provider = new firebase.auth.GithubAuthProvider();
      provider.addScope("public_repo");
      await firebase.auth().signInWithRedirect(provider);
    }
  }
};
</script>

<style>
html,
body {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
}

#app {
  width: 100%;
  height: 100%;
}

#container {
  display: grid;
  height: 100%;
  grid-template-areas:
    "category-pie summary-table"
    "cumulative-flow cumulative-flow";
  grid-template-rows: minmax(60%, 1fr) minmax(40%, 1fr);
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

#container > * {
  padding: 10px;
}

@media only screen and (max-width: 968px) {
  #container {
    grid-template-areas:
      "cumulative-flow"
      "category-pie"
      "summary-table";
    grid-template-rows: initial;
  }

  #container > * {
    padding: 5px;
  }
}

#cumulative-flow {
  grid-area: cumulative-flow;
}

#category-pie {
  grid-area: category-pie;
}

#summary-table {
  grid-area: summary-table;
}
</style>
