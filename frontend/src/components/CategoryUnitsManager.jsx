import { useState, useEffect } from "react";
import axios from "../api/axiosInstance";
import { Dialog } from "@headlessui/react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { FiEdit, FiTrash2, FiPlus, FiX, FiCheck, FiPackage, FiAlertTriangle } from "react-icons/fi";

function CategoryUnitsManager({ categories }) {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || null);
  const [categoryUnits, setCategoryUnits] = useState([]);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editUnit, setEditUnit] = useState(null);
  const [newUnit, setNewUnit] = useState({
    name: "",
    quantity: 1,
    is_base: false,
  });

  useEffect(() => {
    if (selectedCategory) {
      fetchCategoryUnits();
    }
  }, [selectedCategory]);

  const fetchCategoryUnits = async () => {
    try {
      const res = await axios.get(`/products/categories/${selectedCategory}/units`);
      setCategoryUnits(res.data);
    } catch (err) {
      toast.error("Failed to fetch category units");
    }
  };

  const openUnitModal = (unit = null) => {
    if (unit) {
      setEditUnit(unit);
      setNewUnit({
        name: unit.name,
        quantity: unit.quantity,
        is_base: unit.is_base,
      });
    } else {
      setEditUnit(null);
      setNewUnit({ name: "", quantity: 1, is_base: false });
    }
    setIsUnitModalOpen(true);
  };

  const handleAddOrUpdateUnit = async () => {
    if (!newUnit.name) {
      toast.error("Unit name is required");
      return;
    }
    try {
      if (editUnit) {
        const res = await axios.put(
          `/products/categories/${selectedCategory}/units/${editUnit.id}`,
          newUnit
        );
        setCategoryUnits(
          categoryUnits.map((u) => (u.id === editUnit.id ? res.data : u))
        );
        toast.success("Unit updated");
      } else {
        const res = await axios.post(
          `/products/categories/${selectedCategory}/units`,
          newUnit
        );
        setCategoryUnits([...categoryUnits, res.data]);
        toast.success("Unit added");
      }
      setEditUnit(null);
      setNewUnit({ name: "", quantity: 1, is_base: false });
      setIsUnitModalOpen(false);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to save unit";
      toast.error(msg);
    }
  };

  const handleDeleteUnit = async (unitId) => {
    if (!confirm("Are you sure you want to delete this unit?")) return;
    try {
      await axios.delete(`/products/categories/${selectedCategory}/units/${unitId}`);
      setCategoryUnits(categoryUnits.filter((u) => u.id !== unitId));
      toast.success("Unit deleted");
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to delete unit";
      toast.error(msg);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Category Units</h2>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Category</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {selectedCategory && (
        <>
          <div className="mb-6 flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-800">Units for Category</h3>
            <button
              onClick={() => openUnitModal()}
              className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <FiPlus className="mr-2" />
              Add Unit
            </button>
          </div>

          {categoryUnits.length > 0 ? (
            <div className="space-y-3">
              {categoryUnits.map((unit) => (
                <div
                  key={unit.id}
                  className={`p-4 rounded-lg border-2 ${
                    unit.is_base
                      ? "border-indigo-200 bg-indigo-50"
                      : "border-gray-200 bg-gray-50"
                  } flex items-center justify-between`}
                >
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="font-semibold text-gray-900">{unit.name}</span>
                      {unit.is_base && (
                        <span className="ml-2 text-xs font-medium bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full">
                          Base
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      {unit.quantity > 1 && (
                        <span>× {unit.quantity} base</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => openUnitModal(unit)}
                      className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                    >
                      <FiEdit />
                    </button>
                    {!unit.is_base && (
                      <button
                        onClick={() => handleDeleteUnit(unit.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
              <p className="flex items-center">
                <FiAlertTriangle className="mr-2" />
                No units found. Add a base unit!
              </p>
            </div>
          )}
        </>
      )}

      <Dialog
        open={isUnitModalOpen}
        onClose={() => setIsUnitModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title className="text-xl font-bold text-gray-800">
                {editUnit ? "Edit Unit" : "Add Unit"}
              </Dialog.Title>
              <button
                onClick={() => setIsUnitModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Name
                </label>
                <input
                  type="text"
                  value={newUnit.name}
                  onChange={(e) =>
                    setNewUnit({ ...newUnit, name: e.target.value })
                  }
                  placeholder="e.g., Bottle, Case, Pack"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity Multiplier
                </label>
                <input
                  type="number"
                  value={newUnit.quantity}
                  onChange={(e) =>
                    setNewUnit({
                      ...newUnit,
                      quantity: parseInt(e.target.value) || 1,
                    })
                  }
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  How many base units make up this unit?
                </p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={newUnit.is_base}
                  onChange={(e) =>
                    setNewUnit({ ...newUnit, is_base: e.target.checked })
                  }
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm font-medium text-gray-700">
                  Is Base Unit
                </label>
              </div>
              <button
                onClick={handleAddOrUpdateUnit}
                className="w-full flex justify-center items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
              >
                <FiCheck className="mr-2" />
                {editUnit ? "Update Unit" : "Add Unit"}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}

export default CategoryUnitsManager;
