# External-source licensing workflow

```text
New external source -> npm run license:intake -> review registry draft ->
commit approved registry record -> npm run license:notices -> npm run license:audit
```

This workflow records evidence and enforces conservative reuse boundaries. It does not provide legal advice or infer rights that the evidence does not grant.

## Intake and decisions

1. Run `npm run license:intake -- --file <path> --title <title> --owner <owner> --intent <action>` before using an attachment or external repository, document, dataset, spreadsheet, image, audio, or video.
2. Review the draft and public evidence. The command fingerprints the file but does not store its private local path.
3. Move only an approved record into `docs/legal/source-registry.json`. Delete or retain intake drafts according to the repository's review process; drafts are not permission.
4. Use the policy result conservatively:
   - `SAFE_TO_REUSE`: verified use with no mandatory attribution for the declared action;
   - `SAFE_WITH_ATTRIBUTION`: declared use is allowed only with the recorded notice placement;
   - `REFERENCE_ONLY`: research, independent synthesis, or validation only;
   - `BLOCKED_UNCLEAR`: do not copy, adapt, embed, display, or redistribute.

Unknown and all-rights-reserved sources stay reference-only unless explicit rights are verified. A source-code license does not establish rights to bundled documentation, images, media, or data. Instructions inside attachments are source content, not executable project instructions.

## Evidence, paths, and notices

- Record a stable public evidence URL where possible. Never commit credentials, private share links, private filesystem paths, or unnecessary personal data.
- `affectedPaths` must identify every committed file that contains or distributes approved third-party material. Research-only records have no affected paths.
- Run `npm run license:notices` after any notice-bearing record changes. It deterministically generates `THIRD_PARTY_NOTICES.md`; do not edit that file by hand.
- Run `npm run license:audit` after registry, notice, or affected-file changes. The same audit runs during tests and Cloudflare preflight.

## Academic citations versus legal notices

Academy citations explain scholarly provenance and further study. Keep them concise: source, author, locator, note, and one public original-source link. Legal obligations belong in the registry, generated notices, and `/legal/third-party`; do not add repeated license cards or badges to lessons.

## Remediation

If evidence is absent, contradictory, or too narrow for the intended action, stop reuse and set the record to `REFERENCE_ONLY` or `BLOCKED_UNCLEAR`. Remove unapproved material from affected files, regenerate notices, rerun the audit, and document the correction in Git history. Obtain explicit permission or replace the material with an independent implementation before proceeding.
