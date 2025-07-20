import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Building, User, Phone, Mail, MapPin, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { partyService } from '@/services/api';
import { useUserActivity } from '@/contexts/UserActivityContext';
import toast from 'react-hot-toast';

const PartyViewPage = () => {
  const { id } = useParams();
  const { userActivity } = useUserActivity();
  const [party, setParty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParty();
  }, [id]);

  const loadParty = async () => {
    try {
      setLoading(true);
      const response = await partyService.get(id);
      if (response.success) {
        setParty(response.data);
      }
    } catch (error) {
      console.error('Error loading party:', error);
      toast.error('Failed to load party details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    window.location.href = `/inventory/parties/${id}/edit`;
  };

  const handleBack = () => {
    window.location.href = '/inventory/parties';
  };

  const getPartyTypeIcon = (type) => {
    switch (type) {
      case 'supplier':
        return <Building className="h-4 w-4" />;
      case 'customer':
        return <User className="h-4 w-4" />;
      case 'both':
        return <div className="flex gap-1"><Building className="h-3 w-3" /><User className="h-3 w-3" /></div>;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getPartyTypeBadgeVariant = (type) => {
    switch (type) {
      case 'supplier':
        return 'default';
      case 'customer':
        return 'secondary';
      case 'both':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (!userActivity.current_company) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <div className="text-center py-8">
            <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Company Selected</h3>
            <p className="text-muted-foreground">
              Please activate a company to view parties.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading party details...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!party) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-medium mb-2">Party Not Found</h3>
            <p className="text-muted-foreground">
              The requested party could not be found.
            </p>
            <Button onClick={handleBack} className="mt-4">
              Back to Parties
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{party.name}</h1>
            <p className="text-muted-foreground">Party Details</p>
          </div>
        </div>
        <Button onClick={handleEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Party
        </Button>
      </div>

      {/* Basic Information */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Party Type</label>
            <Badge variant={getPartyTypeBadgeVariant(party.party_type)} className="flex items-center gap-1 w-fit">
              {getPartyTypeIcon(party.party_type)}
              {party.party_type_display}
            </Badge>
          </div>
          
          {party.contact_person && (
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Contact Person</label>
              <p className="text-sm">{party.contact_person}</p>
            </div>
          )}
          
          {party.phone && (
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Phone</label>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">{party.phone}</p>
              </div>
            </div>
          )}
          
          {party.email && (
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">{party.email}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Address Information */}
      {(party.address_line_1 || party.city) && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Address Information</h3>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
            <div className="text-sm">
              {party.address_line_1 && <p>{party.address_line_1}</p>}
              {party.address_line_2 && <p>{party.address_line_2}</p>}
              {(party.city || party.postal_code) && (
                <p>
                  {party.city}{party.postal_code && ` - ${party.postal_code}`}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Business Information */}
      {(party.ntn || party.strn) && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Business Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {party.ntn && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">NTN</label>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-mono">{party.ntn}</p>
                </div>
              </div>
            )}
            
            {party.strn && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">STRN</label>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-mono">{party.strn}</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Metadata */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-muted-foreground">
          <div>
            <label className="block text-sm font-medium mb-1">Created By</label>
            <p>{party.created_by_name || 'Unknown'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Created At</label>
            <p>{new Date(party.created_at).toLocaleString()}</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Company</label>
            <p>{party.company_name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <Badge variant={party.is_active ? 'default' : 'secondary'}>
              {party.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PartyViewPage;