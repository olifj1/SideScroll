# Publishing folder

Upload a file here to publish it into the game:

- a **Publish Lab package** (`SS-PUBLISH-….json`: Publish Lab → Prepare package → Share),
- a **character export** (`SS-CHARACTER-….json` / `SS-CHARACTERS-ALL-….json`), or
- a **Project Backup** (`SS-PROJECT-SNAPSHOT-….json`, rebuilds all built-in content).

On github.com: open this folder → **Add file → Upload files** → choose the file →
**Commit changes** (to `main` or a new branch). In Safari on iPhone, use
*Request Desktop Website* if *Add file* isn't shown; the GitHub app can't upload files.

The **Publish uploaded package** Action (`.github/workflows/publish.yml`) then bakes it
with `tools/bake_project.py`, removes the uploaded file, and opens a pull request
(about a minute; see the repo's **Actions** tab if it doesn't appear). Merge the pull
request and GitHub Pages publishes it to every player.

One-off setting: **Settings → Actions → General → Workflow permissions** →
*Read and write permissions* and *Allow GitHub Actions to create and approve pull requests*.
