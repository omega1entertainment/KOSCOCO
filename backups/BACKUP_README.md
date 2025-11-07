# KOSCOCO Database Backup

**Backup Date:** November 7, 2025 at 01:59 UTC
**Backup File:** `koscoco_backup_20251107_015910.sql`
**File Size:** 25KB (670 lines)
**Database:** PostgreSQL (Development Environment)

## Database Summary

This backup contains a complete snapshot of your KOSCOCO competition platform development database.

### Tables Backed Up

1. **users** - 7 user accounts
2. **categories** - 5 competition categories
   - Music & Dance
   - Comedy & Performing Arts
   - Fashion & Lifestyle
   - Education & Learning
   - Gospel Choirs

3. **phases** - 5 competition phases
   - TOP 100 (Active)
   - TOP 50 (Upcoming)
   - TOP 10 (Upcoming)
   - TOP 3 (Upcoming)
   - GRAND FINALE (Upcoming)

4. **registrations** - 3 participant registrations
5. **videos** - Currently empty
6. **votes** - Currently empty
7. **judge_scores** - Currently empty
8. **affiliates** - 2 affiliate accounts
9. **referrals** - Currently empty
10. **payout_requests** - Currently empty
11. **sessions** - User session data

### Key Data Points

- **Active Users:** 7
- **Affiliate Accounts:** 2
- **Total Registrations:** 3
- **Current Phase:** TOP 100 (Active)
- **Payment Status:** Mix of pending and completed registrations

## How to Restore This Backup

### Option 1: Using psql (Recommended)
```bash
# Make sure you have database credentials
psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE < backups/koscoco_backup_20251107_015910.sql
```

### Option 2: Using the Replit Database Tool
1. Open the Database pane in Replit
2. Navigate to your PostgreSQL database
3. Use the import functionality to load the SQL file

### Option 3: Using the execute_sql_tool in Agent
The backup SQL file can be executed in chunks using the development database tools.

## Important Notes

⚠️ **This is a development database backup** - It does NOT contain production data from https://koscoco.replit.app/

⚠️ **Restoration will overwrite existing data** - The backup includes `DROP TABLE IF EXISTS` statements

✅ **Safe to restore** - Includes schema recreation and all constraints

## Backup Contents

The backup includes:
- Complete table schemas with all constraints
- All foreign key relationships
- All indexes
- All current data as of the backup timestamp
- Proper CASCADE behaviors for deletions

## Next Steps

To sync with production data, you would need to:
1. Access the production database through Replit's Database pane
2. Export production data
3. Import it into the development environment
4. Or deploy this development version to production

---

**Backup Location:** `/home/runner/workspace/backups/`
**Created by:** Replit Agent
**Database Type:** PostgreSQL 16.9
