import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, User, Building2, Ambulance as AmbulanceIcon } from 'lucide-react';

const SignupRole = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 space-y-6 shadow-strong">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Choose Your Role</h1>
          <p className="text-muted-foreground">Select how you want to use Pulse Path</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card
            className="p-6 cursor-pointer hover:shadow-medium transition-all hover:scale-105 border-2 hover:border-primary"
            onClick={() => navigate('/signup-patient')}
          >
            <div className="space-y-4 text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Patient</h3>
                <p className="text-sm text-muted-foreground">
                  Access emergency services, manage medical records, and connect with hospitals
                </p>
              </div>
            </div>
          </Card>

          <Card
            className="p-6 cursor-pointer hover:shadow-medium transition-all hover:scale-105 border-2 hover:border-primary"
            onClick={() => navigate('/signup-hospital')}
          >
            <div className="space-y-4 text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Hospital</h3>
                <p className="text-sm text-muted-foreground">
                  Manage bed availability, respond to emergency requests, and coordinate with ambulances
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">Ambulance staff? Contact your hospital administrator for access credentials.</p>
        </div>
      </Card>
    </div>
  );
};

export default SignupRole;