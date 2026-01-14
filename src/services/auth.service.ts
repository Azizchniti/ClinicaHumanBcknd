// user.service.ts
import supabase from '../integration/supabase.client';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const signUpUser = async (
  email: string,
  password: string,
  role: string,
  firstName: string,
  lastName: string,
  upline_id?: string,
  cpf?: string,
  phone?: string
) => {
  console.log('Received upline_id in backend:', upline_id);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw new Error(error.message);

  const user = data?.user;
  if (!user) throw new Error('User sign-up failed');

  // 👉 Validate upline & limits if role is 'member'
  if (role === 'member') {
    if (upline_id) {
      const { data: upline, error: uplineError } = await supabase
        .from('members')
        .select('id')
        .eq('id', upline_id)
        .is('upline_id', null)
        .single();

      if (uplineError || !upline) {
        console.error('Upline not found or error:', uplineError);
        throw new Error('Invalid upline_id: root member not found');
      }

      const { count, error: countError } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('upline_id', upline_id);

      if (countError) {
        console.error('Count error details:', countError);
        throw new Error('Failed to check associate limit: ' + JSON.stringify(countError));
      }

      if (count !== null && count >= 12) {
        throw new Error('Cannot register: Max 12 associates allowed under this member');
      }

    } else {
      const { count, error: countError } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .is('upline_id', null);

      if (countError) {
        console.error('Count error details:', countError);
        throw new Error('Failed to check member limit: ' + JSON.stringify(countError));
      }

      if (count !== null && count >= 12) {
        throw new Error('Cannot register: Max 12 members allowed in the system');
      }
    }
  }

  // ✅ Insert into profiles (trigger will handle members insert if role is 'member')
  const profileData: any = {
    id: user.id,
    email,
    role,
    first_name: firstName,
    last_name: lastName,
    upline_id,
    cpf,
    phone
   // status: 'pending'
  };
console.log('Inserting profileData into Supabase:', profileData);
  const { error: profileInsertError } = await supabase.from('profiles').insert([profileData]);

  if (profileInsertError) {
    console.error('Profile insert error details:', profileInsertError);
    throw new Error('Failed to insert user details: ' + (profileInsertError.message || profileInsertError.details || JSON.stringify(profileInsertError)));
  }

  return user;
};


export const signInUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Supabase sign-in error:", error.message);
    throw new Error(error.message);
  }

  const user = data?.user;
  if (!user) throw new Error('User not found after login.');

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not defined.');

  // ✅ Fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('first_name, last_name, role')
    .eq('id', user.id)
    .single();

  if (profileError) {
    throw new Error('Erro ao buscar perfil: ' + profileError.message);
  }

  // ✅ If role is member, check their status in members table
  if (profile.role === 'member') {
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('status')
      .eq('id', user.id)
      .single();

    if (memberError || !member) {
      throw new Error("Membro não encontrado.");
    }

    if (member.status === 'pending') {
      throw new Error("Sua conta ainda não foi aprovada.");
    }

    if (member.status === 'rejected') {
      throw new Error("Sua conta foi rejeitada pelo administrador.");
    }
  }

  // ✅ Issue JWT if everything is valid
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: profile.role,
      first_name: profile.first_name,
      last_name: profile.last_name,
    },
    secret,
    { expiresIn: '5h' }
  );

  return { user: { ...profile, id: user.id, email: user.email }, token };
};


export const getCurrentUser = async (token: string) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET!);

  const { id } = decoded as any;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id,first_name, last_name, role, email')
    .eq('id', id)
    .maybeSingle();

  if (profileError) throw new Error('Error fetching user profile: ' + profileError.message);
  if (!profile) throw new Error('User not found');

  return profile;
};

export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
  return { message: 'Logged out successfully' };
};
// In user.service.ts
export const inviteUser = async (
  email: string,
  role: string,
  firstName: string,
  lastName: string,
  upline_id?: string,
  cpf?: string,
  phone?: string
) => {
  // Invite user, no password needed here
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email);
  if (error) throw new Error(error.message);

  // Insert profile data like before
  const profileData = {
    email,
    role,
    first_name: firstName,
    last_name: lastName,
    upline_id: upline_id || null,
    cpf: cpf || null,
    phone: phone || null,
  };

  const { error: profileError } = await supabase.from('profiles').insert([profileData]);
  if (profileError) throw new Error(profileError.message);

  return data;
};

export const changePassword = async (userId: string, newPassword: string) => {
  if (!newPassword || newPassword.length < 6) {
    throw new Error("A nova senha deve conter no mínimo 6 caracteres.");
  }

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) {
    console.error("Erro ao alterar a senha:", error.message);
    throw new Error("Não foi possível alterar a senha.");
  }

  return { message: "Senha alterada com sucesso." };
};
export const requestPasswordReset = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "https://hub.agenciafocomkt.com.br/reset-password",
  });

  if (error) {
    console.error("Erro ao enviar e-mail de redefinição:", error.message);
    throw new Error("Não foi possível enviar o link de redefinição.");
  }

  return { message: "Link de redefinição enviado com sucesso." };
};

