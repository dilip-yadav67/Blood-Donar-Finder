export async function sendSms(phone, otp) {
  const p = process.env.SMS_PROVIDER || "console";
  if (p === "console") return console.log(`[DEV OTP] ${phone}: ${otp}`);

  if (p === "msg91") {
    const r = await fetch("https://control.msg91.com/api/v5/otp?" + new URLSearchParams({
      template_id: process.env.MSG91_TEMPLATE_ID, mobile: "91" + phone, otp,
    }), { method: "POST", headers: { authkey: process.env.MSG91_AUTH_KEY } });
    if (!r.ok) throw new Error("MSG91 failed");
    return;
  }
  if (p === "twilio") {
    const { TWILIO_SID: sid, TWILIO_TOKEN: tok, TWILIO_FROM: from } = process.env;
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: { Authorization: "Basic " + Buffer.from(`${sid}:${tok}`).toString("base64") },
      body: new URLSearchParams({ To: "+91" + phone, From: from, Body: `Blood Donor Finder OTP: ${otp}. 5 min mein expire hoga.` }),
    });
    if (!r.ok) throw new Error("Twilio failed");
  }
}
