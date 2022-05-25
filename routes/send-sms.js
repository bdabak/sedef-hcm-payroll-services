const express = require("express");
const router = express.Router();
const Joi = require("joi");

const { sendSms } = require("../utils/sms");

//Only post is supported
router.post("/", async (req, res) => {
  const { error } = validateSmsRequest(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let smsResult = await sendSms(req.body.phoneNumber, req.body.smsMessage);
  if (smsResult.error) {
    return res.status(500).json(smsResult);
  } else {
    return res.json(smsResult);
  }
});

//Not supported return 405
router.get("/", async (req, res) => {
  return res.status(405).send("GET not supported!");
});

router.get("/:id", async (req, res) => {
  return res.status(405).send("GET not supported!");
});

router.put("/:id", async (req, res) => {
  return res.status(405).send("PUT not supported!");
});

function validateSmsRequest(request) {
  let schema = Joi.object({
    phoneNumber: Joi.string().required(),
    smsMessage: Joi.string().required(),
  });

  return schema.validate(request);
}

module.exports = router;
