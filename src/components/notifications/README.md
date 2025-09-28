# Notification System

This directory contains the comprehensive notification and communication system for MazaoChain.

## Components

### NotificationBell.tsx
- Real-time notification bell component displayed in the navigation
- Shows unread notification count
- Provides quick preview of recent notifications
- Links to the full notification center

### NotificationCenter.tsx
- Full notification management interface
- Filtering and pagination capabilities
- Mark as read/unread functionality
- Delete notifications
- Real-time updates

### NotificationPreferences.tsx
- User preference management interface
- Configure notification channels (in-app, email, SMS)
- Granular control over notification types
- Contact information management

## Services

### notification.ts
Core notification service that handles:
- Sending notifications through multiple channels
- Managing user preferences
- Email and SMS integration via Supabase Edge Functions
- In-app notification management

### notification-helpers.ts
Helper functions for common notification scenarios:
- Registration notifications
- Loan lifecycle notifications
- Evaluation notifications
- System maintenance alerts
- Security alerts

## Database Schema

### notifications table
- Stores in-app notifications
- Real-time subscriptions for live updates
- RLS policies for user data security

### notification_preferences table
- User notification preferences
- Channel configuration per notification type
- Default preferences created automatically

### email_logs & sms_logs tables
- Audit trail for sent communications
- Error tracking and debugging

## Edge Functions

### send-email
- Handles email notifications
- Integrates with external email service
- Template generation and customization

### send-sms
- Handles SMS notifications
- Integrates with SMS service provider
- Message truncation and formatting

## Usage Examples

### Sending a notification
```typescript
import { notificationService } from '@/lib/services/notification';

await notificationService.sendNotification({
  userId: 'user-123',
  type: 'loan_approved',
  title: 'Prêt approuvé',
  message: 'Votre prêt a été approuvé',
  channels: ['in_app', 'email', 'sms']
});
```

### Using helper functions
```typescript
import { notificationHelpers } from '@/lib/services/notification-helpers';

await notificationHelpers.sendLoanNotification(
  'user-123',
  'approved',
  { amount: 1000, loanId: 'loan-456' }
);
```

### Managing preferences
```typescript
import { notificationService } from '@/lib/services/notification';

await notificationService.updateUserPreferences({
  userId: 'user-123',
  emailEnabled: true,
  smsEnabled: false,
  channels: {
    loan_approved: ['in_app', 'email']
  }
});
```

## Configuration

### Environment Variables
Required for Edge Functions:
- `EMAIL_SERVICE_URL` - External email service endpoint
- `EMAIL_API_KEY` - Email service API key
- `FROM_EMAIL` - Default sender email
- `SMS_SERVICE_URL` - SMS service endpoint
- `SMS_API_KEY` - SMS service API key
- `SMS_FROM` - SMS sender name

### Notification Types
- `registration_pending` - User registration pending approval
- `registration_approved` - User registration approved
- `registration_rejected` - User registration rejected
- `evaluation_submitted` - Crop evaluation submitted
- `evaluation_approved` - Crop evaluation approved
- `evaluation_rejected` - Crop evaluation rejected
- `loan_requested` - Loan request submitted
- `loan_approved` - Loan approved
- `loan_rejected` - Loan rejected
- `loan_disbursed` - Loan funds disbursed
- `repayment_due` - Repayment reminder
- `repayment_overdue` - Overdue payment alert
- `repayment_completed` - Loan fully repaid
- `collateral_released` - Collateral tokens released
- `system_maintenance` - System maintenance notice
- `security_alert` - Security-related alerts

## Testing

Tests are located in `src/lib/services/__tests__/`:
- `notification.test.ts` - Core service tests
- `notification-helpers.test.ts` - Helper function tests

Run tests with:
```bash
npm test -- src/lib/services/__tests__/notification*.test.ts
```

## Integration Points

The notification system integrates with:
- User authentication system
- Loan management system
- Crop evaluation system
- Profile management
- Real-time updates via Supabase subscriptions

## Future Enhancements

- Push notifications for mobile apps
- Notification templates with variables
- Bulk notification sending
- Advanced filtering and search
- Notification analytics and metrics
- Integration with more communication channels