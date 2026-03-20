import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../lib/theme';
import { LoadingScreen } from '../components';

// Screens
import LoginScreen from '../screens/LoginScreen';

// Admin
import AdminDashboard   from '../screens/admin/AdminDashboard';
import AdminTickets     from '../screens/admin/AdminTickets';
import AdminChecklists  from '../screens/admin/AdminChecklists';
import AdminUsers       from '../screens/admin/AdminUsers';

// Staff
import StaffDashboard   from '../screens/staff/StaffDashboard';
import StaffTickets     from '../screens/staff/StaffTickets';
import StaffChecklists  from '../screens/staff/StaffChecklists';
import ExecuteChecklist from '../screens/staff/ExecuteChecklist';

// Tenant
import TenantDashboard from '../screens/tenant/TenantDashboard';
import TenantTickets   from '../screens/tenant/TenantTickets';

// Security
import SecurityDashboard from '../screens/security/SecurityDashboard';
import SecurityTickets   from '../screens/security/SecurityTickets';

// HelpDesk
import HelpdeskDashboard from '../screens/helpdesk/HelpdeskDashboard';
import HelpdeskTickets   from '../screens/helpdesk/HelpdeskTickets';

// Shared
import TicketDetail   from '../screens/shared/TicketDetail';
import NewTicket      from '../screens/shared/NewTicket';
import Notifications  from '../screens/shared/Notifications';
import ProfileScreen  from '../screens/shared/ProfileScreen';
import MonitorDetail  from '../screens/admin/MonitorDetail';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: Colors.dark, elevation: 0, shadowOpacity: 0 },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '700', fontSize: 17 },
};

const tabBarOptions = {
  tabBarStyle: {
    backgroundColor: Colors.dark,
    borderTopColor: Colors.borderDark,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabBarActiveTintColor: Colors.primary,
  tabBarInactiveTintColor: '#64748b',
  tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
  headerStyle: { backgroundColor: Colors.dark, elevation: 0 },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '700' },
};

// ── Tab icon helper ───────────────────────────────────────────────────────────
const icon = (name) => ({ color, size }) => (
  <Ionicons name={name} color={color} size={size} />
);

// ── Admin Tabs ────────────────────────────────────────────────────────────────
function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={tabBarOptions}>
      <Tab.Screen name="Dashboard"  component={AdminDashboard}  options={{ tabBarIcon: icon('grid-outline'),            title: 'Dashboard' }} />
      <Tab.Screen name="Tickets"    component={AdminTickets}    options={{ tabBarIcon: icon('ticket-outline'),          title: 'Tickets' }} />
      <Tab.Screen name="Checklists" component={AdminChecklists} options={{ tabBarIcon: icon('checkbox-outline'),        title: 'Checklists' }} />
      <Tab.Screen name="Users"      component={AdminUsers}      options={{ tabBarIcon: icon('people-outline'),          title: 'Users' }} />
      <Tab.Screen name="Profile"    component={ProfileScreen}   options={{ tabBarIcon: icon('person-circle-outline'),   title: 'Profile' }} />
    </Tab.Navigator>
  );
}

// ── Staff Tabs ────────────────────────────────────────────────────────────────
function StaffTabs() {
  return (
    <Tab.Navigator screenOptions={tabBarOptions}>
      <Tab.Screen name="Dashboard"  component={StaffDashboard}  options={{ tabBarIcon: icon('grid-outline'),          title: 'Dashboard' }} />
      <Tab.Screen name="Tickets"    component={StaffTickets}    options={{ tabBarIcon: icon('ticket-outline'),        title: 'Tickets' }} />
      <Tab.Screen name="Checklists" component={StaffChecklists} options={{ tabBarIcon: icon('checkbox-outline'),      title: 'Checklists' }} />
      <Tab.Screen name="Profile"    component={ProfileScreen}   options={{ tabBarIcon: icon('person-circle-outline'), title: 'Profile' }} />
    </Tab.Navigator>
  );
}

// ── Tenant Tabs ───────────────────────────────────────────────────────────────
function TenantTabs() {
  return (
    <Tab.Navigator screenOptions={tabBarOptions}>
      <Tab.Screen name="Dashboard" component={TenantDashboard} options={{ tabBarIcon: icon('grid-outline'),          title: 'Dashboard' }} />
      <Tab.Screen name="Tickets"   component={TenantTickets}   options={{ tabBarIcon: icon('ticket-outline'),        title: 'My Tickets' }} />
      <Tab.Screen name="Profile"   component={ProfileScreen}   options={{ tabBarIcon: icon('person-circle-outline'), title: 'Profile' }} />
    </Tab.Navigator>
  );
}

// ── Security Tabs ─────────────────────────────────────────────────────────────
function SecurityTabs() {
  return (
    <Tab.Navigator screenOptions={tabBarOptions}>
      <Tab.Screen name="Dashboard" component={SecurityDashboard} options={{ tabBarIcon: icon('shield-outline'),        title: 'Dashboard' }} />
      <Tab.Screen name="Incidents" component={SecurityTickets}   options={{ tabBarIcon: icon('warning-outline'),       title: 'Incidents' }} />
      <Tab.Screen name="Profile"   component={ProfileScreen}     options={{ tabBarIcon: icon('person-circle-outline'), title: 'Profile' }} />
    </Tab.Navigator>
  );
}

// ── HelpDesk Tabs ─────────────────────────────────────────────────────────────
function HelpdeskTabs() {
  return (
    <Tab.Navigator screenOptions={tabBarOptions}>
      <Tab.Screen name="Dashboard" component={HelpdeskDashboard} options={{ tabBarIcon: icon('headset-outline'),       title: 'Dashboard' }} />
      <Tab.Screen name="Tickets"   component={HelpdeskTickets}   options={{ tabBarIcon: icon('ticket-outline'),        title: 'All Tickets' }} />
      <Tab.Screen name="Profile"   component={ProfileScreen}     options={{ tabBarIcon: icon('person-circle-outline'), title: 'Profile' }} />
    </Tab.Navigator>
  );
}

// ── Root Navigator ────────────────────────────────────────────────────────────
function MainNavigator({ role }) {
  const tabsMap = {
    admin:    AdminTabs,
    staff:    StaffTabs,
    tenant:   TenantTabs,
    security: SecurityTabs,
    helpdesk: HelpdeskTabs,
    customer: TenantTabs, // fallback
  };
  const TabComponent = tabsMap[role] || TenantTabs;

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Tabs"           component={TabComponent}   options={{ headerShown: false }} />
      <Stack.Screen name="TicketDetail"   component={TicketDetail}   options={{ title: 'Ticket Details' }} />
      <Stack.Screen name="NewTicket"      component={NewTicket}      options={{ title: 'Raise Ticket' }} />
      <Stack.Screen name="ExecuteChecklist" component={ExecuteChecklist} options={{ title: 'Checklist' }} />
      <Stack.Screen name="MonitorDetail"  component={MonitorDetail}  options={{ title: 'Schedule Details' }} />
      <Stack.Screen name="Notifications"  component={Notifications}  options={{ title: 'Notifications' }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main">
            {() => <MainNavigator role={user.role} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
