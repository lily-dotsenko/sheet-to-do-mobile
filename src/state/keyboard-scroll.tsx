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
  Keyboard,
  KeyboardEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TextInput,
} from 'react-native';
import { FlatList } from 'react-native-gesture-handler';

import { TaskList } from '@/domain/models';

const SCROLL_MARGIN = 16;
const MEASURE_DELAY = 60;
const SETTLED_MEASURE_DELAY = 240;

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
  const keyboardTopRef = useRef<number | null>(null);
  const pendingInputRef = useRef<RefObject<TextInput | null> | null>(null);

  const revealInput = useCallback(
    (inputRef: RefObject<TextInput | null>, keyboardTop: number) => {
      const input = inputRef.current;
      const list = listRef.current;
      if (!input || !list) return;
      input.measureInWindow((_x, y, _width, height) => {
        const overflow = y + height - keyboardTop + SCROLL_MARGIN;
        if (overflow > 0) {
          list.scrollToOffset({ offset: offsetRef.current + overflow, animated: true });
        }
      });
    },
    [listRef],
  );

  useEffect(() => {
    const didShow = Keyboard.addListener('keyboardDidShow', (event: KeyboardEvent) => {
      keyboardTopRef.current = event.endCoordinates.screenY;
      const pending = pendingInputRef.current;
      if (pending) {
        setTimeout(() => revealInput(pending, event.endCoordinates.screenY), MEASURE_DELAY);
        // Some Android keyboards report before the resized window finishes laying out.
        setTimeout(() => revealInput(pending, event.endCoordinates.screenY), SETTLED_MEASURE_DELAY);
      }
    });
    const didHide = Keyboard.addListener('keyboardDidHide', () => {
      keyboardTopRef.current = null;
      pendingInputRef.current = null;
    });
    return () => {
      didShow.remove();
      didHide.remove();
    };
  }, [revealInput]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    offsetRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  const scrollIntoView = useCallback(
    (inputRef: RefObject<TextInput | null>) => {
      pendingInputRef.current = inputRef;
      const keyboardTop = keyboardTopRef.current;
      if (keyboardTop !== null) {
        setTimeout(() => revealInput(inputRef, keyboardTop), MEASURE_DELAY);
        setTimeout(() => revealInput(inputRef, keyboardTop), SETTLED_MEASURE_DELAY);
      }
    },
    [revealInput],
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
