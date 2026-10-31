#!/usr/bin/env python3
"""Report the complete, explicitly selected CI result for an open PR."""

from __future__ import annotations

import base64
import json
import os
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import urlencode

CONTEXT = "Loomlight validation"
PLAN_PATH = ".github/validation-plan.json"
REPORT_PREFIX = "Validation status ("
QUALITY = {
    "name": "Repository quality",
    "workflow": "quality.yml",
    "event": "pull_request",
    "jobs": ["Frontend tests and Rust formatting", "Validate repository"],
}


def load_plan(document, branch, base):
    if not isinstance(document, dict) or set(document) != {"version", "branch", "base", "qualifications"}:
        raise ValueError("Validation plan must contain version, branch, base and qualifications")
    if type(document["version"]) is not int or document["version"] != 1 or document["branch"] != branch or document["base"] != base:
        raise ValueError("Validation plan must select version 1 and the current PR head and base branches")
    qualifications = document["qualifications"]
    if not isinstance(qualifications, list):
        raise ValueError("qualifications must be an explicit list, including [] for quality only")
    requirements = [QUALITY]
    identities = {(QUALITY["workflow"], QUALITY["event"])}
    for item in qualifications:
        if not isinstance(item, dict) or set(item) != {"name", "workflow", "event", "jobs"}:
            raise ValueError("Each qualification needs name, workflow, event and jobs")
        if not isinstance(item["name"], str) or not item["name"].strip():
            raise ValueError("Each qualification needs a name")
        if not isinstance(item["workflow"], str) or not re.fullmatch(r"[a-z0-9-]+\.yml", item["workflow"]):
            raise ValueError("Select a workflow filename, not a path or URL")
        if item["event"] != "workflow_dispatch":
            raise ValueError("Qualification must select a manual workflow_dispatch run")
        jobs = item["jobs"]
        if not isinstance(jobs, list) or not jobs or any(
            not isinstance(job, str) or not job.strip() or job.startswith(REPORT_PREFIX)
            for job in jobs
        ) or len(set(jobs)) != len(jobs):
            raise ValueError("Select distinct, nonempty required job names")
        identity = (item["workflow"], item["event"])
        if identity in identities:
            raise ValueError("Select each workflow/event once; combine its required job names")
        identities.add(identity)
        requirements.append(item)
    return requirements


def evaluate_run(requirement, sha, runs, jobs_for, *, pr_number=None, finishing_run_id=None):
    matching = [run for run in runs if (
        run["head_sha"] == sha
        and run["event"] == requirement["event"]
        and run["path"].split("@", 1)[0] == ".github/workflows/" + requirement["workflow"]
        and (requirement["event"] != "pull_request" or pr_number is None
             or any(pr["number"] == pr_number for pr in run.get("pull_requests", [])))
    )]
    if not matching:
        return "pending", "not started", None
    run = max(matching, key=lambda item: (item["id"], item["run_attempt"]))
    url = run["html_url"] + "/attempts/" + str(run["run_attempt"])
    jobs = jobs_for(run)
    if any(job["conclusion"] in {"failure", "cancelled", "timed_out", "action_required", "startup_failure"}
           for job in jobs):
        return "failure", "a job failed or was cancelled", url
    if run["status"] == "completed" and run["conclusion"] != "success":
        return "failure", "run ended with " + str(run["conclusion"]), url
    finishing = run["id"] == finishing_run_id
    pending = []
    for name in requirement["jobs"]:
        found = [job for job in jobs if job["name"] == name]
        if len(found) > 1:
            return "error", "duplicate required job: " + name, url
        if not found:
            if run["status"] == "completed" or finishing:
                return "failure", "required job missing: " + name, url
            pending.append(name)
        elif found[0]["status"] != "completed":
            pending.append(name)
        elif found[0]["conclusion"] != "success":
            return "failure", "required job did not pass: " + name, url
    # A finish reporter is part of the run it reports. It can pass once all test
    # jobs have finished, without waiting for its own run to become terminal.
    if pending or any(job["status"] != "completed" and not job["name"].startswith(REPORT_PREFIX)
                      for job in jobs):
        return "pending", "queued or running", url
    if run["status"] != "completed" and not finishing:
        return "pending", "waiting for terminal run result", url
    return "success", "required jobs passed", url


def combined_state(results):
    states = {result[0] for result in results}
    for state in ("error", "failure", "pending"):
        if state in states:
            return state
    return "success" if states else "error"


class GitHub:
    def __init__(self, repository):
        self.root = "repos/" + repository + "/"

    def request(self, path, body=None):
        args = ["gh", "api", self.root + path]
        if body is not None:
            args += ["--method", "POST", "--input", "-"]
        result = subprocess.run(args, input=json.dumps(body) if body is not None else None,
                                text=True, capture_output=True, check=True)
        return json.loads(result.stdout)

    def pages(self, path, key=None):
        result = []
        for page in range(1, 11):
            separator = "&" if "?" in path else "?"
            data = self.request(path + separator + urlencode({"per_page": 100, "page": page}))
            items = data[key] if key else data
            result.extend(items)
            if len(items) < 100:
                return result
        raise ValueError("More than 1,000 records; refusing an incomplete CI result")

    def open_prs(self, branch):
        owner = self.root.split("/", 2)[1]
        return self.pages("pulls?" + urlencode({"state": "open", "head": owner + ":" + branch}))

    def contents(self, path, sha):
        data = self.request("contents/" + path + "?ref=" + sha)
        return base64.b64decode(data["content"]).decode("utf-8")


def report(api, pr, run_url):
    number = pr["number"]
    pr = api.request("pulls/" + str(number))
    sha = pr["head"]["sha"]
    if pr["state"] != "open":
        return None
    try:
        if len(api.open_prs(pr["head"]["ref"])) != 1:
            raise ValueError("Use one open PR per head branch; commit statuses are shared across PRs")
        requirements = load_plan(json.loads(api.contents(PLAN_PATH, sha)), pr["head"]["ref"], pr["base"]["ref"])
        results = []
        for requirement in requirements:
            if requirement is not QUALITY:
                source = api.contents(".github/workflows/" + requirement["workflow"], sha)
                if "uses: ./.github/workflows/validation-status.yml" not in source:
                    raise ValueError(requirement["workflow"] + " has no validation reporting hook")
            query = urlencode({"head_sha": sha, "event": requirement["event"]})
            runs = api.pages("actions/workflows/" + requirement["workflow"] + "/runs?" + query,
                             "workflow_runs")
            def jobs_for(run):
                return api.pages(f"actions/runs/{run['id']}/attempts/{run['run_attempt']}/jobs", "jobs")
            finishing_run_id = int(os.environ["GITHUB_RUN_ID"]) if os.environ.get("VALIDATION_PHASE") == "finish" else None
            results.append(evaluate_run(requirement, sha, runs, jobs_for,
                                        pr_number=number, finishing_run_id=finishing_run_id))
        state = combined_state(results)
        details = [f"- {item['name']}: {result[1]}" + (f". [Run]({result[2]})" if result[2] else "")
                   for item, result in zip(requirements, results)]
        unresolved = [item["name"] for item, result in zip(requirements, results) if result[0] != "success"]
        description = "All selected CI passed" if not unresolved else state + ": " + ", ".join(unresolved)
    except (ValueError, KeyError, TypeError, subprocess.CalledProcessError) as error:
        state = "error"
        description = "Validation plan or CI evidence unavailable"
        details = ["- " + (str(error) if not isinstance(error, subprocess.CalledProcessError)
                            else "GitHub API request failed; inspect plan, permissions and run evidence")]
    # An old run may finish after a new push. Always evaluate fresh data, and do
    # not publish that snapshot if the PR moved while it was being read.
    current = api.request("pulls/" + str(number))
    if (current["state"] != "open" or current["head"]["sha"] != sha
            or current["base"]["ref"] != pr["base"]["ref"]):
        print("PR changed during evaluation; its new workflow will report the new candidate")
        return None
    summary = f"## {CONTEXT}: {state}\n\nPR #{number}, candidate `{sha}`.\n\n" + "\n".join(details) + "\n"
    print(summary)
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as output:
            output.write(summary)
    # Publish last, after every local output operation has succeeded.
    api.request("statuses/" + sha, {
        "context": CONTEXT, "state": state, "description": description[:140], "target_url": run_url,
    })
    return state


def main():
    api = GitHub(os.environ["GITHUB_REPOSITORY"])
    event = json.loads(Path(os.environ["GITHUB_EVENT_PATH"]).read_text())
    if "pull_request" in event:
        prs = [event["pull_request"]]
    else:
        branch = os.environ["GITHUB_REF_NAME"]
        prs = api.open_prs(branch)
    url = f"https://github.com/{os.environ['GITHUB_REPOSITORY']}/actions/runs/{os.environ['GITHUB_RUN_ID']}"
    if not prs:
        print("No open PR for this branch; no PR validation status to update")
    for pr in prs:
        report(api, pr, url)


if __name__ == "__main__":
    try:
        main()
    except (ValueError, KeyError, subprocess.CalledProcessError) as error:
        print("Validation reporting failed: " + type(error).__name__, file=sys.stderr)
        sys.exit(1)
