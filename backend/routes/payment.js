const router = require("express").Router();
const Stripe = require("stripe");
const auth = require("../middleware/auth");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/checkout", auth, async (req, res) => {
  const price = req.body.plan === "15" ? 500 : 800;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: "CertifyNow Pro" },
        unit_amount: price
      },
      quantity: 1
    }],
    success_url: `${process.env.FRONTEND_URL}/dashboard`,
    cancel_url: `${process.env.FRONTEND_URL}/pricing`,
    metadata: { userId: req.userId, days: req.body.plan }
  });

  res.json({ url: session.url });
});

module.exports = router;
