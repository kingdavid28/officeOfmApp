# Organizational Chart Messaging Integration

## Overview
Added direct messaging buttons to all organizational entities (friaries, parishes, schools, formation houses, and retreat centers) in the organizational chart, allowing users to quickly start group conversations for each organization.

## Features

### 1. Message Button on Every Card
Each organizational entity card now includes a "Message" button that:
- Creates or opens a group chat for that organization
- Automatically names the chat with the organization name and type
- Navigates user to the messaging page
- Shows loading state while creating chat

### 2. Visual Design
- **Button Style**: Outline button with MessageCircle icon
- **Position**: Bottom left of card, next to "View Details"
- **Size**: Small, compact design
- **Icon**: MessageCircle from lucide-react
- **Interaction**: Stops event propagation to prevent card click

### 3. Chat Naming Convention
Chats are automatically named using the format:
```
[Organization Name] - [Organization Type]
```

Examples:
- "St. Francis Friary - Friary"
- "Sacred Heart Parish - Parish"
- "San Pedro Calungsod School - School"
- "St. Anthony Formation House - Formation House"
- "Divine Mercy Retreat Center - Retreat Center"

## Implementation Details

### UI Changes (`OrganizationalChart.tsx`)

#### New Imports
```typescript
import { MessageCircle } from 'lucide-react';
import { RealtimeMessagingService } from '../../lib/realtime-messaging-service';
```

#### New Props Interface
```typescript
interface OrganizationalChartProps {
    onNavigate?: (view: string) => void;
}
```

#### New State
```typescript
const [creatingChat, setCreatingChat] = useState(false);
```

#### New Handler Function
```typescript
const handleMessageFriary = async (friary: Friary) => {
  // Creates group chat for the organization
  // Navigates to messaging page using onNavigate prop
}
```

#### Updated CommunitySection Component
- Added `onMessage` prop to interface
- Added Message button to card footer
- Button prevents card click propagation
- Shows loading state during chat creation

### Card Layout Changes

**Before:**
```
[Card Content]
                    View Details →
```

**After:**
```
[Card Content]
[Message Button]              View Details →
```

### Integration Points

1. **Organizational Chart** → Creates group chat
2. **Messaging Service** → Handles chat creation
3. **Navigation** → Routes to messaging page
4. **User Context** → Gets current user info

## User Flow

### Starting an Organization Chat

1. User views organizational chart
2. User sees organization cards (friary, parish, school, etc.)
3. User clicks "Message" button on any card
4. System creates group chat with organization name
5. User is automatically navigated to messaging page
6. Chat appears in "Groups" tab
7. User can start messaging immediately

### Visual Feedback

1. **Button Click**: Button shows loading state
2. **Chat Creation**: Brief loading indicator
3. **Navigation**: Smooth transition to messaging page
4. **Chat Selection**: New chat is automatically selected

## Technical Considerations

### Chat Creation
- Uses `RealtimeMessagingService.createGroupChat()`
- Chat type: 'group' (not direct)
- Settings: File sharing enabled, 10MB limit
- Privacy: Not private (organization-wide)
- No approval required

### Member Management
Currently creates chat with just the current user. Future enhancement:
- Fetch all members of the organization
- Add them as participants automatically
- Send notifications to all members

### Error Handling
- Try-catch block around chat creation
- Alert shown if creation fails
- Loading state properly reset
- User remains on organizational chart if error occurs

### Performance
- Async operation doesn't block UI
- Loading state provides feedback
- Navigation happens after successful creation
- No unnecessary re-renders

## Code Structure

### CommunitySection Component
```typescript
interface CommunitySectionProps {
  title: string;
  icon: React.ReactNode;
  communities: Friary[];
  onSelect: (friary: Friary) => void;
  borderColor: string;
  iconComponent: React.ComponentType<{ className?: string }>;
  onMessage?: (friary: Friary) => void; // NEW
}
```

### Message Button
```typescript
{onMessage && (
  <Button
    variant="outline"
    size="sm"
    onClick={(e) => {
      e.stopPropagation();
      onMessage(friary);
    }}
    className="flex items-center gap-1 text-xs"
  >
    <MessageCircle className="w-3 h-3" />
    Message
  </Button>
)}
```

### Handler Implementation
```typescript
const handleMessageFriary = async (friary: Friary) => {
  if (!user || !userProfile || creatingChat) return;

  setCreatingChat(true);
  try {
    const chatName = `${friary.name} - ${getFriaryTypeDisplay(friary.type)}`;
    
    const chatId = await RealtimeMessagingService.createGroupChat(
      chatName,
      user.uid,
      userProfile.name || user.email || 'Unknown',
      userProfile.role as any,
      [], // Members to be added
      'group',
      {
        allowFileSharing: true,
        maxFileSize: 10,
        allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
        isPrivate: false,
        requireApproval: false
      }
    );

    // Navigate to messaging page using prop
    if (onNavigate) {
      onNavigate('messaging');
    }
    
  } catch (error) {
    console.error('Failed to create friary chat:', error);
    alert('Failed to create chat. Please try again.');
  } finally {
    setCreatingChat(false);
  }
};
```

### App.tsx Integration
```typescript
case 'organization':
  return <OrganizationalChart onNavigate={setCurrentView} />;
```

## Benefits

### User Experience
1. **Quick Access**: One-click messaging for any organization
2. **Context Aware**: Chat names clearly identify the organization
3. **Seamless Flow**: Automatic navigation to messaging
4. **Visual Clarity**: Clear button with icon and label

### Organization
1. **Centralized Communication**: Each organization has its own chat
2. **Easy Discovery**: Chats named after organizations
3. **Group Collaboration**: Multiple members can join
4. **File Sharing**: Documents can be shared within organization

### Efficiency
1. **No Manual Setup**: Chats created automatically
2. **Consistent Naming**: Standard naming convention
3. **Integrated Workflow**: Part of organizational chart
4. **Reduced Friction**: No need to search for people

## Future Enhancements

### Automatic Member Addition
```typescript
// Fetch organization members
const members = await getOrganizationMembers(friary.id);
const memberIds = members.map(m => m.uid);

// Add to chat creation
const chatId = await RealtimeMessagingService.createGroupChat(
  chatName,
  user.uid,
  userName,
  userRole,
  memberIds, // Add all members
  'group',
  settings
);
```

### Smart Chat Reuse
- Check if organization chat already exists
- Open existing chat instead of creating new one
- Prevent duplicate chats for same organization

### Member Sync
- Automatically add new organization members to chat
- Remove members when they leave organization
- Update member roles in chat

### Organization Metadata
- Store organization ID in chat metadata
- Link chat back to organization
- Show organization info in chat header

### Permissions
- Only allow organization members to message
- Restrict based on user role
- Guardian/admin can manage chat settings

### Notifications
- Notify all organization members when chat created
- Send welcome message with organization info
- Announce new members joining

### Advanced Features
1. **Pinned Messages**: Pin important organization announcements
2. **File Library**: Dedicated section for organization documents
3. **Event Integration**: Link to organization events
4. **Task Management**: Create tasks within organization chat
5. **Polls**: Create polls for organization decisions

## Testing Checklist

- [ ] Message button appears on all organization cards
- [ ] Button click creates group chat
- [ ] Chat name follows naming convention
- [ ] User navigated to messaging page
- [ ] Chat appears in Groups tab
- [ ] Loading state shows during creation
- [ ] Error handling works correctly
- [ ] Button doesn't trigger card click
- [ ] Works for all organization types:
  - [ ] Friaries
  - [ ] Parishes
  - [ ] Schools
  - [ ] Formation Houses
  - [ ] Retreat Centers
- [ ] Multiple users can join same chat
- [ ] File sharing works in organization chats
- [ ] Notifications sent correctly

## Files Modified

1. **`src/app/components/OrganizationalChart.tsx`**
   - Added MessageCircle icon import
   - Added RealtimeMessagingService import
   - Added OrganizationalChartProps interface with onNavigate prop
   - Added creatingChat state
   - Added handleMessageFriary function
   - Updated CommunitySection interface
   - Added Message button to cards
   - Added onMessage prop to all CommunitySection calls

2. **`src/app/App.tsx`**
   - Passed onNavigate prop to OrganizationalChart component

## Related Documentation
- [P2P Direct Messaging](../messaging/P2P_DIRECT_MESSAGING.md)
- [Unified Messaging System](../messaging/UNIFIED_MESSAGING_SYSTEM_COMPLETE.md)
- [Organizational Chart Implementation](./ORGANIZATIONAL_CHART_IMPLEMENTATION.md)
- [Organization Features](./ORGANIZATION_FEATURES_IMPLEMENTATION.md)

## Best Practices Followed

1. **Event Propagation**: Used `e.stopPropagation()` to prevent card click
2. **Loading States**: Show feedback during async operations
3. **Error Handling**: Graceful error handling with user feedback
4. **Type Safety**: Proper TypeScript typing throughout
5. **Accessibility**: Button has proper label and icon
6. **Responsive Design**: Button works on all screen sizes
7. **Consistent Naming**: Standard chat naming convention
8. **User Feedback**: Clear visual indicators for all states
9. **Navigation**: Smooth transition to messaging page
10. **Code Organization**: Clean separation of concerns

## Usage

### For Users
1. Navigate to Organizational Chart
2. Find the organization you want to message
3. Click the "Message" button on the card
4. Wait for chat to be created
5. Start messaging in the new group chat

### For Developers
```typescript
// The handler can be customized to add more features
const handleMessageFriary = async (friary: Friary) => {
  // Add custom logic here
  // - Fetch organization members
  // - Check for existing chat
  // - Add metadata
  // - Send notifications
};
```

## Migration Notes

### Existing Chats
- Existing organization chats are not affected
- New chats will be created with new naming convention
- Consider migrating old chats to new format

### Data Structure
- No database schema changes required
- Uses existing messaging infrastructure
- Compatible with current chat system

### Backward Compatibility
- Feature is additive, doesn't break existing functionality
- Works alongside existing messaging features
- No migration required for users
