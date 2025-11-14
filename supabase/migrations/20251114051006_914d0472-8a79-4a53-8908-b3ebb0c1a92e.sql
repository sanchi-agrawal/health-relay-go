-- Create user role enum
CREATE TYPE public.app_role AS ENUM ('patient', 'hospital', 'ambulance');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create patient_details table
CREATE TABLE public.patient_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  gender TEXT,
  age INTEGER,
  blood_group TEXT,
  allergies TEXT,
  medical_history TEXT,
  current_medications TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.patient_details ENABLE ROW LEVEL SECURITY;

-- Create hospital_details table
CREATE TABLE public.hospital_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  hospital_name TEXT NOT NULL,
  email TEXT NOT NULL,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_address TEXT,
  total_beds INTEGER NOT NULL DEFAULT 0,
  available_beds INTEGER NOT NULL DEFAULT 0,
  icu_beds INTEGER DEFAULT 0,
  general_ward_beds INTEGER DEFAULT 0,
  maternity_beds INTEGER DEFAULT 0,
  doctor_count INTEGER DEFAULT 0,
  ambulance_count INTEGER DEFAULT 0,
  specialties TEXT[],
  registration_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.hospital_details ENABLE ROW LEVEL SECURITY;

-- Create sos_requests table
CREATE TABLE public.sos_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  hospital_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ambulance_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  hospital_type TEXT NOT NULL CHECK (hospital_type IN ('private', 'government')),
  ward_type TEXT NOT NULL,
  preferred_hospital_id UUID,
  additional_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'dispatched', 'completed', 'cancelled')),
  patient_location_lat DOUBLE PRECISION,
  patient_location_lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sos_requests ENABLE ROW LEVEL SECURITY;

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sos_request_id UUID REFERENCES public.sos_requests(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for patient_details
CREATE POLICY "Patients can view their own details"
  ON public.patient_details FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Patients can update their own details"
  ON public.patient_details FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Patients can insert their own details"
  ON public.patient_details FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Hospitals can view patient details in SOS requests"
  ON public.patient_details FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sos_requests
      WHERE sos_requests.patient_id = patient_details.user_id
      AND (sos_requests.hospital_id = auth.uid() OR sos_requests.status = 'pending')
    )
  );

-- RLS Policies for hospital_details
CREATE POLICY "Hospitals can manage their own details"
  ON public.hospital_details FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view hospital details"
  ON public.hospital_details FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for sos_requests
CREATE POLICY "Patients can view their own SOS requests"
  ON public.sos_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

CREATE POLICY "Patients can create SOS requests"
  ON public.sos_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can update their own SOS requests"
  ON public.sos_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = patient_id);

CREATE POLICY "Hospitals can view SOS requests"
  ON public.sos_requests FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'hospital') OR
    auth.uid() = patient_id OR
    auth.uid() = hospital_id OR
    auth.uid() = ambulance_id
  );

CREATE POLICY "Hospitals can update SOS requests"
  ON public.sos_requests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'hospital'));

CREATE POLICY "Ambulances can view their assigned SOS requests"
  ON public.sos_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = ambulance_id);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages for their SOS requests"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sos_requests
      WHERE sos_requests.id = chat_messages.sos_request_id
      AND (
        sos_requests.patient_id = auth.uid() OR
        sos_requests.hospital_id = auth.uid() OR
        sos_requests.ambulance_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can send messages in their SOS requests"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.sos_requests
      WHERE sos_requests.id = chat_messages.sos_request_id
      AND (
        sos_requests.patient_id = auth.uid() OR
        sos_requests.hospital_id = auth.uid() OR
        sos_requests.ambulance_id = auth.uid()
      )
    )
  );

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile automatically
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patient_details_updated_at
  BEFORE UPDATE ON public.patient_details
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hospital_details_updated_at
  BEFORE UPDATE ON public.hospital_details
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sos_requests_updated_at
  BEFORE UPDATE ON public.sos_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for SOS requests and chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;