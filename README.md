# Clearcheck

A simple employee background and registry check tracker. Run `npm start`, then open port 3000 in your browser. No package installation is required. Run `npm test` for calendar recurrence and status tests.

Add checks with an employee name, check type, due date, and optional recurrence in years or months. Mark a check complete to calculate its next due date from its completion date; one-time checks become Complete. Edit a completed check's due date to reopen it. Filter by name, status, type, or inclusive due-date range; sort by date or employee name. CSV export includes the current filtered results. Sample records are opt-in and can be removed together.

Records are stored only in this browser's localStorage. This prototype does not provide shared team storage, login, access controls, automatic reminders, or a full completion audit trail. It tracks dates and the most recent completion, not screening results or sensitive background reports. CSV exports are for recordkeeping, not reimport. Use a secured shared backend before relying on this for organization-wide compliance records.
