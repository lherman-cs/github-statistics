<template>
  <div id="app">
    <div class="chart">
      <CumulativeFlow :issues="issues" v-show="issues" />
    </div>
  </div>
</template>

<script>
import firebase from "firebase/app";
import { GithubAPI } from "./api";
import CumulativeFlow from "./charts/CumulativeFlow.vue";

export default {
  components: {
    CumulativeFlow
  },
  data() {
    return {
      token: "",
      // interval determines the range between samples in days
      interval: 7,
      repos: [],
      originalIssues: null
    };
  },
  async mounted() {
    const query = this.$route.query;

    // TODO: Validate parameters and show error message

    this.repos = query.repos.split(",");
    // this.interval = parseInt(query.interval);

    /*
    this.token = "POOP";
    this.originalIssues = await this.api.issues([
      "awslabs/amazon-kinesis-video-streams-webrtc-sdk-c"
    ]);
    */

    const result = await firebase.auth().getRedirectResult();
    if (result.credential) {
      this.token = result.credential.accessToken;
      console.log({ token: this.token });
      this.originalIssues = await this.api.issues([
        "awslabs/amazon-kinesis-video-streams-webrtc-sdk-c"
      ]);
    } else {
      await this.login();
    }
  },
  computed: {
    api() {
      return new GithubAPI(this.token);
    },
    issues() {
      if (!this.originalIssues) {
        return null;
      }

      const group = state =>
        this.originalIssues.groupFlat(this.interval, state);
      return {
        all: group("all"),
        open: group("open"),
        closed: group("closed")
      };
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

.chart {
  width: 1920px;
  height: 640px;
}
</style>
