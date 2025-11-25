// src/pages/UserProfilePage.jsx
import { useState, useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
import axios from "../api/axiosInstance";
import AuthContext from "../context/AuthContext";

function UserProfilePage() {
  const { t } = useTranslation();
  const { user, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ email: "", username: "" });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/auth/me`,
          config
        );
        setProfile(response.data.user);
        setFormData({
          email: response.data.user.email,
          username: response.data.user.username,
        });
      } catch (err) {
        setError(t("failed_to_fetch_profile"));
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(
        `${import.meta.env.VITE_API_URL}/auth/me`,
        formData,
        config
      );
      setError(t("profile_updated"));
    } catch (err) {
      setError(t("failed_to_update_profile"));
    }
  };

  if (loading) return <p>{t("loading")}</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{t("my_profile")}</h1>
      {profile && (
        <form onSubmit={handleUpdate} className="max-w-md">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              {t("username")}
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              {t("email")}
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            {t("update_profile")}
          </button>
          <button
            onClick={logout}
            className="ml-2 bg-red-500 text-white px-4 py-2 rounded"
          >
            {t("logout")}
          </button>
        </form>
      )}
    </div>
  );
}

export default UserProfilePage;
