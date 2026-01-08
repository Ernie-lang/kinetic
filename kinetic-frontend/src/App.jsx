import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import StravaCallback from './pages/StravaCallback';
import Dashboard from './pages/Dashboard';
import Workouts from './pages/Workouts';
import Chat from './pages/Chat';
import Navigation from './components/Navigation';
import Programs from './pages/Programs';
import ProgramDetail from './pages/ProgramDetail';
import Running from './pages/analytics/Running';
import Cycling from './pages/analytics/Cycling';
import Swimming from './pages/analytics/Swimming';

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
        <Route path='/programs' element={
          <>
            <Navigation />
            <Programs />
          </>
        } />
        <Route path='/programs/:programId' element={
          <>
            <Navigation />
            <ProgramDetail />
          </>
        } />
        <Route path='/analytics/running' element={
          <>
            <Navigation />
            <Running />
          </>
        } />
        <Route path='/analytics/cycling' element={
          <>
            <Navigation />
            <Cycling />
          </>
        } />
        <Route path='/analytics/swimming' element={
          <>
            <Navigation />
            <Swimming />
          </>
        } />
      </Routes>
    </Router>
  );
}

export default App;