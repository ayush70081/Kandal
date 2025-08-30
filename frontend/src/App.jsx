import { Routes, Route, Link } from 'react-router-dom';
import ReportPage from './pages/ReportPage';
import './App.css';

function App() {
  return (
    <div>
      <nav className="navbar">
        <Link to="/" className="nav-brand">Kandal</Link>
        <div>
          <Link to="/" className="nav-link">Report Incident</Link>
        </div>
      </nav>
      <div className="page-content">
        <Routes>
          <Route path="/" element={<ReportPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;