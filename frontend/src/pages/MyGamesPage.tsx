import React from 'react';

const MyGamesPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Games</h1>
      <div className="bg-gray-100 p-6 rounded-lg">
        <p>Your purchased games will appear here.</p>
      </div>
    </div>
  );
};

export default MyGamesPage; 