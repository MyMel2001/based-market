import React from 'react';

const ProfilePage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">User Profile</h2>
        <p>Manage your account settings and preferences.</p>
      </div>
    </div>
  );
};

export default ProfilePage; 