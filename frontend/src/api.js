export async function getCurrentUser() {
  const res = await fetch("http://localhost:3001/api/me", {
    credentials: "include",
  });

  if (!res.ok) return null;

  const data = await res.json();
  return {
    id: data.user?.id,
    userName: data.user?.userName,
    supabaseToken: data.supabaseToken,
  };
}
