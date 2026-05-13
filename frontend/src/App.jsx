import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminPanel from './pages/AdminPanel';
import TeacherPanel from './pages/TeacherPanel';
import StudentPanel from './pages/StudentPanel';
import ParentPanel from './pages/ParentPanel';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          
          {/* Gelecekte buraya Protected Route mekanizması eklenebilir */}
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/teacher" element={<TeacherPanel />} />
          <Route path="/student" element={<StudentPanel />} />
          <Route path="/parent" element={<ParentPanel />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
