# Known Limitations

- Legacy HTML files remain in the working tree for historical reference.
- Known sensitive legacy files may still exist locally but are ignored and untracked.
- Git history may still contain old secret-bearing files.
- No destructive cleanup or history rewrite was performed.
- No sanitized archive copies were created in this stage.
- The repository hygiene script is conservative and lightweight.
- Prisma `package.json#prisma` deprecation warning remains unresolved.
- Next.js TypeScript project-reference warning remains unresolved.
