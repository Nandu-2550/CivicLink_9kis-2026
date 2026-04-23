const mongoose = require("mongoose");

const timelineItemSchema = new mongoose.Schema(
  {
    stage: { type: String, required: true },
    note: { type: String, default: "" },
    at: { type: Date, default: Date.now }
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    step: { type: String, required: true },
    date: { type: Date, default: Date.now }
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    citizen: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        "Police",
        "School/University",
        "Municipality",
        "Consumer/Cyber",
        "Human Rights",
        "Govt Dept",
        "Traffic",
        "Pollution"
      ],
      required: true,
      index: true
    },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null }
    },
    attachmentUrl: { type: String, default: "" },
    currentStage: { type: String, required: true, default: "Submitted", index: true },
    timeline: { type: [timelineItemSchema], default: () => [{ stage: "Submitted", note: "Complaint filed" }] },
    status: {
      type: String,
      enum: ["Pending", "Under Review", "In Progress", "Resolved"],
      default: "Pending",
      index: true
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: () => [{ step: "Pending", date: new Date() }]
    },
    resolutionProof: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);
