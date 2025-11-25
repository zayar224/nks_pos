// src/components/AdminNavbar.jsx

import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiLogOut, FiGlobe } from "react-icons/fi";

function AdminNavbar({ role }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("language");
    navigate("/login");
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem("language", lng);
  };

  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 shadow-lg">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
        <h2 className="text-xl font-bold text-white">
          {t("admin_panel")} - {t(role)}
        </h2>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <FiGlobe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white" />
            <select
              onChange={(e) => changeLanguage(e.target.value)}
              value={i18n.language}
              className="bg-white/20 text-white pl-10 pr-4 py-2 rounded-full border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="en">English</option>
              <option value="my">မြန်မာ</option>
            </select>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full transition-all duration-300 border border-white/30"
          >
            <FiLogOut className="mr-2" />
            {t("logout")}
          </button>
        </div>
      </div>
    </nav>
  );
}

export default AdminNavbar;
