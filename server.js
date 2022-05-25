const express = require("express");

//--Get configurations
require("dotenv").config();

//Create app
const app = express();

//Define routes
const sendSms = require("./routes/send-sms");
const sendPayslip = require("./routes/send-payslip");

//Middleware
app.use(express.json({ limit: "50mb" }));

app.get("/", (req, res) => {
  res.send("<h2>Application is up and running!</h2>");
});

app.use("/api/sendSms", sendSms);
app.use("/api/sendPayslip", sendPayslip);

const port = process.env.PORT || 2525;

if (!port) {
  console.error("FATAL ERROR: Port number is not configured");
  process.exit(1);
}
app.listen(port, () => {
  console.log(`Listening on port ${port}...`);

  //Get application environment
  console.log(`App is running in ${app.get("env")} environment`);
});
