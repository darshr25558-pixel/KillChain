| Feature | Purpose | Priority |
|---|---|---|
| 1. npm package retrieval | Download a published version and verify its registry integrity | ✅ First feature started |
| 2. Safe archive extraction | Extract files safely without executing package code | Next |
| 3. Source repository retrieval | Identify the GitHub repository and corresponding release commit | High |
| 4. File manifest generation | Record file paths, sizes, and cryptographic hashes | High |
| 5. Source/package comparison | Identify added, removed, and modified files | High |
| 6. Build-artifact classification | Explain expected differences using reproducible builds, metadata, and build patterns | High |
| 7. Security analysis | Detect suspicious code and unexpected behavior | High |
| 8. Provenance verification | Verify available signatures, attestations, and source-to-build claims | High |
| 9. Evidence-based risk scoring | Score findings with transparent reasons and confidence | High |
| 10. AI explanations | Explain findings using actual evidence from the scanner | After deterministic analysis |
| 11. Release monitoring | Recheck selected packages when new versions appear | Later |
| 12. PyPI support | Add Python packages through a separate ecosystem adapter | Later |