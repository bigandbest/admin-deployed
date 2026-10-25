# Growth implementation context — admin

Updated: 25 October 2026. This records the Growth changes built in this conversation, rather than all existing admin features. [bug.md](../bug.md) contains the original cross-platform findings and follow-up updates.

## Built locally

- Campaign API reads now fetch every page before computing dashboard totals and charts, removing the previous first-20-record truncation.
- Campaign management paginates the complete filtered result, displays the total and page count, and resets the page when filters change.
- Campaign lifecycle labels distinguish exhausted quota from live eligibility. End-time comparisons now match the backend's exclusive end boundary.
- Existing admin-recorded payout operations use the backend accounting protections added in this task: pending payout totals adjust for completed returns, stale amount updates are rejected, and approval reads current financial values under a row lock.
- Completed return requests cannot be reopened after their accounting effects have been applied.

The last two points are shared-backend changes surfaced through existing admin operations; no bank/UPI transfer provider or new payout interface was built.

## Main files

- `src/utils/adminCampaignApi.js`
- `src/Pages/Marketing/Campaigns/index.jsx`
- `src/Pages/Marketing/Dashboard/index.jsx`
- Shared backend: `controller/affiliateAdminController.js`, `controller/affiliateDashboardController.js`, `controller/returnOrderController.js`, `services/affiliateReturnService.js`

## Intended operating model

- Referral rewards are withdrawal-only, as explicitly selected by the user.
- Admins review requests and record payments made externally. Recording a completed payment does not initiate a bank/UPI transfer.
- Pending payouts can be reduced for returns before processing. Paid or externally processing payouts retain the no-clawback policy and produce an audit entry for the absorbed return.
- Customer program eligibility, caps, membership and reward calculations remain owned by the backend.

## Verification performed

- `npm run build`: passed under Node 24, with an existing large-bundle warning.
- Focused ESLint for the three changed admin campaign files: passed.
- Shared-backend Growth regressions: 68 passed with mocked transactions.
- Repository diff whitespace checks: passed.

## Database and release status

**No migration was run. The user explicitly prohibited running migrations.**

The backend attribution migration is prepared only. The updated backend requires its columns before deployment. No deployment was performed. Do not apply the migration without a subsequent user instruction authorizing it.

## Remaining verification

Actual admin/customer balance reconciliation, real database concurrency, externally recorded payout transitions, deployed cron execution and return processing still need staging checks. No historical attribution or accounting backfill was run.

## Related context

- [Original admin analysis](GROWTH_MODULE_ANALYSIS.md) — historical findings; this file records subsequent implementation.
- [Backend context](../backend-deployed/GROWTH_FIX_CONTEXT.md)
- [Website context](../frontend-deployed/GROWTH_FIX_CONTEXT.md)
- [App context](../bbm-app/GROWTH_FIX_CONTEXT.md)
