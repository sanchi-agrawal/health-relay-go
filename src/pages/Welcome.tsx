import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Activity, Heart, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Welcome = () => {
  const navigate = useNavigate();
  const { user, userRole, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && userRole) {
      navigate(`/${userRole}-dashboard`);
    }
  }, [user, userRole, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">
          <Activity className="w-16 h-16 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-8 shadow-strong">
        <div className="text-center space-y-4">
          <div className="flex justify-center items-center gap-2 mb-6">
            <div className="relative">
              <Heart className="w-12 h-12 text-emergency animate-pulse" fill="currentColor" />
              <Activity className="w-6 h-6 text-primary absolute -top-1 -right-1" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-emergency bg-clip-text text-transparent">
            Pulse Path
          </h1>
          <p className="text-muted-foreground text-lg">
            Emergency Medical Response System
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => navigate('/login')}
            className="w-full h-12 text-lg font-semibold"
            size="lg"
          >
            Login
          </Button>

          <Button
            onClick={() => navigate('/signup-role')}
            variant="outline"
            className="w-full h-12 text-lg font-semibold"
            size="lg"
          >
            Sign Up
          </Button>
        </div>

        <div className="bg-accent/50 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Quick access to emergency medical services. Connect with hospitals and ambulances instantly.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Welcome;