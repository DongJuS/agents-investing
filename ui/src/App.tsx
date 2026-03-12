import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import Strategy from "@/pages/Strategy";
import Portfolio from "@/pages/Portfolio";
import Market from "@/pages/Market";
import Settings from "@/pages/Settings";
import Layout from "@/components/Layout";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/strategy" element={<Strategy />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/market" element={<Market />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
