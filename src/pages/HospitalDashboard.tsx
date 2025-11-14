import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Building2, LogOut, Menu, Activity, Bed, Users, Ambulance as AmbulanceIcon, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

const HospitalDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut, userRole, loading } = useAuth();
  const { toast } = useToast();
  const [hospitalDetails, setHospitalDetails] = useState<any>(null);
  const [sosRequests, setSosRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && (!user || userRole !== 'hospital')) {
      navigate('/');
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchHospitalDetails();
      fetchSosRequests();
      subscribeToSosRequests();
    }
  }, [user]);

  const fetchHospitalDetails = async () => {
    const { data } = await supabase
      .from('hospital_details')
      .select('*')
      .eq('user_id', user?.id)
      .single();
    setHospitalDetails(data);
  };

  const fetchSosRequests = async () => {
    const { data } = await supabase
      .from('sos_requests')
      .select(`
        *,
        profiles:patient_id (full_name, phone),
        patient_details:patient_id (age, blood_group, allergies, medical_history)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    setSosRequests(data || []);
  };

  const subscribeToSosRequests = () => {
    const channel = supabase
      .channel('sos-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sos_requests',
        },
        () => {
          fetchSosRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('sos_requests')
        .update({
          hospital_id: user?.id,
          status: 'accepted',
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Request Accepted",
        description: "Emergency request has been accepted. Dispatching ambulance...",
      });

      fetchSosRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('sos_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Request Declined",
        description: "The emergency request has been declined.",
      });

      fetchSosRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
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
            <Building2 className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">{hospitalDetails?.hospital_name || 'Hospital Dashboard'}</h1>
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
                <SheetDescription>Hospital Dashboard Menu</SheetDescription>
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
        {hospitalDetails && (
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Available Beds</p>
                  <p className="text-3xl font-bold text-success">{hospitalDetails.available_beds}</p>
                </div>
                <Bed className="w-8 h-8 text-success" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">ICU Beds</p>
                  <p className="text-3xl font-bold">{hospitalDetails.icu_beds}</p>
                </div>
                <Activity className="w-8 h-8 text-primary" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Doctors</p>
                  <p className="text-3xl font-bold">{hospitalDetails.doctor_count}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ambulances</p>
                  <p className="text-3xl font-bold">{hospitalDetails.ambulance_count}</p>
                </div>
                <AmbulanceIcon className="w-8 h-8 text-emergency" />
              </div>
            </Card>
          </div>
        )}

        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Incoming SOS Requests</h2>
          <div className="space-y-4">
            {sosRequests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No pending emergency requests</p>
              </div>
            ) : (
              sosRequests.map((request) => (
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
                    <Badge variant="destructive">EMERGENCY</Badge>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Ward Type</p>
                      <p className="font-semibold capitalize">{request.ward_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Hospital Type</p>
                      <p className="font-semibold capitalize">{request.hospital_type}</p>
                    </div>
                    {request.patient_details && (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground">Age</p>
                          <p className="font-semibold">{request.patient_details.age || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Blood Group</p>
                          <p className="font-semibold">{request.patient_details.blood_group || 'N/A'}</p>
                        </div>
                      </>
                    )}
                  </div>

                  {request.additional_notes && (
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-1">Additional Notes</p>
                      <p className="text-sm">{request.additional_notes}</p>
                    </div>
                  )}

                  {request.patient_details?.allergies && (
                    <div className="mb-4 p-3 bg-emergency/10 rounded-md">
                      <p className="text-sm font-semibold text-emergency mb-1">Allergies</p>
                      <p className="text-sm">{request.patient_details.allergies}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAcceptRequest(request.id)}
                      className="flex-1"
                      size="lg"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Accept Request
                    </Button>
                    <Button
                      onClick={() => handleRejectRequest(request.id)}
                      variant="outline"
                      className="flex-1"
                      size="lg"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Decline
                    </Button>
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

export default HospitalDashboard;