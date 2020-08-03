import Vue from "vue";
import App from "./App.vue";
import VueRouter from "vue-router";
import firebase from "firebase/app";
import "firebase/auth";
import {library, dom} from "@fortawesome/fontawesome-svg-core";
import {faGithub} from "@fortawesome/free-brands-svg-icons";
import Buefy from "buefy";
import "buefy/dist/buefy.css";

library.add(faGithub);
dom.watch();

const firebaseConfig = {
  apiKey: "AIzaSyC_50J89QJO5t4CEFnTeoCwGIPWfxjPHL4",
  authDomain: "github-statistics-81bfb.firebaseapp.com",
  databaseURL: "https://github-statistics-81bfb.firebaseio.com",
  projectId: "github-statistics-81bfb",
  storageBucket: "github-statistics-81bfb.appspot.com",
  messagingSenderId: "754597188837",
  appId: "1:754597188837:web:bde9b83bc21c0c89beb00c"
};

firebase.initializeApp(firebaseConfig);

Vue.config.productionTip = false;
Vue.use(VueRouter);
Vue.use(Buefy);

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
});

new Vue({
  router,
  render: h => h(App)
}).$mount("#app");
