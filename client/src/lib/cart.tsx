import { MAX_LINES_PER_ORDER, MAX_QTY_PER_LINE } from "@shared/store";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * The cart is only product ids and quantities. Names and prices are read from
 * the catalogue query every time it renders, so a price changed in the admin
 * shows up in a cart that was filled yesterday, and the server prices the
 * order again on its own anyway.
 */
export type CartItem = { productId: number; qty: number };

const KEY = "cv_cart_v1";

function read(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (i): i is CartItem =>
          i && Number.isInteger(i.productId) && Number.isInteger(i.qty) && i.qty > 0
      )
      .slice(0, MAX_LINES_PER_ORDER);
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage blocked: the cart lives for this tab only */
  }
}

type CartApi = {
  items: CartItem[];
  count: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (productId: number, qty?: number) => void;
  setQty: (productId: number, qty: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartApi | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setItems(read());
    setLoaded(true);
    // Another tab changed the cart: follow it.
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setItems(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (loaded) write(items);
  }, [items, loaded]);

  const add = useCallback((productId: number, qty = 1) => {
    setItems(prev => {
      const found = prev.find(i => i.productId === productId);
      if (found) {
        return prev.map(i =>
          i.productId === productId
            ? { ...i, qty: Math.min(MAX_QTY_PER_LINE, i.qty + qty) }
            : i
        );
      }
      if (prev.length >= MAX_LINES_PER_ORDER) return prev;
      return [...prev, { productId, qty: Math.min(MAX_QTY_PER_LINE, qty) }];
    });
  }, []);

  const setQty = useCallback((productId: number, qty: number) => {
    setItems(prev =>
      qty <= 0
        ? prev.filter(i => i.productId !== productId)
        : prev.map(i =>
            i.productId === productId
              ? { ...i, qty: Math.min(MAX_QTY_PER_LINE, qty) }
              : i
          )
    );
  }, []);

  const remove = useCallback(
    (productId: number) => setItems(prev => prev.filter(i => i.productId !== productId)),
    []
  );
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartApi>(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.qty, 0),
      open,
      setOpen,
      add,
      setQty,
      remove,
      clear,
    }),
    [items, open, add, setQty, remove, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
