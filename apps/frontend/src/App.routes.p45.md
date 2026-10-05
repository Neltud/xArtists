# P4.5 route wiring (apply if App.tsx missing lazy imports)

```tsx
const HistoryPage = lazy(() => import('./pages/HistoryPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))

<Route path="/history" element={<HistoryPage />} />
<Route path="/admin" element={<AdminPage />} />
```

HolderTerminal: import PendingActions and render before Active strategy block.
Link to `/history`.
