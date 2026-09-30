# Five-minute setup on GitLab

You end up with two GitLab projects and a live site that republishes itself whenever a prompt is merged.

## 0. What you need

- A GitLab group you can create projects in (gitlab.com or self-managed, 16.x or newer for job-token allowlists).
- GitLab Pages enabled on the instance (it is on gitlab.com).
- This repository's contents, and Node.js 20+ locally if you want to test before pushing (optional).

## 1. Create the content project

1. New project → *Create blank project* → name it, for example `prompt-library-content`. Leave it empty (no README).
2. On your machine, push the starter:

   ```sh
   cp -r content-starter ~/prompt-library-content && cd ~/prompt-library-content
   git init -b main && git add -A && git commit -m "Initial prompt library content"
   git remote add origin https://gitlab.example.com/<group>/prompt-library-content.git
   git push -u origin main
   ```

3. Settings → CI/CD → Variables → add `APP_PROJECT` = `<group>/prompt-library` (the app project you create next).

## 2. Create the app (site) project

1. New project → *Create blank project* → `prompt-library`.
2. Edit `site.config.yml` in this repository: set `content.host` (your GitLab URL) and `content.project` (`<group>/prompt-library-content`). Optionally set `header.text` for a marking banner and fill `ai.endpoints` (see [AI-GATEWAY.md](AI-GATEWAY.md)), or leave them for later.
3. Push:

   ```sh
   git remote add gitlab https://gitlab.example.com/<group>/prompt-library.git
   git push -u gitlab main
   ```

   (Keep `origin` pointing at GitHub if you develop there; `.github/workflows/ci.yml` runs the same checks.)

## 3. Allow the job token both ways

The app pipeline clones the content repo, and the content pipeline clones the app repo and triggers it. Both use the built-in `CI_JOB_TOKEN`, which needs a one-time allowlist entry on each side:

- On **prompt-library-content**: Settings → CI/CD → *Job token permissions* → *Add project* → `<group>/prompt-library`.
- On **prompt-library**: Settings → CI/CD → *Job token permissions* → *Add project* → `<group>/prompt-library-content`.

Alternative without job tokens: create a *Deploy token* (read_repository) on the content project and store it on the app project as masked variables `CONTENT_DEPLOY_TOKEN` and `CONTENT_DEPLOY_TOKEN_USER`. For the trigger direction, create a *Pipeline trigger token* on the app project, store it on the content project as `APP_TRIGGER_TOKEN`, and switch to the commented `publish_site_by_token` job in `content-starter/.gitlab-ci.yml`.

## 4. Optional variables on the app project

| Variable | When |
|---|---|
| `HEADER_TEXT`, `HEADER_BACKGROUND`, `HEADER_FOREGROUND` | A marking banner without editing the config file. |
| `SITE_URL`, `SITE_BASE_PATH` | Only if the site is served somewhere other than the default Pages URL (they are derived from `CI_PAGES_URL`). |
| `AI_TEAM_HEADER` (or whatever `${VAR}` names you used) | Values substituted into `site.config.yml` at build time, kept out of the repo. Mark them masked. |
| `CONTENT_BRANCH` | If content should be published from a branch other than `main`. |

## 5. Run it

Push to `main` on the app project (or CI/CD → Pipelines → *Run pipeline*). After the `pages` job finishes, the URL is under Deploy → Pages, typically `https://<group>.gitlab.io/prompt-library/`. The pipeline sets the base path from that URL automatically.

Now merge any change in the content project. Its pipeline validates, then triggers the app pipeline; the site updates within a few minutes with no manual step.

## Checks

- Content MR pipeline red? The `validate` job prints the file and field. Fix and push.
- `fetch-content` fails with 401/403? The job-token allowlist (step 3) is missing on the *content* project, or the deploy token is wrong.
- Trigger job fails with 404? `APP_PROJECT` is misspelt, or the allowlist on the *app* project is missing.
- Site loads but assets 404? `SITE_BASE_PATH` does not match the Pages path. Remove the variable to derive it from `CI_PAGES_URL`.
- Send to AI shows a certificate/CORS message? See [AI-GATEWAY.md](AI-GATEWAY.md).

## Local development against the real content

```sh
CONTENT_GIT_URL=https://gitlab.example.com/<group>/prompt-library-content.git npm run fetch-content
CONTENT_PATH=.content-cache/content npm run dev
```
