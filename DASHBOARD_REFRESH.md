# Dashboard Auto-Refresh Functionality

## Overview

The dashboard now automatically refreshes its data (cards and charts) whenever client amounts or charges are updated in the system. This ensures that the dashboard always displays the most current financial information.

## How It Works

### 1. Dashboard Context
- A new `DashboardContext` has been created to manage global dashboard refresh events
- The context provides a `triggerDashboardRefresh()` function that can be called from any component
- The dashboard listens for changes in the `refreshTrigger` state and automatically refreshes when it changes

### 2. Automatic Refresh Triggers
The dashboard will automatically refresh when:

#### Client Updates
- Adding a new client
- Editing client information (name, balance, payment status, residence)
- Deleting a client
- Bulk importing clients
- Changing client payment status
- Creating/updating invoices for clients

#### Charge Updates
- Adding a new charge
- Editing charge information (date, description, amount, residence)
- Deleting a charge

#### Residence Updates
- Adding a new residence
- Editing residence information
- Deleting a residence
- Bulk importing residences

### 3. Visual Feedback
- When the dashboard refreshes due to external updates, a success message "Actualisation automatique des données..." is displayed
- The message automatically disappears after 2 seconds
- The manual refresh button still works as before

## Implementation Details

### Files Modified
1. **`frontend/src/context/DashboardContext.tsx`** - New context for managing dashboard refresh
2. **`frontend/src/App.tsx`** - Added DashboardProvider wrapper
3. **`frontend/src/pages/Dashboard.tsx`** - Added refresh trigger listener
4. **`frontend/src/pages/Clients.tsx`** - Added refresh triggers for client operations
5. **`frontend/src/pages/Charges.tsx`** - Added refresh triggers for charge operations
6. **`frontend/src/pages/Residences.tsx`** - Added refresh triggers for residence operations

### Usage Example
```typescript
import { useDashboard } from '../context/DashboardContext';

const MyComponent = () => {
  const { triggerDashboardRefresh } = useDashboard();
  
  const handleDataUpdate = async () => {
    // Update data
    await updateData();
    
    // Trigger dashboard refresh
    triggerDashboardRefresh();
  };
};
```

## Benefits

1. **Real-time Updates**: Dashboard data is always current without manual refresh
2. **Better User Experience**: Users don't need to remember to refresh the dashboard
3. **Consistent Data**: Ensures all users see the same up-to-date information
4. **Automatic**: No additional user action required

## Technical Notes

- The refresh is triggered after successful API operations
- Failed operations do not trigger a refresh
- The dashboard refresh is debounced to prevent excessive API calls
- The system maintains backward compatibility with manual refresh functionality 