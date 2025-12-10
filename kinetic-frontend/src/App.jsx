import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import StravaCallback from './pages/StravaCallback';
import Dashboard from './pages/Dashboard';
import Workouts from './pages/Workouts';
import Chat from './pages/Chat';
import Navigation from './components/Navigation';

function App() {
  return (
    <Router>
      <Routes>
        {/* Pages WITHOUT navigation */}
        <Route path="/" element={<Home />} />
        <Route path="/auth/callback" element={<StravaCallback />} />
        
        {/* Pages WITH navigation */}
        <Route path='/dashboard' element={
          <>
            <Navigation />
            <Dashboard />
          </>
        } />
        <Route path='/workouts' element={
          <>
            <Navigation />
            <Workouts />
          </>
        } />
        <Route path='/chat' element={
          <>
            <Navigation />
            <Chat />
          </>
        } />
      </Routes>
    </Router>
  );
}

export default App;