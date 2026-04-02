import axios from 'axios'
import { Platform } from 'react-native'

const API_URL = Platform.select({
    default: "http://localhost:3000/api/v1/",
    android: "http://192.168.0.106:3000/api/v1",
    ios:     "http://192.168.0.106:3000/api/v1/",
});

// const API_URL = process.env.EXPO_PUBLIC_API_URL;
const api = axios.create({ baseURL: API_URL, timeout: 10000 });

export default api; 