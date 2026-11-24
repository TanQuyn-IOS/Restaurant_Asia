import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  StatusBar,
} from 'react-native';
import { io } from 'socket.io-client';

const API_BASE_URL = 'http://10.0.2.2:5000/api/v1'; // Android emulator localhost alias
const SOCKET_URL = 'http://10.0.2.2:5000';

interface Table {
  id: string;
  name: string;
  status: string;
  capacity: number;
}

interface ReadyItem {
  orderItemId: string;
  orderId: string;
  tableId: string;
  itemName: string;
  quantity: number;
}

export default function App() {
  const [tables, setTables] = useState<Table[]>([]);
  const [readyItems, setReadyItems] = useState<ReadyItem[]>([]);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // 1. Login as Waiter
  useEffect(() => {
    const loginWaiter = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'waiter1', password: 'Staff@123' }),
        });
        const data = await res.json();
        if (data.success && data.data.accessToken) {
          setAuthToken(data.data.accessToken);
          loadTables(data.data.accessToken);
          initSocket(data.data.accessToken);
        }
      } catch (err) {
        console.warn('Backend login connection error:', err);
      }
    };

    loginWaiter();
  }, []);

  const loadTables = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/tables`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setTables(data.data);
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách bàn:', err);
    }
  };

  const initSocket = (token: string) => {
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.emit('join-room', 'waiter');

    socket.on('kitchen.item_ready', (item: ReadyItem) => {
      Alert.alert(
        '🔔 Món ăn sẵn sàng!',
        `Món "${item.itemName}" x${item.quantity} đã nấu xong, sẵn sàng bưng ra bàn.`
      );
      setReadyItems((prev) => [item, ...prev]);
    });

    socket.on('table.updated', () => {
      if (token) loadTables(token);
    });
  };

  const markServed = async (orderItemId: string) => {
    if (!authToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/waiter/items/${orderItemId}/served`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('Thành công', 'Đã xác nhận phục vụ món ra bàn!');
        setReadyItems((prev) => prev.filter((i) => i.orderItemId !== orderItemId));
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể xác nhận phục vụ món.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Restaurant Asia - Waiter App</Text>
        <Text style={styles.headerSubtitle}>Nhân viên phục vụ bàn</Text>
      </View>

      {/* Thông báo món đã nấu xong chờ phục vụ */}
      {readyItems.length > 0 && (
        <View style={styles.readySection}>
          <Text style={styles.sectionTitle}>Món chờ phục vụ ({readyItems.length})</Text>
          {readyItems.map((item, idx) => (
            <View key={idx} style={styles.readyCard}>
              <View>
                <Text style={styles.readyName}>{item.itemName} x{item.quantity}</Text>
                <Text style={styles.readyMeta}>Đơn: #{item.orderId.slice(0, 8)}</Text>
              </View>
              <TouchableOpacity
                style={styles.serveButton}
                onPress={() => markServed(item.orderItemId)}
              >
                <Text style={styles.serveButtonText}>Đã bưng</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Danh sách bàn */}
      <View style={styles.tableSection}>
        <Text style={styles.sectionTitle}>Sơ đồ bàn ăn</Text>
        <FlatList
          data={tables}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => {
            const isOccupied = item.status === 'OCCUPIED';
            return (
              <View
                style={[
                  styles.tableCard,
                  isOccupied ? styles.tableOccupied : styles.tableAvailable,
                ]}
              >
                <Text style={styles.tableName}>{item.name}</Text>
                <Text style={styles.tableStatus}>
                  {isOccupied ? 'ĐANG ĂN' : 'BÀN TRỐNG'}
                </Text>
                <Text style={styles.tableCapacity}>{item.capacity} chỗ</Text>
              </View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  readySection: {
    backgroundColor: '#1e293b',
    margin: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 8,
  },
  readyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#334155',
    padding: 10,
    borderRadius: 8,
    marginVertical: 4,
  },
  readyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  readyMeta: {
    fontSize: 11,
    color: '#cbd5e1',
  },
  serveButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  serveButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  tableSection: {
    flex: 1,
    paddingHorizontal: 12,
  },
  tableCard: {
    flex: 1,
    margin: 6,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  tableAvailable: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  tableOccupied: {
    backgroundColor: '#7f1d1d',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  tableName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  tableStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fbbf24',
    marginTop: 4,
  },
  tableCapacity: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
});
