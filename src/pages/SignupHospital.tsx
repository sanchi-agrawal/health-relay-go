import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const hospitalSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6),
  hospitalName: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(10).max(15),
  locationAddress: z.string().trim().min(1).max(500),
  totalBeds: z.number().min(0),
});

const SignupHospital = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    hospitalName: '',
    phone: '',
    locationAddress: '',
    totalBeds: '',
    icuBeds: '',
    generalWardBeds: '',
    maternityBeds: '',
    doctorCount: '',
    ambulanceCount: '',
    registrationNumber: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = hospitalSchema.safeParse({
      ...formData,
      totalBeds: parseInt(formData.totalBeds) || 0,
    });

    if (!result.success) {
      const fieldErrors: any = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0]] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    const { error: signUpError } = await signUp(
      formData.email,
      formData.password,
      formData.hospitalName,
      formData.phone
    );

    if (signUpError) {
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase.from('user_roles').insert({
        user_id: user.id,
        role: 'hospital',
      });

      const totalBeds = parseInt(formData.totalBeds) || 0;
      
      await supabase.from('hospital_details').insert({
        user_id: user.id,
        hospital_name: formData.hospitalName,
        email: formData.email,
        location_address: formData.locationAddress,
        total_beds: totalBeds,
        available_beds: totalBeds,
        icu_beds: parseInt(formData.icuBeds) || 0,
        general_ward_beds: parseInt(formData.generalWardBeds) || 0,
        maternity_beds: parseInt(formData.maternityBeds) || 0,
        doctor_count: parseInt(formData.doctorCount) || 0,
        ambulance_count: parseInt(formData.ambulanceCount) || 0,
        registration_number: formData.registrationNumber || null,
      });

      toast({
        title: "Hospital registered!",
        description: "Welcome to Pulse Path. Redirecting to your dashboard...",
      });

      setTimeout(() => {
        navigate('/hospital-dashboard');
      }, 1500);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 shadow-strong">
          <Button
            variant="ghost"
            onClick={() => navigate('/signup-role')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="text-center space-y-2 mb-6">
            <h1 className="text-3xl font-bold">Hospital Registration</h1>
            <p className="text-muted-foreground">Register your hospital on Pulse Path</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Hospital Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="hospitalName">Hospital Name *</Label>
                <Input
                  id="hospitalName"
                  value={formData.hospitalName}
                  onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                  required
                />
                {errors.hospitalName && <p className="text-sm text-destructive">{errors.hospitalName}</p>}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="locationAddress">Location Address *</Label>
                <Input
                  id="locationAddress"
                  value={formData.locationAddress}
                  onChange={(e) => setFormData({ ...formData, locationAddress: e.target.value })}
                  placeholder="Complete hospital address"
                  required
                />
                {errors.locationAddress && <p className="text-sm text-destructive">{errors.locationAddress}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationNumber">Registration Number</Label>
                <Input
                  id="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Capacity Information</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalBeds">Total Beds *</Label>
                  <Input
                    id="totalBeds"
                    type="number"
                    value={formData.totalBeds}
                    onChange={(e) => setFormData({ ...formData, totalBeds: e.target.value })}
                    required
                  />
                  {errors.totalBeds && <p className="text-sm text-destructive">{errors.totalBeds}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="icuBeds">ICU Beds</Label>
                  <Input
                    id="icuBeds"
                    type="number"
                    value={formData.icuBeds}
                    onChange={(e) => setFormData({ ...formData, icuBeds: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="generalWardBeds">General Ward Beds</Label>
                  <Input
                    id="generalWardBeds"
                    type="number"
                    value={formData.generalWardBeds}
                    onChange={(e) => setFormData({ ...formData, generalWardBeds: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maternityBeds">Maternity Beds</Label>
                  <Input
                    id="maternityBeds"
                    type="number"
                    value={formData.maternityBeds}
                    onChange={(e) => setFormData({ ...formData, maternityBeds: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="doctorCount">Number of Doctors</Label>
                  <Input
                    id="doctorCount"
                    type="number"
                    value={formData.doctorCount}
                    onChange={(e) => setFormData({ ...formData, doctorCount: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ambulanceCount">Number of Ambulances</Label>
                  <Input
                    id="ambulanceCount"
                    type="number"
                    value={formData.ambulanceCount}
                    onChange={(e) => setFormData({ ...formData, ambulanceCount: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? 'Registering Hospital...' : 'Register Hospital'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default SignupHospital;