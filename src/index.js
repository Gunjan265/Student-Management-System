import dns from "node:dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);
import "dotenv/config";
import mongoose from "mongoose";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  // For stdio MCP, write diagnostics to stderr, never stdout.
  console.error("Missing MONGODB_URI. Create a .env file from .env.example.");
  process.exit(1);
}

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, trim: true, unique: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 150 },
  department: { type: String, required: true, trim: true, maxlength: 100 },
  semester: { type: Number, required: true, min: 1, max: 12 },
  contact: { type: String, trim: true, maxlength: 25, default: "" }
}, { timestamps: true });

const Student = mongoose.model("Student", studentSchema);

const server = new McpServer({
  name: "student-management-mcp",
  version: "1.0.0"
});

const studentInput = {
  studentId: z.string().trim().min(1).max(40).describe("Unique student ID, e.g. ST101"),
  name: z.string().trim().min(1).max(100).describe("Student full name"),
  email: z.string().trim().email().max(150).describe("Student email address"),
  department: z.string().trim().min(1).max(100).describe("Department name"),
  semester: z.number().int().min(1).max(12).describe("Semester number, 1 to 12"),
  contact: z.string().trim().max(25).optional().describe("Optional contact number")
};

function publicStudent(student) {
  return {
    id: String(student._id),
    studentId: student.studentId,
    name: student.name,
    email: student.email,
    department: student.department,
    semester: student.semester,
    contact: student.contact || "",
    createdAt: student.createdAt
  };
}

function result(value) {
  return {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }]
  };
}

server.tool(
  "add_student",
  "Add a student record to the MongoDB studentDB database. Student ID must be unique.",
  studentInput,
  async (input) => {
    try {
      const student = await Student.create(input);
      return result({ success: true, message: "Student added", student: publicStudent(student) });
    } catch (error) {
      if (error?.code === 11000) {
        return result({ success: false, error: "That studentId already exists. Use a unique ID." });
      }
      if (error?.name === "ValidationError") {
        return result({ success: false, error: error.message });
      }
      throw error;
    }
  }
);

server.tool(
  "list_students",
  "List student records. Optional limit from 1 to 100; returns newest records first.",
  { limit: z.number().int().min(1).max(100).optional().default(50) },
  async ({ limit }) => {
    const students = await Student.find().sort({ createdAt: -1 }).limit(limit);
    return result({ count: students.length, students: students.map(publicStudent) });
  }
);

server.tool(
  "search_students",
  "Search students by student ID, name, email, or department using a text fragment.",
  { query: z.string().trim().min(1).max(100).describe("Text to search for") },
  async ({ query }) => {
    const safe = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(safe, "i");
    const students = await Student.find({
      $or: [
        { studentId: regex },
        { name: regex },
        { email: regex },
        { department: regex }
      ]
    }).sort({ createdAt: -1 }).limit(100);
    return result({ count: students.length, students: students.map(publicStudent) });
  }
);

server.tool(
  "update_student",
  "Update an existing student using its MongoDB record ID (the id field returned by list_students or search_students).",
  {
    id: z.string().regex(/^[a-f\d]{24}$/i).describe("MongoDB student record ID"),
    studentId: z.string().trim().min(1).max(40).optional(),
    name: z.string().trim().min(1).max(100).optional(),
    email: z.string().trim().email().max(150).optional(),
    department: z.string().trim().min(1).max(100).optional(),
    semester: z.number().int().min(1).max(12).optional(),
    contact: z.string().trim().max(25).optional()
  },
  async ({ id, ...changes }) => {
    const update = Object.fromEntries(Object.entries(changes).filter(([, value]) => value !== undefined));
    if (Object.keys(update).length === 0) {
      return result({ success: false, error: "Provide at least one field to update." });
    }
    try {
      const student = await Student.findByIdAndUpdate(id, update, {
        new: true, runValidators: true
      });
      if (!student) return result({ success: false, error: "Student not found." });
      return result({ success: true, message: "Student updated", student: publicStudent(student) });
    } catch (error) {
      if (error?.code === 11000) {
        return result({ success: false, error: "That studentId already exists." });
      }
      throw error;
    }
  }
);

server.tool(
  "delete_student",
  "Permanently delete a student record by its MongoDB record ID. Confirm with the user before calling this destructive tool.",
  { id: z.string().regex(/^[a-f\d]{24}$/i).describe("MongoDB student record ID") },
  async ({ id }) => {
    const student = await Student.findByIdAndDelete(id);
    if (!student) return result({ success: false, error: "Student not found." });
    return result({ success: true, message: "Student deleted", student: publicStudent(student) });
  }
);

async function main() {
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
  console.error("Student Management MCP: MongoDB connected.");
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Student Management MCP server is ready over stdio.");
}

main().catch(async (error) => {
  console.error("MCP server startup failed:", error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});

async function shutdown() {
  await mongoose.disconnect().catch(() => {});
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
