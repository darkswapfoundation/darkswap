# Fixing Git Commit History for Wrong GitHub Account

If you've been accidentally pushing commits from the wrong GitHub account, there are several ways to fix this issue. Here's a comprehensive guide on how to resolve this problem:

## Option 1: Fix the Last Commit

If you only need to fix the most recent commit:

```bash
git commit --amend --author="Correct Name <correct.email@example.com>"
git push --force-with-lease origin main
```

## Option 2: Fix Multiple Commits with Interactive Rebase

If you need to fix multiple commits, you can use interactive rebase:

1. Start an interactive rebase for the number of commits you want to fix:

```bash
git rebase -i HEAD~N  # Replace N with the number of commits to fix
```

2. In the editor that opens, change "pick" to "edit" for each commit you want to modify.

3. For each commit, run:

```bash
git commit --amend --author="Correct Name <correct.email@example.com>"
git rebase --continue
```

4. Force push the changes:

```bash
git push --force-with-lease origin main
```

## Option 3: Fix All Commits with Git Filter-Branch

If you need to fix all commits in the repository:

```bash
git filter-branch --env-filter '
if [ "$GIT_COMMITTER_EMAIL" = "wrong.email@example.com" ]
then
    export GIT_COMMITTER_NAME="Correct Name"
    export GIT_COMMITTER_EMAIL="correct.email@example.com"
fi
if [ "$GIT_AUTHOR_EMAIL" = "wrong.email@example.com" ]
then
    export GIT_AUTHOR_NAME="Correct Name"
    export GIT_AUTHOR_EMAIL="correct.email@example.com"
fi
' --tag-name-filter cat -- --branches --tags
```

Then force push:

```bash
git push --force-with-lease origin --all
git push --force-with-lease origin --tags
```

## Option 4: Use git-filter-repo (Recommended for Large Repositories)

For large repositories, `git-filter-repo` is more efficient than `git filter-branch`:

1. Install git-filter-repo:

```bash
pip install git-filter-repo
```

2. Run the command:

```bash
git filter-repo --email-callback 'return email if email != b"wrong.email@example.com" else b"correct.email@example.com"' --name-callback 'return name if name != b"Wrong Name" else b"Correct Name"'
```

3. Force push:

```bash
git push --force-with-lease origin --all
git push --force-with-lease origin --tags
```

## Preventing Future Issues

To prevent this issue in the future:

1. Configure Git correctly for this repository:

```bash
git config user.name "Correct Name"
git config user.email "correct.email@example.com"
```

2. For global configuration:

```bash
git config --global user.name "Correct Name"
git config --global user.email "correct.email@example.com"
```

3. Set up different Git configurations for different directories:

Create a `~/.gitconfig` with conditional includes:

```
[includeIf "gitdir:~/work/"]
    path = ~/.gitconfig-work
[includeIf "gitdir:~/personal/"]
    path = ~/.gitconfig-personal
```

Then create `~/.gitconfig-work`:

```
[user]
    name = Work Name
    email = work.email@company.com
```

And `~/.gitconfig-personal`:

```
[user]
    name = Personal Name
    email = personal.email@example.com
```

## Important Notes

1. **Force pushing rewrites history** and can cause problems for collaborators. Make sure to coordinate with your team before doing this.

2. If you're working on a **shared branch**, consider creating a new branch with the corrected history instead of force pushing.

3. Some repositories may have **branch protection** that prevents force pushing. You might need to temporarily disable these protections.

4. Always **back up your repository** before performing history-altering operations.

5. If you're using **GitHub Desktop**, you can set the author for each repository in File > Options > Git > Configure git.

By following these steps, you can ensure that your Git history correctly reflects the appropriate GitHub account for your commits.