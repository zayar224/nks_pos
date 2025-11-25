// src/pages/EmployeeAttendancePage.jsx

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "../api/axiosInstance";
import { Dialog } from "@headlessui/react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  FiPlus,
  FiClock,
  FiUser,
  FiMapPin,
  FiX,
  FiCheck,
  FiLogOut,
  FiEdit2,
} from "react-icons/fi";

function EmployeeAttendancePage() {
  const { t } = useTranslation();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [newAttendance, setNewAttendance] = useState({
    userId: "",
    branchId: "",
    clockIn: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [attendanceRes, usersRes, branchesRes] = await Promise.all([
          axios.get("/employee-attendance", config),
          axios.get("/users", config),
          axios.get("/branches", config),
        ]);
        setAttendanceRecords(attendanceRes.data);
        setUsers(usersRes.data);
        setBranches(branchesRes.data);
        if (attendanceRes.data.length === 0) {
          setError(t("no_attendance_records_found"));
        }
      } catch (err) {
        const errorMessage =
          err.response?.data?.error || t("failed_to_fetch_data");
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [t]);

  const handleAddOrEditAttendance = async (e) => {
    e.preventDefault();
    const clockInDate = new Date(newAttendance.clockIn);
    if (isNaN(clockInDate.getTime())) {
      const errorMessage = t("invalid_clock_in");
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }
    if (!newAttendance.userId || !newAttendance.branchId) {
      const errorMessage = t("select_user_and_branch");
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      if (editingRecord) {
        await axios.put(
          `/employee-attendance/${editingRecord.id}`,
          {
            user_id: newAttendance.userId,
            branch_id: newAttendance.branchId,
            clock_in: clockInDate.toISOString(),
          },
          config
        );
        toast.success(t("attendance_updated"));
      } else {
        await axios.post(
          "/employee-attendance",
          {
            user_id: newAttendance.userId,
            branch_id: newAttendance.branchId,
            clock_in: clockInDate.toISOString(),
          },
          config
        );
        toast.success(t("attendance_added"));
      }
      setNewAttendance({ userId: "", branchId: "", clockIn: "" });
      setEditingRecord(null);
      setIsModalOpen(false);
      const response = await axios.get("/employee-attendance", config);
      setAttendanceRecords(response.data);
      if (response.data.length === 0) {
        setError(t("no_attendance_records_found"));
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        (editingRecord
          ? t("failed_to_update_attendance")
          : t("failed_to_add_attendance"));
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleClockOut = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(
        `/employee-attendance/${id}`,
        { clock_out: new Date().toISOString() },
        config
      );
      toast.success(t("attendance_updated"));
      const response = await axios.get("/employee-attendance", config);
      setAttendanceRecords(response.data);
      if (response.data.length === 0) {
        setError(t("no_attendance_records_found"));
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || t("failed_to_update_attendance");
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleEditRecord = (record) => {
    setNewAttendance({
      userId: record.user_id,
      branchId: record.branch_id,
      clockIn: record.clock_in
        ? new Date(record.clock_in).toISOString().slice(0, -8)
        : "",
    });
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-6"
      >
        {t("manage_attendance")}
      </motion.h1>

      {error && !attendanceRecords.length && (
        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setNewAttendance({ userId: "", branchId: "", clockIn: "" });
          setEditingRecord(null);
          setIsModalOpen(true);
        }}
        className="flex items-center bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md mb-6 text-sm transition-colors"
      >
        <FiPlus className="mr-2" />
        {t("add_attendance")}
      </motion.button>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto mb-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("user")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("branch")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("clock_in")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("clock_out")}
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {attendanceRecords.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center">
                    <FiUser className="mr-2 text-indigo-500" />
                    {users.find((u) => u.id === record.user_id)?.username ||
                      t("na")}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <FiMapPin className="mr-2 text-indigo-500" />
                    {branches.find((b) => b.id === record.branch_id)?.name ||
                      t("na")}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {record.clock_in
                    ? new Date(record.clock_in).toLocaleString()
                    : t("na")}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {record.clock_out
                    ? new Date(record.clock_out).toLocaleString()
                    : t("na")}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-center space-x-2">
                  {!record.clock_out && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleClockOut(record.id)}
                      className="flex items-center bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                    >
                      <FiLogOut className="mr-1" />
                      {t("clock_out")}
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleEditRecord(record)}
                    className="flex items-center bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                  >
                    <FiEdit2 className="mr-1" />
                    {t("edit")}
                  </motion.button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        {attendanceRecords.map((record) => (
          <motion.div
            key={record.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-4 rounded-lg shadow border-l-4 border-indigo-500"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("user")}
                </span>
                <span className="text-sm font-semibold text-gray-900 flex items-center">
                  <FiUser className="mr-1 text-indigo-500" />
                  {users.find((u) => u.id === record.user_id)?.username ||
                    t("na")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("branch")}
                </span>
                <span className="text-sm text-gray-900 flex items-center">
                  <FiMapPin className="mr-1 text-indigo-500" />
                  {branches.find((b) => b.id === record.branch_id)?.name ||
                    t("na")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("clock_in")}
                </span>
                <span className="text-sm text-gray-900">
                  {record.clock_in
                    ? new Date(record.clock_in).toLocaleString()
                    : t("na")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("clock_out")}
                </span>
                <span className="text-sm text-gray-900">
                  {record.clock_out
                    ? new Date(record.clock_out).toLocaleString()
                    : t("na")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("actions")}
                </span>
                <div className="flex space-x-2">
                  {!record.clock_out && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleClockOut(record.id)}
                      className="flex items-center bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                    >
                      <FiLogOut className="mr-1" />
                      {t("clock_out")}
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleEditRecord(record)}
                    className="flex items-center bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                  >
                    <FiEdit2 className="mr-1" />
                    {t("edit")}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add/Edit Attendance Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecord(null);
          setNewAttendance({ userId: "", branchId: "", clockIn: "" });
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md bg-white p-6 rounded-lg shadow-xl">
            <Dialog.Title className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
              {editingRecord ? t("edit_attendance") : t("add_attendance")}
            </Dialog.Title>
            <form onSubmit={handleAddOrEditAttendance} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("user")}
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={newAttendance.userId}
                    onChange={(e) =>
                      setNewAttendance({
                        ...newAttendance,
                        userId: e.target.value,
                      })
                    }
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">{t("select_user")}</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.username}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("branch")}
                </label>
                <div className="relative">
                  <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={newAttendance.branchId}
                    onChange={(e) =>
                      setNewAttendance({
                        ...newAttendance,
                        branchId: e.target.value,
                      })
                    }
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">{t("select_branch")}</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("clock_in")}
                </label>
                <div className="relative">
                  <FiClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="datetime-local"
                    value={newAttendance.clockIn}
                    onChange={(e) =>
                      setNewAttendance({
                        ...newAttendance,
                        clockIn: e.target.value,
                      })
                    }
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingRecord(null);
                    setNewAttendance({ userId: "", branchId: "", clockIn: "" });
                  }}
                  className="flex items-center bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm transition-colors"
                >
                  <FiX className="mr-2" />
                  {t("cancel")}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="flex items-center bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md text-sm transition-colors"
                  disabled={loading}
                >
                  <FiCheck className="mr-2" />
                  {editingRecord ? t("update_attendance") : t("add_attendance")}
                </motion.button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}

export default EmployeeAttendancePage;
