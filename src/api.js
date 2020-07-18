import moment from "moment";
import mockData from "./mock.json";


function group(issues, start, end, interval, state) {
  if (!state) {
    state = "all"
  }

  const range = end.diff(start, 'days');
  const numSlots = Math.ceil(range / interval);
  const slots = [];
  start = end.clone().subtract(interval * (numSlots - 1), "days");
  let current = start.clone();
  for (let i = 0; i < numSlots; i++) {
    slots.push({
      at: current.clone(),
      datapoints: [],
    });
    current.add(interval, 'days');
  }

  const closed = state === "closed";
  for (const issue of issues) {
    if (state !== "all" && issue.closed !== closed) {
      continue;
    }

    const at = closed ? issue.closedAt : issue.createdAt;
    const i = Math.floor(at.diff(start, "days") / interval) + 1;
    slots[i].datapoints.push(issue);
  }

  return slots;
}


export class GithubAPI {
  constructor(token, endpoint) {
    this._token = token;
    this._endpoint = endpoint ? endpoint : "https://api.github.com/graphql";
  }

  _fetch(query, opts) {
    opts = opts ? opts : {};
    return fetch(this._endpoint, {
      method: "POST",
      headers: {
        "Authorization": `bearer ${this._token}`,
      },
      body: JSON.stringify({query}),
      ...opts,
    });
  }

  async issues(repos, interval, mock) {
    const end = moment();
    let start = end.clone();
    const greedyFetch = async (repo) => {
      const rawIssues = await (mock ? this._mockIssues() : this._issues(repo));
      const issues = [];
      for (const rawIssue of rawIssues) {
        const issue = {
          number: rawIssue.number,
          url: rawIssue.url,
          closed: rawIssue.closed,
          title: rawIssue.title,
          createdAt: moment(rawIssue.createdAt),
          updatedAt: moment(rawIssue.updatedAt),
          closedAt: rawIssue.closedAt && moment(rawIssue.closedAt),
        };

        if (issue.createdAt < start) {
          start = issue.createdAt.clone();
        }

        issues.push(issue);
      }
      return issues;
    };

    const results = await Promise.all(repos.map(greedyFetch));
    const groupIssues = (issues) => {
      return {
        all: group(issues, start, end, interval, "all"),
        open: group(issues, start, end, interval, "open"),
        closed: group(issues, start, end, interval, "closed"),
      };
    }

    const issues = {};
    const flat = [];
    for (let i = 0; i < results.length; i++) {
      const repo = repos[i];
      const result = results[i];
      issues[repo] = groupIssues(result);
      flat.push(...result);
    }

    issues["all"] = groupIssues(flat);
    return issues;
  }

  async _mockIssues() {
    return mockData;
  }

  async _issues(repo) {
    const [owner, name] = repo.split("/");
    const issues = [];

    let endCursor = "";
    let hasNextPage = true;
    while (hasNextPage) {
      let query = `
query {
  repository(owner:"${owner}", name:"${name}") {
    issues(first:100, states:[CLOSED,OPEN]${endCursor}) {
      edges {
        node {
          title
          url
          closed
          createdAt
          closedAt
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
}`;


      const response = await this._fetch(query);
      const body = await response.json();

      const result = body.data.repository.issues;
      hasNextPage = result.pageInfo.hasNextPage;
      endCursor = `, after:"${result.pageInfo.endCursor}"`;
      issues.push(...result.edges.map(e => e.node));
    }

    return issues;
  }
}
