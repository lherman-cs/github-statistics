<template>
  <b-table
    ref="table"
    :data="data"
    :columns="columns"
    paginated
    pagination-simple
    :per-page="perPage"
    pagination-size="is-small"
  ></b-table>
</template>

<script>
export default {
  props: ["cumulativeSums", "index"],
  created() {
    window.addEventListener("resize", this.onResize);
    this.onResize({ target: window });
  },
  destroyed() {
    window.removeEventListener("resize", this.onResize);
  },
  data() {
    return {
      perPage: 5,
      columns: [
        {
          field: "repo",
          label: "Repository"
        },
        {
          field: "openIssuesPrev",
          label: "Open Issues Prev"
        },
        {
          field: "openIssues",
          label: "Open Issues"
        },
        {
          field: "closedIssues",
          label: "Closed Issues"
        }
      ]
    };
  },
  computed: {
    data() {
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

        rows.push({
          repo: cols[0],
          openIssuesPrev: cols[1],
          openIssues: cols[2],
          closedIssues: cols[3]
        });
      }

      return rows;
    }
  },
  methods: {
    onResize(e) {
      const width = e.target.innerWidth;
      const height = e.target.innerHeight;
      if (width > 1216 && height > 800) {
        this.perPage = 10;
      } else {
        this.perPage = 5;
      }
    }
  }
};
</script>
