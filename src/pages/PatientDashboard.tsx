import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, Heart, LogOut, Menu, User, FileText, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut, userRole, loading } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [sosDialogOpen, setSosDialogOpen] = useState(false);
  const [sosData, setSosData] = useState({
    hospitalType: 'private',
    wardType: 'general',
    preferredHospitalId: '',
    additionalNotes: '',
  });

  useEffect(() => {
    if (!loading && (!user || userRole !== 'patient')) {
      navigate('/');
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchPatientDetails();
      fetchHospitals();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user?.id)
      .single();
    setProfile(data);
  };

  const fetchPatientDetails = async () => {
    const { data } = await supabase
      .from('patient_details')
      .select('*')
      .eq('user_id', user?.id)
      .single();
    setPatientDetails(data);
  };

  const fetchHospitals = async () => {
    const { data } = await supabase
      .from('hospital_details')
      .select('*')
      .order('hospital_name');
    setHospitals(data || []);
  };

  const handleSOS = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sos_requests')
        .insert({
          patient_id: user.id,
          hospital_type: sosData.hospitalType,
          ward_type: sosData.wardType,
          preferred_hospital_id: sosData.preferredHospitalId || null,
          additional_notes: sosData.additionalNotes,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "SOS Alert Sent!",
        description: "Your emergency request has been sent to nearby hospitals. Help is on the way.",
      });

      if (patientDetails?.emergency_contact_phone) {
        toast({
          title: "Emergency Contact Notified",
          description: `Alert sent to ${patientDetails.emergency_contact_name || 'your emergency contact'}`,
        });
      }

      setSosDialogOpen(false);
      setSosData({
        hospitalType: 'private',
        wardType: 'general',
        preferredHospitalId: '',
        additionalNotes: '',
      });
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
            <Heart className="w-6 h-6 text-emergency" fill="currentColor" />
            <h1 className="text-xl font-bold">Pulse Path</h1>
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
                <SheetDescription>Patient Dashboard Menu</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 mt-6">
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/profile')}>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/medical-records')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Medical Records
                </Button>
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
          <h2 className="text-2xl font-bold mb-2">Welcome, {profile?.full_name || 'Patient'}!</h2>
          <p className="text-muted-foreground">Quick access to emergency medical services</p>
        </Card>

        <div className="flex justify-center">
          <Dialog open={sosDialogOpen} onOpenChange={setSosDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="h-32 w-32 rounded-full bg-gradient-to-br from-emergency to-emergency/80 hover:from-emergency/90 hover:to-emergency/70 shadow-strong text-2xl font-bold"
              >
                SOS
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Emergency SOS Request</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Hospital Type</Label>
                  <Select value={sosData.hospitalType} onValueChange={(value) => setSosData({ ...sosData, hospitalType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private Hospital</SelectItem>
                      <SelectItem value="government">Government Hospital</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Ward Type Required</Label>
                  <Select value={sosData.wardType} onValueChange={(value) => setSosData({ ...sosData, wardType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Ward</SelectItem>
                      <SelectItem value="icu">ICU</SelectItem>
                      <SelectItem value="maternity">Maternity</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Preferred Hospital (Optional)</Label>
                  <Select value={sosData.preferredHospitalId} onValueChange={(value) => setSosData({ ...sosData, preferredHospitalId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select hospital" />
                    </SelectTrigger>
                    <SelectContent>
                      {hospitals.map((hospital) => (
                        <SelectItem key={hospital.id} value={hospital.user_id}>
                          {hospital.hospital_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Additional Notes</Label>
                  <Textarea
                    value={sosData.additionalNotes}
                    onChange={(e) => setSosData({ ...sosData, additionalNotes: e.target.value })}
                    placeholder="Describe your emergency..."
                  />
                </div>

                <Button onClick={handleSOS} className="w-full" size="lg">
                  Send Emergency Request
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Nearby Hospitals</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {hospitals.slice(0, 6).map((hospital) => (
              <Card key={hospital.id} className="p-4 hover:shadow-medium transition-shadow">
                <h4 className="font-semibold mb-2">{hospital.hospital_name}</h4>
                <p className="text-sm text-muted-foreground mb-2">{hospital.location_address}</p>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Available Beds:</span>{' '}
                    <span className="font-semibold text-success">{hospital.available_beds}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ICU:</span>{' '}
                    <span className="font-semibold">{hospital.icu_beds}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {patientDetails && (
          <Card className="p-6 bg-accent/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Emergency Contact</p>
                {patientDetails.emergency_contact_name ? (
                  <p className="text-sm text-muted-foreground">
                    {patientDetails.emergency_contact_name} - {patientDetails.emergency_contact_phone}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No emergency contact configured. Update in Profile.
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
};

export default PatientDashboard;