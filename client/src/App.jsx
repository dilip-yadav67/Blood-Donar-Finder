import { useState, useEffect } from "react";
import { api, getPosition } from "./api.js";

const GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

function Find({ token, askLogin }) {
  const [f, setF] = useState({ group: "", km: 25, city: "" });
  const [list, setList] = useState(null);
  const [phones, setPhones] = useState({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function search(useGps) {
    setErr(""); setBusy(true);
    try {
      const p = new URLSearchParams({ group: f.group, km: f.km });
      if (useGps) { const { lat, lng } = await getPosition(); p.set("lat", lat); p.set("lng", lng); }
      else if (f.city) p.set("city", f.city);
      setList(await api("/donors/search?" + p));
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  async function reveal(id) {
    if (!token) return askLogin();
    try { const { phone } = await api(`/donors/${id}/contact`, { method: "POST", token }); setPhones((s) => ({ ...s, [id]: phone })); }
    catch (e) { setErr(e.message); }
  }

  return (
    <>
      <div className="panel">
        <div className="grid">
          <label>Blood group
            <select value={f.group} onChange={(e) => setF({ ...f, group: e.target.value })}>
              <option value="">Koi bhi</option>{GROUPS.map((g) => <option key={g}>{g}</option>)}
            </select>
          </label>
          <label>Doori (km)
            <select value={f.km} onChange={(e) => setF({ ...f, km: e.target.value })}>
              {[5, 10, 25, 50, 100].map((k) => <option key={k}>{k}</option>)}
            </select>
          </label>
        </div>
        <button className="primary big" disabled={busy} onClick={() => search(true)}>Mere paas ke donors dhundho</button>
        <div className="or">ya sheher se</div>
        <div className="grid">
          <input placeholder="Sheher / area" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
          <button onClick={() => search(false)} disabled={busy}>Dhundho</button>
        </div>
        {err && <p className="err">{err}</p>}
      </div>

      {list && !list.length && <p className="muted">Koi donor nahi mila. Doori badha ke dekho.</p>}
      {list?.map((d) => (
        <div className="donor" key={d.id}>
          <span className="grp">{d.group}</span>
          <div className="info"><b>{d.name}</b><span>{d.city}{d.distanceKm != null && ` · ${d.distanceKm} km door`}</span></div>
          {phones[d.id] ? (
            <div className="acts">
              <a className="primary" href={`tel:${phones[d.id]}`}>Call</a>
              <a href={`https://wa.me/91${phones[d.id]}?text=${encodeURIComponent(`Namaste, ${d.group} blood ki zaroorat hai. Kya aap madad kar sakte hain?`)}`} target="_blank" rel="noopener">WhatsApp</a>
            </div>
          ) : <button onClick={() => reveal(d.id)}>Number dekho</button>}
        </div>
      ))}
    </>
  );
}

function Login({ onToken }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  async function send() {
    setErr("");
    try { await api("/auth/send-otp", { method: "POST", body: { phone } }); setSent(true); } catch (e) { setErr(e.message); }
  }
  async function verify() {
    setErr("");
    try { const { token } = await api("/auth/verify-otp", { method: "POST", body: { phone, otp } }); onToken(token); } catch (e) { setErr(e.message); }
  }
  return (
    <div className="panel">
      <h2>Phone number se login</h2>
      <p className="muted">Donor banne ya kisi ka number dekhne ke liye number verify karna zaroori hai.</p>
      <label>Mobile number<input type="tel" inputMode="numeric" maxLength={10} value={phone} disabled={sent} onChange={(e) => setPhone(e.target.value)} /></label>
      {sent && <label>6 digit OTP<input inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} autoFocus /></label>}
      {err && <p className="err">{err}</p>}
      {!sent ? <button className="primary big" onClick={send}>OTP bhejo</button> : <button className="primary big" onClick={verify}>Verify karo</button>}
      {sent && <button className="link" onClick={() => { setSent(false); setOtp(""); }}>Number badlo</button>}
    </div>
  );
}

function Profile({ token, onLogout }) {
  const [p, setP] = useState({ name: "", group: "O+", city: "", lastDonated: "", available: true });
  const [pos, setPos] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api("/donors/me", { token }).then((d) => setP({ ...d, lastDonated: d.lastDonated?.slice(0, 10) || "", name: d.name || "", city: d.city || "", group: d.group || "O+" })).catch(() => onLogout());
  }, []);

  async function useGps() {
    try { setPos(await getPosition()); setMsg("Location mil gayi (sirf ~1 km tak ki approx. save hogi)."); } catch (e) { setMsg(e.message); }
  }
  async function save() {
    try { await api("/donors/me", { method: "PUT", token, body: { ...p, ...pos } }); setMsg("Save ho gaya. Shukriya 🙏"); } catch (e) { setMsg(e.message); }
  }
  async function del() {
    if (!confirm("Profile hamesha ke liye delete ho jayegi. Pakka?")) return;
    await api("/donors/me", { method: "DELETE", token }); onLogout();
  }
  const set = (k) => (e) => setP({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  return (
    <div className="panel">
      <h2>Meri donor profile</h2>
      <p className="muted">Aapka number search mein nahi dikhta. Sirf verified user, request karne par, dekh sakta hai.</p>
      <label>Naam<input value={p.name} onChange={set("name")} /></label>
      <div className="grid">
        <label>Blood group<select value={p.group} onChange={set("group")}>{GROUPS.map((g) => <option key={g}>{g}</option>)}</select></label>
        <label>Sheher / area<input value={p.city} onChange={set("city")} /></label>
      </div>
      <label>Last donation (agar yaad ho)<input type="date" value={p.lastDonated} onChange={set("lastDonated")} /></label>
      <label className="check"><input type="checkbox" checked={p.available} onChange={set("available")} /> Abhi donate karne ke liye available hoon</label>
      <button onClick={useGps}>{pos ? "Location mil gayi ✓" : "Meri location use karo"}</button>
      {msg && <p className="muted">{msg}</p>}
      <button className="primary big" onClick={save}>Save karo</button>
      <div className="row"><button className="link" onClick={onLogout}>Logout</button><button className="link danger" onClick={del}>Profile delete karo</button></div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("find");
  const [token, setToken] = useState(localStorage.getItem("bdf_token"));
  const save = (t) => { t ? localStorage.setItem("bdf_token", t) : localStorage.removeItem("bdf_token"); setToken(t); };

  return (
    <main>
      <header><h1>Blood Donor Finder</h1><p>Emergency mein apne aas-paas ka donor, seedha.</p></header>
      <nav>
        <button className={tab === "find" ? "on" : ""} onClick={() => setTab("find")}>Donor dhundho</button>
        <button className={tab === "me" ? "on" : ""} onClick={() => setTab("me")}>Donor bano</button>
      </nav>
      {tab === "find" && <Find token={token} askLogin={() => setTab("me")} />}
      {tab === "me" && (token ? <Profile token={token} onLogout={() => save(null)} /> : <Login onToken={save} />)}
    </main>
  );
}
