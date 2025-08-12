# Owner Name Migration

This document describes the migration to add the `owner_name` field to the user table.

## What Changed

1. **Database Schema**: Added `owner_name` TEXT column to the `user` table
2. **Type Definitions**: Updated `User` interface in `lib/types.ts` and `hooks/useAuth.tsx`
3. **Database Functions**: Updated all user-related database functions to handle the new field
4. **API Endpoints**: Updated admin user management endpoints
5. **UI Components**: Added owner name field to settings page
6. **Auth System**: Updated authentication functions to include owner_name

## Files Modified

- `lib/types.ts` - Added `owner_name?: string` to User interface
- `lib/database.ts` - Updated all user functions to handle owner_name
- `lib/auth.ts` - Updated auth functions to include owner_name
- `hooks/useAuth.tsx` - Added owner_name to User interface
- `app/settings/page.tsx` - Added owner name form field
- `app/api/admin/users/route.ts` - Updated to handle owner_name
- `app/api/debug/create-test-user/route.ts` - Updated to include owner_name
- `scripts/add-owner-name-column.js` - Migration script

## Running the Migration

To add the `owner_name` column to existing databases:

1. Make sure your environment variables are set:
   ```bash
   export TURSO_URL="your_turso_url"
   export TURSO_AUTH_TOKEN="your_auth_token"
   ```

2. Run the migration script:
   ```bash
   node scripts/add-owner-name-column.js
   ```

## New Features

- Users can now set their real name (owner_name) in addition to their username
- Admin panel can manage owner names
- Owner names are included in authentication tokens
- Settings page includes owner name field

## Backward Compatibility

- Existing users will have `owner_name` set to `NULL`
- All existing functionality continues to work
- New fields are optional and won't break existing code

## Testing

After running the migration:

1. Check that existing users can still log in
2. Verify that new users can be created with owner_name
3. Test the settings page owner name field
4. Verify admin user management works with owner_name

