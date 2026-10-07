import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { PagesProvider, usePages } from './context/PagesContext';
import { PrefsProvider } from './context/PrefsContext';
import Workspace from './pages/Workspace';
import SharedPage from './pages/SharedPage';

function RedirectToFirstPage() {
  const { pages } = usePages();
  return <Navigate to={`/p/${pages[0].id}`} replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <PrefsProvider>
        <PagesProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/share" element={<SharedPage />} />
              <Route path="/p/:pageId" element={<Workspace />} />
              <Route path="/help" element={<Workspace view="help" />} />
              <Route path="*" element={<RedirectToFirstPage />} />
            </Routes>
          </BrowserRouter>
        </PagesProvider>
      </PrefsProvider>
    </ThemeProvider>
  );
}
