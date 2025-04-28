import React from "react";
import { Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../screens/Onboarding/Context/ThemeContext";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <TouchableOpacity onPress={toggleTheme} style={styles.button}>
      <Text style={styles.text}>
        Switch to {theme === "dark" ? "Light" : "Dark"} Mode
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    marginTop: 24,
    alignSelf: "center",
    backgroundColor: "#475569",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  text: {
    color: "#f1f5f9",
    fontSize: 16,
  },
});

export default ThemeToggle;
