# Row Level Security (RLS) Policies Documentation

## Overview

This document describes the comprehensive Row Level Security (RLS) implementation for the MazaoChain application. RLS ensures that users can only access data they are authorized to see, providing strong data isolation and security.

## Implementation Status

✅ **Task 17 Completed**: All RLS policies have been audited, corrected, and properly implemented.

## Key Principles

1. **Default Deny**: RLS is enabled on all tables, meaning no access is granted unless explicitly allowed by a policy
2. **Role-Based Access**: Policies are based on user roles (agriculteur, cooperative, preteur, admin)
3. **Data Isolation**: Users can only access their own data unless their role grants broader access
4. **Cooperative Oversight**: Cooperatives can view data from farmers in their region
5. **Lender Investment Tracking**: Lenders can only see loans they have funded

## Tables with RLS Enabled

All tables in the database have RLS enabled:

### Core Tables
- ✅ `profiles` - User profiles with role information
- ✅ `farmer_profiles` - Farmer-specific profile data
- ✅ `cooperative_profiles` - Cooperative-specific profile data
- ✅ `lender_profiles` - Lender-specific profile data

### Business Logic Tables
- ✅ `crop_evaluations` - Crop evaluation submissions
- ✅ `loans` - Loan requests and tracking
- ✅ `transactions` - Blockchain transaction records
- ✅ `tokenization_records` - Token minting records
- ✅ `repayment_schedule` - Loan repayment schedules

### Communication Tables
- ✅ `notifications` - User notifications
- ✅ `notification_preferences` - User notification settings
- ✅ `email_logs` - Email delivery logs (admin only)
- ✅ `sms_logs` - SMS delivery logs (admin only)

### Monitoring Tables
- ✅ `error_logs` - Application error logs
- ✅ `performance_metrics` - System performance metrics (admin only)
- ✅ `blockchain_transactions` - Blockchain transaction monitoring (admin only)
- ✅ `user_activity_logs` - User activity tracking (admin only)
- ✅ `system_alerts` - System alerts and warnings (admin only)

## Policy Details by Table

### 1. Profiles Table

**Purpose**: Base user profiles with authentication and role information

**Policies**:
- `profiles_select_own`: Users can view their own profile
- `profiles_update_own`: Users can update their own profile
- `profiles_insert_own`: Users can create their own profile
- `cooperatives_view_farmers`: Cooperatives can view farmer profiles
- `admins_view_all_profiles`: Admins can view all profiles
- `admins_manage_all_profiles`: Admins can manage all profiles

**Access Matrix**:
| Role | Own Profile | Other Profiles | Farmer Profiles | All Profiles |
|------|-------------|----------------|-----------------|--------------|
| Agriculteur | ✅ Read/Write | ❌ | ❌ | ❌ |
| Cooperative | ✅ Read/Write | ❌ | ✅ Read | ❌ |
| Preteur | ✅ Read/Write | ❌ | ❌ | ❌ |
| Admin | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write |

### 2. Farmer Profiles Table

**Purpose**: Extended profile information for farmers

**Policies**:
- `farmers_manage_own`: Farmers can manage their own profile
- `cooperatives_view_farmers`: Cooperatives can view all farmer profiles
- `cooperatives_validate_farmers`: Cooperatives can validate farmers in their region
- `admins_manage_farmer_profiles`: Admins can manage all farmer profiles

**Access Matrix**:
| Role | Own Profile | Other Farmer Profiles | Validate Farmers |
|------|-------------|----------------------|------------------|
| Agriculteur | ✅ Read/Write | ❌ | ❌ |
| Cooperative | ❌ | ✅ Read | ✅ Update (validation) |
| Preteur | ❌ | ❌ | ❌ |
| Admin | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write |

### 3. Crop Evaluations Table

**Purpose**: Crop evaluation submissions and approvals

**Policies**:
- `farmers_manage_own_evaluations`: Farmers can manage their own evaluations
- `cooperatives_view_evaluations`: Cooperatives can view all evaluations
- `cooperatives_update_evaluation_status`: Cooperatives can approve/reject evaluations
- `admins_manage_evaluations`: Admins can manage all evaluations

**Access Matrix**:
| Role | Own Evaluations | All Evaluations | Approve/Reject |
|------|-----------------|-----------------|----------------|
| Agriculteur | ✅ Read/Write | ❌ | ❌ |
| Cooperative | ❌ | ✅ Read | ✅ Update (status) |
| Preteur | ❌ | ❌ | ❌ |
| Admin | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write |

### 4. Loans Table

**Purpose**: Loan requests, approvals, and tracking

**Policies**:
- `borrowers_view_own_loans`: Borrowers can view their loans
- `borrowers_create_loans`: Borrowers can create loan requests
- `lenders_view_funded_loans`: Lenders can view loans they funded
- `lenders_update_funded_loans`: Lenders can update their funded loans
- `cooperatives_view_all_loans`: Cooperatives can view all loans
- `cooperatives_update_loan_status`: Cooperatives can approve/reject loans
- `admins_manage_loans`: Admins can manage all loans

**Access Matrix**:
| Role | Own Loans | Funded Loans | All Loans | Approve/Reject |
|------|-----------|--------------|-----------|----------------|
| Agriculteur (Borrower) | ✅ Read/Create | ❌ | ❌ | ❌ |
| Cooperative | ❌ | ❌ | ✅ Read | ✅ Update (status) |
| Preteur (Lender) | ❌ | ✅ Read/Update | ❌ | ❌ |
| Admin | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write |

### 5. Transactions Table

**Purpose**: Blockchain transaction records

**Policies**:
- `users_view_own_transactions`: Users can view their own transactions
- `users_create_own_transactions`: Users can create their own transactions
- `users_view_loan_transactions`: Users can view transactions related to their loans
- `cooperatives_view_all_transactions`: Cooperatives can view all transactions
- `admins_manage_transactions`: Admins can manage all transactions

**Access Matrix**:
| Role | Own Transactions | Loan Transactions | All Transactions |
|------|------------------|-------------------|------------------|
| Agriculteur | ✅ Read/Create | ✅ Read | ❌ |
| Cooperative | ❌ | ❌ | ✅ Read |
| Preteur | ✅ Read/Create | ✅ Read | ❌ |
| Admin | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write |

### 6. Notifications Table

**Purpose**: User notifications and alerts

**Policies**:
- `users_view_own_notifications`: Users can view their notifications
- `users_update_own_notifications`: Users can mark notifications as read
- `system_create_notifications`: System can create notifications for any user
- `admins_manage_notifications`: Admins can manage all notifications

**Access Matrix**:
| Role | Own Notifications | All Notifications |
|------|-------------------|-------------------|
| All Users | ✅ Read/Update | ❌ |
| System | ✅ Create | ✅ Create |
| Admin | ✅ Read/Write | ✅ Read/Write |

### 7. Tokenization Records Table

**Purpose**: Tracking token minting process

**Policies**:
- `farmers_view_own_tokenization`: Farmers can view tokenization for their evaluations
- `cooperatives_view_tokenization`: Cooperatives can view all tokenization records
- `system_manage_tokenization`: System/Service role can manage tokenization records

**Access Matrix**:
| Role | Own Tokenization | All Tokenization | Manage |
|------|------------------|------------------|--------|
| Agriculteur | ✅ Read | ❌ | ❌ |
| Cooperative | ❌ | ✅ Read | ❌ |
| System/Service | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write |
| Admin | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write |

### 8. Repayment Schedule Table

**Purpose**: Loan repayment schedule tracking

**Policies**:
- `borrowers_view_own_schedule`: Borrowers can view their repayment schedules
- `lenders_view_funded_schedule`: Lenders can view schedules for their loans
- `cooperatives_view_all_schedules`: Cooperatives can view all schedules
- `system_manage_schedules`: System can manage repayment schedules

**Access Matrix**:
| Role | Own Schedule | Funded Schedules | All Schedules | Manage |
|------|--------------|------------------|---------------|--------|
| Agriculteur (Borrower) | ✅ Read | ❌ | ❌ | ❌ |
| Cooperative | ❌ | ❌ | ✅ Read | ❌ |
| Preteur (Lender) | ❌ | ✅ Read | ❌ | ❌ |
| System/Service | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write |
| Admin | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write | ✅ Read/Write |

### 9. Admin/Monitoring Tables

**Purpose**: System monitoring and administration

**Tables**: `email_logs`, `sms_logs`, `error_logs`, `performance_metrics`, `blockchain_transactions`, `user_activity_logs`, `system_alerts`

**Policies**: Access restricted to admin users and service role only

**Access Matrix**:
| Role | Access |
|------|--------|
| Agriculteur | ❌ |
| Cooperative | ❌ |
| Preteur | ❌ |
| Admin | ✅ Read/Write |
| Service Role | ✅ Read/Write |

**Exception**: Users can view their own error logs for debugging purposes.

## Helper Functions

### `public.get_user_role()`

Returns the role of the currently authenticated user from the profiles table.

```sql
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
BEGIN
  RETURN (
    SELECT role FROM public.profiles WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

This function is used throughout the RLS policies to check user roles efficiently. It's created in the `public` schema to avoid permission issues with the `auth` schema.

## Verification Views

### `rls_status` View

Shows which tables have RLS enabled:

```sql
SELECT * FROM rls_status;
```

### `rls_policies` View

Lists all RLS policies in the database:

```sql
SELECT * FROM rls_policies WHERE tablename = 'loans';
```

## Testing

Comprehensive tests have been created in `src/__tests__/database/rls-policies.test.ts` to verify:

1. ✅ Users can only view their own data
2. ✅ Farmers cannot access other farmers' data
3. ✅ Cooperatives can view farmer data
4. ✅ Lenders can only see loans they funded
5. ✅ Cooperatives can approve/reject evaluations and loans
6. ✅ RLS is enabled on all tables
7. ✅ Policies exist for all tables

## Migration Files

- **Initial Schema**: `20250918164649_create_initial_schema.sql`
- **Previous RLS Attempts**: `20250927000004_fix_rls_policies.sql`, `20250928161840_disable_rls_temporarily.sql`, `20250928163256_force_clean_rls.sql`
- **Current Implementation**: `20251008000002_enable_comprehensive_rls.sql` ✅

## Security Considerations

1. **Service Role**: The service role bypasses RLS and should only be used in server-side code
2. **Admin Role**: Admin users have full access to all data for monitoring and support
3. **Cooperative Scope**: Cooperatives can see all farmers, not just those in their region (this may need refinement based on business requirements)
4. **Lender Privacy**: Lenders can only see loans they have funded, maintaining investment privacy
5. **Transaction Privacy**: Users can only see their own transactions and transactions related to their loans

## Future Enhancements

1. **Regional Filtering**: Limit cooperative access to farmers in their specific region
2. **Time-Based Policies**: Implement policies that change based on loan status or time periods
3. **Audit Logging**: Add automatic logging of policy violations for security monitoring
4. **Performance Optimization**: Add indexes on frequently queried columns used in RLS policies

## Troubleshooting

### Common Issues

1. **"permission denied for table"**: RLS is enabled but no policy allows the operation
   - Solution: Check that the user's role has the appropriate policy

2. **"infinite recursion detected"**: Policy references itself or creates a circular dependency
   - Solution: Use the `auth.user_role()` helper function instead of querying profiles directly in policies

3. **Service role needed**: Some operations require bypassing RLS
   - Solution: Use the service role key in server-side API routes

### Debugging RLS Issues

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- View all policies for a table
SELECT * FROM pg_policies WHERE tablename = 'loans';

-- Test a policy as a specific user
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-id-here';
SELECT * FROM loans;
```

## Compliance

This RLS implementation helps meet the following requirements:

- ✅ **Requirement 10.3**: Row Level Security policies ensure proper data isolation
- ✅ **Data Privacy**: Users can only access their own data
- ✅ **Role-Based Access Control**: Different roles have appropriate access levels
- ✅ **Audit Trail**: All access is controlled and can be monitored

## Conclusion

The RLS implementation provides comprehensive data security for the MazaoChain application. All tables are protected, and access is strictly controlled based on user roles and relationships. The policies have been tested and verified to work correctly.
