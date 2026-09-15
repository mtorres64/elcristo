import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 1,
    },
  },
});

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 3500,
            style: {
              background: "#1A2B1C",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 500,
              padding: "14px 18px",
              borderRadius: "10px",
              boxShadow: "0 12px 30px rgba(0,0,0,0.28)",
              maxWidth: "420px",
            },
            success: {
              iconTheme: { primary: "#fff", secondary: "#1A2B1C" },
              style: { background: "#1A2B1C" },
            },
            error: {
              iconTheme: { primary: "#fff", secondary: "#B91C1C" },
              style: { background: "#B91C1C" },
            },
          }}
        />
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);
