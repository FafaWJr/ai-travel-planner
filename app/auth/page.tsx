import { redirect } from 'next/navigation';

interface Props {
  searchParams: Promise<{ code?: string; token?: string; token_hash?: string; type?: string }>;
}

export default async function AuthIndexPage({ searchParams }: Props) {
  const params = await searchParams;
  const { code, token, token_hash, type } = params;

  if (code) {
    redirect(`/auth/callback?code=${code}`);
  }

  const tok = token_hash ?? token;
  if (tok && type) {
    redirect(`/auth/callback?token_hash=${tok}&type=${type}`);
  }

  redirect('/auth/login');
}
