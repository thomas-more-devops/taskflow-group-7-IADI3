# v2.0.0 Release Retrospective

## What shipped
Priority levels, task categories, due dates, and search/filter — four feature branches merged into a single, integrated `main`, plus a professional repository structure (CI, issue/PR templates, branch protection) and a tagged GitHub Release.

## Lessons learned

### 1. "Provided files per student" assumed isolated diffs — they weren't
Each student's starter files were a full standalone rewrite of `index.html`, `app.js`, and `main.css`, not a scoped patch. Merging student 2's branch into a `main` that already had student 1's feature produced full-file conflicts across every section, not just the lines the assignment said each student "owned." Lesson: when splitting a monolith file across a team, hand out real line-ranges or separate modules, not four complete copies of the same file.

### 2. CI going green isn't the same as CI actually checking anything
The provided `ci.yml` set `NODE_ENV=production` workflow-wide, which made `npm ci` silently skip `devDependencies`. ESLint then printed `eslint: not found`, which was swallowed by the step's `|| echo "Linting not configured, skipping"` fallback — so every run reported ✅ without ever linting a single file. A pipeline that always passes is worse than no pipeline, because it actively hides the fact nothing is being checked. Lesson: error-swallowing fallbacks (`|| echo ...`) are useful for optional tooling, but they need a companion check (or at least a log line asserting the tool was actually found) or failures get invisible.

### 3. Branch protection assumes more than one human
`required_approving_review_count: 1` is meaningless when a single account is simulating all four "students" — GitHub blocks self-approval by design, so every PR gets permanently stuck. We worked around it by temporarily dropping the requirement to 0 for this solo exercise and restoring it to 1 once the team structure is real. Lesson: branch protection rules should match who's actually reviewing, not just the policy on paper — a rule nobody can satisfy just gets bypassed or disabled, which teaches the opposite of its intent.

### 4. A deliberately strict lint config will fail on day one — decide fix vs. relax up front
The provided `.eslintrc.js` enforced 2-space indentation and a `module` global that didn't exist in a browser-env config. Running `eslint --fix` resolved nearly everything automatically; the two real errors (`no-undef` on `module`) needed a one-line config fix. Lesson: when adopting a strict shared lint config on top of existing code, budget time for an immediate `--fix` pass and a short list of manual exceptions — don't let it block the first PR that touches the file.

### 5. "Close PRs and overwrite with final_version" is a legitimate escape hatch
Once three feature branches each needed hand-merging against an already-merged `main`, reconciling every PR individually would have meant re-resolving the same conflicts repeatedly. Adopting the instructor-provided `final_version` as the new `main`, then closing the now-superseded PRs with an explanation, kept the repo honest about what's actually running in production instead of pretending the open PRs were still relevant.

## Carried into v2.1.0
- Category colors as CSS custom properties (deferred from PR #9 review, tracked in #14)
- Dark mode, collaboration, cloud sync, offline mode (original backlog items, still unscheduled)
