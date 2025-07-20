import React from 'react';
import PartyForm from '@/components/forms/PartyForm';

const PartyCreatePage = () => {
  const handleSuccess = (party) => {
    // Navigate back to parties list
    window.location.href = '/inventory/parties';
  };

  const handleCancel = () => {
    // Navigate back to parties list
    window.location.href = '/inventory/parties';
  };

  return (
    <div className="p-6">
      <PartyForm
        mode="create"
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default PartyCreatePage;