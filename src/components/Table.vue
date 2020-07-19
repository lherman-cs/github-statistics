<template>
  <table class="table">
    <thead>
      <tr>
        <th>Repo</th>
        <th>#Open Prev</th>
        <th>#Open End</th>
        <th>#Closed</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(row, index) in table" :key="index">
        <th v-for="(col, index) in row" :key="index">{{ col }}</th>
      </tr>
    </tbody>
  </table>
</template>

<script>
export default {
  props: ["cumulativeSums", "index"],
  computed: {
    table() {
      const rows = [];

      for (const repo in this.cumulativeSums) {
        if (repo === "all") {
          continue;
        }

        const cumulativeSums = this.cumulativeSums[repo];
        const closedSums = cumulativeSums.closed;
        const allSums = cumulativeSums.all;
        const index = this.index;

        const cols = [];
        cols.push(repo);
        if (!index || index <= 0) {
          cols.push("N/A");
          cols.push("N/A");
          cols.push("N/A");
        } else {
          cols.push(allSums[index - 1].y - closedSums[index - 1].y);
          cols.push(allSums[index].y - closedSums[index].y);
          cols.push(closedSums[index].y - closedSums[index - 1].y);
        }

        rows.push(cols);
      }

      return rows;
    }
  }
};
</script>
