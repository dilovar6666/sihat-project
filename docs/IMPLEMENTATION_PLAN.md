# SIHAT implementation plan

This plan follows `SIHAT_PROJECT_SPECIFICATION.md` in order. A stage is complete only
when its stated checks pass and the progress record reflects the evidence.

1. **Foundation** — FastAPI, PostgreSQL configuration, Alembic, environment handling,
   health checks, tests, CI, and reproducible local setup.
2. **Identity and access** — exactly `user` and `admin`, email auth, Google OAuth,
   password recovery, sessions, age group, and security tests.
3. **Catalog and authoring** — ten category model, catalog filters, access rules,
   methodology passports, questionnaire authoring, and localization boundaries.
4. **Test engine and 30 checks** — reproducible definitions, special React engines,
   scoring, symptom triage rules, and honest evidence/status labels.
5. **Results and privacy** — explicit save consent, drafts, retention, history,
   compatible comparisons, deletion, and PDF exports.
6. **Gemini assistant** — server adapter, current-dialog context, voice-to-text input,
   typed action allowlist, confirmation gates, and fallback behavior.
7. **Admin and content** — protected administration, sources, FAQ, knowledge base,
   support, publication workflow, and aggregate-only analytics.
8. **Functional frontend** — minimal React integration, core browser journeys, and
   backend regression coverage.
9. **Premium SIHAT frontend** — approved SIHAT Signature assets, Stitch-informed
   visual system, responsive themes, localization, and accessibility QA.
10. **Hardening and Ubuntu readiness** — regression/security/performance checks, PWA,
    deployment, backups, HTTPS, operational documentation, and release review.

Critical dependencies: stages 2–7 depend on the foundation; stage 4 depends on
methodology evidence for each module; stages 5–6 depend on attempt/result contracts;
stage 8 depends on stable APIs; stage 9 depends on working stage 8; stage 10 depends
on all prior acceptance evidence and production credentials.

