import React from 'react';
import { useParams } from 'react-router-dom';
import PartyForm from '@/components/forms/PartyForm';

const PartyEditPage = () => {
  const { id } = useParams();

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
        mode="edit"
        partyId={id}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default PartyEditPage;