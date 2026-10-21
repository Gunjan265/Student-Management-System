require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// ---------- Middleware ----------
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));

// ---------- Model ----------
const studentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    semester: { type: Number, required: true, min: 1, max: 12 },
    contact: { type: String, trim: true },
  },
  { timestamps: true }
);
const Student = mongoose.model("Student", studentSchema);

// ---------- Routes ----------
app.get("/", (req, res) => {
  res.json({ message: "Student Management API is running" });
});

// Read all (optional search: /api/students?search=rahul)
app.get("/api/students", async (req, res) => {
  try {
    const { search } = req.query;
    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { studentId: { $regex: search, $options: "i" } },
            { department: { $regex: search, $options: "i" } },
          ],
        }
      : {};
    const students = await Student.find(filter).sort({ createdAt: -1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch students" });
  }
});

// Read one (by Mongo _id or studentId)
app.get("/api/students/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const student = mongoose.isValidObjectId(id)
      ? await Student.findById(id)
      : await Student.findOne({ studentId: id });
    if (!student)
      return res.status(404).json({ success: false, message: "Student not found" });
    res.json(student);
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch student" });
  }
});

// Create
app.post("/api/students", async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json({ success: true, message: "Student added successfully", student });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ success: false, message: "Student ID already exists" });
    if (err.name === "ValidationError")
      return res.status(400).json({ success: false, message: err.message });
    res.status(500).json({ success: false, message: "Failed to add student" });
  }
});

// Update
app.put("/api/students/:id", async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!student)
      return res.status(404).json({ success: false, message: "Student not found" });
    res.json({ success: true, message: "Student updated successfully", student });
  } catch (err) {
    res.status(400).json({ success: false, message: "Failed to update student" });
  }
});

// Delete
app.delete("/api/students/:id", async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student)
      return res.status(404).json({ success: false, message: "Student not found" });
    res.json({ success: true, message: "Student deleted successfully" });
  } catch (err) {
    res.status(400).json({ success: false, message: "Failed to delete student" });
  }
});

// ---------- Start ----------
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB Atlas");
    app.listen(PORT, () => console.log(`Student Management API running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Backend startup failed:", err.message);
    process.exit(1);
  });