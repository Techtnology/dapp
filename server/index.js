const Moralis = require("moralis").default;

const express = require("express");
const cors = require("cors");

const app = express();
const port = 4000;

const allowedOrigins = ['https://drainer-client.vercel.app','http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin like mobile apps or curl requests
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: "GET,PUT,POST,DELETE,PATCH,OPTIONS",
  allowedHeaders: "Content-Type,Authorization"
}));
app.use(express.json());

const MORALIS_API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjQyMDM2OTM0LTBmMjAtNDU0MS05YzY0LTg1ZWM5MTM2NDY1NCIsIm9yZ0lkIjoiMzgyNTAxIiwidXNlcklkIjoiMzkzMDI0IiwidHlwZUlkIjoiODRjMDA5MmYtOWQxMi00Zjc4LTk3MDYtMjNhY2VkN2FjMjMxIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3MTAyNzUzMjIsImV4cCI6NDg2NjAzNTMyMn0.1ifrl8ZM9f4POut7oxJCVKFY0rbI6tbTBZiTQ0nCE8Q";

app.get("/", (req, res) => {
  res.send("Hello From Server");
});

app.post("/tokens", async (req, res) => {
  const { walletAddress } = req.body;
  const response = await Moralis.EvmApi.wallets.getWalletTokenBalancesPrice({
    "chain": "0xAA36A7",
    "address": walletAddress
  });
  res.status(200).json({
    tokens: response,
  });
});

const startServer = async () => {
  await Moralis.start({
    apiKey: MORALIS_API_KEY,
  });

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
};

startServer();
