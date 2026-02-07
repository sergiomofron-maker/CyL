import React, { useState, useEffect } from 'react';
import { Meal, MealType } from '../types';
import { mockDb } from '../services/mockDb';
import { getIngredientsForDish } from '../services/geminiService';
import { format, addDays, startOfWeek, isSameDay, isSameWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, Plus, Trash2, CalendarRange, ArrowRight, Pencil } from 'lucide-react';

interface CalendarProps {
  userId: string;
}

const Calendar: React.FC<CalendarProps> = ({ userId }) => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [now, setNow] = useState<Date>(() => new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<MealType>(MealType.LUNCH);
  const [dishName, setDishName] = useState('');
  const [addingMeal, setAddingMeal] = useState(false);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  
  // State for Week Selection (0 = Current, 1 = Next)
  const [weekOffset, setWeekOffset] = useState<0 | 1>(0);

  useEffect(() => {
    loadMeals();
  }, [userId]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  const loadMeals = async () => {
    setLoading(true);
    const data = await mockDb.meals.list(userId);
    setMeals(data);
    setLoading(false);
  };

  // Generate 7 days based on selected week
  const startDate = startOfWeek(now, { weekStartsOn: 1 }); // Monday start of current week
  const viewStartDate = addDays(startDate, weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(viewStartDate, i));

  const handleSaveMeal = async () => {
    if (!dishName.trim()) return;
    setAddingMeal(true);
    
    // If editing, delete the old one AND its associated ingredients first
    if (editingMealId) {
        await mockDb.shoppingItems.deleteByMealId(editingMealId);
        await mockDb.meals.delete(editingMealId);
    }

    // 1. Add Meal (Always happens regardless of week)
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const newMeal = await mockDb.meals.add({
      user_id: userId,
      date: dateStr,
      meal_type: modalType,
      dish_name: dishName
    });

    // 2. Generate Ingredients & Add to Shopping List
    // RULE: AI ONLY analyzes the CURRENT WEEK for outputs.
    const isCurrentWeek = isSameWeek(selectedDate, now, { weekStartsOn: 1 });

    if (isCurrentWeek) {
        // Generate Ingredients (AI or Dictionary)
        const { ingredients } = await getIngredientsForDish(dishName);
        
        // Add to Shopping List linked to the meal ID
        for (const ing of ingredients) {
          const cleanName = ing.trim();
          
          await mockDb.shoppingItems.add({
            user_id: userId,
            ingredient_name: cleanName,
            category: 'Ingredientes', // Simplified category for MVP
            purchased: false,
            manual: false,
            meal_id: newMeal.id // Link ingredient to this specific meal
          });
        }
    } else {
        console.log("Meal added to future/past week. Skipping ingredient generation per rules.");
    }

    setDishName('');
    setEditingMealId(null);
    setAddingMeal(false);
    setIsModalOpen(false);
    loadMeals();
  };

  const handleDeleteFromModal = async () => {
    if (editingMealId) {
        if(window.confirm("¿Dejar este hueco vacío?")) {
            setAddingMeal(true);
            // Delete ingredients associated with this meal first
            await mockDb.shoppingItems.deleteByMealId(editingMealId);
            await mockDb.meals.delete(editingMealId);
            setAddingMeal(false);
            setIsModalOpen(false);
            loadMeals();
        }
    }
  };

  const openModal = (date: Date, type: MealType, existingMeal?: Meal) => {
    setSelectedDate(date);
    setModalType(type);
    if (existingMeal) {
        setDishName(existingMeal.dish_name);
        setEditingMealId(existingMeal.id);
    } else {
        setDishName('');
        setEditingMealId(null);
    }
    setIsModalOpen(true);
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="pb-24">
      <h2 className="text-xl font-bold mb-4 px-4 pt-4 flex items-center gap-2">
        <CalendarRange size={24} className="text-indigo-600" />
        Calendario
      </h2>
      
      {/* Week Selector Tabs */}
      <div className="px-4 mb-4 flex gap-2">
        <button 
          onClick={() => setWeekOffset(0)}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors border ${
            weekOffset === 0 
              ? 'bg-indigo-600 text-white border-indigo-600' 
              : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
          }`}
        >
          Semana Actual
        </button>
        <button 
          onClick={() => setWeekOffset(1)}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors border ${
            weekOffset === 1 
              ? 'bg-indigo-600 text-white border-indigo-600' 
              : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
          }`}
        >
          Semana Siguiente
        </button>
      </div>

      <div className="space-y-4 px-4">
        {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayMeals = meals.filter(m => m.date === dateStr);
            const lunch = dayMeals.find(m => m.meal_type === MealType.LUNCH);
            const dinner = dayMeals.find(m => m.meal_type === MealType.DINNER);
            const isToday = isSameDay(day, now);

            return (
                <div key={dateStr} className={`bg-white rounded-xl shadow-sm border ${isToday ? 'border-indigo-400 ring-1 ring-indigo-400' : 'border-gray-100'} overflow-hidden`}>
                    <div className={`px-4 py-2 ${isToday ? 'bg-indigo-50 text-indigo-800' : 'bg-gray-50 text-gray-700'} font-medium flex justify-between items-center`}>
                        <span className="capitalize">{format(day, 'EEEE d MMM', { locale: es })}</span>
                        {isToday && <span className="text-xs bg-indigo-200 px-2 py-0.5 rounded-full">Hoy</span>}
                    </div>
                    
                    <div className="p-4 grid grid-cols-1 gap-3">
                        {/* Lunch */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-400 w-16">COMIDA</span>
                            {lunch ? (
                                <div 
                                    onClick={() => openModal(day, MealType.LUNCH, lunch)}
                                    className="flex-1 flex items-center justify-between bg-orange-50 px-3 py-2 rounded-lg border border-orange-100 cursor-pointer active:scale-[0.98] transition-transform"
                                >
                                    <span className="text-sm text-gray-800 font-medium truncate">{lunch.dish_name}</span>
                                    <Pencil size={14} className="text-orange-300" />
                                </div>
                            ) : (
                                <button 
                                    onClick={() => openModal(day, MealType.LUNCH)}
                                    className="flex-1 flex items-center justify-center border border-dashed border-gray-300 rounded-lg py-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors text-sm"
                                >
                                    <Plus size={16} className="mr-1" /> Añadir
                                </button>
                            )}
                        </div>

                        {/* Dinner */}
                        <div className="flex items-center justify-between">
                             <span className="text-xs font-semibold text-gray-400 w-16">CENA</span>
                             {dinner ? (
                                <div 
                                    onClick={() => openModal(day, MealType.DINNER, dinner)}
                                    className="flex-1 flex items-center justify-between bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100 cursor-pointer active:scale-[0.98] transition-transform"
                                >
                                    <span className="text-sm text-gray-800 font-medium truncate">{dinner.dish_name}</span>
                                    <Pencil size={14} className="text-indigo-300" />
                                </div>
                            ) : (
                                <button 
                                    onClick={() => openModal(day, MealType.DINNER)}
                                    className="flex-1 flex items-center justify-center border border-dashed border-gray-300 rounded-lg py-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors text-sm"
                                >
                                    <Plus size={16} className="mr-1" /> Añadir
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            );
        })}
      </div>

      {/* Add/Edit Meal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b">
                    <h3 className="text-lg font-bold text-gray-900">
                        {modalType} - {format(selectedDate, 'd MMM', { locale: es })}
                    </h3>
                </div>
                <div className="p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del plato</label>
                    <input 
                        autoFocus
                        type="text" 
                        value={dishName}
                        onChange={(e) => setDishName(e.target.value)}
                        placeholder="Ej. Tortilla de patata"
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                        {isSameWeek(selectedDate, now, { weekStartsOn: 1 }) 
                            ? "Se generarán los ingredientes automáticamente." 
                            : "Semana futura: No se añadirán ingredientes a la lista."}
                    </p>
                </div>
                <div className="p-4 bg-gray-50 flex justify-between items-center gap-2">
                    {editingMealId ? (
                        <button 
                            onClick={handleDeleteFromModal}
                            className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm font-medium px-2 py-2 rounded hover:bg-red-50 transition-colors"
                        >
                            <Trash2 size={16} />
                            Eliminar
                        </button>
                    ) : (
                        <div></div> // Spacer for layout balance
                    )}
                    
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleSaveMeal}
                            disabled={addingMeal || !dishName.trim()}
                            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                        >
                            {addingMeal && <Loader2 size={16} className="animate-spin mr-2" />}
                            Guardar
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
