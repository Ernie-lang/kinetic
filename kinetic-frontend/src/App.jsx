import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import StravaCallback from './pages/StravaCallback';
import Dashboard from './pages/Dashboard';
import Workouts from './pages/Workouts';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth/callback" element={<StravaCallback />} />
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/workouts' element={<Workouts />} />
      </Routes>
    </Router>
  );
}

export default App;