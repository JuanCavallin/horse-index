import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { horsesApi } from "@/lib/api";
import { Horse, HealthStatus } from "@/lib/types";

export default function tasksScreen() { 
    return (
        <h1>Tasks</h1>
      );
}