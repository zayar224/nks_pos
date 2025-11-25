import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

function Navbar({ role }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const logout = () => {
    // Clear authentication data
    localStorage.removeItem("token");
    localStorage.removeItem("language"); // Optional: clear language preference
    // Redirect to login page
    navigate("/login");
  };

  const orderHist = () => {
    navigate("/history");
  };

  const preparationPage = () => {
    navigate("/preparation");
  };

  const settingPage = () => {
    navigate("/settings");
  };

  const usersPage = () => {
    navigate("/users");
  };

  const adminDash = () => {
    navigate("/dashboard");
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("language", lng);
  };

  return (
    <nav className="bg-blue-600 p-4 text-white">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t("welcome")}</h1>
        <div className="flex items-center space-x-4">
          <button onClick={orderHist} className="bg-red-500 px-4 py-2 rounded">
            {t("order_history")}
          </button>
          <button
            onClick={preparationPage}
            className="bg-red-500 px-4 py-2 rounded"
          >
            {t("preparation")}
          </button>
          <button onClick={adminDash} className="bg-red-500 px-4 py-2 rounded">
            {t("dashboard")}
          </button>
          <button onClick={usersPage} className="bg-red-500 px-4 py-2 rounded">
            {t("users")}
          </button>
          <button
            onClick={settingPage}
            className="bg-red-500 px-4 py-2 rounded"
          >
            {t("settings")}
          </button>
          <select
            onChange={(e) => changeLanguage(e.target.value)}
            value={i18n.language}
            className="bg-blue-500 text-white p-2 rounded"
          >
            <option value="en">English</option>
            <option value="my">မြန်မာ</option>
          </select>
          {role === "admin" && (
            <button
              onClick={() => navigate("/admin/settings")}
              className="bg-blue-500 px-4 py-2 rounded"
            >
              {t("settings")}
            </button>
          )}
          <button onClick={logout} className="bg-red-500 px-4 py-2 rounded">
            {t("logout")}
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
