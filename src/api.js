import moment from "moment";
import mockData from "./mock.json";

export class GithubIssues {
  constructor() {
    this._issues = {};
    this._end = moment();
    this._start = this._end.clone();
  }

  extend(repo, issues) {
    for (const issue of issues) {
      this.append(repo, issue);
    }
  }

  append(repo, issue) {
    issue = {
      number: issue.number,
      url: issue.url,
      closed: issue.closed,
      title: issue.title,
      createdAt: moment(issue.createdAt),
      updatedAt: moment(issue.updatedAt),
      closedAt: issue.closedAt && moment(issue.closedAt),
    };

    if (!this._issues[repo]) {
      this._issues[repo] = [];
    }

    this._issues[repo].push(issue);
    if (issue.createdAt < this._start) {
      this._start = issue.createdAt;
    }
  }

  _group(issues, interval, state) {
    if (!state) {
      state = "all";
    }

    const range = this._end.diff(this._start, 'days');

    const numSlots = Math.ceil(range / interval);
    console.log({state, range, numSlots});
    const slots = [];
    let current = this._start.clone();
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

      const at = state === "closed" ? issue.closedAt : issue.createdAt;
      const i = Math.floor(at.diff(this._start, "days") / interval);
      slots[i].datapoints.push(issue);
    }

    console.log({state, issues, slots});
    return slots;
  }

  groupFlat(interval, state) {
    let flat = [];
    for (const repo in this._issues) {
      const issues = this._issues[repo];
      flat = flat.concat(issues);
      console.log({issues, flat});
    }
    return this._group(flat, interval, state);
  }

  groupRepo(repo, interval, state) {
    this._group(this._issues[repo], interval, state);
  }

  group(interval, state) {
    const results = {};
    for (const repo in this._issues) {
      results[repo] = this.groupRepo(repo, interval, state);
    }
    return results;
  }
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

  async issues(repos, mock) {
    const issues = new GithubIssues();
    const greedyFetch = async (repo) => {
      issues.extend(repo, await (mock ? this._mockIssues() : this._issues(repo)));
    };

    await Promise.all(repos.map(greedyFetch));
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
      console.log({result});
      hasNextPage = result.pageInfo.hasNextPage;
      endCursor = `, after:"${result.pageInfo.endCursor}"`;
      issues.push(...result.edges.map(e => e.node));
    }

    return issues;
  }
}
