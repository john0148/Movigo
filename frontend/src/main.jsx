import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import router from './router/routes';
import { AuthProvider } from './context/AuthContext.jsx';
import './config/firebase'; // Initialize Firebase
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';


/**
 * Entry point của ứng dụng
 * Khởi tạo React app với React Router và Firebase Auth
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
);

// ReactDOM.createRoot(document.getElementById('root')).render(
//   <React.StrictMode>
//     <BrowserRouter>
//       <AuthProvider>
//         <App />
//       </AuthProvider>
//     </BrowserRouter>
//   </React.StrictMode>,
// );
