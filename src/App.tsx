import React, { useState } from 'react';
import { Coffee, Droplet, Milk, Scale } from 'lucide-react';

type RoastLevel = 'Light' | 'Medium' | 'Medium-Dark' | 'Dark' | 'Italian';
type Unit = 'ml' | 'g';

interface Calculations {
  water: number;
  milk: number;
}

function App() {
  const [beanWeight, setBeanWeight] = useState<number>(18);
  const [roastLevel, setRoastLevel] = useState<RoastLevel>('Medium');
  const [ratio, setRatio] = useState<number>(2); // Default 1:2 ratio
  const [unit, setUnit] = useState<Unit>('ml');

  const calculateQuantities = (): Calculations => {
    // Calculate espresso yield in grams
    const espressoYield = beanWeight * ratio;
    // Calculate milk amount in grams (2.5x the espresso yield)
    const milkWeight = espressoYield * 2.5;
    
    // Convert to ml if needed (using density ratios)
    // Water/espresso: 1 g/ml
    // Milk: 1.03 g/ml
    return {
      water: unit === 'ml' ? espressoYield : espressoYield,
      milk: unit === 'ml' ? milkWeight / 1.03 : milkWeight
    };
  };

  const quantities = calculateQuantities();

  const brewingSteps = [
    'Grind your coffee beans to a fine espresso grind',
    'Heat your machine and portafilter',
    `Add ${beanWeight}g of ground coffee to the portafilter`,
    'Tamp the grounds evenly with about 30 pounds of pressure',
    `Extract ${quantities.water.toFixed(1)}${unit} of espresso (25-30 seconds)`,
    'While extracting, steam your milk',
    `Pour ${quantities.milk.toFixed(1)}${unit} cold milk into a pitcher`,
    'Steam until silky microfoam forms (60-65°C)',
    'Combine espresso and steamed milk with a 1cm layer of foam'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-brown-900 mb-2">Calculate Your Pefect Coffee Cup</h1>
          <p className="text-brown-600">Perfect ratios for the perfect cup</p>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bean Weight Input */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <Coffee className="w-4 h-4 mr-2" />
                Coffee Bean Weight
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={beanWeight}
                  onChange={(e) => setBeanWeight(Math.max(1, Number(e.target.value)))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  min="1"
                />
                <span className="absolute right-3 top-2 text-gray-500">g</span>
              </div>
            </div>

            {/* Roast Level Selector */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <Scale className="w-4 h-4 mr-2" />
                Roast Level
              </label>
              <select
                value={roastLevel}
                onChange={(e) => setRoastLevel(e.target.value as RoastLevel)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option>Light</option>
                <option>Medium</option>
                <option>Medium-Dark</option>
                <option>Dark</option>
                <option>Italian</option>
              </select>
            </div>

            {/* Ratio Selector */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <Droplet className="w-4 h-4 mr-2" />
                Coffee to Water Ratio
              </label>
              <select
                value={ratio}
                onChange={(e) => setRatio(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value={1.5}>1:1.5 (Stronger)</option>
                <option value={2}>1:2 (Standard)</option>
                <option value={2.5}>1:2.5 (Lighter)</option>
              </select>
            </div>

            {/* Unit Selector */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <Milk className="w-4 h-4 mr-2" />
                Measurement Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as Unit)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="ml">Milliliters (ml)</option>
                <option value="g">Grams (g)</option>
              </select>
            </div>
          </div>

          {/* Calculations Output */}
          <div className="mt-6 p-4 bg-orange-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-3">Your Recipe</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Droplet className="w-5 h-5 text-blue-500" />
                <span>Water: {quantities.water.toFixed(1)}{unit}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Milk className="w-5 h-5 text-gray-500" />
                <span>Milk: {quantities.milk.toFixed(1)}{unit}</span>
              </div>
            </div>
          </div>

          {/* Brewing Guide */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-3">Brewing Guide</h2>
            <ol className="space-y-2">
              {brewingSteps.map((step, index) => (
                <li key={index} className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-orange-100 rounded-full text-orange-800 text-sm mr-3">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
