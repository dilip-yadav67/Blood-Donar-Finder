export async function api(path, { method = "GET", body, token } = {}) {
  const res = await fetch("/api" + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token && { Authorization: "Bearer " + token }) },
    body: body && JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Kuch gadbad hui.");
  return data;
}

export const getPosition = () =>
  new Promise((ok, no) =>
    navigator.geolocation
      ? navigator.geolocation.getCurrentPosition((p) => ok({ lat: p.coords.latitude, lng: p.coords.longitude }), () => no(new Error("Location permission nahi mili.")), { timeout: 10000 })
      : no(new Error("Is browser mein location support nahi hai."))
  );
