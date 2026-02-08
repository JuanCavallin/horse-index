import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import { Image, useColorScheme } from "react-native";

import Colors from "@/constants/Colors";

const logo = require("@/assets/images/LOGO FOR RHH.png");

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? "light"].tabIconDefault,
        tabBarStyle: { backgroundColor: Colors[colorScheme ?? "light"].card },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Retirement Home for Horses",
          tabBarIcon: ({ color }) => <TabBarIcon name="list" color={color} />,
          headerRight: () => (
            <Image
              source={logo}
              style={{ width: 40, height: 40, marginRight: 12, borderRadius: 20 }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "Add Horse",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="plus-circle" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tasks",
          tabBarIcon: ({ color }) => <TabBarIcon name="check" color={color} />,
        }}
      />
      <Tabs.Screen
        name="audit"
        options={{
          title: "Audit",
          tabBarIcon: ({ color }) => <TabBarIcon name="file-text" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
