"use client";

import { Provider } from "react-redux";
import { store } from "@/store/store";
import AuthBootstrapper from "@/components/AuthBootstrap";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthBootstrapper />
      {children}
    </Provider>
  );
}
