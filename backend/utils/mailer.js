const nodemailer = require("nodemailer");

let transporter = null;

// Build (once) a Gmail SMTP transporter from env. Returns null if not configured
// so the app keeps working without email credentials.
function getTransporter() {
  if (transporter) {
    return transporter;
  }
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    return null;
  }
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return transporter;
}

function money(value) {
  return `₹${Number(value).toFixed(2)}`;
}

function buildOrderEmailHtml(order) {
  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;">${item.name} × ${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${money(item.lineTotal)}</td>
        </tr>`
    )
    .join("");

  const paymentLabel =
    { cod: "Cash on delivery", card: "Card", upi: "UPI" }[order.paymentMethod] ||
    order.paymentMethod;

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#0f172a;">
    <h2 style="color:#10b981;margin:0 0 6px;">Order #${order.id} confirmed ✓</h2>
    <p style="margin:0 0 16px;color:#475569;">Hi ${order.customerName}, thanks for your order! Here's your receipt.</p>

    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      ${rows}
      <tr>
        <td style="padding:8px 0;">Subtotal</td>
        <td style="padding:8px 0;text-align:right;">${money(order.subtotal)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;">Shipping</td>
        <td style="padding:4px 0;text-align:right;">${order.shipping === 0 ? "Free" : money(order.shipping)}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;font-weight:bold;border-top:2px solid #0f172a;">Total</td>
        <td style="padding:10px 0;text-align:right;font-weight:bold;border-top:2px solid #0f172a;">${money(order.total)}</td>
      </tr>
    </table>

    <h3 style="margin:20px 0 6px;font-size:15px;">Shipping to</h3>
    <p style="margin:0;color:#475569;font-size:14px;line-height:1.5;">
      ${order.addressLine}, ${order.city}${order.state ? ", " + order.state : ""} — ${order.postalCode}<br/>
      ${order.phone}
    </p>

    <p style="margin:16px 0 0;color:#475569;font-size:14px;">Payment: <strong>${paymentLabel}</strong> · Status: <strong>${order.status}</strong></p>
    <p style="margin:18px 0 0;color:#94a3b8;font-size:12px;">This is a demo order confirmation.</p>
  </div>`;
}

/**
 * Send an order confirmation email. Resolves quietly if email isn't configured.
 * Throws only on an actual send failure (callers should catch and not fail the order).
 */
async function sendOrderConfirmation(order) {
  const mailer = getTransporter();
  if (!mailer) {
    console.warn(
      "Email not configured (SMTP_USER/SMTP_PASS missing) — skipping confirmation email"
    );
    return;
  }
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  await mailer.sendMail({
    from: `"MFE Shop" <${from}>`,
    to: order.email,
    subject: `Order #${order.id} confirmed`,
    html: buildOrderEmailHtml(order),
  });
  console.log(`Confirmation email sent to ${order.email} for order #${order.id}`);
}

module.exports = { sendOrderConfirmation };
