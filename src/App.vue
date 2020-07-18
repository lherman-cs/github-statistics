<template>
  <div id="app">
    <div id="container">
      <CumulativeFlow :cumulative-sums="cumulativeSums && cumulativeSums.all" />
      <Table :cumulative-sums="cumulativeSums" :index="index" />
    </div>
  </div>
</template>

<script>
import firebase from "firebase/app";
import { GithubAPI } from "./api";
import CumulativeFlow from "./components/CumulativeFlow.vue";
import Table from "./components/Table.vue";

export default {
  components: {
    CumulativeFlow,
    Table
  },
  data() {
    return {
      // interval determines the range between samples in days
      interval: 7,
      issues: null,
      index: -1
    };
  },
  async mounted() {
    const query = this.$route.query;

    // TODO: Validate parameters and show error message

    const repos = query.repos.split(",");
    // this.interval = parseInt(query.interval);

    /*
    const api = new GithubAPI("");
    this.issues = await api.issues(
      ["awslabs/amazon-kinesis-video-streams-webrtc-sdk-c"],
      this.interval,
      true
    );
    this.index = this.issues.all.all.length - 1;
    */

    const result = await firebase.auth().getRedirectResult();
    if (result.credential) {
      const token = result.credential.accessToken;
      const api = new GithubAPI(token);
      this.issues = await api.issues(repos, this.interval);
      this.index = this.issues.all.all.length - 1;
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
    }
  },
  methods: {
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
