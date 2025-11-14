import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Ambulance as AmbulanceIcon, LogOut, Menu, Activity, MapPin } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

const AmbulanceDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut, userRole, loading } = useAuth();
  const [assignedRequests, setAssignedRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && (!user || userRole !== 'ambulance')) {
      navigate('/');
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAssignedRequests();
    }
  }, [user]);

  const fetchAssignedRequests = async () => {
    const { data } = await supabase
      .from('sos_requests')
      .select(`
        *,
        profiles:patient_id (full_name, phone),
        hospital_details:hospital_id (hospital_name, location_address)
      `)
      .eq('ambulance_id', user?.id)
      .in('status', ['accepted', 'dispatched'])
      .order('created_at', { ascending: false });
    setAssignedRequests(data || []);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Activity className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="bg-card shadow-soft border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AmbulanceIcon className="w-6 h-6 text-emergency" />
            <h1 className="text-xl font-bold">Ambulance Dashboard</h1>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription>Ambulance Dashboard Menu</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 mt-6">
                <Button variant="destructive" className="w-full justify-start" onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Assigned Emergency Requests</h2>
          <div className="space-y-4">
            {assignedRequests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AmbulanceIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No active emergency assignments</p>
              </div>
            ) : (
              assignedRequests.map((request) => (
                <Card key={request.id} className="p-6 border-l-4 border-l-emergency">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {request.profiles?.full_name || 'Patient'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {request.profiles?.phone}
                      </p>
                    </div>
                    <Badge>{request.status.toUpperCase()}</Badge>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold">Destination Hospital</p>
                        <p className="text-sm text-muted-foreground">
                          {request.hospital_details?.hospital_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {request.hospital_details?.location_address}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Ward Type</p>
                        <p className="font-semibold capitalize">{request.ward_type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Request Time</p>
                        <p className="font-semibold">
                          {new Date(request.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <div className="bg-accent/30 p-4 rounded-md">
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Note:</strong> Use your GPS navigation app to navigate to the patient and hospital locations.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Contact patient at: <strong>{request.profiles?.phone}</strong>
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </Card>
      </main>
    </div>
  );
};

export default AmbulanceDashboard;