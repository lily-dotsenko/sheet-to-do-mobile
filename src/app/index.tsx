import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Sheet: to do</Text>
        <Text style={styles.subtitle}>Нативний застосунок готується.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7d5c4',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    backgroundColor: '#fffaf4',
    padding: 24,
  },
  title: {
    color: '#2f405b',
    fontSize: 34,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 8,
    color: '#6d5b58',
    fontSize: 17,
  },
});
