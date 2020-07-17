import moment from "moment";
import mockData from "./mock.json";

export class GithubIssues {
  constructor() {
    this._issues = {};
    this._end = moment();
    this._start = this._end.clone();
  }

  append(repo, issue) {
    issue = {
      number: issue.number,
      url: issue.url,
      state: issue.state,
      title: issue.title,
      createdAt: moment(issue.created_at),
      updatedAt: moment(issue.updated_at),
      closedAt: issue.closed_at && moment(issue.closed_at),
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

    for (const issue of issues) {
      if (state !== "all" && issue.state !== state) {
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
    this.token = token;
    this.endpoint = endpoint ? endpoint : "https://api.github.com";
  }

  _fetch(path, opts) {
    opts = opts ? opts : {};
    return fetch(path, {
      headers: {
        "User-Agent": "Our script", // github requires user-agent header
        "Authorization": `token ${this.token}`,
      },
      ...opts,
    });
  }

  async limit() {
    const resp = await this._fetch(`${this.endpoint}/rate_limit`);
    const body = await resp.json();
    const headers = resp.headers;
    return {body, headers};
  }

  async issues(repos) {
    const issues = new GithubIssues();
    const greedyFetch = async (repo) => {
      for await (const issue of this._issues(repo)) {
        issues.append(repo, issue);
      }
    };

    await Promise.all(repos.map(greedyFetch));
    return issues;
  }

  async* _mockIssues() {
    console.log({mockData});
    for (const issue of mockData) {
      yield issue;
    }
  }

  async* _issues(repo) {
    let url = `${this.endpoint}/repos/${repo}/issues?per_page=100&state=all&filter=all`;

    while (url) {
      const response = await this._fetch(url);
      const body = await response.json();

      let nextPage = null;

      const links = response.headers.get("Link");
      if (links) {
        for (const link of links.split(',')) {
          nextPage = link.match(/<(.*?)>; rel="next"/);
          if (nextPage) {
            nextPage = nextPage?.[1];
            break;
          }
        }
        console.log({nextPage});
      }

      url = nextPage;
      for (const issue of body) {
        if ("pull_request" in issue) {
          continue;
        }
        yield issue;
      }
    }
  }
}
