import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/api.service";
import { setStoredToken } from "../utils/auth";

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginUser(email);

      setStoredToken(data.token); // store JWT
      onLoginSuccess?.();

      navigate("/dashboard", { replace: true }); // redirect
    } catch (loginError) {
      setError(loginError.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container auth-shell">
      <form className="card auth-card" onSubmit={handleLogin}>
        <h1>Login</h1>
        <p>Enter your email to receive a JWT session token.</p>

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {error && <p className="error-text">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default Login;