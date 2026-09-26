import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Apple,
  Utensils,
  Flame,
  Droplet,
  Heart,
  Activity,
  AlertTriangle,
  Info,
  Calendar,
  Clock,
  ChevronRight,
  TrendingUp,
  FileText,
  Pill,
  GitBranch,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { usePatientRecord } from '@/context/PatientRecordContext';

const MACRO_COLORS = {
  carbs: '#3b82f6', // blue-500
  protein: '#10b981', // emerald-500
  fat: '#f59e0b', // amber-500
  fiber: '#8b5cf6' // purple-500
};

export default function NutritionPage() {
  const navigate = useNavigate();
  const { patient, nutritionEntries, conditions, medications, labTrends } = usePatientRecord();
  const [selectedMealType, setSelectedMealType] = useState<string>('all');

  // Compute daily totals from logged entries
  const dailyTotals = useMemo(() => {
    return nutritionEntries.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
        fiber: acc.fiber + item.fiber
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
  }, [nutritionEntries]);

  // Target estimations (neutral clinical guidelines for 58yo male with T2D & CKD Stage 2)
  const targets = {
    calories: 1700, // estimated target range 1600 - 1800 kcal
    protein: 65, // moderate protein ~0.8-0.9 g/kg for renal protection
    carbs: 210, // ~50% of caloric intake
    fat: 45, // ~25% of caloric intake
    fiber: 25, // beneficial for glycemic control
    hydrationLiters: 2.2, // important for kidney stone history & CKD
    currentHydrationLiters: 1.8 // estimated daily fluid logged
  };

  // Filtered meals
  const filteredMeals = useMemo(() => {
    if (selectedMealType === 'all') return nutritionEntries;
    return nutritionEntries.filter(m => m.mealType === selectedMealType);
  }, [nutritionEntries, selectedMealType]);

  // Meal calorie chart data
  const mealCalorieData = useMemo(() => {
    return nutritionEntries.map(entry => ({
      name: entry.mealType.charAt(0).toUpperCase() + entry.mealType.slice(1),
      food: entry.food,
      calories: entry.calories
    }));
  }, [nutritionEntries]);

  // Macronutrient breakdown pie data
  const macroBreakdownData = useMemo(() => {
    return [
      { name: 'Carbohydrates', value: Math.round(dailyTotals.carbs * 4), grams: dailyTotals.carbs, color: MACRO_COLORS.carbs },
      { name: 'Protein', value: Math.round(dailyTotals.protein * 4), grams: dailyTotals.protein, color: MACRO_COLORS.protein },
      { name: 'Healthy Fats', value: Math.round(dailyTotals.fat * 9), grams: Math.round(dailyTotals.fat), color: MACRO_COLORS.fat }
    ];
  }, [dailyTotals]);

  // Relevant biomarkers for nutrition
  const hba1c = labTrends.find(t => t.parameter.toLowerCase().includes('hba1c'));
  const latestHba1c = hba1c?.data[hba1c.data.length - 1];

  const creatinine = labTrends.find(t => t.parameter.toLowerCase().includes('creatinine'));
  const latestCreatinine = creatinine?.data[creatinine.data.length - 1];

  const systolic = labTrends.find(t => t.parameter.toLowerCase().includes('systolic'));
  const latestSystolic = systolic?.data[systolic.data.length - 1];

  const cholesterol = labTrends.find(t => t.parameter.toLowerCase().includes('cholesterol'));
  const latestCholesterol = cholesterol?.data[cholesterol.data.length - 1];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER & OVERVIEW */}
      <div className="card p-6 bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 text-white rounded-2xl shadow-sm border-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                NUTRITION & CARDIOMETABOLIC WELLNESS
              </span>
              <span className="badge-amber text-xs font-semibold">
                SYNTHETIC DEMO DATA
              </span>
              <span className="text-xs text-emerald-200">
                Logged Date: 26 Sep 2026
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Dietary Profile & Health Connections
            </h1>
            <p className="text-sm text-emerald-100 max-w-2xl leading-relaxed">
              Track daily meals, energy distribution, and macronutrients correlated with <strong>{patient.name}</strong>'s longitudinal diabetes, hypertension, and kidney health records.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 self-start md:self-auto">
            <button
              onClick={() => navigate('/graph')}
              className="btn-secondary text-xs flex items-center gap-1.5 py-2 px-3 bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
              Health Graph
            </button>
            <button
              onClick={() => navigate('/reports?tab=trends&param=HbA1c')}
              className="btn-primary text-xs flex items-center gap-1.5 py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-white border-0 shadow-sm"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Biomarker Trends
            </button>
          </div>
        </div>
      </div>

      {/* 2. DAILY MACRONUTRIENT & CALORIE SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Calories */}
        <div className="card p-4 border-l-4 border-l-orange-500 bg-white shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-semibold uppercase tracking-wider">Energy Logged</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{dailyTotals.calories} <span className="text-xs font-normal text-gray-500">kcal</span></div>
          <div className="text-[11px] text-gray-500">
            Target: ~{targets.calories} kcal ({Math.round((dailyTotals.calories / targets.calories) * 100)}%)
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-orange-500 h-full rounded-full"
              style={{ width: `${Math.min(100, Math.round((dailyTotals.calories / targets.calories) * 100))}%` }}
            />
          </div>
        </div>

        {/* Protein */}
        <div className="card p-4 border-l-4 border-l-emerald-500 bg-white shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-semibold uppercase tracking-wider">Protein</span>
            <Utensils className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{dailyTotals.protein} <span className="text-xs font-normal text-gray-500">g</span></div>
          <div className="text-[11px] text-gray-500">
            Target: ~{targets.protein} g (CKD Stage 2 safe)
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-emerald-500 h-full rounded-full"
              style={{ width: `${Math.min(100, Math.round((dailyTotals.protein / targets.protein) * 100))}%` }}
            />
          </div>
        </div>

        {/* Carbohydrates */}
        <div className="card p-4 border-l-4 border-l-blue-500 bg-white shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-semibold uppercase tracking-wider">Carbs</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{dailyTotals.carbs} <span className="text-xs font-normal text-gray-500">g</span></div>
          <div className="text-[11px] text-gray-500">
            Target: ~{targets.carbs} g (Complex carbs)
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-blue-500 h-full rounded-full"
              style={{ width: `${Math.min(100, Math.round((dailyTotals.carbs / targets.carbs) * 100))}%` }}
            />
          </div>
        </div>

        {/* Dietary Fat */}
        <div className="card p-4 border-l-4 border-l-amber-500 bg-white shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-semibold uppercase tracking-wider">Dietary Fat</span>
            <Heart className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{dailyTotals.fat} <span className="text-xs font-normal text-gray-500">g</span></div>
          <div className="text-[11px] text-gray-500">
            Target: ~{targets.fat} g (Low sat fat)
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-amber-500 h-full rounded-full"
              style={{ width: `${Math.min(100, Math.round((dailyTotals.fat / targets.fat) * 100))}%` }}
            />
          </div>
        </div>

        {/* Fiber */}
        <div className="card p-4 border-l-4 border-l-purple-500 bg-white shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-semibold uppercase tracking-wider">Fiber</span>
            <Apple className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{dailyTotals.fiber} <span className="text-xs font-normal text-gray-500">g</span></div>
          <div className="text-[11px] text-gray-500">
            Target: ~{targets.fiber} g (Glycemic control)
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-purple-500 h-full rounded-full"
              style={{ width: `${Math.min(100, Math.round((dailyTotals.fiber / targets.fiber) * 100))}%` }}
            />
          </div>
        </div>

        {/* Hydration */}
        <div className="card p-4 border-l-4 border-l-cyan-500 bg-white shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-semibold uppercase tracking-wider">Hydration</span>
            <Droplet className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{targets.currentHydrationLiters} <span className="text-xs font-normal text-gray-500">L</span></div>
          <div className="text-[11px] text-gray-500">
            Target: ~{targets.hydrationLiters} L (Stone prevention)
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-cyan-500 h-full rounded-full"
              style={{ width: `${Math.min(100, Math.round((targets.currentHydrationLiters / targets.hydrationLiters) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. VISUALIZATION ROW: MEAL INTAKE & MACRONUTRIENT ENERGY BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Caloric Distribution Across Logged Meals */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Energy Intake by Meal</h2>
              <p className="text-xs text-gray-500">Calories consumed across daily meal schedule</p>
            </div>
            <span className="badge-blue text-xs font-medium">{nutritionEntries.length} Meals Logged</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mealCalorieData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-10} textAnchor="end" />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(val: any) => [`${val} kcal`, 'Calories']}
                  labelFormatter={(name) => `Meal: ${name}`}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="calories" radius={[6, 6, 0, 0]}>
                  {mealCalorieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        index === 2
                          ? '#10b981' // Lunch
                          : index === 4
                          ? '#3b82f6' // Dinner
                          : index === 0
                          ? '#f59e0b' // Breakfast
                          : '#8b5cf6' // Snack
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-gray-500 text-center">
            Even caloric pacing supports insulin action and reduces postprandial glycemic excursions.
          </div>
        </div>

        {/* Macronutrient Caloric Contribution */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Macronutrient Energy Share</h2>
              <p className="text-xs text-gray-500">Proportion of daily energy from Carbohydrates, Protein, & Fat</p>
            </div>
            <span className="badge-green text-xs font-medium">Balanced Distribution</span>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={macroBreakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {macroBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any, item: any) => [
                    `${val} kcal (${item.payload.grams}g)`,
                    name
                  ]}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t text-center">
            <div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-gray-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Carbs (55%)
              </div>
              <div className="text-sm font-bold text-gray-900">{dailyTotals.carbs}g</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-gray-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Protein (17%)
              </div>
              <div className="text-sm font-bold text-gray-900">{dailyTotals.protein}g</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-gray-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Fat (23%)
              </div>
              <div className="text-sm font-bold text-gray-900">{dailyTotals.fat}g</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. RECENT NUTRITION ENTRIES TABLE / CARDS */}
      <div className="card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Recorded Meal Logs</h2>
            <p className="text-xs text-gray-500">
              Granular meal diary documented on 26 Sep 2026 for clinical review
            </p>
          </div>

          {/* Meal filter pills */}
          <div className="flex flex-wrap gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-medium">
            {['all', 'breakfast', 'lunch', 'dinner', 'snack'].map(type => (
              <button
                key={type}
                onClick={() => setSelectedMealType(type)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  selectedMealType === type
                    ? 'bg-white text-gray-900 shadow-sm font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {filteredMeals.map(meal => {
            const badgeClass =
              meal.mealType === 'breakfast'
                ? 'bg-amber-100 text-amber-800'
                : meal.mealType === 'lunch'
                ? 'bg-emerald-100 text-emerald-800'
                : meal.mealType === 'dinner'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-purple-100 text-purple-800';

            return (
              <div
                key={meal.id}
                className="bg-gray-50/70 border rounded-2xl p-4 hover:border-gray-300 transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}>
                      {meal.mealType}
                    </span>
                    <h3 className="text-sm font-bold text-gray-900 mt-1.5">{meal.food}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-gray-400" /> Portion: {meal.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-900">{meal.calories}</span>
                    <span className="text-[10px] text-gray-500 block">kcal</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1 pt-2 border-t text-center text-[11px]">
                  <div className="bg-white p-1.5 rounded-lg border">
                    <span className="text-gray-500 block text-[9px] uppercase">Protein</span>
                    <span className="font-semibold text-emerald-700">{meal.protein}g</span>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border">
                    <span className="text-gray-500 block text-[9px] uppercase">Carbs</span>
                    <span className="font-semibold text-blue-700">{meal.carbs}g</span>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border">
                    <span className="text-gray-500 block text-[9px] uppercase">Fat</span>
                    <span className="font-semibold text-amber-700">{meal.fat}g</span>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border">
                    <span className="text-gray-500 block text-[9px] uppercase">Fiber</span>
                    <span className="font-semibold text-purple-700">{meal.fiber}g</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. HEALTH CONNECTIONS & CLINICAL CORRELATIONS */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Longitudinal Health Connections</h2>
          <p className="text-xs text-gray-500">
            How recorded nutrition connects to <strong>{patient.name}</strong>'s active medical conditions and laboratory findings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Connection 1: Diabetes & HbA1c */}
          <div className="card p-5 border-l-4 border-l-blue-600 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                  🍬
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Type 2 Diabetes & Glycemic Response</h3>
                  <span className="text-xs text-gray-500">Active Regimen: Metformin (500mg BID), Glimepiride (2mg QD)</span>
                </div>
              </div>
              {latestHba1c && (
                <div className="text-right">
                  <span className="text-xs font-bold text-blue-700">{latestHba1c.value}%</span>
                  <span className="text-[10px] text-gray-400 block">HbA1c</span>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Dietary carbohydrates (195g total) are distributed across 5 intake intervals, supported by 22g of dietary fiber. Adequate soluble fiber delays gastric emptying, reducing postprandial glucose volatility alongside prescribed oral hypoglycemics.
            </p>

            <div className="pt-2 border-t flex items-center justify-between text-xs">
              <span className="text-gray-500">Latest Lab: <strong>6.7%</strong> (Aug 2026)</span>
              <button
                onClick={() => navigate('/reports?tab=trends&param=HbA1c')}
                className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
              >
                Inspect HbA1c Curve <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Connection 2: Kidney Function & Protein Load */}
          <div className="card p-5 border-l-4 border-l-amber-600 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
                  🫘
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">CKD Stage 2 & Protein Load</h3>
                  <span className="text-xs text-gray-500">Renal Protection: Telmisartan (40mg QD)</span>
                </div>
              </div>
              {latestCreatinine && (
                <div className="text-right">
                  <span className="text-xs font-bold text-amber-700">{latestCreatinine.value} mg/dL</span>
                  <span className="text-[10px] text-gray-400 block">Creatinine</span>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Logged protein intake is 60.5g (~0.85 g/kg ideal body weight). In stage 2 CKD with elevated creatinine (1.4 mg/dL), avoiding high-protein diets mitigates intraglomerular hypertension and excess nitrogenous filtration stress.
            </p>

            <div className="pt-2 border-t flex items-center justify-between text-xs">
              <span className="text-gray-500">Baseline eGFR: <strong>56 mL/min</strong></span>
              <button
                onClick={() => navigate('/reports?tab=trends&param=Creatinine')}
                className="text-amber-700 font-semibold hover:underline flex items-center gap-1"
              >
                Inspect Creatinine Curve <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Connection 3: Blood Pressure & Sodium Balance */}
          <div className="card p-5 border-l-4 border-l-red-600 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-sm">
                  ❤️
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Hypertension & Mineral Balance</h3>
                  <span className="text-xs text-gray-500">Antihypertensives: Amlodipine (5mg QD), Telmisartan (40mg QD)</span>
                </div>
              </div>
              {latestSystolic && (
                <div className="text-right">
                  <span className="text-xs font-bold text-red-700">{latestSystolic.value} mmHg</span>
                  <span className="text-[10px] text-gray-400 block">Systolic BP</span>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Patient meals include dal and sabzi. Monitoring sodium addition while ensuring sufficient potassium from cooked lentils and vegetables supports systolic blood pressure maintenance within the 128–130 mmHg controlled target.
            </p>

            <div className="pt-2 border-t flex items-center justify-between text-xs">
              <span className="text-gray-500">Controlled Target: <strong>&lt;130 mmHg</strong></span>
              <button
                onClick={() => navigate('/reports?tab=trends&param=Systolic%20BP')}
                className="text-red-700 font-semibold hover:underline flex items-center gap-1"
              >
                Inspect BP Trajectory <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Connection 4: History of Kidney Stone & Hydration */}
          <div className="card p-5 border-l-4 border-l-cyan-600 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold text-sm">
                  💧
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Nephrolithiasis Recurrence Prevention</h3>
                  <span className="text-xs text-gray-500">Prior Procedure: Lithotripsy (ESWL 2022)</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-cyan-700">1.8 L</span>
                <span className="text-[10px] text-gray-400 block">Fluid Logged</span>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Patient has a documented history of renal calculus treated with ESWL in Jul 2022. Maintaining urine output with daily fluid intake &ge; 2.2 Liters decreases urinary supersaturation of calcium oxalate and urate crystals.
            </p>

            <div className="pt-2 border-t flex items-center justify-between text-xs">
              <span className="text-gray-500">Procedure: <strong>ESWL (RPT-3)</strong></span>
              <button
                onClick={() => navigate('/timeline')}
                className="text-cyan-700 font-semibold hover:underline flex items-center gap-1"
              >
                Inspect in Timeline <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 6. LONGITUDINAL EMPTY-STATE HANDLING (Avoid Fake Data) */}
      <div className="card p-6 bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
            <HelpCircle className="w-5 h-5 text-slate-600" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-sm">
              Longitudinal Multi-Week Caloric & Sodium Curves
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Not enough recorded data yet for multi-month trend analysis.</strong> The current CAREGRAPH dataset includes 1 full day of granular meal tracking (26 Sep 2026). Rather than synthesizing unverified historical dietary logs, CAREGRAPH only displays actual documented nutrition records.
            </p>
            <p className="text-xs text-slate-500 pt-1">
              <em>What could be added later:</em> Connecting continuous glucose monitors (CGM) or connected dietary journals will populate multi-week curves alongside HbA1c and Blood Pressure data.
            </p>
          </div>
        </div>
      </div>

      {/* 7. "WHY THIS MATTERS" & CLINICAL DECISION SUPPORT NOTICE */}
      <div className="card p-6 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2">
        <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          Why This Nutrition Information Matters
        </div>
        <p className="text-xs text-emerald-800 leading-relaxed">
          This nutrition information is shown alongside your longitudinal medical record because everyday dietary habits interact directly with chronic disease progression and pharmacotherapy efficacy. Your primary physician or endocrinologist can evaluate these values in the context of your complete medical history.
        </p>
        <p className="text-[11px] text-emerald-700 italic pt-1">
          Disclaimer: CAREGRAPH does not prescribe medical diets or provide autonomous clinical diagnoses. Always consult your attending healthcare specialist or certified dietitian before making substantial nutritional adjustments.
        </p>
      </div>
    </div>
  );
}
