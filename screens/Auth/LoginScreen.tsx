import { firebaseService } from '../src/atomic/organisms/firebaseService';
import "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../config/firebase";
import { useNavigation } from "@react-navigation/native";
import ThemeToggle from "../../components/ThemeToggle";

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigation = useNavigation();

  const handleLogin = async () => {
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigation.navigate("Home" as never); // or 'Dashboard', etc.
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Sports Edge</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#aaa"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#aaa"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Signup" as never)}>
        <Text style={styles.link}>Don't have an account? Sign up</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate("ForgotPassword" as never)}
      >
        <Text style={styles.link}>Forgot password?</Text>
      </TouchableOpacity>
      
      {/* Theme Toggle */}
      <ThemeToggle />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#38bdf8",
    marginBottom: 32,
  },
  input: {
    width: "100%",
    backgroundColor: "#1e293b",
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    color: "#fff",
  },
  button: {
    width: "100%",
    backgroundColor: "#38bdf8",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#0f172a", fontWeight: "600", fontSize: 16 },
  link: { marginTop: 16, color: "#94a3b8", textDecorationLine: "underline" },
  error: {
    color: "#f87171",
    marginBottom: 12,
    fontSize: 14,
    textAlign: "center",
  },
});

export default LoginScreen;
