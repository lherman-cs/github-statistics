<template>
  <div id="app">
    <div v-if="progress < 100">
      <progress class="progress is-info is-small" :value="progress" max="100">{{ progress }}%</progress>
    </div>
    <div id="container" v-else>
      <CumulativeFlow
        :cumulative-sums="slicedCumulativeSums && slicedCumulativeSums.all"
        @on-receive="updateIndex"
      />
      <Table :cumulative-sums="slicedCumulativeSums" :index="index" />
      <CategoryPie
        :cumulative-sums="slicedCumulativeSums && slicedCumulativeSums.all"
        :index="index"
      />
    </div>
  </div>
</template>

<script>
import firebase from "firebase/app";
import moment from "moment";
import { GithubAPI } from "./api";
import CumulativeFlow from "./components/CumulativeFlow.vue";
import Table from "./components/Table.vue";
import CategoryPie from "./components/CategoryPie.vue";

export default {
  components: {
    CumulativeFlow,
    Table,
    CategoryPie
  },
  data() {
    return {
      // interval determines the range between samples in days
      interval: 7,
      issues: null,
      index: -1,
      start: null,
      progress: 0,
      unfetchedRepos: []
    };
  },
  async mounted() {
    /*
    const api = new GithubAPI("");
    this.issues = await api.issues(
      ["awslabs/amazon-kinesis-video-streams-webrtc-sdk-c"],
      this.interval,
      true
    );
    this.index = this.issues.all.all.length - 1;
    */

    const query = this.$route.query;

    // TODO: Validate parameters and show error message

    const repos = query.repos.split(",");
    this.start = query.start && moment(query.start);
    this.interval = parseInt(query.interval);
    if (!this.interval) {
      this.interval = 7;
    }

    let token = null;

    token = window.localStorage.getItem("token");
    if (!token) {
      const result = await firebase.auth().getRedirectResult();
      if (result.credential) {
        token = result.credential.accessToken;
        window.localStorage.setItem("token", token);
      }
    }

    if (token) {
      const api = new GithubAPI(token);
      this.issues = await api.issues(
        repos,
        this.interval,
        (progress, total) => (this.progress = (progress * 100) / total)
      );
    } else {
      await this.login();
    }
  },
  computed: {
    cumulativeSums() {
      if (!this.issues) {
        return null;
      }

      const cumulativeSum = sum => {
        return sample => {
          sum += sample.datapoints.length;
          return {
            x: sample.at,
            y: sum,
            datapoints: sample.datapoints
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
      if (!this.cumulativeSums) {
        return null;
      }

      const sliceByStart = (sums, start) => {
        if (!start) {
          return sums;
        }

        for (let i = 0; i < sums.length; i++) {
          if (sums[i].x >= start) {
            return sums.slice(i);
          }
        }

        return [];
      };

      const sliceAll = cumulativeSums => ({
        all: sliceByStart(cumulativeSums.all, this.start),
        closed: sliceByStart(cumulativeSums.closed, this.start),
        open: sliceByStart(cumulativeSums.open, this.start)
      });

      const slicedCumulativeSums = {};
      for (const repo in this.cumulativeSums) {
        const cumulativeSums = this.cumulativeSums[repo];
        slicedCumulativeSums[repo] = sliceAll(cumulativeSums);
      }
      return slicedCumulativeSums;
    }
  },
  methods: {
    updateIndex(index) {
      // since some charts use previous data, we can't use 0
      if (index === 0) {
        return;
      }
      this.index = index;
    },
    async login() {
      const provider = new firebase.auth.GithubAuthProvider();
      provider.addScope("user");
      provider.addScope("public_repo");
      provider.addScope("repo");
      provider.addScope("repo_deployment");
      provider.addScope("repo:status");
      provider.addScope("read:repo_hook");
      provider.addScope("read:org");
      provider.addScope("read:public_key");
      provider.addScope("read:gpg_key");

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
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
}

#container > * {
  max-height: 800px;
  min-height: 400px;
}
</style>
