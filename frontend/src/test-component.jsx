import React from 'react';

const TestComponent = () => {
  return (
    <div className="p-8 bg-blue-100 rounded-lg">
      <h1 className="text-2xl font-bold text-blue-800 mb-4">CSS Test</h1>
      <p className="text-gray-700">If you can see this styled properly, Tailwind CSS is working!</p>
      <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mt-4">
        Test Button
      </button>
    </div>
  );
};

export default TestComponent;