// Example: How to use role-based access control in your components
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useUser } from '@/lib/UserContext';
import { horsesApi } from '@/lib/api';

/**
 * Example component showing how to use the user role context
 * to conditionally render UI elements based on permissions
 */
export default function HorseActionsExample({ horseId }: { horseId: number }) {
  const { 
    user, 
    loading, 
    isViewer, 
    isEditor, 
    isAdmin, 
    canEdit, 
    canDelete 
  } = useUser();

  const handleEdit = async () => {
    // This will fail on backend if user doesn't have permission
    // But we hide the button anyway for better UX
    try {
      await horsesApi.update(horseId, { name: 'Updated Name' });
      alert('Horse updated successfully!');
    } catch (error) {
      alert('Error: ' + error);
    }
  };

  const handleDelete = async () => {
    try {
      await horsesApi.delete(horseId);
      alert('Horse deleted!');
    } catch (error) {
      alert('Error: ' + error);
    }
  };

  if (loading) {
    return <Text>Loading user permissions...</Text>;
  }

  return (
    <View style={styles.container}>
      {/* Show user info */}
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userRole}>Role: {user?.role}</Text>
      </View>

      {/* Method 1: Use canEdit/canDelete flags (recommended) */}
      <View style={styles.actions}>
        <Text style={styles.sectionTitle}>Available Actions:</Text>
        
        {/* All authenticated users can view */}
        <Button title="View Details" onPress={() => {}} />

        {/* Only editors and admins can edit */}
        {canEdit && (
          <Button title="Edit Horse" onPress={handleEdit} />
        )}

        {/* Only admins can delete */}
        {canDelete && (
          <Button title="Delete Horse" onPress={handleDelete} color="red" />
        )}
      </View>

      {/* Method 2: Check specific roles */}
      <View style={styles.roleInfo}>
        {isViewer && (
          <View style={styles.banner}>
            <Text>👁️ You have view-only access</Text>
          </View>
        )}

        {isEditor && (
          <View style={styles.banner}>
            <Text>✏️ You can view and edit</Text>
          </View>
        )}

        {isAdmin && (
          <View style={styles.banner}>
            <Text>⚙️ You have full administrator access</Text>
            <Button 
              title="Go to User Management" 
              onPress={() => {/* Navigate to user management */}} 
            />
          </View>
        )}
      </View>

      {/* Method 3: Show different message for each role */}
      <View style={styles.helpText}>
        <Text>
          {isViewer && "Contact an administrator to request edit access."}
          {isEditor && "You can create and modify horses but cannot delete them."}
          {isAdmin && "You have full access to all features."}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  userInfo: {
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userRole: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  actions: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  roleInfo: {
    marginTop: 8,
  },
  banner: {
    padding: 12,
    backgroundColor: '#e8f4f8',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  helpText: {
    padding: 12,
    backgroundColor: '#fff8e1',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
});

/**
 * Example: Protecting entire screens/tabs
 */
export function AdminOnlyScreen() {
  const { isAdmin, loading } = useUser();

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <Text>⚠️ Access Denied</Text>
        <Text>This page is only accessible to administrators.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Admin Dashboard</Text>
      {/* Admin-only content */}
    </View>
  );
}

/**
 * Example: Form inputs disabled for viewers
 */
export function EditHorseForm({ horseId }: { horseId: number }) {
  const { canEdit } = useUser();

  return (
    <View>
      <TextInput 
        placeholder="Horse Name"
        editable={canEdit} // Disable input for viewers
        style={!canEdit && { backgroundColor: '#f5f5f5' }}
      />
      
      {!canEdit && (
        <Text style={{ color: 'red', fontSize: 12 }}>
          You don't have permission to edit. Contact an administrator.
        </Text>
      )}
      
      <Button 
        title="Save Changes"
        onPress={() => {}}
        disabled={!canEdit} // Disable button for viewers
      />
    </View>
  );
}

/**
 * Example: Show loading state while checking permissions
 */
export function ProtectedAction({ children }: { children: React.ReactNode }) {
  const { loading, canEdit } = useUser();

  if (loading) {
    return <ActivityIndicator />;
  }

  if (!canEdit) {
    return null; // Don't render anything if user can't edit
  }

  return <>{children}</>;
}

// Usage:
// <ProtectedAction>
//   <Button title="Create New Horse" onPress={createHorse} />
// </ProtectedAction>
