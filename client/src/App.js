import 'materialize-css'
import {BrowserRouter as Router} from 'react-router-dom'
import {useRoutes} from "./routes";
import {useAuth} from "./hooks/auth.hook";
import {AuthContext} from "./context/AuthContext";

function App() {
  const {token, login, logout, userId} = useAuth()
  const isAuthenticated = !!token
  const routes = useRoutes(isAuthenticated)
  return (
      <AuthContext.Provider value={{
        token, login, logout, userId
      }}>
        <Router>
          <div className="container">
            {routes}
          </div>
        </Router>
      </AuthContext.Provider>

  )
}

export default App;
