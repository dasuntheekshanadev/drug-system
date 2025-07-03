import { useNavigate } from 'react-router-dom';
import { Pill, LogOut } from 'lucide-react';

function Navbar({ token, setToken }) {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    setToken(null);
    navigate('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-lg border-b border-blue-800">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
            <Pill className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Drug Tracker</h1>
        </div>
        
        {token && (
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium">Logout</span>
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;