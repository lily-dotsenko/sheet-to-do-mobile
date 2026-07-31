import {
  ReactNode,
  RefObject,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';
import {
  Dimensions,
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TextInput,
} from 'react-native';
import { FlatList } from 'react-native-gesture-handler';

import { TaskList } from '@/domain/models';

const SCROLL_MARGIN = 16;
const MEASURE_DELAY = 80;

type KeyboardScrollContextValue = {
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollIntoView: (inputRef: RefObject<TextInput | null>) => void;
};

const KeyboardScrollContext = createContext<KeyboardScrollContextValue | null>(null);

export function KeyboardScrollProvider({
  listRef,
  children,
}: {
  listRef: RefObject<FlatList<TaskList> | null>;
  children: ReactNode;
}) {
  const offsetRef = useRef(0);
  const keyboardHeightRef = useRef(0);

  useEffect(() => {
    const didShow = Keyboard.addListener('keyboardDidShow', (event) => {
      keyboardHeightRef.current = event.endCoordinates?.height ?? 0;
    });
    const didHide = Keyboard.addListener('keyboardDidHide', () => {
      keyboardHeightRef.current = 0;
    });
    return () => {
      didShow.remove();
      didHide.remove();
    };
  }, []);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    offsetRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  const scrollIntoView = useCallback(
    (inputRef: RefObject<TextInput | null>) => {
      // Keyboard height is only known once the show animation reports it, so measure after a delay.
      setTimeout(() => {
        const input = inputRef.current;
        const list = listRef.current;
        const keyboardHeight = keyboardHeightRef.current;
        if (!input || !list || keyboardHeight <= 0) return;
        input.measureInWindow((_x, y, _width, height) => {
          const visibleBottom = Dimensions.get('window').height - keyboardHeight;
          const overflow = y + height - visibleBottom + SCROLL_MARGIN;
          if (overflow > 0) {
            list.scrollToOffset({ offset: offsetRef.current + overflow, animated: true });
          }
        });
      }, MEASURE_DELAY);
    },
    [listRef],
  );

  return (
    <KeyboardScrollContext.Provider value={{ handleScroll, scrollIntoView }}>
      {children}
    </KeyboardScrollContext.Provider>
  );
}

export function useKeyboardScroll(): KeyboardScrollContextValue {
  const value = useContext(KeyboardScrollContext);
  if (!value) throw new Error('useKeyboardScroll must be used inside KeyboardScrollProvider');
  return value;
}
