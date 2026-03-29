import React, { useEffect } from "react";
import { useConfigStore } from "./store/useConfigStore";

export function Providers({ children }) {
  const theme = useConfigStore(state => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // bg-white text-gray-900 dark:bg-[#1a1c1e] dark:text-gray-100 will be added locally if needed
  return (
    <>
      {children}
    </>
  );
}
