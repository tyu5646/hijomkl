import React from 'react';

function FilterBar({ facilitiesList, selectedFacilities, handleFacilityChange }) {
  return (
    <div className="w-full max-w-7xl mx-auto mt-6 px-4 md:px-8">
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-4 items-center border border-blue-100">
        <span className="font-semibold text-gray-700">สิ่งอำนวยความสะดวก:</span>
        {facilitiesList.map((facility) => (
          <label key={facility} className="flex items-center gap-1 text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={selectedFacilities.includes(facility)}
              onChange={() => handleFacilityChange(facility)}
              className="accent-blue-600 rounded"
            />
            <span className="text-sm">{facility}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default FilterBar;