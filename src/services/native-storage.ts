import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppStorage } from './storage';

export const appStorage = new AppStorage(AsyncStorage);
