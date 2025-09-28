# Admin Monitoring Dashboard

This directory contains the admin monitoring and oversight components for the MazaoChain platform.

## Components

### AdminDashboard
Main dashboard component that provides tabbed interface for different monitoring views.

### SystemMetrics
Displays key platform metrics including:
- Total users and active farmers
- Loan statistics and TVL (Total Value Locked)
- System uptime and performance
- Platform health status

### TransactionMonitor
Monitors blockchain transactions with:
- Real-time transaction list with filtering
- Transaction analytics (success rate, volume)
- Hedera transaction tracking
- Error monitoring and alerts

### UserActivityMonitor
Tracks user behavior and engagement:
- Recent user activity logs
- User statistics by role
- Most common actions
- Activity filtering by time and role

### PerformanceMetrics
System performance monitoring:
- Response time tracking
- System resource usage (CPU, memory)
- Hedera transaction performance
- Performance alerts and thresholds

### AlertsPanel
Centralized alert management:
- Active alerts by severity and type
- Alert acknowledgment and resolution
- Alert statistics and trends
- Predefined alert categories (security, performance, system, business)

## Services

### SystemMetricsService
- Fetches platform-wide metrics from database
- Records performance data
- Calculates growth percentages and trends

### TransactionMonitoringService
- Monitors blockchain transactions
- Provides transaction analytics
- Records transaction status updates

### UserActivityService
- Logs user actions and behavior
- Provides user statistics and insights
- Tracks user engagement metrics

### PerformanceMetricsService
- Monitors system performance
- Tracks Hedera network performance
- Creates performance alerts
- Monitors response times per requirement 8.3 (< 5 seconds)

### AlertsService
- Manages system alerts
- Provides alert statistics
- Handles alert lifecycle (create, acknowledge, resolve)

## Database Tables

The admin monitoring system uses several database tables:

- `performance_metrics` - System performance data
- `blockchain_transactions` - Transaction monitoring
- `user_activity_logs` - User activity tracking
- `system_alerts` - Alert management

## Access Control

Admin dashboard access is restricted to users with the 'admin' role. The system uses:
- Role-based access control (RBAC)
- Row Level Security (RLS) policies
- Server-side authentication checks

## Requirements Addressed

This implementation addresses the following requirements:

- **8.3**: Hedera transaction monitoring (< 5 second completion time)
- **8.4**: System uptime monitoring (99% target)
- Platform oversight and system monitoring
- Transaction monitoring and analytics
- Performance metrics tracking and display
- User activity monitoring and reporting

## Usage

To access the admin dashboard:
1. User must have 'admin' role in the database
2. Navigate to `/admin` route
3. Dashboard provides tabbed interface for different monitoring views

## Future Enhancements

- Real-time dashboard updates via WebSocket
- Advanced analytics and reporting
- Custom alert rules and thresholds
- Integration with external monitoring tools
- Automated performance optimization suggestions