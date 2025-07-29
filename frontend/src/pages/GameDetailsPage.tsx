import React from 'react';
import { useParams } from 'react-router-dom';

const GameDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Game Details</h1>
      <p>Game ID: {id}</p>
      <div className="bg-gray-100 p-6 rounded-lg">
        <p>Game details page is under development.</p>
      </div>
    </div>
  );
};

export default GameDetailsPage; 