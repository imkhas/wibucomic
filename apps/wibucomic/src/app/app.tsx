import { Route, Routes } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { HomePage } from '../pages/HomePage';
import { BrowsePage } from '../pages/BrowsePage';
import { DetailPage } from '../pages/DetailPage';

export function App() {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/manga" element={<BrowsePage />} />
        <Route path="/manhwa" element={<BrowsePage />} />
        <Route path="/comics" element={<BrowsePage />} />
        <Route path="/manhua" element={<BrowsePage />} />
        <Route path="/comic/:id" element={<DetailPage />} />
      </Routes>
    </div>
  );
}

export default App;
