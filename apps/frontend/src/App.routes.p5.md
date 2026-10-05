# P5 routes to wire in App.tsx

```tsx
const RwaCatalogPage = lazy(() => import('./pages/RwaCatalogPage'))
<Route path="/rwa" element={<RwaCatalogPage />} />
<Route path="/rwa_catalog" element={<Navigate to="/rwa" replace />} />
```
